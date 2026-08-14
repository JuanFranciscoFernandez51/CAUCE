import type { Client } from "@prisma/client";
import Link from "next/link";
import { BORDO, CREMA, TINTA, TENUE } from "./milo";
import { PedidoProvider } from "./pedido-store";
import { CarritoPage } from "../bazar/carrito-page";
import { MiloEstilos, MiloCinta, MiloHeader, MiloFooterMini, MediosDePago } from "./milo-chrome";

/** Carrito de Casa Milo: el checkout compartido, vestido con la estética de la casa. */
export function CarritoMilo({
  tenant, retornoPago, retornoPedido,
}: {
  tenant: Client; retornoPago: string | null; retornoPedido: string | null;
}) {
  const st = (tenant.settings ?? {}) as {
    anuncio?: string;
    envios?: { caba?: number; gratisDesde?: number };
  };
  const wa = tenant.whatsapp?.replace(/\D/g, "") || null;
  const base = `/sitio/${tenant.slug}`;
  const promesas = (st.anuncio ?? "Entrega en el día en CABA · Envío sin cargo desde $60.000 · Pagás al recibir o por MercadoPago")
    .split("·").map((p) => p.trim()).filter(Boolean);

  // Variables .tienda para que el checkout compartido tome la paleta de la casa.
  const vars = {
    "--t-fondo": CREMA,
    "--t-card": "#FFFDF6",
    "--t-suave": "#F4EAD2",
    "--t-texto": TINTA,
    "--t-tenue": TENUE,
    "--t-borde": "rgba(123,36,52,0.18)",
    "--t-panel": "#FFFDF6",
    "--tpl": BORDO,
    "--tpl-sobre": CREMA,
  } as React.CSSProperties;

  return (
    <PedidoProvider slug={tenant.slug}>
      <div className="min-h-screen" style={{ backgroundColor: CREMA, color: TINTA, fontFamily: "var(--font-archivo)" }}>
        <MiloEstilos />
        <MiloCinta promesas={promesas} />
        <MiloHeader
          base={base}
          wa={wa}
          nav={[
            { href: base, label: "Inicio" },
            { href: `${base}/catalogo`, label: "Catálogo" },
          ]}
        />
        <div className="mx-auto max-w-[1180px] px-7 pt-10">
          <p className="text-[13px] font-semibold uppercase" style={{ color: BORDO, letterSpacing: "0.22em" }}>
            Tu pedido
          </p>
          <h1
            className="mt-3 text-[38px] font-black sm:text-[54px]"
            style={{ fontFamily: "var(--font-bodoni)", color: BORDO, lineHeight: 1, letterSpacing: "-0.02em" }}
          >
            Completá y te lo mandamos
          </h1>
        </div>
        <div className="tienda" style={vars}>
          <CarritoPage
            slug={tenant.slug}
            whatsapp={wa}
            envioCosto={st.envios?.caba ?? 0}
            envioGratisDesde={st.envios?.gratisDesde ?? 0}
            retornoPago={retornoPago}
            retornoPedido={retornoPedido}
          />
        </div>
        <div className="mx-auto max-w-[1180px] px-7 pb-6 pt-2">
          <p className="mb-3 text-[12px] font-semibold uppercase" style={{ color: BORDO, letterSpacing: "0.2em" }}>
            Medios de pago
          </p>
          <MediosDePago />
          <p className="mt-4 text-[13px]" style={{ color: TENUE }}>
            Al comprar aceptás los{" "}
            <Link href={`${base}/terminos`} className="underline underline-offset-2 transition hover:opacity-70">
              términos y condiciones
            </Link>
            .
          </p>
        </div>
        <MiloFooterMini base={base} wa={wa} />
      </div>
    </PedidoProvider>
  );
}
