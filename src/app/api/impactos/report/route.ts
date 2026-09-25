import { NextRequest, NextResponse } from "next/server";
import { buildReport } from "@/lib/impactos/compare";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("project") ?? "prj-bihar-flood";
  const report = buildReport(projectId);
  if (!report) return NextResponse.json({ error: "Unknown project" }, { status: 404 });
  return NextResponse.json(report);
}
