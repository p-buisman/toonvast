import { keyName, pcName, signatureText } from "../../engine/common/chord.ts";
import { midiOf } from "../../engine/common/pitch.ts";
import type { KeyItem } from "../../engine/learning/items.ts";
import { scaleFor } from "../../engine/learning/melody.ts";
import { Card } from "../common/Card.tsx";
import { Icon } from "../common/Icon.tsx";
import { Staff } from "./Staff.tsx";
import { useMelodyPlayer } from "./useMelodyPlayer.ts";

const LIT = "var(--accent)";

/** A key to look at before it is asked: its signature, its scale on the staff, and a button that plays the scale. */
function KeyCard({ item }: { item: KeyItem }) {
  const { playing, play } = useMelodyPlayer();
  const key = item.tonality;
  const scale = scaleFor(key, item.clef);
  const tonic = pcName(key.tonic);
  return (
    <Card>
      <h2>Nieuw: {keyName(key)}</h2>
      <p className="muted" style={{ margin: "0 0 8px" }}>
        {key.signature === 0 ? "Geen voortekens vooraan. " : `Vooraan ${signatureText(key)}. `}
        De toonladder begint en eindigt op {tonic}.
      </p>
      <Staff
        clef={item.clef}
        layout="melody"
        signature={key.signature}
        notes={scale.map((pitch, i) => ({ pitch, color: i === playing ? LIT : undefined }))}
        width={400}
      />
      <button type="button" className="listen" style={{ marginTop: 10 }} onClick={() => play(scale.map(midiOf))}>
        <span className="listen-icon">
          <Icon name="play" />
        </span>
        <span>
          <b>Luister</b>
          <small>speel de toonladder van {keyName(key)}</small>
        </span>
      </button>
    </Card>
  );
}

export function KeyIntro({ items }: { items: readonly KeyItem[] }) {
  return (
    <div className="stack">
      {items.map((item) => (
        <KeyCard key={item.key} item={item} />
      ))}
      <Card>
        <h2>Zo herken je een toonsoort</h2>
        <p className="muted" style={{ margin: 0 }}>
          Kruizen: het laatste kruis is de leidtoon, één stap onder de grondtoon. Mollen: de voorlaatste mol is de grondtoon. Geen voortekens: C-groot.
        </p>
      </Card>
    </div>
  );
}
