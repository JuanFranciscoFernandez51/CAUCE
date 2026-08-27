/**
 * Parser de pedidos de MALATESTA (proveedor principal de Código Auto).
 * El PDF lista: Cant. | Código | Descripción | Ubicación. La marca viaja
 * adentro de la descripción y la categoría se deduce del tipo de pieza.
 */

export type FilaPedido = {
  cant: number;
  codigo: string;
  descripcion: string;
  marca: string;
  categoria: string;
};

const MARCAS = [
  "CITROEN", "JEEP", "FIAT", "FORD", "MERCEDES BENZ", "PEUGEOT", "RENAULT",
  "VW", "VOLKSWAGEN", "TOYOTA", "HONDA", "DODGE", "CHEVROLET", "NISSAN",
  "HYUNDAI", "KIA", "SUZUKI", "MITSUBISHI", "ISUZU", "BMW", "AUDI", "RAM",
  "IVECO", "SCANIA", "VOLVO", "AGRALE", "DEUTZ", "JOHN DEERE", "SUBARU", "CHEV.", "CHERY", "JAC", "DFSK",
];

/** Modelos conocidos → marca, para cuando la descripción no dice la marca. */
const MODELOS: [RegExp, string][] = [
  [/PALIO|SIENA|CRONOS|TORO|DUCATO|UNO|STRADA|ARGO|MOBI|FIORINO|LINEA|PUNTO/, "FIAT"],
  [/GOL\b|GOL TREND|AMAROK|FOX|SURAN|TERA|VENTO|POLO|SAVEIRO|T-CROSS|TAOS|NIVUS|BORA/, "VW"],
  [/HILUX|SW4|COROLLA|ETIOS|YARIS/, "TOYOTA"],
  [/RANGER|FIESTA|FOCUS|F-?100|F-?250|ECOSPORT|KA\b|MAVERICK|TERRITORY|KUGA/, "FORD"],
  [/DUSTER|MEGANE|LOGAN|SANDERO|MASTER|CLIO|KANGOO|OROCH|KWID|CAPTUR|ALASKAN/, "RENAULT"],
  [/RENEGADE|COMPASS|CHEROKEE/, "JEEP"],
  [/SPRINTER|ACCELO|ATEGO/, "MERCEDES BENZ"],
  [/\b208\b|\b207\b|\b307\b|\b308\b|PARTNER|BOXER|EXPERT/, "PEUGEOT"],
  [/C3\b|C4\b|BERLINGO|JUMPER|JUMPY|AIRCROSS/, "CITROEN"],
  [/CORSA|ONIX|CRUZE|S10|TRACKER|SPIN|PRISMA|MONTANA|AGILE|CELTA/, "CHEVROLET"],
  [/HR-?V|CR-?V|CIVIC|FIT/, "HONDA"],
  [/RAM 1500|RAM 2500/, "DODGE"],
  [/FRONTIER|SENTRA|KICKS|VERSA|NP300/, "NISSAN"],
  [/VECTRA|ASTRA|MERIVA|ZAFIRA|BLAZER/, "CHEVROLET"],
  [/FORESTER|OUTBACK|IMPREZA|XV\b/, "SUBARU"],
];

function marcaDe(descripcion: string): string {
  const arriba = descripcion.toUpperCase();
  for (const m of MARCAS) {
    if (arriba.includes(m)) return m === "VOLKSWAGEN" ? "VW" : m;
  }
  for (const [re, marca] of MODELOS) {
    if (re.test(arriba)) return marca;
  }
  return "Otros";
}

/** PSAS = parabrisas; P.T/P.D/C.D/C.I/LUN = cristales de puerta y custodios. */
function categoriaDe(descripcion: string): string {
  const d = descripcion.toUpperCase();
  if (/^(E-)?PSAS/.test(d) || d.includes("PARABRISAS")) return "Parabrisas";
  if (/^(P\.?[TD]|C\.?[DI]|LUN|CUST)/.test(d) || d.includes("LUNETA")) return "Cristales";
  if (/LOCTITE|SIKA|PRIMER|SILICONA|ADHESIVO|PEGAMENTO|CARTUCHO|PISTOLA|CUCHILLA|ALAMBRE/.test(d)) return "Insumos";
  return "Repuestos";
}

/**
 * Del texto plano del PDF a filas de stock. Aguanta descripciones partidas en
 * dos renglones (la continuación no arranca con cantidad+código) y saltea
 * encabezados, pie de página y datos del cliente.
 */
export function parsearPedidoMalatesta(texto: string): FilaPedido[] {
  const filas: { cant: number; codigo: string; descripcion: string }[] = [];

  for (const cruda of texto.split("\n")) {
    const linea = cruda.trim();
    if (!linea) continue;
    // Ruido conocido del PDF
    if (/^cant\.?\s+codigo/i.test(linea)) continue;
    if (/^--\s*\d+\s*of\s*\d+\s*--$/i.test(linea)) continue;
    if (/pagina/i.test(linea)) continue;
    if (/^(FECHA|CLIENTE)/i.test(linea)) continue;
    if (/^san nicolas/i.test(linea)) continue;
    if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(linea)) continue;
    if (/^\d{3,}$/.test(linea)) continue; // nro de pedido suelto

    const m = linea.match(/^(\d{1,3})\s+([A-Z0-9]{5,})\s+(.+)$/);
    if (m) {
      filas.push({ cant: parseInt(m[1], 10), codigo: m[2], descripcion: m[3] });
    } else if (filas.length && /^['A-Z0-9]/.test(linea) && !/^[A-ZÑÁÉÍÓÚ ]+$/.test(linea)) {
      // Continuación de la descripción anterior (ej: "'97/'18 -")
      filas[filas.length - 1].descripcion += ` ${linea}`;
    }
  }

  return filas.map((f) => {
    const descripcion = f.descripcion.replace(/\s*-\s*$/, "").replace(/\s+/g, " ").trim();
    return {
      cant: f.cant,
      codigo: f.codigo,
      descripcion,
      marca: marcaDe(descripcion),
      categoria: categoriaDe(descripcion),
    };
  });
}
