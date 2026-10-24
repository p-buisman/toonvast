import { useState } from "react";
import { Card } from "../components/common/Card.tsx";
import { Tabs } from "../components/common/Tabs.tsx";
import { Screen } from "../components/layout/Screen.tsx";
import { CLEF_NAME, CLEFS, pitchAtPosition, rangeForLevel, type Clef } from "../engine/common/clef.ts";
import { pitchName } from "../engine/common/pitch.ts";
import { itemKey } from "../engine/learning/items.ts";
import { INSTRUMENT_NAME, INSTRUMENTS, modulesFor, PLAYABLE_PHASE, type Instrument } from "../engine/learning/modules.ts";
import { masteryOf, type Mastery } from "../engine/learning/scheduler.ts";
import { useApp } from "../state/useApp.ts";
import { useProfileCards, useProfileSessions, useProfileStats } from "../state/queries.ts";
import { MainTabs } from "./MainTabs.tsx";

const MASTERY_CLASS: Record<Mastery, string> = { none: "n-none", learning: "n-learning", mastered: "n-mastered" };

export function ProgressScreen() {
  const { profile } = useApp();
  const [instrument, setInstrument] = useState<Instrument>("piano");
  const cards = useProfileCards(profile?.id);
  const stats = useProfileStats(profile?.id);
  const sessions = useProfileSessions(profile?.id);
  if (!profile) return null;

  const modules = modulesFor(instrument).filter((m) => m.phase <= PLAYABLE_PHASE);
  const module = modules[0];
  const own = cards.filter((c) => c.moduleId === module.id);
  const byKey = new Map(own.map((c) => [c.itemKey, c]));
  const mastered = own.filter((c) => masteryOf(c) === "mastered").length;
  const touched = own.filter((c) => c.reps > 0).length;
  const stat = stats.find((s) => s.moduleId === module.id);
  const count = sessions.filter((s) => s.moduleId === module.id).length;
  const clefs: Clef[] = module.clefs === "treble" ? ["treble"] : [...CLEFS];
  const { min, max } = rangeForLevel(2);

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
          <div className="legend muted">
            <span>
              <i className="n-mastered" style={{ background: "var(--ok)" }} />
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
        </Card>
      ))}
      <p className="muted center">Badges komen in versie 2.</p>
    </Screen>
  );
}
