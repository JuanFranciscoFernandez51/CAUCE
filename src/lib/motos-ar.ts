/**
 * Motos que se ven en la calle en Argentina, agrupadas por marca.
 * Sirve para el selector "elegí tu moto" del shop: el cliente no sabe el
 * código del repuesto, sabe qué moto tiene. Los nombres están escritos como
 * los dice la gente, porque así se guardan en Product.compatibilidades.
 */
export type Moto = { marca: string; modelo: string; cc: number; nombre: string };

/**
 * Las motos tal como las cataloga el proveedor (Maxsa). Los nombres tienen que
 * coincidir letra por letra con Product.compatibilidades, porque el filtro de
 * la tienda busca por coincidencia exacta.
 */
export const MOTOS_AR: Moto[] = [
  { marca: "Bajaj", modelo: "Rouser 135", cc: 135, nombre: "Bajaj Rouser 135" },
  { marca: "Bajaj", modelo: "Rouser 200 NS", cc: 200, nombre: "Bajaj Rouser 200 NS" },
  { marca: "Bajaj", modelo: "Rouser 220", cc: 220, nombre: "Bajaj Rouser 220" },
  { marca: "Corven", modelo: "Energy 110", cc: 110, nombre: "Corven Energy 110" },
  { marca: "Gilera", modelo: "FU 110", cc: 110, nombre: "Gilera FU 110" },
  { marca: "Gilera", modelo: "Smash 110", cc: 110, nombre: "Gilera Smash 110" },
  { marca: "Gilera", modelo: "Smash 125", cc: 125, nombre: "Gilera Smash 125" },
  { marca: "Guerrero", modelo: "Magic G70 - G90 - G100", cc: 0, nombre: "Guerrero Magic G70 - G90 - G100" },
  { marca: "Guerrero", modelo: "Trip 110", cc: 110, nombre: "Guerrero Trip 110" },
  { marca: "Honda", modelo: "BIZ 100 - 105", cc: 100, nombre: "Honda BIZ 100 - 105" },
  { marca: "Honda", modelo: "BIZ 125", cc: 125, nombre: "Honda BIZ 125" },
  { marca: "Honda", modelo: "C90 Econo", cc: 0, nombre: "Honda C90 Econo" },
  { marca: "Honda", modelo: "CB1 125", cc: 125, nombre: "Honda CB1 125" },
  { marca: "Honda", modelo: "Cb250 Nighthawk", cc: 0, nombre: "Honda Cb250 Nighthawk" },
  { marca: "Honda", modelo: "CBX 150 - 200", cc: 150, nombre: "Honda CBX 150 - 200" },
  { marca: "Honda", modelo: "CBX 250 Twister", cc: 250, nombre: "Honda CBX 250 Twister" },
  { marca: "Honda", modelo: "Cd100", cc: 0, nombre: "Honda Cd100" },
  { marca: "Honda", modelo: "CG 125 Titan-today", cc: 125, nombre: "Honda CG 125 Titan-today" },
  { marca: "Honda", modelo: "CG 150 Titan", cc: 150, nombre: "Honda CG 150 Titan" },
  { marca: "Honda", modelo: "CG 150 Titan NEW", cc: 150, nombre: "Honda CG 150 Titan NEW" },
  { marca: "Honda", modelo: "DAX", cc: 0, nombre: "Honda DAX" },
  { marca: "Honda", modelo: "Elite 50 - 80 - 125 - 150", cc: 50, nombre: "Honda Elite 50 - 80 - 125 - 150" },
  { marca: "Honda", modelo: "Glh150 Gaucha", cc: 0, nombre: "Honda Glh150 Gaucha" },
  { marca: "Honda", modelo: "MB 100", cc: 100, nombre: "Honda MB 100" },
  { marca: "Honda", modelo: "NX 150", cc: 150, nombre: "Honda NX 150" },
  { marca: "Honda", modelo: "NXR 125 Bross", cc: 125, nombre: "Honda NXR 125 Bross" },
  { marca: "Honda", modelo: "Storm", cc: 0, nombre: "Honda Storm" },
  { marca: "Honda", modelo: "Wave", cc: 0, nombre: "Honda Wave" },
  { marca: "Honda", modelo: "Wave 110 S", cc: 110, nombre: "Honda Wave 110 S" },
  { marca: "Honda", modelo: "Xl125", cc: 0, nombre: "Honda Xl125" },
  { marca: "Honda", modelo: "Xlr125", cc: 0, nombre: "Honda Xlr125" },
  { marca: "Honda", modelo: "Xr125l", cc: 0, nombre: "Honda Xr125l" },
  { marca: "Honda", modelo: "Xr150l", cc: 0, nombre: "Honda Xr150l" },
  { marca: "Honda", modelo: "Xr200 - Xr250", cc: 0, nombre: "Honda Xr200 - Xr250" },
  { marca: "Honda", modelo: "Xr250 Tornado", cc: 0, nombre: "Honda Xr250 Tornado" },
  { marca: "Kawasaki", modelo: "NEO MAX", cc: 0, nombre: "Kawasaki NEO MAX" },
  { marca: "Keller", modelo: "110", cc: 110, nombre: "Keller 110" },
  { marca: "Mondial", modelo: "110", cc: 110, nombre: "Mondial 110" },
  { marca: "Motomel", modelo: "Blitz 110", cc: 110, nombre: "Motomel Blitz 110" },
  { marca: "Motomel", modelo: "C110", cc: 0, nombre: "Motomel C110" },
  { marca: "Motomel", modelo: "Custom 125 - 150 - 200", cc: 125, nombre: "Motomel Custom 125 - 150 - 200" },
  { marca: "Motomel", modelo: "MAX 110", cc: 110, nombre: "Motomel MAX 110" },
  { marca: "Motomel", modelo: "S2 150", cc: 150, nombre: "Motomel S2 150" },
  { marca: "Motomel", modelo: "Skua 150", cc: 150, nombre: "Motomel Skua 150" },
  { marca: "Motomel", modelo: "Skua 150 NEW", cc: 150, nombre: "Motomel Skua 150 NEW" },
  { marca: "Motomel", modelo: "Skua 150 V6", cc: 150, nombre: "Motomel Skua 150 V6" },
  { marca: "Motomel", modelo: "Skua 200", cc: 200, nombre: "Motomel Skua 200" },
  { marca: "Motomel", modelo: "Skua 250", cc: 250, nombre: "Motomel Skua 250" },
  { marca: "Suzuki", modelo: "AX 100", cc: 100, nombre: "Suzuki AX 100" },
  { marca: "Suzuki", modelo: "DR 125 - 250 - 350 - 650", cc: 125, nombre: "Suzuki DR 125 - 250 - 350 - 650" },
  { marca: "Suzuki", modelo: "GN 125", cc: 125, nombre: "Suzuki GN 125" },
  { marca: "Universal", modelo: "Universal", cc: 0, nombre: "Universal" },
  { marca: "Yamaha", modelo: "Crypton 110 NEW", cc: 110, nombre: "Yamaha Crypton 110 NEW" },
  { marca: "Yamaha", modelo: "Crypton T105", cc: 0, nombre: "Yamaha Crypton T105" },
  { marca: "Yamaha", modelo: "Fz16", cc: 0, nombre: "Yamaha Fz16" },
  { marca: "Yamaha", modelo: "V80", cc: 0, nombre: "Yamaha V80" },
  { marca: "Yamaha", modelo: "Xtz125", cc: 0, nombre: "Yamaha Xtz125" },
  { marca: "Yamaha", modelo: "Ybr125", cc: 0, nombre: "Yamaha Ybr125" },
  { marca: "Zanella", modelo: "RX 150 - Mondial 150", cc: 150, nombre: "Zanella RX 150 - Mondial 150" },
];

export const MARCAS_MOTO = [...new Set(MOTOS_AR.map((m) => m.marca))];
export const nombreMoto = (m: Moto) => m.nombre;

/** Modelos de una marca, ordenados por cilindrada. */
export function modelosDe(marca: string): Moto[] {
  return MOTOS_AR.filter((m) => m.marca === marca).sort((a, b) => a.cc - b.cc);
}

/** Categorías del rubro, en el orden en que se muestran en la tienda. */
export const CATEGORIAS_REPUESTOS = [
  "Transmisión",
  "Frenos",
  "Motor",
  "Eléctrico y batería",
  "Suspensión",
  "Neumáticos y cámaras",
  "Lubricantes y químicos",
  "Cables",
  "Carburación",
  "Escape",
  "Accesorios y casco",
  "Estética y plásticos",
] as const;

/**
 * Qué ofrecer junto a cada categoría. Sale del plan del negocio: el que
 * compra una batería necesita el ácido, el que compra transmisión el lubricante.
 */
export const UPSELL: Record<string, string[]> = {
  "Eléctrico y batería": ["Ácido para batería", "Cargador de batería", "Bujía"],
  Transmisión: ["Lubricante de cadena", "Piñón", "Corona"],
  Frenos: ["Líquido de frenos", "Pastillas del otro eje", "Cable de freno"],
  Motor: ["Filtro de aceite", "Filtro de aire", "Aceite 4T"],
  "Lubricantes y químicos": ["Filtro de aceite", "Filtro de aire"],
  "Neumáticos y cámaras": ["Cámara", "Kit de parche"],
  Suspensión: ["Retenes de barral", "Aceite de suspensión"],
};
