import { AppShell } from "@/components/shell";
import { IMPACTOS_NAV } from "@/components/impactos/nav";
import { CloudinaryIndicator } from "@/components/impactos/cloudinary-indicator";
import { Panel, PanelHeader, Badge, Stat } from "@/components/ui";
import { ASSETS, getProject } from "@/lib/impactos/fixtures";
import { deliveryUrl, cloudinaryConfigured } from "@/lib/impactos/cloudinary";
import { phaseLabel } from "@/components/impactos/asset-card";
import { Fingerprint, CheckCircle2, XCircle, ShieldCheck, Layers } from "lucide-react";

export default function ProvenancePage() {
  const configured = cloudinaryConfigured();
  const verified = ASSETS.filter((a) => a.structuredMetadata.verified).length;

  // Demonstrate that transforms preserve the anchor: same public_id, many derivatives.
  const demo = ASSETS.find((a) => a.id === "IMG_1042") ?? ASSETS[0];
  const derivatives = [
    { label: "Thumbnail", t: { w: 160, h: 160, crop: "thumb" as const } },
    { label: "Gallery fill", t: { w: 600, h: 400, crop: "fill" as const, gravity: "auto" as const } },
    { label: "Grayscale (before-view)", t: { w: 600, h: 400, crop: "fill" as const, grayscale: true } },
    { label: "Enhanced (change-view)", t: { w: 600, h: 400, crop: "fill" as const, enhance: true } },
  ];

  return (
    <AppShell
      product="impactos"
      nav={IMPACTOS_NAV}
      title="Asset Provenance"
      right={<CloudinaryIndicator configured={configured} />}
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-ink">Traceability inspector</h2>
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">
            Cloudinary is the media system of record. Every asset — and every derivative built from it — is
            anchored to a single <span className="mono-num text-impact">original_asset_id</span> (the Cloudinary
            public_id), preserved through every transformation.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Assets tracked" value={ASSETS.length} accent="impact" />
          <Stat label="Verified" value={`${verified}/${ASSETS.length}`} accent="impact" />
          <Stat label="Anchor field" value="original_asset_id" />
          <Stat label="System of record" value="Cloudinary" accent="impact" />
        </div>

        {/* Transformation lineage demo */}
        <Panel>
          <PanelHeader
            title="Transformation lineage"
            subtitle="One source asset, many derivatives — the public_id survives in every delivery URL."
            icon={<Layers size={16} />}
            right={<Badge tone="impact">{demo.id}</Badge>}
          />
          <div className="p-5">
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-impact/25 bg-impact/5 px-4 py-3">
              <Fingerprint size={15} className="mt-0.5 shrink-0 text-impact" />
              <div className="min-w-0">
                <div className="text-2xs uppercase tracking-wider text-ink-faint">original_asset_id</div>
                <p className="mono-num mt-0.5 break-all text-sm text-impact">{demo.originalAssetId}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {derivatives.map((d) => {
                const url = deliveryUrl(demo.originalAssetId, d.t);
                return (
                  <div key={d.label} className="panel-inset overflow-hidden">
                    <img
                      src={url}
                      alt={d.label}
                      width={600}
                      height={400}
                      className="aspect-[3/2] w-full object-cover"
                    />
                    <div className="p-3">
                      <div className="text-xs font-medium text-ink">{d.label}</div>
                      <p className="mono-num mt-1 break-all text-2xs leading-relaxed text-ink-faint">{url}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-2xs text-ink-faint">
              Note how each URL applies different transformations yet ends in the same public_id — the anchor is
              never lost.
            </p>
          </div>
        </Panel>

        {/* Full provenance table */}
        <Panel>
          <PanelHeader
            title="Asset ledger"
            subtitle="Every tracked asset with its provenance anchor and verification state."
            icon={<ShieldCheck size={16} />}
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-xs">
              <thead className="border-b border-line bg-base-50 text-2xs uppercase tracking-wider text-ink-faint">
                <tr>
                  <th className="px-4 py-3 font-medium">Asset id</th>
                  <th className="px-4 py-3 font-medium">original_asset_id</th>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Phase</th>
                  <th className="px-4 py-3 font-medium">Captured</th>
                  <th className="px-4 py-3 font-medium">Verified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {ASSETS.map((a) => {
                  const project = getProject(a.projectId);
                  return (
                    <tr key={a.id} className="hover:bg-base-100/60">
                      <td className="mono-num px-4 py-3 text-ink">{a.id}</td>
                      <td className="mono-num px-4 py-3 text-impact">
                        <span className="flex items-center gap-1.5">
                          <Fingerprint size={11} className="shrink-0" /> {a.originalAssetId}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{project?.name ?? a.projectId}</td>
                      <td className="px-4 py-3">
                        <Badge tone="neutral">{phaseLabel(a.structuredMetadata.phase)}</Badge>
                      </td>
                      <td className="mono-num px-4 py-3 text-ink-faint">
                        {new Date(a.capturedAt).toISOString().slice(0, 10)}
                      </td>
                      <td className="px-4 py-3">
                        {a.structuredMetadata.verified ? (
                          <span className="flex items-center gap-1.5 text-impact">
                            <CheckCircle2 size={13} /> Verified
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-ink-faint">
                            <XCircle size={13} /> Unverified
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
