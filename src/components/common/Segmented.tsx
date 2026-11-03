export interface SegmentOption<T extends string | number | boolean> {
  value: T;
  label: string;
}

interface Props<T extends string | number | boolean> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
  disabled?: boolean;
}

/** A row of exclusive choices, like the settings in the sketches. */
export function Segmented<T extends string | number | boolean>({ options, value, onChange, ariaLabel, disabled }: Props<T>) {
  return (
    <div className="seg" role="radiogroup" aria-label={ariaLabel} style={disabled ? { opacity: 0.5 } : undefined}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          disabled={disabled}
          className={o.value === value ? "on" : ""}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
