import { STRING_NAMES } from "../../engine/instruments/guitar.ts";

interface Props {
  /** The string that sounds now (0 = low E … 5 = high E). */
  active?: number | null;
  /** Strings that have been in tune. */
  tuned?: ReadonlySet<number>;
  onTap?: (string: number) => void;
}

/** Six buttons, low E to high E, each with its number; tapping one plays its open-string tone. */
export function StringKeys({ active = null, tuned, onTap }: Props) {
  return (
    <div className="string-keys" role="group" aria-label="Snaren">
      {STRING_NAMES.map((name, i) => (
        <button
          key={i}
          type="button"
          className={tuned?.has(i) ? "ok" : active === i ? "on" : ""}
          aria-label={`${name.toUpperCase()}-snaar, ${6 - i}e`}
          onClick={onTap ? () => onTap(i) : undefined}
        >
          <b>{name.toUpperCase()}</b>
          <small>{6 - i}</small>
        </button>
      ))}
    </div>
  );
}
