import { cn } from "@/lib/utils";
import { Cloud, CloudOff } from "lucide-react";

/**
 * Honest Cloudinary status pill. `configured` is computed on the server via
 * cloudinaryConfigured(); we never fake a live integration. When no cloud is
 * wired up we say so plainly — delivery falls back to deterministic fixtures.
 */
export function CloudinaryIndicator({ configured }: { configured: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-2xs font-medium",
        configured
          ? "border-impact/30 bg-impact/10 text-impact"
          : "border-line bg-base-200 text-ink-muted",
      )}
      title={
        configured
          ? "Cloudinary cloud configured — delivering real transformation URLs"
          : "No Cloudinary cloud configured — delivering deterministic fixture placeholders"
      }
    >
      {configured ? <Cloud size={12} /> : <CloudOff size={12} />}
      {configured ? "Cloudinary connected" : "Cloudinary (fixture delivery)"}
    </span>
  );
}
