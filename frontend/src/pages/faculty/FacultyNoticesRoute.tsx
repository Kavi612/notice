import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/contexts/auth-context";
import {
  archiveNotice,
  unarchiveNotice,
  getPublishSuccessMessage,
  listNotices,
  noticesForAuthor,
  publishNoticeById,
  SessionExpiredError,
  SESSION_EXPIRED_ERROR,
} from "@/lib/noticeApi";
import type { Notice } from "@/types";

import { FacultyNotices } from "./FacultyNotices";

export function FacultyNoticesRoute() {
  const { accessToken, currentUser } = useAuth();
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
        if (isCancelled) {
          return;
        }

        const authorIds = [currentUser?.sub ?? "", currentUser?.username ?? ""];
        setNotices(noticesForAuthor(allNotices, authorIds));
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
  }, [currentUser?.sub, currentUser?.username]);

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
    <FacultyNotices
      archiveError={archiveError}
      archiveSuccess={archiveSuccess}
      archivingNoticeId={archivingNoticeId}
      createNoticePath="/faculty/create-notice"
      noticePath={(noticeId) => `/faculty/notices/${noticeId}`}
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
