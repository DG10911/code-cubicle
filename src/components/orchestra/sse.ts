import type { OrchestraEvent } from "@/lib/orchestra/types";

export interface StreamHandlers {
  onEvent: (event: OrchestraEvent) => void;
  onDone: () => void;
  onError: (err: unknown) => void;
  signal?: AbortSignal;
}

/**
 * Consume the ORCHESTRA SSE run stream via fetch + ReadableStream (not
 * EventSource, so we can pass the speed param and abort cleanly). Frames are
 * `event: <TYPE>\ndata: <json>\n\n`; a terminal `event: DONE` ends the stream.
 * Every event we surface is a REAL backend event — the UI derives all progress
 * from these, never a local timer.
 */
export async function streamRun(q: string, speed: number, handlers: StreamHandlers): Promise<void> {
  const { onEvent, onDone, onError, signal } = handlers;
  try {
    const res = await fetch(`/api/orchestra/run?q=${encodeURIComponent(q)}&speed=${speed}`, {
      signal,
      headers: { Accept: "text/event-stream" },
    });
    if (!res.ok || !res.body) throw new Error(`stream failed: ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Split on SSE frame boundaries (blank line).
      let idx: number;
      while ((idx = buffer.indexOf("\n\n")) !== -1) {
        const frame = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        const parsed = parseFrame(frame);
        if (!parsed) continue;
        if (parsed.event === "DONE") {
          onDone();
          return;
        }
        if (parsed.data) {
          try {
            onEvent(JSON.parse(parsed.data) as OrchestraEvent);
          } catch {
            /* ignore malformed data line */
          }
        }
      }
    }
    // Stream ended without an explicit DONE — treat as complete.
    onDone();
  } catch (err) {
    if ((err as { name?: string })?.name === "AbortError") return;
    onError(err);
  }
}

function parseFrame(frame: string): { event: string; data: string } | null {
  let event = "message";
  const dataLines: string[] = [];
  for (const line of frame.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
  }
  if (dataLines.length === 0 && event === "message") return null;
  return { event, data: dataLines.join("\n") };
}
