import {
  AlertCircle,
  CheckCircle2,
  FilePenLine,
  FileX2,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Send,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DepartmentNotice, TargetRole } from "@/types/notice";

interface FacultyNoticesProps {
  createNoticePath: string;
  noticePath: (noticeId: string) => string;
  isLoading?: boolean;
  loadError?: string | null;
  notices: DepartmentNotice[];
  onRefresh: () => void;
  onPublish: (notice: DepartmentNotice) => void | Promise<void>;
  publishError?: string | null;
  publishingNoticeId?: string | null;
  publishSuccess?: string | null;
}

const audienceBadgeStyles: Record<TargetRole, string> = {
  HOD: "bg-indigo-50 text-indigo-700 border-indigo-200",
  FACULTY: "bg-blue-50 text-blue-700 border-blue-200",
  STUDENT: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const statusStyles: Record<string, string> = {
  DRAFT: "bg-amber-50 text-amber-700 border-amber-200",
  PUBLISHED: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function FacultyNotices({
  createNoticePath,
  noticePath,
  isLoading = false,
  loadError = null,
  notices,
  onRefresh,
  onPublish,
  publishError = null,
  publishingNoticeId = null,
  publishSuccess = null,
}: FacultyNoticesProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get("status")?.toUpperCase() ?? "";
  const isDraftsView = statusParam === "DRAFT";
  const isPublishedView = statusParam === "PUBLISHED";

  const draftNotices = notices.filter((n) => n.status === "DRAFT");
  const publishedNotices = notices.filter((n) => n.status === "PUBLISHED");

  const visibleNotices = isDraftsView
    ? draftNotices
    : isPublishedView
      ? publishedNotices
      : notices;

  const heading = isDraftsView
    ? "Draft notices"
    : isPublishedView
      ? "Published notices"
      : "My notices";

  const subtitle = isDraftsView
    ? "Open a draft to edit it, then publish when it is ready."
    : isPublishedView
      ? "Notices you have published and dispatched to target audiences."
      : "Every notice you have created, including drafts and published items.";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
            Faculty workspace
          </p>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              {heading}
            </h1>
            <Button
              aria-label="Refresh notices"
              className="size-8 text-slate-500 hover:text-slate-900"
              disabled={isLoading}
              onClick={onRefresh}
              size="icon"
              type="button"
              variant="ghost"
            >
              <RefreshCw
                aria-hidden="true"
                className={cn("size-4", isLoading && "animate-spin")}
              />
            </Button>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-slate-500">
            {subtitle}
          </p>
        </div>

        <Link to={createNoticePath}>
          <Button className="bg-indigo-600 text-white hover:bg-indigo-700">
            <Plus className="mr-1.5 size-4" />
            Create Notice
          </Button>
        </Link>
      </header>

      {publishSuccess ? (
        <div
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-700"
          role="status"
        >
          <CheckCircle2 aria-hidden="true" className="size-4 shrink-0" />
          <span>{publishSuccess}</span>
        </div>
      ) : null}

      {publishError ? (
        <div
          className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive"
          role="alert"
        >
          <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
          <span>{publishError}</span>
        </div>
      ) : null}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <Link
          className={cn(
            "pb-3 text-xs font-semibold border-b-2 transition-colors",
            !isDraftsView && !isPublishedView
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800",
          )}
          to="/faculty/notices"
        >
          All Notices ({notices.length})
        </Link>
        <Link
          className={cn(
            "pb-3 text-xs font-semibold border-b-2 transition-colors",
            isDraftsView
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800",
          )}
          to="/faculty/notices?status=DRAFT"
        >
          Drafts ({draftNotices.length})
        </Link>
        <Link
          className={cn(
            "pb-3 text-xs font-semibold border-b-2 transition-colors",
            isPublishedView
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800",
          )}
          to="/faculty/notices?status=PUBLISHED"
        >
          Published ({publishedNotices.length})
        </Link>
      </div>

      <section
        aria-label={heading}
        className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-4xl border-collapse text-left">
            <thead className="border-b border-slate-100 bg-slate-50/80">
              <tr>
                <th className="px-5 py-3.5 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                  Notice Title & Category
                </th>
                <th className="px-5 py-3.5 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                  Target Audience
                </th>
                <th className="px-5 py-3.5 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                  Notice Date
                </th>
                <th className="px-5 py-3.5 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                  Status
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
                      {isDraftsView
                        ? "No drafts saved yet."
                        : isPublishedView
                          ? "No published notices yet."
                          : "No notices found"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {isDraftsView
                        ? "Save a notice as a draft and it will show up here."
                        : isPublishedView
                          ? "Published notices will appear here."
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
                  const isDraft = notice.status === "DRAFT";
                  const isPublishing = publishingNoticeId === notice.id;
                  const href = noticePath(notice.id);

                  return (
                    <tr
                      className="cursor-pointer transition-colors hover:bg-indigo-50/40"
                      key={notice.id}
                      onClick={() => navigate(href)}
                    >
                      <td className="max-w-sm px-5 py-4">
                        <p className="truncate text-sm font-semibold text-indigo-700">
                          {notice.title}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {notice.category} · {notice.department}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {notice.target_roles && notice.target_roles.length > 0 ? (
                            notice.target_roles.map((role) => (
                              <span
                                className={cn(
                                  "rounded-md border px-2 py-0.5 text-[0.65rem] font-semibold",
                                  audienceBadgeStyles[role] || "bg-slate-50 text-slate-700 border-slate-200",
                                )}
                                key={role}
                              >
                                {role}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">All</span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-600 whitespace-nowrap">
                        {dateFormatter.format(
                          new Date(notice.notice_date || notice.created_at),
                        )}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-xs font-semibold",
                            statusStyles[notice.status] || "bg-slate-100 text-slate-700 border-slate-200",
                          )}
                        >
                          {notice.status}
                        </span>
                      </td>

                      <td
                        className="px-5 py-4 text-right"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {isDraft ? (
                          <div className="flex justify-end gap-2">
                            <Button asChild size="sm" variant="outline">
                              <Link to={href}>
                                <Pencil aria-hidden="true" className="size-3.5" />
                                Edit
                              </Link>
                            </Button>
                            <Button
                              className="bg-indigo-600 text-white hover:bg-indigo-700"
                              disabled={isPublishing}
                              onClick={() => void onPublish(notice)}
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
