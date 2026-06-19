import { NextResponse } from "next/server";
import { guardOsApi } from "../../_guard";
import { storageAvailable, uploadToTenant } from "@/lib/storage";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB por foto

/**
 * Sube una o varias fotos de una propiedad a la carpeta del tenant
 * (scope ["propiedades", <listingId|nueva>]) y devuelve las URLs.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const guard = await guardOsApi(slug, "sitio");
  if (guard.error) return guard.error;

  if (!storageAvailable()) {
    return NextResponse.json(
      { error: "Storage sin configurar: subí la credencial de Cloudinary para adjuntar fotos." },
      { status: 503 }
    );
  }

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Subí archivos válidos" }, { status: 400 });
  }
  // listingId opcional: si es una propiedad nueva todavía no existe → "nueva".
  const listingId = (form.get("listingId") as string | null)?.trim() || "nueva";
  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  // Compatibilidad con un solo "file".
  const single = form.get("file");
  if (single instanceof File && single.size > 0) files.push(single);

  if (files.length === 0) {
    return NextResponse.json({ error: "Subí al menos una foto" }, { status: 400 });
  }
  for (const f of files) {
    if (f.size > MAX_BYTES) {
      return NextResponse.json({ error: `“${f.name}” supera los 10 MB` }, { status: 400 });
    }
  }

  const safeScope = listingId.replace(/[^a-zA-Z0-9_-]/g, "") || "nueva";
  try {
    const urls: string[] = [];
    for (const f of files) {
      const buffer = Buffer.from(await f.arrayBuffer());
      const uploaded = await uploadToTenant({
        slug: guard.tenant.slug,
        scope: ["propiedades", safeScope],
        buffer,
        originalName: f.name || "foto",
      });
      urls.push(uploaded.url);
    }
    return NextResponse.json({ ok: true, urls }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "No se pudieron subir las fotos" }, { status: 500 });
  }
}
