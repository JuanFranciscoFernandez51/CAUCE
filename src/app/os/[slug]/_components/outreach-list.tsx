"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card } from "@/components/ui";

export type TareaData = {
  id: string;
  tipo: string;
  nombre: string;
  telefono: string | null;
  mensaje: string;
  fechaProgramada: string;
};

const TIPO_LABEL: Record<string, string> = {
  "recordatorio-turno": "Recordatorio de turno",
  "seguimiento-consulta": "Seguimiento",
};

/** Normaliza un teléfono argentino a formato wa.me (solo dígitos, con 549). */
function waNumber(tel: string): string {
  let d = tel.replace(/\D/g, "");
  if (d.startsWith("0")) d = d.slice(1);
  if (!d.startsWith("54")) d = `54${d}`;
  if (!d.startsWith("549")) d = `549${d.slice(2)}`;
  return d;
}

/** Mensajes del día con WhatsApp a 1 clic. Mandaste → marcás y desaparece. */
export function OutreachList({ slug, tareas: initial }: { slug: string; tareas: TareaData[] }) {
  const router = useRouter();
  const [tareas, setTareas] = useState(initial);

  async function marcar(id: string, estado: "ENVIADA" | "DESCARTADA") {
    const prev = tareas;
    setTareas((ts) => ts.filter((t) => t.id !== id));
    const res = await fetch(`/api/os/${slug}/outreach/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    if (!res.ok) setTareas(prev);
    else router.refresh();
  }

  return (
    <Card className="p-5">
      <h2 className="mb-3 font-semibold">Mensajes para mandar ({tareas.length})</h2>
      {tareas.length === 0 ? (
        <p className="rounded-md border border-dashed px-4 py-5 text-center text-sm text-muted-foreground">
          Nada pendiente. Los procesos generan los mensajes de cada día a la mañana. ✅
        </p>
      ) : (
        <ul className="divide-y">
          {tareas.map((t) => {
            const wa = t.telefono
              ? `https://wa.me/${waNumber(t.telefono)}?text=${encodeURIComponent(t.mensaje)}`
              : null;
            return (
              <li key={t.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{t.nombre}</p>
                    <Badge>{TIPO_LABEL[t.tipo] ?? t.tipo}</Badge>
                  </div>
                  <div className="flex gap-1.5">
                    {wa ? (
                      <a
                        href={wa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md bg-success px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                        onClick={() => void marcar(t.id, "ENVIADA")}
                      >
                        💬 Mandar WhatsApp
                      </a>
                    ) : (
                      <Button size="sm" variant="secondary" onClick={() => void marcar(t.id, "ENVIADA")}>
                        Marcar hecha
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => void marcar(t.id, "DESCARTADA")}>
                      Descartar
                    </Button>
                  </div>
                </div>
                <p className="mt-1.5 rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                  {t.mensaje}
                </p>
                {!t.telefono ? (
                  <p className="mt-1 text-xs text-warning">Sin teléfono cargado — completalo en el CRM.</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
