import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NoticeCanvasDownloadProps {
  title: string;
  body: string;
  department?: string;
  category?: string;
  noticeDate?: string;
  className?: string;
}

export function NoticeCanvasDownload({
  title,
  body,
  department = "All Departments",
  category = "GENERAL",
  noticeDate,
  className,
}: NoticeCanvasDownloadProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 1600;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Unable to create canvas context");
      }

      // 1. White Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 1200, 1600);

      // 2. Outer Border (Indigo #6366f1)
      ctx.lineWidth = 16;
      ctx.strokeStyle = "#6366f1";
      ctx.strokeRect(40, 40, 1120, 1520);

      // 3. Inner Decorative Border
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#e2e8f0";
      ctx.strokeRect(60, 60, 1080, 1480);

      // 4. Header Top Bar
      ctx.fillStyle = "#6366f1";
      ctx.fillRect(62, 62, 1076, 120);

      // Header Institution Text
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 34px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("OFFICIAL NOTICE", 600, 120);
      ctx.font = "20px Inter, sans-serif";
      ctx.fillText("DEPARTMENT & INSTITUTIONAL NOTICE PORTAL", 600, 155);

      // 5. Verification Tick Mark drawn as a PATH (no ✓ character)
      const tickCx = 1040;
      const tickCy = 240;
      const tickRadius = 32;

      // Circular badge
      ctx.beginPath();
      ctx.arc(tickCx, tickCy, tickRadius, 0, Math.PI * 2);
      ctx.fillStyle = "#10b981"; // Emerald
      ctx.fill();

      // Checkmark path: start, drop to point, rise up
      ctx.beginPath();
      ctx.moveTo(tickCx - 14, tickCy + 1);
      ctx.lineTo(tickCx - 4, tickCy + 11);
      ctx.lineTo(tickCx + 14, tickCy - 9);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      // "Verified Official" text below tick mark
      ctx.fillStyle = "#059669";
      ctx.font = "bold 14px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("VERIFIED", tickCx, tickCy + 48);

      // 6. Metadata Header Line (Department, Date, Category)
      ctx.textAlign = "left";
      ctx.fillStyle = "#4b5563";
      ctx.font = "bold 20px Inter, sans-serif";

      const formattedDate = noticeDate
        ? new Date(noticeDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

      ctx.fillText(`DEPARTMENT: ${department.toUpperCase()}`, 90, 230);
      ctx.font = "18px Inter, sans-serif";
      ctx.fillText(`DATE: ${formattedDate}   |   CATEGORY: ${category.toUpperCase()}`, 90, 260);

      // Divider line
      ctx.beginPath();
      ctx.moveTo(90, 290);
      ctx.lineTo(1110, 290);
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 2;
      ctx.stroke();

      // 7. Bold Wrapped Title
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 38px Inter, sans-serif";

      const wrapText = (
        text: string,
        x: number,
        startY: number,
        maxWidth: number,
        lineHeight: number,
      ): number => {
        const words = text.split(" ");
        let line = "";
        let currentY = startY;

        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + " ";
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && i > 0) {
            ctx.fillText(line.trim(), x, currentY);
            line = words[i] + " ";
            currentY += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line.trim(), x, currentY);
        return currentY + lineHeight;
      };

      const afterTitleY = wrapText(title, 90, 360, 1020, 52);

      // Small accent line below title
      ctx.fillStyle = "#6366f1";
      ctx.fillRect(90, afterTitleY + 10, 80, 4);

      // 8. Wrapped Body Text
      ctx.fillStyle = "#334155";
      ctx.font = "24px Inter, sans-serif";

      // Split paragraphs by newline
      const paragraphs = body.split("\n");
      let bodyY = afterTitleY + 60;

      for (const para of paragraphs) {
        if (!para.trim()) {
          bodyY += 24; // paragraph gap
          continue;
        }
        bodyY = wrapText(para, 90, bodyY, 1020, 38) + 12;
      }

      // 9. Footer Seal & Authority Mark
      ctx.beginPath();
      ctx.moveTo(90, 1440);
      ctx.lineTo(1110, 1440);
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#64748b";
      ctx.font = "italic 18px Inter, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("Issued by the Office of the Principal — Digital Notice Board", 90, 1480);
      ctx.textAlign = "right";
      ctx.font = "bold 18px Inter, sans-serif";
      ctx.fillText("COLLEGE PRINCIPAL", 1110, 1480);

      // 10. Export to Blob and Trigger Download
      canvas.toBlob((blob) => {
        if (!blob) {
          setIsGenerating(false);
          return;
        }

        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const sanitizedTitle = title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);
        link.download = `Notice_${sanitizedTitle || "Notice"}.png`;
        link.href = objectUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl);
        setIsGenerating(false);
      }, "image/png");
    } catch (err) {
      console.error("Canvas generation failed:", err);
      setIsGenerating(false);
    }
  };

  return (
    <Button
      className={className}
      disabled={isGenerating}
      onClick={handleDownload}
      type="button"
      variant="outline"
    >
      {isGenerating ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Generating PNG...
        </>
      ) : (
        <>
          <Download className="size-4" />
          Download as image
        </>
      )}
    </Button>
  );
}
