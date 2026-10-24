import { useState } from "react";
import { Button } from "../components/common/Button.tsx";
import { IconButton, Screen } from "../components/layout/Screen.tsx";
import { AVATAR_COLORS, createProfile } from "../storage/repo.ts";
import { useApp } from "../state/useApp.ts";
import { ProfileForm, type ProfileFormValue } from "./ProfileForm.tsx";

export function NewProfileScreen() {
  const { nav, chooseProfile } = useApp();
  const [value, setValue] = useState<ProfileFormValue>({ name: "", color: AVATAR_COLORS[0], kidMode: false, dayGoal: 60 });
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    const p = await createProfile(value.name.trim(), { color: value.color, hat: null }, value.kidMode, value.dayGoal);
    chooseProfile(p.id);
    nav.reset({ name: "welcome" });
  };

  return (
    <Screen
      title="Nieuw profiel"
      left={
        <IconButton label="Terug" onClick={nav.back}>
          ‹
        </IconButton>
      }
    >
      <ProfileForm value={value} onChange={setValue} />
      <div className="grow" />
      <Button block disabled={busy || value.name.trim() === ""} onClick={() => void create()}>
        Aanmaken
      </Button>
    </Screen>
  );
}
