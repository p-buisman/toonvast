# Toonvast - werkafspraken

Educatieve muziek-app (PWA) voor piano en gitaar. De verkenning met alle keuzes staat in
`docs/verkenning.md`; de schetsen in `docs/schetsen/`. Lees de verkenning voordat je iets groters bouwt.

## Werkwijze

- Antwoord in het Nederlands. Code, commentaar en commitberichten in het Engels; teksten in de app in het Nederlands.
- Commit alleen als daarom gevraagd wordt; `git add` met de bestanden zelf, nooit `git add -A`.
  Push na elke commit naar `origin` (github.com/p-buisman/toonvast, openbaar). GitHub Pages bouwt vanzelf uit `main`.
- Voor een grotere wijziging in de interface eerst een schets: statische HTML zonder scripts, in `docs/schetsen/`.
- Nootnamen internationaal (C♯, B♭); geen Nederlandse namen. Gitaarnotatie klinkt een octaaf lager dan geschreven
  (`GUITAR_WRITTEN_OFFSET` in `src/engine/instruments/guitar.ts`).
- `npm test` (Vitest), `npm run lint` (oxlint), `npm run opmaak` (Prettier) voor een commit.

## Hergebruik eerst

Gedeelde code is de standaard, geen latere opruimklus.

1. Kijk voordat je iets schrijft in de kaart hieronder of het er al is.
2. Zou er een tweede kopie ontstaan van een berekening, scherm-onderdeel of antwoordvorm: maak er dan meteen
   gedeelde code van, en zet de eerste plek erop over.
3. Een nieuwe module (oefenvorm) begint vanuit de gedeelde onderdelen, niet vanuit een kopie van een andere module.
4. Zeg bij het afronden wat gedeeld is, en wat bewust per module blijft en waarom.
5. Werk deze kaart bij als er iets gedeelds bijkomt.

### Kaart van de gedeelde code

Engine (`src/engine/`):

- `common/pitch.ts` - toonhoogte met spelling: `Pitch` (letter, voorteken, octaaf), `midiOf`, `pitchKey`, `pitchName`,
  `sameSound` (enharmonisch gelijk), `spellMidi` (een MIDI-nummer spellen met ♯ of ♭).
- `common/clef.ts` - notenbalkpositie per sleutel: `staffPosition`, `pitchAtPosition`, `ledgerLines`, `rangeForLevel`.
- `common/random.ts` - `pick`, `shuffle`, `seeded` (vaste reeks voor tests en vaste keuzes per vraag).
- `common/chord.ts` - drieklanken met spelling: `PitchClass`, `triadPcs`, `chordPcs` (per ligging), `voicing` (ligging op de
  notenbalk per sleutel), `chordName`/`chordKey`, de majeurtoonsoorten (`MAJOR_KEYS`) en `diatonicTriads`.
- `instruments/piano.ts` - toetsindeling voor een bereik: `whiteKeys`, `blackKeys`, `PIANO_RANGES`, `rangeCovering`.
- `instruments/guitar.ts` - standaardstemming, `positionsFor(midi, maxFret)`, `preferredPosition` (hoogste snaar, laagste
  fret), `midiAt(string, fret)`, `GUITAR_WRITTEN_OFFSET`.
- `instruments/guitarChords.ts` - de greeptabel (`CHORD_SHAPES`, één standaardgreep per akkoord), `shapeFor`, `shapeMidis`.
- `learning/modules.ts` - de oefenvormen (`MODULES`): id, naam, instrument, soort (noot/akkoord), vraag- en antwoordvorm.
- `learning/items.ts` - de leeritems van een module binnen de instellingen, in didactische volgorde (`itemsFor`:
  `noteItemsFor` en `chordItemsFor`); een `LearnItem` is een `NoteItem` of een `ChordItem` met zijn ligging.
- `learning/answers.ts` - `checkAnswer` voor alle antwoordvormen (naam, toets, hals, akkoordnaam, toetsenset, notenset,
  greep) met uitleg bij een bijna-goed antwoord; `describeTarget` voor de feedbackkaart.
- `learning/scheduler.ts` - FSRS-koppeling: `rate` (goed/fout + reactietijd → beoordeling), `review`, `isMastered`.
- `learning/session.ts` - sessie-opbouw (`buildSession`): eerst wat aan de beurt is, dan nieuw voor zover de werkvoorraad
  ruimte heeft (`newItemBudget`: vrije plekken, niets na een sessie onder 80%), dan herhaling.
- `game/rules.ts` - XP per antwoord, combo, levels, dagdoel, streak met beschermer, munten.
- `game/badges.ts` - de badges (`BADGES`, per instrument waar dat zo is) en `earnedBadges` (welke nu gelden).
- `game/shop.ts` - de winkelcatalogus (`SHOP_ITEMS`: avatar-onderdelen per slot, thema's, streakbeschermer), `buyRefusal`.

Opslag (`src/storage/`): `db.ts` (Dexie-schema, versie 2 met `purchases` en `badges`), `repo.ts` (alle lees/schrijf-functies,
ook `buyItem`, `awardBadges`), `backup.ts` (export/import). `src/state/finishSession.ts` boekt een sessie en kent badges toe.

Audio (`src/audio/`): `sampler.ts` (Web Audio, piano-samples, ontgrendelen op iOS), `cues.ts` (goed/fout-tonen).

Componenten (`src/components/`):

- `music/Staff.tsx` - notenbalk (SVG) met sleutel, noten, voortekens, hulplijnen; ook als invoer (tik op positie).
- `music/Piano.tsx` - schermpiano (SVG, scrollbaar) met oplichtende toetsen.
- `music/Fretboard.tsx` - gitaarhals (SVG) met frets 0-4, stippen en open snaren.
- `music/NoteNameButtons.tsx` - letterknoppen met ♯/♭-schakelaar.
- `music/ChordNameButtons.tsx` - akkoordnaam: ♯/♭, majeur/mineur, ligging, dan de letter.
- `music/AccidentalToggle.tsx` - ♭ ♮ ♯ voor noten op de notenbalk zetten.
- `music/ChordDiagram.tsx` - klein greepdiagram (songboek-stijl), ook als keuzeknop.
- `common/` - `Button`, `Card`, `Segmented`, `Tabs`, `Chip`, `ProgressBar`, `Avatar` (SVG met gekochte onderdelen), `TabBar`,
  `GoalRing`, `ProgressDots`, `AudioDebug` (`?debug=1`).
- `layout/Screen.tsx` - de schermopbouw (kop, inhoud, tabbalk).

Schermen (`src/screens/`) gebruiken alleen bovenstaande; een scherm bevat geen muziektheorie en geen opslagcode.
`ExerciseScreen` is de ene oefenpagina voor alle modules: de vraag- en antwoordvorm van de module bepaalt wat er staat.
Thema's zijn CSS-variabelen onder `.app[data-theme=...]` in `src/index.css`.
