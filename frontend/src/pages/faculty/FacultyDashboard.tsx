import {
  FilePenLine,
  Inbox,
  LoaderCircle,
  Plus,
  Send,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DepartmentNotice } from "@/types/notice";

interface FacultyDashboardProps {
  displayName: string;
  departmentName?: string;
  receivedNotices: DepartmentNotice[];
  sentNotices: DepartmentNotice[];
  isLoading?: boolean;
  loadError?: string | null;
}

const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function FacultyDashboard({
  displayName,
  departmentName = "Department of Computer Science",
  receivedNotices,
  sentNotices,
  isLoading = false,
  loadError = null,
}: FacultyDashboardProps) {
  const draftCount = sentNotices.filter((n) => n.status === "DRAFT").length;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Header */}
      <header className="relative overflow-hidden rounded-2xl border border-indigo-100/80 bg-white/80 px-6 py-6 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
          Welcome back, {displayName}
        </p>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Faculty Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {departmentName} · Review incoming circulars and dispatch student announcements.
            </p>
          </div>
          <Link to="/faculty/create-notice">
            <Button className="bg-indigo-600 text-white hover:bg-indigo-700">
              <Plus className="mr-1.5 size-4" />
              Create Notice
            </Button>
          </Link>
        </div>
      </header>

      {/* Analytics Summary */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Link
          className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft transition-all hover:border-indigo-200 hover:shadow-md"
          to="/faculty/inbox"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Inbox className="size-5" />
            </span>
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
                Received Notices
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {isLoading ? "-" : receivedNotices.length}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">Notices addressed to Faculty</p>
        </Link>

        <Link
          className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft transition-all hover:border-indigo-200 hover:shadow-md"
          to="/faculty/notices"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Send className="size-5" />
            </span>
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
                Sent Notices
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {isLoading ? "-" : sentNotices.length}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">Notices created by you</p>
        </Link>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <FilePenLine className="size-5" />
            </span>
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
                Drafts
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {isLoading ? "-" : draftCount}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">Unpublished authored drafts</p>
        </div>
      </section>

      {/* Received and Sent Sections Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Received Notices */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Inbox className="size-4" />
              </span>
              <h2 className="text-sm font-semibold text-slate-900">
                Received Notices (Inbox)
              </h2>
            </div>
            <Link
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              to="/faculty/inbox"
            >
              View All ({receivedNotices.length})
            </Link>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <LoaderCircle className="mx-auto mb-2 size-5 animate-spin text-indigo-600" />
              Loading received notices...
            </div>
          ) : loadError ? (
            <p className="py-8 text-center text-xs text-destructive">{loadError}</p>
          ) : receivedNotices.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">
              No received notices in inbox.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {receivedNotices.slice(0, 5).map((notice) => (
                <div className="py-3" key={notice.id}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-semibold text-slate-800">
                      {notice.title}
                    </p>
                    <span className="shrink-0 rounded-md border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-[0.65rem] font-semibold text-violet-700">
                      {notice.author_role || "PRINCIPAL"}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[0.7rem] text-slate-400">
                    <span>{notice.category} · {notice.department}</span>
                    <span>{dateFormatter.format(new Date(notice.notice_date || notice.created_at))}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Sent Notices */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Send className="size-4" />
              </span>
              <h2 className="text-sm font-semibold text-slate-900">
                Sent Notices (Authored)
              </h2>
            </div>
            <Link
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              to="/faculty/create-notice"
            >
              + Create New
            </Link>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <LoaderCircle className="mx-auto mb-2 size-5 animate-spin text-indigo-600" />
              Loading authored notices...
            </div>
          ) : sentNotices.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              You haven&apos;t created any notices yet.
              <div className="mt-3">
                <Link to="/faculty/create-notice">
                  <Button size="sm" variant="outline">
                    Create your first course notice
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {sentNotices.slice(0, 5).map((notice) => (
                <div className="py-3" key={notice.id}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-semibold text-slate-800">
                      {notice.title}
                    </p>
                    <span
                      className={cn(
                        "shrink-0 rounded-md border px-1.5 py-0.5 text-[0.65rem] font-semibold",
                        notice.status === "PUBLISHED"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-100 text-slate-600",
                      )}
                    >
                      {notice.status}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[0.7rem] text-slate-400">
                    <span className="flex gap-1">
                      Target:{" "}
                      {notice.target_roles?.map((tr) => (
                        <span className="font-semibold text-slate-600" key={tr}>
                          {tr}
                        </span>
                      ))}
                    </span>
                    <span>{dateFormatter.format(new Date(notice.notice_date || notice.created_at))}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
