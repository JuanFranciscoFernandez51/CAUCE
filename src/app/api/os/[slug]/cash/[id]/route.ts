import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { guardOsApi } from "../../_guard";
import { isOsOwner, resolveOsRole } from "@/app/os/[slug]/_components/os-role";
import { noonArg } from "@/app/os/[slug]/_lib/finanzas";
import { movView, recalcularBalances } from "@/app/os/[slug]/_lib/finanzas-data";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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

const patchSchema = z
  .object({
    kind: z.enum(["venta", "gasto"]).optional(),
    concept: z.string().trim().max(200).optional(),
    categoria: z.string().trim().max(80).nullable().optional(),
    amountArs: z.number().finite().positive().optional(),
    accountId: z.string().trim().min(1).optional(),
    method: z.enum(["efectivo", "mp", "transferencia"]).nullable().optional(),
    date: z.string().regex(DATE_RE).optional(),
    attachmentUrl: z.string().trim().url().max(500).nullable().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "Nada para actualizar" });

/** Edición inline (estilo planilla) de un movimiento. Las patas de transferencia no se editan. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const guard = await guardOwner(slug);
  if (guard.error) return guard.error;
  const clientId = guard.tenant.id;

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const actual = await db.cashMovement.findFirst({ where: { id, clientId } });
  if (!actual) {
    return NextResponse.json({ error: "Movimiento no encontrado" }, { status: 404 });
  }
  if (actual.kind === "transferencia") {
    return NextResponse.json(
      { error: "Las transferencias se editan borrándolas y cargándolas de nuevo" },
      { status: 400 }
    );
  }

  let moneda: string | undefined;
  if (d.accountId && d.accountId !== actual.accountId) {
    const cuenta = await db.account.findFirst({ where: { id: d.accountId, clientId } });
    if (!cuenta) return NextResponse.json({ error: "Cuenta inválida" }, { status: 400 });
    moneda = cuenta.currency;
  }

  try {
    const movement = await db.$transaction(async (tx) => {
      const mov = await tx.cashMovement.update({
        where: { id },
        data: {
          kind: d.kind,
          concept: d.concept !== undefined ? d.concept : undefined,
          categoria: d.categoria !== undefined ? d.categoria || null : undefined,
          amountArs: d.amountArs,
          accountId: d.accountId,
          moneda,
          method: d.method !== undefined ? d.method : undefined,
          date: d.date ? noonArg(d.date) : undefined,
          attachmentUrl: d.attachmentUrl !== undefined ? d.attachmentUrl : undefined,
        },
      });
      await recalcularBalances(tx, clientId, [actual.accountId, mov.accountId]);
      return mov;
    });
    return NextResponse.json({ ok: true, movement: movView(movement) });
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 500 });
  }
}

/** Borra un movimiento. Si es pata de una transferencia, borra las dos patas. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const guard = await guardOwner(slug);
  if (guard.error) return guard.error;
  const clientId = guard.tenant.id;

  const mov = await db.cashMovement.findFirst({ where: { id, clientId } });
  if (!mov) {
    return NextResponse.json({ error: "Movimiento no encontrado" }, { status: 404 });
  }

  try {
    await db.$transaction(async (tx) => {
      const afectadas: (string | null)[] = [mov.accountId, mov.toAccountId];
      if (mov.transferenciaId) {
        const patas = await tx.cashMovement.findMany({
          where: { clientId, transferenciaId: mov.transferenciaId },
          select: { accountId: true },
        });
        for (const p of patas) afectadas.push(p.accountId);
        await tx.cashMovement.deleteMany({
          where: { clientId, transferenciaId: mov.transferenciaId },
        });
      } else {
        await tx.cashMovement.deleteMany({ where: { id, clientId } });
      }
      await recalcularBalances(tx, clientId, afectadas);
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No se pudo borrar el movimiento" }, { status: 500 });
  }
}
