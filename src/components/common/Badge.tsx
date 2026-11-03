import type { BadgeDef } from "../../engine/game/badges.ts";
import { Icon } from "./Icon.tsx";
import { ICON_NAMES, type IconName } from "./icons.tsx";

const isIcon = (s: string): s is IconName => (ICON_NAMES as readonly string[]).includes(s);

/**
 * A badge: a gold disc with a big icon for its subject and a small mark in the corner for what was achieved
 * (an icon, a number or ♯), with the title underneath. Grey when not earned yet. With `onClick` it is a button.
 */
export function Badge({ badge, earned = true, pop, onClick }: { badge: BadgeDef; earned?: boolean; pop?: boolean; onClick?: () => void }) {
  const cls = ["badge", earned ? "" : "off", pop ? "pop" : ""].filter(Boolean).join(" ");
  const inner = (
    <>
      <div className={cls} role="img" aria-label={`${badge.title}: ${badge.description}`}>
        <Icon name={isIcon(badge.icon) ? badge.icon : "star"} />
        <span className="badge-mark">{isIcon(badge.mark) ? <Icon name={badge.mark} /> : badge.mark}</span>
      </div>
      <span className="badge-label">{badge.title}</span>
    </>
  );
  if (onClick)
    return (
      <button type="button" className="badge-item" onClick={onClick}>
        {inner}
      </button>
    );
  return <div className="badge-item">{inner}</div>;
}
