# Proof of Worth

Low Time Preference trifft Buy It For Life. Ein offenes, quellenbasiertes Verzeichnis
wertbeständiger Produkte – gebaut mit [Astro](https://astro.build) und community-gepflegt
über GitHub. Zweisprachig: Deutsch (Standard) und Englisch (`/en/…`).

Dies ist die überarbeitete, professionellere Neufassung von
[proof-of-worth.netlify.app](https://proof-of-worth.netlify.app/).

## Idee

Die Website verknüpft das Konzept der niedrigen Zeitpräferenz aus der Bitcoin-Ökonomie mit
der praktischen Konsumphilosophie „Buy It For Life" (BIFL). Jedes Produkt wird anhand von
vier transparenten Kriterien bewertet – siehe [`/score-methodik`](src/pages/score-methodik.astro):

1. Reparierbarkeit & Ersatzteile
2. Material & Konstruktion
3. Herstellergarantie
4. Wiederverkaufswert

Details und Hintergrund: [`/ueber-uns`](src/pages/ueber-uns.astro).

## Tech-Stack

- **[Astro](https://astro.build)** (Content Layer API) mit Content Collections – jedes
  Produkt ist eine einzelne Markdown-Datei unter `src/content/products/de/` bzw.
  `src/content/products/en/`, validiert über ein Zod-Schema (`src/content.config.ts`).
- **Native Astro-i18n-Routing**: Deutsch ohne Prefix, Englisch unter `/en/…`
  (`astro.config.mjs` → `i18n`). Wiederkehrende UI-Textbausteine liegen zentral in
  `src/i18n/ui.ts`, lange Fließtexte als eigenständige Seiten unter `src/pages/en/`.
- Eigene, handgezeichnete SVG-Icons und Produkt-Illustrationen
  (`src/components/Icon.astro`, `src/components/ProductIllustration.astro`) – bewusst
  keine Produktfotos oder Fremdmaterial, aus Urheberrechtsgründen.
- Kein UI-Framework nötig – Interaktivität (Filter, TCO-Rechner, Zap-Button) läuft über
  kleine Vanilla-JS-Snippets direkt in den `.astro`-Dateien.
- Statischer Output, deploybar auf Netlify, Vercel, GitHub Pages o. ä.

## Lokal starten

```bash
npm install
npm run dev
```

Die Seite läuft dann unter `http://localhost:4321`.

```bash
npm run build    # Typcheck + Produktions-Build nach dist/
npm run preview  # Produktions-Build lokal ansehen
```

## Projektstruktur

```
src/
  content.config.ts        # Zod-Schema für Produkte (Content Layer API)
  content/products/
    de/*.md                 # Deutsche Produktseiten (Standard)
    en/*.md                 # Englische Übersetzungen (gleicher Dateiname)
    _TEMPLATE.md             # Vorlage für neue Beiträge (nicht Teil der Collection)
  i18n/
    ui.ts                    # Zentrales Übersetzungs-Wörterbuch (Navigation, Badges, …)
    utils.ts                 # getLangFromUrl, useTranslations, slugOfEntryId, …
  components/                # Header, Footer, ProductCard, Icon, ProductIllustration,
                              # ZapButton, NostrComments – alles eigene SVGs/Komponenten
  layouts/BaseLayout.astro
  lib/score.ts                # Score-Berechnung & lokalisierte Labels
  lib/nostr-client.ts         # Client-seitige Nostr-Anbindung (Kommentare + Zaps)
  data/contributors.ts        # Autor:in -> Lightning-Adresse (für Zaps)
  pages/
    index.astro                # Deutsch (Standard, kein Prefix)
    produkte/index.astro        # Liste + Filter
    produkte/[slug].astro       # Detailseite je Produkt, inkl. Illustration, Zap-Button
                                 # und Nostr-Kommentare
    score-methodik.astro
    rechner.astro                # Cost-per-Use/TCO-Rechner
    ueber-uns.astro
    mitmachen.astro
    unterstuetzen.astro          # Lightning-Tipping + Nostr-Kommentare/Zaps: beides live
    impressum.astro               # Platzhalter, vor Go-Live ausfüllen!
    en/                            # Englische Entsprechung jeder obigen Seite (/en/…)
```

## Zweisprachigkeit (DE/EN)

Deutsch ist Standardsprache ohne URL-Prefix, Englisch liegt unter `/en/…`
(`astro.config.mjs` → `i18n.routing.prefixDefaultLocale: false`). Die Kopfzeile enthält
einen Sprachumschalter, der auf die jeweils andere Sprachversion derselben Seite
verlinkt. Details zur Konvention für neue, zweisprachige Beiträge stehen in
[`CONTRIBUTING.md`](CONTRIBUTING.md#zweisprachigkeit-deen).

## Lightning-Tipping (Value4Value)

Jede Produktseite hat einen Zap-Button (`src/components/ZapButton.astro`): LNURL-Pay
(LUD-16) + WebLN, komplett clientseitig, ohne eigenes Backend – live nutzbar. Zahlungen
gehen direkt von der Wallet der zappenden Person an die in `src/data/contributors.ts`
hinterlegte Lightning-Adresse der Autor:in – das Projekt selbst verwaltet nie Schlüssel
oder Guthaben.

## Nostr-Kommentare & Zaps (NIP-22 / NIP-57)

Jede Produktseite hat einen Kommentarbereich (`src/components/NostrComments.astro`,
Logik in `src/lib/nostr-client.ts`), der komplett über das dezentrale Nostr-Protokoll
läuft – ohne eigenes Backend:

- **Lesen**: Kommentare werden per `nostr-tools`/`SimplePool` von einem festen
  Relay-Set (relay.damus.io, nos.lol, relay.nostr.band, relay.primal.net) geladen
  (NIP-22, kind 1111, referenziert die Produkt-URL über `I`/`K`-Tags nach NIP-73).
- **Schreiben**: Signierung über eine NIP-07-Browser-Extension (z. B. Alby, nos2x) –
  ohne Extension ist der Bereich nur lesbar.
- **Zaps auf Kommentare**: volle NIP-57-Zap-Requests (kind 9734, signiert) +
  öffentlich auf Relays sichtbare Zap-Quittungen (kind 9735), ausgezahlt an die im
  Nostr-Profil (`lud16`) der kommentierenden Person hinterlegte Lightning-Adresse.
- Bekannte, bewusste Einschränkung: der `lnurl`-Tag im Zap-Request enthält die reine
  Lightning-Adresse statt einer bech32-kodierten LNURL (spart eine zusätzliche
  Abhängigkeit), und es gibt keine Moderation – siehe `/unterstuetzen` für Details.

Abhängigkeit: `nostr-tools` (in `package.json` ergänzt). **Nach dem Pull unbedingt
`npm install` ausführen**, sonst schlägt der Build fehl.

Dieses Feature wurde ohne lauffähige lokale `astro check`/`astro build`-Verifikation im
Sandbox-Environment entwickelt (Plattform-Mismatch, siehe Git-Historie). Bitte vor dem
Deploy lokal mit `npm install && npm run build` sowie einer NIP-07-fähigen Extension
(z. B. Alby, die auch WebLN kann) testen und Konsolenfehler melden.

## Mitmachen

Neue Produkte, Korrekturen und Langzeitberichte kommen per Pull Request rein. Ablauf und
Vorlage: siehe [`CONTRIBUTING.md`](CONTRIBUTING.md) bzw. die Seite `/mitmachen` auf der
Live-Site.

## Deployment

`netlify.toml` ist bereits vorbereitet (`npm run build`, Publish-Verzeichnis `dist`). Für
GitHub Pages oder Vercel funktioniert der Standard-Astro-Workflow ohne Anpassung.

## Vor dem Go-Live noch offen

- [ ] `src/pages/impressum.astro` **und** `src/pages/en/impressum.astro` mit echten
      Anbieterangaben ausfüllen (Pflicht nach § 5 TMG)
- [ ] GitHub-Links in `Header.astro` / `Footer.astro` / `mitmachen.astro` auf das echte
      Repository zeigen lassen (aktuell Platzhalter `https://github.com/`)
  - Verwende dazu z. B. eine Umgebungsvariable oder ersetze die Vorkommen direkt.
- [ ] `astro.config.mjs` → `site` auf die tatsächliche Domain setzen, falls abweichend
- [ ] Lightning-Adressen der Autor:innen in `src/data/contributors.ts` eintragen (sonst
      zeigt der Zap-Button nur den Hinweis „noch keine Adresse hinterlegt")
- [ ] `npm install` ausführen (neue Abhängigkeit `nostr-tools` für die
      Kommentar-/Zap-Funktion) und danach `npm run build` lokal verifizieren – im
      Entwicklungs-Sandbox konnte dieses Feature nicht kompiliert/getestet werden
- [ ] Nostr-Kommentare/-Zaps lokal mit einer NIP-07-Extension (z. B. Alby) durchklicken:
      Kommentar schreiben, Zap auf einen Kommentar, Teilen-Button

## Lizenz

MIT, siehe [`LICENSE`](LICENSE). Passe das an, falls ihr eine andere Lizenz bevorzugt.
