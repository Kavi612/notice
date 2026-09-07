import {
  FilePenLine,
  Files,
  History,
  LockKeyhole,
  Plus,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

import type { Notice, NoticeStatus } from "@/types";

interface FacultyDashboardProps {
  currentTime: Date;
  departmentName: string;
  displayName: string;
  draftCount: number;
  isLoading?: boolean;
  loadError?: string | null;
  myNoticesCount: number;
  notices: Notice[];
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

interface RelativeTimeInterval {
  seconds: number;
  unit: Intl.RelativeTimeFormatUnit;
}

const relativeTimeFormatter = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});

const relativeTimeIntervals: readonly RelativeTimeInterval[] = [
  { seconds: 31_536_000, unit: "year" },
  { seconds: 2_592_000, unit: "month" },
  { seconds: 604_800, unit: "week" },
  { seconds: 86_400, unit: "day" },
  { seconds: 3_600, unit: "hour" },
  { seconds: 60, unit: "minute" },
  { seconds: 1, unit: "second" },
];

const statusStyles: Record<NoticeStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  SCHEDULED: "bg-violet-50 text-violet-700",
  PUBLISHED: "bg-emerald-50 text-emerald-700",
  EXPIRED: "bg-amber-50 text-amber-700",
  ARCHIVED: "bg-slate-100 text-slate-500",
};

function formatRelativeDate(value: string, currentTime: Date): string {
  const date = new Date(value);
  const differenceInSeconds =
    (date.getTime() - currentTime.getTime()) / 1_000;
  const absoluteDifference = Math.abs(differenceInSeconds);
  const interval =
    relativeTimeIntervals.find(
      ({ seconds }) => absoluteDifference >= seconds,
    ) ?? relativeTimeIntervals[relativeTimeIntervals.length - 1];

  if (!interval) {
    return relativeTimeFormatter.format(0, "second");
  }

  return relativeTimeFormatter.format(
    Math.round(differenceInSeconds / interval.seconds),
    interval.unit,
  );
}

function formatStatus(status: NoticeStatus): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function FacultyDashboard({
  currentTime,
  departmentName,
  displayName,
  draftCount,
  isLoading = false,
  loadError = null,
  myNoticesCount,
  notices,
}: FacultyDashboardProps) {
  const analyticsCards: readonly AnalyticsCard[] = [
    {
      accentClassName: "bg-indigo-500",
      count: myNoticesCount,
      description: "Notices you have created",
      href: "/faculty/notices",
      icon: Files,
      iconClassName: "bg-indigo-50 text-indigo-600",
      label: "My Notices",
    },
    {
      accentClassName: "bg-amber-500",
      count: draftCount,
      description: "Saved as drafts",
      href: "/faculty/notices?status=DRAFT",
      icon: FilePenLine,
      iconClassName: "bg-amber-50 text-amber-600",
      label: "Drafts",
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
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
          Welcome back, {displayName}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Faculty Dashboard
        </h1>
        <p className="mt-1.5 text-sm leading-6 text-slate-500">
          {departmentName
            ? `${departmentName} · Create, review, and publish departmental notices.`
            : "Create, review, and publish departmental notices."}
        </p>
      </header>

      <section
        aria-label="Notice statistics"
        className="grid gap-4 sm:grid-cols-2"
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
            Recent Notices
          </h2>
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
                No notices yet
              </p>
              <p className="mt-1 text-[0.65rem] text-slate-400">
                Notices you create will appear here.
              </p>
              <Link
                className="mt-4 inline-flex h-8 items-center gap-2 rounded-md bg-indigo-600 px-3 text-[0.65rem] font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                to="/faculty/create-notice"
              >
                Create Notice
                <Plus aria-hidden="true" className="size-3" />
              </Link>
            </div>
          ) : (
            <ul className="mt-4 divide-y">
              {notices.map((notice) => (
                <li key={notice.noticeId}>
                  <Link
                    className="flex flex-col gap-3 py-4 transition-colors hover:bg-indigo-50/40 sm:flex-row sm:items-center sm:justify-between"
                    to={`/faculty/notices/${notice.noticeId}`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {notice.title}
                      </p>
                      <time
                        className="mt-1 block text-xs text-slate-400"
                        dateTime={notice.updatedAt}
                      >
                        Updated {formatRelativeDate(notice.updatedAt, currentTime)}
                      </time>
                    </div>
                    <span
                      className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[notice.status] ?? statusStyles.DRAFT}`}
                    >
                      {formatStatus(notice.status)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft">
          <h2 className="text-sm font-semibold text-slate-800">
            Quick Actions
          </h2>
          <div className="mt-4 grid gap-3">
            <Link
              className="flex items-center gap-3 rounded-xl border border-slate-200/80 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              to="/faculty/create-notice"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-sm">
                <Plus aria-hidden="true" className="size-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  Create a notice
                </span>
                <span className="text-xs text-slate-400">
                  Fill in the details and generate with AI
                </span>
              </span>
            </Link>
            <Link
              className="flex items-center gap-3 rounded-xl border border-slate-200/80 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-200 hover:bg-amber-50/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              to="/faculty/notices?status=DRAFT"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shadow-sm">
                <FilePenLine aria-hidden="true" className="size-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  Review drafts
                </span>
                <span className="text-xs text-slate-400">
                  Open saved notices that are not published yet
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
          <Files aria-hidden="true" className="size-4 text-indigo-500" />
          <p className="text-[0.6rem] text-slate-400">
            <strong className="block text-slate-700">AI Notice Creator</strong>
            Structured form and Groq drafting
          </p>
        </div>
      </section>
    </div>
  );
}
