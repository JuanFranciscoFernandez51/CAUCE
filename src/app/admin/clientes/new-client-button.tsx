"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, ErrorState, Field, Input, Select, Spinner } from "@/components/ui";
import { PACK_LABELS } from "../_components/format";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 30);
}

export function NewClientButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [rubro, setRubro] = useState("");
  const [pack, setPack] = useState("NONE");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug: slug || slugify(name),
          rubro: rubro || null,
          pack,
          contactName: contactName || null,
          email: email || null,
          phone: phone || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo crear el cliente");
      router.push(`/admin/clientes/${data.client.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear el cliente");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen((v) => !v)}>
          {open ? "Cerrar" : "+ Cliente"}
        </Button>
      </div>
      {open ? (
        <Card className="p-4">
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Nombre del negocio">
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slugTouched) setSlug(slugify(e.target.value));
                }}
                placeholder="Vespa Bahía"
                required
              />
            </Field>
            <Field label="Slug" help="Subdominio del Cauce OS: slug.cauce.app">
              <Input
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(slugify(e.target.value));
                }}
                placeholder="vespabahia"
                required
              />
            </Field>
            <Field label="Rubro">
              <Input value={rubro} onChange={(e) => setRubro(e.target.value)} placeholder="taller de motos" />
            </Field>
            <Field label="Pack">
              <Select value={pack} onChange={(e) => setPack(e.target.value)}>
                {Object.entries(PACK_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Contacto">
              <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Nombre y apellido" />
            </Field>
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Teléfono">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
            <div className="flex items-end gap-2 sm:col-span-2">
              <Button type="submit" disabled={saving || !name.trim()}>
                {saving ? <Spinner /> : null}
                {saving ? "Creando…" : "Crear cliente"}
              </Button>
            </div>
            {error ? (
              <div className="sm:col-span-2 lg:col-span-3">
                <ErrorState message={error} />
              </div>
            ) : null}
          </form>
        </Card>
      ) : null}
    </div>
  );
}
