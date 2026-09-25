import { NextRequest, NextResponse } from "next/server";
import { generatePlan } from "@/lib/orchestra/plan";
import { buildDataset } from "@/lib/orchestra/fixtures";
import { sanitizeQuery } from "@/lib/security";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const { value: query } = sanitizeQuery(p.get("q") ?? "");
  const format = p.get("format") === "csv" ? "csv" : "json";
  const onlyPublishable = p.get("publishable") === "1";
  const q = query || "companies";
  const plan = generatePlan(q);
  let records = buildDataset(q);
  if (onlyPublishable) records = records.filter((r) => r.status === "publishable");

  if (format === "json") {
    return new NextResponse(JSON.stringify({ query: q, generatedAt: new Date().toISOString(), records }, null, 2), {
      headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="orchestra-dataset.json"` },
    });
  }

  const cols = plan.schema.map((s) => s.key);
  const header = [...cols, "overallConfidence", "status"].join(",");
  const rows = records.map((r) =>
    [...cols.map((c) => csv(r.fields[c])), r.overallConfidence, r.status].join(","),
  );
  const body = [header, ...rows].join("\n");
  return new NextResponse(body, {
    headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="orchestra-dataset.csv"` },
  });
}

function csv(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
