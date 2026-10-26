import { Button } from "../components/common/Button.tsx";
import { Card } from "../components/common/Card.tsx";
import { Screen } from "../components/layout/Screen.tsx";
import { badgeById, COINS_BADGE } from "../engine/game/badges.ts";
import { COINS_GOAL, COINS_LEVEL_UP } from "../engine/game/rules.ts";
import { moduleById, type ModuleId } from "../engine/learning/modules.ts";
import type { SessionSummary } from "../state/finishSession.ts";
import { useApp } from "../state/useApp.ts";
import { Icon } from "../components/common/Icon.tsx";
import { Badge } from "../components/common/Badge.tsx";

export function ResultScreen({ moduleId, summary }: { moduleId: ModuleId; summary: SessionSummary }) {
  const { nav } = useApp();
  const module = moduleById(moduleId);
  const pct = summary.total > 0 ? Math.round((summary.correct / summary.total) * 100) : 0;
  const praise = pct === 100 ? "Foutloos!" : pct >= 80 ? "Goed gedaan!" : pct >= 50 ? "Lekker bezig" : "Volhouden, het komt";
  return (
    <Screen>
      <div className="welcome">
        <div style={{ fontSize: 64, lineHeight: 1, color: "var(--gold)" }} className="pop">
          <Icon name={pct === 100 ? "trophy" : pct >= 80 ? "star" : "note"} />
        </div>
        <h1>{praise}</h1>
        <p className="muted">
          {module.title} · {summary.correct} van {summary.total} goed
        </p>
        <Card style={{ width: "100%" }}>
          <div className="grid3">
            <div className="stat">
              <b>+{summary.xp}</b>
              <small>XP</small>
            </div>
            <div className="stat">
              <b>+{summary.coins}</b>
              <small>munten</small>
            </div>
            <div className="stat">
              <b>
                <Icon name="flame" /> {summary.streak}
              </b>
              <small>streak</small>
            </div>
          </div>
        </Card>
        {summary.leveledUp && (
          <Card className="levelup" style={{ width: "100%" }}>
            <div className="levelup-disc" aria-hidden="true">
              <small>Level</small>
              <b>{summary.level}</b>
            </div>
            <div className="grow">
              <b>Level omhoog!</b>
              <div className="muted">Je krijgt {COINS_LEVEL_UP} munten extra.</div>
            </div>
          </Card>
        )}
        {summary.goalReached && (
          <Card className="feedback ok" style={{ width: "100%" }}>
            <b>Dagdoel gehaald</b>
            <div className="muted">
              Je reeks staat op {summary.streak} {summary.streak === 1 ? "dag" : "dagen"}. {COINS_GOAL} munten erbij.
            </div>
          </Card>
        )}
        {summary.newBadges.map((id) => {
          const badge = badgeById(id);
          return (
            <Card key={id} className="feedback ok" style={{ width: "100%" }}>
              <div className="row">
                {badge && <Badge badge={badge} pop />}
                <div className="grow">
                  <b>Nieuwe badge: {badge?.title ?? id}</b>
                  <div className="muted">
                    {badge?.description} · {COINS_BADGE} munten erbij.
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
        <Button block onClick={() => nav.replace({ name: "exercise", moduleId, nonce: Date.now() })}>
          Nog een ronde
        </Button>
        <Button variant="ghost" block onClick={() => nav.reset({ name: "home" })}>
          Klaar
        </Button>
      </div>
    </Screen>
  );
}
