import { TabBar } from "../components/common/TabBar.tsx";
import type { Route } from "../state/navigation.ts";
import { useApp } from "../state/useApp.ts";

type Tab = "home" | "progress" | "profile";
const TABS = [
  { id: "home" as const, label: "Oefenen", icon: "🎵" },
  { id: "progress" as const, label: "Voortgang", icon: "📈" },
  { id: "profile" as const, label: "Profiel", icon: "👤" },
];

/** The bottom tab bar shared by the main screens. */
export function MainTabs({ active }: { active: Tab }) {
  const { nav } = useApp();
  return <TabBar items={TABS} active={active} onSelect={(id) => nav.reset({ name: id } as Route)} />;
}
