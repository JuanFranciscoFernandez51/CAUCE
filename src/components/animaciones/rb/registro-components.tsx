"use client";

/**
 * React Bits (MIT + Commons Clause) · categoría "Componentes".
 * Fuente de cada componente: src/components/animaciones/rb/components/<Nombre>/<Nombre>.tsx
 *
 * Ya portados a mano (y registrados en ../registro.tsx), por eso NO están acá:
 * DepthCarousel, AccordionGallery, CardNav, GooeyNav, ModelViewer, SpecularButton, BorderGlow, LineSidebar.
 * Omitidos por dependencias/assets que no están en el proyecto:
 * Lanyard (@react-three/rapier), InfiniteMenu (gl-matrix), FluidGlass (necesita /public/assets/3d/*.glb).
 */
import dynamic from "next/dynamic";
import { useState } from "react";
import type { ReactNode } from "react";
import {
  Calendar,
  ShoppingBag,
  MessageCircle,
  Phone,
  Volume1,
  Volume2,
  Camera,
  Heart,
  MapPin,
  Sparkles,
  Star,
} from "lucide-react";
import { Caja, type Animacion } from "../tipos";

/* eslint-disable @typescript-eslint/no-explicit-any */
const AnimatedList = dynamic(() => import("./components/AnimatedList/AnimatedList"), { ssr: false }) as any;
const BounceCards = dynamic(() => import("./components/BounceCards/BounceCards"), { ssr: false }) as any;
const BubbleMenu = dynamic(() => import("./components/BubbleMenu/BubbleMenu"), { ssr: false }) as any;
const CardSwap = dynamic(() => import("./components/CardSwap/CardSwap"), { ssr: false }) as any;
const SwapCard = dynamic(() => import("./components/CardSwap/CardSwap").then((m) => m.Card), { ssr: false }) as any;
const Carousel = dynamic(() => import("./components/Carousel/Carousel"), { ssr: false }) as any;
const ChromaGrid = dynamic(() => import("./components/ChromaGrid/ChromaGrid"), { ssr: false }) as any;
const CircularGallery = dynamic(() => import("./components/CircularGallery/CircularGallery"), { ssr: false }) as any;
const Counter = dynamic(() => import("./components/Counter/Counter"), { ssr: false }) as any;
const CurvedInput = dynamic(() => import("./components/CurvedInput/CurvedInput"), { ssr: false }) as any;
const DecayCard = dynamic(() => import("./components/DecayCard/DecayCard"), { ssr: false }) as any;
const Dock = dynamic(() => import("./components/Dock/Dock"), { ssr: false }) as any;
const DomeGallery = dynamic(() => import("./components/DomeGallery/DomeGallery"), { ssr: false }) as any;
const DriftWall = dynamic(() => import("./components/DriftWall/DriftWall"), { ssr: false }) as any;
const ElasticSlider = dynamic(() => import("./components/ElasticSlider/ElasticSlider"), { ssr: false }) as any;
const FlowingMenu = dynamic(() => import("./components/FlowingMenu/FlowingMenu"), { ssr: false }) as any;
const FlyingPosters = dynamic(() => import("./components/FlyingPosters/FlyingPosters"), { ssr: false }) as any;
const Folder = dynamic(() => import("./components/Folder/Folder"), { ssr: false }) as any;
const GlassIcons = dynamic(() => import("./components/GlassIcons/GlassIcons"), { ssr: false }) as any;
const GlassSurface = dynamic(() => import("./components/GlassSurface/GlassSurface"), { ssr: false }) as any;
const InfiniteSpiral = dynamic(() => import("./components/InfiniteSpiral/InfiniteSpiral"), { ssr: false }) as any;
const MagicBento = dynamic(() => import("./components/MagicBento/MagicBento"), { ssr: false }) as any;
const Masonry = dynamic(() => import("./components/Masonry/Masonry"), { ssr: false }) as any;
const MorphSlider = dynamic(() => import("./components/MorphSlider/MorphSlider"), { ssr: false }) as any;
const OptionWheel = dynamic(() => import("./components/OptionWheel/OptionWheel"), { ssr: false }) as any;
const PillNav = dynamic(() => import("./components/PillNav/PillNav"), { ssr: false }) as any;
const PixelCard = dynamic(() => import("./components/PixelCard/PixelCard"), { ssr: false }) as any;
const ProfileCard = dynamic(() => import("./components/ProfileCard/ProfileCard"), { ssr: false }) as any;
const ReflectiveCard = dynamic(() => import("./components/ReflectiveCard/ReflectiveCard"), { ssr: false }) as any;
const ScrollStack = dynamic(() => import("./components/ScrollStack/ScrollStack"), { ssr: false }) as any;
const ScrollStackItem = dynamic(() => import("./components/ScrollStack/ScrollStack").then((m) => m.ScrollStackItem), {
  ssr: false,
}) as any;
const SpotlightCard = dynamic(() => import("./components/SpotlightCard/SpotlightCard"), { ssr: false }) as any;
const Stack = dynamic(() => import("./components/Stack/Stack"), { ssr: false }) as any;
const StaggeredMenu = dynamic(() => import("./components/StaggeredMenu/StaggeredMenu"), { ssr: false }) as any;
const Stepper = dynamic(() => import("./components/Stepper/Stepper"), { ssr: false }) as any;
const Step = dynamic(() => import("./components/Stepper/Stepper").then((m) => m.Step), { ssr: false }) as any;
const TiltedCard = dynamic(() => import("./components/TiltedCard/TiltedCard"), { ssr: false }) as any;

const CLOUD = "https://res.cloudinary.com/dgtlyzyra/image/upload/jessdesign/";
const FOTOS = [
  `${CLOUD}santi-ori-48`,
  `${CLOUD}audi-ambientacion`,
  `${CLOUD}santi-ori-49`,
  `${CLOUD}sofi-paul-entrada`,
];
const RUTA = (n: string) => `src/components/animaciones/rb/components/${n}/${n}.tsx`;
const IMPORT = (n: string) => `import ${n} from "@/components/animaciones/rb/components/${n}/${n}";`;

/** Achica un componente grande para que entre en la Caja de 260px. */
function Escala({ s, w, h, children }: { s: number; w: number; h: number; children: ReactNode }) {
  return (
    <div style={{ width: w, height: h, transform: `scale(${s})`, transformOrigin: "center", flexShrink: 0 }}>
      {children}
    </div>
  );
}

const MENU = ["Inicio", "Turnos", "Catálogo", "Contacto"];

const FluidGlass = dynamic(() => import("./components/FluidGlass/FluidGlass"), { ssr: false }) as any;
const InfiniteMenu = dynamic(() => import("./components/InfiniteMenu/InfiniteMenu"), { ssr: false }) as any;
const Lanyard = dynamic(() => import("./components/Lanyard/Lanyard"), { ssr: false }) as any;

export const ENTRADAS: Animacion[] = [
  {
    id: "animated-list",
    nombre: "AnimatedList",
    origen: "React Bits",
    categoria: "Componentes",
    descripcion: "Lista scrolleable donde cada ítem entra animado, con selección por teclado y degradados arriba y abajo.",
    argumento: "Tu lista de servicios o productos que aparece con ritmo, en vez de un bloque de texto muerto.",
    ruta: RUTA("AnimatedList"),
    uso: `${IMPORT("AnimatedList")}

<AnimatedList
  items={["Turnos", "Catálogo", "Contacto", "Promos", "Nosotros"]}
  onItemSelect={(item, i) => console.log(item, i)}
  showGradients enableArrowNavigation displayScrollbar={false}
/>`,
    Preview: () => (
      <Caja>
        <div style={{ width: 300, height: 250, overflow: "hidden" }}>
          <AnimatedList
            items={["Turnos online", "Catálogo Vespa", "Service oficial", "Repuestos", "Accesorios", "Contacto", "Financiación", "Usados"]}
            showGradients
            enableArrowNavigation
            displayScrollbar={false}
            initialSelectedIndex={0}
          />
        </div>
      </Caja>
    ),
  },
  {
    id: "bounce-cards",
    nombre: "BounceCards",
    origen: "React Bits · GSAP",
    categoria: "Componentes",
    descripcion: "Fotos apiladas con rotación que rebotan al aparecer y se abren en abanico al pasar el mouse.",
    argumento: "Tus mejores fotos cayendo con rebote en el hero: impacto en el primer segundo.",
    ruta: RUTA("BounceCards"),
    uso: `${IMPORT("BounceCards")}

<BounceCards
  images={["/foto1.jpg", "/foto2.jpg", "/foto3.jpg", "/foto4.jpg"]}
  containerWidth={500} containerHeight={250}
  animationDelay={0.5} animationStagger={0.08}
  easeType="elastic.out(1, 0.5)"
  transformStyles={["rotate(6deg) translate(-150px)", "rotate(0deg) translate(-50px)", "rotate(-4deg) translate(50px)", "rotate(6deg) translate(150px)"]}
  enableHover
/>`,
    Preview: () => (
      <Caja>
        <BounceCards
          images={FOTOS}
          containerWidth={420}
          containerHeight={220}
          animationDelay={0.3}
          animationStagger={0.08}
          easeType="elastic.out(1, 0.5)"
          transformStyles={[
            "rotate(6deg) translate(-130px)",
            "rotate(-2deg) translate(-45px)",
            "rotate(3deg) translate(45px)",
            "rotate(-6deg) translate(130px)",
          ]}
          enableHover
        />
      </Caja>
    ),
  },
  {
    id: "bubble-menu",
    nombre: "BubbleMenu",
    origen: "React Bits · GSAP",
    categoria: "Componentes",
    descripcion: "Barra con logo y botón hamburguesa que abre un menú de burbujas grandes, cada una con su color de hover.",
    argumento: "Un menú divertido y bien visible en el celu: ideal para marcas jóvenes o locales con onda.",
    ruta: RUTA("BubbleMenu"),
    uso: `${IMPORT("BubbleMenu")}

<BubbleMenu
  logo={<span style={{ fontWeight: 700 }}>Casa Milo</span>}
  items={[
    { label: "Inicio", href: "/", ariaLabel: "Inicio", rotation: -8, hoverStyles: { bgColor: "#3b82f6", textColor: "#fff" } },
    { label: "Catálogo", href: "/catalogo", ariaLabel: "Catálogo", rotation: 8, hoverStyles: { bgColor: "#10b981", textColor: "#fff" } },
    { label: "Turnos", href: "/turnos", ariaLabel: "Turnos", rotation: 8, hoverStyles: { bgColor: "#f59e0b", textColor: "#fff" } },
    { label: "Contacto", href: "/contacto", ariaLabel: "Contacto", rotation: -8, hoverStyles: { bgColor: "#ef4444", textColor: "#fff" } },
  ]}
  menuBg="#ffffff" menuContentColor="#111111"
  useFixedPosition animationEase="back.out(1.5)" animationDuration={0.5} staggerDelay={0.12}
/>`,
    Preview: () => (
      <Caja centrado={false}>
        <BubbleMenu
          logo={<span style={{ fontWeight: 700 }}>Casa Milo</span>}
          items={[
            { label: "Inicio", href: "#", ariaLabel: "Inicio", rotation: -8, hoverStyles: { bgColor: "#3b82f6", textColor: "#fff" } },
            { label: "Catálogo", href: "#", ariaLabel: "Catálogo", rotation: 8, hoverStyles: { bgColor: "#10b981", textColor: "#fff" } },
            { label: "Turnos", href: "#", ariaLabel: "Turnos", rotation: 8, hoverStyles: { bgColor: "#f59e0b", textColor: "#fff" } },
            { label: "Contacto", href: "#", ariaLabel: "Contacto", rotation: -8, hoverStyles: { bgColor: "#ef4444", textColor: "#fff" } },
          ]}
          menuBg="#ffffff"
          menuContentColor="#111111"
          useFixedPosition={false}
          animationEase="back.out(1.5)"
          animationDuration={0.5}
          staggerDelay={0.12}
        />
        <p style={{ position: "absolute", bottom: 10, width: "100%", textAlign: "center", fontSize: 11, color: "#888" }}>
          Tocá la hamburguesa
        </p>
      </Caja>
    ),
  },
  {
    id: "card-swap",
    nombre: "CardSwap",
    origen: "React Bits · GSAP",
    categoria: "Componentes",
    descripcion: "Pila de tarjetas en 3D que se van intercambiando solas cada tantos segundos, con elástico y pausa en hover.",
    argumento: "Tres beneficios de tu negocio rotando solos: se leen sin que el cliente haga nada.",
    ruta: RUTA("CardSwap"),
    uso: `import CardSwap, { Card } from "@/components/animaciones/rb/components/CardSwap/CardSwap";

<div style={{ height: 500, position: "relative" }}>
  <CardSwap cardDistance={60} verticalDistance={70} delay={4000} pauseOnHover>
    <Card><h3>Turnos online</h3><p>Reservá en 30 segundos</p></Card>
    <Card><h3>Pagá con MercadoPago</h3><p>Cuotas sin interés</p></Card>
    <Card><h3>Envíos a todo el país</h3><p>Seguimiento en vivo</p></Card>
  </CardSwap>
</div>`,
    Preview: () => (
      <Caja centrado={false}>
        <div style={{ position: "absolute", right: 70, bottom: 60, width: 230, height: 150 }}>
          <CardSwap width={230} height={150} cardDistance={40} verticalDistance={45} delay={3000} pauseOnHover>
            {[
              ["Turnos online", "Reservá en 30 segundos"],
              ["Pagá con MercadoPago", "Cuotas sin interés"],
              ["Envíos a todo el país", "Seguimiento en vivo"],
            ].map(([t, s]) => (
              <SwapCard key={t} style={{ padding: 16, color: "#fff" }}>
                <h3 style={{ fontWeight: 700, fontSize: 16 }}>{t}</h3>
                <p style={{ fontSize: 12, color: "#aaa", marginTop: 6 }}>{s}</p>
              </SwapCard>
            ))}
          </CardSwap>
        </div>
      </Caja>
    ),
  },
  {
    id: "carousel",
    nombre: "Carousel",
    origen: "React Bits · Motion",
    categoria: "Componentes",
    descripcion: "Carrusel de tarjetas con ícono, título y texto: drag, autoplay, loop y puntitos de navegación.",
    argumento: "Tus servicios pasando en un carrusel que se desliza con el dedo, como en una app.",
    ruta: RUTA("Carousel"),
    uso: `${IMPORT("Carousel")}

<div style={{ height: 400, position: "relative" }}>
  <Carousel
    items={[{ id: 1, title: "Turnos", description: "Reservá online", icon: <span>📅</span> }]}
    baseWidth={300} autoplay autoplayDelay={3000} pauseOnHover loop round={false}
  />
</div>`,
    Preview: () => (
      <Caja>
        <Carousel
          items={[
            { id: 1, title: "Turnos online", description: "Reservá tu service en 30 segundos.", icon: <Calendar size={16} color="#fff" /> },
            { id: 2, title: "Catálogo", description: "Todos los modelos con stock real.", icon: <ShoppingBag size={16} color="#fff" /> },
            { id: 3, title: "WhatsApp", description: "Te respondemos al toque.", icon: <MessageCircle size={16} color="#fff" /> },
          ]}
          baseWidth={300}
          autoplay
          autoplayDelay={2500}
          pauseOnHover
          loop
        />
      </Caja>
    ),
  },
  {
    id: "chroma-grid",
    nombre: "ChromaGrid",
    origen: "React Bits · GSAP",
    categoria: "Componentes",
    descripcion: "Grilla de tarjetas de perfil con borde de color y foto; todo en gris salvo el radio alrededor del mouse.",
    argumento: "Presentá a tu equipo o tus sucursales: el color aparece donde el cliente mira.",
    ruta: RUTA("ChromaGrid"),
    uso: `${IMPORT("ChromaGrid")}

<div style={{ height: 600, position: "relative" }}>
  <ChromaGrid
    items={[
      { image: "/foto.jpg", title: "Jess Design", subtitle: "Event planner", handle: "@jessdesign", borderColor: "#3B82F6", gradient: "linear-gradient(145deg, #3B82F6, #000)", url: "https://jessdesign.com.ar" },
      { image: "/foto2.jpg", title: "Casa Milo", subtitle: "Deco & Home", handle: "@casamilo", borderColor: "#10B981", gradient: "linear-gradient(180deg, #10B981, #000)" },
    ]}
    radius={300} damping={0.45} fadeOut={0.6} ease="power3.out"
  />
</div>`,
    Preview: () => (
      <Caja>
        <Escala s={0.55} w={700} h={420}>
          <ChromaGrid
            items={[
              { image: FOTOS[0], title: "Jess Design", subtitle: "Event planner", handle: "@jessdesign", borderColor: "#3B82F6", gradient: "linear-gradient(145deg, #3B82F6, #000)" },
              { image: FOTOS[1], title: "Casa Milo", subtitle: "Deco & Home", handle: "@casamilo", borderColor: "#10B981", gradient: "linear-gradient(180deg, #10B981, #000)" },
            ]}
            radius={260}
            damping={0.45}
            fadeOut={0.6}
          />
        </Escala>
      </Caja>
    ),
  },
  {
    id: "circular-gallery",
    nombre: "CircularGallery",
    origen: "React Bits · OGL",
    categoria: "Componentes",
    descripcion: "Galería WebGL de fotos con título que se curvan en un arco y se navegan con scroll o drag.",
    argumento: "Tus trabajos en una cinta curva que gira con el dedo: vidriera premium sin costo de fotos nuevas.",
    ruta: RUTA("CircularGallery"),
    pesada: true,
    uso: `${IMPORT("CircularGallery")}

<div style={{ height: 600, position: "relative" }}>
  <CircularGallery
    items={[{ image: "/foto1.jpg", text: "Boda Santi & Ori" }, { image: "/foto2.jpg", text: "Ambientación Audi" }]}
    bend={3} textColor="#ffffff" borderRadius={0.05} scrollEase={0.02}
  />
</div>`,
    Preview: () => (
      <Caja centrado={false}>
        <CircularGallery
          items={[
            { image: FOTOS[0], text: "Santi & Ori" },
            { image: FOTOS[1], text: "Audi" },
            { image: FOTOS[2], text: "Recepción" },
            { image: FOTOS[3], text: "Sofi & Paul" },
          ]}
          bend={2}
          textColor="#ffffff"
          borderRadius={0.05}
          scrollEase={0.02}
          font="bold 18px Figtree"
        />
      </Caja>
    ),
  },
  {
    id: "counter",
    nombre: "Counter",
    origen: "React Bits · Motion",
    categoria: "Componentes",
    descripcion: "Contador numérico con dígitos que giran como un odómetro hasta llegar al valor.",
    argumento: "Cuántos clientes atendiste, cuántos años llevás: números que se sienten en movimiento.",
    ruta: RUTA("Counter"),
    uso: `${IMPORT("Counter")}

<Counter value={1250} places={[1000, 100, 10, 1]} fontSize={80} padding={5} gap={10} textColor="white" fontWeight={900} />`,
    Preview: () => {
      return (
        <Caja>
          <div style={{ textAlign: "center" }}>
            <Counter value={1250} places={[1000, 100, 10, 1]} fontSize={72} padding={5} gap={8} textColor="white" fontWeight={900} />
            <p style={{ color: "#888", fontSize: 12, marginTop: 8 }}>clientes atendidos</p>
          </div>
        </Caja>
      );
    },
  },
  {
    id: "curved-input",
    nombre: "CurvedInput",
    origen: "React Bits",
    categoria: "Componentes",
    descripcion: "Campo de email curvo con ícono y botón integrado, tema claro u oscuro, curvatura ajustable.",
    argumento: "Un input que no parece formulario: perfecto para captar mails de promos o pedir un presupuesto.",
    ruta: RUTA("CurvedInput"),
    uso: `${IMPORT("CurvedInput")}

<CurvedInput
  placeholder="tu@email.com" buttonText="Quiero mi web" theme="dark"
  bend={28} height={64} width={450}
  onSubmit={(value) => console.log(value)}
/>`,
    Preview: () => (
      <Caja>
        <CurvedInput placeholder="tu@email.com" buttonText="Pedir presupuesto" theme="dark" bend={26} height={60} width={400} />
      </Caja>
    ),
  },
  {
    id: "decay-card",
    nombre: "DecayCard",
    origen: "React Bits · GSAP",
    categoria: "Componentes",
    descripcion: "Tarjeta con foto que se deforma como líquido siguiendo el mouse, con título grande encima.",
    argumento: "Una foto de tu local que se derrite cuando pasan por encima: nadie se la olvida.",
    ruta: RUTA("DecayCard"),
    uso: `${IMPORT("DecayCard")}

<DecayCard width={200} height={300} image="/foto.jpg">
  <h2>Casa<br/>Milo</h2>
</DecayCard>`,
    Preview: () => (
      <Caja>
        <DecayCard width={190} height={240} image={FOTOS[1]}>
          <h2 style={{ fontSize: 28, lineHeight: 1 }}>
            Casa
            <br />
            Milo
          </h2>
        </DecayCard>
      </Caja>
    ),
  },
  {
    id: "dock",
    nombre: "Dock",
    origen: "React Bits · Motion",
    categoria: "Componentes",
    descripcion: "Barra de íconos estilo dock de Mac: los íconos se agrandan al acercar el mouse y muestran su etiqueta.",
    argumento: "Accesos rápidos (turnos, catálogo, WhatsApp) en una barra con magnetismo que invita a tocar.",
    ruta: RUTA("Dock"),
    uso: `${IMPORT("Dock")}
import { Calendar, ShoppingBag, MessageCircle } from "lucide-react";

<Dock
  items={[
    { icon: <Calendar size={18} />, label: "Turnos", onClick: () => {} },
    { icon: <ShoppingBag size={18} />, label: "Catálogo", onClick: () => {} },
    { icon: <MessageCircle size={18} />, label: "WhatsApp", onClick: () => {} },
  ]}
  panelHeight={68} baseItemSize={50} magnification={70}
/>`,
    Preview: () => (
      <Caja centrado={false}>
        <Dock
          items={[
            { icon: <Calendar size={18} color="#fff" />, label: "Turnos", onClick: () => {} },
            { icon: <ShoppingBag size={18} color="#fff" />, label: "Catálogo", onClick: () => {} },
            { icon: <MessageCircle size={18} color="#fff" />, label: "WhatsApp", onClick: () => {} },
            { icon: <Phone size={18} color="#fff" />, label: "Contacto", onClick: () => {} },
          ]}
          panelHeight={68}
          baseItemSize={50}
          magnification={70}
        />
      </Caja>
    ),
  },
  {
    id: "dome-gallery",
    nombre: "DomeGallery",
    origen: "React Bits · use-gesture",
    categoria: "Componentes",
    descripcion: "Esfera de fotos en 3D (CSS) que se gira con drag; al tocar una foto se agranda al frente.",
    argumento: "Cientos de fotos de tu trabajo en un domo que gira: la galería más impactante sin WebGL.",
    ruta: RUTA("DomeGallery"),
    uso: `${IMPORT("DomeGallery")}

<div style={{ width: "100%", height: "100vh" }}>
  <DomeGallery images={["/foto1.jpg", { src: "/foto2.jpg", alt: "Evento" }]} fit={0.8} grayscale={false} />
</div>`,
    Preview: () => (
      <Caja centrado={false}>
        <DomeGallery images={[...FOTOS, ...FOTOS, ...FOTOS]} fit={1.2} minRadius={260} grayscale={false} overlayBlurColor="#0a0a0a" />
      </Caja>
    ),
  },
  {
    id: "drift-wall",
    nombre: "DriftWall",
    origen: "React Bits",
    categoria: "Componentes",
    descripcion: "Pared inclinada de fotos en columnas que se deslizan a distinta velocidad, con parallax al mover el mouse.",
    argumento: "Un fondo de hero con todas tus fotos flotando en perspectiva: sensación de catálogo infinito.",
    ruta: RUTA("DriftWall"),
    uso: `${IMPORT("DriftWall")}

<div style={{ height: 600 }}>
  <DriftWall
    items={[{ image: "/foto1.jpg", title: "Boda", href: "/galeria" }, { image: "/foto2.jpg", title: "Audi" }]}
    columns={5} tileWidth={200} tileHeight={132} gap={18} tilt={16} turn={-14}
    perspective={1200} depth={120} speed={42} direction="up" parallax={0.6} overlayColor="#060010"
  />
</div>`,
    Preview: () => (
      <Caja centrado={false}>
        <DriftWall
          items={[...FOTOS, ...FOTOS, ...FOTOS].map((f, i) => ({ image: f, title: ["Bodas", "Corporativo", "Cumples", "Ambientación"][i % 4] }))}
          columns={4}
          tileWidth={130}
          tileHeight={86}
          gap={12}
          tilt={16}
          turn={-14}
          perspective={900}
          depth={80}
          speed={36}
          direction="up"
          parallax={0.6}
          lift={40}
          fade={0.6}
          dim={0.5}
          overlayColor="#0a0a0a"
        />
      </Caja>
    ),
  },
  {
    id: "elastic-slider",
    nombre: "ElasticSlider",
    origen: "React Bits · Motion",
    categoria: "Componentes",
    descripcion: "Slider que se estira como una goma cuando pasás los límites, con íconos a los costados y valor arriba.",
    argumento: "Un control de presupuesto o cantidad que se siente físico: ideal para cotizadores.",
    ruta: RUTA("ElasticSlider"),
    uso: `${IMPORT("ElasticSlider")}
import { Volume1, Volume2 } from "lucide-react";

<ElasticSlider leftIcon={<Volume1 />} rightIcon={<Volume2 />} startingValue={0} defaultValue={60} maxValue={100} isStepped stepSize={5} />`,
    Preview: () => (
      <Caja>
        <div style={{ width: 280 }}>
          <ElasticSlider
            leftIcon={<Volume1 size={18} color="#fff" />}
            rightIcon={<Volume2 size={18} color="#fff" />}
            startingValue={0}
            defaultValue={60}
            maxValue={100}
            isStepped
            stepSize={5}
          />
        </div>
      </Caja>
    ),
  },
  {
    id: "flowing-menu",
    nombre: "FlowingMenu",
    origen: "React Bits · GSAP",
    categoria: "Componentes",
    descripcion: "Menú de filas grandes: al pasar el mouse se desliza una marquesina con el texto y una foto repetidos.",
    argumento: "Un menú de categorías con marquesina y foto: cada rubro se vende solo al pasar el mouse.",
    ruta: RUTA("FlowingMenu"),
    uso: `${IMPORT("FlowingMenu")}

<div style={{ height: 600, position: "relative" }}>
  <FlowingMenu
    items={[
      { link: "/bodas", text: "Bodas", image: "/foto1.jpg" },
      { link: "/corporativo", text: "Corporativo", image: "/foto2.jpg" },
      { link: "/cumples", text: "Cumpleaños", image: "/foto3.jpg" },
    ]}
  />
</div>`,
    Preview: () => (
      <Caja centrado={false}>
        <FlowingMenu
          items={[
            { link: "#", text: "Bodas", image: FOTOS[0] },
            { link: "#", text: "Corporativo", image: FOTOS[1] },
            { link: "#", text: "Cumpleaños", image: FOTOS[3] },
          ]}
        />
      </Caja>
    ),
  },
  {
    id: "flying-posters",
    nombre: "FlyingPosters",
    origen: "React Bits · OGL",
    categoria: "Componentes",
    descripcion: "Pósters WebGL que vuelan y se deforman al scrollear o arrastrar, en una fila infinita.",
    argumento: "Tus afiches o fotos pasando en 3D con distorsión: efecto de estudio creativo.",
    ruta: RUTA("FlyingPosters"),
    pesada: true,
    uso: `${IMPORT("FlyingPosters")}

<div style={{ height: 600, position: "relative" }}>
  <FlyingPosters items={["/foto1.jpg", "/foto2.jpg", "/foto3.jpg"]} planeWidth={320} planeHeight={320} distortion={3} />
</div>`,
    Preview: () => (
      <Caja centrado={false}>
        <FlyingPosters items={FOTOS} planeWidth={200} planeHeight={200} distortion={3} scrollEase={0.01} cameraFov={45} cameraZ={20} />
      </Caja>
    ),
  },
  {
    id: "folder",
    nombre: "Folder",
    origen: "React Bits",
    categoria: "Componentes",
    descripcion: "Carpeta de escritorio que se abre al click y muestra hasta 3 papeles que se asoman y siguen el mouse.",
    argumento: "Un guiño lúdico para 'ver nuestros trabajos' o 'descargar el catálogo'.",
    ruta: RUTA("Folder"),
    uso: `${IMPORT("Folder")}

<Folder size={2} color="#5227FF" items={[<p key="1">Catálogo</p>, <p key="2">Precios</p>, <p key="3">Contacto</p>]} />`,
    Preview: () => (
      <Caja>
        <Folder
          size={1.6}
          color="#16a34a"
          items={["Catálogo", "Precios", "Contacto"].map((t) => (
            <p key={t} style={{ fontSize: 9, color: "#333", padding: 6, fontWeight: 600 }}>
              {t}
            </p>
          ))}
        />
      </Caja>
    ),
  },
  {
    id: "glass-icons",
    nombre: "GlassIcons",
    origen: "React Bits",
    categoria: "Componentes",
    descripcion: "Grilla de íconos con fondo de vidrio y placa de color que se inclina en hover, con etiqueta debajo.",
    argumento: "Accesos a tus secciones como íconos de app: prolijo, moderno y clickeable.",
    ruta: RUTA("GlassIcons"),
    uso: `${IMPORT("GlassIcons")}
import { Calendar, ShoppingBag, MessageCircle } from "lucide-react";

<GlassIcons
  items={[
    { icon: <Calendar />, color: "blue", label: "Turnos" },
    { icon: <ShoppingBag />, color: "purple", label: "Catálogo" },
    { icon: <MessageCircle />, color: "green", label: "WhatsApp" },
  ]}
/>`,
    Preview: () => (
      <Caja>
        <Escala s={0.8} w={420} h={260}>
          <GlassIcons
            items={[
              { icon: <Calendar color="#fff" />, color: "blue", label: "Turnos" },
              { icon: <ShoppingBag color="#fff" />, color: "purple", label: "Catálogo" },
              { icon: <MessageCircle color="#fff" />, color: "green", label: "WhatsApp" },
            ]}
          />
        </Escala>
      </Caja>
    ),
  },
  {
    id: "glass-surface",
    nombre: "GlassSurface",
    origen: "React Bits",
    categoria: "Componentes",
    descripcion: "Panel de vidrio líquido (estilo iOS) con refracción y aberración cromática sobre lo que tenga detrás.",
    argumento: "Un cartel de vidrio real sobre tu foto de portada: se ve caro sin serlo.",
    ruta: RUTA("GlassSurface"),
    uso: `${IMPORT("GlassSurface")}

<GlassSurface width={300} height={200} borderRadius={24}>
  <h2>Vespa Bahía</h2>
</GlassSurface>`,
    Preview: () => (
      <Caja centrado={false}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${FOTOS[1]})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <GlassSurface width={280} height={120} borderRadius={24}>
            <div style={{ color: "#fff", textAlign: "center" }}>
              <h2 style={{ fontWeight: 700, fontSize: 22 }}>Vespa Bahía</h2>
              <p style={{ fontSize: 12, opacity: 0.85 }}>Concesionario oficial</p>
            </div>
          </GlassSurface>
        </div>
      </Caja>
    ),
  },
  {
    id: "infinite-spiral",
    nombre: "InfiniteSpiral",
    origen: "React Bits",
    categoria: "Componentes",
    descripcion: "Fotos girando en una espiral 3D infinita; se puede arrastrar, scrollear o dejar en piloto automático.",
    argumento: "Una hélice de fotos que nunca termina: perfecta para mostrar volumen de trabajos.",
    ruta: RUTA("InfiniteSpiral"),
    uso: `${IMPORT("InfiniteSpiral")}

<div style={{ height: 600, position: "relative", overflow: "hidden" }}>
  <InfiniteSpiral
    items={[{ src: "/foto1.jpg", alt: "Boda" }, { src: "/foto2.jpg", alt: "Evento" }]}
    animationMode="all" speed={0.55} radius={170} cardWidth={100} cardHeight={100}
    verticalSpacing={60} cardsPerTurn={7} centerScale={1.2} edgeBlur={6} pauseOnHover
  />
</div>`,
    Preview: () => (
      <Caja centrado={false}>
        <InfiniteSpiral
          items={[...FOTOS, ...FOTOS].map((f) => ({ src: f, alt: "" }))}
          animationMode="all"
          speed={0.55}
          radius={120}
          cardWidth={70}
          cardHeight={70}
          verticalSpacing={40}
          perspective={800}
          cardRadius={8}
          centerScale={1.2}
          edgeBlur={4}
          cardsPerTurn={7}
          pauseOnHover
        />
      </Caja>
    ),
  },
  {
    id: "magic-bento",
    nombre: "MagicBento",
    origen: "React Bits · GSAP",
    categoria: "Componentes",
    descripcion: "Grilla bento de tarjetas con partículas, spotlight que sigue el mouse, borde brillante, tilt y magnetismo.",
    argumento: "La sección 'por qué elegirnos' en formato bento con efectos: se ve como landing de startup.",
    ruta: RUTA("MagicBento"),
    uso: `${IMPORT("MagicBento")}

<MagicBento
  textAutoHide enableStars enableSpotlight enableBorderGlow enableTilt enableMagnetism clickEffect
  spotlightRadius={300} particleCount={12} glowColor="132, 0, 255"
/>
// Los textos de las tarjetas se editan en cardData dentro del componente.`,
    Preview: () => (
      <Caja>
        <Escala s={0.42} w={880} h={600}>
          <MagicBento
            textAutoHide
            enableStars
            enableSpotlight
            enableBorderGlow
            enableTilt={false}
            enableMagnetism={false}
            clickEffect
            spotlightRadius={300}
            particleCount={8}
            glowColor="34, 197, 94"
          />
        </Escala>
      </Caja>
    ),
  },
  {
    id: "masonry",
    nombre: "Masonry",
    origen: "React Bits · GSAP",
    categoria: "Componentes",
    descripcion: "Grilla masonry responsive de fotos que entran animadas desde un borde y se reordenan al cambiar el ancho.",
    argumento: "Tu galería de Instagram acomodada sola, con entrada animada y hover: lista para el portfolio.",
    ruta: RUTA("Masonry"),
    uso: `${IMPORT("Masonry")}

<Masonry
  items={[
    { id: "1", img: "/foto1.jpg", url: "/galeria/1", height: 400 },
    { id: "2", img: "/foto2.jpg", url: "/galeria/2", height: 250 },
    { id: "3", img: "/foto3.jpg", url: "/galeria/3", height: 600 },
  ]}
  ease="power3.out" duration={0.6} stagger={0.05} animateFrom="bottom"
  scaleOnHover hoverScale={0.95} blurToFocus
/>`,
    Preview: () => (
      <Caja centrado={false}>
        <div style={{ position: "absolute", inset: 8 }}>
          <Masonry
            items={[...FOTOS, ...FOTOS].map((f, i) => ({ id: String(i), img: f, url: "#", height: [240, 200, 260, 220, 210, 250, 230, 200][i] }))}
            ease="power3.out"
            duration={0.6}
            stagger={0.05}
            animateFrom="bottom"
            scaleOnHover
            hoverScale={0.95}
            blurToFocus
          />
        </div>
      </Caja>
    ),
  },
  {
    id: "morph-slider",
    nombre: "MorphSlider",
    origen: "React Bits · OGL + GSAP",
    categoria: "Componentes",
    descripcion: "Slider de fotos WebGL con transiciones que derriten, ondulan o pixelan una imagen en la otra.",
    argumento: "Un slider de portada donde cada foto se transforma en la siguiente: cine en tu home.",
    ruta: RUTA("MorphSlider"),
    pesada: true,
    uso: `${IMPORT("MorphSlider")}

<div style={{ height: 500, position: "relative" }}>
  <MorphSlider
    items={[{ image: "/foto1.jpg", caption: "Bodas" }, { image: "/foto2.jpg", caption: "Corporativo" }]}
    transition="melt" intensity={0.55} aberration={0.35} drift={0.4} autoplay
  />
</div>`,
    Preview: () => (
      <Caja centrado={false}>
        <MorphSlider
          items={[
            { image: FOTOS[0], caption: "Bodas" },
            { image: FOTOS[1], caption: "Corporativo" },
            { image: FOTOS[3], caption: "Recepciones" },
          ]}
          transition="melt"
          intensity={0.55}
          aberration={0.35}
          drift={0.4}
          autoplay
          autoplayDelay={2500}
        />
      </Caja>
    ),
  },
  {
    id: "option-wheel",
    nombre: "OptionWheel",
    origen: "React Bits",
    categoria: "Componentes",
    descripcion: "Rueda de opciones estilo selector de iPod: se gira con scroll o drag y la opción activa se ilumina.",
    argumento: "Elegir categoría o sucursal girando una rueda: interacción memorable para menús cortos.",
    ruta: RUTA("OptionWheel"),
    uso: `${IMPORT("OptionWheel")}

<div style={{ height: 400, position: "relative" }}>
  <OptionWheel
    items={["Turnos", "Catálogo", "Service", "Repuestos", "Contacto"]}
    defaultSelected={1} textColor="#a6a6a6" activeColor="#ffffff"
    side="left" fontSize={3} spacing={1.4} curve={1} tilt={6} blur={2} fade={0.25} draggable
    onChange={(i, item) => console.log(i, item)}
  />
</div>`,
    Preview: () => (
      <Caja centrado={false}>
        <OptionWheel
          items={["Turnos", "Catálogo", "Service", "Repuestos", "Accesorios", "Contacto"]}
          defaultSelected={1}
          textColor="#8a8a8a"
          activeColor="#ffffff"
          side="left"
          fontSize={2}
          spacing={1.3}
          curve={1}
          tilt={6}
          blur={2}
          fade={0.25}
          inset={50}
          draggable
          loop
        />
      </Caja>
    ),
  },
  {
    id: "pill-nav",
    nombre: "PillNav",
    origen: "React Bits · GSAP",
    categoria: "Componentes",
    descripcion: "Navbar con logo redondo y píldoras: en hover sube un círculo de color y el texto se intercambia.",
    argumento: "Una barra de navegación con personalidad, que se ve premium en desktop y se pliega bien en celu.",
    ruta: RUTA("PillNav"),
    uso: `${IMPORT("PillNav")}

<PillNav
  logo="/logo.svg" logoAlt="Vespa Bahía"
  items={[{ label: "Inicio", href: "/" }, { label: "Turnos", href: "/turnos" }, { label: "Catálogo", href: "/catalogo" }, { label: "Contacto", href: "/contacto" }]}
  activeHref="/" baseColor="#000000" pillColor="#ffffff" hoveredPillTextColor="#ffffff" pillTextColor="#000000"
/>`,
    Preview: () => (
      <Caja centrado={false}>
        <div style={{ position: "absolute", left: "50%", top: 70, transform: "translateX(-50%)", width: "max-content" }}>
          <PillNav
            logo={FOTOS[0]}
            logoAlt="Vespa Bahía"
            items={MENU.map((l) => ({ label: l, href: "#" }))}
            activeHref="#"
            baseColor="#16a34a"
            pillColor="#ffffff"
            hoveredPillTextColor="#ffffff"
            pillTextColor="#052e16"
          />
        </div>
      </Caja>
    ),
  },
  {
    id: "pixel-card",
    nombre: "PixelCard",
    origen: "React Bits",
    categoria: "Componentes",
    descripcion: "Tarjeta que se llena de píxeles de colores animados al pasar el mouse, con variantes de paleta.",
    argumento: "Una tarjeta de promo que 'se enciende' en pixel art cuando la tocan: gancho retro-gamer.",
    ruta: RUTA("PixelCard"),
    uso: `${IMPORT("PixelCard")}

<PixelCard variant="blue">
  <h3 style={{ position: "absolute" }}>Promo del mes</h3>
</PixelCard>`,
    Preview: () => (
      <Caja>
        <PixelCard variant="blue" className="h-[230px]! w-[300px]!">
          <div style={{ position: "absolute", textAlign: "center", color: "#fff" }}>
            <h3 style={{ fontWeight: 700, fontSize: 22 }}>Promo del mes</h3>
            <p style={{ fontSize: 12, color: "#aaa" }}>20% off en accesorios</p>
          </div>
        </PixelCard>
      </Caja>
    ),
  },
  {
    id: "profile-card",
    nombre: "ProfileCard",
    origen: "React Bits",
    categoria: "Componentes",
    descripcion: "Tarjeta de perfil holográfica con tilt 3D, brillo que sigue el mouse, avatar grande y botón de contacto.",
    argumento: "Tu tarjeta personal o la de tu equipo, con efecto holograma: se comparte sola.",
    ruta: RUTA("ProfileCard"),
    uso: `${IMPORT("ProfileCard")}

<ProfileCard
  name="Jess Design" title="Event planner" handle="jessdesign" status="Disponible"
  contactText="Contactar" avatarUrl="/avatar.png" showUserInfo enableTilt enableMobileTilt={false}
  onContactClick={() => {}}
/>`,
    Preview: () => (
      <Caja>
        <Escala s={0.5} w={300} h={420}>
          <ProfileCard
            name="Jess Design"
            title="Event planner"
            handle="jessdesign"
            status="Disponible"
            contactText="Contactar"
            avatarUrl={FOTOS[0]}
            miniAvatarUrl={FOTOS[0]}
            showUserInfo
            enableTilt
            enableMobileTilt={false}
           iconUrl="" grainUrl="" />
        </Escala>
      </Caja>
    ),
  },
  {
    id: "reflective-card",
    nombre: "ReflectiveCard",
    origen: "React Bits",
    categoria: "Componentes",
    descripcion: "Credencial metálica con reflejo que cambia según el mouse o el giroscopio del celu, con vidrio y ruido.",
    argumento: "Una credencial VIP o tarjeta de socio que refleja luz de verdad: exclusividad palpable.",
    ruta: RUTA("ReflectiveCard"),
    uso: `${IMPORT("ReflectiveCard")}

<div style={{ height: 600, position: "relative" }}>
  <ReflectiveCard webcam /* opcional: refleja la cámara del visitante (pide permiso) */
    overlayColor="rgba(0, 0, 0, 0.2)" blurStrength={10} glassDistortion={15}
    metalness={0.8} roughness={0.5} displacementStrength={25} noiseScale={1.5}
    specularConstant={2.0} grayscale={0.5} color="#ffffff"
  />
</div>
// Los textos de la credencial se editan dentro del componente.`,
    Preview: () => <ReflectivePreview />,
  },
  {
    id: "scroll-stack",
    nombre: "ScrollStack",
    origen: "React Bits · Lenis",
    categoria: "Componentes",
    descripcion: "Tarjetas que se van apilando y achicando una sobre otra a medida que scrolleás, con scroll suave.",
    argumento: "Tus planes o pasos del servicio apilándose al scrollear: storytelling que retiene.",
    ruta: RUTA("ScrollStack"),
    uso: `import ScrollStack, { ScrollStackItem } from "@/components/animaciones/rb/components/ScrollStack/ScrollStack";

<ScrollStack useWindowScroll>
  <ScrollStackItem><h2>Plan Base</h2><p>Web + admin</p></ScrollStackItem>
  <ScrollStackItem><h2>Plan Pro</h2><p>+ turnos + pagos</p></ScrollStackItem>
  <ScrollStackItem><h2>Plan Completo</h2><p>+ IA + marketing</p></ScrollStackItem>
</ScrollStack>`,
    Preview: () => (
      <Caja centrado={false}>
        <ScrollStack itemDistance={60} itemStackDistance={20} stackPosition="12%" scaleEndPosition="6%" baseScale={0.88}>
          {[
            ["Plan Base", "Web + admin", "#166534"],
            ["Plan Pro", "+ turnos + pagos", "#1d4ed8"],
            ["Plan Completo", "+ IA + marketing", "#7c3aed"],
          ].map(([t, s, c]) => (
            <ScrollStackItem key={t} itemClassName="h-32! my-3! p-5! rounded-2xl!">
              <div style={{ background: c, color: "#fff", height: "100%", borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <h2 style={{ fontWeight: 700, fontSize: 20 }}>{t}</h2>
                <p style={{ fontSize: 13, opacity: 0.85 }}>{s}</p>
              </div>
            </ScrollStackItem>
          ))}
        </ScrollStack>
        <p style={{ position: "absolute", bottom: 6, width: "100%", textAlign: "center", fontSize: 11, color: "#888", pointerEvents: "none" }}>
          Scrolleá adentro del recuadro
        </p>
      </Caja>
    ),
  },
  {
    id: "spotlight-card",
    nombre: "SpotlightCard",
    origen: "React Bits",
    categoria: "Componentes",
    descripcion: "Tarjeta oscura con un foco de luz de color que sigue el mouse por adentro.",
    argumento: "Tarjetas de servicios que se iluminan donde pasa el cliente: sutil y elegante.",
    ruta: RUTA("SpotlightCard"),
    uso: `${IMPORT("SpotlightCard")}

<SpotlightCard className="custom-spotlight-card" spotlightColor="rgba(0, 229, 255, 0.2)">
  <h3>Service oficial</h3>
  <p>Repuestos originales y garantía.</p>
</SpotlightCard>`,
    Preview: () => (
      <Caja>
        <SpotlightCard className="w-[300px] h-[170px] flex flex-col justify-center" spotlightColor="rgba(34, 197, 94, 0.35)">
          <Sparkles size={22} color="#22c55e" />
          <h3 style={{ color: "#fff", fontWeight: 700, fontSize: 20, marginTop: 10 }}>Service oficial</h3>
          <p style={{ color: "#aaa", fontSize: 13, marginTop: 4 }}>Repuestos originales y garantía Vespa.</p>
        </SpotlightCard>
      </Caja>
    ),
  },
  {
    id: "stack",
    nombre: "Stack",
    origen: "React Bits · Motion",
    categoria: "Componentes",
    descripcion: "Pila de fotos tipo Tinder: arrastrás la de arriba y se va al fondo con rotación aleatoria.",
    argumento: "Tus fotos para pasar con el dedo, como en una app: jugar 10 segundos y ya te conocen.",
    ruta: RUTA("Stack"),
    uso: `${IMPORT("Stack")}

<div style={{ width: 208, height: 208 }}>
  <Stack
    randomRotation sensitivity={180} sendToBackOnClick
    cards={["/foto1.jpg", "/foto2.jpg", "/foto3.jpg"].map((src, i) => (
      <img key={i} src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    ))}
  />
</div>`,
    Preview: () => (
      <Caja>
        <div style={{ width: 190, height: 190 }}>
          <Stack
            randomRotation
            sensitivity={150}
            sendToBackOnClick
            cardDimensions={{ width: 190, height: 190 }}
            cards={FOTOS.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ))}
          />
        </div>
      </Caja>
    ),
  },
  {
    id: "staggered-menu",
    nombre: "StaggeredMenu",
    origen: "React Bits · GSAP",
    categoria: "Componentes",
    descripcion: "Menú de pantalla completa que entra con capas de color escalonadas, ítems numerados y redes sociales.",
    argumento: "Un menú de cortina con capas de color: la experiencia de marca desde el primer click.",
    ruta: RUTA("StaggeredMenu"),
    uso: `${IMPORT("StaggeredMenu")}

<div style={{ height: "100vh" }}>
  <StaggeredMenu
    position="right" isFixed
    items={[{ label: "Inicio", ariaLabel: "Inicio", link: "/" }, { label: "Turnos", ariaLabel: "Turnos", link: "/turnos" }, { label: "Contacto", ariaLabel: "Contacto", link: "/contacto" }]}
    socialItems={[{ label: "Instagram", link: "https://instagram.com" }, { label: "WhatsApp", link: "https://wa.me/549..." }]}
    displaySocials displayItemNumbering
    menuButtonColor="#fff" openMenuButtonColor="#fff" changeMenuColorOnOpen
    colors={["#B497CF", "#5227FF"]} logoUrl="/animaciones/cauce-logo.svg" accentColor="#ff6b6b"
  />
</div>`,
    Preview: () => (
      <Caja centrado={false}>
        <StaggeredMenu
          position="right"
          isFixed={false}
          items={MENU.map((l) => ({ label: l, ariaLabel: l, link: "#" }))}
          socialItems={[
            { label: "Instagram", link: "#" },
            { label: "WhatsApp", link: "#" },
          ]}
          displaySocials
          displayItemNumbering
          menuButtonColor="#fff"
          openMenuButtonColor="#111"
          changeMenuColorOnOpen
          colors={["#86efac", "#16a34a"]}
          accentColor="#16a34a"
        />
        <p style={{ position: "absolute", bottom: 10, left: 14, fontSize: 11, color: "#888", pointerEvents: "none" }}>
          Tocá "Menu" arriba a la derecha
        </p>
      </Caja>
    ),
  },
  {
    id: "stepper",
    nombre: "Stepper",
    origen: "React Bits · Motion",
    categoria: "Componentes",
    descripcion: "Asistente por pasos con indicador de progreso, transiciones deslizantes y botones anterior/siguiente.",
    argumento: "Reservar un turno o pedir un presupuesto en 3 pasitos: menos abandono que un formulario largo.",
    ruta: RUTA("Stepper"),
    uso: `import Stepper, { Step } from "@/components/animaciones/rb/components/Stepper/Stepper";

<Stepper initialStep={1} onStepChange={(s) => console.log(s)} onFinalStepCompleted={() => {}} backButtonText="Atrás" nextButtonText="Siguiente">
  <Step><h2>Elegí el servicio</h2><p>Service, repuestos o accesorios.</p></Step>
  <Step><h2>Elegí el día</h2><p>Lunes a viernes de 9 a 18.</p></Step>
  <Step><h2>Tus datos</h2><input placeholder="Tu nombre" /></Step>
  <Step><h2>Listo</h2><p>Te confirmamos por WhatsApp.</p></Step>
</Stepper>`,
    Preview: () => (
      <Caja>
        <Escala s={0.72} w={440} h={340}>
          <Stepper initialStep={1} backButtonText="Atrás" nextButtonText="Siguiente" contentClassName="text-white">
            {[
              ["Elegí el servicio", "Service, repuestos o accesorios."],
              ["Elegí el día", "Lunes a viernes de 9 a 18."],
              ["Tus datos", "Nombre y WhatsApp, nada más."],
              ["Listo", "Te confirmamos el turno por WhatsApp."],
            ].map(([t, s]) => (
              <Step key={t}>
                <h2 style={{ fontWeight: 700, fontSize: 20, color: "#fff" }}>{t}</h2>
                <p style={{ fontSize: 14, color: "#aaa", marginTop: 6 }}>{s}</p>
              </Step>
            ))}
          </Stepper>
        </Escala>
      </Caja>
    ),
  },
  {
    id: "tilted-card",
    nombre: "TiltedCard",
    origen: "React Bits · Motion",
    categoria: "Componentes",
    descripcion: "Foto que se inclina en 3D siguiendo el mouse, con tooltip que la acompaña y contenido superpuesto.",
    argumento: "La foto de tu producto estrella que se ladea con el mouse: se siente en la mano.",
    ruta: RUTA("TiltedCard"),
    uso: `${IMPORT("TiltedCard")}

<TiltedCard
  imageSrc="/foto.jpg" altText="Vespa Primavera" captionText="Vespa Primavera 150"
  containerHeight="300px" containerWidth="300px" imageHeight="300px" imageWidth="300px"
  rotateAmplitude={12} scaleOnHover={1.2} showMobileWarning={false} showTooltip displayOverlayContent
  overlayContent={<p className="tilted-card-demo-text">Vespa Primavera 150</p>}
/>`,
    Preview: () => (
      <Caja>
        <TiltedCard
          imageSrc={FOTOS[2]}
          altText="Jess Design"
          captionText="Jess Design · Bodas"
          containerHeight="220px"
          containerWidth="220px"
          imageHeight="220px"
          imageWidth="220px"
          rotateAmplitude={12}
          scaleOnHover={1.15}
          showMobileWarning={false}
          showTooltip
          displayOverlayContent
          overlayContent={
            <p style={{ margin: 12, padding: "4px 10px", background: "rgba(0,0,0,.6)", color: "#fff", borderRadius: 999, fontSize: 12, fontWeight: 600, display: "inline-flex", gap: 6, alignItems: "center" }}>
              <Heart size={12} /> Jess Design
            </p>
          }
        />
      </Caja>
    ),
  },
  {
    id: "fluid-glass",
    nombre: "Fluid Glass",
    origen: "React Bits",
    categoria: "Componentes",
    descripcion: "Una lente de vidrio 3D que sigue al mouse y refracta lo que tiene detrás.",
    argumento: "El efecto 'wow' para un hero premium: se siente como una app de Apple.",
    ruta: "src/components/animaciones/rb/components/FluidGlass/FluidGlass.tsx (+ public/assets/3d/*.glb)",
    uso: `import FluidGlass from "@/components/animaciones/rb/components/FluidGlass/FluidGlass";

<div style={{ height: 600, position: "relative" }}>
  <FluidGlass mode="lens" lensProps={{ scale: 0.25, ior: 1.15, thickness: 5, chromaticAberration: 0.1 }} />
</div>`,
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <FluidGlass mode="lens" lensProps={{ scale: 0.25, ior: 1.15, thickness: 5, chromaticAberration: 0.1, anisotropy: 0.01 }} />
      </Caja>
    ),
  },
  {
    id: "infinite-menu",
    nombre: "Infinite Menu",
    origen: "React Bits",
    categoria: "Componentes",
    descripcion: "Una esfera 3D de tarjetas que se gira arrastrando; la del frente muestra su título y link.",
    argumento: "Tu portfolio o catálogo como un globo para girar con el dedo — la gente se queda jugando.",
    ruta: "src/components/animaciones/rb/components/InfiniteMenu/InfiniteMenu.tsx",
    uso: `import InfiniteMenu from "@/components/animaciones/rb/components/InfiniteMenu/InfiniteMenu";

<div style={{ height: 600, position: "relative" }}>
  <InfiniteMenu items={[{ image: "/foto.jpg", link: "/trabajos/1", title: "Boda", description: "Campo" }]} scale={1} />
</div>`,
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <InfiniteMenu items={[
          { image: "https://res.cloudinary.com/dgtlyzyra/image/upload/w_600/jessdesign/santi-ori-48", link: "#", title: "Jess Design", description: "Bodas y eventos" },
          { image: "https://res.cloudinary.com/dgtlyzyra/image/upload/w_600/jessdesign/audi-ambientacion", link: "#", title: "Lanzamiento Audi", description: "Eventos de marca" },
          { image: "https://res.cloudinary.com/dgtlyzyra/image/upload/w_600/jessdesign/santi-ori-49", link: "#", title: "Santi & Ori", description: "Una boda con identidad" },
          { image: "https://res.cloudinary.com/dgtlyzyra/image/upload/w_600/jessdesign/sofi-paul-entrada", link: "#", title: "Sofi & Paul", description: "Boda en el campo" },
        ]} scale={1} />
      </Caja>
    ),
  },
  {
    id: "lanyard",
    nombre: "Lanyard",
    origen: "React Bits",
    categoria: "Componentes",
    descripcion: "Una credencial 3D colgando de una cinta, con física real: se arrastra y rebota.",
    argumento: "Ideal para 'Conocé al equipo' o una invitación a un evento: se agarra y se tira.",
    ruta: "src/components/animaciones/rb/components/Lanyard/Lanyard.tsx (+ public/animaciones/card.glb, lanyard.png)",
    uso: `import Lanyard from "@/components/animaciones/rb/components/Lanyard/Lanyard";

<div style={{ height: 600, position: "relative" }}>
  <Lanyard position={[0, 0, 24]} gravity={[0, -40, 0]} />
</div>`,
    pesada: true,
    Preview: () => (
      <Caja centrado={false}>
        <Lanyard position={[0, 0, 24]} gravity={[0, -40, 0]} />
      </Caja>
    ),
  },
];

// Íconos importados pero no usados en todas las previews: los dejamos disponibles para copiar en snippets.
void Camera;
void MapPin;
void Star;

/** ReflectiveCard refleja la cámara: se enciende solo si el visitante lo pide. */
function ReflectivePreview() {
  const [cam, setCam] = useState(false);
  return (
    <Caja>
      <Escala s={0.48} w={320} h={500}>
        <ReflectiveCard
          webcam={cam}
          overlayColor="rgba(0, 0, 0, 0.2)"
          blurStrength={10}
          glassDistortion={15}
          metalness={0.8}
          roughness={0.5}
          displacementStrength={25}
          noiseScale={1.5}
          specularConstant={2}
          grayscale={0.5}
          color="#ffffff"
        />
      </Escala>
      <button
        type="button"
        onClick={() => setCam((c) => !c)}
        className="absolute bottom-3 right-3 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-white/25"
      >
        {cam ? "Apagar cámara" : "Probar con mi cámara"}
      </button>
    </Caja>
  );
}
