export type DotState = "ok" | "bad" | "now" | "todo";

/** One dash per question of a session: green right, red wrong, blue the current one. */
export function ProgressDots({ states }: { states: DotState[] }) {
  return (
    <div className="dots" aria-hidden="true">
      {states.map((s, i) => (
        <i key={i} className={s === "todo" ? "" : s} />
      ))}
    </div>
  );
}
