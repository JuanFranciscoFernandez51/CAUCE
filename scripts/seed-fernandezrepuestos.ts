/**
 * Fernández Repuestos — shop de repuestos de moto (Luis Fernández, Bahía Blanca).
 * Negocio aparte de Motos Fernández concesionaria. Foco: venta online y despachos.
 * Crea el tenant, el usuario y un catálogo del rubro con compatibilidades reales.
 */
import { db } from "../src/lib/db";
import bcrypt from "bcryptjs";

const SLUG = "fernandezrepuestos";

// Grupos de motos que comparten repuesto — así se cargan las compatibilidades.
const C110 = ["Honda Wave 110 S", "Motomel Blitz 110", "Corven Energy 110", "Gilera Smash 110", "Guerrero Trip 110", "Keller KN 110", "Zanella ZB 110", "Mondial LD 110", "Yamaha Crypton 110"];
const C125 = ["Honda Biz 125", "Honda CB 125F Twister", "Honda Storm 125", "Yamaha YBR 125", "Motomel Blitz 125", "Corven Energy 125", "Gilera Smash 125", "Suzuki EN 125"];
const C150 = ["Honda CG Titan 150", "Honda XR 150 L", "Zanella RX 150", "Zanella Styler 150", "Motomel CG 150 S2", "Motomel Skua 150", "Corven Triax 150", "Corven Hunter 150", "Gilera VC 150", "Gilera Sahel 150", "Guerrero GR5 150", "Keller Stratus 150", "Yamaha FZ 150", "Bajaj Boxer 150", "Mondial RD 150"];
const TITAN = ["Honda CG Titan 150", "Motomel CG 150 S2", "Keller Stratus 150", "Guerrero GR5 150"];
const TODAS = [...C110, ...C125, ...C150];

type P = { sku: string; name: string; cat: string; marca: string; precio: number; costo: number; stock: number; compat: string[]; ubi: string; destacado?: boolean };

const PRODUCTOS: P[] = [
  // ── Transmisión ──
  { sku: "TR-KIT110", name: "Kit de arrastre completo 110cc (cadena + piñón + corona)", cat: "Transmisión", marca: "Maxsa", precio: 48000, costo: 29000, stock: 14, compat: C110, ubi: "E1-A2", destacado: true },
  { sku: "TR-KIT150", name: "Kit de arrastre completo 150cc (cadena + piñón + corona)", cat: "Transmisión", marca: "Maxsa", precio: 62000, costo: 38000, stock: 11, compat: C150, ubi: "E1-A3", destacado: true },
  { sku: "TR-CAD428", name: "Cadena de transmisión 428H x 118 eslabones", cat: "Transmisión", marca: "Choho", precio: 27500, costo: 16000, stock: 22, compat: [...C110, ...C125], ubi: "E1-A1" },
  { sku: "TR-CAD428L", name: "Cadena de transmisión 428H x 122 eslabones reforzada", cat: "Transmisión", marca: "Choho", precio: 31000, costo: 18500, stock: 16, compat: C150, ubi: "E1-A1" },
  { sku: "TR-PIN14", name: "Piñón de ataque 14 dientes", cat: "Transmisión", marca: "Maxsa", precio: 9800, costo: 5200, stock: 30, compat: [...C110, ...C125], ubi: "E1-B1" },
  { sku: "TR-COR43", name: "Corona 43 dientes", cat: "Transmisión", marca: "Maxsa", precio: 21000, costo: 12000, stock: 18, compat: C110, ubi: "E1-B2" },
  { sku: "TR-LUBCAD", name: "Lubricante de cadena en aerosol 400ml", cat: "Transmisión", marca: "Bardahl", precio: 11500, costo: 6300, stock: 40, compat: TODAS, ubi: "E4-C1" },
  // ── Frenos ──
  { sku: "FR-PASTD", name: "Pastillas de freno delanteras", cat: "Frenos", marca: "Frasle", precio: 14500, costo: 8200, stock: 26, compat: [...C125, ...C150], ubi: "E2-A1", destacado: true },
  { sku: "FR-ZAPT", name: "Zapatas de freno traseras (juego)", cat: "Frenos", marca: "Frasle", precio: 12800, costo: 7000, stock: 31, compat: TODAS, ubi: "E2-A2" },
  { sku: "FR-DISCO", name: "Disco de freno delantero 240mm", cat: "Frenos", marca: "Maxsa", precio: 46000, costo: 28000, stock: 7, compat: C150, ubi: "E2-B1" },
  { sku: "FR-LIQD3", name: "Líquido de frenos DOT 3 x 500ml", cat: "Frenos", marca: "Wagner", precio: 9200, costo: 4900, stock: 24, compat: TODAS, ubi: "E4-C2" },
  { sku: "FR-BOMB", name: "Bomba de freno delantera con manija", cat: "Frenos", marca: "Maxsa", precio: 38500, costo: 23000, stock: 6, compat: C150, ubi: "E2-B3" },
  // ── Motor ──
  { sku: "MO-FILAC", name: "Filtro de aceite", cat: "Motor", marca: "Maxsa", precio: 6800, costo: 3400, stock: 45, compat: [...C125, ...C150], ubi: "E3-A1" },
  { sku: "MO-FILAIR110", name: "Filtro de aire 110cc", cat: "Motor", marca: "Maxsa", precio: 8900, costo: 4600, stock: 28, compat: C110, ubi: "E3-A2" },
  { sku: "MO-FILAIR150", name: "Filtro de aire 150cc", cat: "Motor", marca: "Maxsa", precio: 10500, costo: 5500, stock: 25, compat: C150, ubi: "E3-A2" },
  { sku: "MO-JUNTAS", name: "Juego de juntas de motor completo", cat: "Motor", marca: "Maxsa", precio: 24500, costo: 14000, stock: 9, compat: TITAN, ubi: "E3-B1" },
  { sku: "MO-PISTON", name: "Kit pistón + aros + perno estándar", cat: "Motor", marca: "Maxsa", precio: 42000, costo: 26000, stock: 8, compat: TITAN, ubi: "E3-B2" },
  { sku: "MO-CADDIS", name: "Cadena de distribución", cat: "Motor", marca: "Choho", precio: 18500, costo: 10500, stock: 13, compat: [...C125, ...C150], ubi: "E3-B3" },
  { sku: "MO-TENSOR", name: "Tensor de cadena de distribución", cat: "Motor", marca: "Maxsa", precio: 15900, costo: 9000, stock: 10, compat: C150, ubi: "E3-B3" },
  { sku: "MO-EMBRAG", name: "Kit de discos de embrague", cat: "Motor", marca: "Maxsa", precio: 29500, costo: 17500, stock: 7, compat: C150, ubi: "E3-C1" },
  // ── Eléctrico y batería ──
  { sku: "EL-BAT12", name: "Batería 12V 12Ah libre de mantenimiento", cat: "Eléctrico y batería", marca: "Moura", precio: 58000, costo: 37000, stock: 12, compat: C150, ubi: "E5-A1", destacado: true },
  { sku: "EL-BAT5", name: "Batería 12V 5Ah gel", cat: "Eléctrico y batería", marca: "Moura", precio: 44000, costo: 27000, stock: 15, compat: [...C110, ...C125], ubi: "E5-A1", destacado: true },
  { sku: "EL-ACIDO", name: "Ácido para batería 1L", cat: "Eléctrico y batería", marca: "Genérico", precio: 4800, costo: 2200, stock: 35, compat: TODAS, ubi: "E5-A2" },
  { sku: "EL-BUJIA", name: "Bujía NGK C7HSA", cat: "Eléctrico y batería", marca: "NGK", precio: 7200, costo: 3800, stock: 60, compat: TODAS, ubi: "E5-B1" },
  { sku: "EL-CDI", name: "CDI encendido electrónico", cat: "Eléctrico y batería", marca: "Maxsa", precio: 34000, costo: 20000, stock: 8, compat: C150, ubi: "E5-B2" },
  { sku: "EL-REGUL", name: "Regulador de voltaje", cat: "Eléctrico y batería", marca: "Maxsa", precio: 26500, costo: 15500, stock: 11, compat: [...C125, ...C150], ubi: "E5-B2" },
  { sku: "EL-BOBINA", name: "Bobina de alta con cable", cat: "Eléctrico y batería", marca: "Maxsa", precio: 19800, costo: 11000, stock: 14, compat: TODAS, ubi: "E5-B3" },
  { sku: "EL-FAROLED", name: "Faro delantero LED universal", cat: "Eléctrico y batería", marca: "Genérico", precio: 32000, costo: 18000, stock: 9, compat: TODAS, ubi: "E5-C1" },
  { sku: "EL-LAMP", name: "Lámpara halógena 12V 35/35W", cat: "Eléctrico y batería", marca: "Osram", precio: 5400, costo: 2600, stock: 50, compat: TODAS, ubi: "E5-C2" },
  { sku: "EL-BURRO", name: "Motor de arranque (burrito)", cat: "Eléctrico y batería", marca: "Maxsa", precio: 68000, costo: 43000, stock: 5, compat: C150, ubi: "E5-C3" },
  // ── Suspensión ──
  { sku: "SU-AMORT", name: "Amortiguadores traseros (par) 340mm", cat: "Suspensión", marca: "Maxsa", precio: 54000, costo: 33000, stock: 8, compat: C150, ubi: "E6-A1" },
  { sku: "SU-BARRAL", name: "Barral de horquilla delantera (unidad)", cat: "Suspensión", marca: "Maxsa", precio: 39500, costo: 24000, stock: 6, compat: C150, ubi: "E6-A2" },
  { sku: "SU-RETEN", name: "Retenes de barral (juego)", cat: "Suspensión", marca: "Maxsa", precio: 12500, costo: 6800, stock: 20, compat: TODAS, ubi: "E6-B1" },
  { sku: "SU-ACEITE", name: "Aceite de suspensión SAE 10 x 1L", cat: "Suspensión", marca: "Bardahl", precio: 13800, costo: 7500, stock: 16, compat: TODAS, ubi: "E4-C3" },
  // ── Neumáticos ──
  { sku: "NE-9090", name: "Cubierta 90/90-18 trasera", cat: "Neumáticos y cámaras", marca: "Pirelli", precio: 78000, costo: 50000, stock: 10, compat: C150, ubi: "DEP-1", destacado: true },
  { sku: "NE-27518", name: "Cubierta 2.75-18 delantera", cat: "Neumáticos y cámaras", marca: "Pirelli", precio: 68000, costo: 43000, stock: 12, compat: [...C125, ...C150], ubi: "DEP-1" },
  { sku: "NE-8010014", name: "Cubierta 80/100-14 (Wave/Biz)", cat: "Neumáticos y cámaras", marca: "Kenda", precio: 52000, costo: 32000, stock: 14, compat: C110, ubi: "DEP-1" },
  { sku: "NE-CAM18", name: "Cámara 18 pulgadas", cat: "Neumáticos y cámaras", marca: "Genérico", precio: 12500, costo: 6200, stock: 30, compat: [...C125, ...C150], ubi: "DEP-2" },
  { sku: "NE-CAM14", name: "Cámara 14 pulgadas", cat: "Neumáticos y cámaras", marca: "Genérico", precio: 10800, costo: 5300, stock: 26, compat: C110, ubi: "DEP-2" },
  // ── Lubricantes ──
  { sku: "LU-4T2050", name: "Aceite 4T 20W-50 mineral x 1L", cat: "Lubricantes y químicos", marca: "YPF", precio: 14200, costo: 8100, stock: 55, compat: TODAS, ubi: "E4-A1", destacado: true },
  { sku: "LU-4T1040", name: "Aceite 4T 10W-40 semisintético x 1L", cat: "Lubricantes y químicos", marca: "Motul", precio: 21500, costo: 13000, stock: 38, compat: TODAS, ubi: "E4-A1" },
  { sku: "LU-2T", name: "Aceite 2T para mezcla x 500ml", cat: "Lubricantes y químicos", marca: "YPF", precio: 9500, costo: 5000, stock: 24, compat: ["Suzuki AX 100", "Zanella ZB 110"], ubi: "E4-A2" },
  { sku: "LU-GRASA", name: "Grasa para rodamientos x 250g", cat: "Lubricantes y químicos", marca: "Bardahl", precio: 7800, costo: 4000, stock: 22, compat: TODAS, ubi: "E4-A3" },
  { sku: "LU-LIMPIA", name: "Limpiador de carburador en aerosol", cat: "Lubricantes y químicos", marca: "Bardahl", precio: 10900, costo: 5900, stock: 27, compat: TODAS, ubi: "E4-B1" },
  // ── Cables ──
  { sku: "CA-ACEL", name: "Cable de acelerador", cat: "Cables", marca: "Maxsa", precio: 8600, costo: 4300, stock: 32, compat: C150, ubi: "E7-A1" },
  { sku: "CA-EMBR", name: "Cable de embrague", cat: "Cables", marca: "Maxsa", precio: 8900, costo: 4500, stock: 29, compat: C150, ubi: "E7-A1" },
  { sku: "CA-FRENO", name: "Cable de freno delantero", cat: "Cables", marca: "Maxsa", precio: 7900, costo: 3900, stock: 34, compat: C110, ubi: "E7-A2" },
  { sku: "CA-VELOC", name: "Cable de velocímetro", cat: "Cables", marca: "Maxsa", precio: 8200, costo: 4100, stock: 21, compat: TODAS, ubi: "E7-A2" },
  // ── Carburación ──
  { sku: "CB-CARB110", name: "Carburador completo 110cc", cat: "Carburación", marca: "Maxsa", precio: 47000, costo: 29000, stock: 7, compat: C110, ubi: "E8-A1" },
  { sku: "CB-KITREP", name: "Kit de reparación de carburador", cat: "Carburación", marca: "Maxsa", precio: 13500, costo: 7200, stock: 18, compat: TODAS, ubi: "E8-A2" },
  { sku: "CB-CANILLA", name: "Canilla de nafta", cat: "Carburación", marca: "Maxsa", precio: 9600, costo: 5000, stock: 23, compat: TODAS, ubi: "E8-A3" },
  { sku: "CB-FILNAF", name: "Filtro de nafta", cat: "Carburación", marca: "Genérico", precio: 3900, costo: 1700, stock: 48, compat: TODAS, ubi: "E8-A3" },
  // ── Escape ──
  { sku: "ES-SILEN", name: "Silenciador de escape original", cat: "Escape", marca: "Maxsa", precio: 72000, costo: 46000, stock: 5, compat: C150, ubi: "DEP-3" },
  { sku: "ES-JUNTA", name: "Junta de escape", cat: "Escape", marca: "Genérico", precio: 3200, costo: 1400, stock: 40, compat: TODAS, ubi: "E3-A3" },
  // ── Accesorios ──
  { sku: "AC-CASCOI", name: "Casco integral con visor (varios talles)", cat: "Accesorios y casco", marca: "Halcón", precio: 98000, costo: 62000, stock: 11, compat: TODAS, ubi: "VIT-1", destacado: true },
  { sku: "AC-CASCOA", name: "Casco abierto con visor rebatible", cat: "Accesorios y casco", marca: "Halcón", precio: 74000, costo: 46000, stock: 9, compat: TODAS, ubi: "VIT-1" },
  { sku: "AC-GUANTE", name: "Guantes de moto reforzados", cat: "Accesorios y casco", marca: "Genérico", precio: 28500, costo: 16000, stock: 16, compat: TODAS, ubi: "VIT-2" },
  { sku: "AC-CUBRE", name: "Cubre piernas impermeable", cat: "Accesorios y casco", marca: "Genérico", precio: 34000, costo: 19000, stock: 13, compat: TODAS, ubi: "VIT-2" },
  { sku: "AC-BAUL", name: "Baúl trasero 45 litros con base", cat: "Accesorios y casco", marca: "Genérico", precio: 68000, costo: 42000, stock: 6, compat: TODAS, ubi: "DEP-4" },
  { sku: "AC-ESPEJO", name: "Espejos retrovisores (par)", cat: "Accesorios y casco", marca: "Maxsa", precio: 14900, costo: 7800, stock: 24, compat: TODAS, ubi: "E7-B1" },
  { sku: "AC-PUNOS", name: "Puños de goma (par)", cat: "Accesorios y casco", marca: "Genérico", precio: 6200, costo: 2800, stock: 36, compat: TODAS, ubi: "E7-B2" },
  { sku: "AC-CANDADO", name: "Candado de disco con alarma", cat: "Accesorios y casco", marca: "Genérico", precio: 32500, costo: 18000, stock: 10, compat: TODAS, ubi: "VIT-3" },
  // ── Estética ──
  { sku: "PL-CUBCAD", name: "Cubre cadena plástico", cat: "Estética y plásticos", marca: "Maxsa", precio: 15800, costo: 8500, stock: 12, compat: C110, ubi: "DEP-5" },
  { sku: "PL-GUARDA", name: "Guardabarros delantero", cat: "Estética y plásticos", marca: "Maxsa", precio: 22000, costo: 12500, stock: 8, compat: C150, ubi: "DEP-5" },
  { sku: "PL-CALCOS", name: "Juego de calcos originales", cat: "Estética y plásticos", marca: "Genérico", precio: 11500, costo: 5500, stock: 15, compat: C150, ubi: "E7-C1" },
];

async function main() {
  const existente = await db.client.findUnique({ where: { slug: SLUG } });
  if (existente) {
    await db.bazarProducto.deleteMany({ where: { clientId: existente.id } });
    await db.user.deleteMany({ where: { clientId: existente.id } });
    await db.client.delete({ where: { id: existente.id } });
    console.log("tenant anterior borrado");
  }

  const client = await db.client.create({
    data: {
      name: "Fernández Repuestos",
      slug: SLUG,
      rubro: "repuestos y accesorios para motos",
      pack: "SCALE",
      status: "PROSPECT",
      whatsapp: "5492914196483",
      phone: "0291-4532580",
      email: "fernandeztorronluis@yahoo.com.ar",
      contactName: "Luis Fernández Torrón",
      modules: ["crm", "caja", "sitio"], // pedidos, stock y proveedores los trae el template
      branding: {
        displayName: "Motos Fernández Repuestos",
        primary: "#F5B301", // amarillo del cartel
        accent: "#111111",
        estilo: { esquinas: "suaves", nav: "izquierda", densidad: "comoda" },
      },
      settings: {
        template: "repuestos",
        eslogan: "Repuestos y accesorios para motos",
        claim: "Venta y reparación · Bahía Blanca",
        instagram: "fernandezrepuestos",
        facebook: "motosfernandez",
        horarios: "Lun a Vie de 9 a 13 y de 15:30 a 19:30 · Sáb de 9 a 13",
        whatsapps: ["5492914196483"],
        sucursales: [{ direccion: "Brown 1141, (8000) Bahía Blanca", whatsapp: "5492914196483" }],
        // Despachos: el foco del negocio es vender online a todo el país
        envios: {
          retiroLocal: true,
          bahiaBlanca: 4500,
          interior: 9800,
          gratisDesde: 120000,
          correos: ["Correo Argentino", "Andreani", "Vía Cargo"],
        },
        nicho: "Motos de 110, 125 y 150cc",
        proveedores: ["Maxsa"],
        nosotros: {
          historia:
            "Somos un local de repuestos y accesorios para motos en Bahía Blanca, atendido por su dueño. Originales y alternativos para todas las marcas, con la experiencia de quien conoce las motos que andan por la ciudad.",
          tituloHistoria: "Verificamos antes de despachar",
          parrafos: [
            "Trabajamos con las marcas que aguantan: transmisión, frenos, motor, eléctrico, suspensión, neumáticos y lubricantes. Si hay una alternativa que rinde igual y sale menos, te la decimos.",
            "Antes de despachar verificamos que el repuesto entre en tu moto. Por eso te preguntamos el modelo: preferimos chequear dos veces y que llegue lo que sirve.",
            "Despachamos a todo el país por Correo Argentino, Andreani y Vía Cargo. Y si estás en Bahía, lo tenés en el día o podés pasar a retirarlo por Brown 1141.",
          ],
          numeros: [
            { valor: "+2.500", texto: "repuestos en stock" },
            { valor: "Todas", texto: "las marcas" },
            { valor: "Envíos", texto: "a todo el país" },
          ],
        },
      },
    },
  });

  await db.user.create({
    data: {
      username: SLUG,
      name: "Fernández Repuestos",
      role: "CLIENT",
      osRole: "dueno",
      clientId: client.id,
      passwordHash: await bcrypt.hash("Repuestos.2026", 10),
    },
  });

  const slugDe = (t: string) =>
    t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);

  const usados = new Set<string>();
  await db.bazarProducto.createMany({
    data: PRODUCTOS.map((p) => {
      let slug = slugDe(p.name);
      while (usados.has(slug)) slug = `${slug}-${p.sku.toLowerCase()}`;
      usados.add(slug);
      const motos = p.compat.length > 12 ? "la mayoría de las motos de 110, 125 y 150cc" : p.compat.join(", ");
      return {
        clientId: client.id,
        nombre: p.name,
        slug,
        categoria: p.cat,
        precio: p.precio,
        costo: p.costo,
        stock: p.stock,
        minStock: 3,
        sku: p.sku,
        marca: p.marca,
        ubicacion: p.ubi,
        compatibilidades: p.compat,
        destacado: p.destacado ?? false,
        activo: true,
        fotos: [],
        descripcion: `${p.name}. Marca ${p.marca}. Compatible con ${motos}. Consultá por tu modelo si no lo ves en la lista: lo verificamos antes de despachar.`,
      };
    }),
  });

  const total = await db.bazarProducto.count({ where: { clientId: client.id } });
  console.log(`✅ tenant ${SLUG} · ${total} productos · usuario ${SLUG} / Repuestos.2026`);
  process.exit(0);
}
main();
