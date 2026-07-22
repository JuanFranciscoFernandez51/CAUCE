import { db } from "../src/lib/db";

/** Crea el lead de Ave Fénix en el pipeline del admin, vinculado al tenant armado. */
async function main() {
  const client = await db.client.findUnique({ where: { slug: "avefenix" } });
  if (!client) throw new Error("Falta el tenant avefenix");
  const existing = await db.lead.findFirst({
    where: { name: { contains: "fenix", mode: "insensitive" } },
  });
  if (existing) {
    await db.lead.update({
      where: { id: existing.id },
      data: { clientId: client.id, status: "QUALIFIED" },
    });
    console.log("Lead existente vinculado");
    return;
  }
  await db.lead.create({
    data: {
      source: "MANUAL",
      status: "QUALIFIED",
      name: "Ave Fénix Publicidad",
      business: "Ave Fénix Pantallas LEDs (DOOH)",
      rubro: "Publicidad — circuito de pantallas LED",
      phone: "291-4121109",
      whatsapp: "5492914121109",
      email: "info@avefenixleds.com.ar",
      score: 85,
      clientId: client.id,
      intake: {
        dolor: "Gestión en Excel: pantallas, clientes activos, cobros del 1 al 5 por WhatsApp a mano, libro diario manual",
        propuesta: "OS con módulo Pantallas (disponibilidad 30 spots x pantalla), CRM, Finanzas estilo Vespa Bahía, aviso de cobro automático 1-5, web réplica de avefenixleds.com.ar",
        demoLista: true,
      },
    },
  });
  console.log("✅ Lead Ave Fénix creado y vinculado al tenant (score 85, QUALIFIED)");
}

main().finally(() => db.$disconnect());
