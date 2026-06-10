"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ApptStatus } from "@prisma/client";
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Field,
  Input,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";
import type { CustomFieldDef } from "@/lib/tenant";
import { APPT_STATUS, CRM_STAGES, STAGE_LABELS } from "../_lib/labels";
import { ART_TZ, relativeTime } from "../_lib/dates";
import { CustomFieldsInputs, customToValues, type CustomValues } from "./custom-fields";

export type DetailContact = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  stage: string;
  source: string | null;
  notes: string | null;
  custom: Record<string, unknown>;
  lastTouchAt: string | null;
  createdAt: string;
  tasks: { id: string; title: string; dueAt: string | null; done: boolean }[];
  appointments: { id: string; title: string; startsAt: string; status: ApptStatus }[];
};

export function ContactDetail({
  slug,
  contact,
  customDefs,
}: {
  slug: string;
  contact: DetailContact;
  customDefs: CustomFieldDef[];
}) {
  const router = useRouter();
  const api = `/api/os/${slug}/contacts/${contact.id}`;

  // ── Edición de datos ──
  const [name, setName] = useState(contact.name);
  const [phone, setPhone] = useState(contact.phone ?? "");
  const [email, setEmail] = useState(contact.email ?? "");
  const [stage, setStage] = useState(contact.stage);
  const [notes, setNotes] = useState(contact.notes ?? "");
  const [custom, setCustom] = useState<CustomValues>(customToValues(contact.custom));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // ── Tareas ──
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [taskBusy, setTaskBusy] = useState(false);
  const [taskError, setTaskError] = useState("");

  // ── Eliminar ──
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function saveContact(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch(api, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          email: email.trim() || null,
          stage,
          notes: notes.trim() || null,
          custom,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "No se pudo guardar");
      }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setTaskBusy(true);
    setTaskError("");
    try {
      const res = await fetch(`/api/os/${slug}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: contact.id,
          title: taskTitle.trim(),
          dueAt: taskDue || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "No se pudo crear la tarea");
      }
      setTaskTitle("");
      setTaskDue("");
      router.refresh();
    } catch (err) {
      setTaskError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setTaskBusy(false);
    }
  }

  async function toggleTask(taskId: string, done: boolean) {
    setTaskError("");
    const res = await fetch(`/api/os/${slug}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done }),
    });
    if (res.ok) router.refresh();
    else setTaskError("No se pudo actualizar la tarea");
  }

  async function deleteTask(taskId: string) {
    setTaskError("");
    const res = await fetch(`/api/os/${slug}/tasks/${taskId}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else setTaskError("No se pudo borrar la tarea");
  }

  async function deleteContact() {
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(api, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "No se pudo eliminar");
      }
      router.push(`/os/${slug}/crm`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/os/${slug}/crm`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Volver al CRM
          </Link>
          <h1 className="truncate text-2xl font-semibold">{contact.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{STAGE_LABELS[contact.stage] ?? contact.stage}</Badge>
            {contact.source === "bot" ? <Badge variant="primary">Vino del bot 🤖</Badge> : null}
            <span>Último contacto: {relativeTime(contact.lastTouchAt)}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ── Datos editables ── */}
        <Card className="p-4 sm:p-5">
          <h2 className="mb-3 font-semibold">Datos del contacto</h2>
          <form onSubmit={saveContact} className="space-y-3">
            {error ? <ErrorState message={error} /> : null}
            <Field label="Nombre *">
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Teléfono">
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
              </Field>
              <Field label="Email">
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
            </div>
            <Field label="Etapa">
              <Select value={stage} onChange={(e) => setStage(e.target.value)}>
                {CRM_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {STAGE_LABELS[s]}
                  </option>
                ))}
                {!CRM_STAGES.includes(stage as (typeof CRM_STAGES)[number]) ? (
                  <option value={stage}>{stage}</option>
                ) : null}
              </Select>
            </Field>
            <CustomFieldsInputs defs={customDefs} values={custom} onChange={setCustom} />
            <Field label="Notas">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? <Spinner /> : null}
                {saving ? "Guardando…" : "Guardar cambios"}
              </Button>
              {saved ? <span className="text-sm font-medium text-success">Guardado ✓</span> : null}
            </div>
          </form>
        </Card>

        <div className="space-y-4">
          {/* ── Tareas ── */}
          <Card className="p-4 sm:p-5">
            <h2 className="mb-3 font-semibold">Tareas</h2>
            {taskError ? (
              <div className="mb-2">
                <ErrorState message={taskError} />
              </div>
            ) : null}
            <form onSubmit={addTask} className="mb-3 flex flex-wrap gap-2">
              <Input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Nueva tarea (ej: llamar el lunes)"
                className="min-w-40 flex-1"
              />
              <Input
                type="date"
                value={taskDue}
                onChange={(e) => setTaskDue(e.target.value)}
                className="w-auto"
                aria-label="Fecha límite"
              />
              <Button type="submit" size="sm" disabled={taskBusy || !taskTitle.trim()} className="h-10">
                {taskBusy ? <Spinner /> : "Agregar"}
              </Button>
            </form>
            {contact.tasks.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">Sin tareas para este contacto.</p>
            ) : (
              <ul className="divide-y">
                {contact.tasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 py-2">
                    <input
                      type="checkbox"
                      checked={t.done}
                      onChange={(e) => toggleTask(t.id, e.target.checked)}
                      className="h-4 w-4 accent-[var(--primary)]"
                      aria-label={`Marcar “${t.title}” como ${t.done ? "pendiente" : "hecha"}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm ${t.done ? "text-muted-foreground line-through" : ""}`}>
                        {t.title}
                      </p>
                      {t.dueAt ? (
                        <p className="text-xs text-muted-foreground">
                          Vence:{" "}
                          {new Date(t.dueAt).toLocaleDateString("es-AR", { timeZone: ART_TZ })}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteTask(t.id)}
                      className="text-xs text-muted-foreground hover:text-destructive"
                      aria-label={`Borrar tarea “${t.title}”`}
                    >
                      Borrar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* ── Historial de turnos ── */}
          <Card className="p-4 sm:p-5">
            <h2 className="mb-3 font-semibold">Historial de turnos</h2>
            {contact.appointments.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">Todavía no tiene turnos.</p>
            ) : (
              <ul className="divide-y">
                {contact.appointments.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      {new Date(a.startsAt).toLocaleDateString("es-AR", { timeZone: ART_TZ })}{" "}
                      {new Date(a.startsAt).toLocaleTimeString("es-AR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                        timeZone: ART_TZ,
                      })}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">{a.title}</span>
                    <Badge variant={APPT_STATUS[a.status].variant}>
                      {APPT_STATUS[a.status].label}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* ── Zona peligrosa ── */}
          <Card className="border-destructive/30 p-4 sm:p-5">
            <h2 className="mb-1 font-semibold text-destructive">Eliminar contacto</h2>
            <p className="mb-3 text-sm text-muted-foreground">
              Se borra el contacto y sus tareas. Los turnos quedan en la agenda sin contacto.
            </p>
            {confirmDelete ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">¿Seguro? Esto no se puede deshacer.</span>
                <Button variant="destructive" size="sm" onClick={deleteContact} disabled={deleting}>
                  {deleting ? <Spinner /> : null}
                  {deleting ? "Eliminando…" : "Sí, eliminar"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}>
                Eliminar contacto
              </Button>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
