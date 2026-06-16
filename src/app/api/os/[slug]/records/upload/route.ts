import { NextResponse } from "next/server";
import { guardOsApi } from "../../_guard";
import { db } from "@/lib/db";
import { storageAvailable, uploadToTenant } from "@/lib/storage";

/**
 * Sube UN adjunto (multipart/form-data: file + contactId) a la carpeta del tenant
 * en Cloudinary: cauce/<slug>/fichas/<contactId>/... y devuelve los datos para
 * que el form arme el Attachment al guardar la entrada.
 *
 * No crea Attachment todavía (la entrada se crea en POST /records con la lista de
 * adjuntos ya subidos). Si el storage no está configurado: 503 con mensaje claro.
 */

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB por archivo

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const guard = await guardOsApi(slug, "crm");
  if (guard.error) return guard.error;

  if (!storageAvailable()) {
    return NextResponse.json(
      { error: "Subí la credencial de Cloudinary para adjuntar archivos." },
      { status: 503 }
    );
  }

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Formulario inválido" }, { status: 400 });
  }

  const contactId = String(form.get("contactId") ?? "").trim();
  const file = form.get("file");
  if (!contactId) {
    return NextResponse.json({ error: "Falta contactId" }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "El archivo supera los 15 MB" },
      { status: 413 }
    );
  }

  // El contacto debe pertenecer al tenant antes de tocar el storage.
  const contact = await db.contact.findFirst({
    where: { id: contactId, clientId: guard.tenant.id },
    select: { id: true },
  });
  if (!contact) {
    return NextResponse.json({ error: "Contacto no encontrado" }, { status: 404 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const uploaded = await uploadToTenant({
      slug: guard.tenant.slug,
      scope: ["fichas", contact.id],
      buffer,
      originalName: file.name,
    });
    return NextResponse.json({
      ok: true,
      attachment: {
        url: uploaded.url,
        publicId: uploaded.publicId,
        name: file.name,
        mime: file.type || null,
        bytes: uploaded.bytes,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo subir el archivo. Probá de nuevo." },
      { status: 500 }
    );
  }
}
