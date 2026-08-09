import { ui, defaultLang, type Locale } from './ui';

export function getLangFromUrl(url: URL): Locale {
  const [, first] = url.pathname.split('/');
  if (first in ui) return first as Locale;
  return defaultLang;
}

export function useTranslations(lang: Locale) {
  return function t(key: keyof (typeof ui)[typeof defaultLang]): string {
    return ui[lang][key] ?? ui[defaultLang][key];
  };
}

// Content-Collection-Entries liegen unter src/content/products/de/<slug>.md
// bzw. .../en/<slug>.md - die Content Layer API setzt entry.id entsprechend
// auf "de/<slug>" bzw. "en/<slug>".
export function localeOfEntryId(id: string): Locale {
  return id.startsWith('en/') ? 'en' : 'de';
}

export function slugOfEntryId(id: string): string {
  return id.replace(/^(de|en)\//, '');
}
