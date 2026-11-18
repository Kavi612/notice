import { useEffect, useState } from "react";
import {
  AlertCircle,
  FilePenLine,
  FileX2,
  LoaderCircle,
  Plus,
  Send,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import {
  listPrincipalNotices,
  publishDepartmentNotice,
  SESSION_EXPIRED_ERROR,
} from "@/lib/noticeApi";
import { cn } from "@/lib/utils";
import type { DepartmentNotice, TargetRole } from "@/types/notice";

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

export function PrincipalNotices() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [notices, setNotices] = useState<DepartmentNotice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  const statusParam = searchParams.get("status")?.toUpperCase() ?? "";
  const isDraftsView = statusParam === "DRAFT";

  const handlePublish = async (notice: DepartmentNotice) => {
    setPublishError(null);

    if (!notice.target_roles || notice.target_roles.length === 0) {
      setPublishError(
        "Target audience cannot be empty. Please select at least one role before publishing.",
      );
      return;
    }

    if (!accessToken) {
      setPublishError(SESSION_EXPIRED_ERROR);
      navigate("/login");
      return;
    }

    setPublishingId(notice.id);

    try {
      const updated = await publishDepartmentNotice(notice, accessToken);
      setNotices((prev) =>
        prev.map((n) => (n.id === updated.id ? updated : n)),
      );
    } catch (err: unknown) {
      setPublishError(
        err instanceof Error ? err.message : "Failed to publish notice.",
      );
    } finally {
      setPublishingId(null);
    }
  };

  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      if (!accessToken) {
        setLoadError(SESSION_EXPIRED_ERROR);
        navigate("/login");
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const data = await listPrincipalNotices(accessToken);
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

    void loadData();

    return () => {
      isCancelled = true;
    };
  }, [accessToken, navigate]);

  const visibleNotices = isDraftsView
    ? notices.filter((n) => n.status === "DRAFT")
    : notices;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
            Executive Governance
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            {isDraftsView ? "Draft Notices" : "My Notices"}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-500">
            {isDraftsView
              ? "All saved drafts authored by the Principal awaiting final publication."
              : "Every institutional circular and departmental notice created by the Office of the Principal."}
          </p>
        </div>

        <Link to="/principal/create-notice">
          <Button className="bg-indigo-600 text-white hover:bg-indigo-700">
            <Plus className="size-4" />
            Create Notice
          </Button>
        </Link>
      </header>

      {publishError && (
        <div
          className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive"
          role="alert"
        >
          <AlertCircle className="size-4 shrink-0" />
          <span>{publishError}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <Link
          className={cn(
            "pb-3 text-xs font-semibold border-b-2 transition-colors",
            !isDraftsView
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800",
          )}
          to="/principal/notices"
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
          to="/principal/notices?status=DRAFT"
        >
          Drafts ({notices.filter((n) => n.status === "DRAFT").length})
        </Link>
      </div>

      {/* Notices Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/75">
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td className="px-5 py-14 text-center text-sm text-slate-400" colSpan={4}>
                    Loading notices...
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td className="px-5 py-14 text-center text-sm text-destructive" colSpan={4}>
                    {loadError}
                  </td>
                </tr>
              ) : visibleNotices.length === 0 ? (
                <tr>
                  <td className="px-5 py-16 text-center" colSpan={4}>
                    {isDraftsView ? (
                      <FilePenLine className="mx-auto size-8 text-amber-500" />
                    ) : (
                      <FileX2 className="mx-auto size-8 text-slate-300" />
                    )}
                    <p className="mt-3 text-sm font-semibold text-slate-800">
                      {isDraftsView ? "No draft notices found" : "No notices authored yet"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {isDraftsView
                        ? "Save a notice as draft from the Create Notice form to see it here."
                        : "Notices you create will appear in this list."}
                    </p>
                    <Link className="mt-4 inline-block" to="/principal/create-notice">
                      <Button className="bg-indigo-600 text-white hover:bg-indigo-700" size="sm">
                        Create Notice
                      </Button>
                    </Link>
                  </td>
                </tr>
              ) : (
                visibleNotices.map((notice) => (
                  <tr
                    className="cursor-pointer transition-colors hover:bg-indigo-50/40"
                    key={notice.id}
                    onClick={() => navigate(`/principal/notices/${notice.id}`)}
                  >
                    <td className="max-w-md px-5 py-4">
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
                                audienceBadgeStyles[role] || "bg-slate-50 text-slate-700",
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
                      {dateFormatter.format(new Date(notice.notice_date || notice.created_at))}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-xs font-semibold",
                            statusStyles[notice.status] || "bg-slate-100 text-slate-700",
                          )}
                        >
                          {notice.status}
                        </span>

                        {notice.status === "DRAFT" && (
                          <Button
                            className="h-7 px-2.5 text-xs bg-indigo-600 text-white hover:bg-indigo-700"
                            disabled={publishingId === notice.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              void handlePublish(notice);
                            }}
                            size="sm"
                            type="button"
                          >
                            {publishingId === notice.id ? (
                              <>
                                <LoaderCircle className="size-3 animate-spin" />
                                Publishing...
                              </>
                            ) : (
                              <>
                                <Send className="size-3" />
                                Publish
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
