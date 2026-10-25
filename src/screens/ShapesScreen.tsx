import { useEffect, useState } from "react";
import { playChord, unlockAudio } from "../audio/sampler.ts";
import { Button } from "../components/common/Button.tsx";
import { Card } from "../components/common/Card.tsx";
import { Segmented } from "../components/common/Segmented.tsx";
import { IconButton, Screen } from "../components/layout/Screen.tsx";
import { ChordDiagram } from "../components/music/ChordDiagram.tsx";
import { CHORD_SHAPES, shapeFor, shapeMidis, shapeName, type ChordShape } from "../engine/instruments/guitarChords.ts";
import { chordItemsFor } from "../engine/learning/items.ts";
import { moduleById, type ModuleId } from "../engine/learning/modules.ts";
import { getSettings } from "../storage/repo.ts";
import { useApp } from "../state/useApp.ts";
import { Icon } from "../components/common/Icon.tsx";

const STRUM_MS = 45;

/** All guitar shapes to study before practising: those in the lesson, or the whole table. */
export function ShapesScreen({ moduleId }: { moduleId: ModuleId }) {
  const { profile, nav } = useApp();
  const module = moduleById(moduleId);
  const [inLesson, setInLesson] = useState<ChordShape[] | null>(null);
  const [scope, setScope] = useState<"lesson" | "all">("lesson");

  useEffect(() => {
    if (!profile) return;
    void getSettings(profile.id, moduleId).then((settings) => {
      const shapes = chordItemsFor(module, settings).flatMap((i) => shapeFor(i.chord) ?? []);
      setInLesson(shapes);
    });
  }, [profile, moduleId, module]);

  if (!profile || !inLesson)
    return (
      <Screen
        title="Grepen"
        left={
          <IconButton label="Terug" onClick={nav.back}>
            <Icon name="chevron-left" />
          </IconButton>
        }
      >
        {null}
      </Screen>
    );
  const shapes = scope === "lesson" ? inLesson : CHORD_SHAPES;

  return (
    <Screen
      title="Grepen"
      left={
        <IconButton label="Terug" onClick={nav.back}>
          <Icon name="chevron-left" />
        </IconButton>
      }
    >
      <Segmented<"lesson" | "all">
        options={[
          { value: "lesson", label: `In je les (${inLesson.length})` },
          { value: "all", label: `Alle grepen (${CHORD_SHAPES.length})` },
        ]}
        value={scope}
        onChange={setScope}
      />
      <p className="muted">
        Tik op een greep om hem te horen. De cijfers zijn de vingers: 1 is de wijsvinger. ○ is een open snaar, ✕ een snaar die je niet aanslaat.
      </p>
      <ShapeGallery shapes={shapes} />
      <div className="grow" />
      <Button block onClick={() => nav.replace({ name: "exercise", moduleId, nonce: Date.now() })}>
        Start oefening
      </Button>
    </Screen>
  );
}

/** A grid of named diagrams that sound when tapped; also used to introduce new shapes in a session. */
export function ShapeGallery({ shapes }: { shapes: readonly ChordShape[] }) {
  return (
    <div className="chord-grid">
      {shapes.map((s) => (
        <Card key={shapeName(s)} tight>
          <ChordDiagram
            frets={s.frets}
            fingers={s.fingers}
            title={shapeName(s) + (s.barre ? " (barré)" : "")}
            onClick={() => {
              unlockAudio();
              playChord(shapeMidis(s.frets), 2, STRUM_MS, "guitar");
            }}
          />
        </Card>
      ))}
    </div>
  );
}
