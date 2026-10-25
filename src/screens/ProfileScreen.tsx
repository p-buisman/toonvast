import { useState } from "react";
import { Button } from "../components/common/Button.tsx";
import { Card } from "../components/common/Card.tsx";
import { Screen } from "../components/layout/Screen.tsx";
import { AudioDebug } from "../components/common/AudioDebug.tsx";
import { playChord, playNote, unlockAudio } from "../audio/sampler.ts";
import { restoreBackupFile, saveBackupFile } from "../storage/backupFile.ts";
import { deleteProfile, updateProfile } from "../storage/repo.ts";
import { useApp } from "../state/useApp.ts";
import { MainTabs } from "./MainTabs.tsx";
import { ProfileForm, type ProfileFormValue } from "./ProfileForm.tsx";
import { lookOf } from "../engine/game/avatar.ts";
import { useProfilePurchases } from "../state/queries.ts";
import { Avatar } from "../components/common/Avatar.tsx";
import { ProfileSheet } from "../components/common/ProfileSheet.tsx";

export function ProfileScreen() {
  const { profile, nav, chooseProfile } = useApp();
  const [value, setValue] = useState<ProfileFormValue | null>(() =>
    profile ? { name: profile.name, color: profile.avatar.color, look: lookOf(profile.avatar), kidMode: profile.kidMode, dayGoal: profile.dayGoal } : null,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [soundTest, setSoundTest] = useState(false);
  const [sheet, setSheet] = useState(false);
  const purchases = useProfilePurchases(profile?.id);

  if (!profile || !value) return null;

  const change = (v: ProfileFormValue) => {
    setValue(v);
    if (v.name.trim() === "") return;
    void updateProfile(profile.id, {
      name: v.name.trim(),
      avatar: { ...profile.avatar, color: v.color, look: v.look },
      kidMode: v.kidMode,
      dayGoal: v.dayGoal,
    });
  };

  const remove = async () => {
    if (!window.confirm(`Profiel "${profile.name}" met alle voortgang verwijderen? Dit kan niet ongedaan worden gemaakt.`)) return;
    await deleteProfile(profile.id);
    chooseProfile(null);
    nav.reset({ name: "profiles" });
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
    <Screen
      title="Profiel"
      right={
        <button type="button" className="icon-btn" aria-label="Profiel wisselen" onClick={() => setSheet(true)}>
          <Avatar avatar={profile.avatar} name={profile.name} size={32} />
        </button>
      }
      footer={<MainTabs active="profile" />}
    >
      <Card className="stack">
        <ProfileForm value={value} onChange={change} owned={purchases} wearing={profile.avatar} />
      </Card>
      <Card className="stack">
        <h2>Back-up</h2>
        <p className="muted">Alle profielen op dit apparaat in één bestand, om op een ander apparaat terug te zetten. Terugzetten voegt samen en wist niets.</p>
        <div className="row">
          <Button variant="ghost" className="grow" onClick={() => void backup()}>
            Back-up maken
          </Button>
          <Button variant="ghost" className="grow" onClick={() => void restore()}>
            Terugzetten
          </Button>
        </div>
        {message && <p className="muted">{message}</p>}
      </Card>
      <Card className="stack">
        <h2>Geluid</h2>
        <p className="muted">
          Hoor je niets? Zet de stille-stand schakelaar van je iPhone uit en tik op de testtoon. De regel eronder laat zien wat de app meet.
        </p>
        <div className="row">
          <Button
            variant="ghost"
            className="grow"
            onClick={() => {
              unlockAudio();
              setSoundTest(true);
              playNote(69);
            }}
          >
            Speel een toon
          </Button>
          <Button
            variant="ghost"
            className="grow"
            onClick={() => {
              unlockAudio();
              setSoundTest(true);
              playChord([60, 64, 67], 2);
            }}
          >
            Speel een akkoord
          </Button>
        </div>
        {soundTest && <AudioDebug inline />}
      </Card>
      <Button variant="ghost" block onClick={() => nav.go({ name: "goals" })}>
        Wat wil je leren
      </Button>
      <Button variant="danger" block onClick={() => void remove()}>
        Profiel verwijderen
      </Button>
      {sheet && <ProfileSheet onClose={() => setSheet(false)} />}
    </Screen>
  );
}
