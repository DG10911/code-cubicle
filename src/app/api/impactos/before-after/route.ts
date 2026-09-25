import { NextRequest, NextResponse } from "next/server";
import { buildBeforeAfter } from "@/lib/impactos/compare";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const project = params.get("project") ?? "prj-bihar-flood";
  const before = params.get("before") ?? "baseline";
  const after = params.get("after") ?? "post_project";

  const result = buildBeforeAfter(project, before, after);
  if (!result) {
    return NextResponse.json(
      { error: "No before/after pair found for the requested phases" },
      { status: 404 },
    );
  }
  return NextResponse.json(result);
}
