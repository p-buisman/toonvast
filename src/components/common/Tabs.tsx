import type { SegmentOption } from "./Segmented.tsx";

/** The pill-shaped switch between instruments. */
export function Tabs<T extends string>({ options, value, onChange }: { options: readonly SegmentOption<T>[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="tabs" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={o.value === value}
          className={o.value === value ? "on" : ""}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
