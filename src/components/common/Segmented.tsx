export interface SegmentOption<T extends string | number | boolean> {
  value: T;
  label: string;
}

interface Props<T extends string | number | boolean> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
}

/** A row of exclusive choices, like the settings in the sketches. */
export function Segmented<T extends string | number | boolean>({ options, value, onChange, ariaLabel }: Props<T>) {
  return (
    <div className="seg" role="radiogroup" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          className={o.value === value ? "on" : ""}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
