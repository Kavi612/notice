import {
  Bell,
  BellDot,
  Inbox,
  LockKeyhole,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

import type { StudentNotice } from "@/types";

interface StudentDashboardProps {
  currentTime: Date;
  departmentName: string;
  displayName: string;
  newNoticesCount: number;
  notices: StudentNotice[];
  unreadCount: number;
}

interface AnalyticsCard {
  accentClassName: string;
  count: number;
  description: string;
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

export function StudentDashboard({
  currentTime,
  departmentName,
  displayName,
  newNoticesCount,
  notices,
  unreadCount,
}: StudentDashboardProps) {
  const analyticsCards: readonly AnalyticsCard[] = [
    {
      accentClassName: "bg-indigo-500",
      count: newNoticesCount,
      description: "Recently published for you",
      icon: Bell,
      iconClassName: "bg-indigo-50 text-indigo-600",
      label: "New Notices",
    },
    {
      accentClassName: "bg-amber-500",
      count: unreadCount,
      description: "Waiting to be read",
      icon: BellDot,
      iconClassName: "bg-amber-50 text-amber-600",
      label: "Unread",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <header className="relative overflow-hidden rounded-xl px-1 py-1">
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
        <p className="text-xs font-medium text-indigo-600">
          Welcome back, {displayName}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
          Student Dashboard
        </h1>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {departmentName} · Stay current with your latest department notices.
        </p>
      </header>

      <section
        aria-label="Notice statistics"
        className="grid gap-3 sm:grid-cols-2"
      >
        {analyticsCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              className="relative overflow-hidden rounded-xl border bg-white p-4 shadow-sm"
              key={card.label}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${card.iconClassName}`}
                >
                  <Icon aria-hidden="true" className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[0.6rem] font-semibold uppercase tracking-wider text-slate-400">
                    {card.label}
                  </p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                    {card.count}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-[0.65rem] text-slate-400">
                {card.description}
              </p>
              <span
                className={`absolute bottom-0 left-4 right-4 h-0.5 rounded-full ${card.accentClassName}`}
              />
            </article>
          );
        })}
      </section>

      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs font-semibold text-slate-800">
              Latest Notices
            </h2>
            <Link
              className="text-[0.65rem] font-semibold text-indigo-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              to="/student/notices"
            >
              View all
            </Link>
          </div>
          {notices.length === 0 ? (
            <div className="flex min-h-44 flex-col items-center justify-center text-center">
              <span className="flex size-11 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
                <Inbox aria-hidden="true" className="size-5" />
              </span>
              <p className="mt-3 text-xs font-semibold text-slate-700">
                No notices found
              </p>
              <p className="mt-1 text-[0.65rem] text-slate-400">
                New notices will appear here when they are published.
              </p>
            </div>
          ) : (
            <ul className="mt-4 divide-y">
              {notices.map((notice) => {
                const displayDate = notice.publishAt ?? notice.updatedAt;

                return (
                  <li key={notice.noticeId}>
                    <Link
                      className="flex flex-col gap-3 py-4 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                      to={`/student/notices/${notice.noticeId}`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {!notice.isRead && (
                            <span
                              aria-label="Unread"
                              className="size-2 rounded-full bg-indigo-600"
                            />
                          )}
                          <p className="truncate text-sm font-medium text-slate-800">
                            {notice.title}
                          </p>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                          {notice.authorName} ·{" "}
                          <time dateTime={displayDate}>
                            {formatRelativeDate(displayDate, currentTime)}
                          </time>
                        </p>
                      </div>
                      <span className="w-fit rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                        {notice.category.charAt(0) +
                          notice.category.slice(1).toLowerCase()}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-xs font-semibold text-slate-800">
            Quick Actions
          </h2>
          <div className="mt-4 grid gap-3">
            <Link
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:border-indigo-200 hover:bg-indigo-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              to="/student/notices"
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Bell aria-hidden="true" className="size-4" />
              </span>
              <span>
                <span className="block text-[0.7rem] font-semibold text-slate-700">
                  Browse All Notices
                </span>
                <span className="text-[0.6rem] text-slate-400">
                  Search and filter published notices
                </span>
              </span>
            </Link>
          </div>
        </section>
      </div>

      <section className="grid gap-4 rounded-xl border bg-white p-4 shadow-sm sm:grid-cols-[1.4fr_repeat(3,1fr)]">
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
          <Bell aria-hidden="true" className="size-4 text-indigo-500" />
          <p className="text-[0.6rem] text-slate-400">
            <strong className="block text-slate-700">Acknowledgements</strong>
            Confirm important notices
          </p>
        </div>
      </section>
    </div>
  );
}
