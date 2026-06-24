import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import type { Pack, Level } from "@prisma/client";
import { db } from "@/lib/db";
import { guard, parseBody, serverError } from "../_utils";
import { getPricing } from "@/lib/pricing";
import { extraerMarca } from "@/lib/brand-extractor";
import {
  defaultModulesForRubro,
  normalizeModules,
  recipeHintsForRubro,
  seedSettingsForRubro,
} from "@/lib/onboarding";
import { OS_MODULES } from "@/lib/tenant";

/**
 * ONBOARDING 1-CLICK — orquesta la creación de un cliente COMPLETO encadenando
 * lo que ya existe (no reimplementa lógica de los módulos). Secuencia robusta:
 * el core (Client + User) es transaccional; los pasos opcionales (marca, recetas,
 * settings) son best-effort y avisan en `warnings` sin abortar el alta.
 *
 * La provisión real en n8n y las capturas NO van acá: son pasos posteriores con
 * sus scripts (scripts/provision-all.ts, scripts/capturar-cliente.ts). Acá las
 * automatizaciones quedan en ACTIVE para que se vean en el panel.
 */

export const dynamic = "force-dynamic";

const PACKS = ["STARTER", "PRO", "SCALE", "CUSTOM"] as const;

const onboardSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(200),
  rubro: z.string().trim().max(200).optional().default(""),
  web: z.string().trim().max(300).optional().default(""),
  instagram: z.string().trim().max(300).optional().default(""),
  pack: z.enum(PACKS).default("SCALE"),
  contactName: z.string().trim().max(200).optional().default(""),
  email: z.string().trim().max(200).optional().default(""),
  whatsapp: z.string().trim().max(50).optional().default(""),
  modules: z.array(z.enum(OS_MODULES)).optional(),
});

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 30);

/** Pack → level del blueprint (a mayor pack, mayor nivel de delivery). */
const PACK_LEVEL: Record<(typeof PACKS)[number], Level> = {
  STARTER: "N1",
  PRO: "N2",
  SCALE: "N3",
  CUSTOM: "N4",
};
const PACK_PRICING_KEY: Record<(typeof PACKS)[number], "starter" | "pro" | "scale" | "custom"> = {
  STARTER: "starter",
  PRO: "pro",
  SCALE: "scale",
  CUSTOM: "custom",
};

export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;

  const { data, error } = await parseBody(req, onboardSchema);
  if (error) return error;

  const warnings: string[] = [];

  try {
    // ── a) Slug único ──────────────────────────────────────
    const base = slugify(data.name) || `cliente${Date.now() % 100000}`;
    let slug = base;
    let i = 1;
    while (await db.client.findUnique({ where: { slug } })) {
      slug = `${base}${i++}`.slice(0, 38);
    }

    const username = slug;
    const password = `${slug}2026`;

    // Precio según pack (best-effort: si falla pricing, usamos 0 sin abortar).
    let mrr = 0;
    let setup = 0;
    try {
      const pricing = await getPricing();
      const pk = pricing.packs[PACK_PRICING_KEY[data.pack]];
      mrr = pk?.monthlyUsd ?? 0;
      setup = pk?.setupUsd ?? 0;
    } catch {
      warnings.push("No se pudo leer el pricing; MRR/setup quedaron en 0 (editá luego).");
    }

    // Si no eligieron módulos, usamos el default del rubro (no solo "sitio").
    const elegidos = data.modules && data.modules.length > 0 ? data.modules : defaultModulesForRubro(data.rubro);
    const modules = normalizeModules(elegidos);

    // ── b) Marca (best-effort, no rompe el alta) ───────────
    const branding: { displayName: string; primary?: string; accent?: string; logo?: string } = {
      displayName: data.name,
    };
    let brandNote: string | null = null;
    if (data.web || data.instagram) {
      try {
        const marca = await extraerMarca({ web: data.web, instagram: data.instagram });
        if (marca.ok) {
          if (marca.primary) branding.primary = marca.primary;
          if (marca.accent) branding.accent = marca.accent;
          if (marca.logoUrl) branding.logo = marca.logoUrl;
          brandNote = `Marca detectada (${marca.fuente ?? "web"}).`;
        } else {
          warnings.push(`No pude extraer la marca: ${marca.motivo ?? "sin datos"}.`);
        }
      } catch {
        warnings.push("La extracción de marca falló; el cliente quedó con la marca por defecto.");
      }
    }

    // ── a) CORE TRANSACCIONAL: Client + User + Subscription ─
    // Si esto falla, no queda nada a medias (Prisma revierte la transacción).
    const settings = seedSettingsForRubro(data.rubro, data.name);
    const { client } = await db.$transaction(async (tx) => {
      const created = await tx.client.create({
        data: {
          name: data.name,
          slug,
          rubro: data.rubro || null,
          pack: data.pack as Pack,
          status: "ACTIVE",
          mrr,
          setupPaid: 0,
          modules,
          branding,
          settings,
          contactName: data.contactName || null,
          email: data.email || null,
          whatsapp: data.whatsapp || null,
        },
      });

      await tx.user.create({
        data: {
          username,
          name: data.contactName || data.name,
          role: "CLIENT",
          osRole: "dueno",
          clientId: created.id,
          passwordHash: await bcrypt.hash(password, 10),
        },
      });

      await tx.subscription.create({
        data: {
          clientId: created.id,
          pack: data.pack as Pack,
          monthlyUsd: mrr,
          status: "ACTIVE",
        },
      });

      return { client: created };
    });

    // ── c) Lead CONVERTED + Blueprint curado (best-effort) ─
    const hints = recipeHintsForRubro(data.rubro);
    let recipeIds: string[] = [];
    try {
      const recipes = await db.recipe.findMany({
        where: { OR: hints.map((h) => ({ name: { contains: h } })) },
        select: { id: true, name: true },
      });
      // Mantener el orden de prioridad de los hints y limitar a 3.
      const byHint: string[] = [];
      for (const h of hints) {
        const m = recipes.find((r) => r.name.includes(h) && !byHint.includes(r.id));
        if (m) byHint.push(m.id);
      }
      recipeIds = byHint.slice(0, 3);
    } catch {
      warnings.push("No se pudieron resolver las recetas del recetario.");
    }

    try {
      const lead = await db.lead.create({
        data: {
          source: "MANUAL",
          status: "CONVERTED",
          clientId: client.id,
          name: data.contactName || data.name,
          business: data.name,
          rubro: data.rubro || null,
          email: data.email || null,
          whatsapp: data.whatsapp || null,
          score: 90,
          intake: {
            web: data.web || null,
            instagram: data.instagram || null,
            origen: "onboarding-1click",
          },
        },
      });

      const summary =
        `${data.name}${data.rubro ? ` (${data.rubro})` : ""} arranca en Cauce con su software propio. ` +
        `Encauzamos su operación: las consultas entran a un CRM único, las automatizaciones clave ` +
        `quedan corriendo desde el día uno y su sitio nace cargado para empezar a captar.`;

      // ── d) Automatizaciones ACTIVE (que se vean en el panel) ─
      const recipes = await db.recipe.findMany({ where: { id: { in: recipeIds } } });
      const config = {
        nombre_negocio: data.name,
        telefono: data.whatsapp || "",
        rubro: data.rubro || "",
      };

      await db.blueprint.create({
        data: {
          leadId: lead.id,
          status: "APPROVED",
          level: PACK_LEVEL[data.pack],
          summary,
          flow: [
            { paso: 1, titulo: "Software propio activo", detalle: `Cauce OS con los módulos: ${modules.join(", ")}.` },
            { paso: 2, titulo: "CRM unificado", detalle: "Toda consulta entra ordenada, con bienvenida automática." },
            { paso: 3, titulo: "Automatizaciones corriendo", detalle: `${recipes.length} flujo(s) activo(s) desde el día uno.` },
            { paso: 4, titulo: "Sitio cargado", detalle: "Servicios y presentación sembrados para captar ya." },
          ],
          recipeIds,
          suggestedPack: data.pack as Pack,
          suggestedSetup: setup,
          suggestedMonthly: mrr,
        },
      });

      for (const r of recipes) {
        await db.automation.create({
          data: {
            clientId: client.id,
            recipeId: r.id,
            name: r.name,
            status: "ACTIVE",
            health: "OK",
            config,
          },
        });
      }
      if (recipes.length === 0) {
        warnings.push("No se encontraron recetas para el rubro; el cliente quedó sin automatizaciones (cargalas en el recetario).");
      }
    } catch {
      warnings.push("El cliente se creó, pero falló el armado del blueprint/automatizaciones (revisá el recetario).");
    }

    return NextResponse.json({
      ok: true,
      slug,
      username,
      password,
      clientId: client.id,
      modules,
      brandNote,
      warnings,
    });
  } catch (e) {
    return serverError(e);
  }
}
