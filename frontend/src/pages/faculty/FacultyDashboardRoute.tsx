import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/auth-context";
import {
  listAuthoredNotices,
  listDepartmentNotices,
} from "@/lib/noticeApi";
import type { DepartmentNotice } from "@/types/notice";

import { FacultyDashboard } from "./FacultyDashboard";

export function FacultyDashboardRoute() {
  const { accessToken, currentUser } = useAuth();
  const [receivedNotices, setReceivedNotices] = useState<DepartmentNotice[]>([]);
  const [sentNotices, setSentNotices] = useState<DepartmentNotice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadNotices = async () => {
      if (!accessToken) {
        return;
      }
      setIsLoading(true);
      setLoadError(null);

      try {
        const [received, sent] = await Promise.all([
          listDepartmentNotices(accessToken).catch(() => []),
          listAuthoredNotices(accessToken).catch(() => []),
        ]);

        if (!isCancelled) {
          setReceivedNotices(received);
          setSentNotices(sent);
        }
      } catch {
        if (!isCancelled) {
          setLoadError("Couldn't load dashboard notices.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadNotices();

    const handleFocus = () => {
      void loadNotices();
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      isCancelled = true;
      window.removeEventListener("focus", handleFocus);
    };
  }, [accessToken]);

  if (!currentUser) {
    return null;
  }

  return (
    <FacultyDashboard
      departmentName="Department of Computer Science"
      displayName={currentUser.username}
      isLoading={isLoading}
      loadError={loadError}
      receivedNotices={receivedNotices}
      sentNotices={sentNotices}
    />
  );
}
