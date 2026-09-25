import { NextResponse } from "next/server";
import { PROJECTS } from "@/lib/impactos/fixtures";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ projects: PROJECTS });
}
