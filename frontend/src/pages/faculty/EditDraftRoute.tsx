import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { useAuth } from "@/contexts/auth-context";
import {
  archiveNotice,
  unarchiveNotice,
  getNoticeById,
  getPublishSuccessMessage,
  publishNoticeById,
  SessionExpiredError,
  SESSION_EXPIRED_ERROR,
  updateNotice,
} from "@/lib/noticeApi";
import type { Notice } from "@/types";

import {
  GeneratedNoticeEditor,
  type GeneratedNoticeValue,
} from "./GeneratedNoticeEditor";

const LOAD_ERROR = "Couldn't load this notice.";
const SAVE_DRAFT_ERROR = "Couldn't save this draft, please try again.";
const PUBLISH_ERROR = "Couldn't publish this notice, please try again.";
const SCHEDULE_ERROR = "Couldn't schedule this notice, please try again.";
const ARCHIVE_ERROR = "Couldn't archive this notice, please try again.";
const UNARCHIVE_ERROR = "Couldn't unarchive this notice, please try again.";

export function EditDraftRoute() {
  const { noticeId } = useParams<{ noticeId: string }>();
  const navigate = useNavigate();
  const { accessToken, role } = useAuth();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [saveDraftError, setSaveDraftError] = useState<string | null>(null);
  const [saveDraftSuccess, setSaveDraftSuccess] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [archiveSuccess, setArchiveSuccess] = useState<string | null>(null);
  const [isUnarchiving, setIsUnarchiving] = useState(false);
  const [unarchiveError, setUnarchiveError] = useState<string | null>(null);
  const [unarchiveSuccess, setUnarchiveSuccess] = useState<string | null>(null);
  const publishRedirectRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const noticesPath =
    role === "ADMIN"
      ? "/admin/notices"
      : role === "HOD"
        ? "/hod/notices"
        : "/faculty/notices";
  const dashboardPath =
    role === "ADMIN" ? "/admin" : role === "HOD" ? "/hod" : "/faculty";

  useEffect(
    () => () => {
      if (publishRedirectRef.current) {
        clearTimeout(publishRedirectRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!noticeId) {
      setIsLoading(false);
      setLoadError(LOAD_ERROR);
      return;
    }

    let isCancelled = false;

    const loadNotice = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const loaded = await getNoticeById(noticeId);
        if (!isCancelled) {
          setNotice(loaded);
        }
      } catch {
        if (!isCancelled) {
          setNotice(null);
          setLoadError(LOAD_ERROR);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadNotice();

    return () => {
      isCancelled = true;
    };
  }, [noticeId]);

  const requireToken = () => {
    if (!accessToken) {
      navigate("/login");
      return null;
    }

    return accessToken;
  };

  const handleSaveDraft = async (value: GeneratedNoticeValue) => {
    const token = requireToken();
    if (!token || !noticeId) {
      setSaveDraftSuccess(null);
      setSaveDraftError(SESSION_EXPIRED_ERROR);
      return;
    }

    setSaveDraftError(null);
    setSaveDraftSuccess(null);
    setIsSavingDraft(true);

    try {
      await updateNotice(noticeId, token, {
        title: value.title,
        content: value.content,
        category: value.category,
        imageUrl: value.imageUrl,
        posterUrl: value.imageUrl,
      });
      setSaveDraftSuccess("Draft saved.");
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        setSaveDraftError(SESSION_EXPIRED_ERROR);
        navigate("/login");
        return;
      }

      setSaveDraftError(SAVE_DRAFT_ERROR);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handlePublish = async (value: GeneratedNoticeValue) => {
    const token = requireToken();
    if (!token || !noticeId) {
      setPublishSuccess(null);
      setPublishError(SESSION_EXPIRED_ERROR);
      return;
    }

    setPublishError(null);
    setPublishSuccess(null);
    setIsPublishing(true);

    try {
      await updateNotice(noticeId, token, {
        title: value.title,
        content: value.content,
        category: value.category,
        imageUrl: value.imageUrl,
        posterUrl: value.imageUrl,
      });
      const payload = await publishNoticeById(noticeId, token);
      setPublishSuccess(getPublishSuccessMessage(payload));
      publishRedirectRef.current = setTimeout(() => {
        navigate(dashboardPath);
      }, 1_200);
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        setPublishError(SESSION_EXPIRED_ERROR);
        navigate("/login");
        return;
      }

      setPublishError(PUBLISH_ERROR);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSchedule = async (value: GeneratedNoticeValue) => {
    const token = requireToken();
    if (!token || !noticeId) {
      setScheduleSuccess(null);
      setScheduleError(SESSION_EXPIRED_ERROR);
      return;
    }

    if (!value.publishAt) {
      setScheduleSuccess(null);
      setScheduleError(SCHEDULE_MISSING_ERROR);
      return;
    }

    setScheduleError(null);
    setScheduleSuccess(null);
    setIsScheduling(true);

    try {
      await updateNotice(noticeId, token, {
        title: value.title,
        content: value.content,
        category: value.category,
        expiresAt: value.expiresAt,
        imageUrl: value.imageUrl,
        posterUrl: value.imageUrl,
        publishAt: value.publishAt,
      });
      const payload = await publishNoticeById(noticeId, token, {
        expiresAt: value.expiresAt,
        publishAt: value.publishAt,
      });
      setScheduleSuccess(getPublishSuccessMessage(payload));
      publishRedirectRef.current = setTimeout(() => {
        navigate(dashboardPath);
      }, 1_200);
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        setScheduleError(SESSION_EXPIRED_ERROR);
        navigate("/login");
        return;
      }

      setScheduleError(SCHEDULE_ERROR);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleArchive = async () => {
    const token = requireToken();
    if (!token || !noticeId) {
      setArchiveSuccess(null);
      setArchiveError(SESSION_EXPIRED_ERROR);
      return;
    }

    setArchiveError(null);
    setArchiveSuccess(null);
    setIsArchiving(true);

    try {
      await archiveNotice(noticeId, token);
      setNotice((current) =>
        current ? { ...current, status: "ARCHIVED" } : current,
      );
      setArchiveSuccess("Notice archived.");
      publishRedirectRef.current = setTimeout(() => {
        navigate(noticesPath);
      }, 1_200);
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        setArchiveError(SESSION_EXPIRED_ERROR);
        navigate("/login");
        return;
      }

      setArchiveError(ARCHIVE_ERROR);
    } finally {
      setIsArchiving(false);
    }
  };

  const handleUnarchive = async () => {
    const token = requireToken();
    if (!token || !noticeId) {
      setUnarchiveSuccess(null);
      setUnarchiveError(SESSION_EXPIRED_ERROR);
      return;
    }

    setUnarchiveError(null);
    setUnarchiveSuccess(null);
    setIsUnarchiving(true);

    try {
      await unarchiveNotice(noticeId, token);
      setNotice((current) =>
        current ? { ...current, status: "PUBLISHED" } : current,
      );
      setUnarchiveSuccess("Notice unarchived.");
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        setUnarchiveError(SESSION_EXPIRED_ERROR);
        navigate("/login");
        return;
      }

      setUnarchiveError(UNARCHIVE_ERROR);
    } finally {
      setIsUnarchiving(false);
    }
  };

  if (isLoading) {
    return (
      <p className="mx-auto max-w-4xl text-sm text-slate-500">
        Loading notice...
      </p>
    );
  }

  if (loadError || !notice || !noticeId) {
    return (
      <div className="mx-auto max-w-4xl space-y-3">
        <p className="text-sm text-destructive">{loadError ?? LOAD_ERROR}</p>
        <Link
          className="inline-flex items-center gap-2 text-xs font-medium text-indigo-600 hover:text-indigo-700"
          to={noticesPath}
        >
          <ArrowLeft aria-hidden="true" className="size-3.5" />
          Back to notices
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 transition-colors hover:text-indigo-700"
        to={noticesPath}
      >
        <ArrowLeft aria-hidden="true" className="size-3.5" />
        Back to notices
      </Link>
      <GeneratedNoticeEditor
        accessToken={accessToken}
        department={notice.department}
        generatedContent={notice.content}
        generatedTitle={notice.title}
        heading={notice.status === "DRAFT" ? "Edit draft" : "Notice"}
        hideRegenerate
        initialPosterUrl={notice.posterUrl}
        isArchiving={isArchiving}
        isUnarchiving={isUnarchiving}
        isPublishing={isPublishing}
        isSavingDraft={isSavingDraft}
        isScheduling={isScheduling}
        noticeId={notice.noticeId}
        onArchive={handleArchive}
        onUnarchive={handleUnarchive}
        onPublish={handlePublish}
        onRegenerate={() => undefined}
        onSaveDraft={handleSaveDraft}
        onSchedule={handleSchedule}
        onSessionExpired={() => navigate("/login")}
        archiveError={archiveError}
        archiveSuccess={archiveSuccess}
        unarchiveError={unarchiveError}
        unarchiveSuccess={unarchiveSuccess}
        publishError={publishError}
        publishSuccess={publishSuccess}
        saveDraftError={saveDraftError}
        saveDraftSuccess={saveDraftSuccess}
        scheduleError={scheduleError}
        scheduleSuccess={scheduleSuccess}
        startEditing={notice.status === "DRAFT"}
        status={notice.status}
        suggestedCategory={notice.category}
      />
    </div>
  );
}
