import { Command, Radio, Table2, History, Activity } from "lucide-react";
import type { NavItem } from "@/components/shell";

/** Shared ORCHESTRA navigation. Rendered into <AppShell nav={...}>. */
export const ORCHESTRA_NAV: NavItem[] = [
  { href: "/orchestra", label: "Command Center", icon: <Command size={16} /> },
  { href: "/orchestra/run", label: "Run", icon: <Radio size={16} /> },
  { href: "/orchestra/dataset", label: "Dataset", icon: <Table2 size={16} /> },
  { href: "/orchestra/history", label: "History", icon: <History size={16} /> },
  { href: "/orchestra/trace", label: "Trace", icon: <Activity size={16} /> },
];

/** The canonical demo query — used as placeholder + prefill across the story. */
export const DEFAULT_QUERY =
  "Find 100 Indian cybersecurity startups founded after 2022 with verified funding, official website and LinkedIn.";
