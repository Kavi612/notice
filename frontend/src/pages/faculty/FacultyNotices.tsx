import { Archive, ArchiveRestore, FilePenLine, FileX2, LoaderCircle, Pencil, Send } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { PosterCell } from "@/components/notices/PosterCell";
import { Button } from "@/components/ui/button";
import type { Notice, NoticeStatus } from "@/types";

interface FacultyNoticesProps {
  archiveError?: string | null;
  archiveSuccess?: string | null;
  archivingNoticeId?: string | null;
  createNoticePath: string;
  noticePath: (noticeId: string) => string;
  isLoading?: boolean;
  loadError?: string | null;
  notices: Notice[];
  onArchive: (noticeId: string) => void;
  onUnarchive: (noticeId: string) => void;
  onPublish: (noticeId: string) => void;
  publishError?: string | null;
  publishingNoticeId?: string | null;
  publishSuccess?: string | null;
  unarchiveError?: string | null;
  unarchiveSuccess?: string | null;
  unarchivingNoticeId?: string | null;
}

const statusStyles: Record<NoticeStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  SCHEDULED: "bg-violet-50 text-violet-700",
  PUBLISHED: "bg-emerald-50 text-emerald-700",
  EXPIRED: "bg-amber-50 text-amber-700",
  ARCHIVED: "bg-slate-100 text-slate-500",
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatStatus(status: NoticeStatus): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function isNoticeStatus(value: string): value is NoticeStatus {
  return value in statusStyles;
}

export function FacultyNotices({
  archiveError = null,
  archiveSuccess = null,
  archivingNoticeId = null,
  createNoticePath,
  noticePath,
  isLoading = false,
  loadError = null,
  notices,
  onArchive,
  onUnarchive,
  onPublish,
  publishError = null,
  publishingNoticeId = null,
  publishSuccess = null,
  unarchiveError = null,
  unarchiveSuccess = null,
  unarchivingNoticeId = null,
}: FacultyNoticesProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get("status")?.toUpperCase() ?? "";
  const statusFilter = isNoticeStatus(statusParam) ? statusParam : null;
  const visibleNotices = statusFilter
    ? notices.filter((notice) => notice.status === statusFilter)
    : notices;
  const isDraftsView = statusFilter === "DRAFT";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
          Faculty workspace
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          {isDraftsView ? "Draft notices" : "My notices"}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-500">
          {isDraftsView
            ? "Open a draft to edit it, then publish when it is ready."
            : "Every notice you have created, including drafts and published items."}
        </p>
      </header>

      {publishSuccess ? (
        <p className="text-sm font-medium text-emerald-700" role="status">
          {publishSuccess}
        </p>
      ) : null}
      {publishError ? (
        <p className="text-sm text-destructive" role="alert">
          {publishError}
        </p>
      ) : null}
      {archiveSuccess ? (
        <p className="text-sm font-medium text-emerald-700" role="status">
          {archiveSuccess}
        </p>
      ) : null}
      {archiveError ? (
        <p className="text-sm text-destructive" role="alert">
          {archiveError}
        </p>
      ) : null}
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
        aria-label={isDraftsView ? "Draft notices" : "My notices"}
        className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-4xl border-collapse text-left">
            <thead className="border-b border-slate-100 bg-slate-50/80">
              <tr>
                <th className="px-5 py-3.5 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                  Notice
                </th>
                <th className="px-5 py-3.5 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="px-5 py-3.5 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                  Poster
                </th>
                <th className="px-5 py-3.5 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                  Updated
                </th>
                <th className="px-5 py-3.5 text-right text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td className="px-5 py-14 text-center text-sm text-slate-400" colSpan={5}>
                    Loading notices...
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td className="px-5 py-14 text-center text-sm text-destructive" colSpan={5}>
                    {loadError}
                  </td>
                </tr>
              ) : visibleNotices.length === 0 ? (
                <tr>
                  <td className="px-5 py-16 text-center" colSpan={5}>
                    {isDraftsView ? (
                      <FilePenLine
                        aria-hidden="true"
                        className="mx-auto size-7 text-amber-500"
                      />
                    ) : (
                      <FileX2
                        aria-hidden="true"
                        className="mx-auto size-7 text-slate-300"
                      />
                    )}
                    <p className="mt-3 text-sm font-semibold text-slate-800">
                      {isDraftsView ? "No drafts yet" : "No notices found"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {isDraftsView
                        ? "Save a notice as a draft and it will show up here."
                        : "Notices you create will appear in this list."}
                    </p>
                    <Link
                      className="mt-4 inline-flex h-9 items-center rounded-lg bg-indigo-600 px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                      to={createNoticePath}
                    >
                      Create notice
                    </Link>
                  </td>
                </tr>
              ) : (
                visibleNotices.map((notice) => {
                  const canManageDraft = notice.status === "DRAFT";
                  const canArchive =
                    notice.status === "PUBLISHED" ||
                    notice.status === "EXPIRED";
                  const canUnarchive = notice.status === "ARCHIVED";
                  const isPublishing = publishingNoticeId === notice.noticeId;
                  const isArchiving = archivingNoticeId === notice.noticeId;
                  const isUnarchiving = unarchivingNoticeId === notice.noticeId;
                  const href = noticePath(notice.noticeId);

                  return (
                    <tr
                      className="cursor-pointer transition-colors hover:bg-indigo-50/40"
                      key={notice.noticeId}
                      onClick={() => navigate(href)}
                    >
                      <td className="max-w-sm px-5 py-4">
                        <p className="truncate text-sm font-semibold text-indigo-700">
                          {notice.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {notice.category.charAt(0) +
                            notice.category.slice(1).toLowerCase()}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[notice.status]}`}
                        >
                          {formatStatus(notice.status)}
                        </span>
                      </td>
                      <td className="px-5 py-4" onClick={(event) => event.stopPropagation()}>
                        <PosterCell
                          posterUrl={notice.posterUrl}
                          title={notice.title}
                        />
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500">
                        <time dateTime={notice.updatedAt}>
                          {dateFormatter.format(new Date(notice.updatedAt))}
                        </time>
                      </td>
                      <td className="px-5 py-4" onClick={(event) => event.stopPropagation()}>
                        {canManageDraft ? (
                          <div className="flex justify-end gap-2">
                            <Button asChild size="sm" variant="outline">
                              <Link to={href}>
                                <Pencil aria-hidden="true" className="size-3.5" />
                                Edit
                              </Link>
                            </Button>
                            <Button
                              disabled={isPublishing}
                              onClick={() => onPublish(notice.noticeId)}
                              size="sm"
                              type="button"
                            >
                              {isPublishing ? (
                                <LoaderCircle
                                  aria-hidden="true"
                                  className="size-3.5 animate-spin"
                                />
                              ) : (
                                <Send aria-hidden="true" className="size-3.5" />
                              )}
                              {isPublishing ? "Publishing..." : "Publish"}
                            </Button>
                          </div>
                        ) : canArchive ? (
                          <div className="flex justify-end">
                            <Button
                              disabled={isArchiving}
                              onClick={() => onArchive(notice.noticeId)}
                              size="sm"
                              type="button"
                              variant="outline"
                            >
                              {isArchiving ? (
                                <LoaderCircle
                                  aria-hidden="true"
                                  className="size-3.5 animate-spin"
                                />
                              ) : (
                                <Archive aria-hidden="true" className="size-3.5" />
                              )}
                              {isArchiving ? "Archiving..." : "Archive"}
                            </Button>
                          </div>
                        ) : canUnarchive ? (
                          <div className="flex justify-end">
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
                          </div>
                        ) : (
                          <p className="text-right text-xs text-slate-400">—</p>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
