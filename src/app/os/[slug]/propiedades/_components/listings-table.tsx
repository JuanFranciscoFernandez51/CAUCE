"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Button, EmptyState, ErrorState, Table, Td, Th } from "@/components/ui";
import {
  LISTING_STATUS,
  opLabel,
  typeLabel,
  statusLabel,
  statusTone,
  fmtListingPrice,
} from "@/app/os/[slug]/_lib/listings";

export type ListingRow = {
  id: string;
  title: string;
  operation: string;
  propertyType: string;
  status: string;
  priceUsd: number | null;
  priceArs: number | null;
  neighborhood: string | null;
  city: string | null;
  photo: string | null;
  featured: boolean;
  active: boolean;
};

/**
 * Lista de propiedades con edición INLINE de precio (USD) y estado,
 * toggles de destacada/activa (optimista con rollback). Borrar con confirm().
 */
export function ListingsTable({
  slug,
  listings,
  filtering,
}: {
  slug: string;
  listings: ListingRow[];
  filtering: boolean;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(listings);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Re-sincronizar cuando el server manda props nuevas (búsqueda/refresh).
  const [prev, setPrev] = useState(listings);
  if (listings !== prev) {
    setPrev(listings);
    setRows(listings);
    setDrafts({});
  }

  async function patch(id: string, data: Record<string, unknown>): Promise<boolean> {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const dd = await res.json().catch(() => null);
        throw new Error(dd?.error ?? "No se pudo guardar el cambio");
      }
      router.refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function commitPrice(p: ListingRow) {
    const raw = drafts[p.id];
    if (raw === undefined) return;
    setDrafts((d) => {
      const { [p.id]: _omit, ...rest } = d;
      return rest;
    });
    const trimmed = raw.trim();
    const next = trimmed === "" ? null : Number(trimmed.replace(/[.,\s]/g, ""));
    if (next !== null && (!Number.isFinite(next) || next < 0)) return;
    if (next === p.priceUsd) return;

    const prevVal = p.priceUsd;
    setRows((rs) => rs.map((r) => (r.id === p.id ? { ...r, priceUsd: next } : r)));
    const ok = await patch(p.id, { priceUsd: next });
    if (!ok) setRows((rs) => rs.map((r) => (r.id === p.id ? { ...r, priceUsd: prevVal } : r)));
  }

  async function changeStatus(p: ListingRow, status: string) {
    const prevVal = p.status;
    setRows((rs) => rs.map((r) => (r.id === p.id ? { ...r, status } : r)));
    const ok = await patch(p.id, { status });
    if (!ok) setRows((rs) => rs.map((r) => (r.id === p.id ? { ...r, status: prevVal } : r)));
  }

  async function toggle(p: ListingRow, key: "featured" | "active") {
    const next = !p[key];
    setRows((rs) => rs.map((r) => (r.id === p.id ? { ...r, [key]: next } : r)));
    const ok = await patch(p.id, { [key]: next });
    if (!ok) setRows((rs) => rs.map((r) => (r.id === p.id ? { ...r, [key]: !next } : r)));
  }

  async function remove(p: ListingRow) {
    if (!confirm(`¿Borrar “${p.title}”? Esta acción no se puede deshacer.`)) return;
    setBusyId(p.id);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/listings/${p.id}`, { method: "DELETE" });
      if (!res.ok) {
        const dd = await res.json().catch(() => null);
        throw new Error(dd?.error ?? "No se pudo borrar la propiedad");
      }
      setRows((rs) => rs.filter((r) => r.id !== p.id));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    } finally {
      setBusyId(null);
    }
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon="🏠"
        title={filtering ? "No hay propiedades con esos filtros" : "Todavía no cargaste propiedades"}
        detail={
          filtering
            ? "Probá cambiando la búsqueda o los filtros."
            : "Cargá tu primera propiedad y va a aparecer en tu sitio público al toque."
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {error ? <ErrorState message={error} /> : null}
      <Table>
        <thead>
          <tr>
            <Th>Propiedad</Th>
            <Th className="hidden sm:table-cell">Operación</Th>
            <Th>Precio (USD)</Th>
            <Th>Estado</Th>
            <Th className="text-center">Destacada</Th>
            <Th className="text-center">Activa</Th>
            <Th className="text-right">Acciones</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const busy = busyId === p.id;
            return (
              <tr key={p.id} className={busy ? "opacity-60" : ""}>
                <Td>
                  <div className="flex items-center gap-3">
                    {p.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.photo}
                        alt=""
                        className="h-10 w-14 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded bg-muted text-sm">
                        🏠
                      </span>
                    )}
                    <div className="min-w-0">
                      <Link
                        href={`/os/${slug}/propiedades/${p.id}`}
                        className="block truncate font-medium hover:text-primary hover:underline"
                      >
                        {p.title}
                      </Link>
                      <span className="block truncate text-xs text-muted-foreground">
                        {typeLabel(p.propertyType)}
                        {p.neighborhood ? ` · ${p.neighborhood}` : ""}
                        {p.city ? `, ${p.city}` : ""}
                      </span>
                    </div>
                  </div>
                </Td>
                <Td className="hidden whitespace-nowrap sm:table-cell">
                  <Badge variant="outline">{opLabel(p.operation)}</Badge>
                </Td>
                <Td className="whitespace-nowrap tabular-nums">
                  <input
                    inputMode="numeric"
                    value={
                      drafts[p.id] ??
                      (p.priceUsd != null ? String(p.priceUsd) : "")
                    }
                    placeholder={p.priceArs != null ? "(en ARS)" : "Consultar"}
                    onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
                    onBlur={() => commitPrice(p)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                      if (e.key === "Escape") {
                        setDrafts((d) => {
                          const { [p.id]: _omit, ...rest } = d;
                          return rest;
                        });
                      }
                    }}
                    disabled={busy}
                    aria-label={`Precio USD de ${p.title}`}
                    className="h-8 w-28 rounded-md border border-input bg-card px-2 text-sm tabular-nums text-card-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
                  />
                </Td>
                <Td>
                  <select
                    value={p.status}
                    onChange={(e) => changeStatus(p, e.target.value)}
                    disabled={busy}
                    aria-label={`Estado de ${p.title}`}
                    className="h-8 rounded-md border border-input bg-card px-2 text-sm text-card-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
                  >
                    {LISTING_STATUS.map((s) => (
                      <option key={s} value={s}>
                        {statusLabel(s)}
                      </option>
                    ))}
                  </select>
                </Td>
                <Td className="text-center">
                  <ToggleSwitch
                    on={p.featured}
                    busy={busy}
                    label={`${p.featured ? "Quitar de" : "Marcar como"} destacada — ${p.title}`}
                    onClick={() => toggle(p, "featured")}
                  />
                </Td>
                <Td className="text-center">
                  <ToggleSwitch
                    on={p.active}
                    busy={busy}
                    label={`${p.active ? "Desactivar" : "Activar"} ${p.title}`}
                    onClick={() => toggle(p, "active")}
                  />
                </Td>
                <Td className="whitespace-nowrap text-right">
                  <div className="inline-flex items-center gap-1.5">
                    <Link
                      href={`/os/${slug}/propiedades/${p.id}`}
                      className="inline-flex h-7 items-center rounded border bg-card px-2 text-xs font-medium hover:bg-muted"
                    >
                      Editar
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-destructive"
                      onClick={() => remove(p)}
                      disabled={busy}
                    >
                      Borrar
                    </Button>
                  </div>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      <p className="text-xs text-muted-foreground">
        Tip: la fila muestra el estado actual con{" "}
        <Badge variant={statusTone("disponible")}>Disponible</Badge>,{" "}
        <Badge variant={statusTone("reservada")}>Reservada</Badge> y más. Editá precio (USD) y
        estado directo desde acá. El precio se muestra como{" "}
        {fmtListingPrice({ priceUsd: 120000 })} en el sitio.
      </p>
    </div>
  );
}

function ToggleSwitch({
  on,
  busy,
  label,
  onClick,
}: {
  on: boolean;
  busy: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      disabled={busy}
      className={`relative inline-block h-5 w-9 rounded-full transition-colors disabled:opacity-50 ${
        on ? "bg-primary" : "bg-muted"
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-card shadow transition-all ${
          on ? "left-[18px]" : "left-0.5"
        }`}
      />
    </button>
  );
}
