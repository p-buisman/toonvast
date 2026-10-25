import { useEffect } from "react";
import { Avatar } from "../components/common/Avatar.tsx";
import { Button } from "../components/common/Button.tsx";
import { Screen } from "../components/layout/Screen.tsx";
import { dayKey } from "../engine/common/dates.ts";
import { levelFor, streakStatus } from "../engine/game/rules.ts";
import { unlockAudio } from "../audio/sampler.ts";
import { useApp } from "../state/useApp.ts";
import { Icon } from "../components/common/Icon.tsx";

const AUTO_MS = 2200;

/** Right after choosing a profile: the avatar large with the name, so a wrong tap is obvious. */
export function WelcomeScreen() {
  const { profile, wallet, nav, chooseProfile } = useApp();

  useEffect(() => {
    const t = setTimeout(() => nav.reset({ name: "home" }), AUTO_MS);
    return () => clearTimeout(t);
  }, [nav]);

  if (!profile) return null;
  const { level } = levelFor(wallet.xp);
  const streak = streakStatus(wallet, dayKey()) === "none" ? 0 : wallet.streak;
  const left = Math.max(0, profile.dayGoal - wallet.todayXp);

  return (
    <Screen>
      <div className="welcome">
        <Avatar avatar={profile.avatar} name={profile.name} size={160} className="pop" />
        <h1>Hoi {profile.name}!</h1>
        <p className="muted">
          Level {level} · <Icon name="flame" /> {streak} {streak === 1 ? "dag" : "dagen"} · {left === 0 ? "dagdoel gehaald" : `nog ${left} XP voor je dagdoel`}
        </p>
        <Button
          block
          onClick={() => {
            unlockAudio();
            nav.reset({ name: "home" });
          }}
        >
          Verder
        </Button>
        <Button
          variant="plain"
          onClick={() => {
            chooseProfile(null);
            nav.reset({ name: "profiles" });
          }}
        >
          Dat ben ik niet
        </Button>
      </div>
    </Screen>
  );
}
