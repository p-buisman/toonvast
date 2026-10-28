import { Avatar } from "../components/common/Avatar.tsx";
import { Segmented } from "../components/common/Segmented.tsx";
import { ACCENT_COLORS, FREE_LOOK, FUR_COLORS, FUZZBALL_EYES, FUZZBALL_MOUTHS, IRIS_COLORS, LOOK_LABEL, type AvatarLook } from "../engine/game/avatar.ts";
import { DAY_GOALS } from "../engine/game/rules.ts";
import { unlockedValues } from "../engine/game/shop.ts";
import type { Avatar as AvatarData } from "../storage/db.ts";

export interface ProfileFormValue {
  name: string;
  color: string;
  look: AvatarLook;
  kidMode: boolean;
  dayGoal: number;
}

interface Props {
  value: ProfileFormValue;
  onChange: (v: ProfileFormValue) => void;
  /** Shop items this profile owns: they unlock extra eyes and mouths. */
  owned: ReadonlySet<string>;
  /** What the profile wears now (hat, glasses, headphones, bow, background), so the preview shows the whole avatar. */
  wearing?: Pick<AvatarData, "hat" | "eyes" | "ears" | "neck" | "background">;
}

/** The fields of a profile, with the avatar composed part by part; used for a new profile and for editing one. */
export function ProfileForm({ value, onChange, owned, wearing }: Props) {
  const avatar: AvatarData = { hat: null, ...wearing, color: value.color, look: value.look };
  const setLook = (part: Partial<AvatarLook>) => onChange({ ...value, look: { ...value.look, ...part } });
  const picks = <K extends "eyes" | "mouth">(part: K, all: readonly AvatarLook[K][], label: string) => {
    const free = FREE_LOOK[part] as readonly string[];
    const extra = unlockedValues(part === "eyes" ? "face" : "mouth", owned);
    const options = all.filter((v) => free.includes(v) || extra.includes(v));
    const hidden = all.length - options.length;
    return (
      <div>
        <h2>{label}</h2>
        <div className="look-picks" role="radiogroup" aria-label={label}>
          {options.map((v) => (
            <button
              key={String(v)}
              type="button"
              role="radio"
              aria-checked={value.look[part] === v}
              aria-label={LOOK_LABEL[String(v)] ?? String(v)}
              className={value.look[part] === v ? "on" : ""}
              onClick={() => setLook({ [part]: v } as Partial<AvatarLook>)}
            >
              <Avatar avatar={{ ...avatar, look: { ...value.look, [part]: v } }} name={value.name} size={44} />
            </button>
          ))}
        </div>
        {hidden > 0 && (
          <p className="muted" style={{ marginTop: 6 }}>
            Nog {hidden} in de winkel.
          </p>
        )}
      </div>
    );
  };
  const colors: string[] = [...FUR_COLORS];
  if (!colors.includes(value.color)) colors.push(value.color);
  const swatches = (label: string, entries: readonly [string, string][], current: string, pick: (v: string) => void, note?: string) => (
    <div>
      <h2>{label}</h2>
      <div className="swatches" role="radiogroup" aria-label={label}>
        {entries.map(([v, c]) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={current === v}
            className={current === v ? "on" : ""}
            style={{ background: c }}
            aria-label={LOOK_LABEL[v] ?? `kleur ${v}`}
            onClick={() => pick(v)}
          />
        ))}
      </div>
      {note && (
        <p className="muted" style={{ marginTop: 6 }}>
          {note}
        </p>
      )}
    </div>
  );

  return (
    <>
      <label className="stack" style={{ gap: 6 }}>
        <h2>Naam</h2>
        <input
          className="text-input"
          type="text"
          value={value.name}
          maxLength={24}
          autoComplete="off"
          onChange={(e) => onChange({ ...value, name: e.target.value })}
        />
      </label>
      <div className="center">
        <Avatar avatar={avatar} name={value.name} size={140} />
      </div>
      {swatches(
        "Vacht",
        colors.map((c) => [c, c]),
        value.color,
        (c) => onChange({ ...value, color: c }),
        "De kleur van de vacht; de achtergrond kleurt vanzelf mee.",
      )}
      {swatches("Iris", Object.entries(IRIS_COLORS), value.look.iris, (v) => setLook({ iris: v as AvatarLook["iris"] }))}
      {swatches(
        "Kleur van je spullen",
        Object.entries(ACCENT_COLORS),
        value.look.accent,
        (v) => setLook({ accent: v as AvatarLook["accent"] }),
        "Pet, hoeden, kroon, strik, gekleurde bril en koptelefoon kleuren mee.",
      )}
      {picks("eyes", FUZZBALL_EYES, "Blik")}
      {picks("mouth", FUZZBALL_MOUTHS, "Mond")}
      <div>
        <h2>Kindmodus</h2>
        <Segmented
          options={[
            { value: false, label: "Uit" },
            { value: true, label: "Aan" },
          ]}
          value={value.kidMode}
          onChange={(kidMode) => onChange({ ...value, kidMode })}
        />
        <p className="muted" style={{ marginTop: 6 }}>
          Grotere knoppen en meer feest bij goede antwoorden.
        </p>
      </div>
      <div>
        <h2>Dagdoel</h2>
        <Segmented
          options={DAY_GOALS.map((g) => ({ value: g, label: `${g} XP` }))}
          value={value.dayGoal}
          onChange={(dayGoal) => onChange({ ...value, dayGoal })}
        />
        <p className="muted" style={{ marginTop: 6 }}>
          Eén ronde van 10 vragen levert ongeveer 100 XP op als alles goed is.
        </p>
      </div>
    </>
  );
}
