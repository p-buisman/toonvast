import { useState } from "react";
import { INVERSION_NAME, type Inversion, type PitchClass, type Quality } from "../../engine/common/chord.ts";
import { ACCIDENTAL_SYMBOL, LETTERS, type Accidental } from "../../engine/common/pitch.ts";
import { Segmented } from "../common/Segmented.tsx";

interface Props {
  /** Which accidentals the roots in play can have; with only the natural, the ♯/♭ row is hidden. */
  accidentals: readonly Accidental[];
  qualities: readonly Quality[];
  /** Ask for the inversion as well. */
  withInversion: boolean;
  onAnswer: (root: PitchClass, quality: Quality, inversion: Inversion | null) => void;
  disabled?: boolean;
}

/** Choose ♭/♯, majeur/mineur and the inversion first; the letter key sends the answer. */
export function ChordNameButtons({ accidentals, qualities, withInversion, onAnswer, disabled }: Props) {
  const [acc, setAcc] = useState<Accidental>(0);
  const [quality, setQuality] = useState<Quality>(qualities[0]);
  const [inversion, setInversion] = useState<Inversion>(0);
  const accOptions = ([-1, 0, 1] as Accidental[]).filter((a) => accidentals.includes(a));
  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "center", flexWrap: "wrap" }}>
        {accOptions.length > 1 && (
          <div className="acc-keys" role="radiogroup" aria-label="Voorteken">
            {accOptions.map((a) => (
              <button
                key={a}
                type="button"
                role="radio"
                aria-checked={acc === a}
                className={acc === a ? "on" : ""}
                onClick={() => setAcc(a)}
                disabled={disabled}
              >
                {a === 0 ? "♮" : ACCIDENTAL_SYMBOL[a]}
              </button>
            ))}
          </div>
        )}
        {qualities.length > 1 && (
          <Segmented<Quality>
            options={[
              { value: "major", label: "majeur" },
              { value: "minor", label: "mineur" },
            ]}
            value={quality}
            onChange={setQuality}
            ariaLabel="Soort"
          />
        )}
      </div>
      {withInversion && (
        <Segmented<Inversion>
          options={([0, 1, 2] as Inversion[]).map((i) => ({ value: i, label: INVERSION_NAME[i] }))}
          value={inversion}
          onChange={setInversion}
          ariaLabel="Ligging"
        />
      )}
      <div className="name-keys">
        {LETTERS.map((l) => (
          <button
            key={l}
            type="button"
            disabled={disabled}
            onClick={() => {
              onAnswer({ letter: l, acc }, quality, withInversion ? inversion : null);
              setAcc(0);
              setInversion(0);
            }}
          >
            {l}
            {acc !== 0 && <small>{ACCIDENTAL_SYMBOL[acc]}</small>}
            {quality === "minor" && <small>m</small>}
          </button>
        ))}
      </div>
    </div>
  );
}
