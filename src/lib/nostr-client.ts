// Client-seitige Nostr-Anbindung für Produktseiten: Kommentare (NIP-22) und
// Zaps auf Kommentare (NIP-57). Läuft komplett im Browser, ohne eigenes
// Backend - genau wie ZapButton.astro liest/schreibt dieses Modul direkt
// gegen öffentliche Relays. Signieren geht auf zwei Wegen: über eine
// NIP-07-Browser-Extension (z. B. Alby, nos2x) für eine portable, echte
// Nostr-Identität, oder ganz ohne Extension über eine browser-lokale
// Wegwerf-Identität mit NIP-13-Proof-of-Work-Spamschutz (siehe Abschnitt
// weiter unten) plus optionaler Lightning-Abkürzung.
//
// Bekannte, bewusste Vereinfachung: Der "lnurl"-Tag im Zap-Request (NIP-57)
// wird hier als reine Lightning-Adresse statt als korrekt bech32-kodierte
// LNURL gesendet, um keine zusätzliche bech32-Abhängigkeit einzuführen.
// Das weicht leicht vom Spec-Wortlaut ab, beeinflusst aber weder den
// Zahlungsfluss noch unsere eigene Zap-Summen-Anzeige (die liest den
// "amount"-Tag direkt aus der im Receipt eingebetteten Zap-Request-JSON).
import { SimplePool, nip19 } from 'nostr-tools';
// Empfohlener, schlankerer Importpfad für die reinen Signier-/Schlüssel-
// Funktionen (vermeidet unnötiges Bundling weiterer NIP-Submodule über den
// Haupt-Index) - siehe nostr-tools-Doku.
import { generateSecretKey, getPublicKey, finalizeEvent } from 'nostr-tools/pure';

export const RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
  'wss://relay.primal.net',
];

export const COMMENT_KIND = 1111; // NIP-22 "Comment"
export const ZAP_REQUEST_KIND = 9734; // NIP-57
export const ZAP_RECEIPT_KIND = 9735; // NIP-57
export const PROFILE_KIND = 0;

let poolInstance: SimplePool | null = null;
function pool(): SimplePool {
  if (!poolInstance) poolInstance = new SimplePool();
  return poolInstance;
}

export type NostrEvent = {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
};

declare global {
  interface Window {
    nostr?: {
      getPublicKey: () => Promise<string>;
      signEvent: (event: Record<string, unknown>) => Promise<NostrEvent>;
    };
    webln?: {
      enable: () => Promise<void>;
      sendPayment: (invoice: string) => Promise<unknown>;
    };
  }
}

/** Eindeutiger, stabiler Anker für Kommentare: Origin + Pfad der aktuellen Seite. */
export function currentPageUrl(): string {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}`.replace(/\/$/, '');
}

export function hasExtension(): boolean {
  return typeof window !== 'undefined' && typeof window.nostr !== 'undefined';
}

// --- Kommentieren ohne NIP-07-Extension -----------------------------------
// Wer keine Nostr-Extension installiert hat, kann trotzdem kommentieren: der
// Browser erzeugt sich selbst ein Schlüsselpaar (bleibt nur in diesem
// Browser, im localStorage - bewusst schwächer abgesichert als eine echte
// Extension, siehe /unterstuetzen) und signiert damit lokal. Der Kommentar
// landet als ganz normales NIP-22-Event auf denselben Relays wie
// Extension-Kommentare. Als Spamschutz gibt es dafür standardmäßig eine
// clientseitige Proof-of-Work-Berechnung (NIP-13, läuft in einem Web Worker
// unter /public/pow-worker.js, damit die Seite währenddessen nicht
// einfriert) und optional eine Lightning-Abkürzung darum herum.

const LOCAL_IDENTITY_STORAGE_KEY = 'pow-local-identity-sk';

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Holt die browser-lokale Kommentar-Identität aus dem localStorage oder legt eine neue an. */
export function getOrCreateLocalIdentity(): { sk: Uint8Array; pk: string } {
  const stored = localStorage.getItem(LOCAL_IDENTITY_STORAGE_KEY);
  const sk = stored ? hexToBytes(stored) : generateSecretKey();
  if (!stored) localStorage.setItem(LOCAL_IDENTITY_STORAGE_KEY, bytesToHex(sk));
  return { sk, pk: getPublicKey(sk) };
}

// Ziel-Schwierigkeit (führende Nullbits) für die NIP-13-Proof-of-Work-Berechnung.
// Der Worker hasht per Web-Crypto-API (crypto.subtle.digest, async) statt
// mit einer schnellen synchronen Implementierung - bei Schwierigkeit 14
// braucht das im Schnitt ~16.384 Versuche, was auf gängiger Hardware
// realistisch bei ein bis wenigen Sekunden liegt. Höher = mehr Spamschutz,
// aber auch längere Wartezeit für ehrliche Kommentare.
export const DEFAULT_POW_DIFFICULTY = 14;

export type PowProgress = { attempts: number; ms: number };

type MiningTemplate = {
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
};

/** Startet die Proof-of-Work-Suche in einem Web Worker; gibt Fortschritt über onProgress zurück. */
export function minePow(
  template: MiningTemplate,
  difficulty: number,
  onProgress?: (progress: PowProgress) => void,
): { promise: Promise<string[][]>; cancel: () => void } {
  if (typeof Worker === 'undefined') {
    return { promise: Promise.reject(new Error('no-worker-support')), cancel: () => {} };
  }
  const worker = new Worker('/pow-worker.js');
  const promise = new Promise<string[][]>((resolve, reject) => {
    worker.onmessage = (msg: MessageEvent) => {
      const data = msg.data as { done: boolean; tags?: string[][]; attempts: number; ms: number };
      if (data.done && data.tags) {
        worker.terminate();
        resolve(data.tags);
      } else if (onProgress) {
        onProgress({ attempts: data.attempts, ms: data.ms });
      }
    };
    worker.onerror = (err: ErrorEvent) => {
      worker.terminate();
      reject(new Error(err.message || 'worker-error'));
    };
    worker.postMessage({ event: template, difficulty });
  });
  return { promise, cancel: () => worker.terminate() };
}

export async function fetchComments(url: string): Promise<NostrEvent[]> {
  const events = await pool().querySync(RELAYS, {
    kinds: [COMMENT_KIND],
    '#I': [url],
    limit: 200,
  } as any);
  return (events as NostrEvent[]).sort((a, b) => b.created_at - a.created_at);
}

/** Reicht ein signiertes Event an alle Relays weiter; wirft nur, wenn ALLE Relays ablehnen. */
async function publishToRelays(signed: NostrEvent): Promise<void> {
  try {
    await Promise.any(pool().publish(RELAYS, signed as any));
  } catch {
    // Mindestens ein Relay hat den Event angenommen, wenn Promise.any nicht
    // wirft; wirft es doch, haben alle Relays abgelehnt - Fehler nach oben
    // reichen, damit die UI das anzeigen kann.
    throw new Error('publish-failed');
  }
}

export async function publishComment(url: string, content: string): Promise<NostrEvent> {
  if (!hasExtension() || !window.nostr) throw new Error('no-extension');
  const pubkey = await window.nostr.getPublicKey();
  const unsigned = {
    kind: COMMENT_KIND,
    created_at: Math.floor(Date.now() / 1000),
    pubkey,
    tags: [
      ['I', url], // Root-Anker: die kommentierte Seite (NIP-22, externer Inhalt)
      ['K', 'web'], // Art des Root-Anchors: eine Webseite (NIP-73)
    ],
    content,
  };
  const signed = await window.nostr.signEvent(unsigned);
  await publishToRelays(signed);
  return signed;
}

/**
 * Kommentar ohne NIP-07-Extension: signiert mit der browser-lokalen Identität
 * (siehe getOrCreateLocalIdentity), aber erst nachdem eine NIP-13-Proof-of-
 * Work-Suche mit der gewünschten Schwierigkeit abgeschlossen ist. Gibt neben
 * dem Promise auch eine cancel()-Funktion zurück, damit die UI die laufende
 * Berechnung abbrechen kann (z. B. wenn stattdessen per Lightning bezahlt wird).
 */
export function publishLocalComment(
  url: string,
  content: string,
  difficulty: number = DEFAULT_POW_DIFFICULTY,
  onProgress?: (progress: PowProgress) => void,
): { promise: Promise<NostrEvent>; cancel: () => void } {
  const { sk, pk } = getOrCreateLocalIdentity();
  const createdAt = Math.floor(Date.now() / 1000);
  const baseTags: string[][] = [
    ['I', url],
    ['K', 'web'],
  ];
  const mining = minePow(
    { pubkey: pk, created_at: createdAt, kind: COMMENT_KIND, tags: baseTags, content },
    difficulty,
    onProgress,
  );
  const promise = mining.promise.then(async (minedTags) => {
    const signed = finalizeEvent(
      { kind: COMMENT_KIND, created_at: createdAt, tags: minedTags, content },
      sk,
    ) as unknown as NostrEvent;
    await publishToRelays(signed);
    return signed;
  });
  return { promise, cancel: mining.cancel };
}

/**
 * Alternative zur Proof-of-Work-Wartezeit: eine winzige, sofort per WebLN
 * bezahlte Lightning-Zahlung an die Autor:innen-Adresse ersetzt die
 * Rechenzeit als Spamschutz. Ohne WebLN-Wallet wirft das sofort ('no-webln'),
 * die UI fällt dann auf die Proof-of-Work-Variante zurück.
 */
export async function publishLocalCommentViaPayment(
  url: string,
  content: string,
  lightningAddress: string,
  sats: number,
): Promise<NostrEvent> {
  if (typeof window === 'undefined' || !window.webln) throw new Error('no-webln');
  const meta = await resolveLnurlp(lightningAddress);
  const msats = sats * 1000;
  if (msats < (meta.minSendable ?? 0) || (meta.maxSendable && msats > meta.maxSendable)) {
    throw new Error('amount-out-of-range');
  }
  const sep = String(meta.callback).includes('?') ? '&' : '?';
  const res = await fetch(`${meta.callback}${sep}amount=${msats}`);
  if (!res.ok) throw new Error('invoice-failed');
  const data = await res.json();
  if (!data.pr) throw new Error('no-invoice');

  await window.webln.enable();
  await window.webln.sendPayment(data.pr);

  const { sk } = getOrCreateLocalIdentity();
  const signed = finalizeEvent(
    {
      kind: COMMENT_KIND,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['I', url],
        ['K', 'web'],
        ['paid', String(sats)], // eigener, informativer Tag: dieser Kommentar hat den PoW-Spamschutz per Zahlung übersprungen
      ],
      content,
    },
    sk,
  ) as unknown as NostrEvent;
  await publishToRelays(signed);
  return signed;
}

type Profile = { name?: string; picture?: string; lud16?: string };
const profileCache = new Map<string, Profile | null>();

export async function fetchProfile(pubkey: string): Promise<Profile | null> {
  if (profileCache.has(pubkey)) return profileCache.get(pubkey) ?? null;
  const events = (await pool().querySync(RELAYS, {
    kinds: [PROFILE_KIND],
    authors: [pubkey],
    limit: 1,
  } as any)) as NostrEvent[];
  if (events.length === 0) {
    profileCache.set(pubkey, null);
    return null;
  }
  try {
    const data = JSON.parse(events[0].content);
    const profile: Profile = {
      name: data.display_name || data.name,
      picture: data.picture,
      lud16: data.lud16,
    };
    profileCache.set(pubkey, profile);
    return profile;
  } catch {
    profileCache.set(pubkey, null);
    return null;
  }
}

export function shortenPubkey(pubkey: string): string {
  try {
    const npub = nip19.npubEncode(pubkey);
    return `${npub.slice(0, 10)}…${npub.slice(-4)}`;
  } catch {
    return pubkey.slice(0, 8);
  }
}

/** Best-effort Summe aller Zap-Quittungen (kind 9735) zu einem Kommentar. */
export async function fetchZapTotal(eventId: string): Promise<{ sats: number; count: number }> {
  const receipts = (await pool().querySync(RELAYS, {
    kinds: [ZAP_RECEIPT_KIND],
    '#e': [eventId],
    limit: 200,
  } as any)) as NostrEvent[];

  let msats = 0;
  for (const r of receipts) {
    const descTag = r.tags.find((t) => t[0] === 'description');
    if (!descTag) continue;
    try {
      const req = JSON.parse(descTag[1]);
      const amountTag = (req.tags ?? []).find((t: string[]) => t[0] === 'amount');
      if (amountTag) msats += parseInt(amountTag[1], 10) || 0;
    } catch {
      // Kaputte/unerwartete Quittung ignorieren, zählt nicht mit.
    }
  }
  return { sats: Math.round(msats / 1000), count: receipts.length };
}

async function resolveLnurlp(lud16: string): Promise<any> {
  const [name, domain] = lud16.split('@');
  if (!name || !domain) throw new Error('invalid-lud16');
  const res = await fetch(`https://${domain}/.well-known/lnurlp/${name}`);
  if (!res.ok) throw new Error('lnurlp-failed');
  return res.json();
}

/** Baut eine Lightning-Invoice für einen Zap - mit signiertem NIP-57-Zap-Request, falls möglich. */
export async function buildZapInvoice(opts: {
  recipientPubkey: string;
  lud16: string;
  sats: number;
  eventId?: string;
  comment?: string;
}): Promise<string> {
  const meta = await resolveLnurlp(opts.lud16);
  const msats = opts.sats * 1000;

  if (msats < (meta.minSendable ?? 0) || (meta.maxSendable && msats > meta.maxSendable)) {
    throw new Error('amount-out-of-range');
  }

  let extra = '';
  if (meta.allowsNostr && hasExtension() && window.nostr) {
    const pubkey = await window.nostr.getPublicKey();
    const tags: string[][] = [
      ['relays', ...RELAYS],
      ['amount', String(msats)],
      ['lnurl', opts.lud16],
      ['p', opts.recipientPubkey],
    ];
    if (opts.eventId) tags.push(['e', opts.eventId]);
    const unsigned = {
      kind: ZAP_REQUEST_KIND,
      created_at: Math.floor(Date.now() / 1000),
      pubkey,
      tags,
      content: opts.comment ?? '',
    };
    const signed = await window.nostr.signEvent(unsigned);
    extra = `&nostr=${encodeURIComponent(JSON.stringify(signed))}`;
  }

  const sep = String(meta.callback).includes('?') ? '&' : '?';
  const res = await fetch(`${meta.callback}${sep}amount=${msats}${extra}`);
  if (!res.ok) throw new Error('invoice-failed');
  const data = await res.json();
  if (!data.pr) throw new Error('no-invoice');
  return data.pr as string;
}

/** Signiert und veröffentlicht eine kurze Notiz, die auf die aktuelle Seite verweist. */
export async function shareCurrentPage(title: string): Promise<'posted' | 'no-extension'> {
  const url = currentPageUrl();
  if (!hasExtension() || !window.nostr) return 'no-extension';
  const pubkey = await window.nostr.getPublicKey();
  const unsigned = {
    kind: 1,
    created_at: Math.floor(Date.now() / 1000),
    pubkey,
    tags: [['r', url]],
    content: `${title}\n\n${url}`,
  };
  const signed = await window.nostr.signEvent(unsigned);
  await publishToRelays(signed);
  return 'posted';
}
