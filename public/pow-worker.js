// Web Worker: sucht per Brute-Force eine Nonce, sodass die SHA-256-Event-ID
// (NIP-01-Serialisierung: [0, pubkey, created_at, kind, tags, content]) eine
// gewünschte Anzahl führender Nullbits hat (NIP-13 Proof-of-Work). Läuft
// bewusst in einem Worker statt im Hauptthread, damit die Seite während der
// Berechnung nicht einfriert - siehe src/lib/nostr-client.ts (minePow) für
// den aufrufenden Code und /unterstuetzen für die Nutzer:innen-Erklärung.
//
// Bewusst ohne Abhängigkeiten: nutzt nur die native Web Crypto API
// (crypto.subtle.digest), kein Bundling nötig, weil diese Datei als
// statische Datei aus /public/ 1:1 ausgeliefert wird.

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function countLeadingZeroBits(hex) {
  let count = 0;
  for (let i = 0; i < hex.length; i++) {
    const nibble = parseInt(hex[i], 16);
    if (nibble === 0) {
      count += 4;
      continue;
    }
    // Math.clz32 zählt führende Nullbits in einer 32-Bit-Zahl; ein Hex-Nibble
    // ist 4 Bit breit, die oberen 28 Bit sind bei nibble (0-15) immer 0.
    count += Math.clz32(nibble) - 28;
    break;
  }
  return count;
}

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return bytesToHex(new Uint8Array(digest));
}

function serialize(event) {
  return JSON.stringify([0, event.pubkey, event.created_at, event.kind, event.tags, event.content]);
}

self.onmessage = async (msg) => {
  const { event, difficulty } = msg.data;
  const baseTags = event.tags.filter((t) => t[0] !== 'nonce');
  let nonce = 0;
  const start = Date.now();
  let lastReport = start;

  while (true) {
    const tags = [...baseTags, ['nonce', String(nonce), String(difficulty)]];
    const id = await sha256Hex(serialize({ ...event, tags }));
    if (countLeadingZeroBits(id) >= difficulty) {
      self.postMessage({ done: true, tags, attempts: nonce + 1, ms: Date.now() - start });
      return;
    }
    nonce++;
    const now = Date.now();
    if (now - lastReport > 250) {
      lastReport = now;
      self.postMessage({ done: false, attempts: nonce, ms: now - start });
    }
  }
};
