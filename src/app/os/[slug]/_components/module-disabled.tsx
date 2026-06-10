import { EmptyState } from "@/components/ui";

/** Pantalla estándar cuando el tenant no tiene un módulo activado. */
export function ModuleDisabled({ moduleLabel }: { moduleLabel: string }) {
  return (
    <div className="py-10">
      <EmptyState
        icon="🧩"
        title={`El módulo ${moduleLabel} no está activado`}
        detail="Hablá con Cauce para sumarlo a tu sistema. Se activa por configuración, sin reinstalar nada."
        action={
          <a
            href="https://wa.me/5492914713920?text=Hola%20Cauce%2C%20quiero%20sumar%20un%20m%C3%B3dulo%20a%20mi%20sistema"
            className="text-sm font-medium text-primary underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Hablar con Cauce
          </a>
        }
      />
    </div>
  );
}
