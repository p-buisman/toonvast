# Toonvast

Educatieve muziek-app (PWA) voor piano en gitaar: noten lezen, toetsen en grepen vinden, akkoorden,
gehoortraining en toonsoorten, met voortgang per persoon en een spelelement.

- Draait als webapp op https://p-buisman.github.io/toonvast/ en is daar op de iPhone aan het beginscherm toe te voegen.
- Alle gegevens staan op het apparaat zelf (IndexedDB); een back-up is als bestand te exporteren en te importeren.
- Verkenning en keuzes: `docs/verkenning.md`. Schetsen: `docs/schetsen/`.

## Ontwikkelen

```bash
npm install
npm run dev      # dev-server
npm test         # Vitest
npm run lint     # oxlint
npm run opmaak   # Prettier
npm run build    # productie-bundel in dist/
```

De piano-samples zijn van de Salamander Grand Piano (CC BY 3.0, zie `public/samples/piano/LICENSE.txt`);
de sleutels en voortekens zijn paden uit het Bravura-font (SIL OFL, zie `public/fonts/OFL-Bravura.txt`).
