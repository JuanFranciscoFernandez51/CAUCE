/** Pasa las fotos del proveedor a nuestro Cloudinary (para no hotlinkear). */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import { db } from "../src/lib/db";
import { uploadToTenant } from "../src/lib/storage";

async function main() {
  const t = await db.client.findUnique({ where: { slug: "fernandezrepuestos" } });
  if (!t) throw new Error("falta el tenant");
  const todos = await db.bazarProducto.findMany({
    where: { clientId: t.id },
    select: { id: true, sku: true, fotos: true },
  });
  const pend = todos.filter((p) => {
    const f = p.fotos as unknown;
    return Array.isArray(f) && typeof f[0] === "string" && (f[0] as string).includes("changomax");
  });
  console.log(`📸 ${pend.length} fotos por migrar`);
  let ok = 0, fallos = 0;
  for (const [i, p] of pend.entries()) {
    const url = (p.fotos as string[])[0];
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(String(r.status));
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length < 900) throw new Error("chica");
      const up = await uploadToTenant({ slug: "fernandezrepuestos", scope: ["repuestos"], buffer: buf, originalName: `${p.sku ?? p.id}.jpg` });
      await db.bazarProducto.update({ where: { id: p.id }, data: { fotos: [up.url] } });
      ok++;
    } catch { fallos++; }
    if ((i + 1) % 200 === 0) console.log(`   ${i + 1}/${pend.length} · ok ${ok} · fallos ${fallos}`);
  }
  console.log(`\n✅ ${ok} migradas · ${fallos} fallaron`);
  process.exit(0);
}
main();
