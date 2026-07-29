/** Idiomas de la web de Cauce. El elegido se guarda en la cookie `lang`. */
export type Lang = "es" | "en";
export const LANGS: Lang[] = ["es", "en"];
export const COOKIE_LANG = "lang";

const DICT: Record<Lang, Record<string, string>> = {
  es: {
    "nav.como": "Cómo funciona",
    "nav.precios": "Precios",
    "nav.casos": "Casos",
    "nav.consultoria": "Consultoría",
    "nav.entrar": "Entrar",
    "nav.abrir": "Abrir menú",
    "nav.cerrar": "Cerrar menú",
    "nav.principal": "Principal",
    "tema.claro": "Modo claro",
    "tema.oscuro": "Modo oscuro",
    "tema.cambiar": "Cambiar tema",
    "idioma.cambiar": "Ver en inglés",
  },
  en: {
    "nav.como": "How it works",
    "nav.precios": "Pricing",
    "nav.casos": "Case studies",
    "nav.consultoria": "Consulting",
    "nav.entrar": "Sign in",
    "nav.abrir": "Open menu",
    "nav.cerrar": "Close menu",
    "nav.principal": "Main",
    "tema.claro": "Light mode",
    "tema.oscuro": "Dark mode",
    "tema.cambiar": "Switch theme",
    "idioma.cambiar": "Ver en español",
  },
};

export function t(lang: Lang, clave: string): string {
  return DICT[lang]?.[clave] ?? DICT.es[clave] ?? clave;
}
