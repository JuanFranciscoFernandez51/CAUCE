/** Estados de una orden de trabajo, en criollo y con su color. */
export const OT_ESTADOS: Record<
  string,
  { label: string; variant: "default" | "primary" | "success" | "warning" | "destructive" }
> = {
  INGRESADA: { label: "Ingresada", variant: "default" },
  EN_DIAGNOSTICO: { label: "En diagnóstico", variant: "warning" },
  APROBADA: { label: "Aprobada", variant: "primary" },
  EN_REPARACION: { label: "En reparación", variant: "primary" },
  LISTA: { label: "Lista 🔔", variant: "success" },
  ENTREGADA: { label: "Entregada", variant: "default" },
  CANCELADA: { label: "Cancelada", variant: "destructive" },
};

/** El paso siguiente natural de cada estado (para el botón grande). */
export const OT_SIGUIENTE: Record<string, { estado: string; label: string } | null> = {
  INGRESADA: { estado: "EN_DIAGNOSTICO", label: "Pasar a diagnóstico" },
  EN_DIAGNOSTICO: { estado: "APROBADA", label: "Cliente aprobó" },
  APROBADA: { estado: "EN_REPARACION", label: "Arrancar reparación" },
  EN_REPARACION: { estado: "LISTA", label: "Está lista (avisar)" },
  LISTA: { estado: "ENTREGADA", label: "Entregar" },
  ENTREGADA: null,
  CANCELADA: null,
};
