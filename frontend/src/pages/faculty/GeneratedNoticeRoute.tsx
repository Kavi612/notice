import { useEffect, useRef, useState } from "react";
import {
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "@/contexts/auth-context";
import { API_BASE_URL } from "@/lib/config";
import {
  getPublishSuccessMessage,
  publishNoticeById,
  SessionExpiredError,
  SESSION_EXPIRED_ERROR,
  updateNotice,
} from "@/lib/noticeApi";
import type { NoticeCategory, NoticeTemplate } from "@/types";

import {
  GeneratedNoticeEditor,
  type GeneratedNoticeValue,
} from "./GeneratedNoticeEditor";

const SAVE_DRAFT_ERROR =
  "Couldn't save this draft, please try again.";
const PUBLISH_ERROR =
  "Couldn't publish this notice, please try again.";
const SCHEDULE_ERROR =
  "Couldn't schedule this notice, please try again.";
const SAVE_BEFORE_PUBLISH_ERROR =
  "Save the draft first, then publish.";
const SAVE_BEFORE_SCHEDULE_ERROR =
  "Save the draft first, then schedule.";

export interface ExtractedNoticeFields {
  companyName?: string;
  coordinators?: { name: string; role: string }[];
  date?: string;
  eligibility?: string;
  resourcePersons?: { name?: string; designation?: string }[];
  subjects?: { subject: string; date: string; time: string }[];
  time?: string;
  venue?: string;
}

interface GeneratedNoticeRouteState {
  department?: string;
  extractedFields?: ExtractedNoticeFields;
  generatedContent: string;
  generatedTitle: string;
  imageUrl: string | null;
  simulateVisualFailure?: boolean;
  suggestedCategory: NoticeCategory;
  targetSection?: string;
  targetYear?: string;
  template?: NoticeTemplate | "";
}

interface CreatedNoticeResponse {
  id?: string;
  notice?: { noticeId?: string };
  noticeId?: string;
}

const noticeCategories: readonly NoticeCategory[] = [
  "EXAMINATION",
  "WORKSHOP",
  "SEMINAR",
  "PLACEMENT",
  "SPORTS",
  "CULTURAL",
  "GENERAL",
];

function isNoticeCategory(value: unknown): value is NoticeCategory {
  return (
    typeof value === "string" &&
    noticeCategories.some((category) => category === value)
  );
}

function isGeneratedNoticeRouteState(
  value: unknown,
): value is GeneratedNoticeRouteState {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.generatedContent === "string" &&
    typeof candidate.generatedTitle === "string" &&
    (candidate.imageUrl === null ||
      typeof candidate.imageUrl === "string") &&
    (candidate.simulateVisualFailure === undefined ||
      typeof candidate.simulateVisualFailure === "boolean") &&
    isNoticeCategory(candidate.suggestedCategory)
  );
}

function readNoticeId(payload: CreatedNoticeResponse): string | null {
  if (typeof payload.noticeId === "string" && payload.noticeId.length > 0) {
    return payload.noticeId;
  }

  if (typeof payload.id === "string" && payload.id.length > 0) {
    return payload.id;
  }

  if (
    typeof payload.notice?.noticeId === "string" &&
    payload.notice.noticeId.length > 0
  ) {
    return payload.notice.noticeId;
  }

  return null;
}

export function GeneratedNoticeRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  const { accessToken, currentUser, role } = useAuth();
  const routeState: unknown = location.state;
  const [noticeId, setNoticeId] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [saveDraftError, setSaveDraftError] = useState<string | null>(null);
  const [saveDraftSuccess, setSaveDraftSuccess] = useState<string | null>(
    null,
  );
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null);
  const publishRedirectRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const createNoticePath =
    role === "ADMIN"
      ? "/admin/create-notice"
      : role === "HOD"
        ? "/hod/create-notice"
        : "/faculty/create-notice";
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

  if (!isGeneratedNoticeRouteState(routeState)) {
    return <Navigate replace to={createNoticePath} />;
  }

  const handleRegenerate = (notice: GeneratedNoticeValue) => {
    // TEMP_ACTION_STUB: Replace with AI regeneration integration.
    console.log("Regenerate notice", notice);
  };

  const handleSaveDraft = async (notice: GeneratedNoticeValue) => {
    const authorId = currentUser?.sub || currentUser?.username || "";

    if (!accessToken || !authorId) {
      setSaveDraftSuccess(null);
      setSaveDraftError(SESSION_EXPIRED_ERROR);
      navigate("/login");
      return;
    }

    setSaveDraftError(null);
    setSaveDraftSuccess(null);
    setIsSavingDraft(true);

    try {
      if (noticeId) {
        await updateNotice(noticeId, accessToken, {
          title: notice.title,
          content: notice.content,
          category: notice.category,
          imageUrl: notice.imageUrl,
          posterUrl: notice.imageUrl,
        });
        setSaveDraftSuccess("Draft saved.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/notices`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: notice.title,
          content: notice.content,
          authorId,
          department: routeState.department?.trim() || "General",
          category: notice.category,
          targetYear: routeState.targetYear || "ALL",
          targetSection: routeState.targetSection || "ALL",
          template: routeState.template || "FORMAL_ACADEMIC",
          imageUrl: notice.imageUrl,
          posterUrl: notice.imageUrl,
        }),
      });

      if (response.status === 401) {
        setSaveDraftError(SESSION_EXPIRED_ERROR);
        navigate("/login");
        return;
      }

      if (!response.ok) {
        setSaveDraftError(SAVE_DRAFT_ERROR);
        return;
      }

      const payload = (await response.json()) as CreatedNoticeResponse;
      const createdNoticeId = readNoticeId(payload);

      if (!createdNoticeId) {
        setSaveDraftError(SAVE_DRAFT_ERROR);
        return;
      }

      setNoticeId(createdNoticeId);
      if (notice.imageUrl) {
        try {
          await updateNotice(createdNoticeId, accessToken, {
            imageUrl: notice.imageUrl,
            posterUrl: notice.imageUrl,
          });
        } catch (error) {
          if (error instanceof SessionExpiredError) {
            setSaveDraftError(SESSION_EXPIRED_ERROR);
            navigate("/login");
            return;
          }
        }
      }
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

  const handlePublish = async (notice: GeneratedNoticeValue) => {
    if (!noticeId) {
      setPublishSuccess(null);
      setPublishError(SAVE_BEFORE_PUBLISH_ERROR);
      return;
    }

    if (!accessToken) {
      setPublishSuccess(null);
      setPublishError(SESSION_EXPIRED_ERROR);
      navigate("/login");
      return;
    }

    setPublishError(null);
    setPublishSuccess(null);
    setIsPublishing(true);

    try {
      await updateNotice(noticeId, accessToken, {
        title: notice.title,
        content: notice.content,
        category: notice.category,
        imageUrl: notice.imageUrl,
        posterUrl: notice.imageUrl,
      });
      const payload = await publishNoticeById(noticeId, accessToken);
      const message = getPublishSuccessMessage(payload);
      setPublishSuccess(message);
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

  const handleSchedule = async (notice: GeneratedNoticeValue) => {
    if (!noticeId) {
      setScheduleSuccess(null);
      setScheduleError(SAVE_BEFORE_SCHEDULE_ERROR);
      return;
    }

    if (!accessToken) {
      setScheduleSuccess(null);
      setScheduleError(SESSION_EXPIRED_ERROR);
      navigate("/login");
      return;
    }

    setScheduleError(null);
    setScheduleSuccess(null);
    setIsScheduling(true);

    try {
      await updateNotice(noticeId, accessToken, {
        title: notice.title,
        content: notice.content,
        category: notice.category,
        expiresAt: notice.expiresAt,
        imageUrl: notice.imageUrl,
        posterUrl: notice.imageUrl,
        publishAt: notice.publishAt,
      });
      const payload = await publishNoticeById(noticeId, accessToken, {
        expiresAt: notice.expiresAt,
        publishAt: notice.publishAt,
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

  return (
    <GeneratedNoticeEditor
      accessToken={accessToken}
      department={routeState.department?.trim() || "General"}
      extractedFields={routeState.extractedFields}
      generatedContent={routeState.generatedContent}
      generatedTitle={routeState.generatedTitle}
      isPublishing={isPublishing}
      isSavingDraft={isSavingDraft}
      isScheduling={isScheduling}
      noticeId={noticeId}
      onPublish={handlePublish}
      onRegenerate={handleRegenerate}
      onSaveDraft={handleSaveDraft}
      onSchedule={handleSchedule}
      onSessionExpired={() => navigate("/login")}
      publishError={publishError}
      publishSuccess={publishSuccess}
      saveDraftError={saveDraftError}
      saveDraftSuccess={saveDraftSuccess}
      scheduleError={scheduleError}
      scheduleSuccess={scheduleSuccess}
      suggestedCategory={routeState.suggestedCategory}
    />
  );
}
