"use client";

/**
 * React Bits (MIT + Commons Clause) · categoría "Micro-interacciones".
 * Fuente de cada componente: src/components/animaciones/rb/micro/<Nombre>/<Nombre>.tsx
 */
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Caja, type Animacion } from "../tipos";

/* eslint-disable @typescript-eslint/no-explicit-any */
const BellToggle = dynamic(() => import("./micro/BellToggle/BellToggle"), { ssr: false }) as any;
const BranchedMenu = dynamic(() => import("./micro/BranchedMenu/BranchedMenu"), { ssr: false }) as any;
const CallChip = dynamic(() => import("./micro/CallChip/CallChip"), { ssr: false }) as any;
const CodeSlots = dynamic(() => import("./micro/CodeSlots/CodeSlots"), { ssr: false }) as any;
const CometDial = dynamic(() => import("./micro/CometDial/CometDial"), { ssr: false }) as any;
const DodgeField = dynamic(() => import("./micro/DodgeField/DodgeField"), { ssr: false }) as any;
const FlipCard = dynamic(() => import("./micro/FlipCard/FlipCard"), { ssr: false }) as any;
const FolderFloat = dynamic(() => import("./micro/FolderFloat/FolderFloat"), { ssr: false }) as any;
const FuseButton = dynamic(() => import("./micro/FuseButton/FuseButton"), { ssr: false }) as any;
const GlideSelect = dynamic(() => import("./micro/GlideSelect/GlideSelect"), { ssr: false }) as any;
const HoldButton = dynamic(() => import("./micro/HoldButton/HoldButton"), { ssr: false }) as any;
const JellyRadio = dynamic(() => import("./micro/JellyRadio/JellyRadio"), { ssr: false }) as any;
const LatticeLoader = dynamic(() => import("./micro/LatticeLoader/LatticeLoader"), { ssr: false }) as any;
const PaperCrumple = dynamic(() => import("./micro/PaperCrumple/PaperCrumple"), { ssr: false }) as any;
const PeekRating = dynamic(() => import("./micro/PeekRating/PeekRating"), { ssr: false }) as any;
const PromptBar = dynamic(() => import("./micro/PromptBar/PromptBar"), { ssr: false }) as any;
const PulseHeart = dynamic(() => import("./micro/PulseHeart/PulseHeart"), { ssr: false }) as any;
const RefineFrame = dynamic(() => import("./micro/RefineFrame/RefineFrame"), { ssr: false }) as any;
const RubberSegment = dynamic(() => import("./micro/RubberSegment/RubberSegment"), { ssr: false }) as any;
const ScrubField = dynamic(() => import("./micro/ScrubField/ScrubField"), { ssr: false }) as any;
const SlideCommit = dynamic(() => import("./micro/SlideCommit/SlideCommit"), { ssr: false }) as any;
const SlingButton = dynamic(() => import("./micro/SlingButton/SlingButton"), { ssr: false }) as any;
const SloshGauge = dynamic(() => import("./micro/SloshGauge/SloshGauge"), { ssr: false }) as any;
const SpringCheck = dynamic(() => import("./micro/SpringCheck/SpringCheck"), { ssr: false }) as any;
const SquishSwitch = dynamic(() => import("./micro/SquishSwitch/SquishSwitch"), { ssr: false }) as any;
const StatusMark = dynamic(() => import("./micro/StatusMark/StatusMark"), { ssr: false }) as any;
const SwipeRow = dynamic(() => import("./micro/SwipeRow/SwipeRow"), { ssr: false }) as any;
const SwipeToast = dynamic(() => import("./micro/SwipeToast/SwipeToast"), { ssr: false }) as any;
const TearTicket = dynamic(() => import("./micro/TearTicket/TearTicket"), { ssr: false }) as any;
const ThoughtLine = dynamic(() => import("./micro/ThoughtLine/ThoughtLine"), { ssr: false }) as any;
const VoicePill = dynamic(() => import("./micro/VoicePill/VoicePill"), { ssr: false }) as any;
const WakeSlider = dynamic(() => import("./micro/WakeSlider/WakeSlider"), { ssr: false }) as any;
const WarmTooltip = dynamic(() => import("./micro/WarmTooltip/WarmTooltip"), { ssr: false }) as any;

const FOTO = "https://res.cloudinary.com/dgtlyzyra/image/upload/jessdesign/santi-ori-49";
const FOTO2 = "https://res.cloudinary.com/dgtlyzyra/image/upload/jessdesign/audi-edificio";
const RUTA = (n: string) => `src/components/animaciones/rb/micro/${n}/${n}.tsx`;
const CLARO = { color: "#f5f5f5" } as const;

/** Cicla entre estados cada `ms` (para loaders/estados que en la vida real los maneja la app). */
function useCiclo<T>(estados: T[], ms: number): T {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % estados.length), ms);
    return () => clearInterval(t);
  }, [estados.length, ms]);
  return estados[i];
}

const Boton = ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    style={{ padding: "8px 14px", borderRadius: 999, background: "#27272a", color: "#f5f5f5", fontSize: 13 }}
  >
    {children}
  </button>
);

/* ---------- wrappers con estado ---------- */

function CodeSlotsDemo() {
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");
  return (
    <div style={{ display: "grid", gap: 14, justifyItems: "center" }}>
      <CodeSlots
        length={6}
        status={status}
        onChange={() => setStatus("idle")}
        onComplete={(code: string) => setStatus(code === "123456" ? "success" : "error")}
      />
      <span style={{ fontSize: 12, opacity: 0.6, ...CLARO }}>Probá 123456</span>
    </div>
  );
}

function CallChipDemo() {
  const status = useCiclo(["idle", "running", "done", "error"] as const, 1800);
  return <CallChip name="cobrar" argument="pedido #1042" status={status} expectedMs={1500} />;
}

function LatticeLoaderDemo() {
  const status = useCiclo(["working", "done", "error"] as const, 2200);
  return (
    <LatticeLoader
      status={status}
      pattern="snake"
      label="Procesando pago"
      doneLabel="Pago aprobado"
      errorLabel="Pago rechazado"
    />
  );
}

function StatusMarkDemo() {
  const status = useCiclo(["pending", "running", "done", "failed"] as const, 1600);
  const etiquetas: Record<string, string> = {
    pending: "Pendiente",
    running: "Procesando",
    done: "Confirmado",
    failed: "Rechazado",
  };
  return <StatusMark status={status} label={etiquetas[status]} size={28} fontSize={15} />;
}

function RefineFrameDemo() {
  const status = useCiclo(["queued", "generating", "refining", "complete"] as const, 1400);
  return (
    <RefineFrame status={status} width={260} aspectRatio="4 / 3" radius={14}>
      <img src={FOTO2} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </RefineFrame>
  );
}

const PASOS = ["Leyendo el pedido", "Revisando stock", "Calculando envío", "Armando presupuesto"];
function ThoughtLineDemo() {
  const [steps, setSteps] = useState<string[]>([]);
  const [working, setWorking] = useState(true);
  const [run, setRun] = useState(0);
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    setSteps([]);
    setWorking(true);
    PASOS.forEach((p, i) => timers.push(setTimeout(() => setSteps((s) => [...s, p]), 500 + i * 900)));
    timers.push(setTimeout(() => setWorking(false), 500 + PASOS.length * 900));
    timers.push(setTimeout(() => setRun((r) => r + 1), 500 + PASOS.length * 900 + 2600));
    return () => timers.forEach(clearTimeout);
  }, [run]);
  return (
    <div style={{ width: 300 }}>
      <ThoughtLine label="Pensando" doneLabel="Listo" steps={steps} working={working} collapsible />
    </div>
  );
}

function PromptBarDemo() {
  const [busy, setBusy] = useState(false);
  return (
    <PromptBar
      placeholder="Preguntale a Cauce..."
      models={[]}
      efforts={[]}
      busy={busy}
      onSend={() => {
        setBusy(true);
        setTimeout(() => setBusy(false), 2500);
      }}
      onStop={() => setBusy(false)}
      width={340}
    />
  );
}

const FILAS = [
  { id: 1, label: "Turno · Juan Pérez · 10:30" },
  { id: 2, label: "Turno · María López · 11:00" },
  { id: 3, label: "Turno · Carlos Díaz · 11:30" },
];
function SwipeRowDemo() {
  const [rows, setRows] = useState(FILAS);
  const [openId, setOpenId] = useState<number | null>(null);
  return (
    <div style={{ display: "grid", gap: 8, width: 320 }}>
      {rows.map((r) => (
        <SwipeRow
          key={r.id}
          label={r.label}
          actions={[
            { id: "borrar", label: "Cancelar" },
            { id: "archivar", label: "Archivar", dismiss: true },
          ]}
          open={openId === r.id}
          onOpenChange={(o: boolean) => setOpenId(o ? r.id : openId === r.id ? null : openId)}
          onCommit={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}
        >
          <span style={{ fontSize: 14, ...CLARO }}>{r.label}</span>
        </SwipeRow>
      ))}
      {rows.length === 0 && <Boton onClick={() => setRows(FILAS)}>Restaurar</Boton>}
    </div>
  );
}

function SwipeToastDemo() {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ display: "grid", gap: 14, justifyItems: "center" }}>
      <SwipeToast
        open={open}
        onClose={() => setOpen(false)}
        title="Agregado al carrito"
        description="Deslizá para cerrar o esperá que se apague"
        actionLabel="Ver"
        inline
        width={320}
      />
      {!open && <Boton onClick={() => setOpen(true)}>Mostrar de nuevo</Boton>}
    </div>
  );
}

function SquishSwitchDemo() {
  const [on, setOn] = useState(false);
  return <SquishSwitch checked={on} onChange={setOn} label="Recibir avisos por WhatsApp" />;
}

/* ---------- registro ---------- */

export const ENTRADAS: Animacion[] = [
  {
    id: "bell-toggle",
    nombre: "BellToggle",
    origen: "React Bits",
    categoria: "Micro-interacciones",
    descripcion: "Botón de campana que suena y cambia de texto al activar las notificaciones.",
    argumento: "Ideal para el botón \"Avisame cuando haya stock\" o \"Recordarme el turno\": se nota que quedó activado.",
    ruta: RUTA("BellToggle"),
    uso: `import BellToggle from "@/components/animaciones/rb/micro/BellToggle/BellToggle";

<BellToggle offLabel="Avisame" onLabel="Te avisamos" onChange={(on) => console.log(on)} />`,
    Preview: () => (
      <Caja>
        <BellToggle offLabel="Avisame cuando llegue" onLabel="Te avisamos" />
      </Caja>
    ),
  },
  {
    id: "branched-menu",
    nombre: "BranchedMenu",
    origen: "React Bits",
    categoria: "Micro-interacciones",
    descripcion: "Menú en árbol cuyas ramas se dibujan y pliegan con una línea animada.",
    argumento: "Categorías y subcategorías del catálogo o el menú lateral del admin, con una navegación que se entiende de un vistazo.",
    ruta: RUTA("BranchedMenu"),
    uso: `import BranchedMenu from "@/components/animaciones/rb/micro/BranchedMenu/BranchedMenu";

<BranchedMenu
  items={[
    { label: "Catálogo", children: [{ value: "motos", label: "Motos" }, { value: "repuestos", label: "Repuestos" }] },
    { label: "Servicios", children: [{ value: "turnos", label: "Turnos" }] },
  ]}
  defaultOpen={[0]}
  onSelect={(v) => console.log(v)}
/>`,
    Preview: () => (
      <Caja>
        <BranchedMenu
          items={[
            {
              label: "Catálogo",
              children: [
                { value: "motos", label: "Motos" },
                { value: "repuestos", label: "Repuestos" },
              ],
            },
            {
              label: "Servicios",
              children: [
                { value: "turnos", label: "Turnos" },
                { value: "presupuesto", label: "Pedir presupuesto" },
              ],
            },
          ]}
          defaultOpen={[0, 1]}
          defaultActive="motos"
          width={240}
        />
      </Caja>
    ),
  },
  {
    id: "call-chip",
    nombre: "CallChip",
    origen: "React Bits",
    categoria: "Micro-interacciones",
    descripcion: "Chip de proceso con barra de progreso estimada y estados corriendo / listo / error.",
    argumento: "Para mostrar qué está haciendo el sistema en el checkout o el asistente IA: \"cobrando\", \"emitiendo factura\", sin dejar al cliente a ciegas.",
    ruta: RUTA("CallChip"),
    uso: `import CallChip from "@/components/animaciones/rb/micro/CallChip/CallChip";

<CallChip name="cobrar" argument="pedido #1042" status="running" expectedMs={1500} />`,
    Preview: () => (
      <Caja>
        <CallChipDemo />
      </Caja>
    ),
  },
  {
    id: "code-slots",
    nombre: "CodeSlots",
    origen: "React Bits",
    categoria: "Micro-interacciones",
    descripcion: "Input de código de verificación con casilleros que rebotan y marcan error o éxito.",
    argumento: "Para validar el código de WhatsApp o email al confirmar un turno o una compra: se siente pulido y guía al cliente.",
    ruta: RUTA("CodeSlots"),
    uso: `import CodeSlots from "@/components/animaciones/rb/micro/CodeSlots/CodeSlots";

<CodeSlots length={6} status={estado} onComplete={(codigo) => verificar(codigo)} />`,
    Preview: () => (
      <Caja>
        <CodeSlotsDemo />
      </Caja>
    ),
  },
  {
    id: "comet-dial",
    nombre: "CometDial",
    origen: "React Bits",
    categoria: "Micro-interacciones",
    descripcion: "Dial circular con estela de cometa que se arrastra o se tira con inercia.",
    argumento: "Elegir porcentaje de seña, cantidad o nivel de un servicio con un control que da gusto tocar en el celu.",
    ruta: RUTA("CometDial"),
    uso: `import CometDial from "@/components/animaciones/rb/micro/CometDial/CometDial";

<CometDial defaultValue={30} unit="%" label="Seña" onChange={(v) => setSena(v)} />`,
    Preview: () => (
      <Caja>
        <CometDial defaultValue={62} unit="%" label="Seña" size={180} />
      </Caja>
    ),
  },
  {
    id: "dodge-field",
    nombre: "DodgeField",
    origen: "React Bits",
    categoria: "Micro-interacciones",
    descripcion: "Botón que esquiva el cursor un rato y después se deja atrapar.",
    argumento: "Un guiño divertido para una promo o un \"No, gracias\" en la landing: genera sonrisa y se comparte.",
    ruta: RUTA("DodgeField"),
    uso: `import DodgeField from "@/components/animaciones/rb/micro/DodgeField/DodgeField";

<DodgeField taunts={["Casi", "Otra vez", "Dale"]} patience={5} onCatch={() => alert("¡Te ganaste el descuento!")}>
  Atrapá el descuento
</DodgeField>`,
    Preview: () => (
      <Caja>
        <div style={{ width: "100%", padding: "0 16px" }}>
          <DodgeField
            taunts={["Casi", "Otra vez", "Dale, dale", "Ya casi"]}
            notice="Se rindió: ¡el descuento es tuyo!"
            patience={5}
            fieldHeight={200}
          >
            Atrapá el descuento
          </DodgeField>
        </div>
      </Caja>
    ),
  },
  {
    id: "flip-card",
    nombre: "FlipCard",
    origen: "React Bits",
    categoria: "Micro-interacciones",
    descripcion: "Tarjeta que gira en 3D al click o al arrastrar, con inclinación y brillo al pasar el mouse.",
    argumento: "Producto de un lado, ficha técnica y precio del otro: más info en el mismo lugar del catálogo.",
    ruta: RUTA("FlipCard"),
    uso: `import FlipCard from "@/components/animaciones/rb/micro/FlipCard/FlipCard";

<FlipCard
  front={<img src="/producto.jpg" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
  back={<div style={{ padding: 20 }}>Detalle y precio</div>}
  width={260} height={340} tilt glare draggable
/>`,
    Preview: () => (
      <Caja>
        <FlipCard
          width={170}
          height={230}
          tilt
          glare
          draggable
          front={<img src={FOTO} alt="" draggable={false} style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }} />}
          back={
            <div style={{ padding: 18, height: "100%", display: "grid", alignContent: "end", gap: 6, ...CLARO }}>
              <strong style={{ fontSize: 16 }}>Cauce</strong>
              <span style={{ fontSize: 13, opacity: 0.75 }}>$ 85.000 · Envío gratis</span>
            </div>
          }
        />
      </Caja>
    ),
  },
  {
    id: "folder-float",
    nombre: "FolderFloat",
    origen: "React Bits",
    categoria: "Micro-interacciones",
    descripcion: "Carpeta que se abre y deja flotar sus papeles con física real (matter-js).",
    argumento: "Un menú de documentos o categorías con onda: presupuestos, facturas, garantías, todo en una carpeta que se abre sola.",
    ruta: RUTA("FolderFloat"),
    uso: `import FolderFloat from "@/components/animaciones/rb/micro/FolderFloat/FolderFloat";

<FolderFloat label="Documentos" sublabel="3 archivos" items={["Presupuesto", "Factura", "Garantía"]} onSelect={(v) => abrir(v)} />`,
    pesada: true,
    Preview: () => (
      <Caja>
        <FolderFloat label="Cauce" sublabel="3 documentos" items={["Presupuesto", "Factura", "Garantía"]} trigger="click" />
      </Caja>
    ),
  },
  {
    id: "fuse-button",
    nombre: "FuseButton",
    origen: "React Bits",
    categoria: "Micro-interacciones",
    descripcion: "Botón con mecha: al apretar da unos segundos para deshacer antes de confirmar.",
    argumento: "Confirmar turno o cancelar pedido sin modal molesto: el cliente tiene 5 segundos para arrepentirse.",
    ruta: RUTA("FuseButton"),
    uso: `import FuseButton from "@/components/animaciones/rb/micro/FuseButton/FuseButton";

<FuseButton label="Confirmar turno" undoLabel="Deshacer" doneLabel="Confirmado" undoWindow={5000} onCommit={() => confirmar()} />`,
    Preview: () => (
      <Caja>
        <FuseButton label="Confirmar turno" undoLabel="Deshacer" doneLabel="Turno confirmado" undoWindow={4000} />
      </Caja>
    ),
  },
  {
    id: "glide-select",
    nombre: "GlideSelect",
    origen: "React Bits",
    categoria: "Micro-interacciones",
    descripcion: "Select cuyo menú se abre con un pop y el resaltado se desliza entre opciones.",
    argumento: "Elegir talle, sucursal o forma de envío en el checkout con un desplegable que se siente premium.",
    ruta: RUTA("GlideSelect"),
    uso: `import GlideSelect from "@/components/animaciones/rb/micro/GlideSelect/GlideSelect";

<GlideSelect options={["Retiro en local", "Envío a domicilio", "Correo"]} defaultValue="Retiro en local" onChange={(v) => setEnvio(v)} />`,
    Preview: () => (
      <Caja>
        <GlideSelect
          options={[
            { value: "retiro", label: "Retiro en local", tag: "Gratis" },
            { value: "moto", label: "Envío en moto", tag: "$ 2.500" },
            { value: "correo", label: "Correo", tag: "$ 4.900" },
          ]}
          defaultValue="retiro"
          showTags
          ariaLabel="Forma de envío"
        />
      </Caja>
    ),
  },
  {
    id: "hold-button",
    nombre: "HoldButton",
    origen: "React Bits",
    categoria: "Micro-interacciones",
    descripcion: "Botón que hay que mantener apretado: se llena y recién ahí ejecuta la acción.",
    argumento: "Para acciones que no se pueden deshacer (pagar, borrar un pedido): evita toques accidentales sin frenar al cliente.",
    ruta: RUTA("HoldButton"),
    uso: `import HoldButton from "@/components/animaciones/rb/micro/HoldButton/HoldButton";

<HoldButton doneLabel="Pagado" holdTime={1200} onHold={() => pagar()}>Mantené para pagar</HoldButton>`,
    Preview: () => (
      <Caja>
        <HoldButton doneLabel="Pagado" holdTime={1200} resetAfter={2500}>
          Mantené para pagar
        </HoldButton>
      </Caja>
    ),
  },
  {
    id: "jelly-radio",
    nombre: "JellyRadio",
    origen: "React Bits",
    categoria: "Micro-interacciones",
    descripcion: "Grupo de chips tipo radio que se hinchan y empujan como gelatina al elegir.",
    argumento: "Elegir talle, color o plan en el producto con chips que responden al toque: más juguetón que un select.",
    ruta: RUTA("JellyRadio"),
    uso: `import JellyRadio from "@/components/animaciones/rb/micro/JellyRadio/JellyRadio";

<JellyRadio items={["S", "M", "L", "XL"]} defaultValue="M" onChange={(v) => setTalle(v)} />`,
    Preview: () => (
      <Caja>
        <JellyRadio items={["S", "M", "L", "XL"]} defaultValue="M" ariaLabel="Talle" />
      </Caja>
    ),
  },
  {
    id: "lattice-loader",
    nombre: "LatticeLoader",
    origen: "React Bits",
    categoria: "Micro-interacciones",
    descripcion: "Loader de grilla de puntos con patrones (serpiente, espiral, ondas) y estados listo / error.",
    argumento: "Mientras se procesa el pago o se genera el PDF del presupuesto, algo lindo para mirar en vez de una rueda genérica.",
    ruta: RUTA("LatticeLoader"),
    uso: `import LatticeLoader from "@/components/animaciones/rb/micro/LatticeLoader/LatticeLoader";

<LatticeLoader status="working" pattern="snake" label="Procesando pago" doneLabel="Pago aprobado" />`,
    Preview: () => (
      <Caja>
        <LatticeLoaderDemo />
      </Caja>
    ),
  },
  {
    id: "paper-crumple",
    nombre: "PaperCrumple",
    origen: "React Bits",
    categoria: "Micro-interacciones",
    descripcion: "Imagen sobre papel 3D que se arruga al apretar y se alisa al soltar (three.js).",
    argumento: "Para un cupón o flyer digital: \"arrugá el cupón si no lo querés\". Efecto wow para campañas.",
    ruta: RUTA("PaperCrumple"),
    uso: `import PaperCrumple from "@/components/animaciones/rb/micro/PaperCrumple/PaperCrumple";

<PaperCrumple src="/cupon.jpg" alt="Cupón" width={320} height={200} releaseBehavior="smooth" />`,
    pesada: true,
    Preview: () => (
      <Caja>
        <PaperCrumple src={FOTO} alt="Cauce" width={280} height={190} sceneHeight={250} />
      </Caja>
    ),
  },
  {
    id: "peek-rating",
    nombre: "PeekRating",
    origen: "React Bits",
    categoria: "Micro-interacciones",
    descripcion: "Estrellas que se elevan y muestran una etiqueta al pasar el mouse antes de puntuar.",
    argumento: "Calificación post-compra o post-turno con estrellas que invitan a votar: más reseñas para tu negocio.",
    ruta: RUTA("PeekRating"),
    uso: `import PeekRating from "@/components/animaciones/rb/micro/PeekRating/PeekRating";

<PeekRating defaultValue={4} labels={["Malo", "Regular", "Bien", "Muy bien", "Excelente"]} onChange={(v) => guardar(v)} />`,
    Preview: () => (
      <Caja>
        <PeekRating defaultValue={4} size={34} labels={["Malo", "Regular", "Bien", "Muy bien", "Excelente"]} />
      </Caja>
    ),
  },
  {
    id: "prompt-bar",
    nombre: "PromptBar",
    origen: "React Bits",
    categoria: "Micro-interacciones",
    descripcion: "Barra de chat IA que crece con el texto, con botón enviar/parar y chispas al mandar.",
    argumento: "El input del chatbot de tu web o del asistente del admin, con el nivel de terminación de una app grande.",
    ruta: RUTA("PromptBar"),
    uso: `import PromptBar from "@/components/animaciones/rb/micro/PromptBar/PromptBar";

<PromptBar placeholder="Preguntale a Cauce..." models={[]} efforts={[]} busy={cargando} onSend={(texto) => enviar(texto)} onStop={() => parar()} />`,
    Preview: () => (
      <Caja>
        <PromptBarDemo />
      </Caja>
    ),
  },
  {
    id: "pulse-heart",
    nombre: "PulseHeart",
    origen: "React Bits",
    categoria: "Micro-interacciones",
    descripcion: "Botón de me gusta que late, explota en puntitos y anima el contador.",
    argumento: "Favoritos en el catálogo o likes en las novedades: el cliente marca lo que le gusta y vos te enterás.",
    ruta: RUTA("PulseHeart"),
    uso: `import PulseHeart from "@/components/animaciones/rb/micro/PulseHeart/PulseHeart";

<PulseHeart count={128} showCount onChange={(liked, count) => guardar(liked)} />`,
    Preview: () => (
      <Caja>
        <PulseHeart count={128} showCount size={30} />
      </Caja>
    ),
  },
  {
    id: "refine-frame",
    nombre: "RefineFrame",
    origen: "React Bits",
    categoria: "Micro-interacciones",
    descripcion: "Marco que muestra una imagen en etapas: en cola, generando, refinando, lista, con barrido de luz.",
    argumento: "Para fotos que genera o mejora la IA (fondos de producto, renders): el cliente ve el progreso y no cierra la pestaña.",
    ruta: RUTA("RefineFrame"),
    uso: `import RefineFrame from "@/components/animaciones/rb/micro/RefineFrame/RefineFrame";

<RefineFrame status="generating" width={320} aspectRatio="4 / 3" onRetry={() => reintentar()}>
  <img src="/render.jpg" alt="" />
</RefineFrame>`,
    Preview: () => (
      <Caja>
        <RefineFrameDemo />
      </Caja>
    ),
  },
  {
    id: "rubber-segment",
    nombre: "RubberSegment",
    origen: "React Bits",
    categoria: "Micro-interacciones",
    descripcion: "Control segmentado cuyo indicador se estira como goma al pasar de una opción a otra.",
    argumento: "Mensual / anual en precios, o Retiro / Envío en el checkout: un switch de opciones que se siente físico.",
    ruta: RUTA("RubberSegment"),
    uso: `import RubberSegment from "@/components/animaciones/rb/micro/RubberSegment/RubberSegment";

<RubberSegment items={["Retiro", "Envío", "Correo"]} defaultValue="Envío" onChange={(v) => setEnvio(v)} />`,
    Preview: () => (
      <Caja>
        <RubberSegment items={["Retiro", "Envío", "Correo"]} defaultValue="Envío" />
      </Caja>
    ),
  },
  {
    id: "scrub-field",
    nombre: "ScrubField",
    origen: "React Bits",
    categoria: "Micro-interacciones",
    descripcion: "Campo numérico que se ajusta arrastrando de costado, con tope elástico y delta visible.",
    argumento: "Cantidad en el carrito o precio en el admin: se cambia deslizando el dedo, sin tipear.",
    ruta: RUTA("ScrubField"),
    uso: `import ScrubField from "@/components/animaciones/rb/micro/ScrubField/ScrubField";

<ScrubField label="Cantidad" suffix="u." defaultValue={2} min={1} max={20} step={1} onCommit={(v) => setCantidad(v)} />`,
    Preview: () => (
      <Caja>
        <ScrubField label="Cantidad" suffix="u." defaultValue={2} min={1} max={20} step={1} showDelta />
      </Caja>
    ),
  },
  {
    id: "slide-commit",
    nombre: "SlideCommit",
    origen: "React Bits",
    categoria: "Micro-interacciones",
    descripcion: "Deslizá para confirmar: el handle recorre la pista, aterriza con rebote y muestra éxito o error.",
    argumento: "El \"deslizá para pagar\" del checkout en el celu: cero clicks accidentales y sensación de app nativa.",
    ruta: RUTA("SlideCommit"),
    uso: `import SlideCommit from "@/components/animaciones/rb/micro/SlideCommit/SlideCommit";

<SlideCommit label="Deslizá para pagar" doneLabel="Pago confirmado" errorLabel="Falló, probá de nuevo" onConfirm={async () => pagar()} />`,
    Preview: () => (
      <Caja>
        <SlideCommit label="Deslizá para pagar" doneLabel="Pago confirmado" errorLabel="Probá de nuevo" width={300} />
      </Caja>
    ),
  },
  {
    id: "sling-button",
    nombre: "SlingButton",
    origen: "React Bits",
    categoria: "Micro-interacciones",
    descripcion: "Botón gomera: se tira hacia atrás y al soltar dispara el ícono con partículas.",
    argumento: "Botón de enviar del formulario de contacto o del chat: tirá y soltá, un detalle que la gente recuerda.",
    ruta: RUTA("SlingButton"),
    uso: `import SlingButton from "@/components/animaciones/rb/micro/SlingButton/SlingButton";

<SlingButton onSend={() => enviar()} ariaLabel="Enviar consulta" />`,
    Preview: () => (
      <Caja>
        <div style={{ display: "grid", gap: 10, justifyItems: "center", ...CLARO }}>
          <SlingButton size={64} />
          <span style={{ fontSize: 12, opacity: 0.6 }}>Tirá hacia atrás y soltá</span>
        </div>
      </Caja>
    ),
  },
  {
    id: "slosh-gauge",
    nombre: "SloshGauge",
    origen: "React Bits",
    categoria: "Micro-interacciones",
    descripcion: "Medidor tipo vaso con líquido que chapotea al moverlo o cambiar el valor.",
    argumento: "Nivel de stock, avance de una obra o cuánto falta para el envío gratis: un número que se ve, no se lee.",
    ruta: RUTA("SloshGauge"),
    uso: `import SloshGauge from "@/components/animaciones/rb/micro/SloshGauge/SloshGauge";

<SloshGauge defaultValue={60} interactive showValue unit="%" onChange={(v) => setNivel(v)} />`,
    Preview: () => (
      <Caja>
        <SloshGauge defaultValue={60} interactive showValue unit="%" height={200} />
      </Caja>
    ),
  },
  {
    id: "spring-check",
    nombre: "SpringCheck",
    origen: "React Bits",
    categoria: "Micro-interacciones",
    descripcion: "Checkbox con rebote elástico y texto que se tacha al marcarlo.",
    argumento: "Lista de pendientes del admin o checklist de un turno: marcar tareas da gustito y se ve el avance.",
    ruta: RUTA("SpringCheck"),
    uso: `import SpringCheck from "@/components/animaciones/rb/micro/SpringCheck/SpringCheck";

<SpringCheck label="Confirmar turno" defaultChecked={false} onChange={(v) => marcar(v)} />`,
    Preview: () => (
      <Caja>
        <div style={{ display: "grid", gap: 12 }}>
          <SpringCheck label="Confirmar turno" defaultChecked />
          <SpringCheck label="Agregar al carrito" />
          <SpringCheck label="Pedir presupuesto" />
        </div>
      </Caja>
    ),
  },
  {
    id: "squish-switch",
    nombre: "SquishSwitch",
    origen: "React Bits",
    categoria: "Micro-interacciones",
    descripcion: "Switch on/off cuyo botón se aplasta y estira al cambiar.",
    argumento: "Activar avisos por WhatsApp, producto visible/oculto en el admin: un toggle que se siente en la mano.",
    ruta: RUTA("SquishSwitch"),
    uso: `import SquishSwitch from "@/components/animaciones/rb/micro/SquishSwitch/SquishSwitch";

<SquishSwitch checked={activo} onChange={setActivo} label="Recibir avisos por WhatsApp" />`,
    Preview: () => (
      <Caja>
        <div style={CLARO}>
          <SquishSwitchDemo />
        </div>
      </Caja>
    ),
  },
  {
    id: "status-mark",
    nombre: "StatusMark",
    origen: "React Bits",
    categoria: "Micro-interacciones",
    descripcion: "Ícono de estado que pasa de pendiente a girando, tilde o cruz con trazo animado.",
    argumento: "Estado del pedido, del pago o de la factura ARCA en el admin: el cliente y vos ven al toque en qué quedó.",
    ruta: RUTA("StatusMark"),
    uso: `import StatusMark from "@/components/animaciones/rb/micro/StatusMark/StatusMark";

<StatusMark status="running" label="Procesando pago" />
<StatusMark status="done" label="Confirmado" />`,
    Preview: () => (
      <Caja>
        <StatusMarkDemo />
      </Caja>
    ),
  },
  {
    id: "swipe-row",
    nombre: "SwipeRow",
    origen: "React Bits",
    categoria: "Micro-interacciones",
    descripcion: "Fila de lista que se desliza y revela acciones (borrar, archivar) como en el celu.",
    argumento: "Turnos o pedidos del admin en el celu: deslizás y cancelás o archivás sin entrar a cada uno.",
    ruta: RUTA("SwipeRow"),
    uso: `import SwipeRow from "@/components/animaciones/rb/micro/SwipeRow/SwipeRow";

<SwipeRow label="Turno · Juan Pérez" actions={[{ id: "cancelar", label: "Cancelar" }, { id: "archivar", label: "Archivar", dismiss: true }]} onCommit={() => borrar()}>
  Turno · Juan Pérez · 10:30
</SwipeRow>`,
    Preview: () => (
      <Caja>
        <SwipeRowDemo />
      </Caja>
    ),
  },
  {
    id: "swipe-toast",
    nombre: "SwipeToast",
    origen: "React Bits",
    categoria: "Micro-interacciones",
    descripcion: "Toast que entra con rebote, tiene mecha de tiempo y se descarta deslizando.",
    argumento: "\"Agregado al carrito\", \"Turno reservado\": la confirmación que se ve, se puede tocar y se va sola.",
    ruta: RUTA("SwipeToast"),
    uso: `import SwipeToast from "@/components/animaciones/rb/micro/SwipeToast/SwipeToast";

<SwipeToast open={abierto} onClose={() => setAbierto(false)} title="Agregado al carrito" description="Producto Cauce" actionLabel="Ver" />`,
    Preview: () => (
      <Caja>
        <SwipeToastDemo />
      </Caja>
    ),
  },
  {
    id: "tear-ticket",
    nombre: "TearTicket",
    origen: "React Bits",
    categoria: "Micro-interacciones",
    descripcion: "Ticket con troquel que se arranca arrastrando el talón, con inclinación 3D.",
    argumento: "Cupón de descuento o entrada a un evento: el cliente lo \"corta\" y lo canjea. Perfecto para promos.",
    ruta: RUTA("TearTicket"),
    uso: `import TearTicket from "@/components/animaciones/rb/micro/TearTicket/TearTicket";

<TearTicket image="/promo.jpg" stub={<div>10% OFF</div>} width={420} height={220} onTear={() => canjear()} />`,
    Preview: () => (
      <Caja>
        <TearTicket
          image={FOTO2}
          imageAlt="Cauce"
          width={340}
          height={190}
          stubSize={110}
          stub={
            <div style={{ display: "grid", height: "100%", placeItems: "center", textAlign: "center", padding: 10, ...CLARO }}>
              <strong style={{ fontSize: 22 }}>10% OFF</strong>
              <span style={{ fontSize: 11, opacity: 0.7 }}>Arrancá el talón</span>
            </div>
          }
        />
      </Caja>
    ),
  },
  {
    id: "thought-line",
    nombre: "ThoughtLine",
    origen: "React Bits",
    categoria: "Micro-interacciones",
    descripcion: "Línea \"pensando...\" que respira, brilla y lista los pasos que va haciendo la IA.",
    argumento: "Para el chatbot de tu web mientras arma un presupuesto: el cliente ve que está trabajando y qué está haciendo.",
    ruta: RUTA("ThoughtLine"),
    uso: `import ThoughtLine from "@/components/animaciones/rb/micro/ThoughtLine/ThoughtLine";

<ThoughtLine label="Pensando" doneLabel="Listo" steps={pasos} working={cargando} collapsible />`,
    Preview: () => (
      <Caja>
        <ThoughtLineDemo />
      </Caja>
    ),
  },
  {
    id: "voice-pill",
    nombre: "VoicePill",
    origen: "React Bits",
    categoria: "Micro-interacciones",
    descripcion: "Botón de grabar audio que se expande en píldora con forma de onda y deslizar para cancelar.",
    argumento: "Consultas por voz en el chatbot o notas de audio en el admin: la misma sensación que WhatsApp.",
    ruta: RUTA("VoicePill"),
    uso: `import VoicePill from "@/components/animaciones/rb/micro/VoicePill/VoicePill";

<VoicePill reactive="mic" onStart={() => grabar()} onStop={({ reason }) => reason === "release" && enviar()} />`,
    Preview: () => (
      <Caja>
        <div style={{ display: "grid", gap: 10, justifyItems: "center", ...CLARO }}>
          <VoicePill reactive="simulated" />
          <span style={{ fontSize: 12, opacity: 0.6 }}>Mantené apretado para grabar</span>
        </div>
      </Caja>
    ),
  },
  {
    id: "wake-slider",
    nombre: "WakeSlider",
    origen: "React Bits",
    categoria: "Micro-interacciones",
    descripcion: "Slider de barras que se levantan como una ola alrededor del cursor.",
    argumento: "Filtro de precio o presupuesto en el catálogo: un control que se disfruta usar en vez de un slider gris.",
    ruta: RUTA("WakeSlider"),
    uso: `import WakeSlider from "@/components/animaciones/rb/micro/WakeSlider/WakeSlider";

<WakeSlider defaultValue={50} showValue formatValue={(v) => \`$ \${v * 1000}\`} onChange={(v) => setPrecio(v)} />`,
    Preview: () => (
      <Caja>
        <div style={{ width: 300 }}>
          <WakeSlider defaultValue={50} showValue formatValue={(v: number) => `$ ${(v * 1000).toLocaleString("es-AR")}`} />
        </div>
      </Caja>
    ),
  },
  {
    id: "warm-tooltip",
    nombre: "WarmTooltip",
    origen: "React Bits",
    categoria: "Micro-interacciones",
    descripcion: "Tooltip que aparece con pop y, una vez \"caliente\", salta al instante entre botones vecinos.",
    argumento: "Ayudas en la barra del admin (editar, duplicar, ocultar): explican sin molestar y se sienten rápidas.",
    ruta: RUTA("WarmTooltip"),
    uso: `import WarmTooltip from "@/components/animaciones/rb/micro/WarmTooltip/WarmTooltip";

<WarmTooltip content="Agregar al carrito" shortcut="A" side="top">
  <button>+</button>
</WarmTooltip>`,
    Preview: () => (
      <Caja>
        <div style={{ display: "flex", gap: 8, ...CLARO }}>
          {[
            ["Agregar al carrito", "A"],
            ["Pedir presupuesto", "P"],
            ["Confirmar turno", "T"],
            ["Cauce", ""],
          ].map(([t, s]) => (
            <WarmTooltip key={t} content={t} shortcut={s || undefined} side="top">
              <button
                type="button"
                aria-label={t}
                style={{ width: 40, height: 40, borderRadius: 10, background: "#27272a", color: "#f5f5f5", fontWeight: 600 }}
              >
                {t[0]}
              </button>
            </WarmTooltip>
          ))}
        </div>
      </Caja>
    ),
  },
];
