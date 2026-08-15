"use client";

/**
 * Envoltorios client de la biblioteca de animaciones (src/components/animaciones)
 * para la home pública. Los portados usan @ts-nocheck, así que acá se castean
 * `as any` (mismo criterio que registro.tsx) y quedan con la config "Cauce":
 * colores del brand, dosis contenida y prefers-reduced-motion respetado.
 */
import { useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import DepthCarouselRaw from "@/components/animaciones/DepthCarousel";
import ScrollRevealRaw from "@/components/animaciones/ScrollReveal";
import TextLoopRaw from "@/components/animaciones/TextLoop";
import BorderGlowRaw from "@/components/animaciones/BorderGlow";
import { useLang } from "@/components/public/site-controls";

/* eslint-disable @typescript-eslint/no-explicit-any */
const DepthCarousel = DepthCarouselRaw as any;
const ScrollReveal = ScrollRevealRaw as any;
const TextLoop = TextLoopRaw as any;
const BorderGlow = BorderGlowRaw as any;
// WebGL puro: solo en el cliente.
const SpecularButton = dynamic(() => import("@/components/animaciones/SpecularButton"), {
  ssr: false,
}) as any;

function useMedia(query: string): boolean {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const f = () => setOk(mq.matches);
    f();
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, [query]);
  return ok;
}

const useReducido = () => useMedia("(prefers-reduced-motion: reduce)");

// ── Manifiesto: texto grande que se revela palabra por palabra al scroll ──
// El Traductor no puede traducir palabra por palabra, así que el texto en
// inglés viene por prop y el bloque queda marcado data-sin-traducir.
export function Manifiesto({ es, en }: { es: string; en: string }) {
  const lang = useLang();
  const reducido = useReducido();
  const texto = lang === "en" ? en : es;

  if (reducido) {
    return (
      <h2 data-sin-traducir className="manifiesto-texto">
        {texto}
      </h2>
    );
  }
  return (
    <div data-sin-traducir>
      <ScrollReveal
        key={texto}
        baseOpacity={0.08}
        enableBlur
        baseRotation={2}
        blurStrength={5}
        containerClassName="!my-0"
        textClassName="manifiesto-texto"
      >
        {texto}
      </ScrollReveal>
    </div>
  );
}

// ── Carrusel 3D con las capturas reales del producto ──
export function CarruselCasos({
  items,
}: {
  items: { image: string; alt: string }[];
}) {
  const reducido = useReducido();
  const ancho = useMedia("(min-width: 640px)");
  return (
    <div className="relative h-[300px] sm:h-[420px]">
      <DepthCarousel
        items={items}
        cardWidth={ancho ? 470 : 280}
        cardHeight={ancho ? 294 : 175}
        radius={16}
        depth={ancho ? 190 : 120}
        spread={ancho ? 74 : 48}
        tilt={12}
        visibleCards={3}
        blur={5}
        autoplay={!reducido}
        autoplayDelay={3600}
        loop
        showControls
        showIndicators={false}
      />
    </div>
  );
}

// ── Cinta con el claim recorriendo una curva (separador de secciones) ──
// El texto vive en un SVG (el Traductor no lo toca): es branding, queda igual
// en los dos idiomas. TextLoop ya respeta prefers-reduced-motion por su cuenta.
export function CintaClaim({ texto }: { texto: string }) {
  return (
    <div aria-hidden className="cinta-claim" data-sin-traducir>
      <TextLoop
        text={texto}
        shape="wave"
        speed={70}
        curviness={58}
        fontSize={44}
        fontWeight={600}
        letterSpacing={1}
        color="#f6f8f3"
        ribbon
        ribbonColor="#2f6e46"
        ribbonWidth={78}
      />
    </div>
  );
}

// ── Card con borde que brilla cerca del mouse (precios/planes) ──
export function CardGlow({
  children,
  className = "",
  destacada = false,
}: {
  children: ReactNode;
  className?: string;
  destacada?: boolean;
}) {
  return (
    <BorderGlow
      glowColor="145 55 62"
      backgroundColor="var(--card)"
      borderRadius={24}
      animated={destacada}
      colors={["#4ade80", "#7fe8ff", "#2e6bff"]}
      className={`card-glow h-full ${className}`}
    >
      {children}
    </BorderGlow>
  );
}

// ── CTA de vidrio con brillo especular (WebGL), abre un link ──
export function BotonEspecular({ href, children }: { href: string; children: string }) {
  return (
    <SpecularButton
      size="lg"
      radius={999}
      followMouse
      proximity={300}
      onClick={() => window.open(href, "_blank", "noopener,noreferrer")}
    >
      {children}
    </SpecularButton>
  );
}
