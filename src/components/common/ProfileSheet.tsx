import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../storage/db.ts";
import { touchProfile } from "../../storage/repo.ts";
import { useApp } from "../../state/useApp.ts";
import { Button } from "./Button.tsx";
import { Chip } from "./Chip.tsx";
import { ProfileRow } from "./ProfileRow.tsx";

/** The sheet behind the avatar: who is practising, the other profiles to switch to with one tap, and a new one. */
export function ProfileSheet({ onClose }: { onClose: () => void }) {
  const { profile, chooseProfile, nav } = useApp();
  const profiles = useLiveQuery(() => db.profiles.orderBy("lastUsedAt").reverse().toArray(), []);
  const wallets = useLiveQuery(() => db.wallets.toArray(), []);
  if (!profile) return null;
  const walletOf = (id: string) => wallets?.find((w) => w.profileId === id);
  const others = (profiles ?? []).filter((p) => p.id !== profile.id);

  const pick = async (id: string) => {
    await touchProfile(id);
    chooseProfile(id);
    nav.reset({ name: "home" });
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Profiel wisselen" onClick={onClose}>
      <div className="modal" style={{ gap: 4 }} onClick={(e) => e.stopPropagation()}>
        <ProfileRow profile={profile} wallet={walletOf(profile.id)} onClick={onClose} mark={<Chip tone="ok">Nu</Chip>} />
        {others.length > 0 && <h2 style={{ margin: "8px 0 0" }}>Wisselen naar</h2>}
        {others.map((p) => (
          <ProfileRow key={p.id} profile={p} wallet={walletOf(p.id)} onClick={() => void pick(p.id)} />
        ))}
        <Button
          variant="ghost"
          block
          onClick={() => {
            onClose();
            nav.go({ name: "newProfile" });
          }}
        >
          + Nieuw profiel
        </Button>
        <Button variant="plain" block onClick={onClose}>
          Annuleren
        </Button>
      </div>
    </div>
  );
}
