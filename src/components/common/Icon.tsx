import { ICON_PATHS, type IconName } from "./icons.tsx";

export type { IconName } from "./icons.tsx";

/**
 * One icon of the Toonvast set: inline SVG in the outline style, 1em wide unless the place gives a size,
 * in the colour of the text around it. Decorative unless a `label` is given.
 */
export function Icon({ name, size, label, className }: { name: IconName; size?: number; label?: string; className?: string }) {
  return (
    <svg
      className={["ico", className ?? ""].filter(Boolean).join(" ")}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      stroke="currentColor"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {ICON_PATHS[name]}
    </svg>
  );
}
