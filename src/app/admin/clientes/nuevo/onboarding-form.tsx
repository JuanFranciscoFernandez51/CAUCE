"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
} from "@/components/ui";
import { PACK_LABELS } from "../../_components/format";
import { OS_MODULES, MODULE_LABELS, type OsModule } from "@/lib/tenant";
import { defaultModulesForRubro } from "@/lib/onboarding";

type Pack = "STARTER" | "PRO" | "SCALE" | "CUSTOM";

type Result = {
  ok: true;
  slug: string;
  username: string;
  password: string;
  clientId: string;
  modules: string[];
  brandNote: string | null;
  procesos: number;
  warnings: string[];
};

const PROGRESO = [
  "Creando el cliente…",
  "Extrayendo la marca…",
  "Armando el blueprint…",
  "Activando módulos y automatizaciones…",
  "¡Listo!",
];

export function OnboardingForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [rubro, setRubro] = useState("");
  const [web, setWeb] = useState("");
  const [instagram, setInstagram] = useState("");
  const [pack, setPack] = useState<Pack>("SCALE");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  // Módulos: se pre-marcan por rubro salvo que el usuario ya haya tocado a mano.
  const [modulesTouched, setModulesTouched] = useState(false);
  const [modules, setModules] = useState<OsModule[]>(defaultModulesForRubro(""));

  const suggested = useMemo(() => defaultModulesForRubro(rubro), [rubro]);
  const activeModules = modulesTouched ? modules : suggested;

  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  function toggleModule(m: OsModule) {
    setModulesTouched(true);
    const baseList = modulesTouched ? modules : suggested;
    if (m === "sitio") return; // sitio siempre va
    const next = baseList.includes(m)
      ? baseList.filter((x) => x !== m)
      : [...baseList, m];
    setModules(next);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setStep(0);

    // Animación de progreso optimista (el server hace todo en una sola llamada).
    const timers = [
      setTimeout(() => setStep(1), 500),
      setTimeout(() => setStep(2), 1400),
      setTimeout(() => setStep(3), 2400),
    ];

    try {
      const res = await fetch("/api/admin/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          rubro: rubro || "",
          web: web || "",
          instagram: instagram || "",
          pack,
          contactName: contactName || "",
          email: email || "",
          whatsapp: whatsapp || "",
          modules: activeModules,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "No se pudo crear el cliente");
      timers.forEach(clearTimeout);
      setStep(4);
      setResult(data as Result);
      router.refresh();
    } catch (err) {
      timers.forEach(clearTimeout);
      setError(err instanceof Error ? err.message : "No se pudo crear el cliente");
      setSaving(false);
    }
  }

  // ── Pantalla de éxito: accesos + links ──
  if (result) {
    return (
      <Card className="p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold">🎉 ¡{name} ya está en Cauce!</h2>
          <p className="text-sm text-muted-foreground">
            Cliente creado, módulos activos y procesos corriendo.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Acceso label="Slug" value={result.slug} />
          <Acceso label="Usuario" value={result.username} />
          <Acceso label="Contraseña" value={result.password} />
        </div>

        {result.brandNote ? (
          <p className="text-sm text-success">{result.brandNote}</p>
        ) : null}

        {result.procesos > 0 ? (
          <p className="text-sm text-success">
            ⚡ {result.procesos} proceso{result.procesos === 1 ? "" : "s"} corriendo desde el día uno.
          </p>
        ) : null}

        {result.warnings.length > 0 ? (
          <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning space-y-1">
            <p className="font-medium">Se creó igual, con avisos:</p>
            <ul className="list-disc pl-5">
              {result.warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <ButtonLink href={`/sitio/${result.slug}`} target="_blank" variant="secondary">
            🌐 Su web
          </ButtonLink>
          <ButtonLink href={`/os/${result.slug}`} target="_blank" variant="secondary">
            🖥️ Su Cauce OS
          </ButtonLink>
          <ButtonLink href={`/admin/clientes/${result.clientId}/presentacion`} variant="secondary">
            📑 Presentación
          </ButtonLink>
          <ButtonLink href={`/admin/clientes/${result.clientId}`}>
            Ir a la ficha →
          </ButtonLink>
        </div>

        <div>
          <Link href="/admin/clientes/nuevo" className="text-sm text-primary hover:underline">
            + Crear otro cliente
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <form onSubmit={submit} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre del negocio">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Vespa Bahía"
              required
              autoFocus
            />
          </Field>
          <Field label="Rubro" help="Define los módulos sugeridos y el glosario.">
            <Input
              value={rubro}
              onChange={(e) => setRubro(e.target.value)}
              placeholder="taller de motos"
            />
          </Field>
          <Field label="Web (opcional)" help="Para extraer marca y colores.">
            <Input value={web} onChange={(e) => setWeb(e.target.value)} placeholder="vespabahia.com" />
          </Field>
          <Field label="Instagram (opcional)">
            <Input
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="@vespabahia"
            />
          </Field>
          <Field label="Pack">
            <Select value={pack} onChange={(e) => setPack(e.target.value as Pack)}>
              {(["STARTER", "PRO", "SCALE", "CUSTOM"] as Pack[]).map((k) => (
                <option key={k} value={k}>
                  {PACK_LABELS[k]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Contacto">
            <Input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Nombre y apellido"
            />
          </Field>
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="WhatsApp">
            <Input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+54911..."
            />
          </Field>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">
            Módulos del Cauce OS{" "}
            <span className="font-normal text-muted-foreground">
              (pre-marcados según el rubro · &ldquo;Sitio web&rdquo; siempre va)
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {OS_MODULES.map((m) => {
              const on = activeModules.includes(m);
              const locked = m === "sitio";
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleModule(m)}
                  disabled={locked}
                  className={[
                    "rounded-full border px-3 py-1.5 text-sm transition-colors",
                    on
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-input bg-card text-muted-foreground hover:bg-muted",
                    locked ? "cursor-default opacity-90" : "",
                  ].join(" ")}
                >
                  {on ? "✓ " : ""}
                  {MODULE_LABELS[m]}
                </button>
              );
            })}
          </div>
        </div>

        {saving ? (
          <div className="flex items-center gap-3 rounded-md border bg-muted/40 p-3 text-sm">
            <Spinner />
            <span>{PROGRESO[step]}</span>
          </div>
        ) : null}

        {error ? <ErrorState message={error} /> : null}

        <div className="flex items-center gap-3">
          <Button type="submit" size="lg" disabled={saving || !name.trim()}>
            {saving ? <Spinner /> : null}
            {saving ? "Creando…" : "🚀 Crear cliente completo"}
          </Button>
          <Link href="/admin/clientes" className="text-sm text-muted-foreground hover:underline">
            Cancelar
          </Link>
        </div>
      </form>
    </Card>
  );
}

function Acceso({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="select-all font-mono text-sm font-medium">{value}</p>
    </div>
  );
}
