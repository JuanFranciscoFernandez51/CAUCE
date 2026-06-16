import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { guardOsApi } from "../_guard";
import { resolveOsRole, isOsOwner } from "@/app/os/[slug]/_components/os-role";

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9._-]+$/, "Solo letras, números, punto, guion y guion bajo"),
  password: z.string().min(8).max(100),
  osRole: z.enum(["dueno", "equipo"]).default("equipo"),
});

/** Lista de usuarios del tenant. Solo el dueño. */
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const g = await guardOsApi(slug);
  if (g.error) return g.error;
  const session = await auth();
  const role = session ? await resolveOsRole(session.user.id, g.tenant.id) : null;
  if (!isOsOwner(role)) return NextResponse.json({ error: "Solo el dueño" }, { status: 403 });

  const users = await db.user.findMany({
    where: { clientId: g.tenant.id },
    select: { id: true, name: true, username: true, osRole: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ users });
}

/** Alta de un usuario del equipo. Solo el dueño. */
export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const g = await guardOsApi(slug);
  if (g.error) return g.error;
  const session = await auth();
  const role = session ? await resolveOsRole(session.user.id, g.tenant.id) : null;
  if (!isOsOwner(role)) return NextResponse.json({ error: "Solo el dueño" }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message ?? "Datos inválidos" }, { status: 400 });
  }
  const { name, username, password, osRole } = parsed.data;

  if (await db.user.findUnique({ where: { username } })) {
    return NextResponse.json({ error: "Ese nombre de usuario ya existe" }, { status: 409 });
  }

  const user = await db.user.create({
    data: {
      name,
      username,
      role: "CLIENT",
      clientId: g.tenant.id,
      osRole,
      passwordHash: await bcrypt.hash(password, 10),
    },
    select: { id: true, name: true, username: true, osRole: true, createdAt: true },
  });
  return NextResponse.json({ user });
}
