"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { MoveHorizontal } from "lucide-react";

/**
 * Synchronized before/after comparison with a draggable clip-path handle.
 * Pure React + CSS, no dependencies. The "before" image may be shown subtly
 * desaturated for legibility, but both are the same honest field media.
 */
export function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  beforeLabel = "Before",
  afterLabel = "After",
  className,
}: {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}) {
  const [pos, setPos] = React.useState(50);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const dragging = React.useRef(false);

  const setFromClientX = React.useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, pct)));
  }, []);

  React.useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!dragging.current) return;
      setFromClientX(e.clientX);
    };
    const up = () => {
      dragging.current = false;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [setFromClientX]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative aspect-[16/10] w-full select-none overflow-hidden rounded-xl border border-line",
        className,
      )}
      onPointerDown={(e) => {
        dragging.current = true;
        setFromClientX(e.clientX);
      }}
    >
      {/* After (base layer) */}
      <img
        src={afterUrl}
        alt={afterLabel}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
      <span className="pointer-events-none absolute right-3 top-3 rounded-md border border-impact/30 bg-base-0/75 px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide text-impact backdrop-blur">
        {afterLabel}
      </span>

      {/* Before (clipped overlay via clip-path — image stays full-width) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        <img
          src={beforeUrl}
          alt={beforeLabel}
          className="absolute inset-0 h-full w-full object-cover grayscale-[0.35]"
          draggable={false}
        />
        <span className="absolute left-3 top-3 rounded-md border border-line bg-base-0/75 px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide text-ink-muted backdrop-blur">
          {beforeLabel}
        </span>
      </div>

      {/* Handle */}
      <div
        className="absolute inset-y-0 z-10 w-px -translate-x-1/2 bg-impact"
        style={{ left: `${pos}%` }}
      >
        <button
          type="button"
          aria-label="Drag to compare"
          onPointerDown={(e) => {
            e.stopPropagation();
            dragging.current = true;
          }}
          className="absolute top-1/2 left-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize place-items-center rounded-full border border-impact/50 bg-base-0/85 text-impact shadow-pop backdrop-blur"
        >
          <MoveHorizontal size={16} />
        </button>
      </div>
    </div>
  );
}
