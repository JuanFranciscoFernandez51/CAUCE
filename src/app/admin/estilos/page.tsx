export const metadata = { title: "Catálogo de estilos" };

/**
 * CATÁLOGO DE TERMINACIONES — para mostrarle al cliente y que elija cómo
 * quiere su sistema, como quien elige acabados. Imprimible (Cmd/Ctrl+P → PDF).
 * Las opciones se aplican desde la Configuración del sistema del cliente.
 */

function Mini({
  radius,
  navArriba,
  compacta,
}: {
  radius: string;
  navArriba?: boolean;
  compacta?: boolean;
}) {
  const pad = compacta ? "p-1" : "p-1.5";
  const card = `${pad} border bg-card`;
  return (
    <div
      className="flex h-36 w-full overflow-hidden border bg-background"
      style={{ borderRadius: radius }}
      aria-hidden
    >
      {!navArriba ? (
        <div className="flex w-14 shrink-0 flex-col gap-1 border-r bg-card p-1.5">
          <div className="h-3 w-3 rounded-full bg-primary" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-2 ${i === 1 ? "bg-primary" : "bg-muted"}`} style={{ borderRadius: radius }} />
          ))}
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        {navArriba ? (
          <div className="flex items-center gap-1 border-b bg-card px-1.5 py-1">
            <div className="h-3 w-3 rounded-full bg-primary" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`h-2 w-7 ${i === 1 ? "bg-primary" : "bg-muted"}`} style={{ borderRadius: radius }} />
            ))}
          </div>
        ) : null}
        <div className={`grid grid-cols-3 gap-1 ${compacta ? "p-1" : "p-1.5"}`}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={card} style={{ borderRadius: radius }}>
              <div className="h-1.5 w-2/3 bg-muted" style={{ borderRadius: radius }} />
              <div className="mt-1 h-2.5 w-1/2 bg-primary/60" style={{ borderRadius: radius }} />
            </div>
          ))}
          <div className={`col-span-3 ${card}`} style={{ borderRadius: radius }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={`mb-1 h-1.5 bg-muted ${compacta ? "" : "last:mb-0"}`} style={{ borderRadius: radius, width: `${90 - i * 15}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EstilosPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 print:max-w-none">
      <style>{`@media print { .no-print { display: none } @page { size: A4; margin: 14mm } }`}</style>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Catálogo de estilos</h1>
          <p className="text-sm text-muted-foreground">
            Para elegir con el cliente cómo quiere su sistema. Se aplica desde su
            Configuración, al instante y sin costo.
          </p>
        </div>
      </div>

      {/* 1 — Esquinas */}
      <section className="space-y-3">
        <h2 className="font-semibold">1 · Esquinas — el acabado</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Rectas", detalle: "Sobrio, industrial. Talleres, corralones, estudios.", r: "2px" },
            { label: "Suaves", detalle: "Equilibrado. El punto medio que va con todo.", r: "8px" },
            { label: "Redondeadas", detalle: "Amigable, cercano. Escuelas, estética, salud.", r: "18px" },
          ].map((o) => (
            <figure key={o.label}>
              <Mini radius={o.r} />
              <figcaption className="mt-2">
                <p className="text-sm font-semibold">{o.label}</p>
                <p className="text-xs text-muted-foreground">{o.detalle}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* 2 — Menú */}
      <section className="space-y-3">
        <h2 className="font-semibold">2 · Menú — dónde vive la navegación</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { label: "A la izquierda", detalle: "Clásico de sistema de gestión. Muchas secciones a la vista.", arriba: false },
            { label: "Arriba", detalle: "Más lugar para el contenido. Ideal con pocas secciones.", arriba: true },
          ].map((o) => (
            <figure key={o.label}>
              <Mini radius="8px" navArriba={o.arriba} />
              <figcaption className="mt-2">
                <p className="text-sm font-semibold">{o.label}</p>
                <p className="text-xs text-muted-foreground">{o.detalle}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* 3 — Densidad */}
      <section className="space-y-3">
        <h2 className="font-semibold">3 · Densidad — cuánta info por pantalla</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { label: "Cómoda", detalle: "Más aire. Fácil de leer, ideal en el celular.", compacta: false },
            { label: "Compacta", detalle: "Más filas y datos juntos. Para operar rápido en escritorio.", compacta: true },
          ].map((o) => (
            <figure key={o.label}>
              <Mini radius="8px" compacta={o.compacta} />
              <figcaption className="mt-2">
                <p className="text-sm font-semibold">{o.label}</p>
                <p className="text-xs text-muted-foreground">{o.detalle}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        <p>
          <span className="font-semibold text-foreground">Además, siempre con tu marca:</span> tu
          logo, tus colores (principal y acento) y modo claro u oscuro. Cualquier combinación se
          cambia en un minuto desde «Configuración de la página» del sistema del cliente.
        </p>
      </section>

      <p className="no-print text-xs text-muted-foreground">
        💡 Imprimí esta página (Cmd/Ctrl + P → guardar como PDF) para llevarla a la reunión.
      </p>
    </div>
  );
}
