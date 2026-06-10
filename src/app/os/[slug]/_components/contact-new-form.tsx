"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  ButtonLink,
  Card,
  ErrorState,
  Field,
  Input,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";
import type { CustomFieldDef } from "@/lib/tenant";
import { CRM_STAGES, STAGE_LABELS } from "../_lib/labels";
import { CustomFieldsInputs, type CustomValues } from "./custom-fields";

export function ContactNewForm({
  slug,
  customDefs,
}: {
  slug: string;
  customDefs: CustomFieldDef[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [stage, setStage] = useState<string>("nuevo");
  const [notes, setNotes] = useState("");
  const [custom, setCustom] = useState<CustomValues>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          stage,
          notes: notes.trim() || undefined,
          custom,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo crear el contacto");
      router.push(`/os/${slug}/crm/${data.contact.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
      setSaving(false);
    }
  }

  return (
    <Card className="p-4 sm:p-6">
      <form onSubmit={onSubmit} className="space-y-4">
        {error ? <ErrorState message={error} /> : null}
        <Field label="Nombre *">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Juan Pérez"
            required
            autoFocus
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Teléfono">
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+54 9 291 …"
              inputMode="tel"
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="juan@mail.com"
            />
          </Field>
        </div>
        <Field label="Etapa">
          <Select value={stage} onChange={(e) => setStage(e.target.value)}>
            {CRM_STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>
        <CustomFieldsInputs defs={customDefs} values={custom} onChange={setCustom} />
        <Field label="Notas">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contexto, qué busca, cómo llegó…"
          />
        </Field>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="submit" disabled={saving}>
            {saving ? <Spinner /> : null}
            {saving ? "Guardando…" : "Crear contacto"}
          </Button>
          <ButtonLink href={`/os/${slug}/crm`} variant="ghost">
            Cancelar
          </ButtonLink>
        </div>
      </form>
    </Card>
  );
}
