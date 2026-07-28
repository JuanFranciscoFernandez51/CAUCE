"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, ErrorState, Table, Td, Th } from "@/components/ui";
import { CLIENT_STATUS_LABELS, PACK_LABELS } from "../_components/format";
import { CeldaEditable } from "../_components/celda-editable";

export type ClienteView = {
  id: string;
  name: string;
  slug: string;
  rubro: string | null;
  pack: string;
  status: string;
  mrr: number;
  health: number;
  costEstUsd: number;
  modules: string[];
};

const fmtUsd = (n: number) => `USD ${Math.round(n)}`;

/** Lista de clientes con edición inline: nombre, rubro, pack, estado, MRR y salud. */
export function ClientesList({ clients }: { clients: ClienteView[] }) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function patch(id: string, body: Record<string, unknown>) {
    setError("");
    try {
      const res = await fetch(`/api/admin/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "No se pudo guardar");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    }
  }

  const selectMini =
    "rounded-md border bg-card px-1.5 py-1 text-xs font-medium hover:bg-muted cursor-pointer";

  return (
    <div className="space-y-2">
      {error ? <ErrorState message={error} /> : null}
      <Table>
        <thead>
          <tr>
            <Th>Nombre</Th>
            <Th>Pack</Th>
            <Th>Estado</Th>
            <Th>MRR</Th>
            <Th>Salud</Th>
            <Th>Costo est. vs MRR</Th>
            <Th>Módulos OS</Th>
            <Th></Th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.id} className="hover:bg-muted/50">
              <Td>
                <CeldaEditable
                  valor={c.name}
                  onGuardar={(v) => patch(c.id, { name: v || c.name })}
                  className="font-medium"
                />
                <div className="text-xs text-muted-foreground">
                  <CeldaEditable
                    valor={c.rubro}
                    placeholder={c.slug}
                    onGuardar={(v) => patch(c.id, { rubro: v || null })}
                  />
                </div>
              </Td>
              <Td>
                <select
                  value={c.pack}
                  onChange={(e) => void patch(c.id, { pack: e.target.value })}
                  className={selectMini}
                  aria-label="Pack"
                >
                  {Object.entries(PACK_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </Td>
              <Td>
                <select
                  value={c.status}
                  onChange={(e) => void patch(c.id, { status: e.target.value })}
                  className={selectMini}
                  aria-label="Estado"
                >
                  {Object.entries(CLIENT_STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </Td>
              <Td className="font-medium">
                <span className="flex items-center gap-0.5">
                  USD{" "}
                  <CeldaEditable
                    valor={c.mrr}
                    tipo="number"
                    onGuardar={(v) => patch(c.id, { mrr: Math.max(0, Number(v) || 0) })}
                  />
                </span>
              </Td>
              <Td>
                <span
                  className={
                    c.health >= 80
                      ? "text-success"
                      : c.health >= 50
                        ? "text-warning"
                        : "text-destructive"
                  }
                >
                  <CeldaEditable
                    valor={c.health}
                    tipo="number"
                    onGuardar={(v) =>
                      patch(c.id, { health: Math.min(100, Math.max(0, Math.round(Number(v) || 0))) })
                    }
                  />
                  %
                </span>
              </Td>
              <Td className="text-muted-foreground">
                {fmtUsd(c.costEstUsd)} / {fmtUsd(c.mrr)}
              </Td>
              <Td>
                {c.modules.length === 0 ? (
                  <span className="text-xs text-muted-foreground">—</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {c.modules.map((m) => (
                      <Badge key={m} variant="outline">
                        {m}
                      </Badge>
                    ))}
                  </div>
                )}
              </Td>
              <Td>
                <Link
                  href={`/admin/clientes/${c.id}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Ver →
                </Link>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
