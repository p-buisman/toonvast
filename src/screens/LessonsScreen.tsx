import { useState } from "react";
import { Card } from "../components/common/Card.tsx";
import { Chip } from "../components/common/Chip.tsx";
import { Icon, type IconName } from "../components/common/Icon.tsx";
import { Tabs } from "../components/common/Tabs.tsx";
import { IconButton, Screen } from "../components/layout/Screen.tsx";
import { itemsFor } from "../engine/learning/items.ts";
import { INSTRUMENT_NAME, INSTRUMENTS, modulesFor, PLAYABLE_PHASE, type Instrument, type ModuleDef } from "../engine/learning/modules.ts";
import { isDue } from "../engine/learning/scheduler.ts";
import { withDefaults } from "../engine/learning/settings.ts";
import { useApp } from "../state/useApp.ts";
import { useInstrument } from "../state/useInstrument.ts";
import { useProfileCards, useProfileSettings } from "../state/queries.ts";

const ICON: Record<Instrument, IconName> = { theory: "staff", piano: "piano", guitar: "guitar" };

/** Every module per instrument, to start one by hand; the home screen only suggests the next lesson. */
export function LessonsScreen() {
  const { profile, nav } = useApp();
  const [instrument, pickInstrument] = useInstrument();
  const [now] = useState(() => new Date());
  const cards = useProfileCards(profile?.id);
  const settings = useProfileSettings(profile?.id);
  if (!profile) return null;

  const subtitle = (m: ModuleDef): string => {
    if (m.phase > PLAYABLE_PHASE) return `Komt in versie ${m.phase}`;
    const own = cards.filter((c) => c.moduleId === m.id);
    const due = own.filter((c) => c.reps > 0 && isDue(c, now)).length;
    const items = itemsFor(m, withDefaults(settings.find((s) => s.moduleId === m.id)?.settings));
    const known = new Set(own.filter((c) => c.reps > 0).map((c) => c.itemKey));
    const fresh = items.filter((i) => !known.has(i.key)).length;
    const what = m.kind === "chord" ? "akkoorden" : "noten";
    if (own.length === 0) return `${items.length} ${what} om te leren`;
    const parts = [];
    if (due > 0) parts.push(`${due} te herhalen`);
    if (fresh > 0) parts.push(`${fresh} nieuw`);
    return parts.length ? parts.join(" · ") : "Alles herhaald · vrij oefenen";
  };

  return (
    <Screen
      title="Kies een les"
      left={
        <IconButton label="Terug" onClick={nav.back}>
          <Icon name="chevron-left" />
        </IconButton>
      }
    >
      <Tabs options={INSTRUMENTS.map((i) => ({ value: i, label: INSTRUMENT_NAME[i] }))} value={instrument} onChange={pickInstrument} />
      <div className="stack exercise-list">
        {modulesFor(instrument).map((m) => {
          const playable = m.phase <= PLAYABLE_PHASE;
          return (
            <Card key={m.id} tight className={playable ? "" : "locked"}>
              <div className="row">
                <button
                  type="button"
                  className="item grow"
                  style={{ padding: 6 }}
                  disabled={!playable}
                  onClick={() => nav.go({ name: "exercise", moduleId: m.id, nonce: Date.now() })}
                >
                  <div className="icon" aria-hidden="true">
                    <Icon name={ICON[m.instrument]} />
                  </div>
                  <div className="grow">
                    <b>{m.title}</b>
                    <div className="muted">{subtitle(m)}</div>
                  </div>
                  {playable ? (
                    <Chip>Start</Chip>
                  ) : (
                    <Chip tone="grey">
                      <Icon name="lock" />
                    </Chip>
                  )}
                </button>
                {playable && m.answer === "guitar" && m.kind === "chord" && (
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label="Grepen bekijken"
                    title="Grepen bekijken"
                    onClick={() => nav.go({ name: "shapes", moduleId: m.id })}
                  >
                    <Icon name="book" />
                  </button>
                )}
                {playable && (
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={`Instellingen ${m.title}`}
                    onClick={() => nav.go({ name: "settings", moduleId: m.id })}
                  >
                    <Icon name="gear" />
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </Screen>
  );
}
