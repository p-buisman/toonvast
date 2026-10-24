import { useEffect, useState } from "react";
import { Button } from "../components/common/Button.tsx";
import { Card } from "../components/common/Card.tsx";
import { Segmented } from "../components/common/Segmented.tsx";
import { IconButton, Screen } from "../components/layout/Screen.tsx";
import { RANGE_LEVEL_NAME, type RangeLevel } from "../engine/common/clef.ts";
import { PIANO_RANGE_NAME, type PianoRangeId } from "../engine/instruments/piano.ts";
import { itemsFor } from "../engine/learning/items.ts";
import { moduleById, type ModuleId } from "../engine/learning/modules.ts";
import { WORKING_SETS, type AccidentalChoice, type ClefChoice, type ModuleSettings, type SessionLength, type WorkingSet } from "../engine/learning/settings.ts";
import { getSettings, saveSettings } from "../storage/repo.ts";
import { useApp } from "../state/useApp.ts";

export function SettingsScreen({ moduleId }: { moduleId: ModuleId }) {
  const { profile, nav } = useApp();
  const module = moduleById(moduleId);
  const [settings, setSettings] = useState<ModuleSettings | null>(null);

  useEffect(() => {
    if (profile) void getSettings(profile.id, moduleId).then(setSettings);
  }, [profile, moduleId]);

  if (!profile || !settings)
    return (
      <Screen
        title={module.title}
        left={
          <IconButton label="Terug" onClick={nav.back}>
            ‹
          </IconButton>
        }
      >
        {null}
      </Screen>
    );

  const update = (changes: Partial<ModuleSettings>) => {
    const next = { ...settings, ...changes };
    setSettings(next);
    void saveSettings(profile.id, moduleId, next);
  };
  const count = itemsFor(module, settings).length;

  return (
    <Screen
      title={module.title}
      left={
        <IconButton label="Terug" onClick={nav.back}>
          ‹
        </IconButton>
      }
    >
      <Card>
        <h2>Sleutels</h2>
        {module.clefs === "treble" ? (
          <p className="muted">Gitaarmuziek staat altijd in de vioolsleutel.</p>
        ) : (
          <Segmented<ClefChoice>
            options={[
              { value: "treble", label: "Viool" },
              { value: "bass", label: "Bas" },
              { value: "both", label: "Beide" },
            ]}
            value={settings.clefs}
            onChange={(clefs) => update({ clefs })}
          />
        )}
      </Card>
      <Card>
        <h2>Bereik notenbalk</h2>
        <Segmented<RangeLevel>
          options={([0, 1, 2] as RangeLevel[]).map((r) => ({ value: r, label: RANGE_LEVEL_NAME[r] }))}
          value={settings.range}
          onChange={(range) => update({ range })}
        />
        <p className="muted" style={{ marginTop: 6 }}>
          Nieuwe noten komen er stap voor stap bij.
        </p>
      </Card>
      <Card>
        <h2>Voortekens</h2>
        <Segmented<AccidentalChoice>
          options={[
            { value: "none", label: "Geen" },
            { value: "sharp", label: "♯" },
            { value: "flat", label: "♭" },
            { value: "both", label: "Beide" },
          ]}
          value={settings.accidentals}
          onChange={(accidentals) => update({ accidentals })}
        />
      </Card>
      {module.answer === "piano" && (
        <Card>
          <h2>Pianobereik</h2>
          <Segmented<PianoRangeId>
            options={(["auto", "two", "four", "full"] as PianoRangeId[]).map((r) => ({ value: r, label: PIANO_RANGE_NAME[r] }))}
            value={settings.pianoRange}
            onChange={(pianoRange) => update({ pianoRange })}
          />
          <div className="row" style={{ marginTop: 10 }}>
            <span className="muted grow">Letters op de C-toetsen</span>
            <Segmented
              options={[
                { value: true, label: "Aan" },
                { value: false, label: "Uit" },
              ]}
              value={settings.keyLabels}
              onChange={(keyLabels) => update({ keyLabels })}
            />
          </div>
        </Card>
      )}
      <Card>
        <h2>Sessie</h2>
        <Segmented<SessionLength>
          options={([5, 10, 20] as SessionLength[]).map((n) => ({ value: n, label: String(n) }))}
          value={settings.sessionLength}
          onChange={(sessionLength) => update({ sessionLength })}
        />
      </Card>
      <Card>
        <h2>Noten tegelijk leren</h2>
        <Segmented<WorkingSet>
          options={WORKING_SETS.map((n) => ({ value: n, label: String(n) }))}
          value={settings.workingSet}
          onChange={(workingSet) => update({ workingSet })}
        />
        <p className="muted" style={{ marginTop: 6 }}>
          Er komt pas een nieuwe noot bij als een noot uit deze groep stabiel is, en alleen na een sessie met minstens 80% goed.
        </p>
      </Card>
      <p className="muted center">
        {count} {count === 1 ? "noot" : "noten"} binnen deze instellingen
      </p>
      <div className="grow" />
      <Button block disabled={count === 0} onClick={() => nav.replace({ name: "exercise", moduleId, nonce: Date.now() })}>
        Start oefening
      </Button>
    </Screen>
  );
}
