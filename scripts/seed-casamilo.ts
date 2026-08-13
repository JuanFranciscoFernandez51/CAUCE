/**
 * Casa Milo — delivery de milanesas y pollo premium en CABA.
 * "Lo simple, cuando está bien hecho."
 * Identidad de sus piezas: bordó, crema y celeste; serif de alto contraste.
 */
import { db } from "../src/lib/db";
import bcrypt from "bcryptjs";

const SLUG = "casamilo";

type P = { name: string; cat: string; precio: number; desc: string; destacado?: boolean };

// Carta pensada para delivery: por unidad y por cantidad, que es como se pide.
const CARTA: P[] = [
  // ── Milanesas de carne ──
  { name: "Milanesa de nalga · 4 unidades", cat: "Milanesas de carne", precio: 14900, desc: "Nalga seleccionada, cortada fina y empanada a mano. Bandeja de 4.", destacado: true },
  { name: "Milanesa de nalga · 8 unidades", cat: "Milanesas de carne", precio: 27900, desc: "La bandeja familiar: 8 milanesas de nalga listas para freír u horno.", destacado: true },
  { name: "Milanesa de nalga · 12 unidades", cat: "Milanesas de carne", precio: 39900, desc: "Para tener en el freezer. 12 milanesas de nalga.", },
  { name: "Milanesa de bola de lomo · 4 unidades", cat: "Milanesas de carne", precio: 13900, desc: "Corte magro y tierno, ideal para el horno." },
  { name: "Milanesa de peceto · 4 unidades", cat: "Milanesas de carne", precio: 16900, desc: "El corte más fino y parejo. Bandeja de 4." },
  // ── Pollo ──
  { name: "Milanesa de pollo · 4 unidades", cat: "Pollo", precio: 12900, desc: "Pechuga entera empanada a mano, sin agregados.", destacado: true },
  { name: "Milanesa de pollo · 8 unidades", cat: "Pollo", precio: 23900, desc: "Bandeja familiar de milanesas de pechuga." },
  { name: "Pechuga entera · 1 kg", cat: "Pollo", precio: 11900, desc: "Pechuga fresca sin piel ni hueso, lista para cocinar." },
  { name: "Pechuga fileteada · 1 kg", cat: "Pollo", precio: 12900, desc: "Fileteada fina, del grosor que se pide para plancha.", destacado: true },
  { name: "Suprema rellena jamón y queso · 2 unidades", cat: "Pollo", precio: 15900, desc: "Rellena a mano, empanada y lista para el horno." },
  // ── Napolitanas y rellenas ──
  { name: "Milanesa napolitana · 4 unidades", cat: "Napolitanas y rellenas", precio: 19900, desc: "Con salsa, mozzarella y jamón. Van al horno y listo." },
  { name: "Milanesa rellena jamón y queso · 4 unidades", cat: "Napolitanas y rellenas", precio: 21900, desc: "Rellena a mano con jamón cocido y mozzarella." },
  { name: "Milanesa a la suiza · 4 unidades", cat: "Napolitanas y rellenas", precio: 22900, desc: "Con queso suizo y jamón natural." },
  // ── Guarniciones ──
  { name: "Puré de papas casero · 500 g", cat: "Guarniciones", precio: 5900, desc: "Papa, manteca y leche. Nada más." },
  { name: "Papas bastón · 1 kg", cat: "Guarniciones", precio: 5400, desc: "Corte bastón, listas para freír u horno." },
  { name: "Ensalada mixta · 500 g", cat: "Guarniciones", precio: 4900, desc: "Lechuga, tomate y zanahoria, lavada y lista." },
  { name: "Puré de calabaza · 500 g", cat: "Guarniciones", precio: 5900, desc: "Calabaza asada, suave y sin agregados." },
  // ── Combos ──
  { name: "Combo Milo · 8 milanesas + puré + papas", cat: "Combos", precio: 36900, desc: "La cena resuelta para cuatro: 8 milanesas a elección, puré y papas.", destacado: true },
  { name: "Combo Pollo · 8 milanesas de pollo + ensalada", cat: "Combos", precio: 29900, desc: "Ocho milanesas de pechuga con ensalada mixta." },
  { name: "Combo Napo · 4 napolitanas + papas", cat: "Combos", precio: 25900, desc: "Cuatro napolitanas con papas bastón." },
];

async function main() {
  const existente = await db.client.findUnique({ where: { slug: SLUG } });
  if (existente) {
    await db.bazarProducto.deleteMany({ where: { clientId: existente.id } });
    await db.user.deleteMany({ where: { clientId: existente.id } });
    await db.client.delete({ where: { id: existente.id } });
  }

  const client = await db.client.create({
    data: {
      name: "Casa Milo",
      slug: SLUG,
      rubro: "delivery de milanesas y pollo",
      pack: "SCALE",
      status: "PROSPECT",
      whatsapp: "5491100000000", // ← reemplazar por el número real del wa.me del perfil
      email: "",
      contactName: "",
      modules: ["crm", "caja", "sitio"],
      branding: {
        displayName: "Casa Milo",
        primary: "#7B2233", // bordó de la marca
        accent: "#A9C6F2", // celeste de "BS-AS"
        estilo: { esquinas: "suaves", nav: "izquierda", densidad: "comoda" },
      },
      settings: {
        template: "comida",
        eslogan: "Lo simple, cuando está bien hecho.",
        claim: "Milanesas & pollo premium",
        instagram: "casamilo.ba",
        horarios: "Todos los días de 10 a 15 y de 19 a 23:30",
        zona: "CABA",
        sucursales: [{ direccion: "CABA — envíos a domicilio" }],
        envios: {
          retiroLocal: false,
          caba: 2500,
          gratisDesde: 30000,
          demora: "Entre 45 y 70 minutos",
        },
        nosotros: {
          historia:
            "Casa Milo nació con una idea simple: que una milanesa bien hecha no debería ser difícil de conseguir. Elegimos cada corte, empanamos a mano y lo mandamos a tu casa listo para cocinar.",
          tituloHistoria: "Elegimos el corte, vos ponés la mesa",
          parrafos: [
            "Trabajamos con nalga, bola de lomo, peceto y pechuga entera. Nada de recortes ni carne procesada: el corte se compra fresco, se limpia y se corta el mismo día.",
            "El empanado es a mano, con pan rallado propio. Por eso la milanesa queda pareja y no se despega en la sartén.",
            "Hacemos envíos a domicilio en CABA. Pedís por la web o por WhatsApp y llega listo para freír, hornear o guardar en el freezer.",
          ],
          numeros: [
            { valor: "100%", texto: "empanado a mano" },
            { valor: "45'", texto: "y está en tu casa" },
            { valor: "CABA", texto: "envíos a domicilio" },
          ],
        },
      },
    },
  });

  await db.user.create({
    data: {
      username: SLUG,
      name: "Casa Milo",
      role: "CLIENT",
      osRole: "dueno",
      clientId: client.id,
      passwordHash: await bcrypt.hash("CasaMilo.2026", 10),
    },
  });

  const slugDe = (t: string) =>
    t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 58);

  await db.bazarProducto.createMany({
    data: CARTA.map((p) => ({
      clientId: client.id,
      nombre: p.name,
      slug: slugDe(p.name),
      categoria: p.cat,
      precio: p.precio,
      stock: 50, // se cocina por pedido: hay disponibilidad salvo que se marque lo contrario
      minStock: 0,
      activo: true,
      destacado: p.destacado ?? false,
      descripcion: p.desc,
      fotos: [],
    })),
  });

  const n = await db.bazarProducto.count({ where: { clientId: client.id } });
  console.log(`✅ ${SLUG} · ${n} productos · usuario ${SLUG} / CasaMilo.2026`);
  process.exit(0);
}
main();
