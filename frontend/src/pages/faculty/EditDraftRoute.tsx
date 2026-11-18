import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { useAuth } from "@/contexts/auth-context";
import {
  getDepartmentNoticeById,
  publishDepartmentNotice,
  SessionExpiredError,
  SESSION_EXPIRED_ERROR,
  updateDepartmentNotice,
} from "@/lib/noticeApi";
import type { NoticeCategory } from "@/types";
import type { DepartmentNotice } from "@/types/notice";

import {
  GeneratedNoticeEditor,
  type GeneratedNoticeValue,
} from "./GeneratedNoticeEditor";

const LOAD_ERROR = "Couldn't load this notice.";
const SAVE_DRAFT_ERROR = "Couldn't save this draft, please try again.";
const PUBLISH_ERROR = "Couldn't publish this notice, please try again.";

function toNoticeCategory(cat?: string): NoticeCategory {
  const upper = (cat || "").toUpperCase();
  if (
    upper === "EXAMINATION" ||
    upper === "WORKSHOP" ||
    upper === "SEMINAR" ||
    upper === "PLACEMENT" ||
    upper === "SPORTS" ||
    upper === "CULTURAL"
  ) {
    return upper as NoticeCategory;
  }
  return "GENERAL";
}

export function EditDraftRoute() {
  const { noticeId } = useParams<{ noticeId: string }>();
  const navigate = useNavigate();
  const { accessToken, currentUser, role } = useAuth();
  const [notice, setNotice] = useState<DepartmentNotice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [saveDraftError, setSaveDraftError] = useState<string | null>(null);
  const [saveDraftSuccess, setSaveDraftSuccess] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
  const publishRedirectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const noticesPath =
    role === "ADMIN"
      ? "/admin/notices"
      : role === "HOD"
        ? "/hod/notices"
        : "/faculty/notices";

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

    if (!accessToken) {
      navigate("/login");
      return;
    }

    let isCancelled = false;

    const loadNotice = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const loaded = await getDepartmentNoticeById(noticeId, accessToken);
        if (!isCancelled) {
          setNotice(loaded);
        }
      } catch (err: unknown) {
        if (err instanceof SessionExpiredError) {
          navigate("/login");
          return;
        }
        if (!isCancelled) {
          setNotice(null);
          setLoadError(err instanceof Error ? err.message : LOAD_ERROR);
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
  }, [accessToken, navigate, noticeId]);

  const requireToken = () => {
    if (!accessToken) {
      navigate("/login");
      return null;
    }

    return accessToken;
  };

  const handleSaveDraft = async (value: GeneratedNoticeValue) => {
    const token = requireToken();
    if (!token || !noticeId || !notice) {
      setSaveDraftSuccess(null);
      setSaveDraftError(SESSION_EXPIRED_ERROR);
      return;
    }

    setSaveDraftError(null);
    setSaveDraftSuccess(null);
    setIsSavingDraft(true);

    try {
      const updated = await updateDepartmentNotice(
        noticeId,
        {
          title: value.title,
          body: value.content,
          category: value.category,
          department: notice.department,
          priority: notice.priority,
          notice_date: notice.notice_date,
          target_roles: notice.target_roles,
          status: "DRAFT",
        },
        token,
      );
      setNotice(updated);
      setSaveDraftSuccess("Draft saved.");
      publishRedirectRef.current = setTimeout(() => {
        navigate(`${noticesPath}?status=DRAFT`);
      }, 1000);
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        setSaveDraftError(SESSION_EXPIRED_ERROR);
        navigate("/login");
        return;
      }

      setSaveDraftError(
        error instanceof Error ? error.message : SAVE_DRAFT_ERROR,
      );
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handlePublish = async (value: GeneratedNoticeValue) => {
    const token = requireToken();
    if (!token || !noticeId || !notice) {
      setPublishSuccess(null);
      setPublishError(SESSION_EXPIRED_ERROR);
      return;
    }

    setPublishError(null);
    setPublishSuccess(null);
    setIsPublishing(true);

    try {
      const updated = await publishDepartmentNotice(
        {
          ...notice,
          title: value.title,
          body: value.content,
          category: value.category,
        },
        token,
      );
      setNotice(updated);
      setPublishSuccess("Notice published successfully.");
      publishRedirectRef.current = setTimeout(() => {
        navigate(`${noticesPath}?status=PUBLISHED`);
      }, 1000);
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        setPublishError(SESSION_EXPIRED_ERROR);
        navigate("/login");
        return;
      }

      setPublishError(error instanceof Error ? error.message : PUBLISH_ERROR);
    } finally {
      setIsPublishing(false);
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

  const isAuthor = Boolean(
    currentUser &&
      (currentUser.sub === notice.author_id ||
        currentUser.username === notice.author_id),
  );

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
        generatedContent={notice.body}
        generatedTitle={notice.title}
        heading={
          !isAuthor
            ? "Notice"
            : notice.status === "DRAFT"
              ? "Edit draft"
              : "Notice"
        }
        hideRegenerate
        initialPosterUrl={null}
        isPublishing={isPublishing}
        isSavingDraft={isSavingDraft}
        noticeId={notice.id}
        onPublish={handlePublish}
        onRegenerate={() => undefined}
        onSaveDraft={handleSaveDraft}
        onSchedule={handlePublish}
        onSessionExpired={() => navigate("/login")}
        publishError={publishError}
        publishSuccess={publishSuccess}
        saveDraftError={saveDraftError}
        saveDraftSuccess={saveDraftSuccess}
        startEditing={isAuthor && notice.status === "DRAFT"}
        status={isAuthor ? notice.status : "PUBLISHED"}
        suggestedCategory={toNoticeCategory(notice.category)}
      />
    </div>
  );
}
