"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Button, Card, EmptyState, ErrorState, Field, Input, Select, Spinner, Textarea } from "@/components/ui";
import { fmtDate } from "../../_components/format";

export type CredentialData = {
  id: string;
  kind: string;
  label: string;
  createdAt: string;
};

const KINDS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "sheets", label: "Google Sheets" },
  { value: "other", label: "Otra" },
];

export function CredentialsSection({
  clientId,
  credentials,
}: {
  clientId: string;
  credentials: CredentialData[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState("whatsapp");
  const [label, setLabel] = useState("");
  const [data, setData] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/credentials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, label, data }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo guardar la credencial");
      setOpen(false);
      setLabel("");
      setData("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la credencial");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string, credLabel: string) {
    if (!confirm(`¿Borrar la credencial "${credLabel}"? Esta acción no se puede deshacer.`)) return;
    setDeleting(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/credentials/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo borrar");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo borrar");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold">Credenciales</h2>
          <p className="text-xs text-muted-foreground">
            Cifradas AES-256-GCM. El contenido nunca se muestra.
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setOpen((v) => !v)}>
          {open ? "Cerrar" : "+ Credencial"}
        </Button>
      </div>

      {open ? (
        <form onSubmit={submit} className="mb-4 grid gap-3 rounded-md border border-dashed p-3 sm:grid-cols-2">
          <Field label="Tipo">
            <Select value={kind} onChange={(e) => setKind(e.target.value)}>
              {KINDS.map((k) => (
                <option key={k.value} value={k.value}>{k.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Etiqueta">
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Token WhatsApp Business"
              required
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Datos (JSON o texto)" help="Se cifra antes de guardarse. No se puede volver a ver desde acá.">
              <Textarea
                value={data}
                onChange={(e) => setData(e.target.value)}
                rows={4}
                placeholder='{"token":"...","phoneId":"..."}'
                required
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" size="sm" disabled={busy || !label.trim() || !data.trim()}>
              {busy ? <Spinner /> : "🔒"} Guardar cifrada
            </Button>
          </div>
        </form>
      ) : null}

      {error ? <div className="mb-3"><ErrorState message={error} /></div> : null}

      {credentials.length === 0 ? (
        <EmptyState icon="🔐" title="Sin credenciales" detail="Agregá tokens de canales (WhatsApp, Instagram, Sheets) acá." />
      ) : (
        <ul className="divide-y">
          {credentials.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{KINDS.find((k) => k.value === c.kind)?.label ?? c.kind}</Badge>
                <span className="text-sm font-medium">{c.label}</span>
                <span className="text-xs text-muted-foreground">{fmtDate(c.createdAt)}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => remove(c.id, c.label)}
                disabled={deleting === c.id}
              >
                {deleting === c.id ? <Spinner /> : "Borrar"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
