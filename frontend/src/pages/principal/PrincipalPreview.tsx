import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { NoticeCanvasDownload } from "@/components/NoticeCanvasDownload";
import { Button } from "@/components/ui/button";
import { NoticePreview } from "@/pages/faculty/NoticePreview";
import type { NoticeCategory, NoticeTemplate } from "@/types";

interface StoredPreviewData {
  title: string;
  body: string;
  department: string;
  category: NoticeCategory;
  template: NoticeTemplate;
  noticeDate?: string;
}

export function PrincipalPreview() {
  const navigate = useNavigate();
  const [previewData, setPreviewData] = useState<StoredPreviewData | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("principal_preview_notice");
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as StoredPreviewData;
        setPreviewData(parsed);
      } catch {
        setPreviewData(null);
      }
    }
  }, []);

  const fallbackData: StoredPreviewData = {
    title: "Official Institutional Notice",
    body: "No notice content has been drafted yet for preview. Return to the Create Notice screen to draft your notice.",
    department: "Office of the Principal",
    category: "GENERAL",
    template: "FORMAL_ACADEMIC",
  };

  const data = previewData || fallbackData;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          to="/principal/create-notice"
        >
          <ArrowLeft className="size-4" />
          Back to Create Notice
        </Link>

        <div className="flex items-center gap-3">
          <NoticeCanvasDownload
            body={data.body}
            category={data.category}
            department={data.department}
            noticeDate={data.noticeDate}
            title={data.title}
          />
          <Button
            className="bg-indigo-600 text-white hover:bg-indigo-700"
            onClick={() => navigate("/principal/create-notice")}
            type="button"
          >
            Continue Editing
          </Button>
        </div>
      </div>

      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
          Visual Preview
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          Notice Preview
        </h1>
        <p className="text-sm text-slate-500">
          This is exactly how your notice appears on the institutional portal and in downloaded exports.
        </p>
      </header>

      {/* Reusing existing NoticePreview card component directly */}
      <NoticePreview
        category={data.category}
        content={data.body}
        imageUrl={null}
        template={data.template}
        title={data.title}
      />
    </div>
  );
}
