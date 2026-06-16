import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardOsApi } from "../../_guard";
import { deleteFromTenant } from "@/lib/storage";

/**
 * Borra una entrada de la ficha (ContactRecord) junto con sus adjuntos.
 * Los Attachment se borran en cascada en la DB; además intentamos borrarlos de
 * Cloudinary por publicId. SIEMPRE scopeado por clientId.
 */

/** Cloudinary agrupa por resource_type; lo inferimos del mime guardado. */
function resourceTypeFromMime(mime: string | null): string {
  if (!mime) return "image";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return "raw"; // PDFs y documentos suben como raw con resource_type:auto
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const guard = await guardOsApi(slug, "crm");
  if (guard.error) return guard.error;

  // El record debe ser del tenant. Traemos los adjuntos para limpiar Cloudinary.
  const record = await db.contactRecord.findFirst({
    where: { id, clientId: guard.tenant.id },
    include: { attachments: { select: { publicId: true, mime: true } } },
  });
  if (!record) {
    return NextResponse.json({ error: "Entrada no encontrada" }, { status: 404 });
  }

  // Borrar archivos de Cloudinary (best-effort: un fallo no bloquea el borrado en DB).
  await Promise.all(
    record.attachments
      .filter((a) => a.publicId)
      .map((a) =>
        deleteFromTenant(a.publicId!, resourceTypeFromMime(a.mime)).catch(() => {})
      )
  );

  // Los Attachment caen por cascada (onDelete: Cascade en el schema).
  await db.contactRecord.deleteMany({ where: { id, clientId: guard.tenant.id } });

  return NextResponse.json({ ok: true });
}
