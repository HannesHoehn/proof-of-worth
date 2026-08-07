# Mitmachen bei Proof of Worth

Danke fürs Interesse! Beiträge laufen über den normalen GitHub-Workflow: Fork → Branch →
Pull Request.

## Neues Produkt hinzufügen

1. Fork das Repository und erstelle einen Branch, z. B. `add-produkt-victorinox`.
2. Kopiere `src/content/products/_TEMPLATE.md` und speichere sie unter einem sprechenden
   Dateinamen (z. B. `victorinox-taschenmesser.md`) im selben Ordner.
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

## Qualitätskriterien für Pull Requests

- Quellen sind seriös und nachprüfbar (Herstellerseite, iFixit, unabhängige Tests –
  keine reinen Marketingtexte als einzige Quelle).
- Score-Begründungen sind konkret, nicht pauschal ("gute Qualität" reicht nicht).
- Auch Schwächen werden benannt.
- `npm run build` läuft lokal ohne Fehler durch (prüft u. a. das Content-Schema).

## Fragen oder Diskussion

Nutze GitHub Issues für Vorschläge, Diskussionen über die Score-Methodik oder technische
Fragen zum Projekt.
