import { TabBar } from "../components/common/TabBar.tsx";
import type { Route } from "../state/navigation.ts";
import { useApp } from "../state/useApp.ts";
import { Icon } from "../components/common/Icon.tsx";

type Tab = "home" | "progress" | "shop" | "profile";
const TABS = [
  { id: "home" as const, label: "Oefenen", icon: <Icon name="notes" /> },
  { id: "progress" as const, label: "Voortgang", icon: <Icon name="chart-line" /> },
  { id: "shop" as const, label: "Winkel", icon: <Icon name="bag" /> },
  { id: "profile" as const, label: "Profiel", icon: <Icon name="user" /> },
];

/** The bottom tab bar shared by the main screens. */
export function MainTabs({ active }: { active: Tab }) {
  const { nav } = useApp();
  return <TabBar items={TABS} active={active} onSelect={(id) => nav.reset({ name: id } as Route)} />;
}
