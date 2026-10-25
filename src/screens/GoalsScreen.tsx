import { Card } from "../components/common/Card.tsx";
import { Chip } from "../components/common/Chip.tsx";
import { Icon, type IconName } from "../components/common/Icon.tsx";
import { IconButton, Screen } from "../components/layout/Screen.tsx";
import { goalCandidates, goalModules, toggleGoal } from "../engine/learning/goals.ts";
import { INSTRUMENT_NAME, INSTRUMENTS, type Instrument } from "../engine/learning/modules.ts";
import { updateProfile } from "../storage/repo.ts";
import { useApp } from "../state/useApp.ts";

const ICON: Record<Instrument, IconName> = { theory: "staff", piano: "piano", guitar: "guitar" };

/** Which modules this profile wants to learn; the next lesson on the home screen is chosen among them. */
export function GoalsScreen() {
  const { profile, nav } = useApp();
  if (!profile) return null;
  const on = new Set(goalModules(profile.goals).map((m) => m.id));
  const candidates = goalCandidates();

  return (
    <Screen
      title="Wat wil je leren"
      left={
        <IconButton label="Terug" onClick={nav.back}>
          <Icon name="chevron-left" />
        </IconButton>
      }
    >
      <p className="muted">Zet aan wat je wilt oefenen. De knop Start les kiest hieruit wat nu het meest oplevert; zelf een les kiezen kan altijd.</p>
      {INSTRUMENTS.map((instrument) => (
        <Card key={instrument} className="stack" style={{ gap: 8 }}>
          <h2>{INSTRUMENT_NAME[instrument]}</h2>
          {candidates
            .filter((m) => m.instrument === instrument)
            .map((m) => {
              const active = on.has(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  className="row"
                  style={{ width: "100%", textAlign: "left", minHeight: 44 }}
                  role="switch"
                  aria-checked={active}
                  onClick={() => void updateProfile(profile.id, { goals: toggleGoal(profile.goals, m.id) })}
                >
                  <span style={{ fontSize: 22, color: active ? "var(--accent)" : "var(--muted)" }}>
                    <Icon name={ICON[instrument]} />
                  </span>
                  <span className="grow" style={{ color: active ? "var(--ink)" : "var(--muted)" }}>
                    {m.title}
                  </span>
                  <Chip tone={active ? "ok" : "grey"}>{active ? "Aan" : "Uit"}</Chip>
                </button>
              );
            })}
        </Card>
      ))}
    </Screen>
  );
}
