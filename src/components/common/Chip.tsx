import type { ReactNode } from "react";

export type ChipTone = "accent" | "gold" | "ok" | "bad" | "grey";

export function Chip({ tone = "accent", big, children }: { tone?: ChipTone; big?: boolean; children: ReactNode }) {
  return <span className={["chip", tone === "accent" ? "" : tone, big ? "big" : ""].filter(Boolean).join(" ")}>{children}</span>;
}
