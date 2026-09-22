import { db } from "@/lib/db";
import { getAjustes } from "@/lib/ajustes";
import { ESPEJOS, PIEZA_BASE, PIEZAS, type Espejo, type Pieza } from "@/lib/piezas";

/**
 * PRECIOS PUBLICADOS — la única fuente de los precios de Cauce.
 * Se editan en Admin → Configuración → Precios de la web y los leen la
 * landing, /precios, las propuestas (/p/…) y el agente de marketing. Los valores de piezas.ts
 * quedan solo como punto de partida si todavía no se guardó nada.
 */
export type Escala = { titulo: string; texto: string; precio: string; detalle: string };

export type Precios = {
  base: Pieza;
  /** El "desde" de la tarjeta 2 de la landing. */
  componenteUsd: number;
  ivaPct: number;
  piezas: Pieza[];
  espejos: Espejo[];
  escala: Escala;
};

export const ESCALA_POR_DEFECTO: Escala = {
  titulo: "Escala",
  texto:
    "Para empresas grandes: desarrollos a medida, integraciones con tus sistemas, infraestructura dedicada y equipo asignado. Lo armamos juntos.",
  precio: "A medida",
  detalle: "valores según el proyecto",
};

export async function getPrecios(): Promise<Precios> {
  const [ajustes, filas] = await Promise.all([
    getAjustes(),
    db.ajuste.findMany({ where: { clave: { in: ["baseQueIncluye", "piezas", "espejos", "escala"] } } }),
  ]);
  const extra = Object.fromEntries(filas.map((f) => [f.clave, f.valor])) as {
    baseQueIncluye?: string;
    piezas?: Pieza[];
    espejos?: Espejo[];
    escala?: Escala;
  };
  return {
    base: {
      ...PIEZA_BASE,
      setupUsd: Number(ajustes.setupBaseUsd),
      monthlyUsd: Number(ajustes.mensualBaseUsd),
      queIncluye: extra.baseQueIncluye || PIEZA_BASE.queIncluye,
    },
    componenteUsd: Number(ajustes.precioComponenteUsd),
    ivaPct: Number(ajustes.ivaPct),
    piezas: Array.isArray(extra.piezas) && extra.piezas.length ? extra.piezas : PIEZAS,
    espejos: Array.isArray(extra.espejos) && extra.espejos.length ? extra.espejos : ESPEJOS,
    escala: { ...ESCALA_POR_DEFECTO, ...(extra.escala ?? {}) },
  };
}

export { calcular } from "@/lib/piezas";
