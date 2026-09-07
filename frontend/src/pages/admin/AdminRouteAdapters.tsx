import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/contexts/auth-context";
import {
  archiveNotice,
  unarchiveNotice,
  getPublishSuccessMessage,
  listNotices,
  publishNoticeById,
  SessionExpiredError,
  SESSION_EXPIRED_ERROR,
} from "@/lib/noticeApi";
import {
  createStudent,
  listStudents,
  type CreateStudentInput,
} from "@/lib/userApi";
import type { Notice, User } from "@/types";

import { AdminDashboard } from "./AdminDashboard";
import { ArchiveView } from "./ArchiveView";
import { NoticeManagement } from "./NoticeManagement";
import { UserManagement } from "./UserManagement";

export function AdminDashboardRoute() {
  const { currentUser } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);

  useEffect(() => {
    let isCancelled = false;

    const loadNotices = async () => {
      try {
        const allNotices = await listNotices();
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
  }, []);

  return (
    <AdminDashboard
      displayName={currentUser?.username ?? "HOD"}
      draftCount={
        notices.filter((notice) => notice.status === "DRAFT").length
      }
      expiredCount={
        notices.filter((notice) => notice.status === "EXPIRED").length
      }
      publishedCount={
        notices.filter((notice) => notice.status === "PUBLISHED").length
      }
      scheduledCount={
        notices.filter((notice) => notice.status === "SCHEDULED").length
      }
      totalNoticesCount={notices.length}
    />
  );
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
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [publishingNoticeId, setPublishingNoticeId] = useState<string | null>(
    null,
  );
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
  const [archivingNoticeId, setArchivingNoticeId] = useState<string | null>(
    null,
  );
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [archiveSuccess, setArchiveSuccess] = useState<string | null>(null);
  const [unarchivingNoticeId, setUnarchivingNoticeId] = useState<string | null>(
    null,
  );
  const [unarchiveError, setUnarchiveError] = useState<string | null>(null);
  const [unarchiveSuccess, setUnarchiveSuccess] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadNotices = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const allNotices = await listNotices();
        if (!isCancelled) {
          setNotices(allNotices);
        }
      } catch {
        if (!isCancelled) {
          setNotices([]);
          setLoadError("Couldn't load notices.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadNotices();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handlePublish = async (noticeId: string) => {
    if (!accessToken) {
      setPublishSuccess(null);
      setPublishError(SESSION_EXPIRED_ERROR);
      navigate("/login");
      return;
    }

    setPublishError(null);
    setPublishSuccess(null);
    setPublishingNoticeId(noticeId);

    try {
      const payload = await publishNoticeById(noticeId, accessToken);
      setPublishSuccess(getPublishSuccessMessage(payload));
      setNotices((current) =>
        current.map((notice) =>
          notice.noticeId === noticeId
            ? { ...notice, status: "PUBLISHED" }
            : notice,
        ),
      );
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        setPublishError(SESSION_EXPIRED_ERROR);
        navigate("/login");
        return;
      }

      setPublishError("Couldn't publish this notice, please try again.");
    } finally {
      setPublishingNoticeId(null);
    }
  };

  const handleArchive = async (noticeId: string) => {
    if (!accessToken) {
      setArchiveSuccess(null);
      setArchiveError(SESSION_EXPIRED_ERROR);
      navigate("/login");
      return;
    }

    setArchiveError(null);
    setArchiveSuccess(null);
    setArchivingNoticeId(noticeId);

    try {
      await archiveNotice(noticeId, accessToken);
      setArchiveSuccess("Notice archived.");
      setNotices((current) =>
        current.map((notice) =>
          notice.noticeId === noticeId
            ? { ...notice, status: "ARCHIVED" }
            : notice,
        ),
      );
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        setArchiveError(SESSION_EXPIRED_ERROR);
        navigate("/login");
        return;
      }

      setArchiveError("Couldn't archive this notice, please try again.");
    } finally {
      setArchivingNoticeId(null);
    }
  };

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

  return (
    <NoticeManagement
      archiveError={archiveError}
      archiveSuccess={archiveSuccess}
      archivingNoticeId={archivingNoticeId}
      isLoading={isLoading}
      loadError={loadError}
      notices={notices}
      onArchive={(noticeId) => {
        void handleArchive(noticeId);
      }}
      onUnarchive={(noticeId) => {
        void handleUnarchive(noticeId);
      }}
      onPublish={(noticeId) => {
        void handlePublish(noticeId);
      }}
      publishError={publishError}
      publishingNoticeId={publishingNoticeId}
      publishSuccess={publishSuccess}
      unarchiveError={unarchiveError}
      unarchiveSuccess={unarchiveSuccess}
      unarchivingNoticeId={unarchivingNoticeId}
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
    let isCancelled = false;

    const loadNotices = async () => {
      try {
        const allNotices = await listNotices();
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
  }, []);

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
