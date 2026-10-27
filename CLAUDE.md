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
- `common/clef.ts` - notenbalkpositie per sleutel: `staffPosition`, `pitchAtPosition`, `ledgerLines`, `rangeForLevel`
  (bereik 0-4 hulplijnen; 3 is nodig voor de lage E-snaar van de gitaar, 4 komt in pianomuziek voor).
- `common/random.ts` - `pick`, `shuffle`, `seeded` (vaste reeks voor tests en vaste keuzes per vraag).
- `common/chord.ts` - drieklanken met spelling: `PitchClass`, `triadPcs`, `chordPcs` (per ligging), `voicing` (ligging op de
  notenbalk per sleutel), `chordName`/`chordKey`, de majeurtoonsoorten (`MAJOR_KEYS`, `keyName`, `keysInLearningOrder`: op aantal
  voortekens), `scaleOf`, de voortekens vooraan (`signatureAccidentals`, `signatureText`) en `diatonicTriads`.
- `instruments/piano.ts` - toetsindeling voor een bereik: `whiteKeys`, `blackKeys`, `PIANO_RANGES`, `rangeCovering`.
- `instruments/guitar.ts` - standaardstemming, `positionsFor(midi, maxFret)`, `preferredPosition` (hoogste snaar, laagste
  fret), `midiAt(string, fret)`, `GUITAR_WRITTEN_OFFSET`.
- `instruments/tuner.ts` - de stemmer: `frequencyOf`, `centsOff`, `nearestString` (dichtstbijzijnde open snaar met afwijking),
  `tuneAdvice` (strakker/losser/ok binnen `TUNE_TOLERANCE_CENTS`), `median`.
- `instruments/guitarChords.ts` - de greeptabel (`CHORD_SHAPES`, één standaardgreep per akkoord), `shapeFor`, `shapeMidis`.
- `learning/modules.ts` - de oefenvormen (`MODULES`): id, naam, instrument, soort (noot/akkoord/toonsoort), vraag (notenbalk, naam,
  geluid, geluid+notenbalk) en antwoordvorm, klank (`timbre`); `usesStaff`, `showsStaff`, `hears`, `playsShape`.
- `learning/items.ts` - de leeritems van een module binnen de instellingen, in didactische volgorde (`itemsFor`:
  `noteItemsFor`, `chordItemsFor` en `keyItemsFor`); een `LearnItem` is een `NoteItem`, een `ChordItem` met zijn ligging of een
  `KeyItem` (toonsoort, per sleutel waar de melodie geschreven staat).
- `learning/melody.ts` - de melodie bij een toonsoort: `melodyFor(key, clef, seed)` (6-8 noten, stapjes met een enkele sprong,
  kwint en leidtoon erin, slot op de grondtoon), `scaleFor` (toonladder voor de introductie), `referencePitch` (de C vooraf bij
  alleen horen), `tonicPitch`/`degreePitch` (ligging binnen de balk), `NOTE_MS`.
- `learning/answers.ts` - `checkAnswer` voor alle antwoordvormen (naam, toets, hals, akkoordnaam, toetsenset, notenset,
  greep, toonsoort) met uitleg bij een bijna-goed antwoord; `describeTarget` voor de feedbackkaart; `answerDistance` (halve tonen
  naast het gehoorde, bij akkoorden twee per ontbrekende noot, bij toonsoorten drie per stap op de kwintencirkel) en `answerMidis`.
- `learning/scheduler.ts` - FSRS-koppeling: `rateAnswer` (goed/fout, reactietijd, poging en afstand → beoordeling: tweede
  poging of een halve toon ernaast = Hard), `recognitionScore` (0..1, telt in rondescore en XP), `review`, `masteryOf`.
  Gehoorvragen krijgen `MAX_ATTEMPTS` (2) pogingen.
- `learning/session.ts` - sessie-opbouw (`buildSession`): eerst wat aan de beurt is, dan nieuw voor zover de werkvoorraad
  ruimte heeft (`newItemBudget`: vrije plekken, niets na een sessie onder 80%), dan herhaling; `sessionScore` (gemiddelde
  herkenningsscore van een ronde).
- `learning/goals.ts` - leerdoelen per profiel (`goalModules`, `toggleGoal`; geen keuze = alle speelbare modules).
- `learning/lesson.ts` - `suggestLesson`: de volgende les uit de leerdoelen (meeste te herhalen, anders nog nooit geoefend,
  anders het langst geleden).
- `game/rules.ts` - XP per antwoord, combo, levels, dagdoel, streak met beschermer, munten (`coinsForAnswers`: één munt per twee
  goed herkende antwoorden; dagdoel 5, level 10, badge 10). Prijzen 25-150 in `shop.ts`; de hele winkel hoort maanden te duren.
- `game/badges.ts` - de badges (`BADGES`, per instrument waar dat zo is; elk met `icon` en `mark` voor de tekening) en
  `earnedBadges` (welke nu gelden).
- `game/shop.ts` - de winkelcatalogus (`SHOP_ITEMS`: avatar-onderdelen en uiterlijk per slot, ook pluis en de strik, thema's,
  streakbeschermer), `buyRefusal`,
  `applyItem`/`itemActive` (item aan of uit op een avatar), `unlockedValues` (wat een profiel per onderdeel mag kiezen).
- `game/avatar.ts` - de avatar: soort (`kind`: poppetje of pluizenbol), huidtinten, hoofdvormen, kapsels, haarkleuren, ogen, monden,
  kleding, en voor de pluizenbol pluis, oogmaat en iris (`AvatarLook`, `DEFAULT_LOOK`, `lookOf`, `FREE_LOOK` per soort), de
  kleding- en vachtkleuren met hun contrasterende achtergrond (`contrastBg`), `outline` (lijnkleur), en de maten uit de
  avatar-werkbank (`FIGURE_GEOM`, `FUZZBALL_GEOM`): verander maten daar, niet in de componenten.

`src/state/useInstrument.ts` onthoudt het gekozen instrumenttabblad (les kiezen en voortgang delen het, op het apparaat).

Het app-icoon (`public/icons/icon-192/512/1024.png`) is het logo van de gebruiker (vioolsleutel met drie noten op geel), ook als
favicon; `icon-1024.png` is de bron voor nieuwe maten.

Opslag (`src/storage/`): `db.ts` (Dexie-schema, versie 2 met `purchases` en `badges`), `repo.ts` (alle lees/schrijf-functies,
ook `buyItem`, `awardBadges`), `backup.ts` (export/import). `src/state/finishSession.ts` boekt een sessie en kent badges toe.

Audio (`src/audio/`): `sampler.ts` (Web Audio; piano- en gitaarsamples per `Timbre`, `playNote`/`playChord` met strum,
goed/fout-tonen, ontgrendelen op iOS incl. stil media-element, compressor, diagnostiek), `pitch.ts`
(`detectPitch`: toonhoogte uit een stuk signaal, genormaliseerde autocorrelatie) en `mic.ts` (`openMic`: microfoon zonder
ruisonderdrukking in een eigen AudioContext dat pas na `getUserMedia` wordt gemaakt (iOS), geeft om de 80 ms 4096 samples; `micFailure` vertaalt een fout naar geweigerd/geen/bezet).

Componenten (`src/components/`):

- `music/Staff.tsx` - notenbalk (SVG) met sleutel, noten, voortekens, hulplijnen; `layout="melody"` zet noten naast elkaar,
  `signature` tekent de voortekens vooraan (noten in de toonsoort krijgen dan geen los voorteken); ook als invoer (tik op positie).
- `music/StringKeys.tsx` - zes snaarknoppen (naam en nummer; actief, in stemming, tik = toon); `music/TuneMeter.tsx` - de
  stemmeter van -50 tot +50 cent met groene zone.
- `music/KeyButtons.tsx` - toonsoortknoppen in kwintenvolgorde (zelfde raster als de letterknoppen); `music/KeyIntro.tsx` - de
  introductie van een nieuwe toonsoort (uitleg, toonladder op de balk, afspelen); `music/useMelodyPlayer.ts` - speelt een melodie
  noot voor noot en zegt welke noot klinkt (oplichten op de balk), met een eventuele C vooraf.
- `music/Piano.tsx` - schermpiano (SVG, scrollbaar) met oplichtende toetsen.
- `music/Fretboard.tsx` - gitaarhals (SVG) met frets 0-4, stippen en open snaren.
- `music/NoteNameButtons.tsx` - letterknoppen met ♯/♭-schakelaar.
- `music/ChordNameButtons.tsx` - akkoordnaam: ♯/♭, majeur/mineur, ligging, dan de letter.
- `music/AccidentalToggle.tsx` - ♭ ♮ ♯ voor noten op de notenbalk zetten.
- `music/ChordDiagram.tsx` - klein greepdiagram (songboek-stijl), ook als keuzeknop.
- `common/Icon.tsx` - de icoonset (41 outline-iconen, `icons.tsx` is gegenereerd uit het design system): `<Icon name="…" />`,
  1em groot in de tekstkleur. Geen emoji in de interface.
- `common/Avatar.tsx` - de avatar: kiest op `look.kind` tussen het poppetje (gezicht, nek, schouders op een schijf, in dit
  bestand) en `common/Fuzzball.tsx` (de pluizenbol: bol met pluis, armen, benen, grote ogen met iris); beide aangekleed met
  dezelfde winkelitems, alle vlakken met lijn en één schaduw.
- `common/ProfileRow.tsx` - een profiel als rij (avatar, naam, level, streak); `common/ProfileSheet.tsx` - de sheet achter de
  avatar op start- en profielscherm: wie oefent, de andere profielen om met één tik naar te wisselen, nieuw profiel.
- `common/Badge.tsx` - een badge: gouden schijf met groot icoon en klein merkteken (icoon, getal of ♯), naam eronder.
- `common/` - `Button`, `Card`, `Segmented`, `Tabs`, `Chip`, `ProgressBar`, `TabBar`, `GoalRing`, `ProgressDots`, `AudioDebug`
  (`?debug=1`).
- `layout/Screen.tsx` - de schermopbouw (kop, inhoud, tabbalk).

Schermen (`src/screens/`) gebruiken alleen bovenstaande; een scherm bevat geen muziektheorie en geen opslagcode.
`ExerciseScreen` is de ene oefenpagina voor alle modules: de vraag- en antwoordvorm van de module bepaalt wat er staat;
bij een toonsoortvraag krijgt elke vraag een nieuwe melodie (seed uit starttijd en vraagnummer) en staat na het antwoord de melodie
met de voortekens vooraan;
bij een gehoorvraag krijgt de speler na een misser een tweede poging met alleen een maat van de misser (net niet /
dit klopte niet / flink ernaast), nooit de richting. `GoalsScreen` is
"Wat wil je leren"; `HomeScreen` toont alleen het dagdoel, de volgende les met Start les en één rij "Zelf een les kiezen" naar `LessonsScreen`
(alle modules per instrument, met tandwiel en grepenknop).
Nieuwe leerstof wordt eerst getoond voordat ernaar gevraagd wordt (`ShapesScreen`: grepenoverzicht en `ShapeGallery` als
introductie van nog nooit gevraagde grepen aan het begin van een ronde); doe dat ook bij nieuwe modules.
De look heeft twee modi op `.app`: `data-mode="rustig"` (standaard) en `"speels"` (kindmodus, uit `kidMode`); thema's uit de winkel
(`data-theme`) leggen alleen kleuren daaroverheen. Fonts Inter en Nunito komen uit `@fontsource` (in `main.tsx`).
`TunerScreen` (route `tuner`, kaart bovenaan het tabblad Gitaar van `LessonsScreen`) is de gitaarstemmer: geen les, geen XP;
luistert via `mic.ts`, middelt de laatste metingen, kleurt de snaar groen na een halve seconde binnen 5 cent.
`ProfileForm` is het samenstellen van de avatar (vrije keuzes plus wat in de winkel is gekocht); het is de bron voor nieuw
profiel en profiel bewerken.

## Design system en canvas

Het ontwerp staat als claude.ai-artifacts: design system "Toonvast" (tokens, brand book, componentkaarten, iconen) en
canvas "Toonvast schermen". Tokens in `src/index.css` horen gelijk te blijven aan `tokens.json` van het design system (compileer met `build_tokens.py`
uit de scratchpad van de ontwerpsessie en plak de variabele-blokken bovenaan);
de iconen (`icons.tsx`) en de avatar komen uit de kaarten Icon en Avatar. Verander je iets aan het uiterlijk, werk dan
beide kanten bij.
