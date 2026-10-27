import { useLiveQuery } from "dexie-react-hooks";
import { Card } from "../components/common/Card.tsx";
import { Tabs } from "../components/common/Tabs.tsx";
import { Screen } from "../components/layout/Screen.tsx";
import { chordName, INVERSION_NAME, MAJOR_KEYS, pcKey, pcName } from "../engine/common/chord.ts";
import { CLEF_NAME, CLEFS, pitchAtPosition, rangeForLevel, type Clef } from "../engine/common/clef.ts";
import { pitchName } from "../engine/common/pitch.ts";
import { BADGES, COINS_BADGE } from "../engine/game/badges.ts";
import { chordItemsFor, itemKey, keyItemsFor } from "../engine/learning/items.ts";
import { INSTRUMENT_NAME, INSTRUMENTS, modulesFor, PLAYABLE_PHASE, usesStaff, type ModuleDef } from "../engine/learning/modules.ts";
import { masteryOf, type Mastery } from "../engine/learning/scheduler.ts";
import { withDefaults } from "../engine/learning/settings.ts";
import { db, type StoredCard } from "../storage/db.ts";
import { useApp } from "../state/useApp.ts";
import { useProfileCards, useProfileSessions, useProfileSettings, useProfileStats } from "../state/queries.ts";
import { MainTabs } from "./MainTabs.tsx";
import { useInstrument } from "../state/useInstrument.ts";
import { Badge } from "../components/common/Badge.tsx";

const MASTERY_CLASS: Record<Mastery, string> = { none: "n-none", learning: "n-learning", mastered: "n-mastered" };

function Legend() {
  return (
    <div className="legend muted">
      <span>
        <i style={{ background: "var(--ok)" }} />
        beheerst
      </span>
      <span>
        <i style={{ background: "var(--gold)" }} />
        bezig
      </span>
      <span>
        <i style={{ background: "#d9d4c9" }} />
        nog niet
      </span>
    </div>
  );
}

function NoteMaps({ module, cards }: { module: ModuleDef; cards: StoredCard[] }) {
  const byKey = new Map(cards.map((c) => [c.itemKey, c]));
  const clefs: Clef[] = module.clefs === "treble" ? ["treble"] : [...CLEFS];
  const { min, max } = rangeForLevel(module.instrument === "guitar" ? 3 : 4);
  return (
    <>
      {clefs.map((clef) => (
        <Card key={clef}>
          <h2>
            Notenkaart · {CLEF_NAME[clef].toLowerCase()} · {module.title.toLowerCase()}
          </h2>
          <div className="notemap">
            {Array.from({ length: max - min + 1 }, (_, i) => pitchAtPosition(min + i, clef)).map((p) => {
              const m = masteryOf(byKey.get(itemKey(clef, p)));
              return (
                <span key={pitchName(p, true)} className={MASTERY_CLASS[m]} title={m}>
                  {pitchName(p, true)}
                </span>
              );
            })}
          </div>
          <Legend />
        </Card>
      ))}
    </>
  );
}

/** The keys of a key module in circle-of-fifths order, one row per clef where the melody is written. */
function KeyMap({ module, cards, clefs }: { module: ModuleDef; cards: StoredCard[]; clefs: Clef[] }) {
  const byKey = new Map(cards.map((c) => [c.itemKey, c]));
  const all = MAJOR_KEYS.map((k) => pcKey(k.tonic));
  return (
    <Card>
      <h2>Toonsoorten · {module.title.toLowerCase()}</h2>
      {clefs.map((clef) => {
        const items = keyItemsFor(module, { ...withDefaults(undefined), keys: all, clefs: clef });
        const inFifths = [...items].sort((a, b) => a.tonality.signature - b.tonality.signature);
        return (
          <div key={clef} className="notemap" style={{ marginBottom: 6 }}>
            {inFifths.map((i) => {
              const m = masteryOf(byKey.get(i.key));
              return (
                <span key={i.key} className={MASTERY_CLASS[m]} title={`${CLEF_NAME[clef]} · ${m}`}>
                  {pcName(i.tonality.tonic)}
                </span>
              );
            })}
          </div>
        );
      })}
      <Legend />
    </Card>
  );
}

function ChordMap({ module, cards, keys }: { module: ModuleDef; cards: StoredCard[]; keys: string[] }) {
  const byKey = new Map(cards.map((c) => [c.itemKey, c]));
  // Everything the player could meet: the chosen keys, both qualities, inversions, both clefs.
  const items = chordItemsFor(module, { ...withDefaults(undefined), keys, qualities: "both", inversions: true, clefs: "both" });
  const touched = items.filter((i) => byKey.has(i.key));
  if (touched.length === 0) return null;
  return (
    <Card>
      <h2>Akkoordkaart · {module.title.toLowerCase()}</h2>
      <div className="notemap" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
        {touched.map((i) => (
          <span key={i.key} className={MASTERY_CLASS[masteryOf(byKey.get(i.key))]} title={`${INVERSION_NAME[i.chord.inversion]} · ${CLEF_NAME[i.clef]}`}>
            {chordName(i.chord)}
            {i.chord.inversion ? `/${i.chord.inversion}` : ""}
          </span>
        ))}
      </div>
      <Legend />
    </Card>
  );
}

export function ProgressScreen() {
  const { profile } = useApp();
  const [instrument, setInstrument] = useInstrument();
  const cards = useProfileCards(profile?.id);
  const stats = useProfileStats(profile?.id);
  const sessions = useProfileSessions(profile?.id);
  const settings = useProfileSettings(profile?.id);
  const badges =
    useLiveQuery(() => (profile ? db.badges.where("profileId").equals(profile.id).toArray() : Promise.resolve([] as { badgeId: string }[])), [profile?.id]) ??
    [];
  if (!profile) return null;

  const modules = modulesFor(instrument).filter((m) => m.phase <= PLAYABLE_PHASE);
  const own = cards.filter((c) => modules.some((m) => m.id === c.moduleId));
  const mastered = own.filter((c) => masteryOf(c) === "mastered").length;
  const touched = own.filter((c) => c.reps > 0).length;
  const noteModule = modules.find((m) => m.kind === "note")!;
  const stat = stats.find((s) => s.moduleId === noteModule.id);
  const count = sessions.filter((s) => modules.some((m) => m.id === s.moduleId)).length;
  const earned = new Set(badges.map((b) => b.badgeId));
  const shown = BADGES.filter((b) => !b.instrument || b.instrument === instrument);

  return (
    <Screen title="Voortgang" footer={<MainTabs active="progress" />}>
      <Tabs options={INSTRUMENTS.map((i) => ({ value: i, label: INSTRUMENT_NAME[i] }))} value={instrument} onChange={setInstrument} />
      <Card className="grid3">
        <div className="stat">
          <b>{touched === 0 ? "–" : `${Math.round((mastered / touched) * 100)}%`}</b>
          <small>beheerst</small>
        </div>
        <div className="stat">
          <b>{stat && stat.count > 0 ? `${(stat.emaMs / 1000).toFixed(1).replace(".", ",")} s` : "–"}</b>
          <small>gem. per noot</small>
        </div>
        <div className="stat">
          <b>{count}</b>
          <small>sessies</small>
        </div>
      </Card>
      {modules.map((m) => {
        const own = cards.filter((c) => c.moduleId === m.id);
        if (own.length === 0 && m.id !== noteModule.id) return null;
        if (m.kind === "note") return <NoteMaps key={m.id} module={m} cards={own} />;
        if (m.kind === "key") return <KeyMap key={m.id} module={m} cards={own} clefs={usesStaff(m) ? [...CLEFS] : ["treble"]} />;
        return <ChordMap key={m.id} module={m} cards={own} keys={withDefaults(settings.find((s) => s.moduleId === m.id)?.settings).keys} />;
      })}
      <p className="muted">Een module komt hier te staan zodra je hem één keer hebt geoefend.</p>
      <Card>
        <h2>Badges · {INSTRUMENT_NAME[instrument].toLowerCase()}</h2>
        <div className="badges">
          {shown.map((b) => (
            <Badge key={b.id} badge={b} earned={earned.has(b.id)} />
          ))}
        </div>
        <p className="muted" style={{ marginTop: 8 }}>
          Elke badge is {COINS_BADGE} munten waard. Houd je vinger op een badge voor de uitleg.
        </p>
      </Card>
    </Screen>
  );
}
