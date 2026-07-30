/**
 * Motos que se ven en la calle en Argentina, agrupadas por marca.
 * Sirve para el selector "elegí tu moto" del shop: el cliente no sabe el
 * código del repuesto, sabe qué moto tiene. Los nombres están escritos como
 * los dice la gente, porque así se guardan en Product.compatibilidades.
 */
export type Moto = { marca: string; modelo: string; cc: number };

export const MOTOS_AR: Moto[] = [
  // Honda
  { marca: "Honda", modelo: "Wave 110 S", cc: 110 },
  { marca: "Honda", modelo: "Biz 125", cc: 125 },
  { marca: "Honda", modelo: "CB 125F Twister", cc: 125 },
  { marca: "Honda", modelo: "Storm 125", cc: 125 },
  { marca: "Honda", modelo: "GLH 150", cc: 150 },
  { marca: "Honda", modelo: "CG Titan 150", cc: 150 },
  { marca: "Honda", modelo: "XR 150 L", cc: 150 },
  { marca: "Honda", modelo: "New Elite 125", cc: 125 },
  // Yamaha
  { marca: "Yamaha", modelo: "Crypton 110", cc: 110 },
  { marca: "Yamaha", modelo: "YBR 125", cc: 125 },
  { marca: "Yamaha", modelo: "XTZ 125", cc: 125 },
  { marca: "Yamaha", modelo: "FZ 150", cc: 150 },
  // Zanella
  { marca: "Zanella", modelo: "ZB 110", cc: 110 },
  { marca: "Zanella", modelo: "RX 150", cc: 150 },
  { marca: "Zanella", modelo: "Styler 150", cc: 150 },
  { marca: "Zanella", modelo: "Patagonian Eagle 150", cc: 150 },
  { marca: "Zanella", modelo: "Sapucai 150", cc: 150 },
  // Motomel
  { marca: "Motomel", modelo: "Blitz 110", cc: 110 },
  { marca: "Motomel", modelo: "Blitz 125", cc: 125 },
  { marca: "Motomel", modelo: "CG 150 S2", cc: 150 },
  { marca: "Motomel", modelo: "Skua 150", cc: 150 },
  { marca: "Motomel", modelo: "Strato Euro 150", cc: 150 },
  // Corven
  { marca: "Corven", modelo: "Energy 110", cc: 110 },
  { marca: "Corven", modelo: "Mirage 110", cc: 110 },
  { marca: "Corven", modelo: "Energy 125", cc: 125 },
  { marca: "Corven", modelo: "Triax 150", cc: 150 },
  { marca: "Corven", modelo: "Hunter 150", cc: 150 },
  // Gilera
  { marca: "Gilera", modelo: "Smash 110", cc: 110 },
  { marca: "Gilera", modelo: "Smash 125", cc: 125 },
  { marca: "Gilera", modelo: "VC 150", cc: 150 },
  { marca: "Gilera", modelo: "Sahel 150", cc: 150 },
  // Guerrero
  { marca: "Guerrero", modelo: "Trip 110", cc: 110 },
  { marca: "Guerrero", modelo: "Econo 110", cc: 110 },
  { marca: "Guerrero", modelo: "GR5 150", cc: 150 },
  // Keller
  { marca: "Keller", modelo: "KN 110", cc: 110 },
  { marca: "Keller", modelo: "Stratus 150", cc: 150 },
  { marca: "Keller", modelo: "Miracle 150", cc: 150 },
  // Otras
  { marca: "Suzuki", modelo: "AX 100", cc: 100 },
  { marca: "Suzuki", modelo: "EN 125", cc: 125 },
  { marca: "Bajaj", modelo: "Boxer 150", cc: 150 },
  { marca: "Bajaj", modelo: "Rouser NS 160", cc: 160 },
  { marca: "Mondial", modelo: "LD 110", cc: 110 },
  { marca: "Mondial", modelo: "RD 150", cc: 150 },
  { marca: "Kymco", modelo: "Agility 125", cc: 125 },
];

export const MARCAS_MOTO = [...new Set(MOTOS_AR.map((m) => m.marca))];
export const nombreMoto = (m: Moto) => `${m.marca} ${m.modelo}`;

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
