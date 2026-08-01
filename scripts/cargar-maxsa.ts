/**
 * Carga en Fernández Repuestos el catálogo bajado de Maxsa.
 *
 * El JSON lo genera el recorrido hecho desde el navegador (ahí vive la sesión
 * del proveedor). Acá se calcula el precio de venta, se infiere el rubro, se
 * suben las fotos a Cloudinary y se crea/actualiza cada repuesto.
 *
 *   npx tsx --env-file=.env scripts/cargar-maxsa.ts <archivo.json> [--sin-fotos] [--limite=50]
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // el proveedor no manda el certificado intermedio

import { readFileSync } from "fs";
import { db } from "../src/lib/db";
import { uploadToTenant } from "../src/lib/storage";

const SLUG = "fernandezrepuestos";
const MARGEN = 4; // precio de venta = costo × 4 (300%)
const BASE = "https://changomax.mercomaxsa.com.ar";

type Crudo = { sku: string; nombre: string; costo: number; foto: string | null; url: string; desc?: string; motos: string[] };

/** El rubro sale del nombre del repuesto: el listado por moto no lo trae. */
const RUBROS: [RegExp, string][] = [
  [/cadena|pi[ñn][oó]n|corona|kit de arrastre|transmisi/i, "Transmisión"],
  [/pastilla|zapata|disco de freno|freno|bomba de freno|caliper/i, "Frenos"],
  [/amortiguad|barral|horquilla|suspensi|reten/i, "Suspensión"],
  [/bater|bujia|buj[íi]a|cdi|regulador|bobina|far[oó]l|farol|foco|l[aá]mpara|gui[ñn]|stop|arranque|burrito|estator|magneto|cable de bujia|sirena|bocina|llave de luz|interruptor/i, "Eléctrico y batería"],
  [/cubierta|neum[aá]tico|c[aá]mara|llanta|rueda|rayo/i, "Neumáticos y cámaras"],
  [/aceite|grasa|lubricante|liquido|l[íi]quido|aditivo|limpiador|silicona/i, "Lubricantes y químicos"],
  [/cable de|cable /i, "Cables"],
  [/carburador|chicler|canilla|filtro de nafta|nafta|surtidor|aguja/i, "Carburación"],
  [/escape|silenciador|ca[ñn]o de escape/i, "Escape"],
  [/casco|guante|campera|mochila|ba[uú]l|candado|espejo|pu[ñn]o|alarma|traba/i, "Accesorios y casco"],
  [/pl[aá]stico|cacha|guardabarro|cubre|calco|tapa lateral|paragolpe|asiento|tanque/i, "Estética y plásticos"],
  [/pist[oó]n|aro|junta|cilindro|culata|v[aá]lvula|cig[üu]e[ñn]al|embrague|clutch|arbol de leva|distribuci|filtro de aire|filtro de aceite|carter|biela|rodamiento|reten de motor/i, "Motor"],
];
const rubroDe = (nombre: string) => RUBROS.find(([re]) => re.test(nombre))?.[1] ?? "Repuestos generales";

/** "HONDA CG 150 TITAN" → "Honda CG 150 Titan" (como lo escribe la gente). */
function lindo(s: string): string {
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => (/^\d|^[a-z]?\d/.test(w) || w.length <= 3 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ")
    .replace(/\bDe\b/g, "de");
}

const slugDe = (t: string) =>
  t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 58);

async function main() {
  const archivo = process.argv[2];
  const sinFotos = process.argv.includes("--sin-fotos");
  const limite = Number(process.argv.find((a) => a.startsWith("--limite="))?.split("=")[1] ?? 0);
  if (!archivo) throw new Error("falta el archivo JSON");

  const crudos: Crudo[] = JSON.parse(readFileSync(archivo, "utf8"));
  const t = await db.client.findUnique({ where: { slug: SLUG } });
  if (!t) throw new Error("falta el tenant");

  const lista = limite ? crudos.slice(0, limite) : crudos;
  console.log(`📦 ${lista.length} repuestos a cargar`);

  const usados = new Set(
    (await db.bazarProducto.findMany({ where: { clientId: t.id }, select: { slug: true } })).map((p) => p.slug)
  );

  let creados = 0, actualizados = 0, conFoto = 0, sinPrecio = 0;
  for (const [i, p] of lista.entries()) {
    if (!p.costo) sinPrecio++;
    const precio = Math.max(Math.round((p.costo * MARGEN) / 100) * 100, 100); // redondeado a $100
    const motos = p.motos.map(lindo);
    const categoria = rubroDe(p.nombre);
    const nombre = lindo(p.nombre).replace(/\s+/g, " ").trim();

    let slug = slugDe(`${p.nombre}-${p.sku}`);
    if (usados.has(slug)) slug = `${slug}-${i}`;
    usados.add(slug);

    // La foto es pública en el sitio del proveedor: se baja y se guarda en nuestro Cloudinary.
    let fotos: string[] = [];
    if (!sinFotos && p.foto) {
      try {
        const url = p.foto.startsWith("http") ? p.foto : BASE + p.foto;
        const r = await fetch(encodeURI(decodeURI(url)));
        if (r.ok) {
          const buf = Buffer.from(await r.arrayBuffer());
          if (buf.length > 1500) {
            const up = await uploadToTenant({ slug: SLUG, scope: ["repuestos"], buffer: buf, originalName: `${p.sku}.jpg` });
            fotos = [up.url];
            conFoto++;
          }
        }
      } catch { /* si falla la foto, el repuesto se carga igual */ }
    }

    const datos = {
      nombre,
      categoria,
      precio,
      costo: p.costo || null,
      stock: 0, // el catálogo del proveedor es "a pedido" hasta que Luis marque lo que tiene
      minStock: 0,
      sku: p.sku,
      compatibilidades: motos,
      activo: true,
      descripcion: `${nombre}. Código ${p.sku}. Compatible con: ${motos.join(", ")}.${p.desc ? ` ${p.desc}` : ""}`,
      ...(fotos.length ? { fotos } : {}),
    };

    const existe = await db.bazarProducto.findFirst({ where: { clientId: t.id, sku: p.sku } });
    if (existe) {
      await db.bazarProducto.update({ where: { id: existe.id }, data: datos });
      actualizados++;
    } else {
      await db.bazarProducto.create({ data: { clientId: t.id, slug, ...datos } });
      creados++;
    }
    if ((i + 1) % 100 === 0) console.log(`   ${i + 1}/${lista.length} · nuevos ${creados} · actualizados ${actualizados} · con foto ${conFoto}`);
  }

  const total = await db.bazarProducto.count({ where: { clientId: t.id } });
  console.log(`\n✅ ${creados} nuevos · ${actualizados} actualizados · ${conFoto} con foto · ${sinPrecio} sin precio`);
  console.log(`   catálogo total: ${total} repuestos`);
  process.exit(0);
}
main();
