import { useEffect, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  FileX2,
  Inbox,
  LoaderCircle,
  Users,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { NoticeCanvasDownload } from "@/components/NoticeCanvasDownload";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { listDepartmentNotices, SESSION_EXPIRED_ERROR } from "@/lib/noticeApi";
import { cn } from "@/lib/utils";
import type { DepartmentNotice, TargetRole } from "@/types/notice";

interface RoleInboxProps {
  role: "HOD" | "FACULTY" | "STUDENT";
  title: string;
  description: string;
}

const audienceBadgeStyles: Record<TargetRole, string> = {
  HOD: "bg-indigo-50 text-indigo-700 border-indigo-200",
  FACULTY: "bg-blue-50 text-blue-700 border-blue-200",
  STUDENT: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function RoleInbox({ role, title, description }: RoleInboxProps) {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [notices, setNotices] = useState<DepartmentNotice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Unread tracking via localStorage key: notice_read_ids_<role>
  const storageKey = `notice_read_ids_${role.toLowerCase()}`;
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? new Set(JSON.parse(raw)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  // Selected notice for detail view modal
  const [selectedNotice, setSelectedNotice] = useState<DepartmentNotice | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadInbox = async () => {
      if (!accessToken) {
        setLoadError(SESSION_EXPIRED_ERROR);
        navigate("/login");
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const data = await listDepartmentNotices(accessToken);
        if (!isCancelled) {
          setNotices(data);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          setLoadError(err instanceof Error ? err.message : "Failed to load notices.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadInbox();

    return () => {
      isCancelled = true;
    };
  }, [accessToken, navigate]);

  const handleOpenNotice = (notice: DepartmentNotice) => {
    setSelectedNotice(notice);

    if (!readIds.has(notice.id)) {
      const updated = new Set(readIds);
      updated.add(notice.id);
      setReadIds(updated);
      try {
        localStorage.setItem(storageKey, JSON.stringify(Array.from(updated)));
      } catch {
        // ignore localStorage write errors
      }
    }
  };

  const unreadCount = notices.filter((n) => !readIds.has(n.id)).length;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Inbox className="size-4" />
            </span>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
              Official Inbox
            </p>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            {title}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-xl border border-indigo-100 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-soft">
            Total: <span className="text-indigo-600">{notices.length}</span>
          </span>
          {unreadCount > 0 && (
            <span className="rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700 shadow-soft">
              Unread: {unreadCount}
            </span>
          )}
        </div>
      </header>

      {loadError && (
        <div
          className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive"
          role="alert"
        >
          <AlertCircle className="size-4 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {/* Notices Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/75">
                <th className="px-5 py-3.5 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="px-5 py-3.5 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                  Notice Details
                </th>
                {role !== "STUDENT" && (
                  <th className="px-5 py-3.5 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                    Sender Role
                  </th>
                )}
                {role !== "STUDENT" ? (
                  <th className="px-5 py-3.5 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                    Audience
                  </th>
                ) : (
                  <th className="px-5 py-3.5 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                    Category
                  </th>
                )}
                <th className="px-5 py-3.5 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                  Date
                </th>
                <th className="px-5 py-3.5 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500 text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td className="px-5 py-14 text-center text-sm text-slate-400" colSpan={role !== "STUDENT" ? 6 : 5}>
                    <LoaderCircle className="mx-auto size-6 animate-spin text-indigo-600 mb-2" />
                    Loading inbox notices...
                  </td>
                </tr>
              ) : notices.length === 0 ? (
                <tr>
                  <td className="px-5 py-16 text-center" colSpan={role !== "STUDENT" ? 6 : 5}>
                    <FileX2 className="mx-auto size-8 text-slate-300" />
                    <p className="mt-3 text-sm font-semibold text-slate-800">
                      Inbox is empty
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      No published notices have been addressed to your role yet.
                    </p>
                  </td>
                </tr>
              ) : (
                notices.map((notice) => {
                  const isUnread = !readIds.has(notice.id);

                  return (
                    <tr
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-indigo-50/40",
                        isUnread ? "bg-indigo-50/20" : "",
                      )}
                      key={notice.id}
                      onClick={() => handleOpenNotice(notice)}
                    >
                      <td className="px-5 py-4 whitespace-nowrap">
                        {isUnread ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[0.65rem] font-bold text-indigo-700">
                            <span className="size-1.5 rounded-full bg-indigo-600" />
                            New
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[0.65rem] font-medium text-slate-400">
                            <CheckCircle2 className="size-3 text-slate-400" />
                            Read
                          </span>
                        )}
                      </td>

                      <td className="max-w-md px-5 py-4">
                        <p
                          className={cn(
                            "truncate text-sm",
                            isUnread
                              ? "font-bold text-indigo-950"
                              : "font-semibold text-slate-800",
                          )}
                        >
                          {notice.title}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {notice.body}
                        </p>
                      </td>

                      {role !== "STUDENT" && (
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 text-[0.65rem] font-semibold text-violet-700">
                            {notice.author_role || "PRINCIPAL"}
                          </span>
                        </td>
                      )}

                      {role !== "STUDENT" ? (
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {notice.target_roles && notice.target_roles.length > 0 ? (
                              notice.target_roles.map((targetRole) => (
                                <span
                                  className={cn(
                                    "rounded-md border px-2 py-0.5 text-[0.65rem] font-semibold",
                                    audienceBadgeStyles[targetRole] ||
                                      "bg-slate-50 text-slate-700",
                                  )}
                                  key={targetRole}
                                >
                                  {targetRole}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400">All</span>
                            )}
                          </div>
                        </td>
                      ) : (
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="rounded-md border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[0.65rem] font-bold text-indigo-700 uppercase tracking-wider">
                            {notice.category}
                          </span>
                        </td>
                      )}

                      <td className="px-5 py-4 text-xs text-slate-600 whitespace-nowrap">
                        {dateFormatter.format(
                          new Date(notice.notice_date || notice.created_at),
                        )}
                      </td>

                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <Button
                          className="h-8 px-3 text-xs bg-indigo-600 text-white hover:bg-indigo-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenNotice(notice);
                          }}
                          size="sm"
                          type="button"
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notice Detail Modal */}
      {selectedNotice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          onClick={() => setSelectedNotice(null)}
          role="dialog"
        >
          <div
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="rounded-md border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[0.65rem] font-bold text-indigo-700 uppercase tracking-wider">
                  {selectedNotice.category}
                </span>
                <h2 className="mt-2 text-xl font-bold text-slate-950">
                  {selectedNotice.title}
                </h2>
                {role !== "STUDENT" ? (
                  <p className="mt-1 text-xs text-slate-500">
                    From: {selectedNotice.author_name || "Office of the Principal"}{" "}
                    ({selectedNotice.author_role || "PRINCIPAL"}) · {selectedNotice.department}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedNotice.department}
                  </p>
                )}
              </div>

              <button
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                onClick={() => setSelectedNotice(null)}
                type="button"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Metadata bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center gap-1.5">
                <Calendar className="size-3.5 text-indigo-600" />
                <span>
                  Date:{" "}
                  {dateFormatter.format(
                    new Date(selectedNotice.notice_date || selectedNotice.created_at),
                  )}
                </span>
              </div>

              {role !== "STUDENT" && (
                <div className="flex items-center gap-1.5">
                  <Users className="size-3.5 text-indigo-600" />
                  <span>Audience:</span>
                  {selectedNotice.target_roles?.map((tr) => (
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[0.65rem] font-semibold border",
                        audienceBadgeStyles[tr] || "bg-white text-slate-700",
                      )}
                      key={tr}
                    >
                      {tr}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Body */}
            <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed py-2">
              {selectedNotice.body}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <NoticeCanvasDownload
                body={selectedNotice.body}
                category={selectedNotice.category}
                department={selectedNotice.department}
                noticeDate={selectedNotice.notice_date}
                title={selectedNotice.title}
              />
              <Button
                onClick={() => setSelectedNotice(null)}
                type="button"
                variant="outline"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function HodInbox() {
  return (
    <RoleInbox
      description="Official institutional notices and departmental directives addressed to Heads of Department."
      role="HOD"
      title="HOD Inbox"
    />
  );
}

export function FacultyInbox() {
  return (
    <RoleInbox
      description="Official executive circulars and academic notifications addressed to faculty members."
      role="FACULTY"
      title="Faculty Inbox"
    />
  );
}

export function StudentInbox() {
  return (
    <RoleInbox
      description="Official academic notices, exam circulars, and announcements published for students."
      role="STUDENT"
      title="Student Inbox"
    />
  );
}
