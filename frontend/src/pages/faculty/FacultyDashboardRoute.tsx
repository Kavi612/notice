import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/auth-context";
import { listNotices, noticesForAuthor } from "@/lib/noticeApi";
import type { Notice } from "@/types";

import { FacultyDashboard } from "./FacultyDashboard";

export function FacultyDashboardRoute() {
  const { currentUser } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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

  if (!currentUser) {
    return null;
  }

  return (
    <FacultyDashboard
      currentTime={new Date()}
      departmentName=""
      displayName={currentUser.username}
      draftCount={
        notices.filter((notice) => notice.status === "DRAFT").length
      }
      isLoading={isLoading}
      loadError={loadError}
      myNoticesCount={notices.length}
      notices={notices}
    />
  );
}
