import { cn } from "@/lib/utils";
import type { NoticeCategory, NoticeTemplate } from "@/types";

interface NoticePreviewProps {
  category: NoticeCategory;
  content: string;
  imageUrl: string | null;
  template: NoticeTemplate;
  title: string;
}

interface TemplateStyle {
  accentClassName: string;
  cardClassName: string;
  contentClassName: string;
  label: string;
  titleClassName: string;
}

const categoryLabels: Record<NoticeCategory, string> = {
  EXAMINATION: "Examination",
  WORKSHOP: "Workshop",
  SEMINAR: "Seminar",
  PLACEMENT: "Placement",
  SPORTS: "Sports",
  CULTURAL: "Cultural",
  GENERAL: "General",
};

const templateStyles: Record<NoticeTemplate, TemplateStyle> = {
  FORMAL_ACADEMIC: {
    accentClassName: "bg-primary",
    cardClassName: "border-slate-200 bg-white",
    contentClassName: "font-serif leading-8 text-slate-700",
    label: "Formal Academic",
    titleClassName: "font-serif text-slate-950",
  },
  CIRCULAR: {
    accentClassName: "bg-slate-800",
    cardClassName: "border-2 border-slate-300 bg-white",
    contentClassName: "leading-7 text-slate-700",
    label: "Circular",
    titleClassName: "uppercase tracking-[0.08em] text-slate-950",
  },
  EVENT: {
    accentClassName: "bg-violet-500",
    cardClassName: "border-violet-200 bg-violet-50/30",
    contentClassName: "leading-7 text-slate-700",
    label: "Event",
    titleClassName: "text-violet-950",
  },
  PLACEMENT: {
    accentClassName: "bg-emerald-600",
    cardClassName: "border-emerald-200 bg-emerald-50/30",
    contentClassName: "leading-7 text-slate-700",
    label: "Placement",
    titleClassName: "text-emerald-950",
  },
};

export function NoticePreview({
  category,
  content,
  imageUrl,
  template,
  title,
}: NoticePreviewProps) {
  const styles = templateStyles[template];

  return (
    <article
      aria-label={`${styles.label} notice preview`}
      className={cn(
        "overflow-hidden rounded-lg border shadow-soft",
        styles.cardClassName,
      )}
    >
      {imageUrl && (
        <img
          alt={`Visual for ${title}`}
          className="max-h-48 w-full object-cover"
          src={imageUrl}
        />
      )}

      <div className={cn("h-1.5", styles.accentClassName)} />

      <div className="p-7 sm:p-10">
        <div className="flex flex-col gap-4 border-b border-current/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Department Notice
            </p>
            <h2
              className={cn(
                "mt-3 text-2xl font-semibold leading-tight tracking-tight",
                styles.titleClassName,
              )}
            >
              {title}
            </h2>
          </div>
          <span className="w-fit rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            {categoryLabels[category]}
          </span>
        </div>

        <div
          className={cn(
            "whitespace-pre-wrap pt-7 text-sm",
            styles.contentClassName,
          )}
        >
          {content}
        </div>
      </div>
    </article>
  );
}
