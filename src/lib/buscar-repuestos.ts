import type { Prisma } from "@prisma/client";

/**
 * Búsqueda tolerante para el shop de repuestos.
 *
 * La gente no busca como está cargado el catálogo: escribe "pastillas de freno
 * de 110", con palabras de más, sin acentos y en singular o plural. Acá la
 * consulta se parte en términos, se tiran las palabras vacías, y la cilindrada
 * suelta ("110") se usa para filtrar por moto compatible.
 */

const VACIAS = new Set([
  "de", "del", "la", "el", "los", "las", "un", "una", "y", "o", "para", "con",
  "por", "en", "al", "a", "que", "mi", "tu", "su", "moto", "repuesto", "repuestos",
]);

/** Sin acentos y en minúsculas, que es como conviene comparar. */
export const normalizar = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

/** Quita el plural simple para que "pastillas" encuentre "pastilla". */
function raiz(p: string): string {
  if (p.length > 4 && p.endsWith("es")) return p.slice(0, -2);
  if (p.length > 3 && p.endsWith("s")) return p.slice(0, -1);
  return p;
}

export type Consulta = { terminos: string[]; cilindradas: string[] };

export function analizar(q: string): Consulta {
  const partes = normalizar(q).split(/[^a-z0-9]+/).filter(Boolean);
  const cilindradas = partes.filter((p) => /^(50|70|90|100|105|110|125|135|150|160|200|220|250|350|650)$/.test(p));
  const terminos = partes
    .filter((p) => !VACIAS.has(p) && p.length >= 2 && !cilindradas.includes(p))
    .map(raiz);
  return { terminos, cilindradas };
}

/** Un término matchea si aparece en el nombre, el código, el rubro o las motos. */
const porTermino = (t: string): Prisma.BazarProductoWhereInput => ({
  OR: [
    { nombre: { contains: t, mode: "insensitive" } },
    { sku: { contains: t, mode: "insensitive" } },
    { categoria: { contains: t, mode: "insensitive" } },
    { descripcion: { contains: t, mode: "insensitive" } },
  ],
});

/**
 * Tres intentos, de más preciso a más amplio. Se usa el primero que traiga
 * resultados: la idea es que el cliente nunca se quede con la pantalla vacía.
 */
export function intentosDeBusqueda(q: string): Prisma.BazarProductoWhereInput[] {
  const { terminos, cilindradas } = analizar(q);
  if (!terminos.length && !cilindradas.length) return [];

  const cc = cilindradas.length
    ? { OR: cilindradas.map((c) => ({ compatibilidades: { hasSome: [] as string[] }, nombre: { contains: c } })) }
    : null;

  const todos = terminos.map(porTermino);
  const intentos: Prisma.BazarProductoWhereInput[] = [];

  // 1) todas las palabras, y si nombró una cilindrada, que también aparezca
  if (todos.length) {
    intentos.push({
      AND: [...todos, ...(cilindradas.length ? [{ OR: cilindradas.map((c) => porTermino(c)) }] : [])],
    });
  }
  // 2) todas las palabras, sin exigir la cilindrada
  if (todos.length > 1) intentos.push({ AND: todos });
  // 3) alguna de las palabras (la más amplia)
  if (todos.length) intentos.push({ OR: todos });
  // 4) sólo la cilindrada, por si escribió el repuesto de otra forma
  if (cilindradas.length) intentos.push({ OR: cilindradas.map((c) => porTermino(c)) });

  return intentos;
}
