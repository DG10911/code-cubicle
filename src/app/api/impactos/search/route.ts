import { NextRequest, NextResponse } from "next/server";
import { semanticSearch } from "@/lib/impactos/search";
import { sanitizeQuery } from "@/lib/security";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { value: query } = sanitizeQuery(req.nextUrl.searchParams.get("q") ?? "");
  const results = semanticSearch(query);
  return NextResponse.json({ query, results });
}
