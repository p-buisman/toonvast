import { Segmented } from "../components/common/Segmented.tsx";
import { DAY_GOALS } from "../engine/game/rules.ts";
import { AVATAR_COLORS } from "../storage/repo.ts";

export interface ProfileFormValue {
  name: string;
  color: string;
  kidMode: boolean;
  dayGoal: number;
}

/** The fields of a profile; used for a new profile and for editing one. */
export function ProfileForm({ value, onChange }: { value: ProfileFormValue; onChange: (v: ProfileFormValue) => void }) {
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
      <div>
        <h2>Kleur</h2>
        <div className="swatches">
          {AVATAR_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={c === value.color ? "on" : ""}
              style={{ background: c }}
              aria-label={`kleur ${c}`}
              onClick={() => onChange({ ...value, color: c })}
            />
          ))}
        </div>
      </div>
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
