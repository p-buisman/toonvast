import { useEffect, useState } from "react";
import { audioDiagnostics, type AudioDiagnostics } from "../../audio/sampler.ts";

/** Shown with `?debug=1` in the address bar: the sampler's state and the measured output level. */
export function AudioDebug({ inline = false }: { inline?: boolean }) {
  const [d, setD] = useState<AudioDiagnostics | null>(null);
  const [maxPeak, setMaxPeak] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      const next = audioDiagnostics();
      setD(next);
      setMaxPeak((p) => Math.max(p, next.peak));
    }, 100);
    return () => clearInterval(t);
  }, []);
  if (!d) return null;
  return (
    <div className={inline ? "debug inline" : "debug"}>
      audio {d.state} · samples {d.buffers} · fouten {d.decodeErrors} · laatst {d.lastPath} · piek {d.peak.toFixed(2)} (max {maxPeak.toFixed(2)})
      {d.lastError ? `\n${d.lastError}` : ""}
    </div>
  );
}
