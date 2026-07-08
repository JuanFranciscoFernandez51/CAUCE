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
  seedSettingsForRubro,
} from "@/lib/onboarding";
import { OS_MODULES } from "@/lib/tenant";
import { procesosParaRubro } from "@/lib/procesos-catalogo";

/**
 * ONBOARDING 1-CLICK — orquesta la creación de un cliente COMPLETO encadenando
 * lo que ya existe (no reimplementa lógica de los módulos). Secuencia robusta:
 * el core (Client + User) es transaccional; los pasos opcionales (marca, procesos,
 * settings) son best-effort y avisan en `warnings` sin abortar el alta.
 *
 * Los procesos del cliente salen del catálogo en código (procesos-catalogo.ts)
 * según el rubro: quedan ACTIVOS y explicados en criollo en su sistema.
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
    // Los procesos salen del catálogo en código según el rubro.
    const procesosDelRubro = procesosParaRubro(data.rubro);
    let procesosCreados = 0;

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
        `Encauzamos su operación: las consultas entran a un CRM único, los procesos clave ` +
        `quedan corriendo desde el día uno y su sitio nace cargado para empezar a captar.`;

      await db.blueprint.create({
        data: {
          leadId: lead.id,
          status: "APPROVED",
          level: PACK_LEVEL[data.pack],
          summary,
          flow: [
            { paso: 1, titulo: "Software propio activo", detalle: `Cauce OS con los módulos: ${modules.join(", ")}.` },
            { paso: 2, titulo: "CRM unificado", detalle: "Toda consulta entra ordenada, con bienvenida automática." },
            { paso: 3, titulo: "Procesos corriendo", detalle: `${procesosDelRubro.length} proceso(s) activo(s) desde el día uno.` },
            { paso: 4, titulo: "Sitio cargado", detalle: "Servicios y presentación sembrados para captar ya." },
          ],
          recipeIds: procesosDelRubro.map((p) => p.key),
          suggestedPack: data.pack as Pack,
          suggestedSetup: setup,
          suggestedMonthly: mrr,
        },
      });

      // ── d) Procesos ACTIVOS, explicados en criollo ───────
      await db.proceso.createMany({
        data: procesosDelRubro.map((p, i) => ({
          clientId: client.id,
          nombre: p.nombre,
          queHace: p.queHace,
          cuando: p.cuando,
          estado: "ACTIVO" as const,
          orden: i,
        })),
      });
      procesosCreados = procesosDelRubro.length;
    } catch {
      warnings.push("El cliente se creó, pero falló el armado del blueprint/procesos.");
    }

    return NextResponse.json({
      ok: true,
      slug,
      username,
      password,
      clientId: client.id,
      modules,
      brandNote,
      procesos: procesosCreados,
      warnings,
    });
  } catch (e) {
    return serverError(e);
  }
}
