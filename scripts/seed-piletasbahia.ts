/**
 * Piletas Bahía Blanca — construcción, mantenimiento y servicio técnico.
 * Identidad del manual de marca: verde pizarra, verde agua, agua clara y
 * crema; Cormorant Garamond + Jost; la onda como elemento de marca.
 */
import { db } from "../src/lib/db";
import bcrypt from "bcryptjs";

const SLUG = "piletasbahia";

async function main() {
  const existente = await db.client.findUnique({ where: { slug: SLUG } });
  if (existente) {
    await db.user.deleteMany({ where: { clientId: existente.id } });
    await db.client.delete({ where: { id: existente.id } });
  }

  const client = await db.client.create({
    data: {
      name: "Piletas Bahía Blanca",
      slug: SLUG,
      rubro: "construcción y mantenimiento de piletas",
      pack: "SCALE",
      status: "PROSPECT",
      whatsapp: "5492915260511",
      contactName: "Francisco",
      modules: ["crm", "caja", "sitio"],
      branding: {
        displayName: "Piletas Bahía Blanca",
        primary: "#17827A", // verde agua
        accent: "#A9CFC7", // agua clara
        fondo: "#F5F1E8", // crema
        tinta: "#14201E", // verde pizarra
        estilo: { esquinas: "suaves", nav: "izquierda", densidad: "comoda" },
      },
      settings: {
        template: "piletas",
        eslogan: "Construimos, mantenemos y recuperamos piletas",
        claim: "Un solo equipo para todo el año",
        instagram: "piletasbahia.blanca",
        zona: "Bahía Blanca, Punta Alta y Monte Hermoso",
        condicionesPresupuesto:
          "50% al inicio y 50% contra entrega. Los materiales se cotizan al día de la compra. El plazo se cuenta en días hábiles y no incluye demoras por lluvia. Garantía de 6 meses sobre mano de obra.",
      },
    },
  });

  await db.user.create({
    data: {
      username: SLUG,
      name: "Piletas Bahía Blanca",
      role: "CLIENT",
      osRole: "dueno",
      clientId: client.id,
      passwordHash: await bcrypt.hash("Piletas.2026", 10),
    },
  });

  // Un presupuesto de muestra igual al modelo que mandaron, para ver el PDF ya.
  await db.presupuestoDoc.create({
    data: {
      clientId: client.id,
      numero: 42,
      nombre: "Familia Etchegaray",
      domicilio: "Fortunato Chiappara 950, Bahía Blanca",
      telefono: "291 555 0042",
      datos: [
        { etiqueta: "Medidas", valor: "8,00 × 3,50 m" },
        { etiqueta: "Volumen", valor: "42.000 L" },
        { etiqueta: "Revestimiento", valor: "Venecita" },
      ],
      items: [
        { detalle: "Recuperación de agua verde: choque de cloro, floculante y 24 h de filtrado continuo", cant: 1, unitario: 180000 },
        { detalle: "Limpieza de fondo y paredes, aspirado y cepillado", cant: 1, unitario: 95000 },
        { detalle: "Cambio de arena del filtro (25 kg) y revisión de bomba", cant: 1, unitario: 120000 },
      ],
      materiales: 85000,
      condiciones:
        "50% al inicio y 50% contra entrega. Los materiales se cotizan al día de la compra. El plazo se cuenta en días hábiles y no incluye demoras por lluvia. Garantía de 6 meses sobre mano de obra.",
      estado: "ENVIADO",
    },
  });

  console.log(`✅ ${SLUG} · usuario ${SLUG} / Piletas.2026`);
  process.exit(0);
}
main();
