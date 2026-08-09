# Mitmachen bei Proof of Worth

Danke fürs Interesse! Beiträge laufen über den normalen GitHub-Workflow: Fork → Branch →
Pull Request.

## Neues Produkt hinzufügen

1. Fork das Repository und erstelle einen Branch, z. B. `add-produkt-victorinox`.
2. Kopiere `src/content/products/_TEMPLATE.md` und speichere sie unter einem sprechenden
   Dateinamen (z. B. `victorinox-taschenmesser.md`) unter `src/content/products/de/`
   (und idealerweise auch als englische Übersetzung unter `src/content/products/en/` –
   siehe [Zweisprachigkeit (DE/EN)](#zweisprachigkeit-deen) unten).
3. Fülle alle Felder aus. Wichtig:
   - `kategorie` muss einer der vier festen Werte sein: `werkzeug-outdoor`,
     `haushalt-kueche`, `tech-hardware`, `bekleidung`.
   - `einordnung`: `empfehlung` für klare BIFL-Fits, `diskussionswuerdig` für Produkte mit
     gemischter Bilanz. Beides ist willkommen – das Verzeichnis lebt von Ehrlichkeit, nicht
     nur von Lieblingsprodukten.
   - Jede der vier `scores`-Begründungen (`reparierbarkeit`, `material`, `garantie`,
     `wiederverkaufswert`) braucht eine nachprüfbare Quelle in `quellen`.
4. Schreib im Markdown-Body kurz, warum das Produkt zum Konzept passt, wo die Grenzen
   liegen, und ein Fazit.
5. Öffne einen Pull Request. Ein Preview-Deploy (sofern via Netlify/Vercel verbunden) zeigt
   automatisch, wie die neue Seite aussieht.

## Bestehende Bewertung korrigieren

Genauso willkommen wie neue Produkte: Wenn sich Garantiebedingungen ändern, ein Score nicht
mehr aktuell ist oder eine Quelle nicht mehr stimmt, einfach die entsprechende `.md`-Datei
per Pull Request anpassen und `aktualisiert: YYYY-MM-DD` ergänzen.

## Langzeitbericht beisteuern

Nutzt du ein gelistetes Produkt seit Jahren? Ergänze einen Eintrag im `langzeitberichte`-Feld
der jeweiligen Datei:

```yaml
langzeitberichte:
  - seitJahren: 8
    autor: "dein-github-handle"
    notiz: "Kurze, konkrete Beobachtung – z. B. was repariert werden musste und wie."
```

## Lightning-Adresse hinterlegen (für Zaps)

Jede Produktseite hat einen Zap-Button, über den Leser:innen die Autor:in direkt per
Lightning unterstützen können (siehe `/unterstuetzen`). Damit das für deine Beiträge
funktioniert:

1. Öffne `src/data/contributors.ts`.
2. Trage einen Eintrag mit deinem Autor:innen-Namen an (identisch zum `autor`-Feld in
   deinen Produktdateien) und deiner Lightning-Adresse (Format `name@anbieter.com`, z. B.
   von [Alby](https://getalby.com) oder [Wallet of Satoshi](https://www.walletofsatoshi.com)):

```ts
export const contributors: Record<string, Contributor> = {
  Redaktion: { lightningAddress: undefined },
  "dein-github-handle": {
    lightningAddress: "dein-name@getalby.com",
    nostr: "npub1...", // optional, nur als Profil-Link
  },
};
```

3. Setz in deinen Produktdateien `autor: "dein-github-handle"`, damit der Zap-Button auf
   diesen Eintrag verweist.

Ohne hinterlegte Adresse zeigt die Seite automatisch einen Hinweis statt eines kaputten
Buttons – ein Eintrag hier ist optional, aber empfohlen.

## Zweisprachigkeit (DE/EN)

Die Seite ist zweisprachig: Deutsch ist Standard (`/…`), Englisch liegt unter `/en/…`.
Für künftige Beiträge gilt:

- **Produkte**: Jede Produktdatei existiert idealerweise doppelt – unter
  `src/content/products/de/<slug>.md` und `src/content/products/en/<slug>.md`, mit
  identischem Dateinamen und identischen Score-Werten (`scores.*.wert`), aber übersetzten
  Texten (`tagline`, `begruendung`, Fließtext). Eine fehlende englische Version bricht
  nichts – das Produkt erscheint dann nur auf der deutschen Seite –, ist aber nicht das
  Ziel.
- **Neue Seiten**: für jede neue Seite unter `src/pages/*.astro` eine englische
  Entsprechung unter `src/pages/en/*.astro` mit demselben Pfadsegment anlegen, damit
  `getRelativeLocaleUrl()` in Header/Footer/ProductCard korrekt verlinkt.
- **Wiederkehrende UI-Textbausteine** (Navigation, Badges, Kategorie-Namen, Score-Labels)
  leben zentral in `src/i18n/ui.ts` – neue Schlüssel dort für beide Sprachen ergänzen,
  nicht hart in Komponenten verdrahten.
- **Lange Fließtexte** (Essays, Anleitungen) werden nicht in `ui.ts` übersetzt, sondern
  als vollständige, eigenständige `.astro`-Datei unter `src/pages/en/` dupliziert.

Wenn du nicht zweisprachig beitragen möchtest, reiche einfach die deutsche Version ein –
kein Problem, aber bitte im PR erwähnen, dass die englische Version noch fehlt.

## Qualitätskriterien für Pull Requests

- Quellen sind seriös und nachprüfbar (Herstellerseite, iFixit, unabhängige Tests –
  keine reinen Marketingtexte als einzige Quelle).
- Score-Begründungen sind konkret, nicht pauschal ("gute Qualität" reicht nicht).
- Auch Schwächen werden benannt.
- `npm run build` läuft lokal ohne Fehler durch (prüft u. a. das Content-Schema).

## Fragen oder Diskussion

Nutze GitHub Issues für Vorschläge, Diskussionen über die Score-Methodik oder technische
Fragen zum Projekt.
