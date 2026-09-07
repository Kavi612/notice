import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { useAuth } from "@/contexts/auth-context";
import { getNoticeById, listNotices, markNoticeAsRead } from "@/lib/noticeApi";
import {
  isNoticeRead,
  rememberNoticeRead,
} from "@/lib/studentNoticeReads";
import type { Notice, StudentNotice } from "@/types";

import { AllNotices } from "./AllNotices";
import { NoticeDetails } from "./NoticeDetails";
import { StudentDashboard } from "./StudentDashboard";

function toStudentNotice(notice: Notice, userId: string): StudentNotice {
  return {
    ...notice,
    authorName: notice.authorId || "Faculty",
    imageUrl: notice.posterUrl,
    isAcknowledged: false,
    isRead: isNoticeRead(userId, notice.noticeId),
    requiresAcknowledgement: false,
  };
}

function useStudentNotices() {
  const { currentUser } = useAuth();
  const userId = currentUser?.sub || currentUser?.username || "";
  const [notices, setNotices] = useState<StudentNotice[]>([]);

  useEffect(() => {
    let isCancelled = false;

    const loadNotices = async () => {
      try {
        const allNotices = await listNotices();
        if (isCancelled) {
          return;
        }

        setNotices(
          allNotices
            .filter((notice) => notice.status === "PUBLISHED")
            .map((notice) => toStudentNotice(notice, userId)),
        );
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
  }, [userId]);

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
        isRead: fromList.isRead || isNoticeRead(userId, fromList.noticeId),
      });
      return;
    }

    let isCancelled = false;

    const loadNotice = async () => {
      try {
        const loaded = await getNoticeById(noticeId);
        if (!isCancelled) {
          setNotice(toStudentNotice(loaded, userId));
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
  }, [listedNotices, noticeId, userId]);

  const handleMarkAsRead = useCallback(
    (selectedNoticeId: string) => {
      rememberNoticeRead(userId, selectedNoticeId);
      setNotice((current) =>
        current && current.noticeId === selectedNoticeId
          ? { ...current, isRead: true }
          : current,
      );

      if (!userId) {
        return;
      }

      void markNoticeAsRead(selectedNoticeId, userId).catch(() => undefined);
    },
    [userId],
  );

  return (
    <NoticeDetails
      notice={notice}
      onAcknowledge={() => undefined}
      onMarkAsRead={handleMarkAsRead}
    />
  );
}
