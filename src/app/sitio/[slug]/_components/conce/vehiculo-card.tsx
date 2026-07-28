import Link from "next/link";
import { fmtKm, fmtPrecioVehiculo, nombreVehiculo } from "@/lib/conce";
import type { ConceCardData } from "../../_lib/conce-site";
import { RC } from "@/lib/conce";

/**
 * Card de vehículo del sitio: foto grande, badges diferenciados 0KM/Usado
 * (+ Destacado/Oferta/Reservado), marca modelo versión, año · km, precio en
 * su moneda o "Consultar precio". Mega-tarjeta redondeada estilo Menta.
 */
export function VehiculoCard({ slug, v }: { slug: string; v: ConceCardData }) {
  const es0km = v.condicion === "0km";
  return (
    <Link
      href={`/sitio/${slug}/vehiculo/${v.slug}`}
      className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
      style={{ border: `1px solid ${RC.borde}` }}
    >
      <div className="relative aspect-[4/3] overflow-hidden" style={{ backgroundColor: "#F1EFE9" }}>
        {v.foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={v.foto}
            alt={`${nombreVehiculo(v)} ${v.anio}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl">🚗</div>
        )}
        {/* Badges */}
        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
          {es0km ? (
            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide"
              style={{ backgroundColor: RC.dorado, color: "#0A0A0A" }}
            >
              0KM
            </span>
          ) : (
            <span className="rounded-full bg-black/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
              Usado
            </span>
          )}
          {v.oferta ? (
            <span className="rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white" style={{ backgroundColor: "#EF4444" }}>
              Oferta
            </span>
          ) : null}
          {v.destacado ? (
            <span className="rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide" style={{ backgroundColor: "#FACC15", color: "#713F12" }}>
              ⭐ Destacado
            </span>
          ) : null}
        </div>
        {v.estado === "reservado" ? (
          <div className="absolute inset-x-0 bottom-0 bg-black/70 py-1.5 text-center text-xs font-bold uppercase tracking-widest text-white">
            Reservado
          </div>
        ) : null}
        {v.fotosCount > 1 ? (
          <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
            📷 {v.fotosCount}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: RC.doradoTexto }}>
          {v.marca}
        </p>
        <h3 className="mt-0.5 line-clamp-2 text-[15px] font-bold leading-snug">
          {v.modelo}
          {v.version ? <span className="font-medium text-gray-500"> {v.version}</span> : null}
        </h3>
        <p className="mt-1 text-[13px] text-gray-500">
          {v.anio} · {es0km ? "0 km" : fmtKm(v.km)}
          {v.transmision ? ` · ${v.transmision}` : ""}
        </p>
        <p className="mt-auto pt-3 text-lg font-extrabold tracking-tight">
          {v.precio == null || v.precio <= 0 ? (
            <span style={{ color: RC.doradoTexto }}>Consultar precio</span>
          ) : (
            fmtPrecioVehiculo(v.precio, v.moneda)
          )}
        </p>
      </div>
    </Link>
  );
}
