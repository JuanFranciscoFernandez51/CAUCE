import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardOsApi } from "../_guard";
import { storageAvailable, uploadToTenant } from "@/lib/storage";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const REF_TYPES = new Set(["ot", "venta", "contact"]);

/**
 * Adjuntos genéricos del OS: fotos del trabajo, comprobantes de venta,
 * documentos del cliente. Siempre scopeado por tenant + entidad (refType/refId).
 */

/** Sube un archivo y lo cuelga de la entidad. multipart: file, refType, refId. */
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = await guardOsApi(slug);
  if (g.error) return g.error;

  if (!storageAvailable()) {
    return NextResponse.json(
      { error: "Storage sin configurar: falta la credencial de Cloudinary." },
      { status: 503 }
    );
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const refType = String(form?.get("refType") ?? "");
  const refId = String(form?.get("refId") ?? "");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Subí un archivo válido" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "El archivo supera los 10 MB" }, { status: 400 });
  }
  if (!REF_TYPES.has(refType) || !refId) {
    return NextResponse.json({ error: "Referencia inválida" }, { status: 400 });
  }

  // La entidad tiene que existir y ser de ESTE tenant.
  const existe =
    refType === "ot"
      ? await db.ordenTrabajo.findFirst({ where: { id: refId, clientId: g.tenant.id }, select: { id: true } })
      : refType === "venta"
        ? await db.venta.findFirst({ where: { id: refId, clientId: g.tenant.id }, select: { id: true } })
        : await db.contact.findFirst({ where: { id: refId, clientId: g.tenant.id }, select: { id: true } });
  if (!existe) return NextResponse.json({ error: "No existe" }, { status: 404 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const up = await uploadToTenant({
    slug,
    scope: ["adjuntos", refType, refId],
    buffer,
    originalName: file.name,
  });

  const adj = await db.attachment.create({
    data: {
      clientId: g.tenant.id,
      refType,
      refId,
      url: up.url,
      publicId: up.publicId ?? null,
      name: file.name,
      mime: file.type || null,
      bytes: file.size,
    },
  });
  return NextResponse.json(
    { ok: true, adjunto: { id: adj.id, url: adj.url, name: adj.name, mime: adj.mime } },
    { status: 201 }
  );
}

/** Borra un adjunto propio del tenant. ?id= */
export async function DELETE(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = await guardOsApi(slug);
  if (g.error) return g.error;

  const id = new URL(req.url).searchParams.get("id") ?? "";
  const result = await db.attachment.deleteMany({ where: { id, clientId: g.tenant.id } });
  if (result.count === 0) return NextResponse.json({ error: "No existe" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
