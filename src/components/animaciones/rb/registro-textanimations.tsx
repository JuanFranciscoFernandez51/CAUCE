"use client";

/**
 * React Bits (MIT + Commons Clause) · categoría "Textos".
 * Fuente de cada componente: src/components/animaciones/rb/textanimations/<Nombre>/<Nombre>.tsx
 * ScrollReveal y TextLoop ya están portados a mano en src/components/animaciones/ (no se duplican acá).
 */
import dynamic from "next/dynamic";
import { useRef } from "react";
import { Caja, type Animacion } from "../tipos";

/* eslint-disable @typescript-eslint/no-explicit-any */
const ASCIIText = dynamic(() => import("./textanimations/ASCIIText/ASCIIText"), { ssr: false }) as any;
const BlurText = dynamic(() => import("./textanimations/BlurText/BlurText"), { ssr: false }) as any;
const CircularText = dynamic(() => import("./textanimations/CircularText/CircularText"), { ssr: false }) as any;
const CountUp = dynamic(() => import("./textanimations/CountUp/CountUp"), { ssr: false }) as any;
const CurvedLoop = dynamic(() => import("./textanimations/CurvedLoop/CurvedLoop"), { ssr: false }) as any;
const DecryptedText = dynamic(() => import("./textanimations/DecryptedText/DecryptedText"), { ssr: false }) as any;
const DepthText = dynamic(() => import("./textanimations/DepthText/DepthText"), { ssr: false }) as any;
const EchoText = dynamic(() => import("./textanimations/EchoText/EchoText"), { ssr: false }) as any;
const FallingText = dynamic(() => import("./textanimations/FallingText/FallingText"), { ssr: false }) as any;
const FoldText = dynamic(() => import("./textanimations/FoldText/FoldText"), { ssr: false }) as any;
const FuzzyText = dynamic(() => import("./textanimations/FuzzyText/FuzzyText"), { ssr: false }) as any;
const GlitchText = dynamic(() => import("./textanimations/GlitchText/GlitchText"), { ssr: false }) as any;
const GradientText = dynamic(() => import("./textanimations/GradientText/GradientText"), { ssr: false }) as any;
const MaskedHeading = dynamic(() => import("./textanimations/MaskedHeading/MaskedHeading"), { ssr: false }) as any;
const ParticleText = dynamic(() => import("./textanimations/ParticleText/ParticleText"), { ssr: false }) as any;
const RotatingText = dynamic(() => import("./textanimations/RotatingText/RotatingText"), { ssr: false }) as any;
const ScrambledText = dynamic(() => import("./textanimations/ScrambledText/ScrambledText"), { ssr: false }) as any;
const ScrollFloat = dynamic(() => import("./textanimations/ScrollFloat/ScrollFloat"), { ssr: false }) as any;
const ScrollVelocity = dynamic(() => import("./textanimations/ScrollVelocity/ScrollVelocity"), { ssr: false }) as any;
const ShinyText = dynamic(() => import("./textanimations/ShinyText/ShinyText"), { ssr: false }) as any;
const Shuffle = dynamic(() => import("./textanimations/Shuffle/Shuffle"), { ssr: false }) as any;
const SplitFlapText = dynamic(() => import("./textanimations/SplitFlapText/SplitFlapText"), { ssr: false }) as any;
const SplitText = dynamic(() => import("./textanimations/SplitText/SplitText"), { ssr: false }) as any;
const StrokeText = dynamic(() => import("./textanimations/StrokeText/StrokeText"), { ssr: false }) as any;
const TextCursor = dynamic(() => import("./textanimations/TextCursor/TextCursor"), { ssr: false }) as any;
const TextPressure = dynamic(() => import("./textanimations/TextPressure/TextPressure"), { ssr: false }) as any;
const TextType = dynamic(() => import("./textanimations/TextType/TextType"), { ssr: false }) as any;
const TrueFocus = dynamic(() => import("./textanimations/TrueFocus/TrueFocus"), { ssr: false }) as any;
const VariableProximity = dynamic(() => import("./textanimations/VariableProximity/VariableProximity"), { ssr: false }) as any;
const WarpText = dynamic(() => import("./textanimations/WarpText/WarpText"), { ssr: false }) as any;

const FRASE = "Que tu negocio fluya";
const FOTO = "https://res.cloudinary.com/dgtlyzyra/image/upload/jessdesign/audi-edificio";
const ROBOTO_FLEX =
  "https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wdth,wght@8..144,25..151,100..1000&display=swap";

/** VariableProximity necesita un ref al contenedor donde se mide el mouse. */
function PreviewVariableProximity() {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref} style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`@import url('${ROBOTO_FLEX}');`}</style>
      <VariableProximity
        label={FRASE}
        fromFontVariationSettings="'wght' 400, 'opsz' 9"
        toFontVariationSettings="'wght' 1000, 'opsz' 40"
        containerRef={ref}
        radius={100}
        falloff="linear"
        style={{ fontFamily: "'Roboto Flex', sans-serif", fontSize: 40, color: "#fff" }}
      />
    </div>
  );
}

const T = "src/components/animaciones/rb/textanimations";

export const ENTRADAS: Animacion[] = [
  {
    id: "ascii-text",
    nombre: "ASCIIText",
    origen: "React Bits",
    categoria: "Textos",
    descripcion: "Texto 3D renderizado como caracteres ASCII que ondulan y siguen el mouse.",
    argumento: "Un título con estética retro-hacker que nadie más tiene: ideal para marcas tech o gamer.",
    ruta: `${T}/ASCIIText/ASCIIText.tsx`,
    uso: `import ASCIIText from "@/components/animaciones/rb/textanimations/ASCIIText/ASCIIText";

<div style={{ position: "relative", height: 400 }}>
  <ASCIIText text="Hey!" enableWaves asciiFontSize={8} textFontSize={250} planeBaseHeight={12} />
</div>`,
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <ASCIIText text="Cauce" enableWaves asciiFontSize={8} textFontSize={200} planeBaseHeight={10} />
      </Caja>
    ),
  },
  {
    id: "blur-text",
    nombre: "BlurText",
    origen: "React Bits",
    categoria: "Textos",
    descripcion: "Las palabras (o letras) aparecen desenfocadas y se enfocan una a una al entrar en pantalla.",
    argumento: "Un título de home que se revela con elegancia: transmite calidad sin hacer ruido.",
    ruta: `${T}/BlurText/BlurText.tsx`,
    uso: `import BlurText from "@/components/animaciones/rb/textanimations/BlurText/BlurText";

<BlurText text="Que tu negocio fluya" animateBy="words" direction="top" delay={200} className="text-4xl font-bold" />`,
    Preview: () => (
      <Caja>
        <BlurText text={FRASE} animateBy="words" direction="top" delay={200} className="text-4xl font-bold text-white justify-center" />
      </Caja>
    ),
  },
  {
    id: "circular-text",
    nombre: "CircularText",
    origen: "React Bits",
    categoria: "Textos",
    descripcion: "Texto dispuesto en círculo que gira sin parar y acelera o frena al pasar el mouse.",
    argumento: "Un sello giratorio tipo 'tienda oficial' o 'envíos gratis' que le da vida a cualquier rincón.",
    ruta: `${T}/CircularText/CircularText.tsx`,
    uso: `import CircularText from "@/components/animaciones/rb/textanimations/CircularText/CircularText";

<CircularText text="TIENDA*OFICIAL*CAUCE*" onHover="speedUp" spinDuration={20} />`,
    Preview: () => (
      <Caja>
        <CircularText text="QUE*TU*NEGOCIO*FLUYA*" onHover="speedUp" spinDuration={20} />
      </Caja>
    ),
  },
  {
    id: "count-up",
    nombre: "CountUp",
    origen: "React Bits",
    categoria: "Textos",
    descripcion: "Un número que cuenta desde un valor hasta otro cuando entra en pantalla, con separador de miles.",
    argumento: "Mostrá '+1.500 clientes' o '20 años' contando en vivo: los números que suben venden solos.",
    ruta: `${T}/CountUp/CountUp.tsx`,
    uso: `import CountUp from "@/components/animaciones/rb/textanimations/CountUp/CountUp";

<CountUp from={0} to={1500} duration={1} delay={0} direction="up" separator="." className="text-5xl font-bold" />`,
    Preview: () => (
      <Caja>
        <div style={{ color: "#fff", fontSize: 56, fontWeight: 800, display: "flex", alignItems: "baseline", gap: 8 }}>
          +<CountUp from={0} to={1500} duration={1.5} delay={0} direction="up" separator="." />
          <span style={{ fontSize: 22, fontWeight: 500, opacity: 0.7 }}>clientes</span>
        </div>
      </Caja>
    ),
  },
  {
    id: "curved-loop",
    nombre: "CurvedLoop",
    origen: "React Bits",
    categoria: "Textos",
    descripcion: "Marquee de texto que corre sobre una curva y se puede arrastrar con el mouse.",
    argumento: "Una cinta curva con tus promos o valores que cruza la home en loop: moderna y arrastrable.",
    ruta: `${T}/CurvedLoop/CurvedLoop.tsx`,
    uso: `import CurvedLoop from "@/components/animaciones/rb/textanimations/CurvedLoop/CurvedLoop";

<CurvedLoop marqueeText="Envíos ✦ Gratis ✦ A ✦ Todo ✦ El ✦ País ✦" speed={2} curveAmount={400} interactive />`,
    Preview: () => (
      <Caja>
        <div className="w-full [&>div]:min-h-0!">
          <CurvedLoop marqueeText="Que ✦ tu ✦ negocio ✦ fluya ✦" speed={2} curveAmount={200} interactive />
        </div>
      </Caja>
    ),
  },
  {
    id: "decrypted-text",
    nombre: "DecryptedText",
    origen: "React Bits",
    categoria: "Textos",
    descripcion: "El texto aparece como caracteres al azar que se van 'descifrando' hasta formar la frase.",
    argumento: "Efecto hacker para lanzamientos o promos secretas: la gente se queda a ver qué dice.",
    ruta: `${T}/DecryptedText/DecryptedText.tsx`,
    uso: `import DecryptedText from "@/components/animaciones/rb/textanimations/DecryptedText/DecryptedText";

<DecryptedText text="Que tu negocio fluya" speed={60} maxIterations={10} sequential revealDirection="start" animateOn="view" />`,
    Preview: () => (
      <Caja>
        <div style={{ color: "#fff", fontSize: 36, fontWeight: 700, fontFamily: "monospace" }}>
          <DecryptedText text={FRASE} speed={60} maxIterations={10} sequential revealDirection="start" animateOn="view" clickMode="once" />
        </div>
      </Caja>
    ),
  },
  {
    id: "depth-text",
    nombre: "DepthText",
    origen: "React Bits",
    categoria: "Textos",
    descripcion: "Texto extruido en 3D con capas de profundidad que se inclina siguiendo el mouse u orbita solo.",
    argumento: "Un logo o título con volumen real que gira con el mouse: presencia de marca grande.",
    ruta: `${T}/DepthText/DepthText.tsx`,
    uso: `import DepthText from "@/components/animaciones/rb/textanimations/DepthText/DepthText";

<DepthText text="Cauce" layers={34} depth={2.4} faceColor="#f8fafc" depthColor="#7c3aed" tilt={7.5} pointerTracking autoOrbit orbitSpeed={0.35} fontSize="clamp(3rem, 12vw, 7rem)" fontWeight={900} shadow />`,
    Preview: () => (
      <Caja>
        <DepthText
          text="Cauce"
          layers={30}
          depth={2.2}
          faceColor="#f8fafc"
          depthColor="#7c3aed"
          tilt={7.5}
          pointerTracking
          smoothing={0.14}
          perspective={900}
          autoOrbit
          orbitSpeed={0.35}
          fontSize={88}
          fontWeight={900}
          shadow
        />
      </Caja>
    ),
  },
  {
    id: "echo-text",
    nombre: "EchoText",
    origen: "React Bits",
    categoria: "Textos",
    descripcion: "El texto deja copias fantasma que lo siguen con retraso, tanto al entrar como al mover el mouse.",
    argumento: "Un título con estela de movimiento: sensación de velocidad para marcas dinámicas.",
    ruta: `${T}/EchoText/EchoText.tsx`,
    uso: `import EchoText from "@/components/animaciones/rb/textanimations/EchoText/EchoText";

<EchoText text="Que tu negocio fluya" echoes={12} lag={0.24} offset={36} direction="right" fade={0.72} blur={3} tint="#7dd3fc" mode="both" fontSize="clamp(3rem, 9vw, 7rem)" fontWeight={800} color="#f8fafc" />`,
    Preview: () => (
      <Caja>
        <EchoText
          text={FRASE}
          echoes={10}
          lag={0.24}
          offset={24}
          direction="right"
          fade={0.72}
          blur={3}
          tint="#7dd3fc"
          mode="both"
          cursorRadius={320}
          duration={900}
          ease="ease-out"
          fontSize={44}
          fontWeight={800}
          color="#f8fafc"
        />
      </Caja>
    ),
  },
  {
    id: "falling-text",
    nombre: "FallingText",
    origen: "React Bits",
    categoria: "Textos",
    descripcion: "Las palabras caen con física real (gravedad, rebote) y se pueden arrastrar con el mouse.",
    argumento: "Un párrafo que se desarma y cae al pasar el mouse: sorpresa garantizada en la home.",
    ruta: `${T}/FallingText/FallingText.tsx`,
    uso: `import FallingText from "@/components/animaciones/rb/textanimations/FallingText/FallingText";

<div style={{ height: 300, position: "relative" }}>
  <FallingText text="Que tu negocio fluya con Cauce" highlightWords={["fluya", "Cauce"]} highlightClass="text-violet-400" trigger="hover" gravity={0.56} fontSize="2rem" mouseConstraintStiffness={0.9} />
</div>`,
    Preview: () => (
      <Caja centrado={false}>
        <div style={{ color: "#fff", fontWeight: 600, width: "100%", height: "100%" }}>
          <FallingText
            text="Que tu negocio fluya con Cauce, todo tu comercio en un solo lugar."
            highlightWords={["fluya", "Cauce"]}
            highlightClass="text-violet-400 font-bold"
            trigger="hover"
            gravity={0.56}
            fontSize="1.6rem"
            mouseConstraintStiffness={0.9}
          />
        </div>
      </Caja>
    ),
  },
  {
    id: "fold-text",
    nombre: "FoldText",
    origen: "React Bits",
    categoria: "Textos",
    descripcion: "Cada letra se despliega como una hoja plegada en 3D, con sombreado en el pliegue.",
    argumento: "Un título que se desdobla como una carta: fino, editorial, perfecto para marcas premium.",
    ruta: `${T}/FoldText/FoldText.tsx`,
    uso: `import FoldText from "@/components/animaciones/rb/textanimations/FoldText/FoldText";

<FoldText text="Que tu negocio fluya" splitBy="char" hinge="top" duration={0.65} stagger={0.045} ease="power3.out" perspective={700} creaseShading={0.55} trigger="mount" fontSize={80} fontWeight={800} color="#f7f2e8" />`,
    Preview: () => (
      <Caja>
        <FoldText
          text={FRASE}
          splitBy="char"
          hinge="top"
          duration={0.65}
          stagger={0.045}
          ease="power3.out"
          perspective={700}
          creaseShading={0.55}
          trigger="mount"
          fontSize={44}
          fontWeight={800}
          color="#f7f2e8"
        />
      </Caja>
    ),
  },
  {
    id: "fuzzy-text",
    nombre: "FuzzyText",
    origen: "React Bits",
    categoria: "Textos",
    descripcion: "Texto con bordes 'borrosos' que vibran, y se intensifican al pasar el mouse.",
    argumento: "Ideal para páginas 404 o títulos con onda glitch: divertido y memorable.",
    ruta: `${T}/FuzzyText/FuzzyText.tsx`,
    uso: `import FuzzyText from "@/components/animaciones/rb/textanimations/FuzzyText/FuzzyText";

<FuzzyText baseIntensity={0.2} hoverIntensity={0.5} enableHover fontSize={140} color="#fff">404</FuzzyText>`,
    Preview: () => (
      <Caja>
        <FuzzyText baseIntensity={0.2} hoverIntensity={0.5} enableHover fuzzRange={30} fps={60} direction="horizontal" fontSize={64} color="#fff">
          Cauce
        </FuzzyText>
      </Caja>
    ),
  },
  {
    id: "glitch-text",
    nombre: "GlitchText",
    origen: "React Bits",
    categoria: "Textos",
    descripcion: "Texto con glitch estilo pantalla rota: desplazamientos y sombras de color en loop.",
    argumento: "Un título con actitud para marcas urbanas, gamer o tech: llama la atención al instante.",
    ruta: `${T}/GlitchText/GlitchText.tsx`,
    uso: `import GlitchText from "@/components/animaciones/rb/textanimations/GlitchText/GlitchText";

<GlitchText speed={1} enableShadows enableOnHover={false}>Cauce</GlitchText>`,
    Preview: () => (
      <Caja>
        <div style={{ color: "#fff" }}>
          <GlitchText speed={1} enableShadows enableOnHover={false} className="text-6xl">
            Cauce
          </GlitchText>
        </div>
      </Caja>
    ),
  },
  {
    id: "gradient-text",
    nombre: "GradientText",
    origen: "React Bits",
    categoria: "Textos",
    descripcion: "Texto relleno con un degradé de colores que se mueve en loop.",
    argumento: "Tu título de home con los colores de la marca en movimiento: simple y muy vistoso.",
    ruta: `${T}/GradientText/GradientText.tsx`,
    uso: `import GradientText from "@/components/animaciones/rb/textanimations/GradientText/GradientText";

<GradientText colors={["#5227FF", "#FF9FFC", "#B497CF"]} animationSpeed={8} direction="horizontal" yoyo showBorder={false} className="text-5xl font-bold">
  Que tu negocio fluya
</GradientText>`,
    Preview: () => (
      <Caja>
        <GradientText colors={["#5227FF", "#FF9FFC", "#B497CF"]} animationSpeed={8} direction="horizontal" pauseOnHover={false} yoyo showBorder={false} className="text-5xl font-bold">
          {FRASE}
        </GradientText>
      </Caja>
    ),
  },
  {
    id: "masked-heading",
    nombre: "MaskedHeading",
    origen: "React Bits",
    categoria: "Textos",
    descripcion: "Título gigante recortado sobre una foto o video, con parallax y entrada animada.",
    argumento: "Tu nombre de marca relleno con tus propias fotos o un video: un hero de nivel agencia.",
    ruta: `${T}/MaskedHeading/MaskedHeading.tsx`,
    uso: `import MaskedHeading from "@/components/animaciones/rb/textanimations/MaskedHeading/MaskedHeading";

<MaskedHeading text="Que tu negocio fluya" mediaType="image" src="/foto.jpg" fillScale={1.25} parallax={26} drift={18} reveal="rise" trigger="view" duration={1.1} stagger={0.09} align="center" weight={700} tracking={-0.03} lineHeight={1.06} textScale={0.115} />`,
    Preview: () => (
      <Caja>
        <div style={{ width: "100%" }}>
          <MaskedHeading
            text={FRASE}
            mediaType="image"
            src={FOTO}
            fillScale={1.25}
            parallax={26}
            drift={18}
            brightness={1}
            saturation={1}
            grayscale={false}
            reveal="rise"
            trigger="view"
            duration={1.1}
            stagger={0.09}
            align="center"
            weight={800}
            tracking={-0.03}
            lineHeight={1.06}
            textScale={0.11}
          />
        </div>
      </Caja>
    ),
  },
  {
    id: "particle-text",
    nombre: "ParticleText",
    origen: "React Bits",
    categoria: "Textos",
    descripcion: "El texto se forma a partir de partículas dispersas que se juntan y se apartan del mouse.",
    argumento: "Un título que se arma con miles de puntitos y reacciona al mouse: efecto wow para lanzamientos.",
    ruta: `${T}/ParticleText/ParticleText.tsx`,
    uso: `import ParticleText from "@/components/animaciones/rb/textanimations/ParticleText/ParticleText";

<div style={{ height: 300 }}>
  <ParticleText text="Cauce" particleSize={2.2} density={4} color="#f8fafc" highlightColor="#8b5cf6" scatter={190} gatherDuration={1600} stagger={420} pointerRepel={42} repelRadius={120} idleDrift={0.8} trigger="mount" fontSize="clamp(3.5rem, 13vw, 9rem)" fontWeight={800} glow />
</div>`,
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <ParticleText
          text={FRASE}
          particleSize={2}
          density={4}
          color="#f8fafc"
          highlightColor="#8b5cf6"
          scatter={160}
          gatherDuration={1600}
          stagger={420}
          pointerRepel={42}
          repelRadius={120}
          idleDrift={0.8}
          trigger="mount"
          fontSize={52}
          fontWeight={800}
          fontFamily="inherit"
          glow
        />
      </Caja>
    ),
  },
  {
    id: "rotating-text",
    nombre: "RotatingText",
    origen: "React Bits",
    categoria: "Textos",
    descripcion: "Una palabra que rota por una lista, con cada letra subiendo y bajando con resorte.",
    argumento: "'Vendemos ropa / zapatillas / accesorios' cambiando solo: contás todo lo que hacés en un renglón.",
    ruta: `${T}/RotatingText/RotatingText.tsx`,
    uso: `import RotatingText from "@/components/animaciones/rb/textanimations/RotatingText/RotatingText";

<RotatingText
  texts={["ventas", "turnos", "stock"]}
  mainClassName="px-3 bg-violet-500 text-black rounded-lg overflow-hidden"
  staggerFrom="last" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "-120%" }}
  staggerDuration={0.025} splitLevelClassName="overflow-hidden pb-1"
  transition={{ type: "spring", damping: 30, stiffness: 400 }} rotationInterval={2000}
/>`,
    Preview: () => (
      <Caja>
        <div style={{ color: "#fff", fontSize: 40, fontWeight: 700, display: "flex", alignItems: "center", gap: 12 }}>
          <span>Que fluyan tus</span>
          <RotatingText
            texts={["ventas", "turnos", "stock", "clientes"]}
            mainClassName="px-3 py-1 bg-violet-500 text-black rounded-lg overflow-hidden"
            staggerFrom="last"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-120%" }}
            staggerDuration={0.025}
            splitLevelClassName="overflow-hidden pb-1"
            splitBy="characters"
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            rotationInterval={2000}
            auto
            loop
          />
        </div>
      </Caja>
    ),
  },
  {
    id: "scrambled-text",
    nombre: "ScrambledText",
    origen: "React Bits",
    categoria: "Textos",
    descripcion: "Las letras cerca del mouse se revuelven en símbolos y vuelven a su lugar al alejarse.",
    argumento: "Un párrafo que se desordena bajo el cursor: detalle interactivo para webs con personalidad.",
    ruta: `${T}/ScrambledText/ScrambledText.tsx`,
    uso: `import ScrambledText from "@/components/animaciones/rb/textanimations/ScrambledText/ScrambledText";

<ScrambledText radius={100} duration={1.2} speed={0.5} scrambleChars=".:">
  Pasá el mouse por acá y mirá cómo se revuelven las letras.
</ScrambledText>`,
    Preview: () => (
      <Caja>
        <ScrambledText radius={100} duration={1.2} speed={0.5} scrambleChars=".:" className="text-center font-bold m-0!" style={{ fontSize: 30 }}>
          {FRASE}. Pasá el mouse y mirá cómo se revuelven las letras.
        </ScrambledText>
      </Caja>
    ),
  },
  {
    id: "scroll-float",
    nombre: "ScrollFloat",
    origen: "React Bits",
    categoria: "Textos",
    descripcion: "Cada letra flota y se escala hacia arriba a medida que el texto entra en pantalla con el scroll.",
    argumento: "Títulos de sección que aparecen flotando al scrollear: la página se siente viva sin ser pesada.",
    ruta: `${T}/ScrollFloat/ScrollFloat.tsx`,
    uso: `import ScrollFloat from "@/components/animaciones/rb/textanimations/ScrollFloat/ScrollFloat";

<ScrollFloat stagger={0.03} animationDuration={1} textClassName="text-white font-bold">Que tu negocio fluya</ScrollFloat>`,
    Preview: () => (
      <Caja>
        <ScrollFloat stagger={0.03} animationDuration={1} textClassName="text-white font-bold">
          {FRASE}
        </ScrollFloat>
      </Caja>
    ),
  },
  {
    id: "scroll-velocity",
    nombre: "ScrollVelocity",
    origen: "React Bits",
    categoria: "Textos",
    descripcion: "Cintas de texto que corren en loop y cambian de velocidad y dirección según el scroll.",
    argumento: "Marquee con tus promos que acelera cuando la gente scrollea: energía pura para la home.",
    ruta: `${T}/ScrollVelocity/ScrollVelocity.tsx`,
    uso: `import ScrollVelocity from "@/components/animaciones/rb/textanimations/ScrollVelocity/ScrollVelocity";

<ScrollVelocity texts={["Que tu negocio fluya", "Envíos a todo el país"]} velocity={100} numCopies={6} damping={50} stiffness={400} className="text-white" />`,
    Preview: () => (
      <Caja>
        <div style={{ width: "100%", color: "#fff" }}>
          <ScrollVelocity texts={[FRASE + " ✦ ", "Cauce ✦ "]} velocity={100} numCopies={6} damping={50} stiffness={400} className="px-2" />
        </div>
      </Caja>
    ),
  },
  {
    id: "shiny-text",
    nombre: "ShinyText",
    origen: "React Bits",
    categoria: "Textos",
    descripcion: "Un brillo recorre el texto de lado a lado en loop, como un reflejo metálico.",
    argumento: "El toque premium para un botón o título: 'Nueva colección' con brillo que pasa.",
    ruta: `${T}/ShinyText/ShinyText.tsx`,
    uso: `import ShinyText from "@/components/animaciones/rb/textanimations/ShinyText/ShinyText";

<ShinyText text="✨ Nueva colección" speed={2} color="#b5b5b5" shineColor="#ffffff" spread={120} direction="left" className="text-4xl font-semibold" />`,
    Preview: () => (
      <Caja>
        <ShinyText
          text={`✨ ${FRASE}`}
          speed={2}
          delay={0}
          color="#b5b5b5"
          shineColor="#ffffff"
          spread={120}
          direction="left"
          yoyo={false}
          pauseOnHover={false}
          className="text-4xl font-semibold"
        />
      </Caja>
    ),
  },
  {
    id: "shuffle",
    nombre: "Shuffle",
    origen: "React Bits",
    categoria: "Textos",
    descripcion: "Cada letra se baraja deslizándose como fichas hasta quedar en su lugar; se repite al pasar el mouse.",
    argumento: "Un título que se arma como un tablero de aeropuerto: dinámico y con carácter.",
    ruta: `${T}/Shuffle/Shuffle.tsx`,
    uso: `import Shuffle from "@/components/animaciones/rb/textanimations/Shuffle/Shuffle";

<Shuffle text="CAUCE" ease="power3.out" duration={0.35} shuffleTimes={1} stagger={0.03} shuffleDirection="right" triggerOnHover className="text-6xl font-black" />`,
    Preview: () => (
      <Caja>
        <div style={{ color: "#fff" }}>
          <Shuffle
            text="QUE TU NEGOCIO FLUYA"
            ease="power3.out"
            duration={0.35}
            shuffleTimes={1}
            stagger={0.03}
            shuffleDirection="right"
            loop={false}
            loopDelay={0}
            triggerOnHover
            className="text-4xl font-black"
          />
        </div>
      </Caja>
    ),
  },
  {
    id: "split-flap-text",
    nombre: "SplitFlapText",
    origen: "React Bits",
    categoria: "Textos",
    descripcion: "Tablero de fichas giratorias (estilo estación de tren) que va cambiando de frase.",
    argumento: "Tus promos rotando en un panel de aeropuerto: 'ENVIO GRATIS' → '3 CUOTAS' → 'NUEVO'.",
    ruta: `${T}/SplitFlapText/SplitFlapText.tsx`,
    uso: `import SplitFlapText from "@/components/animaciones/rb/textanimations/SplitFlapText/SplitFlapText";

<SplitFlapText words={["ENVIO GRATIS", "3 CUOTAS", "NUEVA COLECCION"]} flipDuration={0.12} stagger={0.06} cycleDelay={2400} charset="alphanumeric" flipsPerChar={8} tileColor="#111827" textColor="#f8fafc" tileRadius={8} gap={6} fontSize={52} loop padTo={12} />`,
    Preview: () => (
      <Caja>
        <SplitFlapText
          words={["NEGOCIO FLUYE", "ENVIO GRATIS", "3 CUOTAS"]}
          flipDuration={0.12}
          stagger={0.06}
          cycleDelay={2400}
          charset="alphanumeric"
          flipsPerChar={8}
          tileColor="#111827"
          textColor="#f8fafc"
          tileRadius={6}
          gap={4}
          fontSize={28}
          loop
          padTo={13}
        />
      </Caja>
    ),
  },
  {
    id: "split-text",
    nombre: "SplitText",
    origen: "React Bits",
    categoria: "Textos",
    descripcion: "El texto entra letra por letra (o palabra por palabra) subiendo y apareciendo, al verse en pantalla.",
    argumento: "El clásico de los títulos animados: elegante, rápido y funciona en cualquier rubro.",
    ruta: `${T}/SplitText/SplitText.tsx`,
    uso: `import SplitText from "@/components/animaciones/rb/textanimations/SplitText/SplitText";

<SplitText text="Que tu negocio fluya" delay={50} duration={1.25} ease="power3.out" splitType="chars" className="text-5xl font-bold" />`,
    Preview: () => (
      <Caja>
        <SplitText text={FRASE} delay={50} duration={1.25} ease="power3.out" splitType="chars" className="text-5xl font-bold text-white" />
      </Caja>
    ),
  },
  {
    id: "stroke-text",
    nombre: "StrokeText",
    origen: "React Bits",
    categoria: "Textos",
    descripcion: "Las letras se dibujan con un trazo de contorno y después se rellenan con un barrido.",
    argumento: "Tu marca 'dibujándose' en pantalla: efecto de firma que queda bárbaro en un hero.",
    ruta: `${T}/StrokeText/StrokeText.tsx`,
    uso: `import StrokeText from "@/components/animaciones/rb/textanimations/StrokeText/StrokeText";

<StrokeText text="Cauce" strokeColor="#A78BFA" fillColor="#F8FAFC" strokeWidth={1.4} drawDuration={1.6} fillDelay={0.2} stagger={0.05} ease="power2.out" trigger="mount" fillMode="wipe" fontSize={128} fontWeight={800} letterSpacing={-4} />`,
    Preview: () => (
      <Caja>
        <StrokeText
          text={FRASE}
          strokeColor="#A78BFA"
          fillColor="#F8FAFC"
          strokeWidth={1.4}
          drawDuration={1.6}
          fillDelay={0.2}
          stagger={0.05}
          ease="power2.out"
          trigger="mount"
          fillMode="wipe"
          fontSize={48}
          fontWeight={800}
          letterSpacing={-1}
          reverse={false}
          style={{ margin: "0 auto" }}
        />
      </Caja>
    ),
  },
  {
    id: "text-cursor",
    nombre: "TextCursor",
    origen: "React Bits",
    categoria: "Textos",
    descripcion: "Un texto o emoji sigue al mouse dejando una estela que gira y flota.",
    argumento: "Tu logo o emoji siguiendo el cursor por toda la página: detalle juguetón que la gente recuerda.",
    ruta: `${T}/TextCursor/TextCursor.tsx`,
    uso: `import TextCursor from "@/components/animaciones/rb/textanimations/TextCursor/TextCursor";

<div style={{ height: 300, position: "relative" }}>
  <TextCursor text="🌊" followMouseDirection randomFloat />
</div>`,
    Preview: () => (
      <Caja centrado={false}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,.35)", fontSize: 20, pointerEvents: "none" }}>
          Movete por acá
        </div>
        <TextCursor text="🌊" followMouseDirection randomFloat />
      </Caja>
    ),
  },
  {
    id: "text-pressure",
    nombre: "TextPressure",
    origen: "React Bits",
    categoria: "Textos",
    descripcion: "Tipografía variable: las letras se engordan, ensanchan o inclinan según la cercanía del mouse.",
    argumento: "Un título que 'respira' cuando el cliente pasa el mouse: sofisticado y distinto.",
    ruta: `${T}/TextPressure/TextPressure.tsx`,
    uso: `import TextPressure from "@/components/animaciones/rb/textanimations/TextPressure/TextPressure";

<div style={{ position: "relative", height: 300 }}>
  <TextPressure text="Cauce" flex alpha={false} stroke={false} width weight italic textColor="#ffffff" strokeColor="#5227FF" minFontSize={36} />
</div>`,
    Preview: () => (
      <Caja centrado={false}>
        <TextPressure text="Que tu negocio fluya" flex alpha={false} stroke={false} width weight italic textColor="#ffffff" strokeColor="#5227FF" minFontSize={24} />
      </Caja>
    ),
  },
  {
    id: "text-type",
    nombre: "TextType",
    origen: "React Bits",
    categoria: "Textos",
    descripcion: "Efecto máquina de escribir: tipea una frase, la borra y pasa a la siguiente, con cursor parpadeante.",
    argumento: "Tu propuesta escribiéndose sola en la home: 'Turnos online. Envíos gratis. Pagá en cuotas.'",
    ruta: `${T}/TextType/TextType.tsx`,
    uso: `import TextType from "@/components/animaciones/rb/textanimations/TextType/TextType";

<TextType text={["Que tu negocio fluya", "Turnos, ventas y stock en un solo lugar"]} typingSpeed={75} pauseDuration={1500} deletingSpeed={50} showCursor cursorCharacter="_" cursorBlinkDuration={0.5} className="text-4xl font-bold" />`,
    Preview: () => (
      <Caja>
        <div style={{ color: "#fff", fontSize: 36, fontWeight: 700, textAlign: "center", padding: "0 16px" }}>
          <TextType
            text={[FRASE, "Turnos, ventas y stock en un solo lugar"]}
            typingSpeed={75}
            pauseDuration={1500}
            deletingSpeed={50}
            showCursor
            cursorCharacter="_"
            cursorBlinkDuration={0.5}
          />
        </div>
      </Caja>
    ),
  },
  {
    id: "true-focus",
    nombre: "TrueFocus",
    origen: "React Bits",
    categoria: "Textos",
    descripcion: "Un marco de enfoque salta palabra por palabra; la que está en foco se ve nítida y el resto borroso.",
    argumento: "Recorré tus valores palabra a palabra como una cámara enfocando: cinematográfico y claro.",
    ruta: `${T}/TrueFocus/TrueFocus.tsx`,
    uso: `import TrueFocus from "@/components/animaciones/rb/textanimations/TrueFocus/TrueFocus";

<TrueFocus sentence="Que tu negocio fluya" manualMode={false} blurAmount={5} borderColor="#5227FF" animationDuration={0.5} pauseBetweenAnimations={1} />`,
    Preview: () => (
      <Caja>
        <div style={{ color: "#fff" }}>
          <TrueFocus sentence={FRASE} manualMode={false} blurAmount={5} borderColor="#5227FF" animationDuration={0.5} pauseBetweenAnimations={1} />
        </div>
      </Caja>
    ),
  },
  {
    id: "variable-proximity",
    nombre: "VariableProximity",
    origen: "React Bits",
    categoria: "Textos",
    descripcion: "Con una fuente variable, las letras cercanas al mouse se vuelven más gruesas y grandes.",
    argumento: "Un texto que reacciona al cursor como un imán: detalle de diseño que eleva toda la web.",
    ruta: `${T}/VariableProximity/VariableProximity.tsx`,
    uso: `import { useRef } from "react";
import VariableProximity from "@/components/animaciones/rb/textanimations/VariableProximity/VariableProximity";

const ref = useRef<HTMLDivElement>(null);
<div ref={ref} style={{ fontFamily: "'Roboto Flex', sans-serif" }}>
  <VariableProximity label="Que tu negocio fluya" fromFontVariationSettings="'wght' 400, 'opsz' 9" toFontVariationSettings="'wght' 1000, 'opsz' 40" containerRef={ref} radius={100} falloff="linear" />
</div>`,
    Preview: () => (
      <Caja centrado={false}>
        <PreviewVariableProximity />
      </Caja>
    ),
  },
  {
    id: "warp-text",
    nombre: "WarpText",
    origen: "React Bits",
    categoria: "Textos",
    descripcion: "Texto deformado por ondas líquidas en WebGL, con refracción y ondas que siguen al mouse.",
    argumento: "Tu marca ondulando como agua: hero de alto impacto para lanzamientos o marcas creativas.",
    ruta: `${T}/WarpText/WarpText.tsx`,
    uso: `import WarpText from "@/components/animaciones/rb/textanimations/WarpText/WarpText";

<WarpText text="Cauce" color="#f8f5ff" warpStrength={0.08} warpScale={1.7} speed={0.55} pointerInfluence={0.42} pointerStrength={0.38} refraction={0.018} ripple fontSize={116} fontWeight={800} letterSpacing="-0.06em" lineHeight={0.9} style={{ height: 400 }} />`,
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <WarpText
          text={FRASE}
          color="#f8f5ff"
          warpStrength={0.08}
          warpScale={1.7}
          speed={0.55}
          pointerInfluence={0.42}
          pointerStrength={0.38}
          refraction={0.018}
          ripple
          fontSize={52}
          fontWeight={800}
          fontFamily="inherit"
          letterSpacing="-0.04em"
          lineHeight={0.9}
          style={{ height: 260 }}
        />
      </Caja>
    ),
  },
];
