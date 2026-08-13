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
  { name: "Milanesa de ternera clásica", cat: "Ternera", precio: 12900, desc: "Nalga tierna, corte medio. Pack de 1 kg, aprox. 6 unidades.", destacado: true },
  { name: "Milanesa de ternera fina", cat: "Ternera", precio: 13500, desc: "Bola de lomo cortada fina, para sándwich. Pack de 1 kg." },
  { name: "Napolitana lista al horno", cat: "Ternera", precio: 14900, desc: "Con salsa, jamón y muzzarella. 4 unidades, van directo al horno.", destacado: true },
  { name: "Suprema rebozada", cat: "Pollo", precio: 10900, desc: "Pechuga entera, rebozado crocante. Pack de 1 kg." },
  { name: "Milanesa de pollo fina", cat: "Pollo", precio: 10400, desc: "Fina y rendidora, la que más sale. Pack de 1 kg, aprox. 8 unidades.", destacado: true },
  { name: "Suprema natural", cat: "Pollo", precio: 9800, desc: "Sin rebozar, limpia y lista para cocinar. Pack de 1 kg." },
  { name: "Puré de papas casero", cat: "Guarniciones", precio: 4200, desc: "Papa, manteca y leche. Nada más. Envase de 500 g." },
  { name: "Papas bastón", cat: "Guarniciones", precio: 5400, desc: "Corte grueso, para horno o freidora de aire. Pack de 1 kg." },
  { name: "Ensalada rusa", cat: "Guarniciones", precio: 4800, desc: "Fresca, hecha el mismo día del envío. Envase de 500 g." },
  { name: "Combo Casa", cat: "Combos", precio: 28500, desc: "1 kg de ternera, 1 kg de pollo y un puré de 500 g. Para 4 personas · Ahorrás $2.400", destacado: true },
  { name: "Combo Semana", cat: "Combos", precio: 46900, desc: "4 kg surtidos entre ternera, pollo y napolitanas. Elegís el mix por WhatsApp. Freezer lleno · Envío sin cargo", destacado: true },
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
        anuncio: "Entrega en el día en CABA · Pedido mínimo 2 kg · Envío sin cargo desde $30.000",
        minimoKg: 2,
        claim: "Milanesas & pollo premium",
        instagram: "casamilo.ba",
        horarios: "Todos los días de 10 a 15 y de 19 a 23:30",
        zona: "CABA",
        sucursales: [{ direccion: "CABA — envíos a domicilio" }],
        envios: {
          retiroLocal: false,
          caba: 2500,
          gratisDesde: 30000,
          demora: "En el día",
          corte: "Los pedidos confirmados antes de las 17 hs se entregan ese mismo día.",
          barrios: ["Palermo", "Belgrano", "Caballito", "Recoleta", "Villa Urquiza", "Almagro", "San Telmo", "y todos los demás"],
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
