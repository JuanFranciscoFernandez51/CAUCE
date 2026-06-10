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

      <h3 className="mb-2 mt-6 text-sm font-medium text-muted-foreground">Branding</h3>
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
