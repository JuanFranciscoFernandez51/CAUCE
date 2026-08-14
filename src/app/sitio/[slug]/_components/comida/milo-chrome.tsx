"use client";

import Link from "next/link";
import { useCarrito } from "../bazar/carrito-store";
import { BORDO, CREMA, CELESTE, TINTA, TENUE } from "./milo";

/**
 * Chrome compartido de Casa Milo: cinta de promesas, header con iconos
 * (lupa · WhatsApp · carrito) y footer. Lo usan el home, el catálogo,
 * el carrito y términos para que TODA la web tenga una sola estética.
 */
export function MiloEstilos() {
  return (
    <style>{`
      @keyframes milo-kenburns { from { transform: scale(1.02); } to { transform: scale(1.1); } }
      .milo-kenburns { animation: milo-kenburns 16s ease-in-out infinite alternate; }
      @keyframes milo-cinta { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      .milo-cinta { overflow: hidden; }
      .milo-cinta-tira { display: inline-flex; white-space: nowrap; width: max-content; animation: milo-cinta 30s linear infinite; }
      .milo-cinta:hover .milo-cinta-tira { animation-play-state: paused; }
      .milo-link { background: linear-gradient(currentColor, currentColor) no-repeat left bottom / 0% 1.5px; padding-bottom: 3px; transition: background-size 0.2s ease; }
      .milo-link:hover { background-size: 100% 1.5px; }
      @keyframes milo-pop { 0% { transform: scale(1); } 40% { transform: scale(1.07); } 100% { transform: scale(1); } }
      .milo-pop { animation: milo-pop 0.3s ease-out; }
      .milo-paso { transition: transform 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease; }
      .milo-paso:hover { transform: translateY(-6px); background-color: #FFFDF6; box-shadow: 0 16px 34px rgba(58,18,24,0.13); }
      .milo-paso:hover .milo-paso-num { color: #7A303B; }
      .milo-paso-num { transition: color 0.3s ease; }
      .milo-carrusel { scroll-snap-type: x mandatory; }
      .milo-carrusel > * { scroll-snap-align: start; }
      @media (prefers-reduced-motion: reduce) {
        .milo-kenburns, .milo-cinta-tira, .milo-pop { animation: none; }
        .milo-paso { transition: none; } .milo-paso:hover { transform: none; }
        .milo-link { transition: none; }
      }
    `}</style>
  );
}

export function MiloCinta({ promesas }: { promesas: string[] }) {
  const tanda = [...promesas, ...promesas, ...promesas, ...promesas];
  return (
    <div className="milo-cinta" style={{ backgroundColor: BORDO, color: CREMA }}>
      <div className="milo-cinta-tira py-2.5">
        {tanda.map((p, i) => (
          <span key={i} className="px-5 text-[13px] font-semibold uppercase" style={{ letterSpacing: "0.14em" }}>
            {p} <span className="pl-5" style={{ color: CELESTE }}>•</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function IconoLupa({ base }: { base: string }) {
  return (
    <Link href={`${base}/catalogo`} aria-label="Buscar" title="Buscar en el catálogo" className="p-2 transition-all duration-200 hover:-translate-y-0.5 hover:opacity-70 active:scale-[0.95] motion-reduce:transform-none">
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={BORDO} strokeWidth="2.2" strokeLinecap="round">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.8-3.8" />
      </svg>
    </Link>
  );
}

/** WhatsApp flotante celeste, abajo a la derecha. Se corre cuando aparece la barra del pedido. */
export function WhatsAppFlotante({ wa }: { wa: string | null }) {
  const { cantidadTotal } = useCarrito();
  if (!wa) return null;
  return (
    <a
      href={`https://wa.me/${wa}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Escribinos por WhatsApp"
      title="Escribinos por WhatsApp"
      className="fixed right-5 z-[70] flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-[0.95] motion-reduce:transform-none"
      style={{ backgroundColor: CELESTE, bottom: cantidadTotal ? 104 : 20 }}
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="#7A303B">
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm5.5 14.1c-.2.7-1.3 1.3-1.9 1.4-.5.1-1.1.2-3.4-.7-2.9-1.2-4.7-4.1-4.9-4.3-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.4l.9 2.1c.1.2.1.4 0 .6l-.4.6-.5.5c-.2.2-.3.3-.1.6.2.3.9 1.4 1.9 2.3 1.3 1.2 2.4 1.5 2.7 1.7.3.1.5.1.7-.1l1-1.2c.2-.3.4-.2.7-.1l2.1 1c.3.2.5.3.6.4.1.2.1.7-.1 1.3Z" />
      </svg>
    </a>
  );
}

function IconoCarrito({ base }: { base: string }) {
  const { cantidadTotal } = useCarrito();
  return (
    <Link href={`${base}/carrito`} aria-label="Tu carrito" title="Tu carrito" className="relative p-2 transition-all duration-200 hover:-translate-y-0.5 hover:opacity-70 active:scale-[0.95] motion-reduce:transform-none">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={BORDO} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="20" r="1.4" />
        <circle cx="17.5" cy="20" r="1.4" />
        <path d="M2.5 3h2.2l2.5 12.2a1.6 1.6 0 0 0 1.6 1.3h8.6a1.6 1.6 0 0 0 1.6-1.2L21 7H5.2" />
      </svg>
      {cantidadTotal ? (
        <span
          className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold"
          style={{ backgroundColor: BORDO, color: CREMA }}
        >
          {cantidadTotal}
        </span>
      ) : null}
    </Link>
  );
}

export function MiloHeader({ base, wa, nav }: { base: string; wa: string | null; nav: { href: string; label: string }[] }) {
  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-[8px]"
      style={{ backgroundColor: "rgba(254,250,239,0.94)", borderBottom: "1px solid rgba(122,48,59,0.16)" }}
    >
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-6 px-7 py-4">
        <Link
          href={base}
          className="text-[30px] font-black"
          style={{ fontFamily: "var(--font-bodoni)", color: BORDO, letterSpacing: "-0.02em" }}
        >
          Casa Milo
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="milo-link text-[15px] font-medium" style={{ color: TINTA }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <IconoLupa base={base} />
          <IconoCarrito base={base} />
        </div>
      </div>
    </header>
  );
}

/** Logos de medios de pago (tipográficos, sin assets externos). */
export function MediosDePago() {
  const chip = "flex h-9 items-center justify-center rounded-[3px] bg-white px-3";
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <span className={chip} style={{ border: "1px solid rgba(122,48,59,0.15)" }}>
        <span className="text-[15px] font-black italic tracking-tight" style={{ color: "#1A1F71" }}>VISA</span>
      </span>
      <span className={chip} style={{ border: "1px solid rgba(122,48,59,0.15)" }}>
        <span className="relative mr-1 inline-block h-4 w-7">
          <span className="absolute left-0 top-0 h-4 w-4 rounded-full" style={{ backgroundColor: "#EB001B" }} />
          <span className="absolute right-0 top-0 h-4 w-4 rounded-full opacity-90" style={{ backgroundColor: "#F79E1B" }} />
        </span>
        <span className="text-[11px] font-bold" style={{ color: "#3A1218" }}>mastercard</span>
      </span>
      <span className={chip} style={{ backgroundColor: "#016FD0" }}>
        <span className="text-[11px] font-black tracking-wide text-white">AMEX</span>
      </span>
      <span className={chip} style={{ backgroundColor: "#00AEEF" }}>
        <span className="text-[12px] font-bold text-white">mercado pago</span>
      </span>
      <span className="text-[13px]" style={{ color: TENUE }}>3 y 6 cuotas · efectivo al recibir</span>
    </div>
  );
}

export function MiloFooterMini({ base, wa }: { base: string; wa: string | null }) {
  return (
    <footer className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-4 px-7 py-10">
      <p className="text-[24px] font-black" style={{ fontFamily: "var(--font-bodoni)", color: BORDO }}>
        Casa Milo
      </p>
      <div className="flex flex-wrap items-center gap-6 text-[14px]">
        <Link href={base} className="milo-link" style={{ color: TINTA }}>Inicio</Link>
        <Link href={`${base}/catalogo`} className="milo-link" style={{ color: TINTA }}>Catálogo</Link>
        <Link href={`${base}/terminos`} className="milo-link" style={{ color: TINTA }}>Términos y condiciones</Link>
        {wa ? <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="milo-link" style={{ color: TINTA }}>WhatsApp</a> : null}
      </div>
    </footer>
  );
}
