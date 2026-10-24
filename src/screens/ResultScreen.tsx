import { Button } from "../components/common/Button.tsx";
import { Card } from "../components/common/Card.tsx";
import { Screen } from "../components/layout/Screen.tsx";
import { moduleById, type ModuleId } from "../engine/learning/modules.ts";
import type { SessionSummary } from "../state/finishSession.ts";
import { useApp } from "../state/useApp.ts";

export function ResultScreen({ moduleId, summary }: { moduleId: ModuleId; summary: SessionSummary }) {
  const { nav } = useApp();
  const module = moduleById(moduleId);
  const pct = summary.total > 0 ? Math.round((summary.correct / summary.total) * 100) : 0;
  const praise = pct === 100 ? "Foutloos!" : pct >= 80 ? "Goed gedaan!" : pct >= 50 ? "Lekker bezig" : "Volhouden, het komt";
  return (
    <Screen>
      <div className="welcome">
        <div style={{ fontSize: 64, lineHeight: 1 }} className="pop">
          {pct === 100 ? "🏆" : pct >= 80 ? "🌟" : "🎵"}
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
              <b>🔥 {summary.streak}</b>
              <small>streak</small>
            </div>
          </div>
        </Card>
        {summary.leveledUp && (
          <Card className="feedback ok" style={{ width: "100%" }}>
            <b>Level {summary.level}!</b>
            <div className="muted">Je krijgt 20 munten extra.</div>
          </Card>
        )}
        {summary.goalReached && (
          <Card className="feedback ok" style={{ width: "100%" }}>
            <b>Dagdoel gehaald</b>
            <div className="muted">
              Je reeks staat op {summary.streak} {summary.streak === 1 ? "dag" : "dagen"}. 10 munten erbij.
            </div>
          </Card>
        )}
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
