import { GaleriaAnimaciones } from "./galeria";

export const metadata = { title: "Biblioteca de animaciones" };

/**
 * BIBLIOTECA DE ANIMACIONES — componentes con movimiento listos para copiar
 * a cualquier proyecto, con vista previa viva para mostrarle al cliente.
 * Los nuevos se cargan en src/components/animaciones/ + su entrada en registro.tsx.
 */
export default function AnimacionesPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Animaciones</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Biblioteca interna: probá la vista previa, copiá el uso y pegalo en el proyecto.
          La versión pública para clientes está en{" "}
          <a href="/animaciones" target="_blank" className="underline underline-offset-2">
            cauceapp.com.ar/animaciones
          </a>
          .
        </p>
      </div>
      <GaleriaAnimaciones />
    </div>
  );
}
