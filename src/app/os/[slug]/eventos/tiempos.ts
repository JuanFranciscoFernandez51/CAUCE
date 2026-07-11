/** Un intento cronometrado: tiempo base + penalizaciones. */
export type Intento = { ms: number; penalSeg: number; dsq: boolean };

/** Tiempo final del intento (ms) o null si fue descalificado. */
export function tiempoFinal(i: Intento): number | null {
  if (i.dsq || i.ms == null) return null;
  return i.ms + i.penalSeg * 1000;
}

/** El mejor intento válido del competidor, o null si no tiene. */
export function mejorTiempo(intentos: Intento[]): number | null {
  const validos = intentos.map(tiempoFinal).filter((t): t is number => t !== null);
  return validos.length ? Math.min(...validos) : null;
}

/** "01:23.45" a partir de ms (minutos:segundos.centésimas). */
export function fmtCrono(ms: number): string {
  const cs = Math.floor(ms / 10) % 100;
  const sec = Math.floor(ms / 1000) % 60;
  const min = Math.floor(ms / 60000);
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

/** Ordena competidores por mejor tiempo (sin tiempo van al final). */
export function ordenarRanking<T extends { intentos: Intento[] }>(comps: T[]): T[] {
  return [...comps].sort((a, b) => {
    const ta = mejorTiempo(a.intentos);
    const tb = mejorTiempo(b.intentos);
    if (ta === null && tb === null) return 0;
    if (ta === null) return 1;
    if (tb === null) return -1;
    return ta - tb;
  });
}

/** Penalizaciones estándar de gymkhana (portadas del Vespa Club). */
export const PENALIZACIONES = [
  { label: "Cono caído", seg: 2 },
  { label: "Pie al suelo", seg: 3 },
  { label: "Omisión", seg: 10 },
] as const;
