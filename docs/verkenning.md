# Verkenning muziek-app Toonvast

Datum: 24 oktober 2026, bijgewerkt tijdens het bouwen. Status: fase 0 t/m 5 gebouwd (noten lezen, akkoorden, badges, winkel, gehoortraining, toonsoorten, gitaarstemmer); zie §11.

Een educatieve web-app (PWA) voor een gezin dat piano en gitaar leert. De speler leert noten op de notenbalk, pianotoetsen, gitaargrepen, akkoorden, toonsoorten en gehoor. Per persoon en per instrument wordt de voortgang bijgehouden, met een spelelement om te blijven oefenen.

---

## 1. Keuzes uit het gesprek

| Onderwerp          | Keuze                                                                                                                  |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Doelgroep          | Gemengd gezin: volwassenen en kinderen; per profiel instelbaar hoe speels de app is                                    |
| Platform           | PWA; eerste versie op de computer, daarna installeerbaar op de iPhone                                                  |
| Antwoorden         | Alleen tikken op het scherm (schermpiano, gitaarhals, notenbalk, naamknoppen)                                          |
| Geluid             | Gesamplede piano en gitaar, zodat de luisteroefeningen echt klinken                                                    |
| Opslag             | Lokaal in de browser (IndexedDB) met export/import van een bestand                                                     |
| Nootnamen          | Internationaal: C, D, E, F, G, A, B met ♯ en ♭                                                                         |
| Akkoorden          | Majeur- en mineurdrieklanken, ook in eerste en tweede omkering; op de piano zowel vanaf de naam als vanaf de notenbalk |
| Gitaargrepen       | Eén standaardgreep per akkoord: open akkoorden in de eerste positie, barré alleen waar geen open greep bestaat         |
| Gitaar losse noten | Alleen eerste positie, fret 0 t/m 4                                                                                    |
| Toonsoort melodie  | Majeur eerst, mineur als latere uitbreiding; drie varianten: horen+zien, alleen horen, alleen zien                     |
| Enharmonie         | Contextafhankelijk (zie §5)                                                                                            |
| Oefenrondes        | Korte sessies van ca. 10 vragen; reactietijd telt mee, geen harde timer                                                |
| Vraagkeuze         | Adaptief (spaced repetition) binnen de instellingen van de speler                                                      |
| Pianobereik        | Instelbaar per oefening                                                                                                |
| Spel               | XP en levels, streak met dagdoel, badges, munten te besteden aan avatar, thema's en streakbeschermer                   |
| Techniek           | Vite + React + TypeScript, nieuwe GitHub-repo, hosting op GitHub Pages                                                 |
| Versie 1           | Noten lezen (notenbalk → naam, pianotoets, gitaarpositie) met profielen en spelmechanisme                              |
| Profielen          | Zonder pincode; na het kiezen eerst de avatar groot met naam ter bevestiging                                           |
| Naam               | Toonvast                                                                                                               |

---

## 2. Oefenvormen

Elke oefenvorm is een _module_. Een module stelt een vraag in één vorm (zien of horen) en vraagt een antwoord in één invoervorm. Dezelfde bouwstenen (notenbalk, schermpiano, gitaarhals, naamknoppen, afspeelknop) worden steeds hergebruikt.

| Nr  | Module                 | Vraag                                         | Antwoord                                            | Instrument-voortgang     | Fase |
| --- | ---------------------- | --------------------------------------------- | --------------------------------------------------- | ------------------------ | ---- |
| M1  | Noot benoemen          | Noot op notenbalk                             | Naamknop (A–G + ♯/♭)                                | Theorie                  | 1    |
| M2  | Noot op piano          | Noot op notenbalk                             | Tik toets op schermpiano                            | Piano                    | 1    |
| M3  | Noot op gitaar         | Noot op notenbalk                             | Tik positie op gitaarhals (fret 0–4)                | Gitaar                   | 1    |
| M4a | Akkoord lezen          | Drieklank op notenbalk                        | Akkoordnaam (bijv. Dm)                              | Theorie                  | 2    |
| M4b | Akkoord op piano       | Akkoordnaam (met omkering)                    | Tik 3 toetsen                                       | Piano                    | 2    |
| M4c | Akkoord noteren        | Akkoordnaam                                   | Tik 3 noten op lege notenbalk                       | Theorie                  | 2    |
| M4d | Akkoord lezen op piano | Drieklank op notenbalk                        | Tik 3 toetsen                                       | Piano                    | 2    |
| M5  | Akkoord op gitaar      | Akkoordnaam                                   | Kies/plaats de greep op de hals                     | Gitaar                   | 2    |
| M6  | Toon horen             | Afgespeelde toon                              | Notenbalk, pianotoets of gitaarpositie (instelbaar) | Theorie / Piano / Gitaar | 3    |
| M8  | Piano-akkoord horen    | Afgespeeld piano-akkoord                      | Noten op notenbalk of toetsen op piano              | Theorie / Piano          | 3    |
| M9  | Gitaarakkoord horen    | Afgespeeld gitaarakkoord                      | Noten op notenbalk of greep op de hals              | Theorie / Gitaar         | 3    |
| M7  | Toonsoort herkennen    | Melodie: zien, horen+zien of horen (na een C) | Toonsoortknop (C, G, D, … F, B♭ …)                  | Theorie                  | 4    |

Toelichting per module:

- **M1–M3 Noten lezen.** Eén noot op een notenbalk in viool- of bassleutel. Hulplijnen tot twee boven en onder. Met of zonder voorteken, afhankelijk van de instelling. Bij M3 telt alleen een positie in fret 0–4. Gitaarmuziek staat een octaaf hoger genoteerd dan hij klinkt (de geschreven E4 op de onderste lijn is de D-snaar, fret 2; de open hoge e-snaar staat als E5 in de bovenste tussenruimte); de app volgt die conventie, zoals de gitaarmethodes. Daarom toont M3 bij de feedback de nootnaam en de hals, maar geen pianotoets: die zou een octaaf lager liggen en verwarren.
- **M4 Akkoorden.** Grondligging, eerste en tweede omkering. De naamknoppen bieden grondtoon + majeur/mineur; de omkering wordt bij M4a apart gevraagd als de instelling "omkeringen" aan staat. Bij M4b en M4d telt elke correcte verzameling toetsen in de gevraagde ligging; bij M4d is de ligging die van de genoteerde drieklank, en de toetsen moeten in hetzelfde octaaf liggen als de notatie.
- **M5 Gitaargrepen.** Een vaste greeptabel met één standaardgreep per akkoord, zoals in gangbare beginnersmethodes: open grepen C, D, E, G, A, Am, Dm, Em (C met de G-snaar open, G met drie vingers), en F, B, Bm, F♯m, C♯m, G♯m als barré-vorm. Varianten van dezelfde greep komen pas later en tellen dan ook als goed. Twee antwoordvormen: kiezen uit vier greepdiagrammen (makkelijk) of zelf vingers op de hals plaatsen (moeilijk, per profiel instelbaar).
- **M6, M8, M9 Gehoor.** Een afspeelknop; herhalen is onbeperkt maar kost een klein deel van de snelheidsbonus. Bij M8/M9 klinkt het echte instrument (piano-sample of gitaar-sample met strum).
- **M7 Toonsoort.** De app genereert een korte diatonische melodie (6–8 noten) die eindigt op de grondtoon en de leidtoon en kwint bevat; de melodie begint op de grondtoon, terts of kwint en gaat vooral in stapjes. Drie lessen, elk met eigen voortgang per toonsoort: _Toonsoort lezen_ (voortekens vooraan, geen geluid), _Toonsoort horen en lezen_ (de melodie klinkt en staat er met losse voortekens; de klinkende noot licht op) en _Toonsoort horen_ (alleen geluid; eerst klinkt een C als houvast, anders zou het absoluut gehoor vragen). Na het antwoord staat de melodie met de voortekens vooraan. Een nieuwe toonsoort wordt eerst uitgelegd, met de toonladder om af te spelen. Leervolgorde op aantal voortekens: C, G, F, D, B♭ … Mineur komt later als uitbreiding.

---

## 3. Instellingen per oefening

Instellingen horen bij een profiel en bij een module. Standaardwaarden zijn bewust klein, zodat een beginner niet verdwaalt.

| Instelling                                 | Opties                                                                                | Standaard        |
| ------------------------------------------ | ------------------------------------------------------------------------------------- | ---------------- |
| Sleutels                                   | Vioolsleutel, bassleutel, beide                                                       | Vioolsleutel     |
| Bereik notenbalk                           | Binnen de lijnen; met 1 t/m 4 hulplijnen (3 voor de lage E-snaar, 4 voor pianomuziek) | Binnen de lijnen |
| Voortekens                                 | Geen; alleen ♯; alleen ♭; beide                                                       | Geen             |
| Toonsoorten (akkoord- en toonsoortmodules) | Vinkjes per toonsoort, gegroepeerd op aantal voortekens                               | C, G, F          |
| Akkoorden                                  | Alleen noten; majeur; mineur; omkeringen aan/uit                                      | Alleen noten     |
| Pianobereik                                | 2 octaven (C3–C5); 4 octaven (C2–C6); volledig (A0–C8, scrollbaar)                    | 2 octaven        |
| Gitaarhals                                 | Fret 0–4 (later: 0–12)                                                                | 0–4              |
| Greepinvoer (M5)                           | Kiezen uit diagrammen; vingers zelf plaatsen                                          | Kiezen           |
| Sessielengte                               | 5, 10, 20 vragen                                                                      | 10               |
| Noten tegelijk leren (werkvoorraad)        | 2, 4, 6                                                                               | 4                |

De adaptieve vraagkeuze (§6) werkt _binnen_ deze instellingen: wat uitgeschakeld is komt niet voor, en nieuwe items komen er geleidelijk bij.

---

## 4. Antwoordinvoer (bouwstenen)

- **Notenbalk (SVG).** Vijf lijnen, sleutel, één noot of drieklank, voortekens, hulplijnen. Als _invoer_: tikken op een lijn of tussenruimte plaatst een noot; een ♯/♭/♮-knop past het voorteken aan. Eigen SVG-component: het domein is klein (geen maatstrepen, geen ritme, hooguit een korte melodie) dus een notatiebibliotheek is niet nodig. Voor M7 (melodie van 6–8 noten) blijft dezelfde component bruikbaar; VexFlow is een terugvaloptie als dat tegenvalt.
- **Schermpiano (SVG).** Witte en zwarte toetsen, bereik volgens instelling, horizontaal scrollbaar met een mini-overzicht boven de toetsen. Octaafletters (C3, C4) klein op de C-toetsen; uit te zetten in de instellingen voor wie het zonder hulp wil. Een gespeelde toets licht op en klinkt.
- **Gitaarhals (SVG).** Zes snaren, frets 0–4 (nulfret als open snaar), fretnummers, stippen. Op de telefoon staand getoond (hals verticaal), op de computer liggend. Tikken plaatst een stip; voor grepen tot vier stippen plus gedempte snaren (×) per snaar.
- **Naamknoppen.** Zeven letterknoppen plus een ♯- en ♭-schakelaar. Voor akkoorden: letter + majeur/mineur. Voor toonsoorten: knoppen gerangschikt op de kwintencirkel.
- **Afspeelknop.** Speelt de vraag (nog eens) af. Audio wordt pas gestart na een tik van de gebruiker (vereiste van iOS).

Feedback is direct: goed geeft groen plus een korte toon, fout geeft rood en toont het juiste antwoord in alle drie de vormen (naam, toets, hals). Pas daarna gaat de ronde verder, zodat elke fout een leermoment is.

---

## 5. Enharmonie en nootnamen

Alle noten worden intern opgeslagen als _toonhoogte_ (MIDI-nummer) plus _spelling_ (letter + voorteken). Daarmee gelden deze regels:

- **Notenbalk als vraag** (M1): de geschreven spelling telt. Staat er B♭, dan is A♯ fout. De app legt bij een fout uit dat het dezelfde toets is maar een andere naam.
- **Toon of pianotoets als vraag** (M6, M8): beide spellingen zijn goed, tenzij een toonsoort is ingesteld; dan wordt de spelling van die toonsoort als voorkeur getoond, maar de andere niet fout gerekend.
- **Piano of gitaar als antwoord** (M2, M3, M4b, M5): alleen toonhoogte telt; spelling speelt geen rol.
- **Toonsoorten**: alleen de gebruikelijke spelling (B♭-groot, niet A♯-groot). F♯/G♭ beide aangeboden.

---

## 6. Adaptief leren (spaced repetition)

Per profiel, per module en per _item_ (bijvoorbeeld "E4 in vioolsleutel → pianotoets" of "Dm eerste omkering → piano") wordt een leerkaart bijgehouden met het FSRS-algoritme (bibliotheek `ts-fsrs`, zoals ook bedoeld voor de bijbel-app).

- **Beoordeling** komt uit het antwoord en de reactietijd: fout → _Again_; goed maar langzaam (boven de persoonlijke mediaan × 1,5) → _Hard_; goed → _Good_; goed en snel (onder de mediaan × 0,7) → _Easy_.
- **Sessie-opbouw** (10 vragen): eerst items die "due" zijn, dan nieuwe items voor zover de werkvoorraad ruimte heeft, aangevuld met herhaling van bekende items binnen de instellingen. Nooit twee keer dezelfde vraag achter elkaar.
- **Werkvoorraad**: er mogen hoogstens een instelbaar aantal items (2, 4 of 6; standaard 4) tegelijk "in de leerfase" zitten: gezien, maar nog niet stabiel genoeg om twee dagen of langer weg te blijven. Een nieuw item komt er pas bij als een item uit de werkvoorraad stabiel is geworden, en alleen na een sessie met minstens 80% goed. Zo blijft het tempo vanzelf laag zolang de huidige noten nog wankel zijn.
- **Uitbreiden**: nieuwe items worden toegevoegd in een vaste didactische volgorde, alleen voor zover de instellingen het toelaten. Piano en theorie: vioolsleutel binnen de lijnen van binnen naar buiten, dan hulplijnen, dan bassleutel, dan voortekens. Gitaar: snaar voor snaar van de hoge e naar de lage E, zoals de gitaarmethodes, per snaar eerst de stamtonen en dan omhoog langs de frets. De speler kan altijd zelf méér aanzetten.
- **Reactietijd** per item wordt bewaard als lopend gemiddelde en gebruikt voor badges en de voortgangsgrafiek ("gemiddeld 1,8 s per noot").

Het leerplan is dus niet handgemaakt per level, maar de didactische volgorde is wel vastgelegd in één tabel per module, zodat het gedrag voorspelbaar en testbaar is.

---

## 7. Spelmechanisme

Twee gescheiden valuta's: **XP** meet voortgang en gaat nooit omlaag; **munten** zijn om uit te geven.

| Element          | Werking                                                                                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| XP per vraag     | 10 basis; +5 snelheidsbonus (sneller dan persoonlijke mediaan); +combo: vanaf 3 goed op rij +2 per vraag, max +10. Fout: 0, combo reset.                                        |
| Level            | Vaste XP-drempels, oplopend (100, 250, 450, 700, …). Level is per profiel, over alle instrumenten heen. Een levelstap geeft een korte animatie en 10 munten.                    |
| Dagdoel          | Instelbaar per profiel: 30, 60 of 120 XP per dag. Halen = 5 munten en een dag streak.                                                                                           |
| Streak           | Opeenvolgende dagen waarop het dagdoel is gehaald. Zichtbaar op het startscherm.                                                                                                |
| Streakbeschermer | In de winkel (30 munten); vangt één gemiste dag op. Maximaal twee in voorraad.                                                                                                  |
| Munten           | 1 per twee goed herkende antwoorden (een tweede poging telt naar rato), 5 bij dagdoel, 10 bij level, 10 bij badge. Een item kost 25–150; de hele winkel vraagt maanden oefenen. |
| Badges           | Zie lijst hieronder; elke badge geeft 10 munten.                                                                                                                                |
| Winkel           | Avatar-onderdelen (hoofd, haar, bril, hoedje, instrument, achtergrond), app-thema's (kleurensets), streakbeschermer.                                                            |
| Kindmodus        | Per profiel: grotere knoppen, meer confetti en geluid, minder tekst. Volwassenen krijgen dezelfde mechanismen in een rustige vormgeving.                                        |

Badges (eerste set): _Eerste tien_ (10 goed), _Vioolsleutel klaar_ (alle noten binnen de lijnen geleerd), _Bassleutel klaar_, _Hulplijnen_, _Snelle lezer_ (gemiddeld onder 2 s), _Zwart en wit_ (alle kruizen en mollen), _Vijf dagen_, _Dertig dagen_, _Open grepen_ (alle open akkoorden), _Alle toonsoorten_. Badges zijn per instrument waar dat van toepassing is.

Geen ranglijst tussen de profielen; wel een gezamenlijk startscherm met de streak van iedereen, zodat je elkaar ziet oefenen.

---

## 8. Profielen en voortgang

- Profiel: naam, avatar, kindmodus aan/uit, dagdoel, thema. Geen wachtwoord of pincode. Na het kiezen van een profiel verschijnt eerst de avatar groot in beeld met de naam ("Hoi Mila!") en een knop _Dat ben ik niet_, zodat een verkeerde keuze meteen opvalt en hersteld kan worden.
- Voortgang wordt per profiel én per instrument getoond: **Theorie** (lezen, benoemen, toonsoort), **Piano**, **Gitaar**. Elke module telt voor één of twee van die drie (zie tabel in §2).
- Voortgangsscherm per instrument: percentage geleerde items, gemiddelde reactietijd, een "notenkaart" (heatmap van alle noten per sleutel: grijs onbekend, oranje bezig, groen beheerst), behaalde badges.
- Export: knop _Back-up maken_ schrijft één JSON-bestand met alle profielen (op de iPhone via het deelmenu, op de computer als download). Import leest zo'n bestand en voegt profielen samen op basis van een profiel-id; bij conflict wint de recentste leerkaart.

---

## 9. Datamodel

Opslag in IndexedDB via `Dexie`. Alle records dragen een `profileId`.

| Tabel       | Velden (kern)                                                                                               |
| ----------- | ----------------------------------------------------------------------------------------------------------- |
| `profiles`  | id, naam, avatar (onderdelen), kindmodus, dagdoel, thema, aangemaakt                                        |
| `settings`  | profileId, moduleId, instellingen-object (§3)                                                               |
| `cards`     | profileId, moduleId, itemKey, FSRS-staat (stability, difficulty, due, reps, lapses), gemiddelde reactietijd |
| `sessions`  | id, profileId, moduleId, start, einde, vragen (item, goed, ms), XP, munten                                  |
| `wallet`    | profileId, xp, munten, level, streak, laatsteDagdoelDatum, streakbeschermers                                |
| `inventory` | profileId, gekochte item-ids, actieve avatar/thema                                                          |
| `badges`    | profileId, badgeId, behaaldOp                                                                               |

Het export-bestand is dezelfde structuur als JSON met een versienummer, zodat latere versies oude back-ups kunnen lezen.

---

## 10. Techniek

**Keuze: Vite + React + TypeScript**, als statische PWA, zonder server. Dit sluit aan bij puzzle-app (zelfde gereedschap, zelfde testaanpak met Vitest) en is het lichtst voor een app die volledig op het apparaat draait. Next.js (wvs-bg) biedt hier geen voordeel omdat er geen server-kant is.

| Onderdeel            | Keuze                                                                                               | Reden                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Bundel/PWA           | Vite + `vite-plugin-pwa`                                                                            | Service worker, manifest, offline; installeerbaar op iPhone                                  |
| UI                   | React 19, CSS-modules of Tailwind (bij voorkeur wat puzzle-app gebruikt)                            | Herkenbaar, snel                                                                             |
| Notenbalk/piano/hals | Eigen SVG-componenten                                                                               | Klein domein, volledig in eigen hand, schaalt naar elk scherm                                |
| Muziektheorie        | Eigen module `engine/theory`                                                                        | Toonhoogte+spelling, sleutels, toonsoorten, drieklanken, greeptabel; zwaar getest met Vitest |
| Spaced repetition    | `ts-fsrs`                                                                                           | Bewezen algoritme, puur TypeScript                                                           |
| Audio                | Web Audio API met eigen kleine sampler                                                              | Geen zware afhankelijkheid; Tone.js alleen als de eigen sampler te veel werk blijkt          |
| Piano-samples        | Salamander Grand Piano (CC-BY), 1 sample per 3 halve tonen, ogg/m4a, ca. 3–5 MB                     | Gratis, veel gebruikt, klinkt goed                                                           |
| Gitaar-samples       | FluidR3 GM soundfont (MIT) akoestische gitaar via de `midi-js-soundfonts`-set, of een losse CC0-set | Gratis; akkoorden klinken met kleine vertraging per snaar (strum)                            |
| Opslag               | `Dexie` (IndexedDB)                                                                                 | Robuust, eenvoudig te exporteren                                                             |
| Tests                | Vitest voor theorie-engine, FSRS-koppeling, sessie-opbouw, XP-regels                                | Dit is waar fouten pijn doen                                                                 |
| Hosting              | GitHub Pages via GitHub Actions, `base` in Vite op de reponaam                                      | Gratis HTTPS, nodig voor PWA                                                                 |

Versienummers van bibliotheken worden bij het opzetten gecontroleerd; deze verkenning noemt ze bewust niet.

**Aandachtspunten iPhone / PWA**

- Audio mag pas starten na een tik; de eerste tik op het startscherm ontgrendelt de audiocontext en laadt de samples.
- Safari verwijdert opslag van websites die zeven dagen niet gebruikt zijn, maar _niet_ van een op het beginscherm geïnstalleerde PWA. De app vraagt daarom om installatie en biedt de back-up als vangnet.
- Geen Web MIDI op iOS; niet nodig door de keuze voor tikken.
- Schermpiano werkt het best liggend; de app toont een hint maar dwingt niets af. Veilige randen (notch) worden gerespecteerd.
- Doelmaat voor tikken: minimaal 44 pt; de zwarte toetsen en fretposities worden daarop ontworpen, desnoods met minder toetsen in beeld.

---

## 11. Fasering

| Fase | Inhoud                                                                                                                                                 | Resultaat                                                  |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| 0    | Repo, Vite/PWA-opzet, theorie-engine met tests, SVG-notenbalk, schermpiano, gitaarhals, sampler met piano-geluid, GitHub Pages                         | Lege app die noten toont en toetsen laat klinken           |
| 1    | Profielen, M1–M3, instellingen, FSRS-sessies, XP/level/dagdoel/streak, voortgangsscherm, export/import                                                 | **Versie 1: noten lezen**, bruikbaar op computer en iPhone |
| 2    | M4a–c en M5 (akkoorden, grepen), badges, munten en winkel met avatar en thema's, streakbeschermer                                                      | Versie 2: akkoorden en winkel                              |
| 3    | M6, M8, M9 (gehoor), gitaar-samples en strum (gebouwd; M6 als drie modules: notenbalk, piano, gitaar; M8 en M9 elk als twee)                           | Versie 3: gehoortraining                                   |
| 4    | M7 toonsoort (drie lessen; gebouwd), daarna mineur; eventueel fret 5–12 en barré-vormen                                                                | Versie 4: toonsoorten                                      |
| 5    | Gitaarstemmer (gebouwd): toonhoogte uit de microfoon, herkent vanzelf welke snaar klinkt, toont hoe ver ernaast en of de snaar strakker of losser moet | Versie 5: stemmen                                          |

---

## 12. Open punten en risico's

- **Gitaarstemmer (fase 5)**: gebouwd als `audio/pitch.ts` (genormaliseerde autocorrelatie, eerste duidelijke piek, parabolische verfijning) op `audio/mic.ts` (microfoon zonder ruisonderdrukking, 4096 samples per 80 ms) en `engine/instruments/tuner.ts` (dichtstbijzijnde open snaar, cents, advies strakker/losser; nooit links/rechts, want dat hangt van de kant van de stemknop af). Binnen 5 cent een halve seconde = in stemming. Microfoontoegang vraagt een gebruikersgebaar en werkt in de PWA op iOS alleen in de voorgrond; hoe goed de detectie in de praktijk op de telefoon werkt (galm, lage E), moet in gebruik blijken.
- **Melodiegenerator (M7)**: gebouwd als `engine/learning/melody.ts` (stapjes met af en toe een sprong, kwint en leidtoon verplicht, slot op de grondtoon). Of de melodieën op den duur te eentonig worden, blijkt in het gebruik; ritme is een mogelijke uitbreiding.
- **Samplegrootte**: 3–5 MB piano plus gitaar is op wifi prima, maar de eerste start moet een laadindicatie krijgen; daarna cachet de service worker alles.
- **Kindmodus vs. volwassen modus**: één codebase met variabelen voor grootte en speelsheid; geen twee aparte interfaces.
- **Icoon**: nog te ontwerpen voor het beginscherm van de iPhone.

---

## 13. Schetsen

Statische schermschetsen (zonder scripts) staan in `docs/schetsen/`:

1. `01-profielen.html` – profielkeuze
   1b. `01b-welkom.html` – bevestiging na het kiezen: avatar groot met naam
2. `02-start.html` – startscherm met streak, dagdoel en oefeningen per instrument
3. `03-oefening-piano.html` – noot op notenbalk → pianotoets (M2)
4. `04-oefening-gitaar.html` – noot op notenbalk → gitaarpositie (M3), met foutfeedback
5. `05-instellingen.html` – instellingen van een oefening
6. `06-winkel.html` – munten, avatar en thema's
7. `07-voortgang.html` – voortgang per instrument met notenkaart

`index.html` in dezelfde map toont ze naast elkaar.
