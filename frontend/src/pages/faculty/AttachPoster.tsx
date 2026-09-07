import { useRef, useState, type ChangeEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ImagePlus,
  LoaderCircle,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  SessionExpiredError,
  updateNoticePoster,
  uploadPosterFile,
} from "@/lib/noticeApi";

const POSTER_UPLOAD_ERROR = "Couldn't attach the poster, please try again.";
const UNSUPPORTED_TYPE_ERROR = "Choose a JPG or PNG image.";
const FILE_TOO_LARGE_ERROR = "The selected file exceeds the 8 MB size limit.";
const MAXIMUM_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const FILE_INPUT_ACCEPT = "image/jpeg,image/png,.jpg,.jpeg,.png";

const allowedMimeTypes = new Set(["image/jpeg", "image/png"]);
const allowedExtensions = new Set(["jpg", "jpeg", "png"]);

interface AttachPosterProps {
  accessToken: string | null;
  disabled?: boolean;
  noticeId: string | null;
  onChange: (posterUrl: string | null) => void;
  onSessionExpired: () => void;
  posterUrl: string | null;
}

function getFileExtension(fileName: string): string | undefined {
  return fileName.split(".").pop()?.toLowerCase();
}

function validatePosterFile(file: File): string | null {
  const extension = getFileExtension(file.name);
  const hasAllowedExtension =
    extension !== undefined && allowedExtensions.has(extension);
  const hasAllowedMimeType =
    file.type.length === 0 || allowedMimeTypes.has(file.type);

  if (!hasAllowedExtension || !hasAllowedMimeType) {
    return UNSUPPORTED_TYPE_ERROR;
  }

  if (file.size > MAXIMUM_FILE_SIZE_BYTES) {
    return FILE_TOO_LARGE_ERROR;
  }

  return null;
}

export function AttachPoster({
  accessToken,
  disabled = false,
  noticeId,
  onChange,
  onSessionExpired,
  posterUrl,
}: AttachPosterProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const displayedUrl = previewUrl || posterUrl;

  const handleSelectFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const validationError = validatePosterFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsUploading(true);

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    try {
      const uploadedUrl = await uploadPosterFile(file);
      onChange(uploadedUrl);

      if (noticeId && accessToken) {
        await updateNoticePoster(noticeId, accessToken, uploadedUrl);
      }
    } catch (uploadError) {
      URL.revokeObjectURL(localPreview);
      setPreviewUrl(null);

      if (uploadError instanceof SessionExpiredError) {
        onSessionExpired();
        return;
      }

      setError(POSTER_UPLOAD_ERROR);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(null);
    setError(null);
    onChange(null);
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft">
      <header className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
        <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-sm">
          <ImagePlus aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Attach poster</h2>
          <p className="mt-0.5 text-xs leading-5 text-slate-500">
            Optional image for this notice — JPG or PNG, up to 8 MB.
          </p>
        </div>
      </header>

      <div className="space-y-4 p-5">
        <input
          accept={FILE_INPUT_ACCEPT}
          className="sr-only"
          disabled={disabled || isUploading}
          onChange={(event) => {
            void handleSelectFile(event);
          }}
          ref={inputRef}
          type="file"
        />

        {displayedUrl ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <img
              alt="Attached poster preview"
              className="h-36 w-full max-w-56 rounded-xl border border-slate-200 object-cover shadow-sm"
              src={displayedUrl}
            />
            <div className="flex flex-1 flex-col gap-3">
              <p className="flex items-center gap-2 text-xs font-medium text-emerald-700">
                <CheckCircle2 aria-hidden="true" className="size-4 shrink-0" />
                Poster attached
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={disabled || isUploading}
                  onClick={() => inputRef.current?.click()}
                  type="button"
                  variant="outline"
                >
                  Replace
                </Button>
                <Button
                  disabled={disabled || isUploading}
                  onClick={handleRemove}
                  type="button"
                  variant="ghost"
                >
                  <X aria-hidden="true" className="size-4" />
                  Remove
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <button
            className="flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-8 text-center transition-colors hover:border-indigo-300 hover:bg-indigo-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={disabled || isUploading}
            onClick={() => inputRef.current?.click()}
            type="button"
          >
            {isUploading ? (
              <LoaderCircle
                aria-hidden="true"
                className="size-6 animate-spin text-indigo-600"
              />
            ) : (
              <ImagePlus aria-hidden="true" className="size-6 text-indigo-500" />
            )}
            <span className="mt-3 text-sm font-semibold text-slate-800">
              {isUploading ? "Uploading poster..." : "Choose poster image"}
            </span>
            <span className="mt-1 text-xs text-slate-400">
              Click to browse, then the file is stored with this notice.
            </span>
          </button>
        )}

        {error ? (
          <p
            className="flex items-start gap-2 text-xs text-destructive"
            role="alert"
          >
            <AlertCircle
              aria-hidden="true"
              className="mt-0.5 size-3.5 shrink-0"
            />
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}
