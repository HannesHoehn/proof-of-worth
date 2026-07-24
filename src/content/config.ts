import { defineCollection, z } from 'astro:content';

// Proof of Worth Score: vier transparente Kriterien, jeweils 1-5 Punkte.
// Siehe /score-methodik für die ausführliche Erklärung.
const scoreCriterion = z.object({
  wert: z.number().min(1).max(5),
  begruendung: z.string(),
});

const quelle = z.object({
  label: z.string(),
  url: z.string().url(),
});

const langzeitbericht = z.object({
  seitJahren: z.number(),
  autor: z.string(),
  notiz: z.string(),
});

const products = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    hersteller: z.string(),
    kategorie: z.enum([
      'werkzeug-outdoor',
      'haushalt-kueche',
      'tech-hardware',
      'bekleidung',
    ]),
    tagline: z.string(),
    // 'empfehlung' = klarer BIFL-Fit, 'diskussionswuerdig' = bewusst kontroverses Beispiel
    einordnung: z.enum(['empfehlung', 'diskussionswuerdig']),
    icon: z.string().default('box'),
    scores: z.object({
      reparierbarkeit: scoreCriterion,
      material: scoreCriterion,
      garantie: scoreCriterion,
      wiederverkaufswert: scoreCriterion,
    }),
    garantieJahre: z.union([z.number(), z.literal('lifetime')]),
    typischerPreisEUR: z.number(),
    erwarteteLebensdauerJahre: z.number(),
    quellen: z.array(quelle),
    langzeitberichte: z.array(langzeitbericht).default([]),
    veroeffentlicht: z.date(),
    aktualisiert: z.date().optional(),
    autor: z.string().default('Redaktion'),
  }),
});

export const collections = { products };
