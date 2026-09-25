/**
 * Shared security utilities. These are deliberately deterministic and used by
 * both products. External web content and user prompts are treated as untrusted
 * data — never as instructions to execute.
 */

const INJECTION_PATTERNS = [
  /ignore (all |the )?(previous|prior|above) (instructions|prompts)/i,
  /disregard (your|the) (rules|instructions|system prompt)/i,
  /you are now/i,
  /reveal (your|the) (system prompt|instructions|api key)/i,
  /print (your|the) (secret|key|token|env)/i,
  /\bexfiltrate\b/i,
  /<\s*script/i,
  /run the following (command|code)/i,
];

// Control characters (C0 range + DEL) neutralized without embedding raw bytes.
const CONTROL_CHARS = new RegExp("[\\u0000-\\u001F\\u007F]", "g");

export function sanitizeQuery(raw: string): { value: string; flagged: boolean } {
  const cleaned = (raw ?? "").replace(CONTROL_CHARS, " ");
  const trimmed = cleaned.slice(0, 500).replace(/\s+/g, " ").trim();
  const flagged = INJECTION_PATTERNS.some((p) => p.test(trimmed));
  return { value: trimmed, flagged };
}

/** Detect prompt-injection embedded inside retrieved page text. */
export function scanRetrievedContent(text: string): { safe: boolean; reasons: string[] } {
  const reasons: string[] = [];
  for (const p of INJECTION_PATTERNS) {
    if (p.test(text)) reasons.push(p.source);
  }
  return { safe: reasons.length === 0, reasons };
}

const BLOCKED_HOSTS = [
  /^localhost$/i,
  /^127\./,
  /^0\.0\.0\.0$/,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /\.internal$/i,
  /^metadata\./i,
];

/** SSRF guard — only http(s), never private/link-local address space. */
export function isSafeUrl(input: string): { ok: boolean; reason?: string } {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return { ok: false, reason: "invalid_url" };
  }
  if (!/^https?:$/.test(url.protocol)) return { ok: false, reason: "bad_protocol" };
  if (BLOCKED_HOSTS.some((re) => re.test(url.hostname))) return { ok: false, reason: "private_host" };
  return { ok: true };
}

export const ALLOWED_UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime"];

export function isAllowedUpload(mime: string): boolean {
  return ALLOWED_UPLOAD_TYPES.includes(mime);
}
