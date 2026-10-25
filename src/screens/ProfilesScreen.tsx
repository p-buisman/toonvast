import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { Avatar } from "../components/common/Avatar.tsx";
import { Button } from "../components/common/Button.tsx";
import { Card } from "../components/common/Card.tsx";
import { Chip } from "../components/common/Chip.tsx";
import { Screen } from "../components/layout/Screen.tsx";
import { dayKey } from "../engine/common/dates.ts";
import { levelFor, streakStatus } from "../engine/game/rules.ts";
import { restoreBackupFile, saveBackupFile } from "../storage/backupFile.ts";
import { db } from "../storage/db.ts";
import { touchProfile } from "../storage/repo.ts";
import { useApp } from "../state/useApp.ts";
import { Icon } from "../components/common/Icon.tsx";

export function ProfilesScreen() {
  const { chooseProfile, nav } = useApp();
  const profiles = useLiveQuery(() => db.profiles.orderBy("lastUsedAt").reverse().toArray(), []);
  const wallets = useLiveQuery(() => db.wallets.toArray(), []);
  const [message, setMessage] = useState<string | null>(null);
  const today = dayKey();

  const pick = async (id: string) => {
    await touchProfile(id);
    chooseProfile(id);
    nav.reset({ name: "welcome" });
  };

  const backup = async () => {
    try {
      const how = await saveBackupFile();
      setMessage(how === "shared" ? "Back-up gedeeld." : "Back-up opgeslagen in je downloads.");
    } catch (e) {
      setMessage(`Back-up mislukt: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const restore = async () => {
    try {
      const n = await restoreBackupFile();
      if (n !== null) setMessage(`Back-up teruggezet: ${n} ${n === 1 ? "profiel" : "profielen"}.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Screen>
      <h1>Wie gaat oefenen?</h1>
      <p className="muted">Tik op je naam. Iedereen heeft zijn eigen voortgang, streak en avatar.</p>
      {profiles?.map((p) => {
        const w = wallets?.find((x) => x.profileId === p.id);
        const level = levelFor(w?.xp ?? 0).level;
        const streak = w && streakStatus(w, today) !== "none" ? w.streak : 0;
        return (
          <Card key={p.id} tight>
            <button type="button" className="row" style={{ width: "100%", textAlign: "left", padding: 6 }} onClick={() => void pick(p.id)}>
              <Avatar avatar={p.avatar} name={p.name} />
              <div className="grow">
                <b>{p.name}</b>
                <div className="muted">
                  Level {level}
                  {p.kidMode ? " · kindmodus" : ""}
                </div>
              </div>
              <Chip tone={streak > 0 ? "gold" : "grey"}>
                <Icon name="flame" /> {streak}
              </Chip>
            </button>
          </Card>
        );
      })}
      <Card className="dashed row" onClick={() => nav.go({ name: "newProfile" })} role="button">
        + Nieuw profiel
      </Card>
      {message && <p className="muted center">{message}</p>}
      <div className="grow" />
      <div className="row spread">
        <Button variant="plain" onClick={() => void backup()}>
          Back-up maken
        </Button>
        <Button variant="plain" onClick={() => void restore()}>
          Back-up terugzetten
        </Button>
      </div>
    </Screen>
  );
}
