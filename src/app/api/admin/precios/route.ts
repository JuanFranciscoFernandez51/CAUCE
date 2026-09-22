import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guard, parseBody, serverError } from "../_utils";

const usd = z.coerce.number().min(0).max(1_000_000);
const pieza = z.object({
  key: z.string().trim().min(1).max(60),
  label: z.string().trim().min(1).max(120),
  queIncluye: z.string().trim().max(600),
  setupUsd: usd,
  monthlyUsd: usd,
  micro: z.boolean().optional(),
});
const espejo = z.object({
  key: z.string().trim().min(1).max(60),
  nombre: z.string().trim().min(1).max(120),
  rubro: z.string().trim().max(160),
  historia: z.string().trim().max(800),
  shotsSlug: z.string().trim().max(60),
  setupUsd: usd,
  monthlyUsd: usd,
  piezas: z.array(z.string()),
});
const schema = z.object({
  setupBaseUsd: usd,
  mensualBaseUsd: usd,
  precioComponenteUsd: usd,
  ivaPct: z.coerce.number().min(0).max(100),
  baseQueIncluye: z.string().trim().max(800),
  piezas: z.array(pieza).min(1).max(80),
  espejos: z.array(espejo).min(1).max(12),
  escala: z.object({
    titulo: z.string().trim().max(60),
    texto: z.string().trim().max(600),
    precio: z.string().trim().max(60),
    detalle: z.string().trim().max(120),
  }),
});

/** Guarda los precios que publica la web (landing, /precios y armador). */
export async function PUT(req: Request) {
  const no = await guard();
  if (no) return no;
  const { data, error } = await parseBody(req, schema);
  if (error) return error;
  try {
    await Promise.all(
      Object.entries(data).map(([clave, valor]) =>
        db.ajuste.upsert({ where: { clave }, create: { clave, valor: valor as never }, update: { valor: valor as never } })
      )
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return serverError(e);
  }
}
