/**
 * Importa el catálogo de Maxsa (changomax.mercomaxsa.com.ar, PrestaShop) al
 * shop de Fernández Repuestos.
 *
 * La clave: el proveedor ya organiza su catálogo POR MOTO. Recorriendo esas
 * categorías, cada repuesto queda etiquetado con las motos que le entran —
 * que es exactamente lo que necesita nuestro buscador por compatibilidad.
 *
 *   npx tsx --env-file=.env scripts/import-maxsa.ts --motos=2 --dry
 *   npx tsx --env-file=.env scripts/import-maxsa.ts            (todo)
 */
// El sitio del proveedor no manda el certificado intermedio y Node rechaza la
// conexión. Es un catálogo público y de solo lectura: aflojamos la verificación
// únicamente dentro de este proceso de importación.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const BASE = "https://changomax.mercomaxsa.com.ar/prestashop";
const MARGEN = 4; // precio de venta = costo × 4 (300%)
const PAUSA = 400; // ms entre pedidos, para no golpear el sitio

const args = process.argv.slice(2);
const LIMITE_MOTOS = Number(args.find((a) => a.startsWith("--motos="))?.split("=")[1] ?? 0);
const DRY = args.includes("--dry");

/** Las categorías por moto del proveedor. El menú se arma por JS, así que
 *  la lista va acá: no cambia seguido y se revisa a ojo. */
const MOTOS_MAXSA: [string, string][] = [
  ["BAJAJ ROUSER 135", "38-bajaj-rouser-135"],
  ["BAJAJ ROUSER 200 NS", "39-bajaj-rouser-200-ns"],
  ["BAJAJ ROUSER 220", "37-bajaj-rouser-220"],
  ["CORVEN ENERGY 110", "350-corven-energy-110"],
  ["GILERA FU 110", "352-gilera-fu-110"],
  ["GILERA SMASH 110", "33-gilera-smash-110"],
  ["GILERA SMASH 125", "353-gilera-smash-125"],
  ["GUERRERO MAGIC G70 - G90 - G100", "381-guerrero-magic-g70---g90---g100"],
  ["GUERRERO TRIP 110", "382-guerrero-trip-110"],
  ["HONDA BIZ 100 - 105", "28-honda-biz-100---105"],
  ["HONDA BIZ 125", "354-honda-biz-125"],
  ["HONDA C90 ECONO", "355-honda-c90-econo"],
  ["HONDA CB1 125", "357-honda-cb1-125"],
  ["HONDA CB250 NIGHTHAWK", "358-honda-cb250-nighthawk"],
  ["HONDA CBX 150 - 200", "359-honda-cbx-150---200"],
  ["HONDA CBX 250 TWISTER", "360-honda-cbx-250-twister"],
  ["HONDA CD100", "356-honda-cd100"],
  ["HONDA CG 125 TITAN-TODAY", "30-honda-cg-125-titan-today"],
  ["HONDA CG 150 TITAN", "36-honda-cg-150-titan"],
  ["HONDA CG 150 TITAN NEW", "31-honda-cg-150-titan-new"],
  ["HONDA DAX", "361-honda-dax"],
  ["HONDA ELITE 50 - 80 - 125 - 150", "384-honda-elite-50---80---125---150"],
  ["HONDA GLH150 GAUCHA", "403-honda-glh150-gaucha"],
  ["HONDA MB 100", "362-honda-mb-100"],
  ["HONDA NX 150", "379-honda-nx-150"],
  ["HONDA NXR 125 BROSS", "378-honda-nxr-125-bross"],
  ["HONDA STORM", "29-honda-storm"],
  ["HONDA WAVE", "32-honda-wave"],
  ["HONDA WAVE 110 S", "307-honda-wave-110-s"],
  ["HONDA XL125", "383-honda-xl125"],
  ["HONDA XLR125", "392-honda-xlr125"],
  ["HONDA XR125L", "277-honda-xr125l"],
  ["HONDA XR150L", "393-honda-xr150l"],
  ["HONDA XR200 - XR250", "394-honda-xr200---xr250"],
  ["HONDA XR250 TORNADO", "395-honda-xr250-tornado"],
  ["KAWASAKI NEO MAX", "276-kawasaki-neo-max"],
  ["KELLER 110", "451-KELLER110"],
  ["MONDIAL 110", "450-MONDIAL110"],
  ["MOTOMEL BLITZ 110", "296-motomel-blitz-110"],
  ["MOTOMEL C110", "385-motomel-c110"],
  ["MOTOMEL CUSTOM 125 - 150 - 200", "387-motomel-custom-125---150---200"],
  ["MOTOMEL MAX 110", "386-motomel-max-110"],
  ["MOTOMEL S2 150", "443-MOTOMELS2150"],
  ["MOTOMEL SKUA 150", "388-motomel-skua-150"],
  ["MOTOMEL SKUA 150 NEW", "389-motomel-skua-150-new"],
  ["MOTOMEL SKUA 150 V6", "231-motomel-skua-150-v6"],
  ["MOTOMEL SKUA 200", "391-motomel-skua-200"],
  ["MOTOMEL SKUA 250", "390-motomel-skua-250"],
  ["SUZUKI AX 100", "282-suzuki-ax-100"],
  ["SUZUKI DR 125 - 250 - 350 - 650", "364-suzuki-dr-125---250---350---650"],
  ["SUZUKI GN 125", "363-suzuki-gn-125"],
  ["UNIVERSAL", "396-universal"],
  ["YAMAHA CRYPTON 110 NEW", "444-YAMAHACRYPTON110NEW"],
  ["YAMAHA CRYPTON T105", "380-YAMAHACRYPTONT105"],
  ["YAMAHA FZ16", "368-yamaha-fz16"],
  ["YAMAHA V80", "367-yamaha-v80"],
  ["YAMAHA XTZ125", "366-yamaha-xtz125"],
  ["YAMAHA YBR125", "34-yamaha-ybr125"],
  ["ZANELLA RX 150 - MONDIAL 150", "35-zanella-rx-150---mondial-150"],
];

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function bajar(url: string, intento = 1): Promise<string> {
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Macintosh) CauceBot/1.0" } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.text();
  } catch (e) {
    if (intento >= 3) throw e;
    await dormir(1200 * intento);
    return bajar(url, intento + 1);
  }
}

export function categoriasDeMoto(): { nombre: string; url: string }[] {
  return MOTOS_MAXSA.map(([nombre, slug]) => ({ nombre, url: `${BASE}/${slug}` }));
}

export type ProdMaxsa = { sku: string; nombre: string; costo: number; foto: string | null; url: string };

/** Productos de una página de listado de PrestaShop. */
function parsearListado(html: string): ProdMaxsa[] {
  const out: ProdMaxsa[] = [];
  const bloques = html.split(/<article[^>]+class="[^"]*product-miniature/i).slice(1);
  for (const b of bloques) {
    const nombre = b.match(/class="[^"]*product-title[^"]*"[^>]*>\s*(?:<a[^>]*>)?\s*([^<]+)/i)?.[1]?.replace(/\s+/g, " ").trim();
    const precioTxt = b.match(/ARS\s*([\d.]+,\d{2})/)?.[1] ?? b.match(/content="([\d.]+)"[^>]*itemprop="price"/i)?.[1];
    const foto = b.match(/<img[^>]+src="([^"]+\.(?:jpg|jpeg|png|webp))"/i)?.[1] ?? null;
    const url = b.match(/<a[^>]+href="([^"]+\.html)"/i)?.[1] ?? "";
    // el código del proveedor aparece como primer texto del bloque
    const sku = b.replace(/<[^>]+>/g, "\n").split("\n").map((s) => s.trim()).find((s) => /^[A-Z]{1,4}\d{2,6}$/.test(s));
    if (!nombre || !sku) continue;
    const costo = precioTxt ? Math.round(Number(precioTxt.replace(/\./g, "").replace(",", "."))) : 0;
    out.push({ sku, nombre, costo, foto, url });
  }
  return out;
}

/** Todas las páginas de una categoría. */
export async function productosDeCategoria(url: string): Promise<ProdMaxsa[]> {
  const todos: ProdMaxsa[] = [];
  for (let pag = 1; pag <= 40; pag++) {
    const html = await bajar(pag === 1 ? url : `${url}?page=${pag}`);
    const lote = parsearListado(html);
    todos.push(...lote);
    const hayMas = new RegExp(`[?&]page=${pag + 1}"`).test(html);
    if (!lote.length || !hayMas) break;
    await dormir(PAUSA);
  }
  return todos;
}

async function main() {
  const motos = categoriasDeMoto();
  console.log(`🏍  ${motos.length} categorías por moto`);
  const usar = LIMITE_MOTOS ? motos.slice(0, LIMITE_MOTOS) : motos;

  // sku → producto + las motos en las que aparece
  const catalogo = new Map<string, ProdMaxsa & { motos: string[] }>();
  for (const [i, moto] of usar.entries()) {
    const prods = await productosDeCategoria(moto.url);
    for (const p of prods) {
      const yaEsta = catalogo.get(p.sku);
      if (yaEsta) yaEsta.motos.push(moto.nombre);
      else catalogo.set(p.sku, { ...p, motos: [moto.nombre] });
    }
    console.log(`  ${String(i + 1).padStart(2)}/${usar.length} ${moto.nombre.padEnd(34)} ${prods.length} repuestos · acumulado ${catalogo.size}`);
    await dormir(PAUSA);
  }

  const lista = [...catalogo.values()];
  console.log(`\n📦 ${lista.length} repuestos únicos`);
  const conFoto = lista.filter((p) => p.foto).length;
  const conPrecio = lista.filter((p) => p.costo > 0).length;
  console.log(`   con foto: ${conFoto} · con precio: ${conPrecio}`);
  console.log("\nMuestra:");
  for (const p of lista.slice(0, 5)) {
    console.log(`  ${p.sku} · ${p.nombre.slice(0, 52)}`);
    console.log(`     costo ${p.costo} → venta ${p.costo * MARGEN} · motos: ${p.motos.slice(0, 3).join(", ")}${p.motos.length > 3 ? ` +${p.motos.length - 3}` : ""}`);
  }
  if (DRY) { console.log("\n(prueba: no se cargó nada)"); process.exit(0); }
  process.exit(0);
}
main();
