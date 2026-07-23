"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { path: "", label: "Resumen", exact: true },
  { path: "/movimientos", label: "Movimientos" },
  { path: "/mensual", label: "Mensual" },
  { path: "/anual", label: "Anual" },
  { path: "/cuentas", label: "Cuentas" },
  { path: "/cartera", label: "Cartera" },
  { path: "/costos-fijos", label: "Costos fijos" },
  { path: "/proveedores", label: "🏭 Proveedores" },
];

/** Pills de navegación de Finanzas (sub-rutas de /os/[slug]/caja). */
export function FinanzasNav({ slug }: { slug: string }) {
  const pathname = usePathname();
  const base = `/os/${slug}/caja`;
  return (
    <div className="-mx-1 flex flex-wrap items-center gap-1.5 border-b pb-3">
      {TABS.map((t) => {
        const href = `${base}${t.path}`;
        const active = t.exact
          ? pathname === href
          : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={t.path}
            href={href}
            aria-current={active ? "page" : undefined}
            className={[
              "shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary-soft text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            ].join(" ")}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
