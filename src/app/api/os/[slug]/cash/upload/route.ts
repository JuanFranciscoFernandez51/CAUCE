import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { guardOsApi } from "../../_guard";
import { isOsOwner, resolveOsRole } from "@/app/os/[slug]/_components/os-role";
import { storageAvailable, uploadToTenant } from "@/lib/storage";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

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

/** Sube un comprobante a la carpeta del tenant y devuelve la URL. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const guard = await guardOwner(slug);
  if (guard.error) return guard.error;

  if (!storageAvailable()) {
    return NextResponse.json(
      { error: "Storage sin configurar: subí la credencial de Cloudinary para adjuntar comprobantes." },
      { status: 503 }
    );
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Subí un archivo válido" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "El archivo supera los 10 MB" }, { status: 400 });
  }

  // scope ["comprobantes", <token>] aísla por tenant; token único por subida.
  const token = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const uploaded = await uploadToTenant({
      slug: guard.tenant.slug,
      scope: ["comprobantes", token],
      buffer,
      originalName: file.name || "comprobante",
    });
    return NextResponse.json({ ok: true, url: uploaded.url }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "No se pudo subir el comprobante" }, { status: 500 });
  }
}
