import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { guardOsApi } from "../../_guard";
import { isOsOwner, resolveOsRole } from "@/app/os/[slug]/_components/os-role";

const ACCOUNT_KINDS = ["efectivo", "banco", "mp", "dolares", "cheques", "otro"] as const;

const patchSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    kind: z.enum(ACCOUNT_KINDS).optional(),
    active: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "Nada para actualizar" });

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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const guard = await guardOwner(slug);
  if (guard.error) return guard.error;

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  // No tocamos balance ni currency desde acá: el saldo lo manejan los movimientos.
  const result = await db.account.updateMany({
    where: { id, clientId: guard.tenant.id },
    data: parsed.data,
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
  }
  const account = await db.account.findFirst({ where: { id, clientId: guard.tenant.id } });
  return NextResponse.json({ ok: true, account });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const guard = await guardOwner(slug);
  if (guard.error) return guard.error;

  const account = await db.account.findFirst({
    where: { id, clientId: guard.tenant.id },
    select: { id: true },
  });
  if (!account) {
    return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
  }

  // Si tiene movimientos asociados NO la borramos (perderíamos trazabilidad del
  // saldo): la desactivamos. Si está limpia, se puede eliminar de verdad.
  const used = await db.cashMovement.count({
    where: {
      clientId: guard.tenant.id,
      OR: [{ accountId: id }, { toAccountId: id }],
    },
  });

  if (used > 0) {
    await db.account.update({ where: { id }, data: { active: false } });
    return NextResponse.json({ ok: true, deactivated: true });
  }

  await db.account.delete({ where: { id } });
  return NextResponse.json({ ok: true, deactivated: false });
}
