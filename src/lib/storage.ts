import { v2 as cloudinary } from "cloudinary";

/**
 * Storage multi-tenant sobre UNA sola cuenta de Cloudinary de Cauce.
 * Aislamiento por carpeta + tag por tenant: cauce/<slug>/<scope>/...
 * El control de acceso real lo pone la app (scoping por clientId); Cloudinary
 * solo guarda los bits. Lazy-init: el build nunca falla por falta de credencial.
 */

let configured = false;

function ensure(): boolean {
  if (configured) return true;
  // Soporta CLOUDINARY_URL (cloudinary://key:secret@cloud) o las 3 sueltas.
  const url = process.env.CLOUDINARY_URL;
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (url) {
    configured = true; // el SDK lee CLOUDINARY_URL del env solo
    return true;
  }
  if (cloud && key && secret) {
    cloudinary.config({ cloud_name: cloud, api_key: key, api_secret: secret });
    configured = true;
    return true;
  }
  return false;
}

export function storageAvailable(): boolean {
  return ensure();
}

/** Carpeta canónica de un tenant. Ej: cauce/clinicadentaliriarte/pacientes/<id> */
export function tenantFolder(slug: string, ...scope: string[]): string {
  const safe = scope.map((s) => s.replace(/[^a-zA-Z0-9_-]/g, "")).filter(Boolean);
  return ["cauce", slug, ...safe].join("/");
}

export type UploadedFile = {
  url: string;
  publicId: string;
  resourceType: string;
  format: string | null;
  bytes: number;
  originalName: string;
};

/**
 * Sube un archivo (Buffer) a la carpeta del tenant. Usa upload_stream para
 * soportar archivos grandes (PDFs, fotos de alta resolución).
 */
export async function uploadToTenant(opts: {
  slug: string;
  scope: string[];
  buffer: Buffer;
  originalName: string;
}): Promise<UploadedFile> {
  if (!ensure()) {
    throw new Error(
      "Storage sin configurar: falta CLOUDINARY_URL (o CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET)."
    );
  }
  const folder = tenantFolder(opts.slug, ...opts.scope);
  return new Promise<UploadedFile>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, tags: [opts.slug], resource_type: "auto" },
      (err, res) => {
        if (err || !res) return reject(err ?? new Error("Upload falló"));
        resolve({
          url: res.secure_url,
          publicId: res.public_id,
          resourceType: res.resource_type,
          format: res.format ?? null,
          bytes: res.bytes,
          originalName: opts.originalName,
        });
      }
    );
    stream.end(opts.buffer);
  });
}

/** Borra un archivo del tenant por su publicId (verificá ownership antes de llamar). */
export async function deleteFromTenant(publicId: string, resourceType = "image"): Promise<void> {
  if (!ensure()) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}
