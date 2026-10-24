import { ACCIDENTAL_SYMBOL, type Accidental } from "../../engine/common/pitch.ts";

/** ♭ ♮ ♯ for placing notes on the staff. */
export function AccidentalToggle({ value, onChange, disabled }: { value: Accidental; onChange: (a: Accidental) => void; disabled?: boolean }) {
  return (
    <div className="acc-keys" role="radiogroup" aria-label="Voorteken">
      {([-1, 0, 1] as Accidental[]).map((a) => (
        <button
          key={a}
          type="button"
          role="radio"
          aria-checked={value === a}
          className={value === a ? "on" : ""}
          onClick={() => onChange(a)}
          disabled={disabled}
        >
          {a === 0 ? "♮" : ACCIDENTAL_SYMBOL[a]}
        </button>
      ))}
    </div>
  );
}
