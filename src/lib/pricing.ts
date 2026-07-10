import { db } from "@/lib/db";

export type PackKey = "starter" | "pro" | "scale" | "custom";

export type PackPricing = {
  label: string;
  setupUsd: number | null; // null = "a cotizar"
  monthlyUsd: number | null; // null = "a consultar"
  monthlyFrom: boolean; // true = "desde"
  setupFrom: boolean;
  fairUseMsgs: number | null; // tope de mensajes/mes (null = sin tope)
  tagline: string;
  features: string[];
};

export type PricingData = {
  dolarArs: number;
  ivaPct: number;
  packs: Record<PackKey, PackPricing>;
  modulePricing: Record<string, { label: string; monthlyUsd: number }>;
  roadmapPriceUsd: number;
  roadmapCredit: boolean;
};

export const DEFAULT_PRICING: PricingData = {
  dolarArs: 1200,
  ivaPct: 21,
  packs: {
    starter: {
      label: "Starter",
      setupUsd: 0,
      monthlyUsd: 45,
      monthlyFrom: false,
      setupFrom: false,
      fairUseMsgs: 1500,
      tagline: "Tu bot de mensajes funcionando hoy",
      features: [
        "1 bot de WhatsApp o Instagram",
        "FAQ 24/7 + captura de leads",
        "1 canal conectado",
        "Autoservicio: lo activás vos",
        "Fair use con tope de mensajes",
      ],
    },
    pro: {
      label: "Pro",
      setupUsd: 500,
      monthlyUsd: 300,
      monthlyFrom: false,
      setupFrom: true,
      fairUseMsgs: 6000,
      tagline: "Automatización conectada a tu sistema",
      features: [
        "Bot + integraciones con tu sistema o web",
        "Varios flujos por área de negocio",
        "Diagnóstico y configuración incluidos",
        "Reporte mensual de resultados",
        "Soporte prioritario",
      ],
    },
    scale: {
      label: "Scale",
      setupUsd: null,
      monthlyUsd: 350,
      monthlyFrom: true,
      setupFrom: false,
      fairUseMsgs: null,
      tagline: "Tu software propio: Cauce OS",
      features: [
        "Software con tu marca y tu dominio",
        "Módulos: CRM, turnos, stock, RRHH, caja",
        "Tus campos y flujos propios",
        "Integrado con tus automatizaciones",
        "Mejoras todos los meses",
      ],
    },
    custom: {
      label: "Custom",
      setupUsd: null,
      monthlyUsd: null,
      monthlyFrom: false,
      setupFrom: false,
      fairUseMsgs: null,
      tagline: "Cauce OS + desarrollo a tu medida",
      features: [
        "Todo lo de Scale",
        "Módulos únicos para tu operación",
        "Flujos a medida sobre la base",
        "Prioridad máxima de soporte",
      ],
    },
  },
  modulePricing: {
    crm: { label: "CRM", monthlyUsd: 80 },
    turnos: { label: "Turnos & Agenda", monthlyUsd: 80 },
    catalogo: { label: "Catálogo & Stock", monthlyUsd: 90 },
    taller: { label: "Taller (órdenes de trabajo)", monthlyUsd: 90 },
    rrhh: { label: "RRHH", monthlyUsd: 90 },
    caja: { label: "Caja & Reportes", monthlyUsd: 90 },
  },
  roadmapPriceUsd: 0,
  roadmapCredit: true,
};

/** Lee PricingConfig de la DB; si no existe, lo crea con defaults. Nada hardcodeado en UI. */
export async function getPricing(): Promise<PricingData> {
  const row = await db.pricingConfig.findUnique({ where: { id: "singleton" } });
  if (!row) {
    await db.pricingConfig.create({
      data: {
        id: "singleton",
        dolarArs: DEFAULT_PRICING.dolarArs,
        ivaPct: DEFAULT_PRICING.ivaPct,
        packs: DEFAULT_PRICING.packs,
        modulePricing: DEFAULT_PRICING.modulePricing,
        roadmapPriceUsd: DEFAULT_PRICING.roadmapPriceUsd,
        roadmapCredit: DEFAULT_PRICING.roadmapCredit,
      },
    });
    return DEFAULT_PRICING;
  }
  return {
    dolarArs: row.dolarArs,
    ivaPct: row.ivaPct,
    packs: row.packs as PricingData["packs"],
    modulePricing: row.modulePricing as PricingData["modulePricing"],
    roadmapPriceUsd: row.roadmapPriceUsd,
    roadmapCredit: row.roadmapCredit,
  };
}

export function usdToArs(usd: number, dolarArs: number): number {
  return Math.round(usd * dolarArs);
}

export function fmtUsd(n: number): string {
  return `USD ${n.toLocaleString("es-AR")}`;
}

export function fmtArs(n: number): string {
  return `$ ${n.toLocaleString("es-AR")}`;
}
