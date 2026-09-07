import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Inbox,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import type { StudentNotice } from "@/types";

interface NoticeDetailsProps {
  notice: StudentNotice | null;
  onAcknowledge: (noticeId: string) => void;
  onMarkAsRead: (noticeId: string) => void;
}

const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function NoticeDetails({
  notice,
  onAcknowledge,
  onMarkAsRead,
}: NoticeDetailsProps) {
  const [hasAcknowledged, setHasAcknowledged] = useState(
    notice?.isAcknowledged ?? false,
  );
  const [hasMarkedAsRead, setHasMarkedAsRead] = useState(
    notice?.isRead ?? false,
  );
  const [isConfirmationChecked, setIsConfirmationChecked] =
    useState(false);

  useEffect(() => {
    setHasMarkedAsRead(notice?.isRead ?? false);
    setHasAcknowledged(notice?.isAcknowledged ?? false);
  }, [notice?.isAcknowledged, notice?.isRead, notice?.noticeId]);

  useEffect(() => {
    if (!notice || notice.isRead) {
      return;
    }

    onMarkAsRead(notice.noticeId);
  }, [notice?.isRead, notice?.noticeId, onMarkAsRead]);

  if (!notice) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
          to="/student/notices"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to all notices
        </Link>
        <section className="mt-6 rounded-lg border bg-card px-6 py-16 text-center shadow-sm">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <Inbox aria-hidden="true" className="size-5" />
          </span>
          <h1 className="mt-4 text-sm font-medium">No notices found</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This notice is unavailable or may have been removed.
          </p>
        </section>
      </div>
    );
  }

  const displayDate = notice.publishAt ?? notice.updatedAt;

  const handleMarkAsRead = () => {
    onMarkAsRead(notice.noticeId);
    setHasMarkedAsRead(true);
  };

  const handleAcknowledge = () => {
    if (!isConfirmationChecked) {
      return;
    }

    onAcknowledge(notice.noticeId);
    setHasAcknowledged(true);
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
        to="/student/notices"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to all notices
      </Link>

      <article className="overflow-hidden rounded-lg border bg-card shadow-soft">
        {notice.imageUrl && (
          <img
            alt={`Visual for ${notice.title}`}
            className="max-h-64 w-full object-cover"
            src={notice.imageUrl}
          />
        )}

        <div className="h-1.5 bg-primary" />

        <div className="p-7 sm:p-10">
          <header className="border-b pb-7">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                {notice.category.charAt(0) +
                  notice.category.slice(1).toLowerCase()}
              </span>
              {!hasMarkedAsRead && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                  <span className="size-2 rounded-full bg-primary" />
                  Unread
                </span>
              )}
            </div>

            <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-tight">
              {notice.title}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {notice.authorName} ·{" "}
              <time dateTime={displayDate}>
                {dateFormatter.format(new Date(displayDate))}
              </time>
            </p>
          </header>

          <div className="whitespace-pre-wrap py-8 text-sm leading-8 text-foreground">
            {notice.content}
          </div>

          <footer className="flex justify-end border-t pt-6">
            <Button
              disabled={hasMarkedAsRead}
              onClick={handleMarkAsRead}
              type="button"
              variant="outline"
            >
              <Check aria-hidden="true" className="size-4" />
              {hasMarkedAsRead ? "Marked as Read" : "Mark as Read"}
            </Button>
          </footer>
        </div>
      </article>

      {notice.requiresAcknowledgement && (
        <section
          aria-labelledby="acknowledgement-heading"
          className="rounded-lg border bg-card p-6 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
              <CheckCircle2 aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2
                className="text-base font-semibold"
                id="acknowledgement-heading"
              >
                Acknowledgement required
              </h2>

              {hasAcknowledged ? (
                <p className="mt-2 text-sm text-emerald-700">
                  You have acknowledged this notice.
                </p>
              ) : (
                <>
                  <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-md border bg-background p-4">
                    <input
                      checked={isConfirmationChecked}
                      className="mt-0.5 size-4 accent-[hsl(var(--primary))]"
                      onChange={(event) =>
                        setIsConfirmationChecked(event.target.checked)
                      }
                      type="checkbox"
                    />
                    <span className="text-sm leading-6">
                      I have read and understood this notice.
                    </span>
                  </label>
                  <div className="mt-4 flex justify-end">
                    <Button
                      disabled={!isConfirmationChecked}
                      onClick={handleAcknowledge}
                      type="button"
                    >
                      Acknowledge
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
