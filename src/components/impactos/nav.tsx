import {
  LayoutGrid,
  Search,
  GitBranch,
  Columns2,
  FileText,
  Fingerprint,
} from "lucide-react";
import type { NavItem } from "@/components/shell";

/** Shared IMPACTOS left-rail navigation. MEDIA → SEARCH → COMPARE → IMPACT. */
export const IMPACTOS_NAV: NavItem[] = [
  { href: "/impactos", label: "Projects", icon: <LayoutGrid size={16} /> },
  { href: "/impactos/search", label: "Search", icon: <Search size={16} /> },
  { href: "/impactos/timeline", label: "Timeline", icon: <GitBranch size={16} /> },
  { href: "/impactos/before-after", label: "Before / After", icon: <Columns2 size={16} /> },
  { href: "/impactos/report", label: "Impact Report", icon: <FileText size={16} /> },
  { href: "/impactos/provenance", label: "Provenance", icon: <Fingerprint size={16} /> },
];
