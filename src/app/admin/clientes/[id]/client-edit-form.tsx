"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, ErrorState, Field, Input, Select, Spinner, Textarea } from "@/components/ui";
import { CLIENT_STATUS_LABELS, PACK_LABELS } from "../../_components/format";

export type ClientEditData = {
  id: string;
  name: string;
  rubro: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  domain: string | null;
  notes: string | null;
  pack: string;
  status: string;
  mrr: number;
  costEstUsd: number;
  health: number;
};

export function ClientEditForm({ client }: { client: ClientEditData }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: client.name,
    rubro: client.rubro ?? "",
    contactName: client.contactName ?? "",
    email: client.email ?? "",
    phone: client.phone ?? "",
    whatsapp: client.whatsapp ?? "",
    domain: client.domain ?? "",
    notes: client.notes ?? "",
    pack: client.pack,
    status: client.status,
    mrr: String(client.mrr),
    costEstUsd: String(client.costEstUsd),
    health: String(client.health),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          rubro: form.rubro || null,
          contactName: form.contactName || null,
          email: form.email || null,
          phone: form.phone || null,
          whatsapp: form.whatsapp || null,
          domain: form.domain.trim().toLowerCase() || null,
          notes: form.notes || null,
          pack: form.pack,
          status: form.status,
          mrr: Number(form.mrr) || 0,
          costEstUsd: Number(form.costEstUsd) || 0,
          health: Math.max(0, Math.min(100, Number(form.health) || 0)),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo guardar");
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-5">
      <h2 className="mb-4 font-semibold">Datos del cliente</h2>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Nombre">
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
        </Field>
        <Field label="Rubro">
          <Input value={form.rubro} onChange={(e) => set("rubro", e.target.value)} />
        </Field>
        <Field label="Contacto">
          <Input value={form.contactName} onChange={(e) => set("contactName", e.target.value)} />
        </Field>
        <Field label="Email">
          <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="Teléfono">
          <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label="WhatsApp">
          <Input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
        </Field>
        <Field label="Dominio propio (Cauce OS)" help="Ej: turnos.sunegocio.com.ar — apuntalo por CNAME al deploy y su sistema atiende ahí">
          <Input value={form.domain} onChange={(e) => set("domain", e.target.value)} placeholder="sin dominio propio" />
        </Field>
        <Field label="Pack">
          <Select value={form.pack} onChange={(e) => set("pack", e.target.value)}>
            {Object.entries(PACK_LABELS).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Estado">
          <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
            {Object.entries(CLIENT_STATUS_LABELS).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Salud (0-100)">
          <Input type="number" min="0" max="100" value={form.health} onChange={(e) => set("health", e.target.value)} />
        </Field>
        <Field label="MRR (USD/mes)">
          <Input type="number" min="0" step="1" value={form.mrr} onChange={(e) => set("mrr", e.target.value)} />
        </Field>
        <Field label="Costo estimado (USD/mes)">
          <Input type="number" min="0" step="0.01" value={form.costEstUsd} onChange={(e) => set("costEstUsd", e.target.value)} />
        </Field>
        <div className="sm:col-span-2 lg:col-span-3">
          <Field label="Notas internas">
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} />
          </Field>
        </div>
        <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3">
          <Button type="submit" disabled={saving}>
            {saving ? <Spinner /> : null}
            {saving ? "Guardando…" : "Guardar cambios"}
          </Button>
          {saved ? <p className="text-sm font-medium text-success">Guardado ✓</p> : null}
        </div>
        {error ? (
          <div className="sm:col-span-2 lg:col-span-3">
            <ErrorState message={error} />
          </div>
        ) : null}
      </form>
    </Card>
  );
}
