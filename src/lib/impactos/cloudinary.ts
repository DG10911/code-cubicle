/**
 * Cloudinary integration surface. Cloudinary is architecturally central:
 * it is the media system of record and the transformation engine. This helper
 * builds real Cloudinary delivery/transformation URLs when a cloud is
 * configured, and falls back to a deterministic placeholder source otherwise,
 * so the demo renders even with zero configuration.
 *
 * Env (server-side only): CLOUDINARY_CLOUD_NAME
 */

const CLOUD = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

export type Transform = {
  w?: number;
  h?: number;
  crop?: "fill" | "fit" | "thumb";
  quality?: "auto" | number;
  format?: "auto" | "webp" | "jpg";
  grayscale?: boolean;
  /** e_improve / e_enhance style visual signal boost for change views. */
  enhance?: boolean;
  gravity?: "auto";
};

/** True when a real Cloudinary cloud is wired up. */
export function cloudinaryConfigured(): boolean {
  return Boolean(CLOUD);
}

/**
 * Build a delivery URL for an asset. When Cloudinary is configured we produce a
 * genuine transformation chain (which preserves the original public_id — the
 * provenance anchor). Otherwise we deterministically map the public_id to a
 * stable placeholder so the layout, timeline and before/after all still work.
 */
export function deliveryUrl(publicId: string, t: Transform = {}): string {
  if (CLOUD) {
    const parts: string[] = [];
    if (t.crop || t.w || t.h) {
      const seg = [
        t.crop && `c_${t.crop}`,
        t.gravity && `g_${t.gravity}`,
        t.w && `w_${t.w}`,
        t.h && `h_${t.h}`,
      ]
        .filter(Boolean)
        .join(",");
      if (seg) parts.push(seg);
    }
    const fx = [
      `q_${t.quality ?? "auto"}`,
      `f_${t.format ?? "auto"}`,
      t.grayscale && "e_grayscale",
      t.enhance && "e_improve",
    ]
      .filter(Boolean)
      .join(",");
    parts.push(fx);
    return `https://res.cloudinary.com/${CLOUD}/image/upload/${parts.join("/")}/${publicId}`;
  }
  // Deterministic placeholder — stable per public_id.
  const seed = publicId.replace(/[^a-z0-9]/gi, "").slice(-8) || "impactos";
  const w = t.w ?? 1200;
  const h = t.h ?? Math.round(w * 0.66);
  const gs = t.grayscale ? "?grayscale" : "";
  return `https://picsum.photos/seed/${seed}/${w}/${h}${gs}`;
}

/** Map application metadata → Cloudinary structured-metadata fields payload. */
export function toStructuredMetadata(meta: Record<string, string | boolean>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(meta)) out[k] = String(v);
  return out;
}
