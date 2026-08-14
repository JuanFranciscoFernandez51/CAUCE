import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTenantBySlug, hasModule } from "@/lib/tenant";
import { BORDO, CREMA, TINTA, TENUE } from "../_components/comida/milo";
import { PedidoProvider } from "../_components/comida/pedido-store";
import { MiloEstilos, MiloCinta, MiloHeader, MiloFooterMini, MediosDePago, WhatsAppFlotante } from "../_components/comida/milo-chrome";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Términos y condiciones — Casa Milo", robots: { index: false } };

/** Términos y condiciones de Casa Milo (delivery de comida, Argentina). */
const SECCIONES: { t: string; c: string[] }[] = [
  {
    t: "Quiénes somos",
    c: [
      "Casa Milo es un emprendimiento de elaboración y venta de milanesas, pollo y guarniciones con entrega a domicilio en la Ciudad de Buenos Aires. Los pedidos se toman por esta web o por WhatsApp.",
    ],
  },
  {
    t: "Pedidos y entrega",
    c: [
      "El pedido mínimo es de 2 kg. Los pedidos confirmados antes de las 17 hs se entregan el mismo día; los posteriores, al día siguiente en la primera franja disponible.",
      "Hacemos entregas en toda CABA. Al confirmar el pedido coordinamos dirección y franja horaria. Si no hay nadie en el domicilio en la franja acordada, reprogramamos la entrega (puede aplicar un costo de reenvío).",
      "El envío es sin cargo para pedidos desde $60.000. Por debajo de ese monto, el costo de envío se informa antes de pagar.",
    ],
  },
  {
    t: "Cadena de frío y conservación",
    c: [
      "Todos los productos salen refrigerados y viajan con frío hasta tu puerta. Al recibirlos, guardalos en freezer (hasta 3 meses) o en heladera si los vas a cocinar en el día.",
      "Una vez descongelado, el producto no debe volver a congelarse.",
    ],
  },
  {
    t: "Cambios y devoluciones",
    c: [
      "Por tratarse de alimentos frescos, solo aceptamos reclamos por producto en mal estado o pedido incorrecto. Escribinos por WhatsApp dentro de las 24 horas de recibido, con foto del producto, y te lo reponemos o te devolvemos el dinero.",
      "Si el pedido llegó incompleto, avisanos y enviamos lo que falte sin cargo.",
    ],
  },
  {
    t: "Medios de pago",
    c: [
      "Aceptamos MercadoPago (tarjetas de crédito y débito, dinero en cuenta), transferencia bancaria y efectivo al recibir. Los pagos online se procesan en la plataforma de MercadoPago; no guardamos datos de tarjetas.",
    ],
  },
  {
    t: "Precios",
    c: [
      "Los precios publicados están expresados en pesos argentinos e incluyen IVA. Pueden actualizarse sin previo aviso; el precio válido es el vigente al confirmar el pedido.",
    ],
  },
  {
    t: "Datos personales",
    c: [
      "Los datos que nos dejás (nombre, dirección, teléfono) se usan únicamente para entregar tu pedido y avisarte novedades si lo aceptaste. No los compartimos con terceros, salvo lo necesario para procesar pagos y envíos. Podés pedir su baja o corrección escribiéndonos por WhatsApp.",
    ],
  },
];

export default async function TerminosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !hasModule(tenant, "sitio")) notFound();
  if ((tenant.settings as { template?: string } | null)?.template !== "comida") notFound();

  const wa = tenant.whatsapp?.replace(/\D/g, "") || null;
  const base = `/sitio/${tenant.slug}`;

  return (
    <PedidoProvider slug={tenant.slug}>
      <div className="min-h-screen" style={{ backgroundColor: CREMA, color: TINTA, fontFamily: "var(--font-archivo)" }}>
        <MiloEstilos />
        <MiloCinta promesas={["Entrega en el día en CABA", "Envío sin cargo desde $60.000", "Pagás al recibir o por MercadoPago"]} />
        <MiloHeader base={base} wa={wa} nav={[{ href: base, label: "Inicio" }, { href: `${base}/catalogo`, label: "Catálogo" }]} />

        <div className="mx-auto max-w-[840px] px-7 py-14">
          <p className="text-[13px] font-semibold uppercase" style={{ color: BORDO, letterSpacing: "0.22em" }}>
            Casa Milo
          </p>
          <h1
            className="mt-3 text-[38px] font-black sm:text-[50px]"
            style={{ fontFamily: "var(--font-bodoni)", color: BORDO, lineHeight: 1, letterSpacing: "-0.02em" }}
          >
            Términos y condiciones
          </h1>
          <p className="mt-4 text-[15px]" style={{ color: TENUE }}>
            Última actualización: agosto 2026. Cualquier duda, escribinos por WhatsApp y te la resolvemos.
          </p>

          {SECCIONES.map((s) => (
            <section key={s.t} className="mt-9">
              <h2 className="pb-2 text-[22px] font-bold" style={{ fontFamily: "var(--font-bodoni)", color: BORDO, borderBottom: "1px solid rgba(123,36,52,0.2)" }}>
                {s.t}
              </h2>
              {s.c.map((p) => (
                <p key={p.slice(0, 30)} className="mt-3 text-[15px] leading-[1.65]" style={{ color: "#4A2A30" }}>
                  {p}
                </p>
              ))}
            </section>
          ))}

          <div className="mt-10">
            <p className="mb-3 text-[12px] font-semibold uppercase" style={{ color: BORDO, letterSpacing: "0.2em" }}>
              Medios de pago
            </p>
            <MediosDePago />
          </div>
        </div>

        <WhatsAppFlotante wa={wa} />
        <MiloFooterMini base={base} wa={wa} />
      </div>
    </PedidoProvider>
  );
}
