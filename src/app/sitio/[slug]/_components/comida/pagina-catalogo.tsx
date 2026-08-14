import type { Client } from "@prisma/client";
import { db } from "@/lib/db";
import { CREMA, TINTA } from "./milo";
import { PedidoProvider, BarraPedido } from "./pedido-store";
import { Catalogo } from "./catalogo";
import { MiloEstilos, MiloCinta, MiloHeader, MiloFooterMini } from "./milo-chrome";

/** Pestaña Catálogo de Casa Milo: el catálogo completo con SU estética. */
export async function CatalogoMilo({ tenant }: { tenant: Client }) {
  const st = (tenant.settings ?? {}) as { anuncio?: string; minimoKg?: number };
  const wa = tenant.whatsapp?.replace(/\D/g, "") || null;
  const base = `/sitio/${tenant.slug}`;
  const productos = await db.bazarProducto.findMany({
    where: { clientId: tenant.id, activo: true },
    orderBy: [{ categoria: "asc" }, { precio: "asc" }],
    select: { id: true, nombre: true, precio: true, descripcion: true, categoria: true, fotos: true },
  });
  const fotosDe = (f: unknown) => (Array.isArray(f) ? f.filter((x): x is string => typeof x === "string") : []);
  const promesas = (st.anuncio ?? "Entrega en el día en CABA · Milanesas y pollo premium · Envío sin cargo desde $60.000 · Rebozado propio, sin conservantes · Pedido mínimo 2 kg")
    .split("·").map((p) => p.trim()).filter(Boolean);

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
            { href: `${base}#como`, label: "Cómo funciona" },
            { href: `${base}#cobertura`, label: "Cobertura" },
          ]}
        />
        <Catalogo
          productos={productos.map((p) => ({
            id: p.id,
            nombre: p.nombre,
            precio: p.precio,
            descripcion: p.descripcion ?? "",
            categoria: p.categoria,
            fotos: fotosDe(p.fotos),
          }))}
        />
        <MiloFooterMini base={base} wa={wa} />
        <BarraPedido whatsapp={wa} minimoKg={st.minimoKg} base={base} />
      </div>
    </PedidoProvider>
  );
}
