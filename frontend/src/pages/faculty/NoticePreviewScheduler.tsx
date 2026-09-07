import { CalendarClock, FilePenLine, LoaderCircle, Send } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type {
  NoticeCategory,
  NoticeTemplate,
} from "@/types";

import { NoticePreview } from "./NoticePreview";

export interface NoticeScheduleValue {
  expiryDate: string | null;
  publishDate: string | null;
  publishTime: string | null;
}

export interface NoticePublicationValue {
  category: NoticeCategory;
  content: string;
  imageUrl: string | null;
  schedule: NoticeScheduleValue;
  template: NoticeTemplate;
  title: string;
}

interface NoticePreviewSchedulerProps {
  category: NoticeCategory;
  content: string;
  imageUrl: string | null;
  isPublishing?: boolean;
  onPublish: (notice: NoticePublicationValue) => void | Promise<void>;
  onSaveDraft: (notice: NoticePublicationValue) => void;
  onSchedule: (notice: NoticePublicationValue) => void;
  publishError?: string | null;
  publishSuccess?: string | null;
  title: string;
}

interface TemplateOption {
  description: string;
  label: string;
  value: NoticeTemplate;
}

const templateOptions: readonly TemplateOption[] = [
  {
    description: "Traditional departmental communication",
    label: "Formal Academic",
    value: "FORMAL_ACADEMIC",
  },
  {
    description: "Structured official announcement",
    label: "Circular",
    value: "CIRCULAR",
  },
  {
    description: "Engaging activity announcement",
    label: "Event",
    value: "EVENT",
  },
  {
    description: "Career and recruitment update",
    label: "Placement",
    value: "PLACEMENT",
  },
];

function emptyToNull(value: string): string | null {
  return value.length > 0 ? value : null;
}

export function NoticePreviewScheduler({
  category,
  content,
  imageUrl,
  isPublishing = false,
  onPublish,
  onSaveDraft,
  onSchedule,
  publishError = null,
  publishSuccess = null,
  title,
}: NoticePreviewSchedulerProps) {
  const [expiryDate, setExpiryDate] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [publishTime, setPublishTime] = useState("");
  const [template, setTemplate] =
    useState<NoticeTemplate>("FORMAL_ACADEMIC");

  const canSchedule =
    publishDate.length > 0 &&
    publishTime.length > 0 &&
    expiryDate.length > 0;

  const getCurrentNotice = (): NoticePublicationValue => ({
    category,
    content,
    imageUrl,
    schedule: {
      expiryDate: emptyToNull(expiryDate),
      publishDate: emptyToNull(publishDate),
      publishTime: emptyToNull(publishTime),
    },
    template,
    title,
  });

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <header>
        <p className="text-sm font-medium text-primary">Final review</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Notice Preview
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Confirm how the notice will appear to students, then save, schedule,
          or publish it.
        </p>
      </header>

      <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
        <section aria-label="Student notice preview">
          <NoticePreview
            category={category}
            content={content}
            imageUrl={imageUrl}
            template={template}
            title={title}
          />
        </section>

        <aside className="space-y-6 rounded-lg border bg-card p-6 shadow-sm xl:sticky xl:top-6">
          <section aria-labelledby="template-heading">
            <div>
              <h2
                className="text-base font-semibold tracking-tight"
                id="template-heading"
              >
                Template
              </h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Changes presentation only. Notice content remains unchanged.
              </p>
            </div>

            <div className="mt-4 grid gap-2">
              {templateOptions.map((option) => (
                <button
                  aria-pressed={template === option.value}
                  className={cn(
                    "rounded-md border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    template === option.value
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/40 hover:bg-muted/50",
                  )}
                  key={option.value}
                  onClick={() => setTemplate(option.value)}
                  type="button"
                >
                  <span className="block text-sm font-medium">
                    {option.label}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="scheduling-heading"
            className="border-t pt-6"
          >
            <div className="flex items-center gap-2">
              <CalendarClock
                aria-hidden="true"
                className="size-4 text-primary"
              />
              <h2
                className="text-base font-semibold tracking-tight"
                id="scheduling-heading"
              >
                Scheduling
              </h2>
            </div>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="publish-date">Publish Date</Label>
                <Input
                  id="publish-date"
                  onChange={(event) => setPublishDate(event.target.value)}
                  type="date"
                  value={publishDate}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="publish-time">Publish Time</Label>
                <Input
                  id="publish-time"
                  onChange={(event) => setPublishTime(event.target.value)}
                  type="time"
                  value={publishTime}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiry-date">Expiry Date</Label>
                <Input
                  id="expiry-date"
                  min={publishDate || undefined}
                  onChange={(event) => setExpiryDate(event.target.value)}
                  type="date"
                  value={expiryDate}
                />
              </div>
            </div>
          </section>

          <div className="grid gap-3 border-t pt-6">
            <Button
              disabled={isPublishing}
              onClick={() => onSaveDraft(getCurrentNotice())}
              type="button"
              variant="outline"
            >
              <FilePenLine aria-hidden="true" className="size-4" />
              Save Draft
            </Button>
            <Button
              disabled={!canSchedule || isPublishing}
              onClick={() => onSchedule(getCurrentNotice())}
              type="button"
              variant="outline"
            >
              <CalendarClock aria-hidden="true" className="size-4" />
              Schedule
            </Button>
            <Button
              disabled={isPublishing}
              onClick={() => {
                void onPublish(getCurrentNotice());
              }}
              type="button"
            >
              {isPublishing ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="size-4 animate-spin"
                />
              ) : (
                <Send aria-hidden="true" className="size-4" />
              )}
              {isPublishing ? "Publishing..." : "Publish Now"}
            </Button>
            {publishSuccess ? (
              <p className="text-sm text-emerald-700" role="status">
                {publishSuccess}
              </p>
            ) : null}
            {publishError ? (
              <p className="text-sm text-destructive" role="alert">
                {publishError}
              </p>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
