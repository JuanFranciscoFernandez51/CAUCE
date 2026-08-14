import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { bazarSettings } from "@/lib/bazar-server";
import { getBazarSite } from "../_lib/bazar-site";
import { BazarShell } from "../_components/bazar/bazar-shell";
import { CarritoPage } from "../_components/bazar/carrito-page";
import { CarritoMilo } from "../_components/comida/pagina-carrito";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = await getBazarSite(slug);
  return {
    title: site ? `Carrito — ${site.info.nombre}` : "Carrito",
    robots: { index: false, follow: false },
  };
}

export default async function CarritoRoute({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ pago?: string; pedido?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const site = await getBazarSite(slug);
  if (!site) notFound();

  const settings = bazarSettings(site.tenant);

  // Casa Milo: el carrito con SU estética (chrome bordó/crema), no la genérica.
  if ((site.tenant.settings as { template?: string } | null)?.template === "comida") {
    return <CarritoMilo tenant={site.tenant} retornoPago={sp.pago ?? null} retornoPedido={sp.pedido ?? null} />;
  }

  return (
    <BazarShell info={site.info}>
      <CarritoPage
        slug={site.tenant.slug}
        whatsapp={site.info.whatsapp}
        envioCosto={
          settings.envioCosto ??
          ((site.tenant.settings as { envios?: { caba?: number; bahiaBlanca?: number; interior?: number } } | null)?.envios
            ?.caba ??
            (site.tenant.settings as { envios?: { bahiaBlanca?: number } } | null)?.envios?.bahiaBlanca ??
            0)
        }
        envioGratisDesde={
          (site.tenant.settings as { envios?: { gratisDesde?: number } } | null)?.envios?.gratisDesde ?? 0
        }
        retornoPago={sp.pago ?? null}
        retornoPedido={sp.pedido ?? null}
      />
    </BazarShell>
  );
}
