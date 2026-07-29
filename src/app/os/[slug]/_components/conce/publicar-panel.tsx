"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Select,
  Table,
  Td,
  Textarea,
  Th,
} from "@/components/ui";
import { captionVehiculo, fmtKm, fmtPrecioVehiculo } from "@/lib/conce";

/** Estado de la publicación de un vehículo en un canal (null = todavía no hay). */
export type EstadoCanal = "PUBLICADA" | "PROGRAMADA" | "BORRADOR" | "ERROR" | null;

export type VehiculoPub = {
  id: string;
  slug: string;
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
  /** Se muestra o no en la web del tenant. */
  publicado: boolean;
  estadoStock: string;
  ig: EstadoCanal;
  ml: EstadoCanal;
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

type EstadoFila = { publicado: boolean; ig: EstadoCanal; ml: EstadoCanal };

/**
 * Panel Publicar: armado 1-click de publicaciones IG (programables, las toma
 * el cron cuando el cliente conecta su cuenta) y ML (aviso listo para pegar —
 * conexión pendiente de credenciales). Con historial y acciones.
 *
 * Dos vistas: GRILLA (el armador de siempre, con el texto en grande) y LISTA
 * (tabla compacta de todo el stock con el semáforo Web / Instagram / Mercado
 * Libre y los botones de publicar uno por uno, sin salir de la lista).
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
  const [vista, setVista] = useState<"grilla" | "lista">("grilla");
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

  // Vista lista
  const [busca, setBusca] = useState("");
  const [soloSinPublicar, setSoloSinPublicar] = useState(false);
  const [ocupado, setOcupado] = useState<string | null>(null); // `${vehiculoId}:${canal}`
  const [errorFila, setErrorFila] = useState("");
  /** Estado optimista por vehículo: lo que ya hicimos sin esperar el refresh. */
  const [ov, setOv] = useState<Record<string, EstadoFila>>({});

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

  // ── Vista lista: estado por fila + acciones uno por uno ──────────────────

  const estadoDe = (v: VehiculoPub): EstadoFila =>
    ov[v.id] ?? { publicado: v.publicado, ig: v.ig, ml: v.ml };

  /** Publicar / sacar de la web del tenant (toggle `publicado`). */
  async function toggleWeb(v: VehiculoPub) {
    const actual = estadoDe(v);
    setOcupado(`${v.id}:web`);
    setErrorFila("");
    try {
      const res = await fetch(`/api/os/${slug}/conce/vehiculos/${v.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicado: !actual.publicado }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "No se pudo cambiar la web");
      }
      setOv((p) => ({ ...p, [v.id]: { ...actual, publicado: !actual.publicado } }));
      router.refresh();
    } catch (err) {
      setErrorFila(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setOcupado(null);
    }
  }

  /** Arma la publicación de IG o ML desde la fila, con el texto automático. */
  async function publicarCanal(v: VehiculoPub, c: "instagram" | "mercadolibre") {
    const actual = estadoDe(v);
    setOcupado(`${v.id}:${c}`);
    setErrorFila("");
    try {
      const texto =
        c === "mercadolibre"
          ? [captionVehiculo(v), "", v.descripcion ?? ""].join("\n").trim()
          : captionVehiculo(v);
      const res = await fetch(`/api/os/${slug}/conce/publicaciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehiculoId: v.id, canal: c, caption: texto }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "No se pudo armar la publicación");
      }
      setOv((p) => ({
        ...p,
        [v.id]: c === "instagram" ? { ...actual, ig: "BORRADOR" } : { ...actual, ml: "BORRADOR" },
      }));
      router.refresh();
    } catch (err) {
      setErrorFila(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setOcupado(null);
    }
  }

  const faltaAlgo = (v: VehiculoPub) => {
    const e = estadoDe(v);
    return !e.publicado || !e.ig || !e.ml;
  };

  const filas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return vehiculos.filter((v) => {
      if (q && !`${v.etiqueta} ${v.anio}`.toLowerCase().includes(q)) return false;
      return !soloSinPublicar || faltaAlgo(v);
    });
    // `ov` entra para que el filtro se recalcule al publicar desde la fila.
  }, [vehiculos, busca, soloSinPublicar, ov]); // eslint-disable-line react-hooks/exhaustive-deps

  const sinPublicar = vehiculos.filter(faltaAlgo).length;

  const badgeEstado = (e: string) => (
    <Badge
      variant={
        e === "PUBLICADA" ? "success" : e === "PROGRAMADA" ? "primary" : e === "ERROR" ? "destructive" : "warning"
      }
    >
      {e === "BORRADOR" ? "Borrador" : e === "PROGRAMADA" ? "Programada" : e === "PUBLICADA" ? "Publicada" : "Error"}
    </Badge>
  );

  const badgeCanal = (e: EstadoCanal) => {
    if (!e) return <Badge variant="default">No</Badge>;
    if (e === "PUBLICADA") return <Badge variant="success">Publicado</Badge>;
    if (e === "PROGRAMADA") return <Badge variant="primary">Programado</Badge>;
    if (e === "ERROR") return <Badge variant="destructive">Error</Badge>;
    return <Badge variant="warning">Armado</Badge>;
  };

  const btnFila =
    "inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold transition-colors hover:bg-muted disabled:opacity-50";

  return (
    <div className="space-y-5">
      {/* Toggle de vista */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {vehiculos.length} vehículo{vehiculos.length === 1 ? "" : "s"} en stock ·{" "}
          <span className={sinPublicar > 0 ? "font-semibold text-warning" : ""}>
            {sinPublicar} con algo sin publicar
          </span>
        </p>
        <div className="flex gap-1 rounded-md border p-0.5">
          <button
            type="button"
            onClick={() => setVista("grilla")}
            className={`h-8 rounded px-3 text-sm font-semibold transition-colors ${
              vista === "grilla" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            ▦ Grilla
          </button>
          <button
            type="button"
            onClick={() => setVista("lista")}
            className={`h-8 rounded px-3 text-sm font-semibold transition-colors ${
              vista === "lista" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            ☰ Lista
          </button>
        </div>
      </div>

      {vista === "grilla" ? (
        /* Armar publicación (la vista de siempre) */
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
      ) : (
        /* Vista lista: semáforo de canales + publicar uno por uno */
        <div className="space-y-3">
          {errorFila ? <ErrorState message={errorFila} /> : null}

          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar marca, modelo o año…"
              className="h-9 max-w-xs"
            />
            <button
              type="button"
              onClick={() => setSoloSinPublicar((s) => !s)}
              className={`h-9 rounded-md border px-3 text-sm font-semibold transition-colors ${
                soloSinPublicar ? "border-primary bg-primary-soft text-primary" : "hover:bg-muted"
              }`}
            >
              {soloSinPublicar ? "✓ " : ""}Solo sin publicar
            </button>
            <span className="text-xs text-muted-foreground">
              {filas.length} de {vehiculos.length}
            </span>
          </div>

          {filas.length === 0 ? (
            <EmptyState
              icon="✅"
              title={soloSinPublicar ? "Está todo publicado" : "Sin vehículos"}
              detail={
                soloSinPublicar
                  ? "Web, Instagram y Mercado Libre al día en todo el stock."
                  : "Cargá vehículos en Stock y aparecen acá."
              }
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th className="w-16">Foto</Th>
                  <Th>Vehículo</Th>
                  <Th className="whitespace-nowrap">Precio</Th>
                  <Th className="text-center">Web</Th>
                  <Th className="text-center">Instagram</Th>
                  <Th className="text-center">Mercado Libre</Th>
                  <Th className="text-right">Publicar</Th>
                </tr>
              </thead>
              <tbody>
                {filas.map((v) => {
                  const e = estadoDe(v);
                  return (
                    <tr key={v.id} className="hover:bg-muted/40">
                      <Td>
                        {v.fotos[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={v.fotos[0]}
                            alt=""
                            className="h-10 w-14 rounded-md border object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-14 items-center justify-center rounded-md bg-muted text-xs">
                            🚗
                          </div>
                        )}
                      </Td>
                      <Td>
                        <Link href={`/os/${slug}/stock/${v.id}`} className="font-medium hover:text-primary">
                          {v.etiqueta}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {fmtKm(v.km)}
                          {v.estadoStock === "reservado" ? " · reservado" : ""}
                          {v.fotos.length === 0 ? " · ⚠ sin fotos" : ""}
                        </p>
                      </Td>
                      <Td className="whitespace-nowrap font-semibold">
                        {fmtPrecioVehiculo(v.precio, v.moneda)}
                      </Td>
                      <Td className="text-center">
                        {e.publicado ? <Badge variant="success">Sí</Badge> : <Badge variant="default">No</Badge>}
                      </Td>
                      <Td className="text-center">{badgeCanal(e.ig)}</Td>
                      <Td className="text-center">{badgeCanal(e.ml)}</Td>
                      <Td>
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <button
                            type="button"
                            disabled={ocupado === `${v.id}:web`}
                            onClick={() => void toggleWeb(v)}
                            className={`${btnFila} ${
                              e.publicado ? "text-muted-foreground" : "border-primary text-primary"
                            }`}
                            title={e.publicado ? "Sacar de la web" : "Mostrar en la web"}
                          >
                            {ocupado === `${v.id}:web` ? "…" : e.publicado ? "🌐 Quitar" : "🌐 Web"}
                          </button>
                          <button
                            type="button"
                            disabled={ocupado === `${v.id}:instagram`}
                            onClick={() => void publicarCanal(v, "instagram")}
                            className={`${btnFila} ${e.ig ? "text-muted-foreground" : "border-primary text-primary"}`}
                            title={e.ig ? "Ya tiene post de IG — armar otro" : "Armar el post de Instagram"}
                          >
                            {ocupado === `${v.id}:instagram` ? "…" : "📷 IG"}
                          </button>
                          <button
                            type="button"
                            disabled={ocupado === `${v.id}:mercadolibre`}
                            onClick={() => void publicarCanal(v, "mercadolibre")}
                            className={`${btnFila} ${e.ml ? "text-muted-foreground" : "border-primary text-primary"}`}
                            title={e.ml ? "Ya tiene aviso de ML — armar otro" : "Armar el aviso de Mercado Libre"}
                          >
                            {ocupado === `${v.id}:mercadolibre` ? "…" : "🛒 ML"}
                          </button>
                          {e.publicado ? (
                            <Link
                              href={`/sitio/${slug}/vehiculo/${v.slug}`}
                              target="_blank"
                              className={`${btnFila} text-muted-foreground`}
                              title="Ver la ficha en la web"
                            >
                              ↗
                            </Link>
                          ) : null}
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </div>
      )}

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
