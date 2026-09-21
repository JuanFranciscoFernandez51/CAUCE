"use client";

/**
 * React Bits (MIT + Commons Clause) · categoría "Fondos".
 * Fuente de cada componente: src/components/animaciones/rb/backgrounds/<Nombre>/<Nombre>.tsx
 *
 * Todos van con dynamic + ssr:false: son WebGL/canvas y no sobreviven al SSR.
 * Omitido: Dither (necesita @react-three/postprocessing, que no está instalado).
 */
import dynamic from "next/dynamic";
import { Caja, type Animacion } from "../tipos";
import { hyperspeedPresets } from "./backgrounds/Hyperspeed/HyperSpeedPresets";

/* eslint-disable @typescript-eslint/no-explicit-any */
const AcidSquares = dynamic(() => import("./backgrounds/AcidSquares/AcidSquares"), { ssr: false }) as any;
const AeroShards = dynamic(() => import("./backgrounds/AeroShards/AeroShards"), { ssr: false }) as any;
const Aurora = dynamic(() => import("./backgrounds/Aurora/Aurora"), { ssr: false }) as any;
const Balatro = dynamic(() => import("./backgrounds/Balatro/Balatro"), { ssr: false }) as any;
const Ballpit = dynamic(() => import("./backgrounds/Ballpit/Ballpit"), { ssr: false }) as any;
const Beams = dynamic(() => import("./backgrounds/Beams/Beams"), { ssr: false }) as any;
const CRTWarp = dynamic(() => import("./backgrounds/CRTWarp/CRTWarp"), { ssr: false }) as any;
const ColorBends = dynamic(() => import("./backgrounds/ColorBends/ColorBends"), { ssr: false }) as any;
const DarkVeil = dynamic(() => import("./backgrounds/DarkVeil/DarkVeil"), { ssr: false }) as any;
const DotField = dynamic(() => import("./backgrounds/DotField/DotField"), { ssr: false }) as any;
const DotGrid = dynamic(() => import("./backgrounds/DotGrid/DotGrid"), { ssr: false }) as any;
const EvilEye = dynamic(() => import("./backgrounds/EvilEye/EvilEye"), { ssr: false }) as any;
const FaultyTerminal = dynamic(() => import("./backgrounds/FaultyTerminal/FaultyTerminal"), { ssr: false }) as any;
const Ferrofluid = dynamic(() => import("./backgrounds/Ferrofluid/Ferrofluid"), { ssr: false }) as any;
const FloatingLines = dynamic(() => import("./backgrounds/FloatingLines/FloatingLines"), { ssr: false }) as any;
const Galaxy = dynamic(() => import("./backgrounds/Galaxy/Galaxy"), { ssr: false }) as any;
const GhostFibers = dynamic(() => import("./backgrounds/GhostFibers/GhostFibers"), { ssr: false }) as any;
const GradientBlinds = dynamic(() => import("./backgrounds/GradientBlinds/GradientBlinds"), { ssr: false }) as any;
const GradientWaves = dynamic(() => import("./backgrounds/GradientWaves/GradientWaves"), { ssr: false }) as any;
const Grainient = dynamic(() => import("./backgrounds/Grainient/Grainient"), { ssr: false }) as any;
const GridDistortion = dynamic(() => import("./backgrounds/GridDistortion/GridDistortion"), { ssr: false }) as any;
const GridMotion = dynamic(() => import("./backgrounds/GridMotion/GridMotion"), { ssr: false }) as any;
const GridScan = dynamic(() => import("./backgrounds/GridScan/GridScan").then((m) => m.GridScan), { ssr: false }) as any;
const Hyperspeed = dynamic(() => import("./backgrounds/Hyperspeed/Hyperspeed"), { ssr: false }) as any;
const Iridescence = dynamic(() => import("./backgrounds/Iridescence/Iridescence"), { ssr: false }) as any;
const LetterGlitch = dynamic(() => import("./backgrounds/LetterGlitch/LetterGlitch"), { ssr: false }) as any;
const LightPillar = dynamic(() => import("./backgrounds/LightPillar/LightPillar"), { ssr: false }) as any;
const LightRays = dynamic(() => import("./backgrounds/LightRays/LightRays"), { ssr: false }) as any;
const LightTunnel = dynamic(() => import("./backgrounds/LightTunnel/LightTunnel"), { ssr: false }) as any;
const Lightfall = dynamic(() => import("./backgrounds/Lightfall/Lightfall"), { ssr: false }) as any;
const Lightning = dynamic(() => import("./backgrounds/Lightning/Lightning"), { ssr: false }) as any;
const LineWaves = dynamic(() => import("./backgrounds/LineWaves/LineWaves"), { ssr: false }) as any;
const LiquidChrome = dynamic(() => import("./backgrounds/LiquidChrome/LiquidChrome"), { ssr: false }) as any;
const LiquidEther = dynamic(() => import("./backgrounds/LiquidEther/LiquidEther"), { ssr: false }) as any;
const MoltenMetal = dynamic(() => import("./backgrounds/MoltenMetal/MoltenMetal"), { ssr: false }) as any;
const Orb = dynamic(() => import("./backgrounds/Orb/Orb"), { ssr: false }) as any;
const Particles = dynamic(() => import("./backgrounds/Particles/Particles"), { ssr: false }) as any;
const PixelBlast = dynamic(() => import("./backgrounds/PixelBlast/PixelBlast"), { ssr: false }) as any;
const PixelSnow = dynamic(() => import("./backgrounds/PixelSnow/PixelSnow"), { ssr: false }) as any;
const Plasma = dynamic(() => import("./backgrounds/Plasma/Plasma"), { ssr: false }) as any;
const PlasmaWave = dynamic(() => import("./backgrounds/PlasmaWave/PlasmaWave"), { ssr: false }) as any;
const Prism = dynamic(() => import("./backgrounds/Prism/Prism"), { ssr: false }) as any;
const PrismaticBurst = dynamic(() => import("./backgrounds/PrismaticBurst/PrismaticBurst"), { ssr: false }) as any;
const Radar = dynamic(() => import("./backgrounds/Radar/Radar"), { ssr: false }) as any;
const RippleGrid = dynamic(() => import("./backgrounds/RippleGrid/RippleGrid"), { ssr: false }) as any;
const Scanner = dynamic(() => import("./backgrounds/Scanner/Scanner"), { ssr: false }) as any;
const ShapeGrid = dynamic(() => import("./backgrounds/ShapeGrid/ShapeGrid"), { ssr: false }) as any;
const ShapeWaves = dynamic(() => import("./backgrounds/ShapeWaves/ShapeWaves"), { ssr: false }) as any;
const SideRays = dynamic(() => import("./backgrounds/SideRays/SideRays"), { ssr: false }) as any;
const Silk = dynamic(() => import("./backgrounds/Silk/Silk"), { ssr: false }) as any;
const SlicedWaves = dynamic(() => import("./backgrounds/SlicedWaves/SlicedWaves"), { ssr: false }) as any;
const SoftAurora = dynamic(() => import("./backgrounds/SoftAurora/SoftAurora"), { ssr: false }) as any;
const Threads = dynamic(() => import("./backgrounds/Threads/Threads"), { ssr: false }) as any;
const Topography = dynamic(() => import("./backgrounds/Topography/Topography"), { ssr: false }) as any;
const Waves = dynamic(() => import("./backgrounds/Waves/Waves"), { ssr: false }) as any;
const WebThreads = dynamic(() => import("./backgrounds/WebThreads/WebThreads"), { ssr: false }) as any;

const FOTO_1 = "https://res.cloudinary.com/dgtlyzyra/image/upload/jessdesign/santi-ori-48";
const FOTO_2 = "https://res.cloudinary.com/dgtlyzyra/image/upload/jessdesign/audi-ambientacion";
const RUTA = (n: string) => `src/components/animaciones/rb/backgrounds/${n}/${n}.tsx`;
const IMPORT = (n: string) => `import ${n} from "@/components/animaciones/rb/backgrounds/${n}/${n}";`;
/** Envuelve el JSX de uso en el contenedor típico de un fondo de sección. */
const USO = (n: string, jsx: string, extraImport = "") =>
  `${IMPORT(n)}${extraImport ? `\n${extraImport}` : ""}

<div style={{ position: "relative", height: 500 }}>
  ${jsx}
  {/* tu contenido arriba del fondo, con position: relative + zIndex */}
</div>`;

const ITEMS_GRID = Array.from({ length: 28 }, (_, i) => (i % 3 === 0 ? "Cauce" : i % 3 === 1 ? FOTO_1 : FOTO_2));

const Dither = dynamic(() => import("./backgrounds/Dither/Dither"), { ssr: false }) as any;

export const ENTRADAS: Animacion[] = [
  {
    id: "acid-squares",
    nombre: "AcidSquares",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Mosaico de cuadrados con degradé ácido que ondula y reacciona al mouse.",
    argumento: "Un fondo vibrante y moderno para un hero que grite tecnología sin una sola foto.",
    ruta: RUTA("AcidSquares"),
    uso: USO("AcidSquares", `<AcidSquares color1="#5227FF" color2="#A855F7" color3="#FFFFFF" speed={0.7} zoom={1.3} density={10} />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <AcidSquares color1="#5227FF" color2="#A855F7" color3="#FFFFFF" speed={0.7} zoom={1.3} density={10} glow={1} />
      </Caja>
    ),
  },
  {
    id: "aero-shards",
    nombre: "AeroShards",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Fragmentos de vidrio nacarado que flotan en corriente y se apartan del cursor.",
    argumento: "Efecto premium tipo perfumería o joyería: transmite lujo apenas entra el cliente.",
    ruta: RUTA("AeroShards"),
    uso: USO("AeroShards", `<AeroShards backgroundColor="#120F17" shardColor="#896ABD" accentColor="#A855F7" flow="stream" material="pearl" density={1.5} />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <AeroShards backgroundColor="#120F17" shardColor="#896ABD" accentColor="#A855F7" flow="stream" material="pearl" density={1.5} shardSize={1.1} />
      </Caja>
    ),
  },
  {
    id: "aurora",
    nombre: "Aurora",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Aurora boreal con tres colores que fluyen suave en la parte alta del fondo.",
    argumento: "Elegante y calmo: ideal para spa, estética o cualquier marca que venda bienestar.",
    ruta: RUTA("Aurora"),
    uso: USO("Aurora", `<Aurora colorStops={["#7cff67", "#B497CF", "#5227FF"]} speed={1} blend={0.5} amplitude={1} />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <Aurora colorStops={["#7cff67", "#B497CF", "#5227FF"]} speed={1} blend={0.5} />
      </Caja>
    ),
  },
  {
    id: "balatro",
    nombre: "Balatro",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Remolino de tres colores estilo videojuego de cartas, con opción pixelada.",
    argumento: "Llamativo y retro: perfecto para gaming, bares o eventos con onda.",
    ruta: RUTA("Balatro"),
    uso: USO("Balatro", `<Balatro color1="#DE443B" color2="#006BB4" color3="#162325" isRotate={false} pixelFilter={745} mouseInteraction />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <Balatro color1="#DE443B" color2="#006BB4" color3="#162325" isRotate={false} pixelFilter={745} mouseInteraction />
      </Caja>
    ),
  },
  {
    id: "ballpit",
    nombre: "Ballpit",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Pelotero 3D con física: esferas que caen, rebotan y siguen el cursor.",
    argumento: "Divertido y juguetón: jugueterías, salones infantiles o marcas con humor.",
    ruta: RUTA("Ballpit"),
    uso: USO("Ballpit", `<Ballpit count={100} gravity={0.01} friction={0.9975} wallBounce={0.95} followCursor={false} colors={[0x5227ff, 0xff9ffc, 0xb497cf]} />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <Ballpit count={80} gravity={0.01} friction={0.9975} wallBounce={0.95} followCursor={false} colors={[0x5227ff, 0xff9ffc, 0xb497cf]} />
      </Caja>
    ),
  },
  {
    id: "beams",
    nombre: "Beams",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Haces de luz 3D inclinados que ondulan con ruido sobre fondo oscuro.",
    argumento: "Sobrio y cinematográfico para estudios, productoras o marcas premium.",
    ruta: RUTA("Beams"),
    uso: USO("Beams", `<Beams beamWidth={3} beamHeight={30} beamNumber={20} lightColor="#ffffff" speed={2} noiseIntensity={1.75} scale={0.2} rotation={30} />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <Beams beamWidth={3} beamHeight={30} beamNumber={20} lightColor="#ffffff" speed={2} noiseIntensity={1.75} scale={0.2} rotation={30} />
      </Caja>
    ),
  },
  {
    id: "crt-warp",
    nombre: "CRTWarp",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Pantalla de tubo curvada con scanlines, ondas y bloom retro.",
    argumento: "Nostalgia ochentosa para arcades, tiendas retro o estudios de música.",
    ruta: RUTA("CRTWarp"),
    uso: USO("CRTWarp", `<CRTWarp color="#c755f7" backgroundColor="#05010a" speed={0.5} curvature={0.25} scanlineStrength={0.25} bloom={1.5} />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <CRTWarp color="#c755f7" backgroundColor="#05010a" speed={0.5} curvature={0.25} scanlineStrength={0.25} bloom={1.5} fps={30} />
      </Caja>
    ),
  },
  {
    id: "color-bends",
    nombre: "ColorBends",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Bandas de color que se doblan y deforman siguiendo el cursor.",
    argumento: "Un fondo hipnótico que hace que el visitante se quede jugando en tu página.",
    ruta: RUTA("ColorBends"),
    uso: USO("ColorBends", `<ColorBends colors={["#A855F7"]} rotation={90} speed={0.2} intensity={1.5} bandWidth={6} mouseInfluence={1} />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <ColorBends colors={["#A855F7"]} rotation={90} speed={0.2} scale={1} warpStrength={1} intensity={1.5} bandWidth={6} mouseInfluence={1} parallax={0.5} noise={0.15} />
      </Caja>
    ),
  },
  {
    id: "dark-veil",
    nombre: "DarkVeil",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Velo oscuro con manchas de color que respiran lentamente.",
    argumento: "Un fondo discreto que le da profundidad al hero sin distraer del mensaje.",
    ruta: RUTA("DarkVeil"),
    uso: USO("DarkVeil", `<DarkVeil hueShift={0} speed={0.5} noiseIntensity={0} scanlineIntensity={0} warpAmount={0} />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <DarkVeil hueShift={0} speed={0.5} noiseIntensity={0} scanlineIntensity={0} warpAmount={0} />
      </Caja>
    ),
  },
  {
    id: "dot-field",
    nombre: "DotField",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Campo de puntos con degradé que se abultan y brillan alrededor del cursor.",
    argumento: "Textura sutil e interactiva para una landing de software o servicios.",
    ruta: RUTA("DotField"),
    uso: USO("DotField", `<DotField dotRadius={1.5} dotSpacing={14} cursorRadius={500} bulgeStrength={67} gradientFrom="#A855F7" gradientTo="#B497CF" />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <DotField dotRadius={1.5} dotSpacing={14} cursorRadius={500} cursorForce={0.1} bulgeOnly bulgeStrength={67} glowRadius={160} gradientFrom="#A855F7" gradientTo="#B497CF" glowColor="#120F17" />
      </Caja>
    ),
  },
  {
    id: "dot-grid",
    nombre: "DotGrid",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Grilla de puntos que se iluminan cerca del mouse y se sacuden al hacer clic.",
    argumento: "Fondo limpio y tecnológico; queda bien en cualquier sección de una web de negocios.",
    ruta: RUTA("DotGrid"),
    uso: USO("DotGrid", `<DotGrid dotSize={5} gap={15} baseColor="#2F293A" activeColor="#5227FF" proximity={120} shockRadius={250} />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <DotGrid dotSize={5} gap={15} baseColor="#2F293A" activeColor="#5227FF" proximity={120} shockRadius={250} shockStrength={5} resistance={750} returnDuration={1.5} />
      </Caja>
    ),
  },
  {
    id: "evil-eye",
    nombre: "EvilEye",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Ojo de fuego que sigue al cursor con la pupila y llamea alrededor.",
    argumento: "Impacto puro para Halloween, terror, tatuajes o marcas con actitud.",
    ruta: RUTA("EvilEye"),
    uso: USO("EvilEye", `<EvilEye eyeColor="#FF6F37" intensity={1.5} pupilSize={0.6} glowIntensity={0.35} scale={0.8} backgroundColor="#120F17" />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <EvilEye eyeColor="#FF6F37" intensity={1.5} pupilSize={0.6} irisWidth={0.25} glowIntensity={0.35} scale={0.8} pupilFollow={1} flameSpeed={1} backgroundColor="#120F17" />
      </Caja>
    ),
  },
  {
    id: "faulty-terminal",
    nombre: "FaultyTerminal",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Terminal verde fallada con dígitos, curvatura y scanlines que parpadean.",
    argumento: "Onda hacker para estudios de software, ciberseguridad o escape rooms.",
    ruta: RUTA("FaultyTerminal"),
    uso: USO("FaultyTerminal", `<FaultyTerminal scale={1.5} digitSize={1.2} timeScale={0.5} tint="#A7EF9E" curvature={0.1} brightness={0.6} />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <FaultyTerminal scale={1.5} digitSize={1.2} timeScale={0.5} scanlineIntensity={0.5} curvature={0.1} tint="#A7EF9E" mouseReact brightness={0.6} pageLoadAnimation />
      </Caja>
    ),
  },
  {
    id: "ferrofluid",
    nombre: "Ferrofluid",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Fluido magnético metálico que fluye con brillo y se deforma con el cursor.",
    argumento: "Textura de lujo líquido para cosmética, relojería o autos de alta gama.",
    ruta: RUTA("Ferrofluid"),
    uso: USO("Ferrofluid", `<Ferrofluid colors={["#ffffff", "#ffffff", "#ffffff"]} speed={0.5} scale={1.6} glow={2} flowDirection="down" />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <Ferrofluid colors={["#ffffff", "#ffffff", "#ffffff"]} speed={0.5} scale={1.6} turbulence={1} shimmer={1.5} glow={2} flowDirection="down" mouseInteraction />
      </Caja>
    ),
  },
  {
    id: "floating-lines",
    nombre: "FloatingLines",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Líneas onduladas con degradé que flotan en tres bandas y se curvan cerca del mouse.",
    argumento: "Minimalista y fluido: ideal para consultoras, estudios o marcas de servicios.",
    ruta: RUTA("FloatingLines"),
    uso: USO("FloatingLines", `<FloatingLines lineCount={8} lineDistance={8} animationSpeed={1} interactive linesGradient={["#e945f5", "#6f6f6f", "#6a6a6a"]} />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <FloatingLines enabledWaves={["top", "middle", "bottom"]} lineCount={8} lineDistance={8} animationSpeed={1} interactive bendRadius={8} bendStrength={-2} linesGradient={["#e945f5", "#6f6f6f", "#6a6a6a"]} />
      </Caja>
    ),
  },
  {
    id: "galaxy",
    nombre: "Galaxy",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Galaxia de estrellas que titilan, rotan y se apartan del cursor.",
    argumento: "Cielo estrellado para astroturismo, cabañas, eventos nocturnos o lo que sea que venda magia.",
    ruta: RUTA("Galaxy"),
    uso: USO("Galaxy", `<Galaxy density={1} glowIntensity={0.3} hueShift={140} twinkleIntensity={0.3} rotationSpeed={0.1} mouseRepulsion />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <Galaxy density={1} glowIntensity={0.3} saturation={0} hueShift={140} twinkleIntensity={0.3} rotationSpeed={0.1} starSpeed={0.5} speed={1} mouseRepulsion mouseInteraction />
      </Caja>
    ),
  },
  {
    id: "ghost-fibers",
    nombre: "GhostFibers",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Fibras fantasmales azuladas en capas que ondulan y giran despacio.",
    argumento: "Fondo etéreo y elegante para clínicas, estudios de yoga o marcas de calma.",
    ruta: RUTA("GhostFibers"),
    uso: USO("GhostFibers", `<GhostFibers lineColor="#140E35" glowColor="#3437A0" speed={0.2} scale={2} layers={4} glowIntensity={1.6} />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <GhostFibers lineColor="#140E35" glowColor="#3437A0" speed={0.2} scale={2} layers={4} glowIntensity={1.6} brightness={2} vignette={0.8} />
      </Caja>
    ),
  },
  {
    id: "gradient-blinds",
    nombre: "GradientBlinds",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Persianas con degradé que se iluminan con un foco que sigue al mouse.",
    argumento: "Moderno y colorido: para agencias, diseñadores o tiendas de moda.",
    ruta: RUTA("GradientBlinds"),
    uso: USO("GradientBlinds", `<GradientBlinds gradientColors={["#FF9FFC", "#5227FF"]} angle={20} noise={0.5} blindCount={16} spotlightRadius={0.5} />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <GradientBlinds gradientColors={["#FF9FFC", "#5227FF"]} angle={20} noise={0.5} blindCount={16} blindMinWidth={60} spotlightRadius={0.5} mouseDampening={0.15} shineDirection="left" />
      </Caja>
    ),
  },
  {
    id: "gradient-waves",
    nombre: "GradientWaves",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Mar de olas con degradé y niebla al horizonte, visto en perspectiva.",
    argumento: "Paisaje oceánico abstracto para náutica, turismo o marcas costeras.",
    ruta: RUTA("GradientWaves"),
    uso: USO("GradientWaves", `<GradientWaves horizonColor="#5227FF" waveColor="#FF9FFC" crestColor="#FFFFFF" speed={0.4} amplitude={2.5} />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <GradientWaves horizonColor="#5227FF" waveColor="#FF9FFC" crestColor="#FFFFFF" speed={0.4} amplitude={2.5} waveScale={0.6} swell={35} tilt={1.11} height={5.5} fogDepth={15} />
      </Caja>
    ),
  },
  {
    id: "grainient",
    nombre: "Grainient",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Degradé de tres colores con warp orgánico y grano de película.",
    argumento: "El fondo de moda: se ve caro y funciona con cualquier paleta de marca.",
    ruta: RUTA("Grainient"),
    uso: USO("Grainient", `<Grainient color1="#FF9FFC" color2="#5227FF" color3="#B497CF" timeSpeed={0.25} warpStrength={1} grainAmount={0.1} />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <Grainient color1="#FF9FFC" color2="#5227FF" color3="#B497CF" timeSpeed={0.25} warpStrength={1} warpFrequency={5} grainAmount={0.1} contrast={1.5} zoom={0.9} />
      </Caja>
    ),
  },
  {
    id: "grid-distortion",
    nombre: "GridDistortion",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Una foto que se deforma como gelatina cuando pasás el mouse por encima.",
    argumento: "Tu foto de portada cobra vida: el cliente la toca y se queda.",
    ruta: RUTA("GridDistortion"),
    uso: USO("GridDistortion", `<GridDistortion imageSrc="/portada.jpg" grid={10} mouse={0.25} strength={0.15} relaxation={0.9} />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <GridDistortion imageSrc={FOTO_2} grid={10} mouse={0.25} strength={0.15} relaxation={0.9} />
      </Caja>
    ),
  },
  {
    id: "grid-motion",
    nombre: "GridMotion",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Grilla inclinada de fotos y textos que se desplaza en filas según el mouse.",
    argumento: "Mostrá todos tus productos o trabajos de un vistazo, con movimiento que engancha.",
    ruta: RUTA("GridMotion"),
    uso: USO("GridMotion", `<GridMotion items={["/foto1.jpg", "Oferta", "/foto2.jpg", "Nuevo", "/foto3.jpg" /* ...28 ítems */]} gradientColor="black" />`),
    Preview: () => (
      <Caja centrado={false}>
        <GridMotion items={ITEMS_GRID} gradientColor="black" />
      </Caja>
    ),
  },
  {
    id: "grid-scan",
    nombre: "GridScan",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Grilla 3D en perspectiva con un haz de escaneo que la recorre.",
    argumento: "Estética sci-fi para tecnología, seguridad o showrooms de autos.",
    ruta: RUTA("GridScan"),
    uso: USO("GridScan", `<GridScan lineThickness={1} gridScale={0.1} linesColor="#2F293A" scanColor="#FF9FFC" scanGlow={0.5} enablePost />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <GridScan lineThickness={1} gridScale={0.1} lineJitter={0.1} linesColor="#2F293A" scanColor="#FF9FFC" enablePost chromaticAberration={0.002} noiseIntensity={0.01} scanGlow={0.5} scanSoftness={2} enableWebcam={false} showPreview={false} />
      </Caja>
    ),
  },
  {
    id: "hyperspeed",
    nombre: "Hyperspeed",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Ruta nocturna a toda velocidad con luces de autos; acelera al mantener apretado.",
    argumento: "Velocidad y adrenalina: concesionarias, motos, delivery o logística.",
    ruta: RUTA("Hyperspeed"),
    uso: USO(
      "Hyperspeed",
      `<Hyperspeed effectOptions={hyperspeedPresets.one} />`,
      `import { hyperspeedPresets } from "@/components/animaciones/rb/backgrounds/Hyperspeed/HyperSpeedPresets";`
    ),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <Hyperspeed effectOptions={hyperspeedPresets.one} />
      </Caja>
    ),
  },
  {
    id: "iridescence",
    nombre: "Iridescence",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Superficie iridiscente que cambia de tono suavemente y reacciona al mouse.",
    argumento: "Efecto tornasolado premium para cosmética, joyería o packaging.",
    ruta: RUTA("Iridescence"),
    uso: USO("Iridescence", `<Iridescence color={[0.5, 0.6, 0.8]} speed={1} amplitude={0.1} mouseReact />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <Iridescence color={[0.5, 0.6, 0.8]} speed={1} mouseReact />
      </Caja>
    ),
  },
  {
    id: "letter-glitch",
    nombre: "LetterGlitch",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Lluvia de letras que cambian con glitch, estilo Matrix, con viñeta central.",
    argumento: "Onda hacker/cine para estudios de software, gaming o eventos tech.",
    ruta: RUTA("LetterGlitch"),
    uso: USO("LetterGlitch", `<LetterGlitch glitchColors={["#2b4539", "#61dca3", "#61b3dc"]} glitchSpeed={10} smooth centerVignette outerVignette={false} />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <LetterGlitch glitchColors={["#2b4539", "#61dca3", "#61b3dc"]} glitchSpeed={10} smooth centerVignette outerVignette={false} />
      </Caja>
    ),
  },
  {
    id: "light-pillar",
    nombre: "LightPillar",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Pilar de luz con degradé vertical que rota lento sobre fondo oscuro.",
    argumento: "Un foco de atención elegante para lanzamientos de productos o marcas premium.",
    ruta: RUTA("LightPillar"),
    uso: USO("LightPillar", `<LightPillar topColor="#5227FF" bottomColor="#FF9FFC" intensity={1} rotationSpeed={0.3} pillarWidth={3} pillarRotation={25} />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <LightPillar topColor="#5227FF" bottomColor="#FF9FFC" intensity={1} rotationSpeed={0.3} glowAmount={0.002} pillarWidth={3} pillarHeight={0.4} noiseIntensity={0.5} mixBlendMode="screen" pillarRotation={25} quality="high" />
      </Caja>
    ),
  },
  {
    id: "light-rays",
    nombre: "LightRays",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Rayos de luz volumétricos que bajan desde arriba y siguen sutilmente al mouse.",
    argumento: "Luz de catedral para un hero: pone el foco en tu mensaje sin distraer.",
    ruta: RUTA("LightRays"),
    uso: USO("LightRays", `<LightRays raysOrigin="top-center" raysColor="#ffffff" raysSpeed={1} lightSpread={0.5} rayLength={3} mouseInfluence={0.1} />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <LightRays raysOrigin="top-center" raysColor="#ffffff" raysSpeed={1} lightSpread={0.5} rayLength={3} pulsating={false} fadeDistance={1} saturation={1} mouseInfluence={0.1} />
      </Caja>
    ),
  },
  {
    id: "light-tunnel",
    nombre: "LightTunnel",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Túnel de cables de luz con pulsos que viajan hacia el fondo.",
    argumento: "Sensación de velocidad y conexión: telecomunicaciones, fibra o software.",
    ruta: RUTA("LightTunnel"),
    uso: USO("LightTunnel", `<LightTunnel cableColor="#A855F7" pulseColor="#A855F7" tunnelColor="#5227FF" speed={0.1} cableCount={20} flowDirection="outward" />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <LightTunnel cableColor="#A855F7" pulseColor="#A855F7" tunnelColor="#5227FF" tunnelOpacity={0} speed={0.1} flowDirection="outward" pulseSpeed={2} cableCount={20} thickness={0.35} glow={1} />
      </Caja>
    ),
  },
  {
    id: "lightfall",
    nombre: "Lightfall",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Cascada de rayas de luz que caen y titilan sobre un fondo azul brillante.",
    argumento: "Energía y color para fiestas, boliches o lanzamientos.",
    ruta: RUTA("Lightfall"),
    uso: USO("Lightfall", `<Lightfall colors={["#A6C8FF", "#5227FF", "#FF9FFC"]} backgroundColor="#0A29FF" speed={0.5} streakCount={2} glow={1} zoom={3} />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <Lightfall colors={["#A6C8FF", "#5227FF", "#FF9FFC"]} backgroundColor="#0A29FF" speed={0.5} streakCount={2} streakWidth={1} streakLength={1} glow={1} density={0.6} twinkle={1} zoom={3} backgroundGlow={0.5} />
      </Caja>
    ),
  },
  {
    id: "lightning",
    nombre: "Lightning",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Rayo eléctrico que se ramifica y parpadea sin parar.",
    argumento: "Potencia visual para electricistas, energía, gimnasios o bebidas energéticas.",
    ruta: RUTA("Lightning"),
    uso: USO("Lightning", `<Lightning hue={260} xOffset={0} speed={1} intensity={1} size={1} />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <Lightning hue={260} xOffset={0} speed={1} intensity={1} size={1} />
      </Caja>
    ),
  },
  {
    id: "line-waves",
    nombre: "LineWaves",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Líneas finas onduladas en diagonal que ciclan de color y se deforman con el mouse.",
    argumento: "Textura fina y elegante para estudios contables, abogados o arquitectura.",
    ruta: RUTA("LineWaves"),
    uso: USO("LineWaves", `<LineWaves speed={0.3} innerLineCount={32} outerLineCount={36} rotation={-45} brightness={0.2} color1="#ffffff" />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <LineWaves speed={0.3} innerLineCount={32} outerLineCount={36} warpIntensity={1} rotation={-45} colorCycleSpeed={1} brightness={0.2} color1="#ffffff" color2="#ffffff" color3="#ffffff" enableMouseInteraction mouseInfluence={2} />
      </Caja>
    ),
  },
  {
    id: "liquid-chrome",
    nombre: "LiquidChrome",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Cromo líquido que ondula como metal fundido y reacciona al cursor.",
    argumento: "Brillo metálico premium para autos, herrería, relojes o tech.",
    ruta: RUTA("LiquidChrome"),
    uso: USO("LiquidChrome", `<LiquidChrome baseColor={[0.1, 0.1, 0.1]} speed={0.3} amplitude={0.3} interactive />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <LiquidChrome baseColor={[0.1, 0.1, 0.1]} speed={0.3} amplitude={0.3} interactive />
      </Caja>
    ),
  },
  {
    id: "liquid-ether",
    nombre: "LiquidEther",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Simulación de fluido con tres colores que se mezclan y siguen el mouse.",
    argumento: "El fondo más 'wow' de la biblioteca: parece tinta viva; ideal para un hero de marca.",
    ruta: RUTA("LiquidEther"),
    uso: USO("LiquidEther", `<LiquidEther colors={["#5227FF", "#FF9FFC", "#B497CF"]} mouseForce={20} cursorSize={100} resolution={0.5} autoDemo autoSpeed={0.5} />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <LiquidEther colors={["#5227FF", "#FF9FFC", "#B497CF"]} mouseForce={20} cursorSize={100} resolution={0.5} isViscous viscous={30} iterationsViscous={32} iterationsPoisson={32} autoDemo autoSpeed={0.5} autoIntensity={2.2} autoResumeDelay={500} />
      </Caja>
    ),
  },
  {
    id: "molten-metal",
    nombre: "MoltenMetal",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Metal fundido que gira y se pliega con brillo incandescente.",
    argumento: "Fuerza y calor para metalúrgicas, fundiciones, forja o marcas industriales.",
    ruta: RUTA("MoltenMetal"),
    uso: USO("MoltenMetal", `<MoltenMetal color1="#5227FF" color2="#FF9FFC" color3="#FFFFFF" speed={0.35} scale={4} glow={1.6} colorMode="molten" />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <MoltenMetal color1="#5227FF" color2="#FF9FFC" color3="#FFFFFF" speed={0.35} scale={4} detail={3} glow={1.6} swirl={1} brightness={1.3} colorMode="molten" />
      </Caja>
    ),
  },
  {
    id: "orb",
    nombre: "Orb",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Esfera de energía con borde luminoso que se agita y rota al pasar el mouse.",
    argumento: "Un 'botón' visual irresistible para presentar un producto o un asistente IA.",
    ruta: RUTA("Orb"),
    uso: USO("Orb", `<Orb hue={0} hoverIntensity={2} rotateOnHover forceHoverState={false} />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <Orb hue={0} hoverIntensity={2} rotateOnHover forceHoverState={false} backgroundColor="#000000" />
      </Caja>
    ),
  },
  {
    id: "particles",
    nombre: "Particles",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Nube de partículas 3D que flota, rota y se mueve con el mouse.",
    argumento: "El clásico fondo de partículas, liviano y elegante, para cualquier rubro.",
    ruta: RUTA("Particles"),
    uso: USO("Particles", `<Particles particleColors={["#ffffff"]} particleCount={200} particleSpread={10} speed={0.1} particleBaseSize={100} moveParticlesOnHover />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <Particles particleColors={["#ffffff"]} particleCount={200} particleSpread={10} speed={0.1} particleBaseSize={100} moveParticlesOnHover alphaParticles={false} disableRotation={false} />
      </Caja>
    ),
  },
  {
    id: "pixel-blast",
    nombre: "PixelBlast",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Patrón de píxeles que se enciende en ondas y genera ripples al hacer clic.",
    argumento: "Onda retro-gamer con interacción: ideal para tiendas de tecnología o gaming.",
    ruta: RUTA("PixelBlast"),
    uso: USO("PixelBlast", `<PixelBlast variant="square" pixelSize={4} color="#B497CF" patternScale={2} speed={0.5} enableRipples />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <PixelBlast variant="square" pixelSize={4} color="#B497CF" patternScale={2} patternDensity={1} enableRipples liquid={false} speed={0.5} edgeFade={0.25} />
      </Caja>
    ),
  },
  {
    id: "pixel-snow",
    nombre: "PixelSnow",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Nieve pixelada que cae en diagonal con profundidad.",
    argumento: "Ambiente navideño o de invierno para promos de temporada sin tocar el diseño.",
    ruta: RUTA("PixelSnow"),
    uso: USO("PixelSnow", `<PixelSnow color="#ffffff" flakeSize={0.01} speed={1.25} density={0.3} direction={125} variant="square" />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <PixelSnow color="#ffffff" flakeSize={0.01} minFlakeSize={1.25} pixelResolution={200} speed={1.25} depthFade={8} farPlane={20} brightness={1} density={0.3} variant="square" direction={125} />
      </Caja>
    ),
  },
  {
    id: "plasma",
    nombre: "Plasma",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Plasma orgánico de un solo color que fluye sin parar.",
    argumento: "Fondo suave y vivo que funciona con el color de tu marca.",
    ruta: RUTA("Plasma"),
    uso: USO("Plasma", `<Plasma color="#B497CF" speed={1} direction="forward" scale={1} opacity={1} mouseInteractive={false} />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <Plasma color="#B497CF" speed={1} direction="forward" scale={1} opacity={1} mouseInteractive={false} renderScale={0.55} maxDpr={1.5} targetFps={60} iterations={60} />
      </Caja>
    ),
  },
  {
    id: "plasma-wave",
    nombre: "PlasmaWave",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Dos ondas de plasma que se cruzan en perspectiva con dos colores.",
    argumento: "Movimiento futurista y limpio para eventos, DJs o marcas digitales.",
    ruta: RUTA("PlasmaWave"),
    uso: USO("PlasmaWave", `<PlasmaWave colors={["#A855F7", "#06B6D4"]} speed1={0.05} speed2={0.05} focalLength={0.8} bend1={1} bend2={0.5} />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <PlasmaWave colors={["#A855F7", "#06B6D4"]} speed1={0.05} speed2={0.05} focalLength={0.8} bend1={1} bend2={0.5} dir2={1} rotationDeg={0} />
      </Caja>
    ),
  },
  {
    id: "prism",
    nombre: "Prism",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Prisma de cristal que rota y descompone la luz en arcoíris.",
    argumento: "Ópticas, diseño, fotografía o cualquier marca que quiera verse brillante.",
    ruta: RUTA("Prism"),
    uso: USO("Prism", `<Prism animationType="rotate" timeScale={0.5} scale={3.6} height={3.5} baseWidth={5.5} glow={1} />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <Prism animationType="rotate" timeScale={0.5} scale={3.6} noise={0} glow={1} height={3.5} baseWidth={5.5} hueShift={0} colorFrequency={1} />
      </Caja>
    ),
  },
  {
    id: "prismatic-burst",
    nombre: "PrismaticBurst",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Explosión de rayos prismáticos desde el centro que rota en 3D.",
    argumento: "Impacto máximo para un lanzamiento, una promo fuerte o un hero de evento.",
    ruta: RUTA("PrismaticBurst"),
    uso: USO("PrismaticBurst", `<PrismaticBurst animationType="rotate3d" intensity={2} speed={0.5} distort={0} colors={["#A855F7", "#7C3AED", "#6366F1"]} />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <PrismaticBurst animationType="rotate3d" intensity={2} speed={0.5} distort={0} hoverDampness={0.25} colors={["#A855F7", "#7C3AED", "#6366F1"]} />
      </Caja>
    ),
  },
  {
    id: "radar",
    nombre: "Radar",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Radar con anillos, rayos y un barrido luminoso que gira.",
    argumento: "Seguridad, monitoreo, logística o rastreo vehicular con estética militar.",
    ruta: RUTA("Radar"),
    uso: USO("Radar", `<Radar color="#9f29ff" backgroundColor="#000000" speed={1} scale={0.5} ringCount={10} spokeCount={10} sweepSpeed={1} />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <Radar color="#9f29ff" backgroundColor="#000000" speed={1} scale={0.5} ringCount={10} spokeCount={10} ringThickness={0.05} spokeThickness={0.01} sweepSpeed={1} sweepWidth={2} falloff={2} brightness={1} enableMouseInteraction mouseInfluence={0.1} />
      </Caja>
    ),
  },
  {
    id: "ripple-grid",
    nombre: "RippleGrid",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Grilla que ondula como agua y se deforma alrededor del cursor.",
    argumento: "Tecnología con textura viva: apps, fintech o estudios digitales.",
    ruta: RUTA("RippleGrid"),
    uso: USO("RippleGrid", `<RippleGrid gridColor="#5227FF" rippleIntensity={0.05} gridSize={10} gridThickness={15} glowIntensity={0.1} mouseInteraction />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <RippleGrid enableRainbow={false} gridColor="#5227FF" rippleIntensity={0.05} gridSize={10} gridThickness={15} fadeDistance={1.5} vignetteStrength={2} glowIntensity={0.1} opacity={1} mouseInteraction mouseInteractionRadius={0.8} />
      </Caja>
    ),
  },
  {
    id: "scanner",
    nombre: "Scanner",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Bandas de color escaneadas por un barrido vertical con ripple y grano.",
    argumento: "Estética de escáner/impresión para gráficas, imprentas o tech.",
    ruta: RUTA("Scanner"),
    uso: USO("Scanner", `<Scanner color1="#5227FF" color2="#FF9FFC" color3="#FFFFFF" speed={0.5} sweepSpeed={0.25} scanDirection="vertical" />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <Scanner color1="#5227FF" color2="#FF9FFC" color3="#FFFFFF" speed={0.5} sweepSpeed={0.25} sweepWidth={1.6} scale={1.5} frequency={2} bandDensity={11} scanDirection="vertical" vignette={0.45} scanline />
      </Caja>
    ),
  },
  {
    id: "shape-grid",
    nombre: "ShapeGrid",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Grilla de figuras que se desplaza en diagonal y se rellena al pasar el mouse.",
    argumento: "Fondo geométrico liviano que ordena la página sin robarle protagonismo al contenido.",
    ruta: RUTA("ShapeGrid"),
    uso: USO("ShapeGrid", `<ShapeGrid squareSize={40} speed={0.5} direction="diagonal" borderColor="#2F293A" hoverFillColor="#222222" shape="square" />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <ShapeGrid squareSize={40} speed={0.5} direction="diagonal" borderColor="#2F293A" hoverFillColor="#222222" shape="square" hoverTrailAmount={0} />
      </Caja>
    ),
  },
  {
    id: "shape-waves",
    nombre: "ShapeWaves",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Campo de figuritas que dibuja un texto y ondula con splash al pasar el mouse.",
    argumento: "Tu nombre de marca hecho de miles de puntos que reaccionan al cliente.",
    ruta: RUTA("ShapeWaves"),
    uso: USO("ShapeWaves", `<ShapeWaves text="Cauce" textSize={0.6} shapes="mixed" cellSize={10} color="#929292" hoverColor="#ffffff" backgroundColor="#120f17" />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <ShapeWaves text="Cauce" textSize={0.6} shapes="mixed" cellSize={10} dotSize={0.75} color="#929292" hoverColor="#ffffff" backgroundColor="#120f17" speed={1} brightness={0.4} interactive intro />
      </Caja>
    ),
  },
  {
    id: "side-rays",
    nombre: "SideRays",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Rayos de luz cálida que entran desde una esquina como sol por la ventana.",
    argumento: "Luz de mañana para cafeterías, panaderías, hoteles o inmobiliarias.",
    ruta: RUTA("SideRays"),
    uso: USO("SideRays", `<SideRays rayColor1="#EAB308" rayColor2="#96c8ff" origin="top-right" speed={2.5} intensity={2} spread={2} />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <SideRays rayColor1="#EAB308" rayColor2="#96c8ff" origin="top-right" speed={2.5} intensity={2} spread={2} tilt={0} saturation={1.5} blend={0.75} falloff={1.6} opacity={1} />
      </Caja>
    ),
  },
  {
    id: "silk",
    nombre: "Silk",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Tela de seda que ondula con brillo y ruido fino.",
    argumento: "Suavidad de lujo para lencería, blanquería, moda o spa.",
    ruta: RUTA("Silk"),
    uso: USO("Silk", `<Silk color="#5227FF" speed={5} scale={1} noiseIntensity={1.5} rotation={0} />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <Silk color="#5227FF" speed={5} scale={1} noiseIntensity={1.5} rotation={0} />
      </Caja>
    ),
  },
  {
    id: "sliced-waves",
    nombre: "SlicedWaves",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Barras rebanadas en filas y columnas que ondulan con tres colores.",
    argumento: "Ritmo visual para estudios de música, radios o marcas jóvenes.",
    ruta: RUTA("SlicedWaves"),
    uso: USO("SlicedWaves", `<SlicedWaves color1="#FF9FFC" color2="#5227FF" color3="#B497CF" columns={14} rows={8} speed={0.35} orientation="horizontal" />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <SlicedWaves color1="#FF9FFC" color2="#5227FF" color3="#B497CF" columns={14} rows={8} barThickness={0.1} speed={0.35} travel={0.7} waveSpread={0.9} opacity={0.5} orientation="horizontal" />
      </Caja>
    ),
  },
  {
    id: "soft-aurora",
    nombre: "SoftAurora",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Aurora suave de dos colores en bandas de humo que se mueven despacio.",
    argumento: "Más sutil que Aurora: para bienestar, salud o marcas serenas.",
    ruta: RUTA("SoftAurora"),
    uso: USO("SoftAurora", `<SoftAurora color1="#f7f7f7" color2="#e100ff" speed={0.6} scale={1.5} brightness={1} bandHeight={0.5} />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <SoftAurora color1="#f7f7f7" color2="#e100ff" speed={0.6} scale={1.5} brightness={1} noiseFrequency={2.5} noiseAmplitude={1} bandHeight={0.5} bandSpread={1} colorSpeed={1} enableMouseInteraction mouseInfluence={0.25} />
      </Caja>
    ),
  },
  {
    id: "threads",
    nombre: "Threads",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Hilos finos ondulantes que se estiran con el mouse.",
    argumento: "Minimalismo puro: ideal para textiles, costura, diseño o estudios creativos.",
    ruta: RUTA("Threads"),
    uso: USO("Threads", `<Threads amplitude={1} distance={0} enableMouseInteraction />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <Threads amplitude={1} distance={0} enableMouseInteraction />
      </Caja>
    ),
  },
  {
    id: "topography",
    nombre: "Topography",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Curvas de nivel topográficas que se transforman lentamente con tres colores.",
    argumento: "Mapas vivos para turismo, agrimensura, outdoor o inmobiliarias rurales.",
    ruta: RUTA("Topography"),
    uso: USO("Topography", `<Topography lowColor="#5227FF" midColor="#FF9FFC" highColor="#FFFFFF" speed={0.35} bands={2} colorMode="elevation" />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <Topography lowColor="#5227FF" midColor="#FF9FFC" highColor="#FFFFFF" speed={0.35} morphAmount={3} morphSpeed={0.05} bands={2} thickness={0.01} scale={2} glow={0.5} colorMode="elevation" contrast={3} />
      </Caja>
    ),
  },
  {
    id: "waves",
    nombre: "Waves",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Líneas de onda dibujadas en canvas que se doblan siguiendo el cursor.",
    argumento: "Textura liviana y elegante que funciona sobre cualquier color de fondo.",
    ruta: RUTA("Waves"),
    uso: USO("Waves", `<Waves lineColor="#ffffff" backgroundColor="transparent" waveSpeedX={0.0125} waveSpeedY={0.005} waveAmpX={32} waveAmpY={16} />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <Waves lineColor="#ffffff" backgroundColor="transparent" waveSpeedX={0.0125} />
      </Caja>
    ),
  },
  {
    id: "web-threads",
    nombre: "WebThreads",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Hilos de luz en abanico que se cruzan en espejo con brillo suave.",
    argumento: "Conexión y red: internet, telecomunicaciones, logística o coworking.",
    ruta: RUTA("WebThreads"),
    uso: USO("WebThreads", `<WebThreads color1="#5227FF" color2="#FF9FFC" color3="#FFFFFF" speed={0.2} threadCount={6} fanMode="center" mirror />`),
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <WebThreads color1="#5227FF" color2="#FF9FFC" color3="#FFFFFF" speed={0.2} threadCount={6} frequency={5} spread={0.18} position={0.5} fanMode="center" glow={0.02} thickness={1.1} brightness={0.6} mirror />
      </Caja>
    ),
  },
  {
    id: "dither",
    nombre: "Dither",
    origen: "React Bits",
    categoria: "Fondos",
    descripcion: "Ondas animadas con trama retro pixelada, que reaccionan al mouse.",
    argumento: "Un fondo de hero con estética de revista retro que nadie más tiene en tu rubro.",
    ruta: "src/components/animaciones/rb/backgrounds/Dither/Dither.tsx",
    uso: `import Dither from "@/components/animaciones/rb/backgrounds/Dither/Dither";

<div style={{ position: "relative", height: 500 }}>
  <Dither waveColor={[0.18, 0.42, 1]} colorNum={4} waveAmplitude={0.3} waveSpeed={0.05} enableMouseInteraction />
</div>`,
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <Dither waveColor={[0.18, 0.42, 1]} colorNum={4} waveAmplitude={0.3} waveFrequency={3} waveSpeed={0.05} enableMouseInteraction mouseRadius={0.3} />
      </Caja>
    ),
  },
];
