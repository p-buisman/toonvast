export function ProgressBar({ value, max, tone = "accent" }: { value: number; max: number; tone?: "accent" | "gold" }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className={tone === "gold" ? "bar gold" : "bar"} role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}
