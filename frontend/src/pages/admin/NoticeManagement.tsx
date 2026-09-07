import { Archive, ArchiveRestore, FileX2, Pencil, Send } from "lucide-react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { PosterCell } from "@/components/notices/PosterCell";
import { Button } from "@/components/ui/button";
import type { Notice, NoticeStatus } from "@/types";

interface NoticeManagementProps {
  archiveError?: string | null;
  archiveSuccess?: string | null;
  archivingNoticeId?: string | null;
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

export function NoticeManagement({
  archiveError = null,
  archiveSuccess = null,
  archivingNoticeId = null,
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
}: NoticeManagementProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const workspaceBase = location.pathname.startsWith("/admin")
    ? "/admin"
    : "/hod";
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get("status")?.toUpperCase() ?? "";
  const statusFilter = isNoticeStatus(statusParam) ? statusParam : null;
  const visibleNotices = statusFilter
    ? notices.filter((notice) => notice.status === statusFilter)
    : notices;
  const heading =
    statusFilter === "DRAFT"
      ? "Draft notices"
      : statusFilter
        ? `${formatStatus(statusFilter)} notices`
        : "Notice Management";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
          Content administration
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          {heading}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-500">
          Review and manage notices across the department.
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
        aria-label="Department notices"
        className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-5xl border-collapse text-left">
            <thead className="border-b border-slate-100 bg-slate-50/80">
              <tr>
                <th className="px-5 py-3.5 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                  Notice
                </th>
                <th className="px-5 py-3.5 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                  Author ID
                </th>
                <th className="px-5 py-3.5 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                  Department
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
                  Quick Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td className="px-5 py-14 text-center text-sm text-slate-400" colSpan={7}>
                    Loading notices...
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td className="px-5 py-14 text-center text-sm text-destructive" colSpan={7}>
                    {loadError}
                  </td>
                </tr>
              ) : visibleNotices.length === 0 ? (
                <tr>
                  <td className="px-5 py-14 text-center" colSpan={7}>
                    <FileX2
                      aria-hidden="true"
                      className="mx-auto size-6 text-muted-foreground"
                    />
                    <p className="mt-3 text-sm font-medium">
                      {statusFilter === "DRAFT"
                        ? "No drafts found"
                        : "No notices found"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {statusFilter === "DRAFT"
                        ? "Saved drafts will appear here."
                        : "Department notices will appear here."}
                    </p>
                  </td>
                </tr>
              ) : (
                visibleNotices.map((notice) => (
                  <tr
                    className="cursor-pointer transition-colors hover:bg-indigo-50/40"
                    key={notice.noticeId}
                    onClick={() =>
                      navigate(`${workspaceBase}/notices/${notice.noticeId}`)
                    }
                  >
                    <td className="max-w-xs px-5 py-4">
                      <p className="truncate text-sm font-medium text-indigo-700">
                        {notice.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {notice.category.charAt(0) +
                          notice.category.slice(1).toLowerCase()}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {notice.authorId}
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {notice.department}
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
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      <time dateTime={notice.updatedAt}>
                        {dateFormatter.format(new Date(notice.updatedAt))}
                      </time>
                    </td>
                    <td className="px-5 py-4" onClick={(event) => event.stopPropagation()}>
                      {notice.status === "DRAFT" ? (
                        <div className="flex justify-end gap-1">
                          <Button asChild size="icon" variant="ghost">
                            <Link
                              aria-label={`Edit ${notice.title}`}
                              to={`${workspaceBase}/notices/${notice.noticeId}`}
                            >
                              <Pencil aria-hidden="true" className="size-4" />
                            </Link>
                          </Button>
                          <Button
                            aria-label={`Publish ${notice.title}`}
                            disabled={publishingNoticeId === notice.noticeId}
                            onClick={() => onPublish(notice.noticeId)}
                            size="icon"
                            type="button"
                            variant="ghost"
                          >
                            <Send aria-hidden="true" className="size-4" />
                          </Button>
                        </div>
                      ) : notice.status === "PUBLISHED" ||
                        notice.status === "EXPIRED" ? (
                        <div className="flex justify-end">
                          <Button
                            aria-label={`Archive ${notice.title}`}
                            disabled={archivingNoticeId === notice.noticeId}
                            onClick={() => onArchive(notice.noticeId)}
                            size="icon"
                            type="button"
                            variant="ghost"
                          >
                            <Archive aria-hidden="true" className="size-4" />
                          </Button>
                        </div>
                      ) : notice.status === "ARCHIVED" ? (
                        <div className="flex justify-end">
                          <Button
                            aria-label={`Unarchive ${notice.title}`}
                            disabled={unarchivingNoticeId === notice.noticeId}
                            onClick={() => onUnarchive(notice.noticeId)}
                            size="icon"
                            type="button"
                            variant="ghost"
                          >
                            <ArchiveRestore aria-hidden="true" className="size-4" />
                          </Button>
                        </div>
                      ) : (
                        <p className="text-right text-xs text-slate-400">—</p>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
