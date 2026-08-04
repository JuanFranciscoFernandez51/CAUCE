import { db } from "@/lib/db";

/**
 * Configuración de Cauce. Vive en la tabla Ajuste (una fila por clave) para
 * no tener que migrar el esquema cada vez que sumamos un valor.
 */
export type Ajustes = {
  // Datos de la empresa, los que salen en propuestas y documentos
  razonSocial: string;
  cuit: string;
  email: string;
  whatsapp: string;
  web: string;
  direccion: string;
  // Valores por defecto de los presupuestos
  setupBaseUsd: number;
  mensualBaseUsd: number;
  precioComponenteUsd: number;
  dolarArs: number;
  ivaPct: number;
  validezDias: number;
  // Textos que se repiten en las propuestas
  condiciones: string;
  firma: string;
};

export const AJUSTES_POR_DEFECTO: Ajustes = {
  razonSocial: "Cauce",
  cuit: "",
  email: "hola@cauceapp.com.ar",
  whatsapp: "5492915038204",
  web: "cauceapp.com.ar",
  direccion: "Bahía Blanca, Argentina",
  setupBaseUsd: 300,
  mensualBaseUsd: 40,
  precioComponenteUsd: 40,
  dolarArs: 0,
  ivaPct: 21,
  validezDias: 15,
  condiciones:
    "Los valores son en dólares y se abonan al tipo de cambio del día. El setup se factura al iniciar y el mensual desde el mes de puesta en marcha. Incluye hosting, mantenimiento y soporte directo.",
  firma: "Francisco Fernández · Cauce",
};

export async function getAjustes(): Promise<Ajustes> {
  const filas = await db.ajuste.findMany();
  const guardados = Object.fromEntries(filas.map((f) => [f.clave, f.valor])) as Partial<Ajustes>;
  return { ...AJUSTES_POR_DEFECTO, ...guardados };
}

export async function guardarAjustes(datos: Partial<Ajustes>): Promise<void> {
  await Promise.all(
    Object.entries(datos).map(([clave, valor]) =>
      db.ajuste.upsert({
        where: { clave },
        create: { clave, valor: valor as never },
        update: { valor: valor as never },
      })
    )
  );
}
