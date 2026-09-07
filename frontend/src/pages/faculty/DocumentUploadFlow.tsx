import {
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  CheckCircle2,
  FileText,
  LoaderCircle,
  Pencil,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface DocumentUploadFlowProps {
  extractedText: string;
}

type UploadError = "FILE_TOO_LARGE" | "UNSUPPORTED_TYPE";

const MAXIMUM_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAXIMUM_FILE_SIZE_LABEL = "10 MB";
const MINIMUM_MEANINGFUL_CHARACTERS = 10;
const FILE_INPUT_ACCEPT =
  ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";

const allowedExtensions = new Set(["pdf", "jpg", "jpeg", "png"]);
const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

const uploadErrorMessages: Record<UploadError, string> = {
  FILE_TOO_LARGE: `The selected file exceeds the ${MAXIMUM_FILE_SIZE_LABEL} size limit.`,
  UNSUPPORTED_TYPE:
    "Choose a PDF, JPG, JPEG, or PNG document.",
};

function getFileExtension(fileName: string): string | undefined {
  return fileName.split(".").pop()?.toLowerCase();
}

function validateFile(file: File): UploadError | null {
  const extension = getFileExtension(file.name);
  const hasAllowedExtension =
    extension !== undefined && allowedExtensions.has(extension);
  const hasAllowedMimeType =
    file.type.length === 0 || allowedMimeTypes.has(file.type);

  if (!hasAllowedExtension || !hasAllowedMimeType) {
    return "UNSUPPORTED_TYPE";
  }

  if (file.size > MAXIMUM_FILE_SIZE_BYTES) {
    return "FILE_TOO_LARGE";
  }

  return null;
}

function formatFileSize(sizeInBytes: number): string {
  if (sizeInBytes < 1_024 * 1_024) {
    return `${Math.max(1, Math.round(sizeInBytes / 1_024))} KB`;
  }

  return `${(sizeInBytes / (1_024 * 1_024)).toFixed(1)} MB`;
}

export function DocumentUploadFlow({
  extractedText,
}: DocumentUploadFlowProps) {
  const [editedText, setEditedText] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadError, setUploadError] = useState<UploadError | null>(null);
  const processingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const editableText = editedText ?? extractedText;
  const canGenerate =
    editableText.trim().length > MINIMUM_MEANINGFUL_CHARACTERS;

  useEffect(
    () => () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    },
    [],
  );

  const beginDocumentProcessing = (file: File) => {
    const validationError = validateFile(file);

    if (validationError) {
      setUploadError(validationError);
      return;
    }

    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }

    setEditedText(null);
    setSelectedFile(file);
    setShowPreview(false);
    setUploadError(null);
    setIsUploading(true);

    // TEMP_DOCUMENT_PROCESSING_DELAY: Replace with the real upload and Textract lifecycle.
    processingTimeoutRef.current = setTimeout(() => {
      setIsUploading(false);
      setShowPreview(true);
    }, 1_200);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const [file] = Array.from(event.target.files ?? []);

    if (file) {
      beginDocumentProcessing(file);
    }

    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const [file] = Array.from(event.dataTransfer.files);

    if (file) {
      beginDocumentProcessing(file);
    }
  };

  const handleDropZoneKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      document.getElementById("notice-document")?.click();
    }
  };

  const resetUpload = () => {
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }

    setEditedText(null);
    setIsUploading(false);
    setSelectedFile(null);
    setShowPreview(false);
    setUploadError(null);
  };

  if (showPreview && selectedFile) {
    return (
      <section
        aria-labelledby="extracted-content-heading"
        className="overflow-hidden rounded-xl border bg-white shadow-sm"
      >
        <div className="flex flex-col gap-4 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p
              className="text-xs font-semibold text-slate-800"
              id="extracted-content-heading"
            >
              Extracted Document Content
            </p>
            <p className="mt-1 text-[0.65rem] text-slate-400">
              {selectedFile.name}
            </p>
          </div>
          <Button onClick={resetUpload} size="sm" variant="ghost">
            <X aria-hidden="true" className="size-4" />
            Choose another file
          </Button>
        </div>

        <div className="space-y-5 p-5">
          <Textarea
            aria-label="Extracted document content"
            className="min-h-64"
            onChange={(event) => setEditedText(event.target.value)}
            placeholder="Extracted document content will appear here."
            ref={textareaRef}
            value={editableText}
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              onClick={() => textareaRef.current?.focus()}
              type="button"
              variant="outline"
            >
              <Pencil aria-hidden="true" className="size-4" />
              Edit Text
            </Button>
            <Button
              className="bg-indigo-600 text-white hover:bg-indigo-700"
              disabled={!canGenerate}
              size="lg"
              type="button"
            >
              <Sparkles aria-hidden="true" className="size-4" />
              Generate Notice
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div
        aria-label="Document upload area"
        className={cn(
          "flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-white px-6 py-12 text-center shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isDragging
            ? "border-indigo-400 bg-indigo-50/40"
            : "border-slate-200 hover:border-indigo-300",
          isUploading && "cursor-wait",
        )}
        onClick={() => {
          if (!isUploading) {
            document.getElementById("notice-document")?.click();
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        onKeyDown={handleDropZoneKeyDown}
        role="button"
        tabIndex={0}
      >
        {isUploading && selectedFile ? (
          <>
            <span className="flex size-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <LoaderCircle
                aria-hidden="true"
                className="size-5 animate-spin"
              />
            </span>
            <p className="mt-4 text-sm font-semibold text-slate-800">
              Processing {selectedFile.name}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Preparing the document for text extraction.
            </p>
            <div
              aria-label="Document processing in progress"
              className="mt-5 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-indigo-50"
              role="progressbar"
            >
              <div className="h-full w-1/2 animate-pulse rounded-full bg-indigo-600" />
            </div>
          </>
        ) : (
          <>
            <span className="flex size-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <Upload aria-hidden="true" className="size-5" />
            </span>
            <p className="mt-4 text-sm font-semibold text-slate-800">
              Drag and drop your document here
            </p>
            <p className="mt-1 text-xs text-slate-400">
              or choose a file from your device
            </p>
            <Button
              asChild
              className="mt-5"
              onClick={(event) => event.stopPropagation()}
              variant="outline"
            >
              <label htmlFor="notice-document">Browse files</label>
            </Button>
            <p className="mt-4 text-[0.65rem] text-slate-400">
              PDF, JPG, JPEG, or PNG · Maximum {MAXIMUM_FILE_SIZE_LABEL}
            </p>
          </>
        )}
      </div>

      <input
        accept={FILE_INPUT_ACCEPT}
        className="sr-only"
        disabled={isUploading}
        id="notice-document"
        onChange={handleFileChange}
        type="file"
      />

      {uploadError && (
        <div
          className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          <FileText aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <p>{uploadErrorMessages[uploadError]}</p>
        </div>
      )}

      {selectedFile && !isUploading && !showPreview && (
        <div className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm">
          <CheckCircle2
            aria-hidden="true"
            className="size-4 text-emerald-600"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">
              {selectedFile.name}
            </p>
            <p className="text-[0.65rem] text-slate-400">
              {formatFileSize(selectedFile.size)}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
