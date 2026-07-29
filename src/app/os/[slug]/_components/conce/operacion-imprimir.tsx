import { notFound, redirect } from "next/navigation";
import type { Client } from "@prisma/client";
import { db } from "@/lib/db";
import { tenantBranding } from "@/lib/tenant";
import { conceSettings } from "@/lib/conce-server";
import { fmtPrecioVehiculo, nombreVehiculo, numeroOperacion, permutasDe, rutaOperacion } from "@/lib/conce";
import { Imprimible } from "../imprimible";

/**
 * PDF imprimible del mandato de venta / boleto con la marca de la
 * concesionaria (patrón Imprimible del OS: hoja A4, chrome oculto).
 * Cada módulo tiene su propio PDF, con su numeración (MV / BC).
 */
export async function OperacionImprimir({
  tenant,
  id,
  tipo,
}: {
  tenant: Client;
  id: string;
  tipo: "MANDATO" | "BOLETO";
}) {
  const op = await db.conceOperacion.findFirst({
    where: { id, clientId: tenant.id },
    include: {
      vehiculo: {
        select: { marca: true, modelo: true, version: true, anio: true, km: true, dominio: true, motor: true },
      },
    },
  });
  if (!op) notFound();
  if (op.tipo !== tipo) redirect(`/os/${tenant.slug}/${rutaOperacion(op.tipo)}/${op.id}/imprimir`);

  const branding = tenantBranding(tenant);
  const s = conceSettings(tenant);
  const esMandato = op.tipo === "MANDATO";
  const docs = Array.isArray(op.documentacion)
    ? (op.documentacion as { item: string; ok: boolean }[])
    : [];
  const permutas = permutasDe(op.permutas);

  const vehiculoTitulo = op.vehiculo
    ? `${nombreVehiculo(op.vehiculo)} ${op.vehiculo.anio}`
    : (op.vehiculoTexto ?? "—");

  const fecha = op.fecha.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  });

  const filaCls = "flex justify-between gap-4 border-b border-gray-200 py-1.5 text-sm";

  return (
    <Imprimible
      negocio={branding.displayName}
      primary={branding.primary}
      titulo={
        esMandato
          ? `Mandato de venta ${numeroOperacion(op.tipo, op.numero)}`
          : `Boleto de compraventa ${numeroOperacion(op.tipo, op.numero)}`
      }
      subtitulo={`Bahía Blanca, ${fecha}`}
    >
      <div className="space-y-6">
        <section>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide" style={{ color: branding.primary }}>
            {esMandato ? "Mandante (titular del vehículo)" : "Comprador"}
          </h3>
          <div className={filaCls}><span className="text-gray-500">Nombre y apellido</span><span className="font-semibold">{op.nombre}</span></div>
          {op.dni ? <div className={filaCls}><span className="text-gray-500">DNI / CUIT</span><span className="font-semibold">{op.dni}</span></div> : null}
          {op.domicilio ? <div className={filaCls}><span className="text-gray-500">Domicilio</span><span className="font-semibold">{op.domicilio}</span></div> : null}
          {op.telefono ? <div className={filaCls}><span className="text-gray-500">Teléfono</span><span className="font-semibold">{op.telefono}</span></div> : null}
          {op.email ? <div className={filaCls}><span className="text-gray-500">Email</span><span className="font-semibold">{op.email}</span></div> : null}
        </section>

        <section>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide" style={{ color: branding.primary }}>
            Vehículo
          </h3>
          <div className={filaCls}><span className="text-gray-500">Unidad</span><span className="font-semibold">{vehiculoTitulo}</span></div>
          {op.dominio || op.vehiculo?.dominio ? (
            <div className={filaCls}><span className="text-gray-500">Dominio</span><span className="font-semibold">{op.dominio ?? op.vehiculo?.dominio}</span></div>
          ) : null}
          {op.chasis ? <div className={filaCls}><span className="text-gray-500">Nº de chasis</span><span className="font-semibold">{op.chasis}</span></div> : null}
          {op.motorNro ? <div className={filaCls}><span className="text-gray-500">Nº de motor</span><span className="font-semibold">{op.motorNro}</span></div> : null}
          {op.vehiculo && !op.vehiculo.dominio && op.vehiculo.km > 0 ? (
            <div className={filaCls}><span className="text-gray-500">Kilometraje declarado</span><span className="font-semibold">{op.vehiculo.km.toLocaleString("es-AR")} km</span></div>
          ) : null}
        </section>

        {docs.length > 0 ? (
          <section>
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wide" style={{ color: branding.primary }}>
              Documentación entregada
            </h3>
            <div className="grid grid-cols-2 gap-x-6">
              {docs.map((d) => (
                <p key={d.item} className="py-0.5 text-sm">
                  {d.ok ? "☑" : "☐"} {d.item}
                </p>
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide" style={{ color: branding.primary }}>
            Condiciones económicas
          </h3>
          <div className={filaCls}>
            <span className="text-gray-500">{esMandato ? "Precio de venta pactado" : "Precio de la operación"}</span>
            <span className="font-bold">{fmtPrecioVehiculo(op.precio, op.moneda)}</span>
          </div>
          {esMandato && op.comisionPct ? (
            <div className={filaCls}><span className="text-gray-500">Comisión por la venta</span><span className="font-semibold">{op.comisionPct}%</span></div>
          ) : null}
          {!esMandato && op.sena > 0 ? (
            <div className={filaCls}><span className="text-gray-500">Seña / anticipo</span><span className="font-semibold">{fmtPrecioVehiculo(op.sena, op.moneda)}</span></div>
          ) : null}
          {op.formaPago ? (
            <div className={filaCls}><span className="text-gray-500">Forma de pago</span><span className="font-semibold">{op.formaPago}</span></div>
          ) : null}
          {op.condiciones ? (
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-700">{op.condiciones}</p>
          ) : null}
        </section>

        {permutas.length > 0 ? (
          <section>
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wide" style={{ color: branding.primary }}>
              Unidades tomadas en permuta
            </h3>
            {permutas.map((p, i) => (
              <div key={i} className={filaCls}>
                <span className="text-gray-500">
                  {[p.marca, p.modelo, p.anio].filter(Boolean).join(" ")}
                  {p.dominio ? ` — ${p.dominio}` : ""}
                  {p.km ? ` — ${Number(p.km).toLocaleString("es-AR")} km` : ""}
                </span>
                <span className="font-semibold">{fmtPrecioVehiculo(p.valorTomado, op.moneda)}</span>
              </div>
            ))}
          </section>
        ) : null}

        {op.observaciones ? (
          <section>
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wide" style={{ color: branding.primary }}>
              Observaciones
            </h3>
            <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">{op.observaciones}</p>
          </section>
        ) : null}

        <section className="pt-6 text-sm text-gray-600">
          <p>
            {esMandato
              ? `El mandante autoriza a ${branding.displayName} a exhibir y gestionar la venta del vehículo detallado, en los términos y condiciones acá pactados.`
              : `Las partes suscriben la presente orden de compra por el vehículo detallado, en los términos y condiciones acá pactados.`}
          </p>
          <div className="mt-14 grid grid-cols-2 gap-10 text-center">
            <div>
              <div className="border-t border-gray-400 pt-2">
                Firma {esMandato ? "del mandante" : "del comprador"}
              </div>
            </div>
            <div>
              <div className="border-t border-gray-400 pt-2">Por {branding.displayName}</div>
            </div>
          </div>
          <p className="mt-8 text-center text-xs text-gray-400">
            {(s.sucursales ?? []).map((su) => su.direccion).join(" · ")}
            {s.horarios ? ` · ${s.horarios}` : ""}
          </p>
        </section>
      </div>
    </Imprimible>
  );
}
