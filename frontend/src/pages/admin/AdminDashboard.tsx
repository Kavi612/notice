import {
  Archive,
  ArchiveX,
  BarChart3,
  CalendarClock,
  FilePenLine,
  Files,
  History,
  LockKeyhole,
  Plus,
  Send,
  ShieldCheck,
  UserRoundCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface AdminDashboardProps {
  displayName: string;
  draftCount: number;
  expiredCount: number;
  publishedCount: number;
  scheduledCount: number;
  totalNoticesCount: number;
}

interface AnalyticsCard {
  accentClassName: string;
  count: number;
  description: string;
  href: string;
  icon: LucideIcon;
  iconClassName: string;
  label: string;
}

export function AdminDashboard({
  displayName,
  draftCount,
  expiredCount,
  publishedCount,
  scheduledCount,
  totalNoticesCount,
}: AdminDashboardProps) {
  const location = useLocation();
  const workspaceBase = location.pathname.startsWith("/admin")
    ? "/admin"
    : "/hod";
  const analyticsCards: readonly AnalyticsCard[] = [
    {
      accentClassName: "bg-indigo-500",
      count: totalNoticesCount,
      description: "All notices created",
      href: `${workspaceBase}/notices`,
      icon: Files,
      iconClassName: "bg-indigo-50 text-indigo-600",
      label: "Total Notices",
    },
    {
      accentClassName: "bg-emerald-500",
      count: publishedCount,
      description: "Successfully published",
      href: `${workspaceBase}/notices?status=PUBLISHED`,
      icon: Send,
      iconClassName: "bg-emerald-50 text-emerald-600",
      label: "Published",
    },
    {
      accentClassName: "bg-amber-500",
      count: draftCount,
      description: "Saved as drafts",
      href: `${workspaceBase}/notices?status=DRAFT`,
      icon: FilePenLine,
      iconClassName: "bg-amber-50 text-amber-600",
      label: "Drafts",
    },
    {
      accentClassName: "bg-blue-500",
      count: scheduledCount,
      description: "Scheduled for later",
      href: `${workspaceBase}/notices?status=SCHEDULED`,
      icon: CalendarClock,
      iconClassName: "bg-blue-50 text-blue-600",
      label: "Scheduled",
    },
    {
      accentClassName: "bg-rose-500",
      count: expiredCount,
      description: "Notices expired",
      href: `${workspaceBase}/notices?status=EXPIRED`,
      icon: ArchiveX,
      iconClassName: "bg-rose-50 text-rose-600",
      label: "Expired",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="relative overflow-hidden rounded-2xl border border-indigo-100/80 bg-white/80 px-6 py-6 shadow-soft">
        <div
          aria-hidden="true"
          className="absolute right-8 top-1 grid grid-cols-3 gap-2 opacity-20"
        >
          {Array.from({ length: 9 }).map((_, index) => (
            <span
              className="size-1 rounded-full bg-indigo-500"
              key={index}
            />
          ))}
        </div>
        <div className="absolute right-5 top-0 hidden items-end gap-2 text-indigo-200 sm:flex">
          <BarChart3
            aria-hidden="true"
            className="size-20"
            strokeWidth={1}
          />
          <ShieldCheck
            aria-hidden="true"
            className="size-12 text-indigo-400/60"
          />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
          Welcome back, {displayName}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          HOD Dashboard
        </h1>
        <p className="mt-1.5 text-sm leading-6 text-slate-500">
          Monitor notice activity and manage portal operations efficiently.
        </p>
      </header>

      <section
        aria-label="Notice analytics"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
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

      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft">
          <h2 className="text-sm font-semibold text-slate-800">
            Recent Activity
          </h2>
          <div className="flex min-h-44 flex-col items-center justify-center text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
              <History aria-hidden="true" className="size-5" />
            </span>
            <p className="mt-3 text-xs font-semibold text-slate-700">
              No recent activity
            </p>
            <p className="mt-1 text-[0.65rem] text-slate-400">
              You haven&apos;t created or managed any notices yet.
            </p>
            <Link
              className="mt-4 inline-flex h-8 items-center gap-2 rounded-md bg-indigo-600 px-3 text-[0.65rem] font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              to={`${workspaceBase}/create-notice`}
            >
              Create Notice
              <Plus aria-hidden="true" className="size-3" />
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft">
          <h2 className="text-sm font-semibold text-slate-800">
            Quick Actions
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link
              className="flex items-center gap-3 rounded-xl border border-slate-200/80 p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              to={`${workspaceBase}/create-notice`}
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Plus aria-hidden="true" className="size-4" />
              </span>
              <span>
                <span className="block text-[0.7rem] font-semibold text-slate-700">
                  Create New Notice
                </span>
                <span className="text-[0.6rem] text-slate-400">
                  Publish a new notice
                </span>
              </span>
            </Link>
            <Link
              className="flex items-center gap-3 rounded-xl border border-slate-200/80 p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              to={`${workspaceBase}/notices`}
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Files aria-hidden="true" className="size-4" />
              </span>
              <span>
                <span className="block text-[0.7rem] font-semibold text-slate-700">
                  Manage Notices
                </span>
                <span className="text-[0.6rem] text-slate-400">
                  View and manage all notices
                </span>
              </span>
            </Link>
            <Link
              className="flex items-center gap-3 rounded-xl border border-slate-200/80 p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              to={`${workspaceBase}/users`}
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Users aria-hidden="true" className="size-4" />
              </span>
              <span>
                <span className="block text-[0.7rem] font-semibold text-slate-700">
                  Manage Users
                </span>
                <span className="text-[0.6rem] text-slate-400">
                  Add or manage portal users
                </span>
              </span>
            </Link>
            <Link
              className="flex items-center gap-3 rounded-xl border border-slate-200/80 p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-200 hover:bg-amber-50/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              to={`${workspaceBase}/archive`}
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Archive aria-hidden="true" className="size-4" />
              </span>
              <span>
                <span className="block text-[0.7rem] font-semibold text-slate-700">
                  View Archive
                </span>
                <span className="text-[0.6rem] text-slate-400">
                  Browse archived notices
                </span>
              </span>
            </Link>
          </div>
        </section>
      </div>

      <section className="grid gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft sm:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <ShieldCheck aria-hidden="true" className="size-5" />
          </span>
          <p className="text-[0.65rem] leading-4 text-slate-400">
            <strong className="block font-semibold text-slate-700">
              Your security is our priority
            </strong>
            Portal activities are monitored and protected.
          </p>
        </div>
        <div className="flex items-center gap-2 border-slate-100 sm:border-l sm:pl-4">
          <LockKeyhole
            aria-hidden="true"
            className="size-4 text-indigo-500"
          />
          <p className="text-[0.6rem] text-slate-400">
            <strong className="block text-slate-700">Secure Access</strong>
            Role-based access control
          </p>
        </div>
        <div className="flex items-center gap-2 border-slate-100 sm:border-l sm:pl-4">
          <ShieldCheck
            aria-hidden="true"
            className="size-4 text-indigo-500"
          />
          <p className="text-[0.6rem] text-slate-400">
            <strong className="block text-slate-700">Data Protection</strong>
            Encrypted and secure
          </p>
        </div>
        <div className="flex items-center gap-2 border-slate-100 sm:border-l sm:pl-4">
          <UserRoundCog
            aria-hidden="true"
            className="size-4 text-indigo-500"
          />
          <p className="text-[0.6rem] text-slate-400">
            <strong className="block text-slate-700">Audit Logs</strong>
            All activities tracked
          </p>
        </div>
      </section>
    </div>
  );
}
