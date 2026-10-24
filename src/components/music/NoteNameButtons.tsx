import { useState } from "react";
import { ACCIDENTAL_SYMBOL, LETTERS, type Accidental, type Letter } from "../../engine/common/pitch.ts";

interface Props {
  /** Which accidentals can be chosen; with only the natural, the ♯/♭ row is hidden. */
  accidentals: readonly Accidental[];
  onAnswer: (letter: Letter, acc: Accidental) => void;
  disabled?: boolean;
}

/** Seven letter keys; choose ♭ or ♯ first when the exercise has accidentals. */
export function NoteNameButtons({ accidentals, onAnswer, disabled }: Props) {
  const [acc, setAcc] = useState<Accidental>(0);
  const showAcc = accidentals.length > 1;
  const options: Accidental[] = ([-1, 0, 1] as Accidental[]).filter((a) => accidentals.includes(a));
  return (
    <div className="stack">
      {showAcc && (
        <div className="acc-keys" role="radiogroup" aria-label="Voorteken">
          {options.map((a) => (
            <button key={a} type="button" role="radio" aria-checked={acc === a} className={acc === a ? "on" : ""} onClick={() => setAcc(a)} disabled={disabled}>
              {a === 0 ? "♮" : ACCIDENTAL_SYMBOL[a]}
            </button>
          ))}
        </div>
      )}
      <div className="name-keys">
        {LETTERS.map((l) => (
          <button
            key={l}
            type="button"
            disabled={disabled}
            onClick={() => {
              onAnswer(l, acc);
              setAcc(0);
            }}
          >
            {l}
            {acc !== 0 && <small>{ACCIDENTAL_SYMBOL[acc]}</small>}
          </button>
        ))}
      </div>
    </div>
  );
}
