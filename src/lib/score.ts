// Zentrale Logik für den Proof-of-Worth-Score.
// Änderungen hier wirken sich auf alle Produktseiten aus – siehe /score-methodik
// für die öffentlich dokumentierte Erklärung dieser Gewichtung.

export type ScoreCriterion = { wert: number; begruendung: string };

export type Scores = {
  reparierbarkeit: ScoreCriterion;
  material: ScoreCriterion;
  garantie: ScoreCriterion;
  wiederverkaufswert: ScoreCriterion;
};

// Gleichgewichtung aller vier Kriterien. Bewusst einfach gehalten und
// öffentlich einsehbar, damit die Bewertung nachvollziehbar bleibt.
export function gesamtScore(scores: Scores): number {
  const summe =
    scores.reparierbarkeit.wert +
    scores.material.wert +
    scores.garantie.wert +
    scores.wiederverkaufswert.wert;
  return Math.round((summe / 4) * 10) / 10;
}

export function scoreLabel(score: number): string {
  if (score >= 4.5) return 'Exzellent';
  if (score >= 3.5) return 'Gut';
  if (score >= 2.5) return 'Durchwachsen';
  return 'Kritisch';
}

export const kategorieLabels: Record<string, string> = {
  'werkzeug-outdoor': 'Werkzeug & Outdoor',
  'haushalt-kueche': 'Haushalt & Küche',
  'tech-hardware': 'Tech & Hardware',
  bekleidung: 'Bekleidung',
};

export function formatGarantie(jahre: number | 'lifetime'): string {
  if (jahre === 'lifetime') return 'Lebenslange Garantie';
  return `${jahre} Jahre Garantie`;
}
