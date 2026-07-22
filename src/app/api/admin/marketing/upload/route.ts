import { NextResponse } from "next/server";
import { guard, serverError } from "../../_utils";
import { storageAvailable, uploadToTenant } from "@/lib/storage";

export const maxDuration = 120;

/** Sube fotos/videos del marketing de Cauce a Cloudinary (carpeta cauce/sistema/marketing). */
export async function POST(req: Request) {
  const g = await guard();
  if (g) return g;
  if (!storageAvailable()) {
    return NextResponse.json({ error: "Cloudinary sin configurar" }, { status: 503 });
  }
  try {
    const form = await req.formData();
    const files = form.getAll("files").filter((f): f is File => f instanceof File);
    if (files.length === 0) {
      return NextResponse.json({ error: "No llegó ningún archivo" }, { status: 400 });
    }
    const subidos = [];
    for (const f of files.slice(0, 10)) {
      const buffer = Buffer.from(await f.arrayBuffer());
      subidos.push(
        await uploadToTenant({
          slug: "sistema",
          scope: ["marketing"],
          buffer,
          originalName: f.name,
        })
      );
    }
    return NextResponse.json({ files: subidos });
  } catch (e) {
    return serverError(e);
  }
}
