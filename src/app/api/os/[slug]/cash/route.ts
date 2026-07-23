import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { guardOsApi } from "../_guard";
import { isOsOwner, resolveOsRole } from "@/app/os/[slug]/_components/os-role";
import { noonArg } from "@/app/os/[slug]/_lib/finanzas";
import { movView, recalcularBalances } from "@/app/os/[slug]/_lib/finanzas-data";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;
const YEAR_RE = /^\d{4}$/;

const createSchema = z.object({
  kind: z.enum(["venta", "gasto"]),
  concept: z.string().trim().max(200).default(""),
  categoria: z.string().trim().min(1).max(80).optional(),
  amountArs: z.number().finite().positive("El monto debe ser mayor a 0"),
  accountId: z.string().trim().min(1, "Elegí una cuenta"),
  method: z.enum(["efectivo", "mp", "transferencia"]).optional(),
  date: z.string().regex(DATE_RE).optional(),
  attachmentUrl: z.string().trim().url().max(500).optional(),
});

/** Rango [inicio, fin) de un día, mes o año calendario argentino (UTC-3). */
function rangeFor(
  date: string | null,
  month: string | null,
  year: string | null
): { gte: Date; lt: Date } | null {
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
  if (year && YEAR_RE.test(year)) {
    return {
      gte: new Date(`${year}-01-01T00:00:00-03:00`),
      lt: new Date(`${Number(year) + 1}-01-01T00:00:00-03:00`),
    };
  }
  return null;
}

/** Caja/Finanzas es SOLO del dueño: además del guard estándar, exige isOsOwner. */
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
  const range = rangeFor(sp.get("date"), sp.get("month"), sp.get("year"));
  const accountId = sp.get("accountId");

  const movements = await db.cashMovement.findMany({
    where: {
      clientId: guard.tenant.id,
      ...(range ? { date: range } : {}),
      ...(accountId ? { OR: [{ accountId }, { toAccountId: accountId }] } : {}),
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ movements: movements.map(movView) });
}

/** Alta de un movimiento INGRESO (venta) o GASTO. Las transferencias van por /caja/transferencias. */
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

  const account = await db.account.findFirst({ where: { id: d.accountId, clientId } });
  if (!account) {
    return NextResponse.json({ error: "Cuenta inválida" }, { status: 400 });
  }

  const when = d.date ? noonArg(d.date) : new Date();

  try {
    const movement = await db.$transaction(async (tx) => {
      const mov = await tx.cashMovement.create({
        data: {
          clientId,
          kind: d.kind,
          concept: d.concept || d.categoria || (d.kind === "venta" ? "Ingreso" : "Gasto"),
          categoria: d.categoria ?? null,
          amountArs: d.amountArs,
          moneda: account.currency,
          method: d.method ?? null,
          accountId: account.id,
          attachmentUrl: d.attachmentUrl ?? null,
          date: when,
        },
      });
      await recalcularBalances(tx, clientId, [account.id]);
      return mov;
    });

    return NextResponse.json({ ok: true, movement: movView(movement) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "No se pudo guardar el movimiento" }, { status: 500 });
  }
}
