-- One row per profile on a device. No names and no progress: only where to push, and when.
CREATE TABLE IF NOT EXISTS reminders (
  device_id TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  time TEXT NOT NULL,
  tz TEXT NOT NULL,
  last_goal_date TEXT,
  last_sent_date TEXT,
  PRIMARY KEY (device_id, profile_id)
);
