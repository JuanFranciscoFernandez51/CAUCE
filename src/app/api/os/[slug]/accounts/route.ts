import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { guardOsApi } from "../_guard";
import { isOsOwner, resolveOsRole } from "@/app/os/[slug]/_components/os-role";

const ACCOUNT_KINDS = ["efectivo", "banco", "mp", "dolares", "cheques", "otro"] as const;
const CURRENCIES = ["ARS", "USD"] as const;

const createSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(80),
  kind: z.enum(ACCOUNT_KINDS).default("otro"),
  currency: z.enum(CURRENCIES),
  initialBalance: z.number().finite("El saldo inicial es inválido").optional(),
  excluirDeResultado: z.boolean().optional(),
});

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
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const guard = await guardOwner(slug);
  if (guard.error) return guard.error;

  const accounts = await db.account.findMany({
    where: { clientId: guard.tenant.id },
    orderBy: [{ active: "desc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ accounts });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const guard = await guardOwner(slug);
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
  const initial = d.initialBalance ?? 0;

  const max = await db.account.aggregate({
    where: { clientId: guard.tenant.id },
    _max: { orden: true },
  });
  const account = await db.account.create({
    data: {
      clientId: guard.tenant.id,
      name: d.name,
      kind: d.kind,
      currency: d.currency,
      saldoInicial: initial,
      balance: initial, // cache: sin movimientos todavía, saldo actual = saldo inicial
      excluirDeResultado: d.excluirDeResultado ?? false,
      orden: (max._max.orden ?? -1) + 1,
    },
  });

  return NextResponse.json({ ok: true, account }, { status: 201 });
}
