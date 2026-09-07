import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@/contexts/auth-context";
import {
  getPublishSuccessMessage,
  publishNoticeById,
  SessionExpiredError,
  SESSION_EXPIRED_ERROR,
} from "@/lib/noticeApi";
import type { NoticeCategory } from "@/types";

import {
  NoticePreviewScheduler,
  type NoticePublicationValue,
} from "./NoticePreviewScheduler";

const PUBLISH_ERROR =
  "Couldn't publish this notice, please try again.";
const SAVE_BEFORE_PUBLISH_ERROR =
  "Save the draft first, then publish.";

interface NoticePreviewRouteState {
  category: NoticeCategory;
  content: string;
  imageUrl: string | null;
  noticeId?: string | null;
  title: string;
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

function isNoticePreviewRouteState(
  value: unknown,
): value is NoticePreviewRouteState {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.title === "string" &&
    typeof candidate.content === "string" &&
    isNoticeCategory(candidate.category) &&
    (candidate.imageUrl === null ||
      typeof candidate.imageUrl === "string")
  );
}

export function NoticePreviewRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  const { accessToken, role } = useAuth();
  const routeState: unknown = location.state;
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
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

  if (!isNoticePreviewRouteState(routeState)) {
    return <Navigate replace to={createNoticePath} />;
  }

  const handleSaveDraft = (notice: NoticePublicationValue) => {
    // TEMP_ACTION_STUB: Replace with draft persistence integration.
    console.log("Save notice draft", notice);
  };

  const handleSchedule = (notice: NoticePublicationValue) => {
    // TEMP_ACTION_STUB: Replace with scheduling integration.
    console.log("Schedule notice", notice);
  };

  const handlePublish = async () => {
    const noticeId = routeState.noticeId;

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

  return (
    <NoticePreviewScheduler
      category={routeState.category}
      content={routeState.content}
      imageUrl={routeState.imageUrl}
      isPublishing={isPublishing}
      onPublish={handlePublish}
      onSaveDraft={handleSaveDraft}
      onSchedule={handleSchedule}
      publishError={publishError}
      publishSuccess={publishSuccess}
      title={routeState.title}
    />
  );
}
