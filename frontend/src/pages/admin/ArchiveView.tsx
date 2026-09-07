import { Archive, ArchiveRestore, LoaderCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import type { Notice } from "@/types";

interface ArchiveViewProps {
  archivedNotices: Notice[];
  onUnarchive?: (noticeId: string) => void;
  unarchiveError?: string | null;
  unarchiveSuccess?: string | null;
  unarchivingNoticeId?: string | null;
}

const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function ArchiveView({
  archivedNotices,
  onUnarchive,
  unarchiveError = null,
  unarchiveSuccess = null,
  unarchivingNoticeId = null,
}: ArchiveViewProps) {
  const location = useLocation();
  const workspaceBase = location.pathname.startsWith("/admin")
    ? "/admin"
    : "/hod";
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <header>
        <p className="text-sm font-medium text-primary">
          Historical records
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Notice Archive
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Review archived department notices, or unarchive one to publish it
          again.
        </p>
      </header>

      {unarchiveSuccess ? (
        <p className="text-sm font-medium text-emerald-700" role="status">
          {unarchiveSuccess}
        </p>
      ) : null}
      {unarchiveError ? (
        <p className="text-sm text-destructive" role="alert">
          {unarchiveError}
        </p>
      ) : null}

      <section
        aria-label="Archived notices"
        className="overflow-hidden rounded-lg border bg-card shadow-sm"
      >
        {archivedNotices.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <Archive aria-hidden="true" className="size-5" />
            </span>
            <p className="mt-4 text-sm font-medium">
              No archived notices found
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Archived department notices will appear here.
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {archivedNotices.map((notice) => {
              const isUnarchiving = unarchivingNoticeId === notice.noticeId;

              return (
                <li
                  className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                  key={notice.noticeId}
                >
                  <Link
                    className="min-w-0 transition-colors hover:text-indigo-700"
                    to={`${workspaceBase}/notices/${notice.noticeId}`}
                  >
                    <p className="truncate text-sm font-medium text-indigo-700">
                      {notice.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {notice.department} · Author ID {notice.authorId}
                    </p>
                  </Link>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                      {notice.category.charAt(0) +
                        notice.category.slice(1).toLowerCase()}
                    </span>
                    <time
                      className="text-xs text-muted-foreground"
                      dateTime={notice.updatedAt}
                    >
                      {dateFormatter.format(new Date(notice.updatedAt))}
                    </time>
                    {onUnarchive ? (
                      <Button
                        disabled={isUnarchiving}
                        onClick={() => onUnarchive(notice.noticeId)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        {isUnarchiving ? (
                          <LoaderCircle
                            aria-hidden="true"
                            className="size-3.5 animate-spin"
                          />
                        ) : (
                          <ArchiveRestore
                            aria-hidden="true"
                            className="size-3.5"
                          />
                        )}
                        {isUnarchiving ? "Unarchiving..." : "Unarchive"}
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
