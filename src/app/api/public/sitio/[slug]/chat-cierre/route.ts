import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";

/**
 * Al cerrarse el chat, la web manda la charla completa. Antes iba por mail a
 * un tercero; ahora queda en el CRM del negocio, que es donde sirve.
 */
export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) return NextResponse.json({ ok: false }, { status: 404 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ ok: true });

  // El sitio manda su propio formato; se guarda lo que se pueda leer.
  const texto = Object.entries(body)
    .filter(([k]) => !/^_/.test(k))
    .map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
    .join("\n")
    .slice(0, 4000);

  const tel = String(body.telefono ?? body.phone ?? "").trim();
  const nombre = String(body.nombre ?? body.name ?? "Visitante del chat").trim() || "Visitante del chat";

  const existente = tel
    ? await db.contact.findFirst({ where: { clientId: tenant.id, phone: tel } })
    : null;

  const nota = `[chat cerrado ${new Date().toLocaleDateString("es-AR")}]\n${texto}`;
  if (existente) {
    await db.contact.update({
      where: { id: existente.id },
      data: {
        notes: existente.notes ? `${existente.notes}\n\n${nota}` : nota,
        lastTouchAt: new Date(),
      },
    });
  } else {
    await db.contact.create({
      data: {
        clientId: tenant.id,
        name: nombre,
        phone: tel,
        source: "chat de la web",
        stage: "nuevo",
        notes: nota,
        lastTouchAt: new Date(),
      },
    });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
