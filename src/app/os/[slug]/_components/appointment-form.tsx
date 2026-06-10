"use client";

import { useEffect, useState } from "react";
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
import { argDateStr } from "../_lib/dates";
import { CustomFieldsInputs, type CustomValues } from "./custom-fields";

type SlotOption = { time: string; minutes: number };
type ContactOption = { id: string; name: string; phone: string | null };

export function AppointmentForm({
  slug,
  contacts,
  customDefs,
}: {
  slug: string;
  contacts: ContactOption[];
  customDefs: CustomFieldDef[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState<string>("");
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState("");

  const [contactMode, setContactMode] = useState<"none" | "existing" | "new">(
    contacts.length > 0 ? "existing" : "new"
  );
  const [contactId, setContactId] = useState("");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const [notes, setNotes] = useState("");
  const [custom, setCustom] = useState<CustomValues>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const today = argDateStr();

  useEffect(() => {
    if (!date) {
      setSlots([]);
      setTime("");
      return;
    }
    let alive = true;
    setLoadingSlots(true);
    setSlotsError("");
    setTime("");
    fetch(`/api/os/${slug}/slots?date=${date}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("No se pudieron cargar los horarios");
        const data = await res.json();
        if (alive) setSlots(data.slots ?? []);
      })
      .catch((e) => {
        if (alive) {
          setSlots([]);
          setSlotsError(e instanceof Error ? e.message : "Error al cargar horarios");
        }
      })
      .finally(() => {
        if (alive) setLoadingSlots(false);
      });
    return () => {
      alive = false;
    };
  }, [date, slug]);

  const selectedSlot = slots.find((s) => s.time === time);
  const effectiveDuration = duration || (selectedSlot ? String(selectedSlot.minutes) : "");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) return setError("El título es obligatorio");
    if (!date) return setError("Elegí una fecha");
    if (!time) return setError("Elegí un horario libre");
    if (contactMode === "existing" && !contactId) return setError("Elegí un contacto");
    if (contactMode === "new" && !newName.trim())
      return setError("Poné el nombre del contacto nuevo");

    setSaving(true);
    try {
      const res = await fetch(`/api/os/${slug}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          date,
          time,
          durationMinutes: effectiveDuration ? Number(effectiveDuration) : undefined,
          contactId: contactMode === "existing" ? contactId : undefined,
          newContact:
            contactMode === "new"
              ? { name: newName.trim(), phone: newPhone.trim() || undefined }
              : undefined,
          notes: notes.trim() || undefined,
          custom,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo crear el turno");
      router.push(`/os/${slug}/turnos`);
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

        <Field label="Título / tipo de servicio *">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Service común, consulta, corte…"
            required
            autoFocus
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Fecha *">
            <Input
              type="date"
              value={date}
              min={today}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </Field>
          <Field
            label="Hora *"
            help={
              !date
                ? "Primero elegí la fecha"
                : loadingSlots
                  ? "Buscando huecos libres…"
                  : slots.length === 0
                    ? "No hay horarios libres ese día"
                    : `${slots.length} huecos libres`
            }
          >
            <Select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              disabled={!date || loadingSlots || slots.length === 0}
              required
            >
              <option value="">{loadingSlots ? "Cargando…" : "Elegí…"}</option>
              {slots.map((s) => (
                <option key={s.time} value={s.time}>
                  {s.time}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Duración (min)">
            <Input
              type="number"
              min={5}
              step={5}
              value={effectiveDuration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="60"
            />
          </Field>
        </div>
        {slotsError ? <ErrorState message={slotsError} /> : null}

        <Field label="Contacto">
          <div className="space-y-2">
            <Select
              value={contactMode}
              onChange={(e) => setContactMode(e.target.value as typeof contactMode)}
            >
              <option value="none">Sin contacto</option>
              {contacts.length > 0 ? (
                <option value="existing">Contacto existente</option>
              ) : null}
              <option value="new">Crear contacto rápido</option>
            </Select>
            {contactMode === "existing" ? (
              <Select value={contactId} onChange={(e) => setContactId(e.target.value)}>
                <option value="">Elegí un contacto…</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.phone ? ` — ${c.phone}` : ""}
                  </option>
                ))}
              </Select>
            ) : null}
            {contactMode === "new" ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nombre *"
                />
                <Input
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Teléfono"
                  inputMode="tel"
                />
              </div>
            ) : null}
          </div>
        </Field>

        <CustomFieldsInputs defs={customDefs} values={custom} onChange={setCustom} />

        <Field label="Notas">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Detalles del turno…"
          />
        </Field>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="submit" disabled={saving}>
            {saving ? <Spinner /> : null}
            {saving ? "Creando…" : "Crear turno"}
          </Button>
          <ButtonLink href={`/os/${slug}/turnos`} variant="ghost">
            Cancelar
          </ButtonLink>
        </div>
      </form>
    </Card>
  );
}
