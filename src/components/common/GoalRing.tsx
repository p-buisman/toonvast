/** The day goal as a ring, filled in gold. */
export function GoalRing({ value, goal }: { value: number; goal: number }) {
  const pct = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;
  return (
    <div
      className="ring"
      style={{ background: `conic-gradient(var(--gold) 0 ${pct}%, var(--soft) ${pct}% 100%)` }}
      role="img"
      aria-label={`${value} van ${goal} XP`}
    >
      <b>
        {Math.min(value, goal)}/{goal}
      </b>
    </div>
  );
}
