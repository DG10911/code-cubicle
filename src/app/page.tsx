import Link from "next/link";
import { Database, FlaskConical, ArrowRight, ShieldCheck, GitBranch, Layers } from "lucide-react";

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-[0.35]" />
      <div className="relative mx-auto max-w-6xl px-6 py-16">
        {/* Nav */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <span className="grid h-6 w-6 place-items-center rounded-md border border-line bg-base-200 text-2xs">CC</span>
            Intelligence Console
          </div>
          <span className="chip">Code Cubicle 6.0 · Winner Mode</span>
        </div>

        {/* Hero */}
        <div className="mx-auto mt-20 max-w-3xl text-center">
          <div className="animate-fade-up text-2xs font-medium uppercase tracking-[0.2em] text-ink-faint">
            Evidence-first AI, not another wrapper
          </div>
          <h1 className="mt-4 animate-fade-up text-balance text-5xl font-semibold leading-[1.05] tracking-tight">
            Turn questions and field media into{" "}
            <span className="bg-gradient-to-r from-signal to-impact bg-clip-text text-transparent">verifiable intelligence</span>.
          </h1>
          <p className="mx-auto mt-5 max-w-xl animate-fade-up text-pretty text-[15px] leading-relaxed text-ink-muted">
            Two products, one principle: every answer carries its provenance, its confidence, and its uncertainty — so a
            skeptical judge can click any claim down to its source.
          </p>
        </div>

        {/* Product cards */}
        <div className="mt-16 grid gap-5 md:grid-cols-2">
          <ProductCard
            href="/orchestra"
            accent="signal"
            icon={<Database size={20} />}
            name="ORCHESTRA"
            tagline="From one sentence to a verified dataset."
            body="A data-intelligence OS. A natural-language request becomes a dynamic research plan, an event-driven multi-agent run, and a dataset where every field links to its source, confidence, and conflicts."
            flow={["Question", "Plan", "Research", "Verify", "Evidence", "Dataset"]}
          />
          <ProductCard
            href="/impactos"
            accent="impact"
            icon={<FlaskConical size={20} />}
            name="IMPACTOS"
            tagline="Turn field media into evidence of impact."
            body="Visual evidence intelligence on Cloudinary. Photos and videos become a searchable evidence graph with observations, timelines, before/after comparison, and traceable impact reports — observed, never assumed causal."
            flow={["Media", "Understand", "Organize", "Search", "Compare", "Impact"]}
          />
        </div>

        {/* Credibility strip */}
        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          <Cred icon={<ShieldCheck size={16} />} title="Provenance by default" body="Every non-null field is bound to a source snippet, type, reliability, and retrieval time." />
          <Cred icon={<GitBranch size={16} />} title="Deterministic where it counts" body="LLMs reason; typed code validates, dedupes, scores, and drives an explicit state machine." />
          <Cred icon={<Layers size={16} />} title="Sponsors, architecturally" body="Cloudinary as media system-of-record; hybrid retrieval, streaming ETL and workflow orchestration where they earn their place." />
        </div>

        <footer className="mt-20 flex items-center justify-between border-t border-line pt-6 text-2xs text-ink-faint">
          <span>Deterministic fixture demo · resilient to API / network loss</span>
          <span>Submission deadline · 2026-09-30</span>
        </footer>
      </div>
    </div>
  );
}

function ProductCard({
  href,
  accent,
  icon,
  name,
  tagline,
  body,
  flow,
}: {
  href: string;
  accent: "signal" | "impact";
  icon: React.ReactNode;
  name: string;
  tagline: string;
  body: string;
  flow: string[];
}) {
  return (
    <Link
      href={href}
      className="group panel relative flex flex-col overflow-hidden p-6 transition-all hover:border-line-strong"
    >
      <div
        className={`absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl transition-opacity group-hover:opacity-100 ${
          accent === "signal" ? "bg-signal/10" : "bg-impact/10"
        } opacity-60`}
      />
      <div className="relative flex items-center justify-between">
        <div
          className={`grid h-11 w-11 place-items-center rounded-xl text-base-0 ${
            accent === "signal" ? "bg-signal" : "bg-impact"
          }`}
        >
          {icon}
        </div>
        <ArrowRight size={18} className="text-ink-faint transition-transform group-hover:translate-x-1 group-hover:text-ink" />
      </div>
      <h2 className="relative mt-5 text-xl font-semibold tracking-tight">{name}</h2>
      <p className={`relative mt-1 text-sm font-medium ${accent === "signal" ? "text-signal" : "text-impact"}`}>{tagline}</p>
      <p className="relative mt-3 text-sm leading-relaxed text-ink-muted">{body}</p>
      <div className="relative mt-5 flex flex-wrap items-center gap-1.5">
        {flow.map((f, i) => (
          <span key={f} className="flex items-center gap-1.5">
            <span className="chip">{f}</span>
            {i < flow.length - 1 && <span className="text-ink-ghost">→</span>}
          </span>
        ))}
      </div>
    </Link>
  );
}

function Cred({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="panel-inset p-4">
      <div className="flex items-center gap-2 text-ink">
        <span className="text-ink-faint">{icon}</span>
        <span className="text-sm font-medium">{title}</span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-ink-faint">{body}</p>
    </div>
  );
}
