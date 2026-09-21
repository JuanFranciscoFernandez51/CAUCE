"use client";

/**
 * React Bits (MIT + Commons Clause) · categoría "Animaciones".
 * Fuente de cada componente: src/components/animaciones/rb/animations/<Nombre>/<Nombre>.tsx
 */
import { useRef } from "react";
import dynamic from "next/dynamic";
import { Caja, type Animacion } from "../tipos";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Todos van solo en el cliente: varios tocan window/canvas/WebGL al montar.
const AnimatedContent = dynamic(() => import("./animations/AnimatedContent/AnimatedContent"), { ssr: false }) as any;
const Antigravity = dynamic(() => import("./animations/Antigravity/Antigravity"), { ssr: false }) as any;
const BlobCursor = dynamic(() => import("./animations/BlobCursor/BlobCursor"), { ssr: false }) as any;
const ClickSpark = dynamic(() => import("./animations/ClickSpark/ClickSpark"), { ssr: false }) as any;
const Crosshair = dynamic(() => import("./animations/Crosshair/Crosshair"), { ssr: false }) as any;
const Cubes = dynamic(() => import("./animations/Cubes/Cubes"), { ssr: false }) as any;
const CursorGrid = dynamic(() => import("./animations/CursorGrid/CursorGrid"), { ssr: false }) as any;
const ElasticMesh = dynamic(() => import("./animations/ElasticMesh/ElasticMesh"), { ssr: false }) as any;
const ElectricBorder = dynamic(() => import("./animations/ElectricBorder/ElectricBorder"), { ssr: false }) as any;
const FadeContent = dynamic(() => import("./animations/FadeContent/FadeContent"), { ssr: false }) as any;
const GhostCursor = dynamic(() => import("./animations/GhostCursor/GhostCursor"), { ssr: false }) as any;
const GlareHover = dynamic(() => import("./animations/GlareHover/GlareHover"), { ssr: false }) as any;
const GlowCursor = dynamic(() => import("./animations/GlowCursor/GlowCursor"), { ssr: false }) as any;
const GradualBlur = dynamic(() => import("./animations/GradualBlur/GradualBlur"), { ssr: false }) as any;
const HalftoneReveal = dynamic(() => import("./animations/HalftoneReveal/HalftoneReveal"), { ssr: false }) as any;
const ImageTrail = dynamic(() => import("./animations/ImageTrail/ImageTrail"), { ssr: false }) as any;
const LaserFlow = dynamic(() => import("./animations/LaserFlow/LaserFlow"), { ssr: false }) as any;
const LogoLoop = dynamic(() => import("./animations/LogoLoop/LogoLoop"), { ssr: false }) as any;
const MagicRings = dynamic(() => import("./animations/MagicRings/MagicRings"), { ssr: false }) as any;
const Magnet = dynamic(() => import("./animations/Magnet/Magnet"), { ssr: false }) as any;
const MagnetLines = dynamic(() => import("./animations/MagnetLines/MagnetLines"), { ssr: false }) as any;
const MetaBalls = dynamic(() => import("./animations/MetaBalls/MetaBalls"), { ssr: false }) as any;
const MetallicPaint = dynamic(() => import("./animations/MetallicPaint/MetallicPaint"), { ssr: false }) as any;
const Noise = dynamic(() => import("./animations/Noise/Noise"), { ssr: false }) as any;
const OrbitImages = dynamic(() => import("./animations/OrbitImages/OrbitImages"), { ssr: false }) as any;
const PixelSwap = dynamic(() => import("./animations/PixelSwap/PixelSwap"), { ssr: false }) as any;
const PixelTrail = dynamic(() => import("./animations/PixelTrail/PixelTrail"), { ssr: false }) as any;
const PixelTransition = dynamic(() => import("./animations/PixelTransition/PixelTransition"), { ssr: false }) as any;
const Ribbons = dynamic(() => import("./animations/Ribbons/Ribbons"), { ssr: false }) as any;
const RippleDistortion = dynamic(() => import("./animations/RippleDistortion/RippleDistortion"), { ssr: false }) as any;
const ScrollExpand = dynamic(() => import("./animations/ScrollExpand/ScrollExpand"), { ssr: false }) as any;
const ShapeBlur = dynamic(() => import("./animations/ShapeBlur/ShapeBlur"), { ssr: false }) as any;
const SplashCursor = dynamic(() => import("./animations/SplashCursor/SplashCursor"), { ssr: false }) as any;
const StarBorder = dynamic(() => import("./animations/StarBorder/StarBorder"), { ssr: false }) as any;
const StickerPeel = dynamic(() => import("./animations/StickerPeel/StickerPeel"), { ssr: false }) as any;
const Strands = dynamic(() => import("./animations/Strands/Strands"), { ssr: false }) as any;
const SwarmCursor = dynamic(() => import("./animations/SwarmCursor/SwarmCursor"), { ssr: false }) as any;
const TargetCursor = dynamic(() => import("./animations/TargetCursor/TargetCursor"), { ssr: false }) as any;

const RUTA = (n: string) => `src/components/animaciones/rb/animations/${n}/${n}.tsx`;
const CLOUD = "https://res.cloudinary.com/dgtlyzyra/image/upload/jessdesign";
const FOTO_A = `${CLOUD}/santi-ori-48`;
const FOTO_B = `${CLOUD}/audi-ambientacion`;
const FOTO_C = `${CLOUD}/santi-ori-49`;
const FOTOS = [FOTO_A, FOTO_B, FOTO_C, FOTO_A, FOTO_B, FOTO_C];

/** Logo "Cauce" en SVG (data URI) para los efectos que pintan sobre una imagen con alpha. */
const LOGO_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" viewBox="0 0 600 300"><text x="50%" y="58%" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="170" fill="#000">Cauce</text></svg>`
  );

/** Tarjeta simple para los efectos que envuelven contenido. */
function Tarjeta({ ancho = 220, alto = 130, texto = "Que tu negocio fluya" }: { ancho?: number; alto?: number; texto?: string }) {
  return (
    <div
      style={{
        width: ancho,
        height: alto,
        borderRadius: 18,
        background: "linear-gradient(135deg, #1a1a2e, #0f3460)",
        border: "1px solid rgba(255,255,255,0.15)",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <strong style={{ fontSize: 26, letterSpacing: -0.5 }}>Cauce</strong>
      <span style={{ fontSize: 13, opacity: 0.75 }}>{texto}</span>
    </div>
  );
}

/** Texto grande centrado, detrás de un efecto de cursor. */
function Letrero({ texto, sub }: { texto: string; sub?: string }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        userSelect: "none",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
        zIndex: 1,
      }}
    >
      <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.5 }}>{texto}</span>
      {sub && <span style={{ fontSize: 13, opacity: 0.6, marginTop: 4 }}>{sub}</span>}
    </div>
  );
}

function Foto({ src, style }: { src: string; style?: React.CSSProperties }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", ...style }} />;
}

/* Previews que necesitan hooks van como componentes aparte. */
function PreviewCrosshair() {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <Caja centrado={false}>
      <div ref={ref} style={{ position: "absolute", inset: 0, cursor: "none" }}>
        <Crosshair containerRef={ref} color="#ffffff" />
        <Letrero texto="Apuntá acá" sub="mové el mouse" />
      </div>
    </Caja>
  );
}

const ANIM_ESTRELLAS = `
@keyframes star-movement-bottom { 0% { transform: translate(0%, 0%); opacity: 1; } 100% { transform: translate(-100%, 0%); opacity: 0; } }
@keyframes star-movement-top { 0% { transform: translate(0%, 0%); opacity: 1; } 100% { transform: translate(100%, 0%); opacity: 0; } }
.animate-star-movement-bottom { animation: star-movement-bottom linear infinite alternate; }
.animate-star-movement-top { animation: star-movement-top linear infinite alternate; }
`;

export const ENTRADAS: Animacion[] = [
  {
    id: "animated-content",
    nombre: "AnimatedContent",
    origen: "React Bits",
    categoria: "Animaciones",
    descripcion: "Hace entrar cualquier bloque deslizándose y apareciendo cuando llega a la pantalla.",
    argumento: "Tus secciones aparecen con movimiento al scrollear: la web se siente viva sin distraer.",
    ruta: RUTA("AnimatedContent"),
    uso: `import AnimatedContent from "@/components/animaciones/rb/animations/AnimatedContent/AnimatedContent";

<AnimatedContent distance={100} direction="vertical" duration={0.8} ease="power3.out" initialOpacity={0}>
  <div>Tu contenido</div>
</AnimatedContent>`,
    Preview: () => (
      <Caja>
        <AnimatedContent distance={80} direction="vertical" duration={0.8} ease="power3.out" initialOpacity={0} threshold={0.1}>
          <Tarjeta />
        </AnimatedContent>
      </Caja>
    ),
  },
  {
    id: "antigravity",
    nombre: "Antigravity",
    origen: "React Bits",
    categoria: "Animaciones",
    descripcion: "Nube de partículas 3D que flota y se ordena en un anillo alrededor del cursor.",
    argumento: "Un hero futurista que reacciona al mouse: ideal para marcas tech o de diseño.",
    ruta: RUTA("Antigravity"),
    pesada: true,
    uso: `import Antigravity from "@/components/animaciones/rb/animations/Antigravity/Antigravity";

<div style={{ height: 500, position: "relative" }}>
  <Antigravity count={300} magnetRadius={6} ringRadius={7} color="#5227FF" particleShape="capsule" autoAnimate />
</div>`,
    Preview: () => (
      <Caja centrado={false}>
        <Antigravity count={300} magnetRadius={6} ringRadius={7} waveSpeed={0.4} particleSize={1.5} color="#5227FF" autoAnimate particleShape="capsule" fieldStrength={10} />
      </Caja>
    ),
  },
  {
    id: "blob-cursor",
    nombre: "BlobCursor",
    origen: "React Bits",
    categoria: "Animaciones",
    descripcion: "Cursor gelatinoso: varias burbujas siguen al mouse y se funden entre sí.",
    argumento: "Un cursor con personalidad que hace que navegar tu web sea un juego.",
    ruta: RUTA("BlobCursor"),
    uso: `import BlobCursor from "@/components/animaciones/rb/animations/BlobCursor/BlobCursor";

<div style={{ position: "relative", height: 400 }}>
  <BlobCursor blobType="circle" fillColor="#5227FF" trailCount={3} sizes={[60, 125, 75]} zIndex={100} />
</div>`,
    Preview: () => (
      <Caja centrado={false}>
        <BlobCursor blobType="circle" fillColor="#5227FF" trailCount={3} sizes={[60, 125, 75]} innerSizes={[20, 35, 25]} innerColor="rgba(255,255,255,0.8)" opacities={[0.6, 0.6, 0.6]} shadowColor="rgba(0,0,0,0.75)" shadowBlur={5} fastDuration={0.1} slowDuration={0.5} zIndex={10} />
        <Letrero texto="Mové el mouse" />
      </Caja>
    ),
  },
  {
    id: "click-spark",
    nombre: "ClickSpark",
    origen: "React Bits",
    categoria: "Animaciones",
    descripcion: "Al hacer click salen chispas desde el punto donde tocaste.",
    argumento: "Cada click se siente: feedback divertido en botones y llamados a la acción.",
    ruta: RUTA("ClickSpark"),
    uso: `import ClickSpark from "@/components/animaciones/rb/animations/ClickSpark/ClickSpark";

<ClickSpark sparkColor="#fff" sparkSize={10} sparkRadius={15} sparkCount={8} duration={400}>
  <button>Comprar</button>
</ClickSpark>`,
    Preview: () => (
      <Caja centrado={false}>
        <ClickSpark sparkColor="#ffffff" sparkSize={10} sparkRadius={15} sparkCount={8} duration={400} extraScale={1}>
          <Letrero texto="Hacé click" sub="en cualquier lado" />
        </ClickSpark>
      </Caja>
    ),
  },
  {
    id: "crosshair",
    nombre: "Crosshair",
    origen: "React Bits",
    categoria: "Animaciones",
    descripcion: "Una mira en cruz sigue al mouse y se engancha en los links al pasar.",
    argumento: "Estilo gamer o editorial: el cursor se vuelve una mira que apunta a tus productos.",
    ruta: RUTA("Crosshair"),
    uso: `import Crosshair from "@/components/animaciones/rb/animations/Crosshair/Crosshair";

const ref = useRef<HTMLDivElement>(null);
<div ref={ref} style={{ position: "relative" }}>
  <Crosshair containerRef={ref} color="#fff" />
</div>`,
    Preview: () => <PreviewCrosshair />,
  },
  {
    id: "cubes",
    nombre: "Cubes",
    origen: "React Bits",
    categoria: "Animaciones",
    descripcion: "Grilla de cubos 3D que se inclinan siguiendo al mouse y ondulan al hacer click.",
    argumento: "Una pared interactiva que engancha: perfecta para un hero o una sección de tecnología.",
    ruta: RUTA("Cubes"),
    uso: `import Cubes from "@/components/animaciones/rb/animations/Cubes/Cubes";

<Cubes gridSize={8} maxAngle={45} radius={3} borderStyle="2px dashed #B497CF" faceColor="#120F17" autoAnimate rippleOnClick />`,
    Preview: () => (
      <Caja>
        <div style={{ width: 480, display: "flex", justifyContent: "center" }}>
          <Cubes gridSize={8} maxAngle={45} radius={3} borderStyle="2px dashed #B497CF" faceColor="#120F17" rippleColor="#fff" autoAnimate rippleOnClick />
        </div>
      </Caja>
    ),
  },
  {
    id: "cursor-grid",
    nombre: "CursorGrid",
    origen: "React Bits",
    categoria: "Animaciones",
    descripcion: "Una grilla invisible se ilumina alrededor del cursor y pulsa al hacer click.",
    argumento: "Fondo técnico y elegante que responde al mouse sin robar protagonismo.",
    ruta: RUTA("CursorGrid"),
    uso: `import CursorGrid from "@/components/animaciones/rb/animations/CursorGrid/CursorGrid";

<div style={{ height: 400 }}>
  <CursorGrid cellSize={70} color="#D946EF" radius={140} falloff="smooth" clickPulse />
</div>`,
    Preview: () => (
      <Caja centrado={false}>
        <CursorGrid cellSize={60} color="#D946EF" radius={140} falloff="smooth" holdTime={400} fadeDuration={800} lineWidth={1.2} clickPulse pulseSpeed={600} />
        <Letrero texto="Mové el mouse" />
      </Caja>
    ),
  },
  {
    id: "elastic-mesh",
    nombre: "ElasticMesh",
    origen: "React Bits",
    categoria: "Animaciones",
    descripcion: "Una imagen o degradé se deforma como tela elástica cuando la tocás con el mouse.",
    argumento: "Tus fotos se vuelven táctiles: el visitante las 'estira' y no se va de la página.",
    ruta: RUTA("ElasticMesh"),
    pesada: true,
    uso: `import ElasticMesh from "@/components/animaciones/rb/animations/ElasticMesh/ElasticMesh";

<div style={{ height: 400 }}>
  <ElasticMesh image="/foto.jpg" color1="#5227FF" color2="#B19EEF" showGrid gridDensity={20} borderRadius={25} interaction="hover" />
</div>`,
    Preview: () => (
      <Caja centrado={false}>
        <ElasticMesh image={FOTO_A} color1="#5227FF" color2="#B19EEF" showGrid gridDensity={20} gridOpacity={0.28} gridColor="#ffffff" borderRadius={12} stiffness={0.05} damping={0.2} grabRadius={0.6} pull={0.4} wobble={5} tilt={14} shading={0.5} resolution={25} interaction="hover" enabled />
      </Caja>
    ),
  },
  {
    id: "electric-border",
    nombre: "ElectricBorder",
    origen: "React Bits",
    categoria: "Animaciones",
    descripcion: "Un borde eléctrico vibrante rodea cualquier tarjeta o botón.",
    argumento: "Resaltá tu oferta destacada con un borde que chispea: imposible no mirarla.",
    ruta: RUTA("ElectricBorder"),
    uso: `import ElectricBorder from "@/components/animaciones/rb/animations/ElectricBorder/ElectricBorder";

<ElectricBorder color="#7df9ff" speed={1} chaos={0.12} borderRadius={16}>
  <div style={{ width: 300, height: 360, borderRadius: 16 }}>Tu tarjeta</div>
</ElectricBorder>`,
    Preview: () => (
      <Caja>
        <ElectricBorder color="#7df9ff" speed={1} chaos={0.12} borderRadius={18}>
          <Tarjeta ancho={240} alto={150} />
        </ElectricBorder>
      </Caja>
    ),
  },
  {
    id: "fade-content",
    nombre: "FadeContent",
    origen: "React Bits",
    categoria: "Animaciones",
    descripcion: "El contenido aparece con un fundido suave (opcionalmente desde desenfocado) al entrar en pantalla.",
    argumento: "Entradas elegantes y discretas para textos, fotos y tarjetas de tu web.",
    ruta: RUTA("FadeContent"),
    uso: `import FadeContent from "@/components/animaciones/rb/animations/FadeContent/FadeContent";

<FadeContent blur duration={1} ease="power2.out" initialOpacity={0}>
  <div>Tu contenido</div>
</FadeContent>`,
    Preview: () => (
      <Caja>
        <FadeContent blur duration={1} delay={0} ease="power2.out" initialOpacity={0} threshold={0.1}>
          <Tarjeta />
        </FadeContent>
      </Caja>
    ),
  },
  {
    id: "ghost-cursor",
    nombre: "GhostCursor",
    origen: "React Bits",
    categoria: "Animaciones",
    descripcion: "Una estela fantasmal luminosa sigue al cursor y se desvanece cuando se queda quieto.",
    argumento: "Efecto de humo brillante que le da un aire premium y misterioso a tu landing.",
    ruta: RUTA("GhostCursor"),
    pesada: true,
    uso: `import GhostCursor from "@/components/animaciones/rb/animations/GhostCursor/GhostCursor";

<div style={{ position: "relative", height: 500 }}>
  <GhostCursor trailLength={50} inertia={0.5} color="#B497CF" brightness={2} bloomStrength={0.1} />
</div>`,
    Preview: () => (
      <Caja centrado={false}>
        <GhostCursor trailLength={50} inertia={0.5} grainIntensity={0.05} bloomStrength={0.1} bloomRadius={1} bloomThreshold={0.025} brightness={2} color="#B497CF" fadeDelayMs={1000} fadeDurationMs={1500} />
        <Letrero texto="Boo!" />
      </Caja>
    ),
  },
  {
    id: "glare-hover",
    nombre: "GlareHover",
    origen: "React Bits",
    categoria: "Animaciones",
    descripcion: "Un destello de luz cruza la tarjeta cuando pasás el mouse por encima.",
    argumento: "Tus tarjetas de producto brillan al pasar el mouse, como vidriera con luz.",
    ruta: RUTA("GlareHover"),
    uso: `import GlareHover from "@/components/animaciones/rb/animations/GlareHover/GlareHover";

<GlareHover width="400px" height="300px" background="#111" borderRadius="20px" glareColor="#ffffff" glareOpacity={0.3} glareSize={300} transitionDuration={800}>
  <h2>Pasá el mouse</h2>
</GlareHover>`,
    Preview: () => (
      <Caja>
        <GlareHover width="320px" height="200px" background="linear-gradient(135deg, #1a1a2e, #0f3460)" borderColor="rgba(255,255,255,0.15)" borderRadius="20px" glareColor="#ffffff" glareOpacity={0.3} glareSize={300} transitionDuration={800} playOnce={false}>
          <div style={{ color: "#fff", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
            <div style={{ fontSize: 28, fontWeight: 700 }}>Cauce</div>
            <div style={{ fontSize: 13, opacity: 0.7 }}>Pasá el mouse</div>
          </div>
        </GlareHover>
      </Caja>
    ),
  },
  {
    id: "glow-cursor",
    nombre: "GlowCursor",
    origen: "React Bits",
    categoria: "Animaciones",
    descripcion: "Una cola de luz neón de dos colores sigue al cursor y late suavemente.",
    argumento: "Cursor luminoso estilo neón: le da a tu web una sensación de app moderna.",
    ruta: RUTA("GlowCursor"),
    pesada: true,
    uso: `import GlowCursor from "@/components/animaciones/rb/animations/GlowCursor/GlowCursor";

<div style={{ height: 400 }}>
  <GlowCursor color="#67E8F9" secondaryColor="#A78BFA" trailLength={40} trailWidth={8} glowIntensity={1.9} />
</div>`,
    Preview: () => (
      <Caja centrado={false}>
        <GlowCursor color="#67E8F9" secondaryColor="#A78BFA" trailLength={40} trailWidth={8} trailTaper={0.8} followSpeed={0.16} glowIntensity={1.9} glowSpread={1.2} blendMode="normal" idleFade>
          <Letrero texto="Mové el mouse" />
        </GlowCursor>
      </Caja>
    ),
  },
  {
    id: "gradual-blur",
    nombre: "GradualBlur",
    origen: "React Bits",
    categoria: "Animaciones",
    descripcion: "Desenfoque progresivo en el borde de una sección o lista: el contenido se funde al salir.",
    argumento: "Listas y galerías con bordes suaves y elegantes, sin cortes bruscos.",
    ruta: RUTA("GradualBlur"),
    uso: `import GradualBlur from "@/components/animaciones/rb/animations/GradualBlur/GradualBlur";

<div style={{ position: "relative", height: 400, overflow: "auto" }}>
  {/* contenido scrolleable */}
  <GradualBlur target="parent" position="bottom" height="7rem" strength={2} divCount={5} curve="bezier" exponential />
</div>`,
    Preview: () => (
      <Caja centrado={false}>
        <Foto src={FOTO_B} />
        <GradualBlur target="parent" position="bottom" height="7rem" strength={2} divCount={5} curve="bezier" exponential opacity={1} zIndex={10} />
        <GradualBlur target="parent" position="top" height="5rem" strength={2} divCount={5} curve="bezier" exponential opacity={1} zIndex={10} />
      </Caja>
    ),
  },
  {
    id: "halftone-reveal",
    nombre: "HalftoneReveal",
    origen: "React Bits",
    categoria: "Animaciones",
    descripcion: "Una foto impresa en puntos (medio tono) se revela nítida con una lupa que sigue al cursor.",
    argumento: "Efecto de revista impresa: tus fotos se descubren con el mouse, muy vistoso para portfolios.",
    ruta: RUTA("HalftoneReveal"),
    pesada: true,
    uso: `import HalftoneReveal from "@/components/animaciones/rb/animations/HalftoneReveal/HalftoneReveal";

<div style={{ height: 500 }}>
  <HalftoneReveal src="/foto.jpg" inkColor="#141414" paperColor="#fff7e6" mode="mono" dotDensity={71} revealRadius={0.4} trigger="hover" />
</div>`,
    Preview: () => (
      <Caja centrado={false}>
        <HalftoneReveal src={FOTO_C} inkColor="#141414" paperColor="#fff7e6" mode="mono" dotSize={1} dotDensity={71} angle={45} shape="circle" contrast={1.15} revealRadius={0.4} edge={0.8} follow={0.37} trigger="hover" borderRadius="12px" />
      </Caja>
    ),
  },
  {
    id: "image-trail",
    nombre: "ImageTrail",
    origen: "React Bits",
    categoria: "Animaciones",
    descripcion: "Al mover el mouse van apareciendo fotos que dejan una estela y se desvanecen (8 variantes).",
    argumento: "Mostrá tu catálogo o tus trabajos de forma lúdica: las fotos siguen al visitante.",
    ruta: RUTA("ImageTrail"),
    uso: `import ImageTrail from "@/components/animaciones/rb/animations/ImageTrail/ImageTrail";

<div style={{ height: 500, position: "relative", overflow: "hidden" }}>
  <ImageTrail items={["/foto1.jpg", "/foto2.jpg", "/foto3.jpg"]} variant={1} />
</div>`,
    Preview: () => (
      <Caja centrado={false}>
        <Letrero texto="Mové el mouse" sub="variante 1" />
        <ImageTrail items={FOTOS} variant={1} />
      </Caja>
    ),
  },
  {
    id: "laser-flow",
    nombre: "LaserFlow",
    origen: "React Bits",
    categoria: "Animaciones",
    descripcion: "Un rayo láser vertical con niebla y chispas que fluye y se inclina con el mouse.",
    argumento: "Hero cinematográfico para lanzamientos: un haz de luz que presenta tu producto.",
    ruta: RUTA("LaserFlow"),
    pesada: true,
    uso: `import LaserFlow from "@/components/animaciones/rb/animations/LaserFlow/LaserFlow";

<div style={{ height: 500, position: "relative" }}>
  <LaserFlow color="#CF9EFF" horizontalBeamOffset={0.1} verticalBeamOffset={-0.2} wispDensity={1} fogIntensity={0.45} />
</div>`,
    Preview: () => (
      <Caja centrado={false}>
        <LaserFlow color="#CF9EFF" horizontalBeamOffset={0} verticalBeamOffset={-0.5} horizontalSizing={0.5} verticalSizing={2} wispDensity={1} wispSpeed={15} wispIntensity={5} flowSpeed={0.35} flowStrength={0.25} fogIntensity={0.45} fogScale={0.3} fogFallSpeed={0.6} decay={1.1} falloffStart={1.2} />
      </Caja>
    ),
  },
  {
    id: "logo-loop",
    nombre: "LogoLoop",
    origen: "React Bits",
    categoria: "Animaciones",
    descripcion: "Cinta infinita de logos que se desplaza sola, frena al pasar el mouse y se funde en los bordes.",
    argumento: "Mostrá las marcas con las que trabajás o tus clientes en un carrusel que nunca para.",
    ruta: RUTA("LogoLoop"),
    uso: `import LogoLoop from "@/components/animaciones/rb/animations/LogoLoop/LogoLoop";

<LogoLoop
  logos={[{ src: "/logo1.svg", alt: "Marca 1", href: "https://..." }, { node: <span>Marca 2</span>, title: "Marca 2" }]}
  speed={100} direction="left" logoHeight={60} gap={60} fadeOut fadeOutColor="#000" scaleOnHover hoverSpeed={0}
/>`,
    Preview: () => (
      <Caja>
        <div style={{ width: "100%", color: "#fff" }}>
          <LogoLoop
            logos={["Cauce", "Vespa", "Jess Design", "Piletas BB", "Código Auto", "La Estación", "Motos Fernández"].map((t) => ({
              node: (
                <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5, fontFamily: "system-ui, sans-serif", opacity: 0.85, whiteSpace: "nowrap" }}>{t}</span>
              ),
              title: t,
            }))}
            width="100%"
            logoHeight={40}
            gap={56}
            speed={80}
            direction="left"
            scaleOnHover
            hoverSpeed={0}
            fadeOut
            fadeOutColor="#0a0a0a"
            ariaLabel="Marcas"
          />
        </div>
      </Caja>
    ),
  },
  {
    id: "magic-rings",
    nombre: "MagicRings",
    origen: "React Bits",
    categoria: "Animaciones",
    descripcion: "Anillos de luz concéntricos que se expanden y respiran; pueden seguir al mouse y estallar al click.",
    argumento: "Un fondo hipnótico para servicios de bienestar, tech o diseño.",
    ruta: RUTA("MagicRings"),
    pesada: true,
    uso: `import MagicRings from "@/components/animaciones/rb/animations/MagicRings/MagicRings";

<div style={{ height: 400 }}>
  <MagicRings color="#A855F7" colorTwo="#6366F1" ringCount={6} speed={1} followMouse clickBurst />
</div>`,
    Preview: () => (
      <Caja centrado={false}>
        <MagicRings color="#A855F7" colorTwo="#6366F1" ringCount={6} speed={1} attenuation={10} lineThickness={2} baseRadius={0.35} radiusStep={0.1} scaleRate={0.1} opacity={1} noiseAmount={0.1} ringGap={1.5} fadeIn={0.7} fadeOut={0.5} followMouse mouseInfluence={0.2} hoverScale={1.2} parallax={0.05} clickBurst />
      </Caja>
    ),
  },
  {
    id: "magnet",
    nombre: "Magnet",
    origen: "React Bits",
    categoria: "Animaciones",
    descripcion: "El elemento se 'imanta' hacia el cursor cuando te acercás y vuelve solo a su lugar.",
    argumento: "Botones que atraen el mouse: literalmente invitan a hacer click.",
    ruta: RUTA("Magnet"),
    uso: `import Magnet from "@/components/animaciones/rb/animations/Magnet/Magnet";

<Magnet padding={50} magnetStrength={2}>
  <button>Acercate</button>
</Magnet>`,
    Preview: () => (
      <Caja>
        <Magnet padding={60} disabled={false} magnetStrength={2}>
          <Tarjeta ancho={200} alto={110} texto="Acercá el mouse" />
        </Magnet>
      </Caja>
    ),
  },
  {
    id: "magnet-lines",
    nombre: "MagnetLines",
    origen: "React Bits",
    categoria: "Animaciones",
    descripcion: "Grilla de líneas que giran como brújulas apuntando siempre al cursor.",
    argumento: "Textura interactiva minimalista que hace que el visitante juegue con tu web.",
    ruta: RUTA("MagnetLines"),
    uso: `import MagnetLines from "@/components/animaciones/rb/animations/MagnetLines/MagnetLines";

<MagnetLines rows={10} columns={12} containerSize="40vmin" lineColor="#efefef" lineWidth="2px" lineHeight="30px" baseAngle={-10} />`,
    Preview: () => (
      <Caja>
        <MagnetLines rows={8} columns={14} containerSize="240px" lineColor="#efefef" lineWidth="2px" lineHeight="22px" baseAngle={-10} style={{ width: 420, height: 240 }} />
      </Caja>
    ),
  },
  {
    id: "meta-balls",
    nombre: "MetaBalls",
    origen: "React Bits",
    categoria: "Animaciones",
    descripcion: "Burbujas líquidas que se atraen, se funden y persiguen al cursor.",
    argumento: "Efecto lava-lamp orgánico para marcas jóvenes, creativas o de cosmética.",
    ruta: RUTA("MetaBalls"),
    pesada: true,
    uso: `import MetaBalls from "@/components/animaciones/rb/animations/MetaBalls/MetaBalls";

<div style={{ height: 400 }}>
  <MetaBalls color="#ffffff" cursorBallColor="#ffffff" ballCount={15} animationSize={30} speed={0.3} enableMouseInteraction enableTransparency />
</div>`,
    Preview: () => (
      <Caja centrado={false}>
        <MetaBalls color="#B497CF" cursorBallColor="#B497CF" cursorBallSize={2} ballCount={15} animationSize={30} enableMouseInteraction hoverSmoothness={0.15} clumpFactor={1} speed={0.3} enableTransparency />
      </Caja>
    ),
  },
  {
    id: "metallic-paint",
    nombre: "MetallicPaint",
    origen: "React Bits",
    categoria: "Animaciones",
    descripcion: "Convierte un logo en metal líquido que refleja luz y ondula como cromo derretido.",
    argumento: "Tu logo en cromo animado: presencia de marca de alto impacto en el hero.",
    ruta: RUTA("MetallicPaint"),
    pesada: true,
    uso: `import MetallicPaint from "@/components/animaciones/rb/animations/MetallicPaint/MetallicPaint";

<div style={{ width: 400, height: 400 }}>
  <MetallicPaint imageSrc="/logo-negro.svg" seed={42} scale={4} liquid={0.75} speed={0.3} tintColor="#feb3ff" />
</div>`,
    Preview: () => (
      <Caja centrado={false}>
        <MetallicPaint imageSrc={LOGO_SVG} seed={42} scale={4} refraction={0.01} blur={0.015} liquid={0.75} speed={0.3} brightness={2} contrast={0.5} fresnel={1} lightColor="#ffffff" darkColor="#000000" chromaticSpread={2} distortion={1} contour={0.2} tintColor="#feb3ff" />
      </Caja>
    ),
  },
  {
    id: "noise",
    nombre: "Noise",
    origen: "React Bits",
    categoria: "Animaciones",
    descripcion: "Capa de grano animado tipo película sobre cualquier fondo o foto.",
    argumento: "Textura de grano cinematográfico: le da calidez y carácter a fotos y fondos.",
    ruta: RUTA("Noise"),
    uso: `import Noise from "@/components/animaciones/rb/animations/Noise/Noise";

<div style={{ position: "relative", overflow: "hidden" }}>
  {/* tu fondo */}
  <Noise patternSize={250} patternScaleX={2} patternScaleY={2} patternAlpha={15} />
</div>`,
    Preview: () => (
      <Caja centrado={false}>
        <Foto src={FOTO_A} />
        <Noise patternSize={250} patternScaleX={2} patternScaleY={2} patternRefreshInterval={2} patternAlpha={18} />
      </Caja>
    ),
  },
  {
    id: "orbit-images",
    nombre: "OrbitImages",
    origen: "React Bits",
    categoria: "Animaciones",
    descripcion: "Fotos que orbitan siguiendo una elipse, círculo, estrella, corazón o un trazado propio.",
    argumento: "Tus productos girando en órbita: una galería viva que llama la atención.",
    ruta: RUTA("OrbitImages"),
    uso: `import OrbitImages from "@/components/animaciones/rb/animations/OrbitImages/OrbitImages";

<OrbitImages images={["/f1.jpg", "/f2.jpg", "/f3.jpg"]} shape="ellipse" radiusX={340} radiusY={80} rotation={-8} duration={30} itemSize={80} showPath />`,
    Preview: () => (
      <Caja>
        <OrbitImages images={FOTOS} shape="ellipse" radiusX={260} radiusY={70} radius={110} rotation={-8} duration={30} itemSize={64} direction="normal" fill showPath paused={false} responsive pathColor="rgba(255,255,255,0.25)" />
      </Caja>
    ),
  },
  {
    id: "pixel-swap",
    nombre: "PixelSwap",
    origen: "React Bits",
    categoria: "Animaciones",
    descripcion: "Cambia de un contenido a otro pixelándose en bloques (varios patrones: random, barrido, espiral).",
    argumento: "Antes/después o dos caras de un producto que se intercambian con un efecto retro.",
    ruta: RUTA("PixelSwap"),
    uso: `import PixelSwap from "@/components/animaciones/rb/animations/PixelSwap/PixelSwap";

<PixelSwap firstContent={<div>Antes</div>} secondContent={<div>Después</div>} trigger="hover" pattern="random" pixelSize={64} duration={1400} fade />`,
    Preview: () => (
      <Caja>
        <div style={{ width: 380, borderRadius: 14, overflow: "hidden" }}>
          <PixelSwap
            trigger="hover"
            pattern="random"
            pixelSize={48}
            gap={0}
            pixelRadius={0}
            pixelScale={0.35}
            duration={1400}
            pixelDuration={450}
            fade
            style={{ aspectRatio: "16 / 9" }}
            firstContent={
              <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", background: "linear-gradient(135deg, #1a1a2e, #0f3460)", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>pasá el mouse</div>
                  <div style={{ fontSize: 30, fontWeight: 700 }}>Cauce</div>
                </div>
              </div>
            }
            secondContent={
              <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", background: "linear-gradient(135deg, #5227FF, #B19EEF)", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
                <div style={{ fontSize: 26, fontWeight: 700 }}>Que tu negocio fluya</div>
              </div>
            }
          />
        </div>
      </Caja>
    ),
  },
  {
    id: "pixel-trail",
    nombre: "PixelTrail",
    origen: "React Bits",
    categoria: "Animaciones",
    descripcion: "Estela de píxeles gelatinosos que sigue al mouse y se desvanece.",
    argumento: "Rastro pixel-art detrás del cursor: retro, divertido y muy compartible.",
    ruta: RUTA("PixelTrail"),
    pesada: true,
    uso: `import PixelTrail from "@/components/animaciones/rb/animations/PixelTrail/PixelTrail";

<div style={{ height: 400, position: "relative" }}>
  <PixelTrail gridSize={50} trailSize={0.1} maxAge={250} interpolate={5} color="#5227FF" gooeyFilter={{ id: "goo", strength: 2 }} />
</div>`,
    Preview: () => (
      <Caja centrado={false}>
        <Letrero texto="Mové el mouse" />
        <PixelTrail gridSize={50} trailSize={0.1} maxAge={250} interpolate={5} color="#5227FF" gooeyFilter={{ id: "cauce-goo", strength: 2 }} />
      </Caja>
    ),
  },
  {
    id: "pixel-transition",
    nombre: "PixelTransition",
    origen: "React Bits",
    categoria: "Animaciones",
    descripcion: "Al pasar el mouse la tarjeta se cubre de píxeles y muestra otro contenido detrás.",
    argumento: "Foto del producto que al hover revela precio o mensaje con un efecto pixelado.",
    ruta: RUTA("PixelTransition"),
    uso: `import PixelTransition from "@/components/animaciones/rb/animations/PixelTransition/PixelTransition";

<PixelTransition
  firstContent={<img src="/foto.jpg" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
  secondContent={<div>¡Hola!</div>}
  gridSize={8} pixelColor="#ffffff" animationStepDuration={0.4}
/>`,
    Preview: () => (
      <Caja>
        <div style={{ width: 230 }}>
          <PixelTransition
            gridSize={8}
            pixelColor="#ffffff"
            animationStepDuration={0.4}
            once={false}
            aspectRatio="100%"
            style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.15)" }}
            firstContent={<Foto src={FOTO_C} style={{ position: "relative" }} />}
            secondContent={
              <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", background: "#111", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
                <div style={{ fontSize: 30, fontWeight: 900 }}>Cauce</div>
              </div>
            }
          />
        </div>
      </Caja>
    ),
  },
  {
    id: "ribbons",
    nombre: "Ribbons",
    origen: "React Bits",
    categoria: "Animaciones",
    descripcion: "Cintas de color que siguen al cursor con física suave, como lazos flotando.",
    argumento: "Un cursor con cintas de tu color de marca: elegante y juguetón a la vez.",
    ruta: RUTA("Ribbons"),
    pesada: true,
    uso: `import Ribbons from "@/components/animaciones/rb/animations/Ribbons/Ribbons";

<div style={{ height: 500, position: "relative" }}>
  <Ribbons colors={["#5227FF"]} baseThickness={30} speedMultiplier={0.5} maxAge={500} enableFade enableShaderEffect />
</div>`,
    Preview: () => (
      <Caja centrado={false}>
        <Letrero texto="Mové el mouse" />
        <Ribbons colors={["#5227FF", "#B19EEF", "#7df9ff"]} baseThickness={30} speedMultiplier={0.5} maxAge={500} enableFade={false} enableShaderEffect={false} />
      </Caja>
    ),
  },
  {
    id: "ripple-distortion",
    nombre: "RippleDistortion",
    origen: "React Bits",
    categoria: "Animaciones",
    descripcion: "Una foto se ondula como agua bajo el cursor, con destellos y tinte opcional.",
    argumento: "Tus fotos parecen agua al pasar el mouse: sensación premium para spas, piletas o diseño.",
    ruta: RUTA("RippleDistortion"),
    pesada: true,
    uso: `import RippleDistortion from "@/components/animaciones/rb/animations/RippleDistortion/RippleDistortion";

<div style={{ height: 500 }}>
  <RippleDistortion src="/foto.jpg" brushSize={150} strength={0.2} rings={4} tint="#a855f7" tintAmount={0.1} grayscale trigger="hover" />
</div>`,
    Preview: () => (
      <Caja centrado={false}>
        <RippleDistortion src={FOTO_B} brushSize={150} strength={0.2} swirl={1} rings={4} spread={5} fade={3} spacing={15} tint="#a855f7" tintAmount={0.1} grayscale={false} highlightColor="#ffffff" trigger="hover" clickStrength={2} quality="low" enabled style={{ width: "100%", height: "100%" }} />
      </Caja>
    ),
  },
  {
    id: "scroll-expand",
    nombre: "ScrollExpand",
    origen: "React Bits",
    categoria: "Animaciones",
    descripcion: "Una foto o video chico se expande a pantalla completa a medida que scrolleás, y aparece tu texto encima.",
    argumento: "Apertura de película para tu hero: el visitante scrollea y tu imagen se adueña de la pantalla.",
    ruta: RUTA("ScrollExpand"),
    uso: `import ScrollExpand from "@/components/animaciones/rb/animations/ScrollExpand/ScrollExpand";

<div style={{ height: 600, position: "relative" }}>
  <ScrollExpand src="/foto.jpg" title="Que tu negocio fluya" scrollHint="Scrolleá" startWidth={42} startHeight={58} mediaZoom={1.35} scrollDistance={1.2}>
    <h2>Tu mensaje</h2>
  </ScrollExpand>
</div>`,
    Preview: () => (
      <Caja centrado={false}>
        <ScrollExpand src={FOTO_A} alt="" title="Cauce" scrollHint="Scrolleá dentro del recuadro" startWidth={42} startHeight={58} startRadius={24} endRadius={0} mediaZoom={1.35} scrollDistance={1.2} holdDistance={0.35} smoothing={0.1} overlayScrim={0.45} enabled>
          <div style={{ color: "#fff", fontFamily: "system-ui, sans-serif", fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>Que tu negocio fluya</div>
          <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 14, marginTop: 8 }}>La imagen se abre y toma toda la escena.</div>
        </ScrollExpand>
      </Caja>
    ),
  },
  {
    id: "shape-blur",
    nombre: "ShapeBlur",
    origen: "React Bits",
    categoria: "Animaciones",
    descripcion: "Una forma redondeada y difuminada persigue al cursor como un foco de luz suave.",
    argumento: "Un reflector suave que sigue al visitante por tu hero: sutil y sofisticado.",
    ruta: RUTA("ShapeBlur"),
    pesada: true,
    uso: `import ShapeBlur from "@/components/animaciones/rb/animations/ShapeBlur/ShapeBlur";

<div style={{ height: 500, position: "relative" }}>
  <ShapeBlur variation={0} shapeSize={1} roundness={0.5} borderSize={0.05} circleSize={0.25} circleEdge={1} />
</div>`,
    Preview: () => (
      <Caja centrado={false}>
        <Letrero texto="Mové el mouse" />
        <ShapeBlur variation={0} pixelRatioProp={1} shapeSize={1} roundness={0.5} borderSize={0.05} circleSize={0.25} circleEdge={1} />
      </Caja>
    ),
  },
  {
    id: "splash-cursor",
    nombre: "SplashCursor",
    origen: "React Bits",
    categoria: "Animaciones",
    descripcion: "Simulación de fluido a pantalla completa: el cursor deja salpicaduras de color que se mezclan.",
    argumento: "El efecto más 'wow' de todos: la web entera se vuelve pintura líquida al mover el mouse.",
    ruta: RUTA("SplashCursor"),
    pesada: true,
    uso: `import SplashCursor from "@/components/animaciones/rb/animations/SplashCursor/SplashCursor";

// Se monta una vez en el layout: cubre toda la pantalla (position fixed).
<SplashCursor DENSITY_DISSIPATION={3.5} VELOCITY_DISSIPATION={2} SPLAT_RADIUS={0.2} SPLAT_FORCE={6000} COLOR="#A855F7" />`,
    Preview: () => (
      <Caja centrado={false}>
        <Letrero texto="Mové el mouse" sub="cubre toda la pantalla mientras está abierta" />
        <SplashCursor DENSITY_DISSIPATION={3.5} VELOCITY_DISSIPATION={2} PRESSURE={0.1} CURL={3} SPLAT_RADIUS={0.2} SPLAT_FORCE={6000} COLOR_UPDATE_SPEED={10} SHADING RAINBOW_MODE={false} COLOR="#A855F7" />
      </Caja>
    ),
  },
  {
    id: "star-border",
    nombre: "StarBorder",
    origen: "React Bits",
    categoria: "Animaciones",
    descripcion: "Botón con un destello que recorre el borde de punta a punta en loop.",
    argumento: "Botón de compra o contacto con un brillo que gira: se destaca sin gritar.",
    ruta: RUTA("StarBorder"),
    uso: `import StarBorder from "@/components/animaciones/rb/animations/StarBorder/StarBorder";

// Requiere en globals.css los keyframes star-movement-top / star-movement-bottom (ver preview).
<StarBorder as="button" color="magenta" speed="5s" thickness={1} backgroundColor="#000" textColor="#fff">
  Comprar ahora
</StarBorder>`,
    Preview: () => (
      <Caja>
        <style>{ANIM_ESTRELLAS}</style>
        <StarBorder as="button" color="magenta" thickness={1} speed="5s" backgroundColor="#000000" textColor="#ffffff" borderColor="#222222" style={{ fontFamily: "system-ui, sans-serif" }}>
          Que tu negocio fluya
        </StarBorder>
      </Caja>
    ),
  },
  {
    id: "sticker-peel",
    nombre: "StickerPeel",
    origen: "React Bits",
    categoria: "Animaciones",
    descripcion: "Una calcomanía que se despega al pasar el mouse y se puede arrastrar por la pantalla.",
    argumento: "Tu logo o promo como sticker real que el visitante despega y mueve: cero aburrido.",
    ruta: RUTA("StickerPeel"),
    uso: `import StickerPeel from "@/components/animaciones/rb/animations/StickerPeel/StickerPeel";

<div style={{ position: "relative", height: 400 }}>
  <StickerPeel imageSrc="/sticker.png" width={200} rotate={0} peelBackHoverPct={30} peelBackActivePct={40} shadowIntensity={0.5} />
</div>`,
    Preview: () => (
      <Caja centrado={false}>
        <Letrero texto="Arrastrala" sub="o pasá el mouse" />
        <StickerPeel imageSrc={FOTO_C} rotate={0} width={180} peelBackHoverPct={30} peelBackActivePct={40} lightingIntensity={0.1} shadowIntensity={0.5} peelDirection={0} initialPosition="center" />
      </Caja>
    ),
  },
  {
    id: "strands",
    nombre: "Strands",
    origen: "React Bits",
    categoria: "Animaciones",
    descripcion: "Hebras de luz de colores que ondulan y brillan, con opción de lente de vidrio bajo el cursor.",
    argumento: "Fondo de aurora luminosa para un hero moderno: colores de tu marca fluyendo.",
    ruta: RUTA("Strands"),
    pesada: true,
    uso: `import Strands from "@/components/animaciones/rb/animations/Strands/Strands";

<div style={{ height: 500 }}>
  <Strands colors={["#F97316", "#7C3AED", "#06B6D4"]} count={3} speed={0.5} amplitude={1} thickness={0.7} glow={2.6} />
</div>`,
    Preview: () => (
      <Caja centrado={false}>
        <Strands colors={["#F97316", "#7C3AED", "#06B6D4"]} count={3} speed={0.5} amplitude={1} waviness={1} thickness={0.7} glow={2.6} taper={3} spread={1} hueShift={0} intensity={0.6} saturation={2} opacity={1} scale={1.5} glass={false} refraction={1} dispersion={1} glassSize={1} />
      </Caja>
    ),
  },
  {
    id: "swarm-cursor",
    nombre: "SwarmCursor",
    origen: "React Bits",
    categoria: "Animaciones",
    descripcion: "Un enjambre de puntitos luminosos sigue al cursor, se fusiona y se dispersa al hacer click.",
    argumento: "Cursor vivo, como luciérnagas que acompañan al visitante por tu web.",
    ruta: RUTA("SwarmCursor"),
    pesada: true,
    uso: `import SwarmCursor from "@/components/animaciones/rb/animations/SwarmCursor/SwarmCursor";

<div style={{ height: 400 }}>
  <SwarmCursor color="#ffffff" accentColor="#B497CF" count={8} size={5} merge={0.77} glow={0.75} scatterOnClick>
    <h2>Mové el mouse</h2>
  </SwarmCursor>
</div>`,
    Preview: () => (
      <Caja centrado={false}>
        <SwarmCursor color="#ffffff" accentColor="#B497CF" count={8} size={5} merge={0.77} glow={0.75} opacity={1} spread={100} separation={0.15} speed={2.5} wander={0.25} trail={0.75} scatterOnClick enabled>
          <div style={{ textAlign: "center", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
            <div style={{ fontSize: 30, fontWeight: 700 }}>Mové el mouse</div>
            <div style={{ fontSize: 13, opacity: 0.6 }}>click para dispersar</div>
          </div>
        </SwarmCursor>
      </Caja>
    ),
  },
  {
    id: "target-cursor",
    nombre: "TargetCursor",
    origen: "React Bits",
    categoria: "Animaciones",
    descripcion: "Cursor con cuatro esquinas que gira y se ajusta al contorno de los elementos marcados como objetivo.",
    argumento: "Tus botones y tarjetas se 'enmarcan' al pasar el mouse: navegación con precisión de app.",
    ruta: RUTA("TargetCursor"),
    uso: `import TargetCursor from "@/components/animaciones/rb/animations/TargetCursor/TargetCursor";

// Una sola vez en el layout; agregá className="cursor-target" a lo que quieras enmarcar.
<TargetCursor targetSelector=".cursor-target" spinDuration={2} hideDefaultCursor hoverDuration={0.2} parallaxOn cursorColor="#fff" cursorColorOnTarget="#B497CF" />
<button className="cursor-target">Comprar</button>`,
    Preview: () => (
      <Caja>
        <TargetCursor targetSelector=".cauce-target" spinDuration={2} hideDefaultCursor={false} hoverDuration={0.2} parallaxOn cursorColor="#ffffff" cursorColorOnTarget="#B497CF" />
        <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
          <div className="cauce-target">
            <Tarjeta ancho={180} alto={110} texto="Apuntame" />
          </div>
          <div className="cauce-target" style={{ padding: "14px 26px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.3)", color: "#fff", fontFamily: "system-ui, sans-serif", fontWeight: 600 }}>
            Comprar
          </div>
        </div>
      </Caja>
    ),
  },
];
