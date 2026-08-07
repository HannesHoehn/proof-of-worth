// Zuordnung von Autor:innen-Namen (wie im "autor"-Feld der Produktdateien
// unter src/content/products/) zu ihrer Lightning-Adresse für Zaps.
//
// Wichtig: Die Website selbst verwaltet nie Geld oder private Schlüssel.
// Ein Zap geht direkt von der Wallet der zappenden Person an die hier
// hinterlegte Lightning-Adresse der/des Autor:in (LNURL-Pay, siehe
// ZapButton.astro). Neue Mitwirkende tragen sich hier selbst per Pull
// Request ein - siehe CONTRIBUTING.md, Abschnitt "Lightning-Adresse".
export type Contributor = {
  /** Lightning Address im lud16-Format, z. B. "name@getalby.com" */
  lightningAddress?: string;
  /** Optional: Nostr-npub für einen Profil-Link (kein Zap-Protokoll, nur Anzeige) */
  nostr?: string;
};

export const contributors: Record<string, Contributor> = {
  Redaktion: {
    // TODO: echte Lightning-Adresse eintragen, sobald vorhanden,
    // z. B. "proofofworth@getalby.com" oder "team@walletofsatoshi.com".
    // Solange dieses Feld leer/undefined ist, zeigt der ZapButton auf
    // Produktseiten automatisch einen Hinweis statt eines kaputten Buttons.
    lightningAddress: undefined,
    nostr: undefined,
  },
};

export function getContributor(name: string): Contributor {
  return contributors[name] ?? {};
}
