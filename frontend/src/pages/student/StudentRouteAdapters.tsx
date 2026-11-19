import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { useAuth } from "@/contexts/auth-context";
import {
  getDepartmentNoticeById,
  listDepartmentNotices,
  markNoticeAsRead,
} from "@/lib/noticeApi";
import {
  isNoticeRead,
  rememberNoticeRead,
} from "@/lib/studentNoticeReads";
import type { NoticeCategory, StudentNotice } from "@/types";
import type { DepartmentNotice } from "@/types/notice";

import { AllNotices } from "./AllNotices";
import { NoticeDetails } from "./NoticeDetails";
import { StudentDashboard } from "./StudentDashboard";

function toStudentNoticeFromDept(
  n: DepartmentNotice,
  isRead: boolean,
): StudentNotice {
  return {
    noticeId: n.id,
    title: n.title,
    content: n.body,
    authorId: n.author_id,
    department: n.department || "All Departments",
    category: (n.category || "GENERAL") as NoticeCategory,
    targetYear: null,
    targetSection: null,
    publishAt: n.notice_date || n.created_at,
    expiresAt: null,
    status: "PUBLISHED",
    template: null,
    createdAt: n.created_at || new Date().toISOString(),
    updatedAt: n.updated_at || new Date().toISOString(),
    posterUrl: null,
    authorName:
      n.author_name ||
      (n.author_role === "HOD"
        ? "Head of Department"
        : n.author_role === "FACULTY"
          ? "Faculty In-charge"
          : "Office of the Principal"),
    imageUrl: null,
    isAcknowledged: false,
    isRead,
    requiresAcknowledgement: false,
  };
}

function useStudentNotices() {
  const { accessToken, currentUser } = useAuth();
  const userId = currentUser?.sub || currentUser?.username || "";
  const [notices, setNotices] = useState<StudentNotice[]>([]);

  useEffect(() => {
    let isCancelled = false;

    const loadNotices = async () => {
      if (!accessToken) {
        return;
      }

      try {
        const deptNotices = await listDepartmentNotices(accessToken);
        if (isCancelled) {
          return;
        }

        let readIds = new Set<string>();
        try {
          const raw = localStorage.getItem("notice_read_ids_student");
          if (raw) {
            readIds = new Set(JSON.parse(raw));
          }
        } catch {
          // ignore
        }

        const mapped: StudentNotice[] = deptNotices.map((n) =>
          toStudentNoticeFromDept(
            n,
            readIds.has(n.id) || isNoticeRead(userId, n.id),
          ),
        );

        setNotices(mapped);
      } catch {
        if (!isCancelled) {
          setNotices([]);
        }
      }
    };

    void loadNotices();

    return () => {
      isCancelled = true;
    };
  }, [accessToken, userId]);

  return { notices, userId };
}

export function StudentDashboardRoute() {
  const { currentUser } = useAuth();
  const { notices } = useStudentNotices();

  if (!currentUser) {
    return null;
  }

  const unreadCount = notices.filter((notice) => !notice.isRead).length;

  return (
    <StudentDashboard
      currentTime={new Date()}
      departmentName=""
      displayName={currentUser.username}
      newNoticesCount={unreadCount}
      notices={notices}
      unreadCount={unreadCount}
    />
  );
}

export function AllNoticesRoute() {
  const { notices } = useStudentNotices();

  return <AllNotices notices={notices} />;
}

export function NoticeDetailsRoute() {
  const { accessToken } = useAuth();
  const { noticeId } = useParams<{ noticeId: string }>();
  const { notices: listedNotices, userId } = useStudentNotices();
  const [notice, setNotice] = useState<StudentNotice | null>(null);

  useEffect(() => {
    if (!noticeId) {
      setNotice(null);
      return;
    }

    const fromList = listedNotices.find(
      (candidate) => candidate.noticeId === noticeId,
    );
    if (fromList) {
      setNotice({
        ...fromList,
        isRead: true,
      });
      return;
    }

    let isCancelled = false;

    const loadNotice = async () => {
      if (!accessToken) {
        return;
      }
      try {
        const loaded = await getDepartmentNoticeById(noticeId, accessToken);
        if (!isCancelled) {
          setNotice(toStudentNoticeFromDept(loaded, true));
        }
      } catch {
        if (!isCancelled) {
          setNotice(null);
        }
      }
    };

    void loadNotice();

    return () => {
      isCancelled = true;
    };
  }, [accessToken, listedNotices, noticeId, userId]);

  const handleMarkAsRead = useCallback(
    (selectedNoticeId: string) => {
      rememberNoticeRead(userId, selectedNoticeId);
      setNotice((current) =>
        current && current.noticeId === selectedNoticeId
          ? { ...current, isRead: true }
          : current,
      );

      if (!userId || !accessToken) {
        return;
      }

      void markNoticeAsRead(selectedNoticeId, userId, accessToken).catch(
        () => undefined,
      );
    },
    [accessToken, userId],
  );

  return (
    <NoticeDetails
      notice={notice}
      onAcknowledge={() => undefined}
      onMarkAsRead={handleMarkAsRead}
    />
  );
}
