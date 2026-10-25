import { useState } from "react";
import { Button } from "../components/common/Button.tsx";
import { IconButton, Screen } from "../components/layout/Screen.tsx";
import { AVATAR_COLORS, createProfile } from "../storage/repo.ts";
import { useApp } from "../state/useApp.ts";
import { ProfileForm, type ProfileFormValue } from "./ProfileForm.tsx";
import { Icon } from "../components/common/Icon.tsx";
import { DEFAULT_LOOK } from "../engine/game/avatar.ts";

const NOTHING: ReadonlySet<string> = new Set();

export function NewProfileScreen() {
  const { nav, chooseProfile } = useApp();
  const [value, setValue] = useState<ProfileFormValue>({ name: "", color: AVATAR_COLORS[0], look: DEFAULT_LOOK, kidMode: false, dayGoal: 60 });
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    const p = await createProfile(value.name.trim(), { color: value.color, hat: null, look: value.look }, value.kidMode, value.dayGoal);
    chooseProfile(p.id);
    nav.reset({ name: "welcome" });
  };

  return (
    <Screen
      title="Nieuw profiel"
      left={
        <IconButton label="Terug" onClick={nav.back}>
          <Icon name="chevron-left" />
        </IconButton>
      }
    >
      <ProfileForm value={value} onChange={setValue} owned={NOTHING} />
      <div className="grow" />
      <Button block disabled={busy || value.name.trim() === ""} onClick={() => void create()}>
        Aanmaken
      </Button>
    </Screen>
  );
}
