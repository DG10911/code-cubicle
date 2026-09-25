import { NextRequest, NextResponse } from "next/server";
import { generatePlan } from "@/lib/orchestra/plan";
import { sanitizeQuery } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const raw = typeof body.query === "string" ? body.query : "";
  const { value: query, flagged } = sanitizeQuery(raw);
  if (!query) return NextResponse.json({ error: "Empty query" }, { status: 400 });
  const plan = generatePlan(query);
  return NextResponse.json({ plan, query, injectionFlagged: flagged });
}
