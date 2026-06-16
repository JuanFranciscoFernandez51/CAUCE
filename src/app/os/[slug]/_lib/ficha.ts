/**
 * Configuración de la FICHA / HISTORIA del contacto por rubro.
 *
 * La ficha es una timeline de ContactRecords: cada consulta/servicio/reparación
 * suma una entrada con campos propios del rubro y adjuntos. Una sola codebase:
 * el rubro (Client.rubro → playbook.key) decide cómo se llama la ficha, qué tipos
 * de entrada hay y qué campos se cargan. Sin forks, todo por configuración.
 *
 * Los tipos válidos del modelo son consulta|servicio|reparacion|visita|nota
 * (ContactRecord.type). Acá elegimos cuáles ofrecer por rubro y cómo etiquetarlos.
 */

import { resolvePlaybook } from "@/lib/playbooks";

/** Un tipo de entrada ofrecido por el rubro. `key` ∈ los valores del modelo. */
export type RecordTypeDef = { key: string; label: string };

/** Un campo de ficha del rubro (se guarda en ContactRecord.fields:Json). */
export type FichaFieldDef = {
  key: string;
  label: string;
  /** textarea para textos largos (diagnóstico, trabajo realizado…). */
  long?: boolean;
};

export type FichaConfig = {
  /** Clave del rubro resuelto (clinica | taller | peluqueria | generico). */
  key: string;
  /** Título de la sección: "Historia clínica", "Historial del vehículo", etc. */
  sectionTitle: string;
  /** Texto del botón para sumar una entrada: "+ Consulta", "+ Service"… */
  addLabel: string;
  /** Singular de "entrada" para textos varios: "consulta", "service", "entrada". */
  entryNoun: string;
  /** Tipos de entrada ofrecidos (el primero es el default del form). */
  types: RecordTypeDef[];
  /** Campos del rubro que se cargan en cada entrada. */
  fields: FichaFieldDef[];
  /** Empty state: detalle que invita a cargar la primera entrada. */
  emptyDetail: string;
};

const CLINICA: FichaConfig = {
  key: "clinica",
  sectionTitle: "Historia clínica",
  addLabel: "+ Consulta",
  entryNoun: "consulta",
  types: [
    { key: "consulta", label: "Consulta" },
    { key: "servicio", label: "Tratamiento" },
    { key: "visita", label: "Control" },
    { key: "nota", label: "Nota" },
  ],
  fields: [
    { key: "motivo", label: "Motivo de consulta", long: true },
    { key: "diagnostico", label: "Diagnóstico", long: true },
    { key: "tratamiento", label: "Tratamiento realizado", long: true },
    { key: "indicaciones", label: "Indicaciones", long: true },
  ],
  emptyDetail:
    "Cargá la primera consulta para empezar la historia clínica: motivo, diagnóstico, tratamiento y adjuntos (radiografías, recetas).",
};

const TALLER: FichaConfig = {
  key: "taller",
  sectionTitle: "Historial del vehículo",
  addLabel: "+ Entrada",
  entryNoun: "entrada",
  types: [
    { key: "servicio", label: "Service" },
    { key: "reparacion", label: "Reparación" },
    { key: "consulta", label: "Diagnóstico" },
    { key: "nota", label: "Nota" },
  ],
  fields: [
    { key: "vehiculo", label: "Vehículo / patente" },
    { key: "kilometraje", label: "Kilometraje" },
    { key: "trabajo", label: "Trabajo realizado", long: true },
    { key: "repuestos", label: "Repuestos usados", long: true },
  ],
  emptyDetail:
    "Cargá el primer service o reparación para empezar el historial del vehículo: trabajo realizado, repuestos y fotos.",
};

const PELUQUERIA: FichaConfig = {
  key: "peluqueria",
  sectionTitle: "Historial de servicios",
  addLabel: "+ Servicio",
  entryNoun: "servicio",
  types: [
    { key: "servicio", label: "Servicio" },
    { key: "consulta", label: "Consulta" },
    { key: "nota", label: "Nota" },
  ],
  fields: [
    { key: "servicio", label: "Servicio realizado" },
    { key: "formula", label: "Fórmula / color" },
    { key: "productos", label: "Productos usados", long: true },
    { key: "observaciones", label: "Observaciones", long: true },
  ],
  emptyDetail:
    "Cargá el primer servicio para empezar el historial: qué se hizo, fórmula/color, productos y fotos del antes/después.",
};

const GENERICO: FichaConfig = {
  key: "generico",
  sectionTitle: "Historia",
  addLabel: "+ Entrada",
  entryNoun: "entrada",
  types: [
    { key: "consulta", label: "Consulta" },
    { key: "servicio", label: "Servicio" },
    { key: "visita", label: "Visita" },
    { key: "nota", label: "Nota" },
  ],
  fields: [
    { key: "detalle", label: "Detalle", long: true },
    { key: "observaciones", label: "Observaciones", long: true },
  ],
  emptyDetail:
    "Cargá la primera entrada para empezar la historia de este contacto: detalle de lo que pasó y adjuntos.",
};

/** Etiquetas de TODOS los tipos del modelo, para mostrar entradas viejas/de otro rubro. */
export const RECORD_TYPE_LABELS: Record<string, string> = {
  consulta: "Consulta",
  servicio: "Servicio",
  reparacion: "Reparación",
  visita: "Visita",
  nota: "Nota",
};

/** Tipos válidos persistibles en ContactRecord.type. */
export const RECORD_TYPES = [
  "consulta",
  "servicio",
  "reparacion",
  "visita",
  "nota",
] as const;

/** Resuelve la config de ficha desde el rubro libre del tenant. */
export function fichaConfig(rubro: string | null | undefined): FichaConfig {
  const pb = resolvePlaybook(rubro);
  switch (pb.key) {
    case "clinica":
      return CLINICA;
    case "taller":
      return TALLER;
    case "peluqueria":
      return PELUQUERIA;
    default:
      return GENERICO;
  }
}
