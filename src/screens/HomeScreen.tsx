import { useState } from "react";
import { Avatar } from "../components/common/Avatar.tsx";
import { Card } from "../components/common/Card.tsx";
import { Chip } from "../components/common/Chip.tsx";
import { GoalRing } from "../components/common/GoalRing.tsx";
import { ProgressBar } from "../components/common/ProgressBar.tsx";
import { Screen } from "../components/layout/Screen.tsx";
import { dayKey } from "../engine/common/dates.ts";
import { levelFor, streakStatus } from "../engine/game/rules.ts";
import { INSTRUMENT_NAME, type Instrument } from "../engine/learning/modules.ts";
import { useApp } from "../state/useApp.ts";
import { useProfileCards, useProfileSessions } from "../state/queries.ts";
import { Button } from "../components/common/Button.tsx";
import { suggestLesson } from "../engine/learning/lesson.ts";
import { goalModules } from "../engine/learning/goals.ts";
import { MainTabs } from "./MainTabs.tsx";
import { Icon, type IconName } from "../components/common/Icon.tsx";
import { ProfileSheet } from "../components/common/ProfileSheet.tsx";

const ICON: Record<Instrument, IconName> = { theory: "staff", piano: "piano", guitar: "guitar" };

export function HomeScreen() {
  const { profile, wallet, nav } = useApp();
  const [now] = useState(() => new Date());
  const [sheet, setSheet] = useState(false);
  const cards = useProfileCards(profile?.id);
  const sessions = useProfileSessions(profile?.id);
  if (!profile) return null;
  const lesson = suggestLesson(goalModules(profile.goals), cards, sessions, now);

  const today = dayKey();
  const { level, into, span } = levelFor(wallet.xp);
  const status = streakStatus(wallet, today);
  const streak = status === "none" ? 0 : wallet.streak;
  const left = Math.max(0, profile.dayGoal - wallet.todayXp);

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
      <div className="exercise-list">
        <Card tight>
          <button type="button" className="item" style={{ padding: 6 }} onClick={() => nav.go({ name: "lessons" })}>
            <div className="icon" aria-hidden="true">
              <Icon name="book" />
            </div>
            <div className="grow">
              <b>Zelf een les kiezen</b>
              <div className="muted">Alle oefeningen per instrument</div>
            </div>
            <span className="muted" style={{ fontSize: 20 }}>
              <Icon name="arrow-right" />
            </span>
          </button>
        </Card>
      </div>
      {sheet && <ProfileSheet onClose={() => setSheet(false)} />}
    </Screen>
  );
}
