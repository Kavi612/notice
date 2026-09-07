import { useState } from "react";
import {
  Download,
  FileSpreadsheet,
  LoaderCircle,
  Presentation,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/config";

import type { ExtractedNoticeFields } from "./GeneratedNoticeRoute";

const VISUAL_UNAVAILABLE_ERROR =
  "Visual generation unavailable — you can try again later";
const LINK_EXPIRED_ERROR =
  "Link expired — click Generate Visual again";
const SAVE_DRAFT_FIRST_ERROR =
  "Save the draft first, then generate a PowerPoint visual.";
const SESSION_EXPIRED_ERROR =
  "Your session expired, please log in again";
const DOWNLOAD_URL_TTL_MS = 10 * 60 * 1000;

interface GeneratedVisual {
  createdAt: number;
  downloadUrl: string;
  s3Key: string;
}

interface OptionalNoticeVisualProps {
  accessToken: string | null;
  category: string;
  department: string;
  extractedFields?: ExtractedNoticeFields;
  noticeBody: string;
  noticeId: string | null;
  onSessionExpired: () => void;
  title: string;
}

function buildVisualRequestBody({
  category,
  department,
  extractedFields,
  noticeBody,
  title,
}: {
  category: string;
  department: string;
  extractedFields?: ExtractedNoticeFields;
  noticeBody: string;
  title: string;
}) {
  const body: Record<string, unknown> = {
    title,
    category,
    department,
    noticeBody,
  };

  if (extractedFields?.date) body.date = extractedFields.date;
  if (extractedFields?.time) body.time = extractedFields.time;
  if (extractedFields?.venue) body.venue = extractedFields.venue;
  if (extractedFields?.subjects?.length) {
    body.subjects = extractedFields.subjects;
  }
  if (extractedFields?.resourcePersons?.length) {
    body.resourcePersons = extractedFields.resourcePersons;
  }
  if (extractedFields?.companyName) {
    body.companyName = extractedFields.companyName;
  }
  if (extractedFields?.eligibility) {
    body.eligibility = extractedFields.eligibility;
  }
  if (extractedFields?.coordinators?.length) {
    body.coordinators = extractedFields.coordinators;
  }

  return body;
}

export function OptionalNoticeVisual({
  accessToken,
  category,
  department,
  extractedFields,
  noticeBody,
  noticeId,
  onSessionExpired,
  title,
}: OptionalNoticeVisualProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [visual, setVisual] = useState<GeneratedVisual | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateVisual = async () => {
    if (isGenerating) {
      return;
    }

    if (!noticeId) {
      setError(SAVE_DRAFT_FIRST_ERROR);
      return;
    }

    if (!accessToken) {
      setError(SESSION_EXPIRED_ERROR);
      onSessionExpired();
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/notices/generate-visual`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            buildVisualRequestBody({
              category,
              department,
              extractedFields,
              noticeBody,
              title,
            }),
          ),
        },
      );

      if (response.status === 401) {
        setError(SESSION_EXPIRED_ERROR);
        onSessionExpired();
        return;
      }

      if (!response.ok) {
        setError(VISUAL_UNAVAILABLE_ERROR);
        return;
      }

      const payload = (await response.json()) as {
        downloadUrl?: string;
        s3Key?: string;
      };

      if (!payload.downloadUrl || !payload.s3Key) {
        setError(VISUAL_UNAVAILABLE_ERROR);
        return;
      }

      setVisual({
        createdAt: Date.now(),
        downloadUrl: payload.downloadUrl,
        s3Key: payload.s3Key,
      });
    } catch {
      setError(VISUAL_UNAVAILABLE_ERROR);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!visual) {
      return;
    }

    if (Date.now() - visual.createdAt >= DOWNLOAD_URL_TTL_MS) {
      setError(LINK_EXPIRED_ERROR);
      return;
    }

    window.open(visual.downloadUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <aside
      aria-labelledby="optional-visual-heading"
      className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/30 p-5 shadow-soft sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            className="text-sm font-medium text-foreground"
            id="optional-visual-heading"
          >
            <Sparkles
              aria-hidden="true"
              className="mr-2 inline size-3.5 text-primary"
            />
            Generate Visual (PowerPoint)
            <span className="ml-1 font-normal text-muted-foreground">
              (optional)
            </span>
          </h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Create an editable .pptx notice poster. Save the draft first.
            Save and Publish still work if you skip this.
          </p>
        </div>

        <Button
          disabled={isGenerating}
          onClick={() => {
            void generateVisual();
          }}
          size="sm"
          type="button"
          variant="outline"
        >
          {isGenerating ? (
            <LoaderCircle
              aria-hidden="true"
              className="size-4 animate-spin"
            />
          ) : (
            <Presentation aria-hidden="true" className="size-4" />
          )}
          {isGenerating
            ? "Generating..."
            : visual
              ? "Generate again"
              : "Generate Visual (PowerPoint)"}
        </Button>
      </div>

      {error ? (
        <div
          className="mt-5 flex flex-col gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          role="status"
        >
          <p className="text-xs leading-5 text-amber-800">{error}</p>
          {error === VISUAL_UNAVAILABLE_ERROR ||
          error === LINK_EXPIRED_ERROR ? (
            <Button
              disabled={isGenerating}
              onClick={() => {
                void generateVisual();
              }}
              size="sm"
              type="button"
              variant="ghost"
            >
              <RefreshCw aria-hidden="true" className="size-3.5" />
              Try again
            </Button>
          ) : null}
        </div>
      ) : null}

      {visual ? (
        <div className="mt-5 flex flex-col gap-3 rounded-md border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-orange-50 text-orange-700">
              <FileSpreadsheet aria-hidden="true" className="size-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">{title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                PowerPoint visual (.pptx)
              </p>
            </div>
          </div>
          <Button
            onClick={handleDownload}
            size="sm"
            type="button"
            variant="outline"
          >
            <Download aria-hidden="true" className="size-4" />
            Download PPT
          </Button>
        </div>
      ) : null}
    </aside>
  );
}
