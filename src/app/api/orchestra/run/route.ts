import { NextRequest } from "next/server";
import { generatePlan } from "@/lib/orchestra/plan";
import { buildDataset } from "@/lib/orchestra/fixtures";
import { buildEventLog } from "@/lib/orchestra/engine";
import { sanitizeQuery } from "@/lib/security";

export const runtime = "nodejs";

/**
 * Server-Sent Events stream of the *actual* deterministic execution log.
 * The frontend derives all progress from these emitted events — no fake timers.
 * `speed` compresses the wall clock for demo pacing (default 0.5×).
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const { value: query } = sanitizeQuery(params.get("q") ?? "");
  const speed = Math.min(4, Math.max(0.2, Number(params.get("speed") ?? "0.5")));

  const plan = generatePlan(query || "companies");
  const records = buildDataset(query || "companies");
  const events = buildEventLog(query || "companies", plan, records);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let prev = 0;
      for (const ev of events) {
        const wait = Math.min(500, (ev.t - prev) * speed);
        prev = ev.t;
        if (wait > 0) await new Promise((r) => setTimeout(r, wait));
        controller.enqueue(encoder.encode(`event: ${ev.type}\ndata: ${JSON.stringify(ev)}\n\n`));
      }
      controller.enqueue(encoder.encode(`event: DONE\ndata: {}\n\n`));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
