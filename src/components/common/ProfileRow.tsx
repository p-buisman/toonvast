import type { ReactNode } from "react";
import { dayKey } from "../../engine/common/dates.ts";
import { levelFor, streakStatus, type Wallet } from "../../engine/game/rules.ts";
import type { Profile } from "../../storage/db.ts";
import { Avatar } from "./Avatar.tsx";
import { Chip } from "./Chip.tsx";
import { Icon } from "./Icon.tsx";

interface Props {
  profile: Profile;
  wallet?: Wallet;
  onClick: () => void;
  /** Shown at the right instead of the streak chip. */
  mark?: ReactNode;
  size?: number;
}

/** One profile as a tappable row: avatar, name, level and the streak; used wherever a profile is picked. */
export function ProfileRow({ profile, wallet, onClick, mark, size = 48 }: Props) {
  const level = levelFor(wallet?.xp ?? 0).level;
  const streak = wallet && streakStatus(wallet, dayKey()) !== "none" ? wallet.streak : 0;
  return (
    <button type="button" className="row" style={{ width: "100%", textAlign: "left", padding: 6, minHeight: 56 }} onClick={onClick}>
      <Avatar avatar={profile.avatar} name={profile.name} size={size} />
      <div className="grow">
        <b>{profile.name}</b>
        <div className="muted">
          Level {level}
          {profile.kidMode ? " · kindmodus" : ""}
        </div>
      </div>
      {mark ?? (
        <Chip tone={streak > 0 ? "gold" : "grey"}>
          <Icon name="flame" /> {streak}
        </Chip>
      )}
    </button>
  );
}
