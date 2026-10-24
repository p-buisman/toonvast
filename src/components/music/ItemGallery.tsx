import { playChord, playNote, unlockAudio } from "../../audio/sampler.ts";
import { chordName, INVERSION_NAME } from "../../engine/common/chord.ts";
import { pitchName } from "../../engine/common/pitch.ts";
import { preferredPosition } from "../../engine/instruments/guitar.ts";
import { rangeCovering } from "../../engine/instruments/piano.ts";
import { soundingMidi } from "../../engine/learning/answers.ts";
import type { LearnItem } from "../../engine/learning/items.ts";
import type { ModuleDef } from "../../engine/learning/modules.ts";
import { Card } from "../common/Card.tsx";
import { Fretboard } from "./Fretboard.tsx";
import { Piano } from "./Piano.tsx";
import { Staff } from "./Staff.tsx";

const PICK = "#2f6fed";

/** Notes or chords to look at before they are asked: on the staff, and on the keys or the neck where the module answers there. */
export function ItemGallery({ module, items }: { module: ModuleDef; items: readonly LearnItem[] }) {
  return (
    <div className="stack">
      {items.map((item) => {
        const midis = item.kind === "note" ? [soundingMidi(module, item.pitch)] : item.voicing.map((p) => soundingMidi(module, p));
        const title = item.kind === "note" ? pitchName(item.pitch, true) : `${chordName(item.chord)} · ${INVERSION_NAME[item.chord.inversion]}`;
        const notes = item.kind === "note" ? [item.pitch] : item.voicing;
        const play = () => {
          unlockAudio();
          if (midis.length === 1) playNote(midis[0]);
          else playChord(midis, 2);
        };
        const highlights: Record<number, string> = {};
        for (const m of midis) highlights[m] = PICK;
        const position = module.answer === "guitar" && item.kind === "note" ? preferredPosition(midis[0]) : null;
        return (
          <Card key={item.key} tight>
            <button type="button" className="gallery-item" onClick={play} aria-label={`${title} afspelen`}>
              <div className="row spread" style={{ padding: "4px 6px" }}>
                <b>{title}</b>
                <span className="muted">▶ luister</span>
              </div>
              <div className="row" style={{ alignItems: "stretch" }}>
                <div className="grow">
                  <Staff clef={item.clef} notes={notes.map((pitch) => ({ pitch }))} width={260} height={140} />
                </div>
                {position && (
                  <div style={{ width: 110 }}>
                    <Fretboard dots={[{ ...position, color: PICK }]} />
                  </div>
                )}
              </div>
              {module.answer === "piano" && <Piano range={rangeCovering(midis, 1)} highlights={highlights} keyWidth={22} height={80} focusMidi={midis[0]} />}
            </button>
          </Card>
        );
      })}
    </div>
  );
}
