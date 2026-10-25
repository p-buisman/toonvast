import type React from "react";

// Generated from the Toonvast design system (Icon card): 24x24 outline icons, one stroke weight, round caps.
// Regenerate rather than edit by hand; the drawing lives in the design system.

export const ICON_NAMES = [
  "note",
  "notes",
  "staff",
  "piano",
  "guitar",
  "chart-line",
  "bag",
  "user",
  "chevron-left",
  "xmark",
  "check",
  "gear",
  "book",
  "play",
  "arrow-right",
  "lock",
  "flame",
  "coin",
  "trophy",
  "star",
  "gift",
  "shield",
  "hat-top",
  "cap",
  "crown",
  "glasses",
  "headphones",
  "sparkles",
  "wave",
  "tree",
  "sun",
  "treble-clef",
  "bass-clef",
  "ledger",
  "bolt",
  "ear",
  "moon",
] as const;
export type IconName = (typeof ICON_NAMES)[number];

/** The strokes of each icon, drawn on a 0 0 24 24 viewBox with stroke="currentColor". */
export const ICON_PATHS: Record<IconName, React.ReactNode> = {
  note: (
    <>
      <circle cx="7.5" cy="17.5" r="3" key="0" />
      <path d="M10.5 17.5V4c0 2.5 1.5 3 3.5 4.5 1.3 1 1.5 2.5 1 4" key="1" />
    </>
  ),
  notes: (
    <>
      <path d="M9 18.5V5.5l9-2v12" key="0" />
      <circle cx="6.5" cy="18.5" r="2.5" key="1" />
      <circle cx="15.5" cy="15.5" r="2.5" key="2" />
    </>
  ),
  staff: (
    <>
      <path d="M3 7h18M3 12h7M3 17h7" key="0" />
      <circle cx="15" cy="16" r="2.5" key="1" />
      <path d="M17.5 16V8" key="2" />
    </>
  ),
  piano: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="1.5" key="0" />
      <path d="M6.3 18v-5.5M10.1 18v-5.5M13.9 18v-5.5M17.7 18v-5.5" key="1" />
      <path d="M6.3 6v5.2M10.1 6v5.2M17.7 6v5.2" strokeWidth="3" key="2" />
    </>
  ),
  guitar: (
    <>
      <rect x="10.6" y="1.5" width="2.8" height="8.5" rx="1" key="0" />
      <path
        d="M12 9.5C9.4 9.5 7.6 11 7.6 13c0 1.3.7 2.1 1.3 2.9C7.5 16.7 6.5 17.9 6.5 19.4c0 2.1 2.5 3.1 5.5 3.1s5.5-1 5.5-3.1c0-1.5-1-2.7-2.4-3.5.6-.8 1.3-1.6 1.3-2.9 0-2-1.8-3.5-4.4-3.5z"
        key="1"
      />
      <circle cx="12" cy="15.5" r="2" key="2" />
    </>
  ),
  "chart-line": (
    <>
      <path d="M4 4v15a1 1 0 0 0 1 1h15" key="0" />
      <path d="M8 14l3.5-4 3 3L19 7" key="1" />
    </>
  ),
  bag: (
    <>
      <path d="M6 8h12l.9 11.1a1 1 0 0 1-1 1.1H6.1a1 1 0 0 1-1-1.1L6 8z" key="0" />
      <path d="M9 10V6.5a3 3 0 0 1 6 0V10" key="1" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" key="0" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" key="1" />
    </>
  ),
  "chevron-left": (
    <>
      <path d="M14.5 5.5L8 12l6.5 6.5" key="0" />
    </>
  ),
  xmark: (
    <>
      <path d="M6 6l12 12M18 6L6 18" key="0" />
    </>
  ),
  check: (
    <>
      <path d="M5 12.5l4.5 4.5L19 7.5" key="0" />
    </>
  ),
  gear: (
    <>
      <path
        d="M10.0 4.5L10.4 1.6L13.6 1.6L14.0 4.5L15.9 5.2L18.2 3.5L20.5 5.8L18.8 8.1L19.5 10.0L22.4 10.4L22.4 13.6L19.5 14.0L18.8 15.9L20.5 18.2L18.2 20.5L15.9 18.8L14.0 19.5L13.6 22.4L10.4 22.4L10.0 19.5L8.1 18.8L5.8 20.5L3.5 18.2L5.2 15.9L4.5 14.0L1.6 13.6L1.6 10.4L4.5 10.0L5.2 8.1L3.5 5.8L5.8 3.5L8.1 5.2Z"
        key="0"
      />
      <circle cx="12" cy="12" r="3.2" key="1" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" key="0" />
      <path d="M4 18a2.5 2.5 0 0 1 2.5-2.5H20" key="1" />
    </>
  ),
  play: (
    <>
      <path d="M7 4.5v15a1 1 0 0 0 1.5.9l12-7.5a1 1 0 0 0 0-1.8l-12-7.5A1 1 0 0 0 7 4.5z" key="0" />
    </>
  ),
  "arrow-right": (
    <>
      <path d="M4 12h16M13 5l7 7-7 7" key="0" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" key="0" />
      <path d="M8 11V7.5a4 4 0 0 1 8 0V11" key="1" />
    </>
  ),
  flame: (
    <>
      <path d="M12 2.5c1.2 3.3 5.5 5.5 5.5 10.5a5.5 5.5 0 0 1-11 0c0-1.9.8-3.4 2-4.6.3 1.5 1.1 2.4 2.2 2.8C10.1 8.4 11.3 5.6 12 2.5z" key="0" />
    </>
  ),
  coin: (
    <>
      <circle cx="12" cy="12" r="8.5" key="0" />
      <circle cx="12" cy="12" r="4.5" key="1" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 4h8v6a4 4 0 0 1-8 0z" key="0" />
      <path d="M8 6H5.5a2.5 2.5 0 0 0 2.5 5M16 6h2.5a2.5 2.5 0 0 1-2.5 5" key="1" />
      <path d="M12 14v3.5M8.5 20.5h7M9.5 20.5v-1.5a1.5 1.5 0 0 1 1.5-1.5h2a1.5 1.5 0 0 1 1.5 1.5v1.5" key="2" />
    </>
  ),
  star: (
    <>
      <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 16.9l-5.3 2.8 1.1-5.9-4.3-4.1 5.9-.8z" key="0" />
    </>
  ),
  gift: (
    <>
      <rect x="4" y="11" width="16" height="9.5" rx="1.5" key="0" />
      <path d="M3 7.5h18V11H3zM12 7.5v13" key="1" />
      <path d="M12 7.5c-1-3-5-3.5-5-1.5S10.5 7.5 12 7.5zM12 7.5c1-3 5-3.5 5-1.5S13.5 7.5 12 7.5z" key="2" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l8 3v6c0 4.5-3.4 7.7-8 9-4.6-1.3-8-4.5-8-9V6z" key="0" />
    </>
  ),
  "hat-top": (
    <>
      <path d="M7 14V5.5A1.5 1.5 0 0 1 8.5 4h7A1.5 1.5 0 0 1 17 5.5V14" key="0" />
      <path d="M3 14.5c0 1.4 4 2.5 9 2.5s9-1.1 9-2.5-1.9-1.9-4-2.2M3 14.5c0-1.1 1.9-1.9 4-2.2" key="1" />
    </>
  ),
  cap: (
    <>
      <path d="M5 13.5a7 7 0 0 1 14 0V15H5z" key="0" />
      <path d="M12 6.5V15" key="1" />
      <path d="M19 15h.5c1.7 0 3 .8 3 1.8s-1.3 1.7-3 1.7H4" key="2" />
    </>
  ),
  crown: (
    <>
      <path d="M4.5 17.5L3 7.5l5 3.5 4-6 4 6 5-3.5-1.5 10z" key="0" />
      <path d="M4.5 17.5h15v2.5h-15z" key="1" />
    </>
  ),
  glasses: (
    <>
      <circle cx="7" cy="14" r="3.5" key="0" />
      <circle cx="17" cy="14" r="3.5" key="1" />
      <path d="M10.5 14h3M3.5 14l1-4.5a1.5 1.5 0 0 1 1.5-1h1M20.5 14l-1-4.5a1.5 1.5 0 0 0-1.5-1h-1" key="2" />
    </>
  ),
  headphones: (
    <>
      <path d="M4 15v-3a8 8 0 0 1 16 0v3" key="0" />
      <rect x="3" y="13" width="4" height="7" rx="1.5" key="1" />
      <rect x="17" y="13" width="4" height="7" rx="1.5" key="2" />
    </>
  ),
  sparkles: (
    <>
      <path d="M10 4l1.5 4.5L16 10l-4.5 1.5L10 16l-1.5-4.5L4 10l4.5-1.5z" key="0" />
      <path d="M18 14l.9 2.1L21 17l-2.1.9L18 20l-.9-2.1L15 17l2.1-.9z" key="1" />
    </>
  ),
  wave: (
    <>
      <path d="M3 9c3 0 3-2.5 6-2.5s3 2.5 6 2.5 3-2.5 6-2.5M3 15c3 0 3-2.5 6-2.5s3 2.5 6 2.5 3-2.5 6-2.5" key="0" />
    </>
  ),
  tree: (
    <>
      <path d="M12 3l5 6h-2.5l3.5 5h-3l3 4.5H6L9 14H6l3.5-5H7z" key="0" />
      <path d="M12 18.5V21" key="1" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" key="0" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" key="1" />
    </>
  ),
  "treble-clef": (
    <>
      <path d="M13.4 2.6L12.3 19.6C12.2 20.9 11.3 21.6 10.5 21.5C9.7 21.4 9.4 20.5 9.7 19.8" key="0" />
      <path
        d="M13.4 2.6C12.9 2 12.3 2.4 11.9 3.5C11 5.9 10.7 8.4 10.9 10.6C11.2 12.6 14 12.6 15.1 14.2C16 15.6 15.1 17.4 13.3 17.9C11 18.5 8.8 17 8.8 15C8.8 13.4 10.1 12.3 11.7 12.5C13 12.7 13.6 13.8 13.3 14.8"
        key="1"
      />
    </>
  ),
  "bass-clef": (
    <>
      <circle cx="8.6" cy="9.8" r="1.3" key="0" />
      <path d="M8.6 9.8c0-2.4 1.7-4 3.6-4 2.6 0 4.4 2.1 4.4 5 0 4.2-3.5 7.6-8.1 9.1" key="1" />
      <circle cx="18.8" cy="7.8" r="1.1" key="2" />
      <circle cx="18.8" cy="11.8" r="1.1" key="3" />
    </>
  ),
  ledger: (
    <>
      <path d="M4 15h17" key="0" />
      <circle cx="10" cy="15" r="3.2" key="1" />
      <path d="M13.2 15V5.5" key="2" />
    </>
  ),
  bolt: (
    <>
      <path d="M13 2.5L5.5 13.5h6l-1 8L18.5 10.5h-6z" key="0" />
    </>
  ),
  ear: (
    <>
      <path d="M7.5 10a5.5 5.5 0 0 1 11 0c0 3-2.5 4-3 6.5-.3 1.8-1.5 3-3.2 3-1 0-2-.6-2.3-1.5" key="0" />
      <path d="M10.8 10a2.3 2.3 0 0 1 4.6 0c0 1.5-1.6 2-1.6 3.5" key="1" />
    </>
  ),
  moon: (
    <>
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" key="0" />
    </>
  ),
};
