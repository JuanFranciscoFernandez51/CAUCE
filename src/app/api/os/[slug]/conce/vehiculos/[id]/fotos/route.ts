import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardConceApi } from "../../../_guard";
import { storageAvailable, uploadToTenant } from "@/lib/storage";
import { fotosDeVehiculo } from "@/lib/conce";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB por foto

/**
 * Multi-upload de fotos del vehículo a Cloudinary (uploadToTenant, scope
 * ['vehiculos', id]). Acepta varias en un multipart ("files") y las agrega
 * al final del carrusel. Devuelve el array completo actualizado.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const g = await guardConceApi(slug);
  if (g.error) return g.error;

  if (!storageAvailable()) {
    return NextResponse.json(
      { error: "Storage sin configurar: falta la credencial de Cloudinary." },
      { status: 503 }
    );
  }

  const vehiculo = await db.conceVehiculo.findFirst({
    where: { id, clientId: g.tenant.id },
    select: { id: true, fotos: true },
  });
  if (!vehiculo) return NextResponse.json({ error: "No existe" }, { status: 404 });

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
  for (const file of files.slice(0, 12)) {
    const subida = await uploadToTenant({
      slug: g.tenant.slug,
      scope: ["vehiculos", vehiculo.id],
      buffer: Buffer.from(await file.arrayBuffer()),
      originalName: file.name,
    });
    nuevas.push(subida.url);
  }

  const fotos = [...fotosDeVehiculo(vehiculo.fotos), ...nuevas].slice(0, 40);
  await db.conceVehiculo.update({ where: { id: vehiculo.id }, data: { fotos } });

  return NextResponse.json({ ok: true, fotos });
}
