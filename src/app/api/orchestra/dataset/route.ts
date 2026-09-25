import { NextRequest, NextResponse } from "next/server";
import { generatePlan } from "@/lib/orchestra/plan";
import { buildDataset, summarize } from "@/lib/orchestra/fixtures";
import { buildTraces } from "@/lib/orchestra/engine";
import { sanitizeQuery } from "@/lib/security";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { value: query } = sanitizeQuery(req.nextUrl.searchParams.get("q") ?? "");
  const q = query || "companies";
  const plan = generatePlan(q);
  const records = buildDataset(q);
  const traces = buildTraces(plan, records);
  const summary = summarize(q, records, "COMPLETED", "TASK-LIVE", new Date().toISOString());
  return NextResponse.json({ query: q, plan, records, traces, summary });
}
