import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@/contexts/auth-context";
import {
  unarchiveNotice,
  listNotices,
  listPrincipalNotices,
  publishDepartmentNotice,
  SessionExpiredError,
  SESSION_EXPIRED_ERROR,
} from "@/lib/noticeApi";
import {
  createStudent,
  listStudents,
  type CreateStudentInput,
} from "@/lib/userApi";
import type { Notice, User } from "@/types";
import type { DepartmentNotice } from "@/types/notice";

import { HodDashboard } from "../hod/HodDashboard";
import { ArchiveView } from "./ArchiveView";
import { NoticeManagement } from "./NoticeManagement";
import { UserManagement } from "./UserManagement";

export function AdminDashboardRoute() {
  return <HodDashboard />;
}

export function UserManagementRoute() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadUsers = async () => {
      if (!accessToken) {
        setLoadError(SESSION_EXPIRED_ERROR);
        navigate("/login");
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const students = await listStudents(accessToken);
        if (!isCancelled) {
          setUsers(students);
        }
      } catch (error) {
        if (isCancelled) {
          return;
        }

        if (error instanceof SessionExpiredError) {
          setLoadError(SESSION_EXPIRED_ERROR);
          navigate("/login");
          return;
        }

        setUsers([]);
        setLoadError(
          error instanceof Error ? error.message : "Couldn't load students.",
        );
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadUsers();

    return () => {
      isCancelled = true;
    };
  }, [accessToken, navigate]);

  const handleAddUser = async (input: CreateStudentInput) => {
    if (!accessToken) {
      setCreateSuccess(null);
      setCreateError(SESSION_EXPIRED_ERROR);
      navigate("/login");
      return;
    }

    setCreateError(null);
    setCreateSuccess(null);
    setIsCreating(true);

    try {
      const result = await createStudent(accessToken, input);
      setCreateSuccess(result.message);
      setUsers((current) => {
        const withoutDuplicate = current.filter(
          (user) => user.id !== result.user.id,
        );
        return [...withoutDuplicate, result.user].sort((left, right) =>
          left.name.localeCompare(right.name),
        );
      });
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        setCreateError(SESSION_EXPIRED_ERROR);
        navigate("/login");
        return;
      }

      setCreateError(
        error instanceof Error
          ? error.message
          : "Couldn't create this student, please try again.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <UserManagement
      createError={createError}
      createSuccess={createSuccess}
      isCreating={isCreating}
      isLoading={isLoading}
      loadError={loadError}
      onAddUser={(input) => {
        void handleAddUser(input);
      }}
      users={users}
    />
  );
}

export function NoticeManagementRoute() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const workspaceBase = location.pathname.startsWith("/admin")
    ? "/admin"
    : "/hod";

  const [notices, setNotices] = useState<DepartmentNotice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [publishingNoticeId, setPublishingNoticeId] = useState<string | null>(
    null,
  );
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);

  const loadNotices = useCallback(async () => {
    if (!accessToken) {
      setLoadError(SESSION_EXPIRED_ERROR);
      navigate("/login");
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const data = await listPrincipalNotices(accessToken);
      setNotices(data);
    } catch (err: unknown) {
      if (err instanceof SessionExpiredError) {
        setLoadError(SESSION_EXPIRED_ERROR);
        navigate("/login");
        return;
      }
      setNotices([]);
      setLoadError(
        err instanceof Error ? err.message : "Couldn't load notices.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, navigate]);

  useEffect(() => {
    void loadNotices();

    const handleFocus = () => {
      void loadNotices();
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadNotices]);

  const handlePublish = async (notice: DepartmentNotice) => {
    if (!accessToken) {
      setPublishSuccess(null);
      setPublishError(SESSION_EXPIRED_ERROR);
      navigate("/login");
      return;
    }

    if (!notice.target_roles || notice.target_roles.length === 0) {
      setPublishError(
        "Target audience cannot be empty. Please select at least one role before publishing.",
      );
      return;
    }

    setPublishError(null);
    setPublishSuccess(null);
    setPublishingNoticeId(notice.id);

    try {
      const updated = await publishDepartmentNotice(notice, accessToken);
      setPublishSuccess("Notice published successfully.");
      setNotices((current) =>
        current.map((n) => (n.id === updated.id ? updated : n)),
      );
    } catch (err: unknown) {
      if (err instanceof SessionExpiredError) {
        setPublishError(SESSION_EXPIRED_ERROR);
        navigate("/login");
        return;
      }
      setPublishError(
        err instanceof Error ? err.message : "Failed to publish notice.",
      );
    } finally {
      setPublishingNoticeId(null);
    }
  };

  return (
    <NoticeManagement
      createNoticePath={`${workspaceBase}/create-notice`}
      isLoading={isLoading}
      loadError={loadError}
      noticePath={(id) => `${workspaceBase}/notices/${id}`}
      notices={notices}
      onPublish={handlePublish}
      onRefresh={loadNotices}
      publishError={publishError}
      publishingNoticeId={publishingNoticeId}
      publishSuccess={publishSuccess}
    />
  );
}

export function ArchiveViewRoute() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [unarchivingNoticeId, setUnarchivingNoticeId] = useState<string | null>(
    null,
  );
  const [unarchiveError, setUnarchiveError] = useState<string | null>(null);
  const [unarchiveSuccess, setUnarchiveSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let isCancelled = false;

    const loadNotices = async () => {
      try {
        const allNotices = await listNotices(accessToken);
        if (!isCancelled) {
          setNotices(allNotices);
        }
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
  }, [accessToken]);

  const handleUnarchive = async (noticeId: string) => {
    if (!accessToken) {
      setUnarchiveSuccess(null);
      setUnarchiveError(SESSION_EXPIRED_ERROR);
      navigate("/login");
      return;
    }

    setUnarchiveError(null);
    setUnarchiveSuccess(null);
    setUnarchivingNoticeId(noticeId);

    try {
      await unarchiveNotice(noticeId, accessToken);
      setUnarchiveSuccess("Notice unarchived.");
      setNotices((current) =>
        current.map((notice) =>
          notice.noticeId === noticeId
            ? { ...notice, status: "PUBLISHED" }
            : notice,
        ),
      );
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        setUnarchiveError(SESSION_EXPIRED_ERROR);
        navigate("/login");
        return;
      }

      setUnarchiveError("Couldn't unarchive this notice, please try again.");
    } finally {
      setUnarchivingNoticeId(null);
    }
  };

  const archivedNotices = notices.filter(
    (notice) => notice.status === "ARCHIVED",
  );

  return (
    <ArchiveView
      archivedNotices={archivedNotices}
      onUnarchive={(noticeId) => {
        void handleUnarchive(noticeId);
      }}
      unarchiveError={unarchiveError}
      unarchiveSuccess={unarchiveSuccess}
      unarchivingNoticeId={unarchivingNoticeId}
    />
  );
}
