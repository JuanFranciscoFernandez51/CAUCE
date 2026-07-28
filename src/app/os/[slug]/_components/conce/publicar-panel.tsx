"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, EmptyState, ErrorState, Field, Select, Textarea } from "@/components/ui";
import { captionVehiculo } from "@/lib/conce";

export type VehiculoPub = {
  id: string;
  etiqueta: string;
  marca: string;
  modelo: string;
  version: string | null;
  anio: number;
  km: number;
  precio: number | null;
  moneda: string;
  condicion: string;
  descripcion: string | null;
  fotos: string[];
};

export type PublicacionRow = {
  id: string;
  canal: string;
  caption: string;
  estado: string;
  programadaPara: string | null;
  publicadaEn: string | null;
  fotos: string[];
  vehiculo: string;
};

/**
 * Panel Publicar: armado 1-click de publicaciones IG (programables, las toma
 * el cron cuando el cliente conecta su cuenta) y ML (aviso listo para pegar —
 * conexión pendiente de credenciales). Con historial y acciones.
 */
export function PublicarPanel({
  slug,
  vehiculos,
  publicaciones,
  preseleccion,
}: {
  slug: string;
  vehiculos: VehiculoPub[];
  publicaciones: PublicacionRow[];
  preseleccion: string | null;
}) {
  const router = useRouter();
  const [vehiculoId, setVehiculoId] = useState(
    preseleccion && vehiculos.some((v) => v.id === preseleccion) ? preseleccion : ""
  );
  const [canal, setCanal] = useState<"instagram" | "mercadolibre">("instagram");
  const [caption, setCaption] = useState("");
  const [captionTocada, setCaptionTocada] = useState(false);
  const [programada, setProgramada] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  const vehiculo = useMemo(() => vehiculos.find((v) => v.id === vehiculoId) ?? null, [vehiculoId, vehiculos]);

  const captionAuto = useMemo(() => {
    if (!vehiculo) return "";
    const base = captionVehiculo(vehiculo);
    if (canal === "mercadolibre") {
      // Para ML sumamos la descripción completa (aviso largo).
      return [base, "", vehiculo.descripcion ?? ""].join("\n").trim();
    }
    return base;
  }, [vehiculo, canal]);

  const captionFinal = captionTocada ? caption : captionAuto;

  async function crear() {
    if (!vehiculo) return setError("Elegí un vehículo");
    if (!captionFinal.trim()) return setError("Escribí el texto");
    setGuardando(true);
    setError("");
    setOkMsg("");
    try {
      const res = await fetch(`/api/os/${slug}/conce/publicaciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehiculoId: vehiculo.id,
          canal,
          caption: captionFinal.trim(),
          ...(canal === "instagram" && programada ? { programadaPara: programada } : {}),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo crear la publicación");
      setOkMsg(
        canal === "instagram"
          ? programada
            ? "✅ Publicación de Instagram programada."
            : "✅ Borrador de Instagram creado."
          : "✅ Aviso de Mercado Libre armado: copialo desde el historial de abajo."
      );
      setCaptionTocada(false);
      setCaption("");
      setProgramada("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setGuardando(false);
    }
  }

  async function accion(id: string, body: Record<string, unknown> | null) {
    try {
      await fetch(`/api/os/${slug}/conce/publicaciones/${id}`, {
        method: body ? "PATCH" : "DELETE",
        ...(body
          ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
          : {}),
      });
      router.refresh();
    } catch {
      // el refresh mostrará el estado real
    }
  }

  async function copiar(p: PublicacionRow) {
    try {
      await navigator.clipboard.writeText(p.caption);
      setCopiadoId(p.id);
      setTimeout(() => setCopiadoId(null), 1800);
    } catch {
      // sin clipboard, nada
    }
  }

  const badgeEstado = (e: string) => (
    <Badge
      variant={
        e === "PUBLICADA" ? "success" : e === "PROGRAMADA" ? "primary" : e === "ERROR" ? "destructive" : "warning"
      }
    >
      {e === "BORRADOR" ? "Borrador" : e === "PROGRAMADA" ? "Programada" : e === "PUBLICADA" ? "Publicada" : "Error"}
    </Badge>
  );

  return (
    <div className="space-y-5">
      {/* Armar publicación */}
      <Card className="space-y-4 p-4">
        {error ? <ErrorState message={error} /> : null}
        {okMsg ? <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">{okMsg}</p> : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Vehículo *">
            <Select
              value={vehiculoId}
              onChange={(e) => {
                setVehiculoId(e.target.value);
                setCaptionTocada(false);
              }}
            >
              <option value="">Elegí del stock…</option>
              {vehiculos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.etiqueta}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Canal">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setCanal("instagram");
                  setCaptionTocada(false);
                }}
                className={`h-10 flex-1 rounded-md border text-sm font-semibold ${
                  canal === "instagram" ? "border-primary bg-primary-soft text-primary" : "hover:bg-muted"
                }`}
              >
                📷 Instagram
              </button>
              <button
                type="button"
                onClick={() => {
                  setCanal("mercadolibre");
                  setCaptionTocada(false);
                }}
                className={`h-10 flex-1 rounded-md border text-sm font-semibold ${
                  canal === "mercadolibre" ? "border-primary bg-primary-soft text-primary" : "hover:bg-muted"
                }`}
              >
                🛒 Mercado Libre
              </button>
            </div>
          </Field>
          {canal === "instagram" ? (
            <Field label="Programar para" help="Vacío = queda como borrador.">
              <input
                type="datetime-local"
                value={programada}
                onChange={(e) => setProgramada(e.target.value)}
                className="h-10 w-full rounded-md border bg-card px-3 text-sm outline-none focus:border-primary"
              />
            </Field>
          ) : (
            <div className="flex items-end pb-1">
              <Badge variant="warning">🔌 Conexión con ML pendiente — el aviso queda listo para pegar</Badge>
            </div>
          )}
        </div>

        <Field
          label={canal === "instagram" ? "Caption del post" : "Texto del aviso"}
          help="Se arma solo con los datos del vehículo; tocalo si querés."
        >
          <Textarea
            value={captionFinal}
            onChange={(e) => {
              setCaption(e.target.value);
              setCaptionTocada(true);
            }}
            rows={canal === "instagram" ? 6 : 10}
            placeholder="Elegí un vehículo y el texto se arma solo…"
          />
        </Field>

        {vehiculo && vehiculo.fotos.length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-semibold text-muted-foreground">
              Fotos que van en la publicación ({Math.min(vehiculo.fotos.length, 10)}):
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {vehiculo.fotos.slice(0, 10).map((f, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={f} alt="" className="h-16 w-24 shrink-0 rounded-md border object-cover" />
              ))}
            </div>
          </div>
        ) : null}

        <Button type="button" disabled={guardando || !vehiculo} onClick={crear}>
          {guardando
            ? "Creando…"
            : canal === "instagram"
              ? programada
                ? "📷 Programar publicación"
                : "📷 Crear borrador de Instagram"
              : "🛒 Armar aviso de Mercado Libre"}
        </Button>
      </Card>

      {/* Historial */}
      <div>
        <h2 className="mb-2 text-sm font-semibold">Historial de publicaciones</h2>
        {publicaciones.length === 0 ? (
          <EmptyState icon="📣" title="Sin publicaciones todavía" detail="Armá la primera acá arriba." />
        ) : (
          <ul className="space-y-2">
            {publicaciones.map((p) => (
              <li key={p.id} className="rounded-lg border bg-card p-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg">{p.canal === "instagram" ? "📷" : "🛒"}</span>
                  <span className="font-medium">{p.vehiculo}</span>
                  {badgeEstado(p.estado)}
                  {p.programadaPara ? (
                    <span className="text-xs text-muted-foreground">
                      programada {new Date(p.programadaPara).toLocaleString("es-AR")}
                    </span>
                  ) : null}
                  {p.publicadaEn ? (
                    <span className="text-xs text-muted-foreground">
                      publicada {new Date(p.publicadaEn).toLocaleDateString("es-AR")}
                    </span>
                  ) : null}
                  <span className="ml-auto flex gap-2">
                    <button
                      type="button"
                      onClick={() => copiar(p)}
                      className="rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-muted"
                    >
                      {copiadoId === p.id ? "✅ Copiado" : "📋 Copiar texto"}
                    </button>
                    {p.estado !== "PUBLICADA" ? (
                      <button
                        type="button"
                        onClick={() => accion(p.id, { estado: "PUBLICADA" })}
                        className="rounded-md border border-success/40 px-2.5 py-1 text-xs font-semibold text-success hover:bg-success/10"
                        title="Ya la subiste a mano — marcarla publicada"
                      >
                        ✔ Marcar publicada
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("¿Borrar esta publicación?")) void accion(p.id, null);
                      }}
                      className="rounded-md px-1.5 py-1 text-xs text-muted-foreground hover:text-destructive"
                    >
                      🗑
                    </button>
                  </span>
                </div>
                <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm text-muted-foreground">
                  {p.caption}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
