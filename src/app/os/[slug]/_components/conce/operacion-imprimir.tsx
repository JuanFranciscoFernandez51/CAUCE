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

  const filaCls = "flex justify-between gap-4 border-b border-gray-200 py-1 text-[13px]";

  // Membrete: razón social, CUIT, domicilios y contacto del negocio.
  const contacto = [
    (s.whatsapps ?? []).map((w) => w.replace(/\D/g, "")).filter(Boolean).join(" · "),
    tenant.email ?? "",
  ]
    .filter(Boolean)
    .join(" · ");
  const datosNegocio = [
    s.razonSocial ? `${s.razonSocial}${s.cuit ? ` · CUIT ${s.cuit}` : ""}` : s.cuit ? `CUIT ${s.cuit}` : "",
    (s.sucursales ?? []).map((su) => su.direccion).join(" · "),
    contacto,
  ]
    .filter(Boolean)
    .join("\n");

  // Datos identificatorios del vehículo: la operación manda, el stock completa.
  const dominio = op.dominio || op.vehiculo?.dominio || "";
  const chasis = op.chasis || "";
  const motorNro = op.motorNro || op.vehiculo?.motor || "";

  return (
    <Imprimible
      negocio={branding.displayName}
      primary={branding.primary}
      titulo={
        esMandato
          ? `Mandato de venta ${numeroOperacion(op.tipo, op.numero)}`
          : `Boleto de compraventa ${numeroOperacion(op.tipo, op.numero)}`
      }
      fecha={`Bahía Blanca, ${fecha}`}
      datosNegocio={datosNegocio}
    >
      <div className="space-y-3.5">
        <section>
          <h3 className="mb-1 text-[12px] font-bold uppercase tracking-wide" style={{ color: branding.primary }}>
            {esMandato ? "Mandante (titular del vehículo)" : "Comprador"}
          </h3>
          <div className={filaCls}><span className="text-gray-500">Nombre y apellido</span><span className="font-semibold">{op.nombre}</span></div>
          {op.dni ? <div className={filaCls}><span className="text-gray-500">DNI / CUIT</span><span className="font-semibold">{op.dni}</span></div> : null}
          {op.domicilio ? <div className={filaCls}><span className="text-gray-500">Domicilio</span><span className="font-semibold">{op.domicilio}</span></div> : null}
          {op.telefono ? <div className={filaCls}><span className="text-gray-500">Teléfono</span><span className="font-semibold">{op.telefono}</span></div> : null}
          {op.email ? <div className={filaCls}><span className="text-gray-500">Email</span><span className="font-semibold">{op.email}</span></div> : null}
        </section>

        <section>
          <h3 className="mb-1 text-[12px] font-bold uppercase tracking-wide" style={{ color: branding.primary }}>
            Vehículo
          </h3>
          <div className={filaCls}><span className="text-gray-500">Unidad</span><span className="font-semibold">{vehiculoTitulo}</span></div>
          <div className={filaCls}><span className="text-gray-500">Dominio</span><span className="font-semibold">{dominio || "—"}</span></div>
          <div className={filaCls}><span className="text-gray-500">Nº de chasis</span><span className="font-semibold">{chasis || "—"}</span></div>
          <div className={filaCls}><span className="text-gray-500">Nº de motor</span><span className="font-semibold">{motorNro || "—"}</span></div>
          {op.vehiculo && !op.vehiculo.dominio && op.vehiculo.km > 0 ? (
            <div className={filaCls}><span className="text-gray-500">Kilometraje declarado</span><span className="font-semibold">{op.vehiculo.km.toLocaleString("es-AR")} km</span></div>
          ) : null}
        </section>

        {docs.length > 0 ? (
          <section>
            <h3 className="mb-1 text-[12px] font-bold uppercase tracking-wide" style={{ color: branding.primary }}>
              Documentación entregada
            </h3>
            <div className="grid grid-cols-3 gap-x-5">
              {docs.map((d) => (
                <p key={d.item} className="py-0.5 text-[12px]">
                  {d.ok ? "☑" : "☐"} {d.item}
                </p>
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <h3 className="mb-1 text-[12px] font-bold uppercase tracking-wide" style={{ color: branding.primary }}>
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
            <p className="mt-2 whitespace-pre-line text-[12px] leading-snug text-gray-700">{op.condiciones}</p>
          ) : null}
        </section>

        {permutas.length > 0 ? (
          <section>
            <h3 className="mb-1 text-[12px] font-bold uppercase tracking-wide" style={{ color: branding.primary }}>
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
            <h3 className="mb-1 text-[12px] font-bold uppercase tracking-wide" style={{ color: branding.primary }}>
              Observaciones
            </h3>
            <p className="whitespace-pre-line text-[12px] leading-snug text-gray-700">{op.observaciones}</p>
          </section>
        ) : null}

        <section>
          <h3 className="mb-1 text-[12px] font-bold uppercase tracking-wide" style={{ color: branding.primary }}>
            Términos y condiciones
          </h3>
          <ol className="list-decimal space-y-0.5 pl-4 text-[10px] leading-snug text-gray-600">
            {(esMandato ? TERMINOS_MANDATO : TERMINOS_BOLETO).map((t) => (
              <li key={t}>{t.replace("{negocio}", branding.displayName)}</li>
            ))}
          </ol>
        </section>

        <section className="pt-3 text-[12px] text-gray-600">
          <div className="mt-10 grid grid-cols-2 gap-10 text-center">
            <div>
              <div className="border-t border-gray-400 pt-1.5">
                Firma {esMandato ? "del mandante" : "del comprador"}
                <span className="block text-[10px] text-gray-400">Aclaración y DNI</span>
              </div>
            </div>
            <div>
              <div className="border-t border-gray-400 pt-1.5">
                Por {branding.displayName}
                <span className="block text-[10px] text-gray-400">Firma y sello</span>
              </div>
            </div>
          </div>
          <p className="mt-4 text-center text-[10px] text-gray-400">
            {(s.sucursales ?? []).map((su) => su.direccion).join(" · ")}
            {s.horarios ? ` · ${s.horarios}` : ""}
          </p>
        </section>
      </div>
    </Imprimible>
  );
}


/** Cláusulas del mandato de venta (concesionaria). {negocio} se reemplaza en el render. */
const TERMINOS_MANDATO = [
  "El mandante declara ser el único titular del vehículo descripto, que el mismo se encuentra libre de deudas, gravámenes, embargos, prendas e infracciones, y que la documentación entregada es auténtica.",
  "El mandante autoriza a {negocio} a exhibir el vehículo en su local comercial, publicarlo en su página web, redes sociales y portales de venta, y a tomar fotografías con ese fin.",
  "{negocio} gestionará la venta al precio pactado. Toda oferta por un valor menor será comunicada al mandante, y sólo se aceptará con su conformidad expresa.",
  "La comisión acordada se calcula sobre el precio final de venta y se descuenta al momento de liquidar al mandante.",
  "El presente mandato tiene validez desde su firma y hasta la fecha de vencimiento indicada. Puede ser renovado de común acuerdo entre las partes.",
  "El mandante podrá retirar la unidad notificando a {negocio} con 48 horas de anticipación, siempre que no exista oferta aceptada ni seña recibida.",
  "Los gastos de traslado, limpieza, reparaciones menores y preparación para la venta corren por cuenta del mandante, salvo pacto expreso en contrario.",
  "{negocio} no se responsabiliza por vicios ocultos ni por el estado mecánico de la unidad, cuya declaración es responsabilidad exclusiva del mandante.",
  "Ante cualquier controversia, las partes se someten a los Tribunales Ordinarios de Bahía Blanca, renunciando a todo otro fuero o jurisdicción.",
];

/** Cláusulas del boleto de compraventa. */
const TERMINOS_BOLETO = [
  "El vendedor declara que el vehículo se encuentra libre de deudas, gravámenes, embargos, prendas e infracciones a la fecha de la presente operación.",
  "La seña entregada se imputa como parte de pago del precio total convenido y confirma la operación entre las partes.",
  "El saldo se abonará en la forma y plazos pactados. La entrega de la unidad se realiza contra la cancelación total del precio.",
  "Las unidades tomadas en permuta se reciben en el estado en que se encuentran, con la documentación al día y por el valor consignado en este documento.",
  "Los gastos de transferencia, verificación policial, formularios y sellados corren por cuenta del comprador, salvo pacto expreso en contrario.",
  "El comprador declara haber revisado la unidad, conocer su estado general y aceptarla en las condiciones en que se encuentra.",
  "La unidad usada se vende sin garantía mecánica, salvo la garantía escrita que expresamente se otorgue por separado.",
  "El desistimiento del comprador faculta a {negocio} a retener la seña en concepto de indemnización por los gastos incurridos.",
  "Ante cualquier controversia, las partes se someten a los Tribunales Ordinarios de Bahía Blanca, renunciando a todo otro fuero o jurisdicción.",
];
