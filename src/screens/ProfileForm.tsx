import { Avatar } from "../components/common/Avatar.tsx";
import { Segmented } from "../components/common/Segmented.tsx";
import {
  AVATAR_COLORS,
  AVATAR_KINDS,
  CLOTHES_STYLES,
  EYE_SIZES,
  EYE_STYLES,
  FREE_LOOK,
  FUR_COLORS,
  FUZZ_STYLES,
  FUZZBALL_EYES,
  HAIR_COLORS,
  HAIR_STYLES,
  HEAD_SHAPES,
  IRIS_COLORS,
  LOOK_LABEL,
  MOUTH_STYLES,
  SKIN_TONES,
  type AvatarLook,
} from "../engine/game/avatar.ts";
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
  /** Shop items this profile owns: they unlock extra hair, faces, clothes and colours. */
  owned: ReadonlySet<string>;
  /** What the profile wears now (hat, glasses, headphones, bow, background), so the preview shows the whole avatar. */
  wearing?: Pick<AvatarData, "hat" | "eyes" | "ears" | "neck" | "background">;
}

/** The fields of a profile, with the avatar composed part by part; used for a new profile and for editing one. */
export function ProfileForm({ value, onChange, owned, wearing }: Props) {
  const avatar: AvatarData = { hat: null, ...wearing, color: value.color, look: value.look };
  const setLook = (part: Partial<AvatarLook>) => onChange({ ...value, look: { ...value.look, ...part } });
  const kind = value.look.kind;
  const picks = <K extends keyof AvatarLook>(part: K, all: readonly AvatarLook[K][], label: string) => {
    const free = (FREE_LOOK[kind] as Partial<Record<keyof AvatarLook, readonly string[]>>)[part];
    const extra = free ? unlockedValues(part === "eyes" ? "face" : (part as "hair" | "mouth" | "clothes" | "fuzz"), owned) : [];
    const options = all.filter((v) => !free || free.includes(v) || extra.includes(v));
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
  const colors = kind === "pluizenbol" ? [...FUR_COLORS] : [...AVATAR_COLORS, ...unlockedValues("color", owned)];
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
      {picks("kind", AVATAR_KINDS, "Soort")}
      {kind === "poppetje" ? (
        <>
          {swatches("Huid", Object.entries(SKIN_TONES), value.look.skin, (v) => setLook({ skin: v as AvatarLook["skin"] }))}
          {picks("head", Object.keys(HEAD_SHAPES) as AvatarLook["head"][], "Hoofd")}
          {picks("hair", HAIR_STYLES, "Haar")}
          {swatches("Haarkleur", Object.entries(HAIR_COLORS), value.look.hairColor, (v) => setLook({ hairColor: v as AvatarLook["hairColor"] }))}
          {picks("eyes", EYE_STYLES, "Ogen")}
          {picks(
            "mouth",
            MOUTH_STYLES.filter((m) => m !== "tong"),
            "Mond",
          )}
          {picks("clothes", CLOTHES_STYLES, "Kleding")}
          {swatches(
            "Kleur",
            colors.map((c) => [c, c]),
            value.color,
            (c) => onChange({ ...value, color: c }),
            "De kleur van de kleding; de achtergrond kleurt vanzelf mee.",
          )}
        </>
      ) : (
        <>
          {swatches(
            "Vacht",
            colors.map((c) => [c, c]),
            value.color,
            (c) => onChange({ ...value, color: c }),
            "De kleur van de vacht; de achtergrond kleurt vanzelf mee.",
          )}
          {picks("fuzz", FUZZ_STYLES, "Pluis")}
          {picks("eyeSize", Object.keys(EYE_SIZES) as AvatarLook["eyeSize"][], "Ogen")}
          {swatches("Iris", Object.entries(IRIS_COLORS), value.look.iris, (v) => setLook({ iris: v as AvatarLook["iris"] }))}
          {picks("eyes", FUZZBALL_EYES, "Blik")}
          {picks("mouth", MOUTH_STYLES, "Mond")}
        </>
      )}
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
