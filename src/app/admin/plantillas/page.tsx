import { Badge, Card } from "@/components/ui";
import { CATEGORIA_LABELS, PLANTILLAS, type Plantilla } from "@/lib/plantillas";

export const metadata = { title: "Plantillas" };

/** Biblioteca de plantillas: secciones probadas en proyectos reales, listas para reutilizar. */
export default function PlantillasPage() {
  const categorias = Object.keys(CATEGORIA_LABELS) as Plantilla["categoria"][];
  const enOs = PLANTILLAS.filter((p) => p.estado === "en-el-os").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Plantillas guardadas</h1>
        <p className="text-sm text-muted-foreground">
          El arsenal: {PLANTILLAS.length} secciones probadas en proyectos reales. {enOs} ya viven en
          el OS; el resto se porta a pedido desde su proyecto de origen.
        </p>
      </div>

      {categorias.map((cat) => {
        const items = PLANTILLAS.filter((p) => p.categoria === cat);
        if (items.length === 0) return null;
        return (
          <section key={cat}>
            <h2 className="mb-3 font-semibold">{CATEGORIA_LABELS[cat]}</h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {items.map((p) => (
                <Card key={p.key} className="flex flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-snug">{p.nombre}</h3>
                    <Badge variant={p.estado === "en-el-os" ? "success" : "outline"}>
                      {p.estado === "en-el-os" ? "En el OS" : "Para portar"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Probada en: <span className="font-medium text-foreground">{p.origen}</span>
                  </p>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{p.queHace}</p>
                  <ul className="mt-3 space-y-1">
                    {p.incluye.map((i) => (
                      <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                        <span aria-hidden className="text-primary">✓</span>
                        {i}
                      </li>
                    ))}
                  </ul>
                  {p.rutaOrigen ? (
                    <p className="mt-3 border-t pt-2 font-mono text-[10px] text-muted-foreground">
                      {p.rutaOrigen}
                    </p>
                  ) : null}
                </Card>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
