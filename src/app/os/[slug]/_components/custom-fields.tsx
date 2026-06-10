"use client";

import { Field, Input, Select } from "@/components/ui";
import type { CustomFieldDef } from "@/lib/tenant";

export type CustomValues = Record<string, string>;

/**
 * Render dinámico de los campos custom del tenant.
 * text → Input · number → Input number · date → Input date · select → Select.
 * Los valores viven como strings en el estado del form; se guardan tal cual en custom:Json.
 */
export function CustomFieldsInputs({
  defs,
  values,
  onChange,
}: {
  defs: CustomFieldDef[];
  values: CustomValues;
  onChange: (next: CustomValues) => void;
}) {
  if (defs.length === 0) return null;

  const set = (key: string, value: string) => onChange({ ...values, [key]: value });

  return (
    <>
      {defs.map((def) => (
        <Field key={def.key} label={def.label}>
          {def.type === "select" ? (
            <Select value={values[def.key] ?? ""} onChange={(e) => set(def.key, e.target.value)}>
              <option value="">Elegí…</option>
              {(def.options ?? []).map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Select>
          ) : (
            <Input
              type={def.type === "number" ? "number" : def.type === "date" ? "date" : "text"}
              value={values[def.key] ?? ""}
              onChange={(e) => set(def.key, e.target.value)}
            />
          )}
        </Field>
      ))}
    </>
  );
}

/** Normaliza custom:Json de la DB a Record<string,string> para los inputs. */
export function customToValues(custom: unknown): CustomValues {
  if (!custom || typeof custom !== "object" || Array.isArray(custom)) return {};
  const out: CustomValues = {};
  for (const [k, v] of Object.entries(custom as Record<string, unknown>)) {
    if (v === null || v === undefined) continue;
    out[k] = String(v);
  }
  return out;
}
