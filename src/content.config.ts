import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

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
  loader: glob({ pattern: ['**/*.md', '!**/_*.md'], base: './src/content/products' }),
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
