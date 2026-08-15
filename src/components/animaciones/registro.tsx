"use client";

/**
 * Registro de la biblioteca de animaciones de Cauce.
 * Cada entrada trae: metadata, una vista previa viva y el snippet de uso.
 * Para sumar una nueva: portar el componente a esta carpeta + una entrada acá.
 * El admin (/admin/animaciones) y la web pública (/animaciones) lo levantan solos.
 */
import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import LineSidebar from "./LineSidebar";
import DepthCarouselRaw from "./DepthCarousel";
import AccordionGalleryRaw from "./AccordionGallery";
import TextLoopRaw from "./TextLoop";
import BorderGlowRaw from "./BorderGlow";
import CardNavRaw from "./CardNav";
import GooeyNavRaw from "./GooeyNav";
import ScrollRevealRaw from "./ScrollReveal";

// Los portados con @ts-nocheck van sin tipado estricto de props.
/* eslint-disable @typescript-eslint/no-explicit-any */
const DepthCarousel = DepthCarouselRaw as any;
const AccordionGallery = AccordionGalleryRaw as any;
const TextLoop = TextLoopRaw as any;
const BorderGlow = BorderGlowRaw as any;
const CardNav = CardNavRaw as any;
const GooeyNav = GooeyNavRaw as any;
const ScrollReveal = ScrollRevealRaw as any;

// WebGL puro: solo en el cliente.
const SpecularButton = dynamic(() => import("./SpecularButton"), { ssr: false }) as any;
const ModelViewer = dynamic(() => import("./ModelViewer"), { ssr: false }) as any;

const FOTOS = [
  "https://res.cloudinary.com/dgtlyzyra/image/upload/jessdesign/santi-ori-49",
  "https://res.cloudinary.com/dgtlyzyra/image/upload/jessdesign/santi-ori-48",
  "https://res.cloudinary.com/dgtlyzyra/image/upload/jessdesign/audi-edificio",
  "https://res.cloudinary.com/dgtlyzyra/image/upload/jessdesign/santi-ori-42",
  "https://res.cloudinary.com/dgtlyzyra/image/upload/jessdesign/audi-ambientacion",
];

export type Animacion = {
  id: string;
  nombre: string;
  origen: string;
  categoria: string;
  descripcion: string;
  /** Cómo se la vendemos al cliente, en una frase. */
  argumento: string;
  /** Dónde vive el código fuente en el repo. */
  ruta: string;
  /** Snippet de uso listo para pegar en un proyecto. */
  uso: string;
  /** Vista previa viva, ya configurada para lucirse en un recuadro oscuro. */
  Preview: () => ReactNode;
};

export const ANIMACIONES: Animacion[] = [
  {
    id: "depth-carousel",
    nombre: "Depth Carousel",
    origen: "React Bits · GSAP",
    categoria: "Galerías",
    descripcion:
      "Carrusel con profundidad 3D: las fotos se apilan hacia atrás con desenfoque y se navegan con drag, rueda, flechas o autoplay.",
    argumento: "Tus productos o trabajos en una vidriera 3D que invita a tocar — nadie pasa de largo.",
    ruta: "src/components/animaciones/DepthCarousel.tsx (+ .css)",
    uso: `import DepthCarousel from "@/components/animaciones/DepthCarousel";

<div style={{ height: 500, position: "relative" }}>
  <DepthCarousel
    items={[{ image: "/foto1.jpg" }, { image: "/foto2.jpg" }]}
    depth={220} spread={90} tilt={22} autoplay loop
  />
</div>`,
    Preview: () => (
      <div style={{ height: 300, position: "relative", width: "100%" }}>
        <DepthCarousel
          items={FOTOS.map((f) => ({ image: f, alt: "" }))}
          cardWidth={170}
          cardHeight={220}
          depth={130}
          spread={56}
          visibleCards={3}
          autoplay
          loop
          showControls={false}
        />
      </div>
    ),
  },
  {
    id: "accordion-gallery",
    nombre: "Accordion Gallery",
    origen: "React Bits · GSAP",
    categoria: "Galerías",
    descripcion:
      "Paneles que se expanden al pasar el mouse: el activo toma color y protagonismo, los demás se achican en blanco y negro.",
    argumento: "Una galería que responde al mouse como un acordeón — perfecta para servicios o rubros.",
    ruta: "src/components/animaciones/AccordionGallery.tsx (+ .css)",
    uso: `import AccordionGallery from "@/components/animaciones/AccordionGallery";

<AccordionGallery
  items={[{ image: "/a.jpg", label: "Bodas" }, { image: "/b.jpg", label: "Corporativos" }]}
  defaultIndex={0} expandRatio={0.52} trigger="hover"
/>`,
    Preview: () => (
      <AccordionGallery
        items={[
          { image: FOTOS[0], label: "Bodas", link: "#" },
          { image: FOTOS[2], label: "Corporativos", link: "#" },
          { image: FOTOS[3], label: "Ambientación", link: "#" },
          { image: FOTOS[4], label: "Social", link: "#" },
        ]}
        defaultIndex={0}
        height={280}
        expandRatio={0.5}
      />
    ),
  },
  {
    id: "card-nav",
    nombre: "Card Nav",
    origen: "React Bits · GSAP",
    categoria: "Navegación",
    descripcion:
      "Barra de navegación flotante que se despliega en tarjetas de colores con las secciones del sitio. Ideal para las pestañas de nuestras webs.",
    argumento: "Un menú que se abre en tarjetas — la navegación deja de ser un detalle y pasa a ser diseño.",
    ruta: "src/components/animaciones/CardNav.tsx (+ .css)",
    uso: `import CardNav from "@/components/animaciones/CardNav";

<CardNav
  logo="/logo.svg"
  items={[{ label: "Nosotros", bgColor: "#1B1722", textColor: "#fff", links: [{ label: "Historia", href: "#" }] }]}
  baseColor="#fff" menuColor="#000" buttonBgColor="#111" buttonTextColor="#fff"
/>`,
    Preview: () => (
      <div style={{ position: "relative", width: "100%", height: 300 }}>
        <CardNav
          logo={<span style={{ fontWeight: 800, color: "#111" }}>⚡ Cauce</span>}
          ctaLabel="Empezar"
          items={[
            { label: "Nosotros", bgColor: "#0f172a", textColor: "#fff", links: [{ label: "Historia", href: "#" }, { label: "Equipo", href: "#" }] },
            { label: "Proyectos", bgColor: "#1e293b", textColor: "#fff", links: [{ label: "Casos", href: "#" }] },
            { label: "Contacto", bgColor: "#166534", textColor: "#fff", links: [{ label: "WhatsApp", href: "#" }] },
          ]}
          baseColor="#fff"
          menuColor="#000"
          buttonBgColor="#111"
          buttonTextColor="#fff"
        />
        <p style={{ position: "absolute", bottom: 8, width: "100%", textAlign: "center", fontSize: 11, color: "#666" }}>
          Tocá la hamburguesa ↑
        </p>
      </div>
    ),
  },
  {
    id: "gooey-nav",
    nombre: "Gooey Nav",
    origen: "React Bits",
    categoria: "Navegación",
    descripcion:
      "Nav con efecto líquido: al elegir una pestaña explotan burbujas gooey y la píldora blanca se muda al ítem activo. CSS puro.",
    argumento: "Cada click en el menú es una mini celebración — juguetón, para marcas con onda.",
    ruta: "src/components/animaciones/GooeyNav.tsx (+ .css)",
    uso: `import GooeyNav from "@/components/animaciones/GooeyNav";

<GooeyNav
  items={[{ label: "Inicio", href: "#" }, { label: "Tienda", href: "#" }]}
  particleCount={15} initialActiveIndex={0}
/>`,
    Preview: () => (
      <div style={{ padding: "40px 0" }}>
        <GooeyNav
          items={[
            { label: "Inicio", href: "#" },
            { label: "Tienda", href: "#" },
            { label: "Contacto", href: "#" },
          ]}
          initialActiveIndex={0}
        />
      </div>
    ),
  },
  {
    id: "line-sidebar",
    nombre: "Line Sidebar",
    origen: "React Bits",
    categoria: "Navegación",
    descripcion:
      "Menú lateral cuyos ítems se corren y se tiñen del color de acento según la cercanía del mouse, con líneas marcadoras que crecen.",
    argumento: "Una navegación que reacciona al mouse: el sitio se siente vivo apenas entrás, sin marear.",
    ruta: "src/components/animaciones/LineSidebar.tsx (+ .css)",
    uso: `import LineSidebar from "@/components/animaciones/LineSidebar";

<LineSidebar
  items={["Inicio", "Servicios", "Trabajos", "Contacto"]}
  accentColor="#22c55e" proximityRadius={100} maxShift={30} falloff="smooth"
/>`,
    Preview: () => (
      <LineSidebar
        items={["Inicio", "Servicios", "Trabajos", "Contacto", "Nosotros"]}
        accentColor="#22c55e"
        proximityRadius={90}
        maxShift={24}
        markerLength={44}
        itemGap={14}
        fontSize={0.95}
        defaultActive={0}
      />
    ),
  },
  {
    id: "scroll-reveal",
    nombre: "Scroll Reveal (texto)",
    origen: "React Bits · GSAP ScrollTrigger",
    categoria: "Texto",
    descripcion:
      "Un párrafo que se revela palabra por palabra a medida que scrolleás: opacidad, desenfoque y una leve rotación que se endereza.",
    argumento: "El manifiesto de tu marca que se escribe solo mientras el visitante baja — imposible no leerlo.",
    ruta: "src/components/animaciones/ScrollReveal.tsx (+ ScrollRevealRB.css)",
    uso: `import ScrollReveal from "@/components/animaciones/ScrollReveal";

<ScrollReveal baseOpacity={0} enableBlur baseRotation={5} blurStrength={10}>
  Hacemos webs que se sienten vivas, con sistemas que trabajan solos.
</ScrollReveal>`,
    Preview: () => (
      <div style={{ color: "#fff", padding: "0 12px" }}>
        <ScrollReveal baseOpacity={0.1} enableBlur baseRotation={3} blurStrength={6}>
          Webs que se sienten vivas y sistemas que trabajan solos.
        </ScrollReveal>
        <p style={{ fontSize: 11, color: "#888", textAlign: "center" }}>Scrolleá la página para verlo revelarse</p>
      </div>
    ),
  },
  {
    id: "text-loop",
    nombre: "Text Loop",
    origen: "React Bits · GSAP",
    categoria: "Texto",
    descripcion:
      "Texto que recorre una curva en loop infinito (ola, círculo, infinito, arco) con una cinta de color detrás. Pausa en hover.",
    argumento: "Tu claim girando en una cinta con movimiento — puro branding, ideal para separar secciones.",
    ruta: "src/components/animaciones/TextLoop.tsx (+ .css)",
    uso: `import TextLoop from "@/components/animaciones/TextLoop";

<TextLoop
  text="CAUCE ✦ WEBS QUE VENDEN" shape="wave" speed={90}
  ribbon ribbonColor="#22c55e" fontSize={42} color="#ffffff"
/>`,
    Preview: () => (
      <TextLoop
        text="Cauce ✦ Webs vivas"
        shape="wave"
        speed={80}
        curviness={70}
        fontSize={38}
        color="#ffffff"
        ribbon
        ribbonColor="#16a34a"
        ribbonWidth={64}
      />
    ),
  },
  {
    id: "border-glow",
    nombre: "Border Glow",
    origen: "React Bits",
    categoria: "Tarjetas",
    descripcion:
      "Tarjeta cuyo borde se enciende con un brillo direccional y un degradé de colores que sigue al mouse cerca de los bordes. CSS puro.",
    argumento: "Las cards importantes (precios, planes, CTA) brillan cuando el mouse se acerca — foco donde vos querés.",
    ruta: "src/components/animaciones/BorderGlow.tsx (+ .css)",
    uso: `import BorderGlow from "@/components/animaciones/BorderGlow";

<BorderGlow glowColor="140 70 70" backgroundColor="#0b0b0f" borderRadius={24} animated>
  <div style={{ padding: "2em" }}>Tu contenido</div>
</BorderGlow>`,
    Preview: () => (
      <BorderGlow
        glowColor="140 70 75"
        backgroundColor="#0d1117"
        borderRadius={22}
        animated
        colors={["#22c55e", "#38bdf8", "#a3e635"]}
      >
        <div style={{ padding: "2.2em", color: "#e5e7eb", textAlign: "center" }}>
          <p style={{ fontWeight: 700, fontSize: 18 }}>Plan Completo</p>
          <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 6 }}>Acercá el mouse a los bordes ✨</p>
        </div>
      </BorderGlow>
    ),
  },
  {
    id: "specular-button",
    nombre: "Specular Button",
    origen: "React Bits · OGL (WebGL)",
    categoria: "Botones",
    descripcion:
      "Botón con un brillo especular real (shader WebGL) que recorre el borde apuntando hacia el cursor y se enciende al acercarse.",
    argumento: "Un botón de vidrio con luz de verdad — el CTA más caro que va a haber visto tu cliente.",
    ruta: "src/components/animaciones/SpecularButton.tsx (+ .css)",
    uso: `import SpecularButton from "@/components/animaciones/SpecularButton";

<SpecularButton size="lg" radius={18} followMouse proximity={250} onClick={...}>
  Comprar ahora
</SpecularButton>`,
    Preview: () => (
      <div style={{ padding: 30 }}>
        <SpecularButton size="lg" radius={18} followMouse proximity={300} autoAnimate>
          Comprar ahora
        </SpecularButton>
      </div>
    ),
  },
  {
    id: "model-viewer",
    nombre: "Model Viewer 3D",
    origen: "React Bits · three.js",
    categoria: "3D",
    descripcion:
      "Visor 3D interactivo (GLB/GLTF/FBX/OBJ): rotás el modelo con el mouse, zoom con la rueda, parallax al mover el cursor. Para productos reales — motos, muebles, lo que sea.",
    argumento: "El producto girando en 3D adentro de la web: el cliente lo mira de todos los ángulos antes de preguntar.",
    ruta: "src/components/animaciones/ModelViewer.tsx",
    uso: `import ModelViewer from "@/components/animaciones/ModelViewer";

<ModelViewer
  url="/modelos/moto.glb"
  width="100%" height={480}
  autoRotate enableManualRotation enableManualZoom
  environmentPreset="city" showScreenshotButton={false}
/>`,
    Preview: () => (
      <ModelViewer
        url="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/ToyCar/glTF-Binary/ToyCar.glb"
        width={280}
        height={260}
        autoRotate
        autoFrame
        environmentPreset="city"
        showScreenshotButton={false}
        defaultZoom={2}
        minZoomDistance={1}
        maxZoomDistance={6}
      />
    ),
  },
];
