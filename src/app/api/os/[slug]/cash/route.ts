import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi } from "../_guard";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;

const createSchema = z
  .object({
    kind: z.enum(["venta", "gasto", "ajuste"]),
    concept: z.string().trim().min(1, "El concepto es obligatorio").max(200),
    amountArs: z.number().finite("El monto es inválido"),
    method: z.enum(["efectivo", "mp", "transferencia"]).optional(),
  })
  .refine((d) => (d.kind === "ajuste" ? d.amountArs !== 0 : d.amountArs > 0), {
    message: "El monto debe ser mayor a 0",
    path: ["amountArs"],
  });

/** Rango [inicio, fin) de un día o mes calendario argentino (UTC-3). */
function rangeFor(date: string | null, month: string | null): { gte: Date; lt: Date } | null {
  if (date && DATE_RE.test(date)) {
    const start = new Date(`${date}T00:00:00-03:00`);
    return { gte: start, lt: new Date(start.getTime() + 86_400_000) };
  }
  if (month && MONTH_RE.test(month)) {
    const [y, m] = month.split("-").map(Number);
    const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
    return {
      gte: new Date(`${month}-01T00:00:00-03:00`),
      lt: new Date(`${next}-01T00:00:00-03:00`),
    };
  }
  return null;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const guard = await guardOsApi(slug, "caja");
  if (guard.error) return guard.error;

  const sp = new URL(req.url).searchParams;
  const range = rangeFor(sp.get("date"), sp.get("month"));

  const movements = await db.cashMovement.findMany({
    where: {
      clientId: guard.tenant.id,
      ...(range ? { createdAt: range } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      kind: true,
      concept: true,
      amountArs: true,
      method: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ movements });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const guard = await guardOsApi(slug, "caja");
  if (guard.error) return guard.error;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const movement = await db.cashMovement.create({
    data: {
      clientId: guard.tenant.id,
      kind: d.kind,
      concept: d.concept,
      amountArs: d.amountArs,
      method: d.method ?? null,
    },
  });

  return NextResponse.json({ ok: true, movement }, { status: 201 });
}
