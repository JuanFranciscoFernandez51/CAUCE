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
  Spinner,
} from "@/components/ui";

type Cred = { id: string; kind: string; label: string; createdAt: string };

const KIND_ICON: Record<string, string> = {
  whatsapp: "💬",
  instagram: "📸",
};
const KIND_LABEL: Record<string, string> = {
  whatsapp: "WhatsApp Business",
  instagram: "Instagram",
};

export function CanalManager({ credentials }: { credentials: Cred[] }) {
  const router = useRouter();
  const [kind, setKind] = useState<"whatsapp" | "instagram" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // Campos WhatsApp
  const [waToken, setWaToken] = useState("");
  const [waPhoneId, setWaPhoneId] = useState("");
  const [waVerify, setWaVerify] = useState("");
  // Campos Instagram
  const [igToken, setIgToken] = useState("");
  const [igPageId, setIgPageId] = useState("");

  async function onConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!kind) return;
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const body =
        kind === "whatsapp"
          ? { kind, token: waToken.trim(), phoneNumberId: waPhoneId.trim(), verifyToken: waVerify.trim() }
          : { kind, token: igToken.trim(), pageId: igPageId.trim() };
      const res = await fetch("/api/portal/canal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "No pudimos guardar el canal. Probá de nuevo.");
        return;
      }
      setSuccess("Canal conectado. Cauce revisa y activa tu bot en menos de 24h hábiles.");
      setKind(null);
      setWaToken("");
      setWaPhoneId("");
      setWaVerify("");
      setIgToken("");
      setIgPageId("");
      router.refresh();
    } catch {
      setError("Error de conexión. Probá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(id: string) {
    setError(null);
    setSuccess(null);
    setDeleting(id);
    try {
      const res = await fetch(`/api/portal/canal/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "No pudimos eliminar el canal.");
        return;
      }
      setSuccess("Canal eliminado.");
      router.refresh();
    } catch {
      setError("Error de conexión. Probá de nuevo.");
    } finally {
      setDeleting(null);
      setConfirmId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Canales conectados */}
      {credentials.length > 0 ? (
        <Card className="divide-y p-0">
          {credentials.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-3 p-4">
              <span className="text-2xl">{KIND_ICON[c.kind] ?? "🔑"}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{c.label}</p>
                <p className="text-xs text-muted-foreground">
                  {KIND_LABEL[c.kind] ?? c.kind} · conectado el {c.createdAt}
                </p>
              </div>
              <Badge variant="success">Conectado</Badge>
              {confirmId === c.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">¿Seguro?</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={deleting === c.id}
                    onClick={() => onDelete(c.id)}
                  >
                    {deleting === c.id ? <Spinner /> : null} Sí, eliminar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmId(null)}>
                    No
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setConfirmId(c.id)}>
                  Eliminar
                </Button>
              )}
            </div>
          ))}
        </Card>
      ) : (
        <EmptyState
          icon="🔌"
          title="Todavía no conectaste ningún canal"
          detail="Elegí abajo dónde querés que atienda tu bot."
        />
      )}

      {error ? <ErrorState message={error} /> : null}
      {success ? (
        <p className="rounded-md border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          {success}
        </p>
      ) : null}

      {/* Conectar nuevo */}
      <Card className="p-5">
        <h2 className="font-semibold">Conectar un canal</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setKind(kind === "whatsapp" ? null : "whatsapp")}
            className={
              "rounded-lg border p-4 text-left transition-colors hover:bg-muted " +
              (kind === "whatsapp" ? "border-2 border-primary bg-primary-soft" : "")
            }
          >
            <p className="text-2xl">💬</p>
            <p className="mt-1 font-medium">WhatsApp Business</p>
            <p className="text-xs text-muted-foreground">API oficial de Meta</p>
          </button>
          <button
            type="button"
            onClick={() => setKind(kind === "instagram" ? null : "instagram")}
            className={
              "rounded-lg border p-4 text-left transition-colors hover:bg-muted " +
              (kind === "instagram" ? "border-2 border-primary bg-primary-soft" : "")
            }
          >
            <p className="text-2xl">📸</p>
            <p className="mt-1 font-medium">Instagram</p>
            <p className="text-xs text-muted-foreground">Mensajes directos</p>
          </button>
        </div>

        {kind === "whatsapp" ? (
          <form onSubmit={onConnect} className="mt-5 space-y-4">
            <Field label="Token de Meta *" help="Token permanente de tu app de WhatsApp Business.">
              <Input
                value={waToken}
                onChange={(e) => setWaToken(e.target.value)}
                required
                type="password"
                autoComplete="off"
                placeholder="EAAG…"
              />
            </Field>
            <Field label="Phone number ID *" help="El ID del número, no el número de teléfono.">
              <Input
                value={waPhoneId}
                onChange={(e) => setWaPhoneId(e.target.value)}
                required
                autoComplete="off"
                placeholder="1234567890"
              />
            </Field>
            <Field label="Verify token" help="Opcional — si ya configuraste un webhook.">
              <Input
                value={waVerify}
                onChange={(e) => setWaVerify(e.target.value)}
                autoComplete="off"
              />
            </Field>
            <Button type="submit" disabled={loading}>
              {loading ? <Spinner /> : null}
              {loading ? "Conectando…" : "Conectar WhatsApp"}
            </Button>
          </form>
        ) : null}

        {kind === "instagram" ? (
          <form onSubmit={onConnect} className="mt-5 space-y-4">
            <Field label="Token *" help="Token de acceso de tu página conectada a Instagram.">
              <Input
                value={igToken}
                onChange={(e) => setIgToken(e.target.value)}
                required
                type="password"
                autoComplete="off"
                placeholder="EAAG…"
              />
            </Field>
            <Field label="Page ID *">
              <Input
                value={igPageId}
                onChange={(e) => setIgPageId(e.target.value)}
                required
                autoComplete="off"
                placeholder="1234567890"
              />
            </Field>
            <Button type="submit" disabled={loading}>
              {loading ? <Spinner /> : null}
              {loading ? "Conectando…" : "Conectar Instagram"}
            </Button>
          </form>
        ) : null}

        <div className="mt-5 space-y-2 border-t pt-4">
          <p className="text-sm text-muted-foreground">
            🕐 <strong className="text-foreground">Cómo sigue:</strong> Cauce revisa
            y activa tu bot en menos de 24h hábiles. Te avisamos por WhatsApp cuando
            esté funcionando.
          </p>
          <p className="text-xs text-muted-foreground">
            ¿Dónde consigo el token? En{" "}
            <a
              href="https://developers.facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              Meta for Developers
            </a>
            : creá una app, agregá el producto WhatsApp (o Messenger para
            Instagram) y copiá el token y el ID desde la configuración de la API.
            Si te trabás, escribinos y te ayudamos.
          </p>
        </div>
      </Card>

      <p className="text-xs text-muted-foreground">
        🔒 Tus credenciales se guardan cifradas (AES-256) y nunca se vuelven a mostrar.
      </p>
    </div>
  );
}
