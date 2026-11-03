import { useState } from "react";
import { Button } from "../components/common/Button.tsx";
import { Card } from "../components/common/Card.tsx";
import { Segmented } from "../components/common/Segmented.tsx";
import { DEFAULT_REMINDER_TIME, REMINDER_TIMES } from "../engine/game/reminder.ts";
import { reminderSupport, removeReminder, sendTestReminder, setReminder } from "../notifications/reminders.ts";
import type { Profile } from "../storage/db.ts";

const ON_OFF = [
  { value: false, label: "Uit" },
  { value: true, label: "Aan" },
];
const FAILED = "Dat lukte niet. Controleer je internet en probeer het opnieuw.";
const NOT_POSSIBLE = {
  install:
    "Op iPhone en iPad kan dit alleen als Toonvast op je beginscherm staat. Tik in Safari op Deel, kies Zet op beginscherm en open de app daarna vanaf daar.",
  denied: "Meldingen staan uit voor Toonvast. Zet ze aan via Instellingen, Meldingen, Toonvast.",
  unsupported: "Deze browser kan geen meldingen ontvangen.",
};

/** The daily reminder of this profile: on or off, at what time. */
export function ReminderCard({ profile }: { profile: Profile }) {
  const [support, setSupport] = useState(reminderSupport);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const on = support === "ok" && profile.reminder !== undefined;
  const blocked = support === "install" || support === "denied" || support === "unsupported";

  const run = async (work: () => Promise<string | null>) => {
    setBusy(true);
    setMessage(null);
    try {
      setMessage(await work());
    } catch {
      setMessage(FAILED);
    }
    setSupport(reminderSupport());
    setBusy(false);
  };

  const toggle = (next: boolean) => {
    if (busy || next === on) return;
    void run(async () => {
      if (next) await setReminder(profile, profile.reminder?.time ?? DEFAULT_REMINDER_TIME);
      else await removeReminder(profile);
      return null;
    });
  };

  return (
    <Card className="stack">
      <h2>Herinnering</h2>
      <Segmented options={ON_OFF} value={on} onChange={toggle} ariaLabel="Herinnering" disabled={blocked || busy} />
      {on && (
        <div className="row spread">
          <label htmlFor="reminder-time">Elke dag om</label>
          <select
            id="reminder-time"
            className="time-select"
            value={profile.reminder!.time}
            disabled={busy}
            onChange={(e) => {
              const time = e.target.value;
              void run(async () => {
                await setReminder(profile, time);
                return null;
              });
            }}
          >
            {REMINDER_TIMES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      )}
      {blocked ? (
        <p className="muted">{NOT_POSSIBLE[support]}</p>
      ) : (
        <p className="muted">
          {on
            ? `Je krijgt alleen een melding als ${profile.name} die dag het dagdoel nog niet heeft gehaald. Elk profiel heeft zijn eigen herinnering.`
            : "Krijg een melding als je die dag nog niet hebt geoefend, zodat je reeks blijft staan."}{" "}
          Op onze server staan alleen een anoniem push-adres, je tijd en de laatste dag dat je doel gehaald is. Namen en voortgang blijven op dit apparaat.
        </p>
      )}
      {on && (
        <Button
          block
          variant="ghost"
          disabled={busy}
          onClick={() =>
            void run(async () => {
              await sendTestReminder(profile);
              return "Verstuurd. Sluit de app even om de melding te zien.";
            })
          }
        >
          Stuur een proefmelding
        </Button>
      )}
      {message && <p className="muted">{message}</p>}
    </Card>
  );
}
