import { useEffect, useState } from "react";
import {
  CheckCircle2,
  FilePenLine,
  Files,
  History,
  LockKeyhole,
  Plus,
  Send,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { listPrincipalNotices, SESSION_EXPIRED_ERROR } from "@/lib/noticeApi";
import { cn } from "@/lib/utils";
import type { DepartmentNotice, TargetRole } from "@/types/notice";

interface AnalyticsCard {
  accentClassName: string;
  count: number;
  description: string;
  href: string;
  icon: LucideIcon;
  iconClassName: string;
  label: string;
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

export function PrincipalDashboard() {
  const { currentUser, accessToken } = useAuth();
  const navigate = useNavigate();

  const [notices, setNotices] = useState<DepartmentNotice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const displayName = currentUser?.username ?? "Principal";

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
          setLoadError(err instanceof Error ? err.message : "Failed to load dashboard data.");
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

  const totalCount = notices.length;
  const publishedCount = notices.filter((n) => n.status === "PUBLISHED").length;
  const draftCount = notices.filter((n) => n.status === "DRAFT").length;

  const analyticsCards: readonly AnalyticsCard[] = [
    {
      accentClassName: "bg-indigo-500",
      count: totalCount,
      description: "Total notices authored by the Principal",
      href: "/principal/notices",
      icon: Files,
      iconClassName: "bg-indigo-50 text-indigo-600",
      label: "Total Notices",
    },
    {
      accentClassName: "bg-emerald-500",
      count: publishedCount,
      description: "Live published notices visible to audiences",
      href: "/principal/notices",
      icon: CheckCircle2,
      iconClassName: "bg-emerald-50 text-emerald-600",
      label: "Published",
    },
    {
      accentClassName: "bg-amber-500",
      count: draftCount,
      description: "Notices saved as working drafts",
      href: "/principal/notices?status=DRAFT",
      icon: FilePenLine,
      iconClassName: "bg-amber-50 text-amber-600",
      label: "Drafts",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Top Banner Header */}
      <header className="relative overflow-hidden rounded-2xl border border-indigo-100/80 bg-white/80 px-6 py-6 shadow-soft">
        <div
          aria-hidden="true"
          className="absolute right-8 top-1 grid grid-cols-3 gap-2 opacity-20"
        >
          {Array.from({ length: 9 }).map((_, index) => (
            <span className="size-1 rounded-full bg-indigo-500" key={index} />
          ))}
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
          Executive Leadership
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Principal Dashboard
        </h1>
        <p className="mt-1.5 text-sm leading-6 text-slate-500">
          Welcome back, {displayName}. Oversee departmental notices, broadcast institutional circulars, and monitor campus communication.
        </p>
      </header>

      {/* Analytics Statistics Cards */}
      <section
        aria-label="Notice statistics"
        className="grid gap-4 sm:grid-cols-3"
      >
        {analyticsCards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              key={card.label}
              to={card.href}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl shadow-sm ${card.iconClassName}`}
                >
                  <Icon aria-hidden="true" className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
                    {card.label}
                  </p>
                  <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
                    {card.count}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-500">{card.description}</p>
              <span
                className={`absolute bottom-0 left-5 right-5 h-0.5 rounded-full ${card.accentClassName}`}
              />
            </Link>
          );
        })}
      </section>

      {/* Main Grid: Recent Notices & Quick Actions */}
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Recent Notices */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-sm font-semibold text-slate-800">
              Recent Notices
            </h2>
            <Link
              className="text-xs font-semibold text-indigo-600 hover:underline"
              to="/principal/notices"
            >
              View all ({notices.length})
            </Link>
          </div>

          {isLoading ? (
            <p className="mt-6 text-xs text-slate-400">Loading notices...</p>
          ) : loadError ? (
            <p className="mt-6 text-xs text-destructive">{loadError}</p>
          ) : notices.length === 0 ? (
            <div className="flex min-h-44 flex-col items-center justify-center text-center">
              <span className="flex size-11 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
                <History aria-hidden="true" className="size-5" />
              </span>
              <p className="mt-3 text-xs font-semibold text-slate-700">
                No notices authored yet
              </p>
              <p className="mt-1 text-[0.65rem] text-slate-400">
                Notices you create will appear here.
              </p>
              <Link className="mt-4" to="/principal/create-notice">
                <Button className="bg-indigo-600 text-white hover:bg-indigo-700" size="sm">
                  <Plus className="size-3.5" />
                  Create Notice
                </Button>
              </Link>
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {notices.slice(0, 5).map((notice) => (
                <li key={notice.id}>
                  <Link
                    className="flex flex-col gap-2 py-3.5 transition-colors hover:bg-indigo-50/40 sm:flex-row sm:items-center sm:justify-between"
                    to={`/principal/notices/${notice.id}`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {notice.title}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                        <span>{dateFormatter.format(new Date(notice.notice_date || notice.created_at))}</span>
                        <span>·</span>
                        <div className="flex items-center gap-1">
                          {notice.target_roles?.map((r) => (
                            <span
                              className={cn(
                                "rounded px-1.5 py-0.2 text-[0.6rem] font-semibold border",
                                audienceBadgeStyles[r] || "bg-slate-50 text-slate-600",
                              )}
                              key={r}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "w-fit rounded-full border px-2.5 py-0.5 text-xs font-semibold shrink-0",
                        statusStyles[notice.status] || "bg-slate-100 text-slate-700",
                      )}
                    >
                      {notice.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Quick Actions */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-semibold text-slate-800">
            Quick Actions
          </h2>
          <div className="grid gap-3">
            <Link
              className="flex items-center gap-3 rounded-xl border border-slate-200/80 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              to="/principal/create-notice"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-sm">
                <Plus aria-hidden="true" className="size-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  Create a Notice
                </span>
                <span className="text-xs text-slate-400">
                  Target circulars to HODs, Faculty, or Students
                </span>
              </span>
            </Link>

            <Link
              className="flex items-center gap-3 rounded-xl border border-slate-200/80 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-200 hover:bg-amber-50/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              to="/principal/notices?status=DRAFT"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shadow-sm">
                <FilePenLine aria-hidden="true" className="size-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  Review Drafts
                </span>
                <span className="text-xs text-slate-400">
                  Inspect and publish pending drafts ({draftCount})
                </span>
              </span>
            </Link>

            <Link
              className="flex items-center gap-3 rounded-xl border border-slate-200/80 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              to="/principal/notices"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-sm">
                <Send aria-hidden="true" className="size-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  All Institutional Notices
                </span>
                <span className="text-xs text-slate-400">
                  Browse complete catalogue of issued notices
                </span>
              </span>
            </Link>
          </div>
        </section>
      </div>

      {/* Security & Verification Footer Banner */}
      <section className="grid gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft sm:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <ShieldCheck aria-hidden="true" className="size-5" />
          </span>
          <p className="text-[0.65rem] leading-4 text-slate-400">
            <strong className="block font-semibold text-slate-700">
              Executive Notice Authority
            </strong>
            Official notices carry digital authenticity verification.
          </p>
        </div>
        <div className="flex items-center gap-2 border-slate-100 sm:border-l sm:pl-4">
          <LockKeyhole aria-hidden="true" className="size-4 text-indigo-500" />
          <p className="text-[0.6rem] text-slate-400">
            <strong className="block text-slate-700">Access Control</strong>
            Audience targeting strictly enforced
          </p>
        </div>
        <div className="flex items-center gap-2 border-slate-100 sm:border-l sm:pl-4">
          <ShieldCheck aria-hidden="true" className="size-4 text-indigo-500" />
          <p className="text-[0.6rem] text-slate-400">
            <strong className="block text-slate-700">Data Integrity</strong>
            PostgreSQL & AWS Cognito secured
          </p>
        </div>
        <div className="flex items-center gap-2 border-slate-100 sm:border-l sm:pl-4">
          <Files aria-hidden="true" className="size-4 text-indigo-500" />
          <p className="text-[0.6rem] text-slate-400">
            <strong className="block text-slate-700">Canvas Export</strong>
            One-click PNG notice download
          </p>
        </div>
      </section>
    </div>
  );
}
