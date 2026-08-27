/**
 * Detección y parseo de los archivos que entran al Stock de Código Auto.
 * Un solo "recibidor": se fija qué trae el archivo y decide qué hacer.
 *   - PEDIDO  → suma cantidades al stock y crea los códigos que falten.
 *   - PRECIOS → actualiza precios en masa (seguros / público / sin M.O.).
 */
import { parsearPedidoMalatesta, type FilaPedido } from "./malatesta";

export type TipoArchivo = "pedido" | "precios" | "desconocido";

export type FilaPrecio = {
  codigo: string;
  descripcion?: string;
  precio?: number | null;
  precioSeguro?: number | null;
  precioSinMO?: number | null;
};

/** "$ 1.234.567,89" → 1234568 (pesos enteros, como guarda el sistema). */
export function aNumero(bruto: string): number | null {
  const limpio = bruto.replace(/[^\d.,-]/g, "").trim();
  if (!limpio) return null;
  // es-AR: el punto separa miles y la coma decimales.
  const normal = limpio.replace(/\./g, "").replace(",", ".");
  const n = Number(normal);
  return Number.isFinite(n) ? Math.round(n) : null;
}

/** Reconoce qué columna es cada una por el encabezado. */
function mapearColumnas(encabezado: string[]): Record<string, number> {
  const idx: Record<string, number> = {};
  encabezado.forEach((celda, i) => {
    const c = celda.toLowerCase().trim();
    if (!c) return;
    if (/(c[oó]d|sku|art[ií]culo)/.test(c) && idx.codigo === undefined) idx.codigo = i;
    else if (/(descrip|detalle|producto|nombre)/.test(c) && idx.descripcion === undefined) idx.descripcion = i;
    else if (/seguro/.test(c)) idx.precioSeguro = i;
    else if (/(s\/?\s*m\.?\s*o|sin\s*mano)/.test(c)) idx.precioSinMO = i;
    else if (/(p[uú]blico|venta|lista|precio)/.test(c) && idx.precio === undefined) idx.precio = i;
    else if (/(cant|stock|unidades)/.test(c) && idx.cant === undefined) idx.cant = i;
  });
  return idx;
}

/** Parte una línea de texto o CSV en celdas. */
function celdas(linea: string): string[] {
  if (linea.includes(";")) return linea.split(";");
  if (linea.includes("\t")) return linea.split("\t");
  if ((linea.match(/,/g) ?? []).length >= 2) return linea.split(",");
  return linea.split(/\s{2,}/);
}

/**
 * Lista de precios: CSV/planilla exportada o PDF con columnas. Necesita
 * código + al menos un precio; los encabezados se detectan solos y, si no
 * hay, cae al formato "código … precio".
 */
export function parsearListaPrecios(texto: string): FilaPrecio[] {
  const lineas = texto.split("\n").map((l) => l.trim()).filter(Boolean);
  const filas: FilaPrecio[] = [];

  const iEnc = lineas.findIndex((l) => /(c[oó]d|sku)/i.test(l) && /(precio|seguro|venta|lista)/i.test(l));
  const cols = iEnc >= 0 ? mapearColumnas(celdas(lineas[iEnc])) : {};

  for (let i = iEnc >= 0 ? iEnc + 1 : 0; i < lineas.length; i++) {
    const linea = lineas[i];
    if (/^(total|subtotal|pagina|p[áa]g)/i.test(linea)) continue;

    if (cols.codigo !== undefined) {
      const c = celdas(linea);
      const codigo = (c[cols.codigo] ?? "").trim().toUpperCase();
      if (!/^[A-Z0-9][A-Z0-9.\-/]{3,}$/.test(codigo)) continue;
      const fila: FilaPrecio = { codigo };
      if (cols.descripcion !== undefined) fila.descripcion = (c[cols.descripcion] ?? "").trim();
      if (cols.precio !== undefined) fila.precio = aNumero(c[cols.precio] ?? "");
      if (cols.precioSeguro !== undefined) fila.precioSeguro = aNumero(c[cols.precioSeguro] ?? "");
      if (cols.precioSinMO !== undefined) fila.precioSinMO = aNumero(c[cols.precioSinMO] ?? "");
      if (fila.precio != null || fila.precioSeguro != null || fila.precioSinMO != null) filas.push(fila);
      continue;
    }

    // Sin encabezados: "CODIGO  descripción  $precio [ $precio2 ... ]"
    const m = linea.match(/^([A-Z0-9][A-Z0-9.\-/]{3,})\s+(.*)$/i);
    if (!m) continue;
    const numeros = [...m[2].matchAll(/\$?\s*([\d.]{3,}(?:,\d{1,2})?)/g)].map((x) => aNumero(x[1])).filter((n): n is number => n != null);
    if (!numeros.length) continue;
    const descripcion = m[2].replace(/\$?\s*[\d.]{3,}(?:,\d{1,2})?/g, "").trim();
    filas.push({
      codigo: m[1].toUpperCase(),
      descripcion: descripcion || undefined,
      // Con 3 números asumimos el orden de las columnas del sistema.
      precioSeguro: numeros.length >= 3 ? numeros[0] : null,
      precio: numeros.length >= 3 ? numeros[1] : numeros[0],
      precioSinMO: numeros.length >= 3 ? numeros[2] : numeros[1] ?? null,
    });
  }

  return filas;
}

/**
 * ¿Qué me mandaron? Un pedido trae cantidades y códigos sin precios; una
 * lista de precios trae códigos con importes.
 */
export function detectarTipo(texto: string): { tipo: TipoArchivo; pedido: FilaPedido[]; precios: FilaPrecio[] } {
  const pedido = parsearPedidoMalatesta(texto);
  const precios = parsearListaPrecios(texto);

  const pistaPrecios = /(precio|lista|seguro|s\/\s*m\.?o)/i.test(texto.slice(0, 4000));
  const pistaPedido = /(cant\.?\s+codigo|pedido)/i.test(texto.slice(0, 4000));

  if (pedido.length && (!precios.length || (pistaPedido && !pistaPrecios))) return { tipo: "pedido", pedido, precios };
  if (precios.length >= Math.max(3, pedido.length)) return { tipo: "precios", pedido, precios };
  if (pedido.length) return { tipo: "pedido", pedido, precios };
  return { tipo: "desconocido", pedido, precios };
}
