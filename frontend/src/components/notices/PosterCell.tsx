import { useState } from "react";
import { ImageOff } from "lucide-react";

interface PosterCellProps {
  posterUrl: string | null;
  title: string;
}

export function PosterCell({ posterUrl, title }: PosterCellProps) {
  const [hasBrokenImage, setHasBrokenImage] = useState(false);

  if (!posterUrl) {
    return <span className="text-xs text-slate-400">None</span>;
  }

  return (
    <a
      className="group inline-flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      href={posterUrl}
      rel="noreferrer"
      target="_blank"
    >
      {hasBrokenImage ? (
        <span className="flex size-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400">
          <ImageOff aria-hidden="true" className="size-4" />
        </span>
      ) : (
        <img
          alt=""
          className="size-10 rounded-lg border border-slate-200 object-cover shadow-sm"
          onError={() => setHasBrokenImage(true)}
          src={posterUrl}
        />
      )}
      <span className="text-xs font-semibold text-indigo-600 group-hover:text-indigo-700">
        View{hasBrokenImage ? ` ${title} poster` : ""}
      </span>
    </a>
  );
}
