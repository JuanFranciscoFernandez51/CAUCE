import { NextResponse } from "next/server";
import { z } from "zod";
import type { Pack } from "@prisma/client";
import { db } from "@/lib/db";
import { guard, parseBody, serverError } from "../_utils";

const createSchema = z.object({
  negocio: z.string().trim().min(1, "Poné el nombre del negocio").max(200),
  contactoNombre: z.string().trim().max(200).optional().default(""),
  whatsapp: z.string().trim().max(50).optional().default(""),
  rubro: z.string().trim().max(200).optional().default(""),
  pack: z.enum(["STARTER", "PRO", "SCALE", "CUSTOM"]),
  setupUsd: z.number().min(0),
  monthlyUsd: z.number().min(0),
  dolarArs: z.number().min(0),
  conIva: z.boolean().default(false),
  ivaPct: z.number().min(0).max(100).default(21),
  modulos: z.array(z.string()).default([]),
  procesoKeys: z.array(z.string()).default([]),
  piezas: z.array(z.string()).default([]),
  horasSemana: z.number().min(0).max(200).default(0),
  casoEspejo: z.string().max(40).optional().default(""),
  nota: z.string().trim().max(2000).optional().default(""),
});

/** Crea una propuesta enviable y devuelve su link público. */
export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const { data, error } = await parseBody(req, createSchema);
  if (error) return error;

  try {
    const p = await db.propuesta.create({
      data: {
        negocio: data.negocio,
        contactoNombre: data.contactoNombre || null,
        whatsapp: data.whatsapp || null,
        rubro: data.rubro || null,
        pack: data.pack as Pack,
        setupUsd: data.setupUsd,
        monthlyUsd: data.monthlyUsd,
        dolarArs: data.dolarArs,
        conIva: data.conIva,
        ivaPct: data.ivaPct,
        modulos: data.modulos,
        procesoKeys: data.procesoKeys,
        piezas: data.piezas,
        horasSemana: data.horasSemana,
        casoEspejo: data.casoEspejo || null,
        nota: data.nota || null,
      },
    });
    return NextResponse.json({ ok: true, id: p.id, url: `/p/${p.token}` }, { status: 201 });
  } catch (e) {
    return serverError(e);
  }
}
