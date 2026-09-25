"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui";
import { DEFAULT_QUERY } from "@/components/orchestra/nav";

const EXAMPLES = [
  "Find 100 Indian cybersecurity startups founded after 2022 with verified funding, official website and LinkedIn.",
  "Indian fintech companies founded after 2021 with founders and recent activity",
  "European climate startups with verified funding and LinkedIn",
  "US SaaS companies founded after 2020 with founders, location and recent news",
];

export function CommandBox() {
  const router = useRouter();
  const [q, setQ] = useState("");

  const run = () => {
    const query = (q.trim() || DEFAULT_QUERY).trim();
    router.push(`/orchestra/run?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="panel relative overflow-hidden p-5">
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-signal/5 blur-3xl" />
        <div className="relative">
          <label className="flex items-center gap-2 text-2xs font-medium uppercase tracking-[0.18em] text-ink-faint">
            <Sparkles size={13} className="text-signal" />
            Describe the dataset you need
          </label>
          <textarea
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") run();
            }}
            rows={3}
            placeholder={DEFAULT_QUERY}
            className="mt-3 w-full resize-none rounded-xl border border-line bg-base-50 px-4 py-3 text-[15px] leading-relaxed text-ink placeholder:text-ink-ghost focus:border-signal/40 focus:outline-none focus:ring-2 focus:ring-signal/20"
          />
          <div className="mt-4 flex items-center justify-between gap-4">
            <p className="text-2xs text-ink-faint">
              One sentence in. A verified, evidence-backed dataset out. Press{" "}
              <span className="kbd">⌘</span> <span className="kbd">↵</span> to run.
            </p>
            <Button variant="primary" accent="signal" size="lg" onClick={run} className="shrink-0 tracking-wide">
              RUN RESEARCH
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-2xs text-ink-faint">Try:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => setQ(ex)}
            className="chip max-w-full truncate transition-colors hover:border-signal/40 hover:text-ink"
            title={ex}
          >
            {ex.length > 52 ? ex.slice(0, 52) + "…" : ex}
          </button>
        ))}
      </div>
    </div>
  );
}
