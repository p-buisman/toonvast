import { useState } from "react";
import { Avatar } from "../components/common/Avatar.tsx";
import { Card } from "../components/common/Card.tsx";
import { Chip } from "../components/common/Chip.tsx";
import { GoalRing } from "../components/common/GoalRing.tsx";
import { ProgressBar } from "../components/common/ProgressBar.tsx";
import { Tabs } from "../components/common/Tabs.tsx";
import { Screen } from "../components/layout/Screen.tsx";
import { dayKey } from "../engine/common/dates.ts";
import { levelFor, streakStatus } from "../engine/game/rules.ts";
import { itemsFor } from "../engine/learning/items.ts";
import { INSTRUMENT_NAME, INSTRUMENTS, modulesFor, PLAYABLE_PHASE, type Instrument, type ModuleDef } from "../engine/learning/modules.ts";
import { isDue } from "../engine/learning/scheduler.ts";
import { withDefaults } from "../engine/learning/settings.ts";
import { useApp } from "../state/useApp.ts";
import { useProfileCards, useProfileSessions, useProfileSettings } from "../state/queries.ts";
import { Button } from "../components/common/Button.tsx";
import { suggestLesson } from "../engine/learning/lesson.ts";
import { goalModules } from "../engine/learning/goals.ts";
import { MainTabs } from "./MainTabs.tsx";
import { Icon, type IconName } from "../components/common/Icon.tsx";
import { ProfileSheet } from "../components/common/ProfileSheet.tsx";

const INSTRUMENT_KEY = "toonvast.instrument";
const ICON: Record<Instrument, IconName> = { theory: "staff", piano: "piano", guitar: "guitar" };

function readInstrument(): Instrument {
  try {
    const v = localStorage.getItem(INSTRUMENT_KEY);
    return INSTRUMENTS.includes(v as Instrument) ? (v as Instrument) : "piano";
  } catch {
    return "piano";
  }
}

export function HomeScreen() {
  const { profile, wallet, nav } = useApp();
  const [instrument, setInstrument] = useState<Instrument>(readInstrument);
  const [now] = useState(() => new Date());
  const [sheet, setSheet] = useState(false);
  const cards = useProfileCards(profile?.id);
  const settings = useProfileSettings(profile?.id);
  const sessions = useProfileSessions(profile?.id);
  if (!profile) return null;
  const lesson = suggestLesson(goalModules(profile.goals), cards, sessions, now);

  const today = dayKey();
  const { level, into, span } = levelFor(wallet.xp);
  const status = streakStatus(wallet, today);
  const streak = status === "none" ? 0 : wallet.streak;
  const left = Math.max(0, profile.dayGoal - wallet.todayXp);

  const pickInstrument = (i: Instrument) => {
    setInstrument(i);
    try {
      localStorage.setItem(INSTRUMENT_KEY, i);
    } catch {
      // Not remembered, that is all.
    }
  };

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
    <Screen footer={<MainTabs active="home" />}>
      <div className="row spread">
        <button type="button" className="row" aria-label="Profiel wisselen" style={{ textAlign: "left" }} onClick={() => setSheet(true)}>
          <Avatar avatar={profile.avatar} name={profile.name} />
          <div>
            <b>{profile.name}</b>
            <div className="muted">Level {level}</div>
          </div>
        </button>
        <Chip>
          <Icon name="star" /> {wallet.xp} XP
        </Chip>
      </div>
      <ProgressBar value={into} max={span} />
      <div className="muted" style={{ marginTop: -6 }}>
        {span - into} XP tot level {level + 1}
      </div>
      <Card className="row">
        <GoalRing value={wallet.todayXp} goal={profile.dayGoal} />
        <div className="grow">
          <b>Dagdoel</b>
          <div className="muted">{left === 0 ? "Gehaald, goed bezig!" : `Nog ${left} XP vandaag`}</div>
          {status === "at-risk" && <div className="muted">Oefen vandaag, dan houdt je beschermer je reeks heel.</div>}
          {status === "open" && <div className="muted">Oefen vandaag om je reeks te houden.</div>}
        </div>
        <div className="center">
          <div style={{ fontSize: 28, lineHeight: 1 }}>
            <Icon name="flame" />
          </div>
          <b>
            {streak} {streak === 1 ? "dag" : "dagen"}
          </b>
          {wallet.shields > 0 && (
            <div className="muted">
              {wallet.shields} {wallet.shields === 1 ? "beschermer" : "beschermers"}
            </div>
          )}
        </div>
      </Card>
      <Card className="stack" style={{ gap: 8 }}>
        <div className="row spread">
          <h2 style={{ margin: 0 }}>Volgende les</h2>
          <Button variant="plain" onClick={() => nav.go({ name: "goals" })}>
            Wat wil je leren
          </Button>
        </div>
        {lesson ? (
          <>
            <div className="row">
              <div
                className="icon"
                aria-hidden="true"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "var(--accent-soft)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  flex: "none",
                }}
              >
                <Icon name={ICON[lesson.module.instrument]} />
              </div>
              <div className="grow">
                <b>{lesson.module.title}</b>
                <div className="muted">
                  {INSTRUMENT_NAME[lesson.module.instrument]} · {lesson.reason}
                </div>
              </div>
            </div>
            <Button block onClick={() => nav.go({ name: "exercise", moduleId: lesson.module.id, nonce: Date.now() })}>
              Start les
            </Button>
          </>
        ) : (
          <p className="muted">Kies eerst wat je wilt leren.</p>
        )}
      </Card>
      <h2 style={{ marginBottom: 0 }}>Of kies zelf</h2>
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
      {sheet && <ProfileSheet onClose={() => setSheet(false)} />}
    </Screen>
  );
}
