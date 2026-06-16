"use client";

import { useState } from "react";
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
  Spinner,
  Textarea,
} from "@/components/ui";
import { ART_TZ } from "../_lib/dates";
import { RECORD_TYPE_LABELS, type FichaConfig } from "../_lib/ficha";

// ── Tipos serializables que llegan del server ─────────────
export type RecordAttachment = {
  id: string;
  url: string;
  name: string;
  mime: string | null;
};

export type FichaRecord = {
  id: string;
  type: string;
  date: string; // ISO
  title: string | null;
  summary: string | null;
  fields: Record<string, unknown>;
  authorName: string | null;
  attachments: RecordAttachment[];
};

export type EmployeeOption = { id: string; name: string };

// ── Adjunto pendiente (ya subido a Cloudinary, aún sin guardar) ──
type PendingAttachment = {
  url: string;
  publicId: string | null;
  name: string;
  mime: string | null;
  bytes: number | null;
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: ART_TZ,
  });
}

function isImage(mime: string | null, url: string): boolean {
  if (mime) return mime.startsWith("image/");
  return /\.(png|jpe?g|gif|webp|avif|heic)$/i.test(url);
}

export function ContactRecords({
  slug,
  contactId,
  ficha,
  records,
  employees,
  storageOn,
}: {
  slug: string;
  contactId: string;
  ficha: FichaConfig;
  records: FichaRecord[];
  employees: EmployeeOption[];
  storageOn: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">{ficha.sectionTitle}</h2>
        {records.length > 0 && !open ? (
          <Button size="sm" onClick={() => setOpen(true)}>
            {ficha.addLabel}
          </Button>
        ) : null}
      </div>

      {open ? (
        <div className="mb-4">
          <RecordForm
            slug={slug}
            contactId={contactId}
            ficha={ficha}
            employees={employees}
            storageOn={storageOn}
            onCancel={() => setOpen(false)}
            onSaved={() => {
              setOpen(false);
              router.refresh();
            }}
          />
        </div>
      ) : null}

      {records.length === 0 && !open ? (
        <EmptyState
          icon="📋"
          title={`Sin entradas en la ${ficha.sectionTitle.toLowerCase()}`}
          detail={ficha.emptyDetail}
          action={
            <Button size="sm" onClick={() => setOpen(true)}>
              {ficha.addLabel}
            </Button>
          }
        />
      ) : null}

      {records.length > 0 ? (
        <ol className="space-y-3">
          {records.map((r) => (
            <RecordItem key={r.id} slug={slug} ficha={ficha} record={r} />
          ))}
        </ol>
      ) : null}
    </Card>
  );
}

// ── Una entrada de la timeline ────────────────────────────
function RecordItem({
  slug,
  ficha,
  record,
}: {
  slug: string;
  ficha: FichaConfig;
  record: FichaRecord;
}) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const typeLabel =
    ficha.types.find((t) => t.key === record.type)?.label ??
    RECORD_TYPE_LABELS[record.type] ??
    record.type;

  // Campos a mostrar: primero los del rubro (en orden), luego cualquier extra.
  const shownKeys = ficha.fields.map((f) => f.key);
  const orderedFields: { label: string; value: string }[] = [];
  for (const def of ficha.fields) {
    const v = record.fields[def.key];
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      orderedFields.push({ label: def.label, value: String(v) });
    }
  }
  for (const [k, v] of Object.entries(record.fields)) {
    if (shownKeys.includes(k)) continue;
    if (v === undefined || v === null || String(v).trim() === "") continue;
    orderedFields.push({ label: k, value: String(v) });
  }

  async function remove() {
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/records/${record.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "No se pudo borrar");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
      setDeleting(false);
      setConfirm(false);
    }
  }

  return (
    <li className="rounded-lg border p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="primary">{typeLabel}</Badge>
            <span className="text-sm font-medium">{fmtDate(record.date)}</span>
          </div>
          {record.title ? (
            <p className="mt-1 font-medium">{record.title}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {record.authorName ? (
            <span className="text-xs text-muted-foreground">
              {record.authorName}
            </span>
          ) : null}
          {confirm ? (
            <span className="flex items-center gap-1">
              <Button
                variant="destructive"
                size="sm"
                onClick={remove}
                disabled={deleting}
              >
                {deleting ? <Spinner /> : "Borrar"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirm(false)}
                disabled={deleting}
              >
                Cancelar
              </Button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirm(true)}
              className="text-xs text-muted-foreground hover:text-destructive"
              aria-label="Borrar entrada"
            >
              Borrar
            </button>
          )}
        </div>
      </div>

      {error ? (
        <div className="mt-2">
          <ErrorState message={error} />
        </div>
      ) : null}

      {record.summary ? (
        <p className="mt-2 whitespace-pre-wrap text-sm">{record.summary}</p>
      ) : null}

      {orderedFields.length > 0 ? (
        <dl className="mt-2 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
          {orderedFields.map((f) => (
            <div key={f.label} className="min-w-0">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {f.label}
              </dt>
              <dd className="whitespace-pre-wrap">{f.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {record.attachments.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {record.attachments.map((a) =>
            isImage(a.mime, a.url) ? (
              <a
                key={a.id}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                title={a.name}
                className="block overflow-hidden rounded-md border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.url}
                  alt={a.name}
                  className="h-20 w-20 object-cover"
                  loading="lazy"
                />
              </a>
            ) : (
              <a
                key={a.id}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex max-w-full items-center gap-2 rounded-md border bg-muted px-3 py-2 text-sm hover:bg-card"
              >
                <span aria-hidden>📄</span>
                <span className="truncate">{a.name}</span>
              </a>
            )
          )}
        </div>
      ) : null}
    </li>
  );
}

// ── Form para cargar una entrada ──────────────────────────
function RecordForm({
  slug,
  contactId,
  ficha,
  employees,
  storageOn,
  onCancel,
  onSaved,
}: {
  slug: string;
  contactId: string;
  ficha: FichaConfig;
  employees: EmployeeOption[];
  storageOn: boolean;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: ART_TZ });

  const [type, setType] = useState(ficha.types[0]?.key ?? "nota");
  const [date, setDate] = useState(today);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [authorId, setAuthorId] = useState("");

  const [pending, setPending] = useState<PendingAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setField = (k: string, v: string) =>
    setFields((prev) => ({ ...prev, [k]: v }));

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("contactId", contactId);
        fd.append("file", file);
        const res = await fetch(`/api/os/${slug}/records/upload`, {
          method: "POST",
          body: fd,
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error ?? "No se pudo subir el archivo");
        setPending((prev) => [...prev, data.attachment as PendingAttachment]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setUploading(false);
    }
  }

  function removePending(idx: number) {
    setPending((prev) => prev.filter((_, i) => i !== idx));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const cleanFields: Record<string, string> = {};
      for (const [k, v] of Object.entries(fields)) {
        if (v.trim() !== "") cleanFields[k] = v.trim();
      }
      const res = await fetch(`/api/os/${slug}/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId,
          type,
          date: date || undefined,
          title: title.trim() || null,
          summary: summary.trim() || null,
          fields: cleanFields,
          authorId: authorId || null,
          attachments: pending,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "No se pudo guardar la entrada");
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-lg border bg-muted/40 p-3 sm:p-4"
    >
      <p className="text-sm font-medium">Nueva {ficha.entryNoun}</p>
      {error ? <ErrorState message={error} /> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tipo">
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            {ficha.types.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Fecha">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>

      <Field label="Título">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Opcional"
        />
      </Field>

      {ficha.fields.map((f) => (
        <Field key={f.key} label={f.label}>
          {f.long ? (
            <Textarea
              value={fields[f.key] ?? ""}
              onChange={(e) => setField(f.key, e.target.value)}
            />
          ) : (
            <Input
              value={fields[f.key] ?? ""}
              onChange={(e) => setField(f.key, e.target.value)}
            />
          )}
        </Field>
      ))}

      <Field label="Resumen / observaciones">
        <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} />
      </Field>

      {employees.length > 0 ? (
        <Field label="Profesional">
          <Select value={authorId} onChange={(e) => setAuthorId(e.target.value)}>
            <option value="">Sin asignar</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}

      {/* ── Adjuntos ── */}
      {storageOn ? (
        <Field label="Adjuntos" help="Fotos, radiografías, PDFs, recetas… (máx 15 MB c/u)">
          <input
            type="file"
            multiple
            onChange={(e) => {
              onFiles(e.target.files);
              e.target.value = "";
            }}
            disabled={uploading}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:bg-card file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-muted"
          />
        </Field>
      ) : (
        <p className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
          Subí la credencial de Cloudinary para adjuntar archivos.
        </p>
      )}

      {uploading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner /> Subiendo…
        </p>
      ) : null}

      {pending.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {pending.map((a, i) => (
            <li
              key={`${a.url}-${i}`}
              className="inline-flex items-center gap-2 rounded-md border bg-card px-2 py-1 text-xs"
            >
              <span className="max-w-40 truncate">{a.name}</span>
              <button
                type="button"
                onClick={() => removePending(i)}
                className="text-muted-foreground hover:text-destructive"
                aria-label={`Quitar ${a.name}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={saving || uploading}>
          {saving ? <Spinner /> : null}
          {saving ? "Guardando…" : "Guardar entrada"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
