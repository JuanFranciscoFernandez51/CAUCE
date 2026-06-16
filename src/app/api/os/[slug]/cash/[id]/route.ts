import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { guardOsApi } from "../../_guard";
import { isOsOwner, resolveOsRole } from "@/app/os/[slug]/_components/os-role";

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

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const guard = await guardOwner(slug);
  if (guard.error) return guard.error;
  const clientId = guard.tenant.id;

  // Buscamos el movimiento scopeado por clientId: imposible tocar otro tenant.
  const mov = await db.cashMovement.findFirst({
    where: { id, clientId },
    select: { id: true, kind: true, amountArs: true, accountId: true, toAccountId: true },
  });
  if (!mov) {
    return NextResponse.json({ error: "Movimiento no encontrado" }, { status: 404 });
  }

  try {
    await db.$transaction(async (tx) => {
      // Revertir el efecto en los saldos antes de borrar.
      if (mov.kind === "transferencia") {
        if (mov.accountId) {
          await tx.account.updateMany({
            where: { id: mov.accountId, clientId },
            data: { balance: { increment: mov.amountArs } },
          });
        }
        if (mov.toAccountId) {
          await tx.account.updateMany({
            where: { id: mov.toAccountId, clientId },
            data: { balance: { decrement: mov.amountArs } },
          });
        }
      } else if (mov.accountId) {
        const delta =
          mov.kind === "venta"
            ? mov.amountArs
            : mov.kind === "gasto"
              ? -mov.amountArs
              : mov.amountArs;
        await tx.account.updateMany({
          where: { id: mov.accountId, clientId },
          data: { balance: { decrement: delta } },
        });
      }

      await tx.cashMovement.deleteMany({ where: { id, clientId } });
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No se pudo borrar el movimiento" }, { status: 500 });
  }
}
