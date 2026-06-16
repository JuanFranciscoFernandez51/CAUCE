import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { guardOsApi } from "../_guard";
import { isOsOwner, resolveOsRole } from "@/app/os/[slug]/_components/os-role";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;

const createSchema = z
  .object({
    kind: z.enum(["venta", "gasto", "ajuste", "transferencia"]),
    concept: z.string().trim().min(1, "El concepto es obligatorio").max(200),
    amountArs: z.number().finite("El monto es inválido"),
    method: z.enum(["efectivo", "mp", "transferencia"]).optional(),
    accountId: z.string().trim().min(1).optional(),
    toAccountId: z.string().trim().min(1).optional(),
    date: z.string().regex(DATE_RE).optional(),
    attachmentUrl: z.string().trim().url().max(500).optional(),
  })
  .refine((d) => (d.kind === "ajuste" ? d.amountArs !== 0 : d.amountArs > 0), {
    message: "El monto debe ser mayor a 0",
    path: ["amountArs"],
  })
  .refine((d) => (d.kind === "transferencia" ? !!d.accountId && !!d.toAccountId : true), {
    message: "La transferencia necesita cuenta de origen y destino",
    path: ["toAccountId"],
  })
  .refine((d) => (d.kind === "transferencia" ? d.accountId !== d.toAccountId : true), {
    message: "Origen y destino deben ser cuentas distintas",
    path: ["toAccountId"],
  });

/** "YYYY-MM-DD" → instante al mediodía ART (fecha contable estable). */
function dateToInstant(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00-03:00`);
}

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

async function guardOwner(slug: string) {
  const guard = await guardOsApi(slug, "caja");
  if (guard.error) return guard;
  const session = await auth();
  const osRole = session ? await resolveOsRole(session.user.id, guard.tenant.id) : null;
  if (!isOsOwner(osRole)) {
    return { error: NextResponse.json({ error: "Sin acceso a Finanzas" }, { status: 403 }) } as const;
  }
  return guard;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const guard = await guardOwner(slug);
  if (guard.error) return guard.error;

  const sp = new URL(req.url).searchParams;
  const range = rangeFor(sp.get("date"), sp.get("month"));
  const accountId = sp.get("accountId");

  const movements = await db.cashMovement.findMany({
    where: {
      clientId: guard.tenant.id,
      ...(range ? { date: range } : {}),
      ...(accountId ? { OR: [{ accountId }, { toAccountId: accountId }] } : {}),
    },
    orderBy: { date: "desc" },
    select: {
      id: true,
      kind: true,
      concept: true,
      amountArs: true,
      method: true,
      date: true,
      accountId: true,
      toAccountId: true,
      attachmentUrl: true,
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
  const guard = await guardOwner(slug);
  if (guard.error) return guard.error;
  const clientId = guard.tenant.id;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const d = parsed.data;
  const when = d.date ? dateToInstant(d.date) : new Date();

  // Validar que las cuentas (si vienen) sean de este tenant.
  const accountIds = [d.accountId, d.toAccountId].filter(Boolean) as string[];
  if (accountIds.length > 0) {
    const owned = await db.account.count({
      where: { id: { in: accountIds }, clientId },
    });
    if (owned !== new Set(accountIds).size) {
      return NextResponse.json({ error: "Cuenta inválida" }, { status: 400 });
    }
  }

  try {
    const movement = await db.$transaction(async (tx) => {
      const mov = await tx.cashMovement.create({
        data: {
          clientId,
          kind: d.kind,
          concept: d.concept,
          amountArs: d.amountArs,
          method: d.method ?? null,
          accountId: d.accountId ?? null,
          toAccountId: d.kind === "transferencia" ? d.toAccountId ?? null : null,
          attachmentUrl: d.attachmentUrl ?? null,
          date: when,
          createdAt: when,
        },
      });

      // Ajuste de saldos: venta/ingreso suma, gasto resta, ajuste va con su signo,
      // transferencia resta de origen y suma a destino.
      if (d.kind === "transferencia") {
        await tx.account.update({
          where: { id: d.accountId! },
          data: { balance: { decrement: d.amountArs } },
        });
        await tx.account.update({
          where: { id: d.toAccountId! },
          data: { balance: { increment: d.amountArs } },
        });
      } else if (d.accountId) {
        const delta =
          d.kind === "venta" ? d.amountArs : d.kind === "gasto" ? -d.amountArs : d.amountArs;
        await tx.account.update({
          where: { id: d.accountId },
          data: { balance: { increment: delta } },
        });
      }

      return mov;
    });

    return NextResponse.json({ ok: true, movement }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "No se pudo guardar el movimiento" }, { status: 500 });
  }
}
