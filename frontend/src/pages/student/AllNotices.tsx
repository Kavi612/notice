import { Inbox, Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  NoticeCategory,
  NoticeStatus,
  StudentNotice,
} from "@/types";

interface AllNoticesProps {
  notices: StudentNotice[];
}

interface NoticeFilterState {
  author: string;
  category: NoticeCategory | "";
  date: string;
  search: string;
  section: string;
  status: NoticeStatus | "";
  year: string;
}

interface FilterOption<T extends string> {
  label: string;
  value: T;
}

const initialFilters: NoticeFilterState = {
  author: "",
  category: "",
  date: "",
  search: "",
  section: "",
  status: "",
  year: "",
};

const categoryOptions: readonly FilterOption<NoticeCategory>[] = [
  { label: "Examination", value: "EXAMINATION" },
  { label: "Workshop", value: "WORKSHOP" },
  { label: "Seminar", value: "SEMINAR" },
  { label: "Placement", value: "PLACEMENT" },
  { label: "Sports", value: "SPORTS" },
  { label: "Cultural", value: "CULTURAL" },
  { label: "General", value: "GENERAL" },
];

const statusOptions: readonly FilterOption<NoticeStatus>[] = [
  { label: "Draft", value: "DRAFT" },
  { label: "Scheduled", value: "SCHEDULED" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Expired", value: "EXPIRED" },
  { label: "Archived", value: "ARCHIVED" },
];

export function AllNotices({ notices }: AllNoticesProps) {
  const [filters, setFilters] =
    useState<NoticeFilterState>(initialFilters);

  const updateFilter = <Key extends keyof NoticeFilterState>(
    key: Key,
    value: NoticeFilterState[Key],
  ) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <header>
        <p className="text-sm font-medium text-primary">Notice library</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          All Notices
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Browse published notices relevant to your academic context.
        </p>
      </header>

      <section
        aria-labelledby="notice-filters-heading"
        className="rounded-lg border bg-card p-5 shadow-sm"
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal
            aria-hidden="true"
            className="size-4 text-primary"
          />
          <h2
            className="text-sm font-semibold"
            id="notice-filters-heading"
          >
            Search and filters
          </h2>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notice-search">Search</Label>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                className="pl-9"
                id="notice-search"
                onChange={(event) =>
                  updateFilter("search", event.target.value)
                }
                placeholder="Search notice titles or content"
                type="search"
                value={filters.search}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notice-category-filter">Category</Label>
            <select
              className="flex h-11 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              id="notice-category-filter"
              onChange={(event) =>
                updateFilter(
                  "category",
                  event.target.value as NoticeCategory | "",
                )
              }
              value={filters.category}
            >
              <option value="">All categories</option>
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notice-status-filter">Status</Label>
            <select
              className="flex h-11 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              id="notice-status-filter"
              onChange={(event) =>
                updateFilter(
                  "status",
                  event.target.value as NoticeStatus | "",
                )
              }
              value={filters.status}
            >
              <option value="">All statuses</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notice-year-filter">Year</Label>
            <Input
              id="notice-year-filter"
              onChange={(event) =>
                updateFilter("year", event.target.value)
              }
              placeholder="Filter by year"
              value={filters.year}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notice-section-filter">Section</Label>
            <Input
              id="notice-section-filter"
              onChange={(event) =>
                updateFilter("section", event.target.value)
              }
              placeholder="Filter by section"
              value={filters.section}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notice-date-filter">Date</Label>
            <Input
              id="notice-date-filter"
              onChange={(event) =>
                updateFilter("date", event.target.value)
              }
              type="date"
              value={filters.date}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notice-author-filter">Author</Label>
            <Input
              id="notice-author-filter"
              onChange={(event) =>
                updateFilter("author", event.target.value)
              }
              placeholder="Filter by author"
              value={filters.author}
            />
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Filter controls are ready for data-source integration.
        </p>
      </section>

      <section aria-label="Published notices">
        {notices.length === 0 ? (
          <div className="rounded-lg border bg-card px-6 py-16 text-center shadow-sm">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <Inbox aria-hidden="true" className="size-5" />
            </span>
            <p className="mt-4 text-sm font-medium">No notices found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Published notices will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {notices.map((notice) => (
              <Link
                className="group overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-soft"
                key={notice.noticeId}
                to={`/student/notices/${notice.noticeId}`}
              >
                {notice.imageUrl && (
                  <img
                    alt=""
                    className="h-32 w-full object-cover"
                    src={notice.imageUrl}
                  />
                )}
                <div className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">
                      {notice.category.charAt(0) +
                        notice.category.slice(1).toLowerCase()}
                    </span>
                    {!notice.isRead && (
                      <span className="text-xs font-medium text-primary">
                        Unread
                      </span>
                    )}
                  </div>
                  <h2 className="mt-4 line-clamp-2 text-base font-semibold leading-6">
                    {notice.title}
                  </h2>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {notice.authorName}
                  </p>
                  <span className="mt-5 inline-flex text-sm font-medium text-primary underline-offset-4 group-hover:underline">
                    Read notice
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
