import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { itemsDe, fmtPrecio } from "@/lib/bazar";
import { BotonImprimir } from "./boton-imprimir";

export const dynamic = "force-dynamic";
export const metadata = { title: "Etiqueta del pedido" };

/**
 * Etiqueta de bandeja, 100 × 70 mm, con la identidad de la marca.
 * Es la que se pega en la bandeja o la caja: lo que manda es el contenido,
 * la fecha y la conservación, como en cualquier etiqueta de alimento.
 * Sale del brand book: sello circular bordó con letras celeste sobre crema.
 */
export default async function EtiquetaPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const pedido = await db.bazarPedido.findFirst({ where: { id, clientId: tenant.id } });
  if (!pedido) notFound();

  const marca = (tenant.branding ?? {}) as {
    primary?: string;
    accent?: string;
    fondo?: string;
    tinta?: string;
    displayName?: string;
  };
  const BORDO = marca.primary ?? "#7B2434";
  const CELESTE = marca.accent ?? "#A9C6F5";
  const CREMA = marca.fondo ?? "#FBF3DE";
  const TINTA = marca.tinta ?? "#3A1218";
  const nombre = marca.displayName ?? tenant.name;
  const st = (tenant.settings ?? {}) as { instagram?: string; eslogan?: string };

  const items = itemsDe(pedido.items);
  const unidades = items.reduce((a, i) => a + i.cant, 0);
  const iniciales = nombre.split(" ").map((w) => w[0]).join("").slice(0, 2);
  const fecha = pedido.createdAt.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-[440px] print:max-w-none">
        <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
          <div>
            <h1 className="text-lg font-semibold">Etiqueta del pedido #{pedido.numero}</h1>
            <p className="text-sm text-muted-foreground">
              100 × 70 mm. Va pegada en la bandeja con todo lo que lleva el pedido.
            </p>
          </div>
          <BotonImprimir />
        </div>

        <div
          className="etiqueta relative overflow-hidden"
          style={{
            width: "100mm",
            height: "70mm",
            backgroundColor: CREMA,
            color: TINTA,
            fontFamily: "var(--font-archivo)",
            border: `1px solid ${BORDO}22`,
          }}
        >
          {/* Cabecera: sello circular + marca + número de pedido */}
          <div className="flex items-center gap-2.5" style={{ padding: "3.5mm 4mm 2.5mm" }}>
            <div
              className="flex shrink-0 items-center justify-center rounded-full"
              style={{ width: "13mm", height: "13mm", backgroundColor: BORDO }}
            >
              <span
                style={{
                  fontFamily: "var(--font-bodoni)",
                  color: CELESTE,
                  fontWeight: 900,
                  fontSize: "4mm",
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                }}
              >
                {iniciales}
              </span>
            </div>
            <div className="min-w-0">
              <p
                style={{
                  fontFamily: "var(--font-bodoni)",
                  color: BORDO,
                  fontWeight: 900,
                  fontSize: "5.6mm",
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                }}
              >
                {nombre}
              </p>
              {st.eslogan ? (
                <p style={{ fontSize: "2.4mm", color: `${TINTA}99`, marginTop: "0.8mm" }}>{st.eslogan}</p>
              ) : null}
            </div>
            <div className="ml-auto text-right">
              <p style={{ fontSize: "2.2mm", textTransform: "uppercase", letterSpacing: "0.14em", color: `${TINTA}88` }}>
                Pedido
              </p>
              <p style={{ fontFamily: "var(--font-bodoni)", fontWeight: 900, fontSize: "5.4mm", color: BORDO, lineHeight: 1 }}>
                #{pedido.numero}
              </p>
            </div>
          </div>

          {/* Contenido: es lo que se mira al recibir la bandeja */}
          <div style={{ padding: "0 4mm" }}>
            <p
              style={{
                fontSize: "2.2mm",
                textTransform: "uppercase",
                letterSpacing: "0.16em",
                color: `${TINTA}88`,
                borderBottom: `0.3mm solid ${BORDO}33`,
                paddingBottom: "1mm",
              }}
            >
              Contenido · {unidades} {unidades === 1 ? "unidad" : "unidades"}
            </p>
            <ul style={{ marginTop: "1.6mm" }}>
              {items.slice(0, 6).map((i, n) => (
                <li
                  key={n}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "3mm",
                    fontSize: "2.9mm",
                    lineHeight: 1.5,
                  }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <strong style={{ color: BORDO }}>{i.cant}×</strong> {i.nombre}
                  </span>
                  <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{fmtPrecio(i.precio * i.cant)}</span>
                </li>
              ))}
              {items.length > 6 ? (
                <li style={{ fontSize: "2.6mm", color: `${TINTA}99`, marginTop: "0.5mm" }}>
                  + {items.length - 6} producto{items.length - 6 === 1 ? "" : "s"} más
                </li>
              ) : null}
            </ul>
          </div>

          {/* Pie: cliente, fecha, total y la faja de conservación */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                gap: "3mm",
                padding: "0 4mm 2mm",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: "2.2mm", textTransform: "uppercase", letterSpacing: "0.14em", color: `${TINTA}88` }}>
                  Para
                </p>
                <p
                  style={{
                    fontSize: "3.4mm",
                    fontWeight: 700,
                    color: BORDO,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {pedido.nombre}
                </p>
                <p style={{ fontSize: "2.5mm", color: `${TINTA}99` }}>
                  Envasado el {fecha}
                  {pedido.retiroEnLocal ? " · retira en el local" : pedido.ciudad ? ` · ${pedido.ciudad}` : ""}
                </p>
              </div>
              <p
                style={{
                  fontFamily: "var(--font-bodoni)",
                  fontWeight: 900,
                  fontSize: "7mm",
                  color: BORDO,
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                }}
              >
                {fmtPrecio(pedido.total)}
              </p>
            </div>

            {/* Faja celeste, como el cierre de la caja en el packaging */}
            <div
              style={{
                backgroundColor: CELESTE,
                color: BORDO,
                padding: "1.8mm 4mm",
                fontSize: "2.5mm",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                display: "flex",
                justifyContent: "space-between",
                gap: "3mm",
              }}
            >
              <span>Mantener refrigerado · Consumir en 3 días</span>
              {st.instagram ? <span>@{st.instagram}</span> : null}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: 100mm 70mm; margin: 0; }
          body { background: #fff; }
          body * { visibility: hidden; }
          .etiqueta, .etiqueta * { visibility: visible; }
          .etiqueta { position: absolute; inset: 0; border: none !important; }
        }
      `}</style>
    </div>
  );
}
