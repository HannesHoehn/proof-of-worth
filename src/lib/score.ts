// Zentrale Logik für den Proof-of-Worth-Score.
// Änderungen hier wirken sich auf alle Produktseiten aus – siehe /score-methodik
// für die öffentlich dokumentierte Erklärung dieser Gewichtung.
import { ui, defaultLang, type Locale } from '../i18n/ui';

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

export function scoreLabel(score: number, lang: Locale = defaultLang): string {
  const t = ui[lang];
  if (score >= 4.5) return t['score.exzellent'];
  if (score >= 3.5) return t['score.gut'];
  if (score >= 2.5) return t['score.durchwachsen'];
  return t['score.kritisch'];
}

export function kategorieLabel(kategorie: string, lang: Locale = defaultLang): string {
  const key = `kategorie.${kategorie}` as keyof (typeof ui)[typeof lang];
  return ui[lang][key] ?? kategorie;
}

export function formatGarantie(jahre: number | 'lifetime', lang: Locale = defaultLang): string {
  if (jahre === 'lifetime') {
    return lang === 'en' ? 'Lifetime warranty' : 'Lebenslange Garantie';
  }
  return lang === 'en' ? `${jahre}-year warranty` : `${jahre} Jahre Garantie`;
}
