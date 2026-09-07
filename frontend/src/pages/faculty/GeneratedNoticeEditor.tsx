import { useState, type ChangeEvent } from "react";
import {
  Archive,
  ArchiveRestore,
  AlertCircle,
  CalendarClock,
  Check,
  CheckCircle2,
  FilePenLine,
  LoaderCircle,
  Pencil,
  RefreshCw,
  Send,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { NoticeCategory, NoticeStatus } from "@/types";

import { AttachPoster } from "./AttachPoster";
import type { ExtractedNoticeFields } from "./GeneratedNoticeRoute";
import { OptionalNoticeVisual } from "./OptionalNoticeVisual";

export interface GeneratedNoticeValue {
  category: NoticeCategory;
  content: string;
  expiresAt: string | null;
  imageUrl: string | null;
  publishAt: string | null;
  title: string;
}

interface GeneratedNoticeEditorProps {
  accessToken: string | null;
  department: string;
  extractedFields?: ExtractedNoticeFields;
  generatedContent: string;
  generatedTitle: string;
  heading?: string;
  hideRegenerate?: boolean;
  initialPosterUrl?: string | null;
  isArchiving?: boolean;
  isUnarchiving?: boolean;
  isPublishing?: boolean;
  isSavingDraft?: boolean;
  isScheduling?: boolean;
  noticeId: string | null;
  onArchive?: () => void | Promise<void>;
  onUnarchive?: () => void | Promise<void>;
  onPublish: (notice: GeneratedNoticeValue) => void | Promise<void>;
  onRegenerate: (notice: GeneratedNoticeValue) => void;
  onSaveDraft: (notice: GeneratedNoticeValue) => void | Promise<void>;
  onSchedule: (notice: GeneratedNoticeValue) => void | Promise<void>;
  onSessionExpired: () => void;
  archiveError?: string | null;
  archiveSuccess?: string | null;
  unarchiveError?: string | null;
  unarchiveSuccess?: string | null;
  publishError?: string | null;
  publishSuccess?: string | null;
  saveDraftError?: string | null;
  saveDraftSuccess?: string | null;
  scheduleError?: string | null;
  scheduleSuccess?: string | null;
  startEditing?: boolean;
  status?: NoticeStatus;
  suggestedCategory: NoticeCategory;
}

interface CategoryOption {
  label: string;
  value: NoticeCategory;
}

const categoryOptions: readonly CategoryOption[] = [
  { label: "Examination", value: "EXAMINATION" },
  { label: "Workshop", value: "WORKSHOP" },
  { label: "Seminar", value: "SEMINAR" },
  { label: "Placement", value: "PLACEMENT" },
  { label: "Sports", value: "SPORTS" },
  { label: "Cultural", value: "CULTURAL" },
  { label: "General", value: "GENERAL" },
];

function toIsoDateTime(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}

function toEndOfDay(date: string): string {
  return new Date(`${date}T23:59:00`).toISOString();
}

function isNoticeCategory(value: string): value is NoticeCategory {
  return categoryOptions.some((option) => option.value === value);
}

export function GeneratedNoticeEditor({
  accessToken,
  department,
  extractedFields,
  generatedContent,
  generatedTitle,
  heading = "AI Generated Notice",
  hideRegenerate = false,
  initialPosterUrl = null,
  isArchiving = false,
  isUnarchiving = false,
  isPublishing = false,
  isSavingDraft = false,
  isScheduling = false,
  noticeId,
  onArchive,
  onUnarchive,
  onPublish,
  onRegenerate,
  onSaveDraft,
  onSchedule,
  onSessionExpired,
  archiveError = null,
  archiveSuccess = null,
  unarchiveError = null,
  unarchiveSuccess = null,
  publishError = null,
  publishSuccess = null,
  saveDraftError = null,
  saveDraftSuccess = null,
  scheduleError = null,
  scheduleSuccess = null,
  startEditing = false,
  status = "DRAFT",
  suggestedCategory,
}: GeneratedNoticeEditorProps) {
  const [editedCategory, setEditedCategory] =
    useState<NoticeCategory | null>(null);
  const [editedContent, setEditedContent] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(startEditing);
  const [posterUrl, setPosterUrl] = useState<string | null>(initialPosterUrl);
  const [publishDate, setPublishDate] = useState("");
  const [publishTime, setPublishTime] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const category = editedCategory ?? suggestedCategory;
  const content = editedContent ?? generatedContent;
  const title = editedTitle ?? generatedTitle;
  const canSubmit = title.trim().length > 0 && content.trim().length > 0;
  const canSchedule =
    canSubmit && publishDate.length > 0 && publishTime.length > 0;
  const isReadOnly =
    status === "PUBLISHED" || status === "EXPIRED" || status === "ARCHIVED";
  const canArchive =
    (status === "PUBLISHED" || status === "EXPIRED") && Boolean(onArchive);
  const canUnarchive = status === "ARCHIVED" && Boolean(onUnarchive);
  const isBusy =
    isSavingDraft ||
    isPublishing ||
    isScheduling ||
    isArchiving ||
    isUnarchiving;
  const currentNotice: GeneratedNoticeValue = {
    category,
    content,
    expiresAt: expiryDate ? toEndOfDay(expiryDate) : null,
    imageUrl: posterUrl,
    publishAt:
      publishDate && publishTime
        ? toIsoDateTime(publishDate, publishTime)
        : null,
    title,
  };

  const handleCategoryChange = (event: ChangeEvent<HTMLSelectElement>) => {
    if (isNoticeCategory(event.target.value)) {
      setEditedCategory(event.target.value);
    }
  };

  const handleRegenerate = () => {
    onRegenerate(currentNotice);
  };

  const handleSaveDraft = () => {
    void onSaveDraft(currentNotice);
  };

  const handlePublish = () => {
    void onPublish({
      ...currentNotice,
      publishAt: null,
    });
  };

  const handleSchedule = () => {
    if (!currentNotice.publishAt) {
      return;
    }

    void onSchedule(currentNotice);
  };

  return (
    <section
      aria-labelledby="generated-notice-heading"
      className="mx-auto w-full max-w-4xl space-y-6"
    >
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-card shadow-soft">
        <header className="flex items-center gap-3 border-b bg-secondary/50 px-6 py-4">
          <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles aria-hidden="true" className="size-4" />
          </span>
          <div>
            <p
              className="text-sm font-semibold uppercase tracking-[0.14em]"
              id="generated-notice-heading"
            >
              {heading}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isReadOnly
                ? status === "ARCHIVED"
                  ? "This notice is archived. Unarchive it to make it visible again."
                  : "This notice is already published. You can archive it if it should no longer be visible."
                : startEditing || hideRegenerate
                  ? "Edit the draft, then save or publish."
                  : "Review all details before saving or publishing."}
            </p>
          </div>
        </header>

        <div className="space-y-7 p-6 sm:p-8">
          <div className="space-y-2">
            <Label htmlFor={isEditing ? "notice-title" : undefined}>
              Notice title
            </Label>
            {isEditing && !isReadOnly ? (
              <Input
                id="notice-title"
                onChange={(event) => setEditedTitle(event.target.value)}
                value={title}
              />
            ) : (
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notice-category">Category</Label>
            <select
              className="flex h-11 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:max-w-xs"
              disabled={isReadOnly}
              id="notice-category"
              onChange={handleCategoryChange}
              value={category}
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {isReadOnly ? null : (
              <p className="text-xs leading-5 text-muted-foreground">
                AI-suggested category. Review and change it if needed before
                publishing.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor={isEditing ? "generated-notice-content" : undefined}>
                Notice content
              </Label>
              {isEditing && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                  <Pencil aria-hidden="true" className="size-3.5" />
                  Editing
                </span>
              )}
            </div>

            {isEditing && !isReadOnly ? (
              <Textarea
                className="min-h-72 leading-7"
                id="generated-notice-content"
                onChange={(event) => setEditedContent(event.target.value)}
                value={content}
              />
            ) : (
              <div className="min-h-48 whitespace-pre-wrap rounded-md border bg-background px-5 py-4 text-sm leading-7">
                {content}
              </div>
            )}
          </div>
        </div>
      </div>

      {isReadOnly ? (
        posterUrl ? (
          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft">
            <h2 className="text-sm font-semibold text-slate-900">Poster</h2>
            <img
              alt="Notice poster"
              className="mt-3 max-h-72 w-full rounded-xl object-contain"
              src={posterUrl}
            />
          </section>
        ) : null
      ) : (
        <AttachPoster
          accessToken={accessToken}
          disabled={isBusy}
          noticeId={noticeId}
          onChange={setPosterUrl}
          onSessionExpired={onSessionExpired}
          posterUrl={posterUrl}
        />
      )}

      {isReadOnly ? null : (
        <OptionalNoticeVisual
          accessToken={accessToken}
          category={category}
          department={department}
          extractedFields={extractedFields}
          noticeBody={content}
          noticeId={noticeId}
          onSessionExpired={onSessionExpired}
          title={title}
        />
      )}

      {isReadOnly ? null : (
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft">
        <div className="flex items-center gap-2">
          <CalendarClock aria-hidden="true" className="size-4 text-indigo-600" />
          <h2 className="text-sm font-semibold text-slate-900">Schedule</h2>
        </div>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Set a future date and time, then click Schedule. Leave these empty to
          publish immediately.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="schedule-publish-date">Publish date</Label>
            <Input
              disabled={isBusy}
              id="schedule-publish-date"
              onChange={(event) => setPublishDate(event.target.value)}
              type="date"
              value={publishDate}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="schedule-publish-time">Publish time</Label>
            <Input
              disabled={isBusy}
              id="schedule-publish-time"
              onChange={(event) => setPublishTime(event.target.value)}
              type="time"
              value={publishTime}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="schedule-expiry-date">Expiry date</Label>
            <Input
              disabled={isBusy}
              id="schedule-expiry-date"
              min={publishDate || undefined}
              onChange={(event) => setExpiryDate(event.target.value)}
              type="date"
              value={expiryDate}
            />
          </div>
        </div>
      </section>
      )}

      {isReadOnly ? (
        canArchive || canUnarchive ? (
          <div className="flex justify-end">
            {canArchive ? (
              <Button
                disabled={isBusy}
                onClick={() => {
                  void onArchive?.();
                }}
                type="button"
                variant="outline"
              >
                {isArchiving ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin"
                  />
                ) : (
                  <Archive aria-hidden="true" className="size-4" />
                )}
                {isArchiving ? "Archiving..." : "Archive"}
              </Button>
            ) : null}
            {canUnarchive ? (
              <Button
                disabled={isBusy}
                onClick={() => {
                  void onUnarchive?.();
                }}
                type="button"
                variant="outline"
              >
                {isUnarchiving ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin"
                  />
                ) : (
                  <ArchiveRestore aria-hidden="true" className="size-4" />
                )}
                {isUnarchiving ? "Unarchiving..." : "Unarchive"}
              </Button>
            ) : null}
          </div>
        ) : null
      ) : (
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
        <Button
          disabled={isBusy}
          onClick={() => setIsEditing((current) => !current)}
          type="button"
          variant="outline"
        >
          {isEditing ? (
            <Check aria-hidden="true" className="size-4" />
          ) : (
            <Pencil aria-hidden="true" className="size-4" />
          )}
          {isEditing ? "Done Editing" : "Edit"}
        </Button>

        {hideRegenerate ? null : (
          <Button
            disabled={isBusy}
            onClick={handleRegenerate}
            type="button"
            variant="outline"
          >
            <RefreshCw aria-hidden="true" className="size-4" />
            Regenerate
          </Button>
        )}

        <Button
          disabled={!canSubmit || isBusy}
          onClick={handleSaveDraft}
          type="button"
          variant="outline"
        >
          {isSavingDraft ? (
            <LoaderCircle
              aria-hidden="true"
              className="size-4 animate-spin"
            />
          ) : (
            <FilePenLine aria-hidden="true" className="size-4" />
          )}
          {isSavingDraft ? "Saving..." : "Save Draft"}
        </Button>

        <Button
          disabled={!canSchedule || isBusy}
          onClick={handleSchedule}
          type="button"
          variant="outline"
        >
          {isScheduling ? (
            <LoaderCircle
              aria-hidden="true"
              className="size-4 animate-spin"
            />
          ) : (
            <CalendarClock aria-hidden="true" className="size-4" />
          )}
          {isScheduling ? "Scheduling..." : "Schedule"}
        </Button>

        <Button
          disabled={!canSubmit || isBusy}
          onClick={handlePublish}
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
          {isPublishing ? "Publishing..." : "Publish"}
        </Button>
      </div>
      )}

      {publishSuccess ? (
        <p
          className="flex items-center justify-end gap-2 text-sm text-emerald-700"
          role="status"
        >
          <CheckCircle2 aria-hidden="true" className="size-4 shrink-0" />
          {publishSuccess}
        </p>
      ) : null}

      {publishError ? (
        <p
          className="flex items-center justify-end gap-2 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
          {publishError}
        </p>
      ) : null}

      {saveDraftSuccess ? (
        <p
          className="flex items-center justify-end gap-2 text-sm text-emerald-700"
          role="status"
        >
          <CheckCircle2 aria-hidden="true" className="size-4 shrink-0" />
          {saveDraftSuccess}
        </p>
      ) : null}

      {saveDraftError ? (
        <p
          className="flex items-center justify-end gap-2 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
          {saveDraftError}
        </p>
      ) : null}

      {scheduleSuccess ? (
        <p
          className="flex items-center justify-end gap-2 text-sm text-emerald-700"
          role="status"
        >
          <CheckCircle2 aria-hidden="true" className="size-4 shrink-0" />
          {scheduleSuccess}
        </p>
      ) : null}

      {scheduleError ? (
        <p
          className="flex items-center justify-end gap-2 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
          {scheduleError}
        </p>
      ) : null}

      {archiveSuccess ? (
        <p
          className="flex items-center justify-end gap-2 text-sm text-emerald-700"
          role="status"
        >
          <CheckCircle2 aria-hidden="true" className="size-4 shrink-0" />
          {archiveSuccess}
        </p>
      ) : null}

      {archiveError ? (
        <p
          className="flex items-center justify-end gap-2 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
          {archiveError}
        </p>
      ) : null}

      {unarchiveSuccess ? (
        <p
          className="flex items-center justify-end gap-2 text-sm text-emerald-700"
          role="status"
        >
          <CheckCircle2 aria-hidden="true" className="size-4 shrink-0" />
          {unarchiveSuccess}
        </p>
      ) : null}

      {unarchiveError ? (
        <p
          className="flex items-center justify-end gap-2 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
          {unarchiveError}
        </p>
      ) : null}
    </section>
  );
}
