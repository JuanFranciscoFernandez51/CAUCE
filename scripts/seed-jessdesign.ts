/**
 * JESS DESIGN — event planner.
 * "Sofisticación en cada detalle, elegancia en cada momento."
 * Paleta e identidad del panel que mandó la clienta: topo, casi negro y
 * cremas, con Italiana para los titulares y Montserrat para el texto.
 */
import { db } from "../src/lib/db";
import bcrypt from "bcryptjs";

const SLUG = "jessdesign";

// Rubros de proveedor con los que trabaja una organizadora de eventos.
const PROVEEDORES = [
  ["Catering Alma", "Catering", "Menús de tres pasos y estaciones"],
  ["DJ Nicolás Vera", "Música y DJ", "Sonido, luces y pista"],
  ["Flores del Sur", "Ambientación floral", "Centros de mesa y arcos"],
  ["Estudio Luz", "Fotografía y video", "Cobertura completa del evento"],
  ["Carpas del Este", "Estructuras", "Carpas, tarimas y pisos"],
  ["Vajilla Fina", "Mobiliario y vajilla", "Cristalería, mantelería y sillas"],
];

async function main() {
  const existente = await db.client.findUnique({ where: { slug: SLUG } });
  if (existente) {
    await db.user.deleteMany({ where: { clientId: existente.id } });
    await db.client.delete({ where: { id: existente.id } });
  }

  const client = await db.client.create({
    data: {
      name: "Jess Design",
      slug: SLUG,
      rubro: "organización de eventos",
      pack: "SCALE",
      status: "PROSPECT",
      whatsapp: "",
      email: "",
      contactName: "Jess",
      modules: ["crm", "caja", "sitio", "turnos", "proyectos"],
      branding: {
        displayName: "Jess Design",
        primary: "#9E9387", // topo, el color de la marca
        accent: "#B85850", // terracota, para acentos
        fondo: "#EDE8DE", // crema
        tinta: "#1A1816", // casi negro
        display: "Italiana",
        estilo: { esquinas: "suaves", nav: "izquierda", densidad: "comoda" },
      },
      settings: {
        template: "eventos",
        eslogan: "Event Planner",
        claim: "Sofisticación en cada detalle, elegancia en cada momento",
        paleta: {
          topo: "#9E9387",
          tinta: "#1A1816",
          crema: "#EDE8DE",
          arena: "#C8C3BA",
          piedra: "#B0AA9F",
          verde: "#5A8A57",
          terracota: "#B85850",
        },
        tipografias: { display: "Italiana", texto: "Montserrat", firma: "Pinyon Script" },
        servicios: [
          "Casamientos",
          "Cumpleaños de 15",
          "Eventos corporativos",
          "Aniversarios",
          "Producción integral",
        ],
      },
    },
  });

  await db.user.create({
    data: {
      username: SLUG,
      name: "Jess Design",
      role: "CLIENT",
      osRole: "dueno",
      clientId: client.id,
      passwordHash: await bcrypt.hash("JessDesign.2026", 10),
    },
  });

  // Los proveedores son el corazón del negocio: sin ellos no hay evento.
  await db.proveedor.createMany({
    data: PROVEEDORES.map(([nombre, rubro, notas]) => ({
      clientId: client.id,
      nombre,
      rubro,
      notas,
    })),
  }).catch(() => console.log("(proveedores: revisar el modelo)"));

  console.log(`✅ ${SLUG} · usuario ${SLUG} / JessDesign.2026`);
  process.exit(0);
}
main();
