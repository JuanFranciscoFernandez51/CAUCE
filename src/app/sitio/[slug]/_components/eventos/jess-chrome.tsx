import Link from "next/link";
import type { Client } from "@prisma/client";

/**
 * Header y footer compartidos de la web de Jess Design: los usan el home
 * y las pestañas Conócenos y Nuestros trabajos.
 */
export const JESS_TINTA = "#1A1816";
export const JESS_CREMA = "#EDE8DE";
export const JESS_TOPO = "#9E9387";
export const JESS_TERRA = "#B85850";

export function jessDatos(tenant: Client) {
  const logo = ((tenant.branding as { logo?: string } | null)?.logo) ?? null;
  const st = (tenant.settings ?? {}) as {
    instagram?: string;
    plantillaCotizacion?: { servicios?: { nombre: string; items: string[] }[] };
    tiposEvento?: string[];
    fotosTrabajos?: { url: string; texto?: string }[];
  };
  return {
    logo,
    st,
    ig: st.instagram ?? "jessdesign.bb",
    wa: tenant.whatsapp?.replace(/\D/g, ""),
    base: `/sitio/${tenant.slug}`,
  };
}

export function JessHeader({ logo, ig, base, activa }: { logo: string | null; ig: string; base: string; activa?: "inicio" | "conocenos" | "trabajos" }) {
  const item = (on: boolean) => `transition hover:opacity-60 ${on ? "underline underline-offset-8" : ""}`;
  return (
    <header className="sticky top-0 z-40" style={{ backgroundColor: JESS_TINTA, color: JESS_CREMA }}>
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-6 px-6 py-4">
        <Link href={base} className="flex items-center gap-3">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="Jess Design" className="h-11 w-auto" />
          ) : null}
          <span>
            <span className="block text-[15px] font-semibold tracking-[0.34em]">JESS</span>
            <span className="block text-[9px] tracking-[0.5em] opacity-70">DESIGN</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-[11px] font-medium tracking-[0.22em] md:flex">
          <Link href={base} className={item(activa === "inicio")}>INICIO</Link>
          <Link href={`${base}/conocenos`} className={item(activa === "conocenos")}>CONÓCENOS</Link>
          <Link href={`${base}/trabajos`} className={item(activa === "trabajos")}>NUESTROS TRABAJOS</Link>
          <a href={`${base}#contacto`} className="transition hover:opacity-60">CONTACTO</a>
        </nav>
        <a
          href={`https://www.instagram.com/${ig}/`}
          target="_blank"
          rel="noreferrer"
          className="border px-5 py-2.5 text-[11px] font-medium tracking-[0.18em] transition hover:opacity-80"
          style={{ borderColor: "rgba(237,232,222,.4)" }}
        >
          @{ig.toUpperCase()}
        </a>
      </div>
    </header>
  );
}

export function JessFooter({ logo, ig }: { logo: string | null; ig: string }) {
  return (
    <footer style={{ backgroundColor: JESS_TINTA, color: JESS_CREMA }}>
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-6 py-10">
        <span className="flex items-center gap-4">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" className="h-14 w-auto" />
          ) : null}
          <p className="text-[22px] tracking-[0.3em]" style={{ fontFamily: "var(--font-italiana)" }}>JESS DESIGN</p>
        </span>
        <p className="text-[20px]" style={{ fontFamily: "var(--font-pinyon)", color: JESS_TOPO }}>
          Sofisticación en cada detalle
        </p>
        <p className="text-[12px] opacity-60">© 2026 Jess Design · @{ig}</p>
      </div>
    </footer>
  );
}
