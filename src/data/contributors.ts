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
    lightningAddress: "guiltyreplace182@cake.cash",
    nostr: "npub1nwlha7h4k7f3sssugq5322kfhu7f3lcp2lzp87jtqa02p30ld6hsrmzr2z",
  },
};

export function getContributor(name: string): Contributor {
  return contributors[name] ?? {};
}
