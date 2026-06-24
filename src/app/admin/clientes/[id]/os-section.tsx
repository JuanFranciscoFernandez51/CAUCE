"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, ErrorState, Field, Input, Spinner } from "@/components/ui";
import { OS_MODULES } from "../../_components/format";

export type BrandingData = {
  displayName?: string;
  primary?: string;
  accent?: string;
  logo?: string;
};

type BrandProposal = {
  ok: boolean;
  primary?: string | null;
  accent?: string | null;
  logoUrl?: string | null;
  estilo?: string | null;
  nombre?: string | null;
  fuente?: "web" | "instagram";
  notas?: string;
  motivo?: string;
};

export function OsSection({
  clientId,
  slug,
  modules,
  branding,
}: {
  clientId: string;
  slug: string;
  modules: string[];
  branding: BrandingData;
}) {
  const router = useRouter();
  const [mods, setMods] = useState<string[]>(modules);
  const [brand, setBrand] = useState({
    displayName: branding.displayName ?? "",
    primary: branding.primary ?? "#0f766e",
    accent: branding.accent ?? "#f59e0b",
    logo: branding.logo ?? "",
  });
  const [savingMods, setSavingMods] = useState(false);
  const [savingBrand, setSavingBrand] = useState(false);
  const [brandSaved, setBrandSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extractor de marca (web/IG → propuesta de branding, sin aplicar)
  const [extracting, setExtracting] = useState(false);
  const [proposal, setProposal] = useState<BrandProposal | null>(null);
  const [extractMsg, setExtractMsg] = useState<string | null>(null);

  async function extraerMarca() {
    setExtracting(true);
    setError(null);
    setProposal(null);
    setExtractMsg(null);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/extraer-marca`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), // toma web/IG del intake del lead
      });
      const data: BrandProposal = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "No se pudo extraer la marca");
      if (!data.ok) {
        setExtractMsg(data.motivo ?? "No pude deducir la marca desde la web/IG.");
        return;
      }
      setProposal(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo extraer la marca");
    } finally {
      setExtracting(false);
    }
  }

  function aplicarPropuesta() {
    if (!proposal) return;
    setBrand((b) => ({
      displayName: proposal.nombre || b.displayName,
      primary: proposal.primary || b.primary,
      accent: proposal.accent || b.accent,
      logo: proposal.logoUrl || b.logo,
    }));
    setBrandSaved(false);
    setProposal(null);
    setExtractMsg("Propuesta cargada en el formulario. Revisala y tocá «Guardar branding».");
  }

  async function patch(body: unknown) {
    const res = await fetch(`/api/admin/clients/${clientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "No se pudo guardar");
  }

  async function toggleModule(key: string) {
    const next = mods.includes(key) ? mods.filter((m) => m !== key) : [...mods, key];
    const prev = mods;
    setMods(next); // optimista
    setSavingMods(true);
    setError(null);
    try {
      await patch({ modules: next });
      router.refresh();
    } catch (e) {
      setMods(prev);
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setSavingMods(false);
    }
  }

  async function saveBranding(e: React.FormEvent) {
    e.preventDefault();
    setSavingBrand(true);
    setError(null);
    setBrandSaved(false);
    try {
      await patch({
        branding: {
          displayName: brand.displayName || undefined,
          primary: brand.primary,
          accent: brand.accent,
          logo: brand.logo || undefined,
        },
      });
      setBrandSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setSavingBrand(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Cauce OS</h2>
        <a
          href={`/os/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-primary hover:underline"
        >
          Abrir su sistema →
        </a>
      </div>

      <h3 className="mb-2 text-sm font-medium text-muted-foreground">Módulos activos</h3>
      <div className="flex flex-wrap gap-2">
        {OS_MODULES.map((m) => {
          const on = mods.includes(m.key);
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => toggleModule(m.key)}
              disabled={savingMods}
              aria-pressed={on}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                on
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {on ? "✓ " : ""}
              {m.label}
            </button>
          );
        })}
      </div>

      <div className="mb-2 mt-6 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-muted-foreground">Branding</h3>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={extraerMarca}
          disabled={extracting}
          title="Lee la web o el Instagram que cargó en el cuestionario y propone colores, logo y nombre"
        >
          {extracting ? <Spinner /> : null} ✨ Tomar marca de su web/IG
        </Button>
      </div>

      {extractMsg ? (
        <p className="mb-3 rounded-md border bg-muted px-3 py-2 text-xs text-muted-foreground">
          {extractMsg}
        </p>
      ) : null}

      {proposal ? (
        <div className="mb-4 rounded-lg border border-primary/30 bg-primary-soft/40 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-medium">
              Propuesta {proposal.fuente === "instagram" ? "(Instagram)" : "(web)"}
            </p>
            <button
              type="button"
              onClick={() => setProposal(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Descartar
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {proposal.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={proposal.logoUrl}
                alt="Logo detectado"
                className="h-14 w-14 rounded-md border bg-card object-contain"
              />
            ) : null}
            <div className="flex items-center gap-2">
              {proposal.primary ? (
                <div className="text-center">
                  <span
                    className="block h-9 w-9 rounded-md border"
                    style={{ backgroundColor: proposal.primary }}
                  />
                  <span className="mt-1 block font-mono text-[10px] text-muted-foreground">
                    {proposal.primary}
                  </span>
                </div>
              ) : null}
              {proposal.accent ? (
                <div className="text-center">
                  <span
                    className="block h-9 w-9 rounded-md border"
                    style={{ backgroundColor: proposal.accent }}
                  />
                  <span className="mt-1 block font-mono text-[10px] text-muted-foreground">
                    {proposal.accent}
                  </span>
                </div>
              ) : null}
            </div>
            <div className="min-w-[8rem] flex-1 text-sm">
              {proposal.nombre ? (
                <p>
                  <span className="text-muted-foreground">Nombre: </span>
                  <span className="font-medium">{proposal.nombre}</span>
                </p>
              ) : null}
              {proposal.estilo ? (
                <p className="text-muted-foreground">{proposal.estilo}</p>
              ) : null}
            </div>
          </div>
          {proposal.notas ? (
            <p className="mt-3 text-xs text-muted-foreground">{proposal.notas}</p>
          ) : null}
          <div className="mt-3">
            <Button type="button" size="sm" onClick={aplicarPropuesta}>
              Aplicar al branding
            </Button>
          </div>
        </div>
      ) : null}

      <form onSubmit={saveBranding} className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre a mostrar">
          <Input
            value={brand.displayName}
            onChange={(e) => { setBrand((b) => ({ ...b, displayName: e.target.value })); setBrandSaved(false); }}
            placeholder="Como se ve en su sistema"
          />
        </Field>
        <Field label="Logo (URL)">
          <Input
            value={brand.logo}
            onChange={(e) => { setBrand((b) => ({ ...b, logo: e.target.value })); setBrandSaved(false); }}
            placeholder="https://…"
          />
        </Field>
        <Field label="Color primario">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={brand.primary}
              onChange={(e) => { setBrand((b) => ({ ...b, primary: e.target.value })); setBrandSaved(false); }}
              className="h-10 w-14 cursor-pointer rounded-md border bg-card"
              aria-label="Color primario"
            />
            <Input
              value={brand.primary}
              onChange={(e) => { setBrand((b) => ({ ...b, primary: e.target.value })); setBrandSaved(false); }}
              className="font-mono"
            />
          </div>
        </Field>
        <Field label="Color de acento">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={brand.accent}
              onChange={(e) => { setBrand((b) => ({ ...b, accent: e.target.value })); setBrandSaved(false); }}
              className="h-10 w-14 cursor-pointer rounded-md border bg-card"
              aria-label="Color de acento"
            />
            <Input
              value={brand.accent}
              onChange={(e) => { setBrand((b) => ({ ...b, accent: e.target.value })); setBrandSaved(false); }}
              className="font-mono"
            />
          </div>
        </Field>
        <div className="flex items-center gap-3 sm:col-span-2">
          <Button type="submit" size="sm" disabled={savingBrand}>
            {savingBrand ? <Spinner /> : null} Guardar branding
          </Button>
          {brandSaved ? <span className="text-sm text-success">Guardado ✓</span> : null}
        </div>
      </form>
      {error ? <div className="mt-3"><ErrorState message={error} /></div> : null}
    </Card>
  );
}
