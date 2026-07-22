/**
 * Campaña de lanzamiento de Cauce: 1 campaña → 1 conjunto → 5 anuncios (los 5 videos).
 * Queda en DRAFT lista para "Publicar a Meta" cuando la Marketing API esté aprobada.
 * Idempotente por nombre.
 */
import { db } from "../src/lib/db";

const WA = "https://wa.me/5492915757101?text=Hola,%20vi%20el%20video%20de%20Cauce%20y%20quiero%20saber%20m%C3%A1s";

const ADS = [
  {
    nombre: "V1 Raúl — números del taller",
    videoUrl:
      "https://res.cloudinary.com/dgtlyzyra/video/upload/v1784746702/cauce/sistema/marketing/ads/jkj6ld9pgyyac12nnppr.mov",
    caption:
      "🔧 Un taller que avisa solo los services recupera clientes solos. Web + sistema + avisos automáticos por WhatsApp, hecho en Bahía para negocios reales. Consultá sin compromiso 👇 #cauce #bahiablanca #pymes #taller",
  },
  {
    nombre: "V2 Osvaldo — adaptado al 100%",
    videoUrl:
      "https://res.cloudinary.com/dgtlyzyra/video/upload/v1784746722/cauce/sistema/marketing/ads/rjztfkpmkirm7ymgendc.mov",
    caption:
      "💡 ¿Sistemas caros que no se adaptan al negocio? Cauce arma el sistema a medida de cómo trabaja cada uno: web, gestión y automatizaciones, todo junto y por menos plata. Escribinos 👇 #cauce #bahiablanca #pymes #sistemas",
  },
  {
    nombre: "V3 Vanesa — turnos solos",
    videoUrl:
      "https://res.cloudinary.com/dgtlyzyra/video/upload/v1784746731/cauce/sistema/marketing/ads/oz2crhskml69hnyauv4s.mov",
    caption:
      "📅 Basta de anotar turnos en el cuaderno: los clientes se agendan solos desde la web, con recordatorio automático incluido. Página + sistema + turnos online, llave en mano. Consultá 👇 #cauce #bahiablanca #turnos #peluqueria",
  },
  {
    nombre: "V4 Diego — clases sin WhatsApp infinito",
    videoUrl:
      "https://res.cloudinary.com/dgtlyzyra/video/upload/v1784746738/cauce/sistema/marketing/ads/lq49lgjmde6izeaityc8.mov",
    caption:
      "🎾 Cuarenta mensajes por día para armar clases es tiempo que no vuelve. Con Cauce los alumnos se anotan solos y la agenda se llena sin tocar el teléfono. Escribinos 👇 #cauce #bahiablanca #padel #turnosonline",
  },
  {
    nombre: "V5 Gustavo — las cuentas cierran",
    videoUrl:
      "https://res.cloudinary.com/dgtlyzyra/video/upload/v1784746754/cauce/sistema/marketing/ads/twtmeqrwuocjspfgixxr.mov",
    caption:
      "🧾 Remitos, fiados, caja… cuando los números viven en la cabeza, nunca cierran. Cauce ordena la administración completa: caja diaria, clientes y cobros, todo en un solo lugar. Consultá 👇 #cauce #bahiablanca #pymes #finanzas",
  },
];

async function main() {
  const nombre = "Cauce — Lanzamiento 5 videos — ago 2026";
  const existe = await db.mktCampaign.findFirst({ where: { name: nombre } });
  if (existe) {
    await db.mktCampaign.update({
      where: { id: existe.id },
      data: { adItems: ADS, destinationUrl: WA },
    });
    console.log("Campaña existente actualizada");
    return;
  }
  const inicio = new Date("2026-08-01T00:00:00-03:00");
  const fin = new Date("2026-08-31T23:59:00-03:00");
  await db.mktCampaign.create({
    data: {
      name: nombre,
      objective: "OUTCOME_TRAFFIC",
      dailyBudgetCents: 3000 * 100,
      startDate: inicio,
      endDate: fin,
      status: "DRAFT",
      audienceConfig: { ageMin: 28, ageMax: 55, genders: "all", countries: ["AR"] },
      creativeMediaType: "VIDEO",
      creativeImageUrls: [],
      creativeVideoUrl: null,
      creativeCaption: "(multi-anuncio: ver adItems)",
      creativeCallToAction: "LEARN_MORE",
      destinationUrl: WA,
      adItems: ADS,
    },
  });
  console.log(`✅ Campaña "${nombre}" creada en borrador con ${ADS.length} anuncios`);
  console.log(`   Destino: ${WA}`);
}

main().finally(() => db.$disconnect());
