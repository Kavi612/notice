import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/contexts/auth-context";
import {
  listPrincipalNotices,
  publishDepartmentNotice,
  SessionExpiredError,
  SESSION_EXPIRED_ERROR,
} from "@/lib/noticeApi";
import type { DepartmentNotice } from "@/types/notice";

import { FacultyNotices } from "./FacultyNotices";

export function FacultyNoticesRoute() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [notices, setNotices] = useState<DepartmentNotice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
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
      setLoadError(err instanceof Error ? err.message : "Couldn't load notices.");
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

    const rolesToPublish =
      notice.target_roles && notice.target_roles.length > 0
        ? notice.target_roles
        : (["STUDENT"] as import("@/types/notice").TargetRole[]);

    setPublishError(null);
    setPublishSuccess(null);
    setPublishingId(notice.id);

    try {
      const noticeWithRoles = { ...notice, target_roles: rolesToPublish };
      const updated = await publishDepartmentNotice(noticeWithRoles, accessToken);
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
      setPublishingId(null);
    }
  };

  return (
    <FacultyNotices
      createNoticePath="/faculty/create-notice"
      isLoading={isLoading}
      loadError={loadError}
      noticePath={(noticeId) => `/faculty/notices/${noticeId}`}
      notices={notices}
      onPublish={handlePublish}
      onRefresh={loadNotices}
      publishError={publishError}
      publishingNoticeId={publishingId}
      publishSuccess={publishSuccess}
    />
  );
}
