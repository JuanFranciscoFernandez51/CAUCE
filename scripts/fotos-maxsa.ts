/** Baja las fotos del proveedor y las guarda en nuestro Cloudinary. */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import { readFileSync } from "fs";
import { db } from "../src/lib/db";
import { uploadToTenant } from "../src/lib/storage";

const SLUG = "fernandezrepuestos";

async function main() {
  const mapa: Record<string, string> = JSON.parse(readFileSync(process.argv[2], "utf8"));
  const t = await db.client.findUnique({ where: { slug: SLUG } });
  if (!t) throw new Error("falta el tenant");

  const prods = await db.bazarProducto.findMany({
    where: { clientId: t.id, sku: { not: null } },
    select: { id: true, sku: true, fotos: true },
  });
  const pendientes = prods.filter((p) => {
    const f = p.fotos as unknown;
    return (!Array.isArray(f) || f.length === 0) && p.sku && mapa[p.sku];
  });
  console.log(`📸 ${pendientes.length} repuestos sin foto (de ${prods.length})`);

  let ok = 0, fallos = 0;
  for (const [i, p] of pendientes.entries()) {
    const url = mapa[p.sku!];
    try {
      const r = await fetch(encodeURI(decodeURI(url)));
      if (!r.ok) throw new Error(String(r.status));
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length < 1200) throw new Error("muy chica");
      const up = await uploadToTenant({ slug: SLUG, scope: ["repuestos"], buffer: buf, originalName: `${p.sku}.jpg` });
      await db.bazarProducto.update({ where: { id: p.id }, data: { fotos: [up.url] } });
      ok++;
    } catch {
      fallos++;
    }
    if ((i + 1) % 100 === 0) console.log(`   ${i + 1}/${pendientes.length} · ok ${ok} · fallos ${fallos}`);
  }
  console.log(`\n✅ ${ok} fotos cargadas · ${fallos} fallaron`);
  process.exit(0);
}
main();
