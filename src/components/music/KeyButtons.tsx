import { keyName, pcKey, pcName, type Key } from "../../engine/common/chord.ts";

interface Props {
  /** The keys to choose from, shown in circle-of-fifths order: flats on the left, sharps on the right. */
  keys: readonly Key[];
  onAnswer: (tonic: string) => void;
  disabled?: boolean;
  /** After the verdict: the tonic that was chosen and whether it was right; the right one lights up as well. */
  verdict?: { chosen: string; target: string; correct: boolean };
}

/** One button per key, named by its tonic ("B♭", "G"); the same grid as the note-name buttons. */
export function KeyButtons({ keys, onAnswer, disabled, verdict }: Props) {
  const sorted = [...keys].sort((a, b) => a.signature - b.signature);
  const columns = Math.min(7, Math.max(3, sorted.length));
  return (
    <div className="name-keys" role="group" aria-label="Toonsoort" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {sorted.map((k) => {
        const id = pcKey(k.tonic);
        const state = verdict ? (id === verdict.target ? "ok" : id === verdict.chosen ? "bad" : "") : "";
        return (
          <button key={id} type="button" className={state} disabled={disabled} onClick={() => onAnswer(id)} aria-label={keyName(k)}>
            {pcName(k.tonic)}
          </button>
        );
      })}
    </div>
  );
}
