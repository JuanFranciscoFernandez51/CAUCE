import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { guard, parseBody, serverError } from "../../_utils";

const schema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  username: z.string().trim().min(3).max(40).regex(/^[a-zA-Z0-9._-]+$/, "Sin espacios ni símbolos raros").optional(),
  email: z.union([z.literal(""), z.email()]).optional(),
  role: z.enum(["ADMIN", "CLIENT"]).optional(),
  osRole: z.enum(["dueno", "equipo"]).optional(),
  clientId: z.string().nullable().optional(),
  password: z.string().min(8, "Al menos 8 caracteres").max(100).optional(),
});

/** Editar cualquier usuario de Cauce (admins y usuarios de los clientes). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const no = await guard();
  if (no) return no;
  const { id } = await params;
  const { data: d, error } = await parseBody(req, schema);
  if (error) return error;
  try {
    const u = await db.user.findUnique({ where: { id } });
    if (!u) return NextResponse.json({ error: "No existe" }, { status: 404 });

    if (d.username && d.username !== u.username) {
      const usado = await db.user.findUnique({ where: { username: d.username } });
      if (usado) return NextResponse.json({ error: "Ese usuario ya existe" }, { status: 409 });
    }
    // No dejar el panel sin ningún admin.
    if (d.role === "CLIENT" && u.role === "ADMIN") {
      const admins = await db.user.count({ where: { role: "ADMIN" } });
      if (admins <= 1) return NextResponse.json({ error: "Tiene que quedar al menos un admin" }, { status: 400 });
    }
    const rol = d.role ?? u.role;
    const actualizado = await db.user.update({
      where: { id },
      data: {
        ...(d.name ? { name: d.name } : {}),
        ...(d.username ? { username: d.username } : {}),
        ...(d.email !== undefined ? { email: d.email || null } : {}),
        ...(d.role ? { role: d.role } : {}),
        ...(d.osRole ? { osRole: d.osRole } : {}),
        // Un admin no pertenece a ningún negocio; un usuario de cliente sí.
        ...(rol === "ADMIN" ? { clientId: null } : d.clientId !== undefined ? { clientId: d.clientId } : {}),
        ...(d.password ? { passwordHash: await bcrypt.hash(d.password, 10) } : {}),
      },
      select: { id: true, username: true },
    });
    return NextResponse.json(actualizado);
  } catch (e) {
    return serverError(e);
  }
}

/** Borrar un usuario (nunca a uno mismo ni al último admin). */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const no = await guard();
  if (no) return no;
  const { id } = await params;
  try {
    const session = await auth();
    const u = await db.user.findUnique({ where: { id } });
    if (!u) return NextResponse.json({ error: "No existe" }, { status: 404 });
    if (session?.user?.username === u.username) {
      return NextResponse.json({ error: "No podés borrar tu propio usuario" }, { status: 400 });
    }
    if (u.role === "ADMIN" && (await db.user.count({ where: { role: "ADMIN" } })) <= 1) {
      return NextResponse.json({ error: "Tiene que quedar al menos un admin" }, { status: 400 });
    }
    await db.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return serverError(e);
  }
}
