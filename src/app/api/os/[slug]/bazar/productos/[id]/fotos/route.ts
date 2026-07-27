import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardBazarApi } from "../../../_guard";
import { storageAvailable, uploadToTenant } from "@/lib/storage";
import { fotosDe } from "@/lib/bazar";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB por foto

/**
 * Multi-upload de fotos del producto a Cloudinary (uploadToTenant, scope
 * ['productos', id]). Acepta varias en un multipart ("files") y las agrega
 * al final del carrusel. Devuelve el array completo actualizado.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const g = await guardBazarApi(slug);
  if (g.error) return g.error;

  if (!storageAvailable()) {
    return NextResponse.json(
      { error: "Storage sin configurar: falta la credencial de Cloudinary." },
      { status: 503 }
    );
  }

  const producto = await db.bazarProducto.findFirst({
    where: { id, clientId: g.tenant.id },
    select: { id: true, fotos: true },
  });
  if (!producto) return NextResponse.json({ error: "No existe" }, { status: 404 });

  const form = await req.formData().catch(() => null);
  const files = (form?.getAll("files") ?? []).filter(
    (f): f is File => f instanceof File && f.size > 0
  );
  if (files.length === 0) {
    return NextResponse.json({ error: "Subí al menos una foto" }, { status: 400 });
  }
  if (files.some((f) => f.size > MAX_BYTES)) {
    return NextResponse.json({ error: "Cada foto puede pesar hasta 10 MB" }, { status: 400 });
  }

  const nuevas: string[] = [];
  for (const file of files.slice(0, 8)) {
    const subida = await uploadToTenant({
      slug: g.tenant.slug,
      scope: ["productos", producto.id],
      buffer: Buffer.from(await file.arrayBuffer()),
      originalName: file.name,
    });
    nuevas.push(subida.url);
  }

  const fotos = [...fotosDe(producto.fotos), ...nuevas].slice(0, 12);
  await db.bazarProducto.update({ where: { id: producto.id }, data: { fotos } });

  return NextResponse.json({ ok: true, fotos });
}
