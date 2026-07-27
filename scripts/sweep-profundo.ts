import { chromium } from "playwright";
import { uploadToTenant } from "../src/lib/storage";

// Blur v3: textos de información, números de plata y clientes con contactos.
// Visible: títulos, encabezados de tabla, navegación, labels y botones.
const BLUR_CSS = `
  main td, main tbody tr, main ul > li, main ol > li,
  main [class*="tabular"], td, tbody tr { filter: blur(5px) !important; }
  h1, h2, h3, h4, th, thead *, nav *, aside *, label, button, summary,
  [role="tablist"] * { filter: none !important; }
`;

// Blur quirúrgico por contenido: plata, teléfonos, mails.
const BLUR_JS = `
(() => {
  const money = /\\$\\s?[\\d.,]{2,}|[\\d.]{4,}\\s?(ARS|USD|us\\$|u\\$s)/i;
  const contacto = /\\b\\d{2,4}[\\s-]?\\d{6,8}\\b|@[a-z0-9.-]+\\.[a-z]{2,}|wa\\.me/i;
  const walker = document.createTreeWalker(document.querySelector('main') || document.body, NodeFilter.SHOW_TEXT);
  const objetivos = new Set();
  while (walker.nextNode()) {
    const t = walker.currentNode.textContent || '';
    if (money.test(t) || contacto.test(t)) {
      const el = walker.currentNode.parentElement;
      if (el && !['H1','H2','H3','H4','TH','NAV','BUTTON','LABEL'].includes(el.tagName)) objetivos.add(el);
    }
  }
  for (const el of objetivos) el.style.setProperty('filter', 'blur(5px)', 'important');
})()
`;

type Sitio = {
  slug: string;
  login: string;
  user: string;
  pass: string;
  rutas: [string, string][]; // [path, título]
};

const SITIOS: Sitio[] = [
  {
    slug: "motos-fernandez",
    login: "https://www.motosfernandez.com.ar/admin/login",
    user: "Fran",
    pass: "Albo2003.",
    rutas: [
      ["/admin", "Dashboard"],
      ["/admin/stock-motos", "Stock de motos"],
      ["/admin/mandatos", "Mandatos de venta"],
      ["/admin/mandatos/nuevo", "Cargar mandato (documento descargable)"],
      ["/admin/ordenes-compra", "Órdenes de compra (boleto)"],
      ["/admin/presupuestos", "Presupuestos"],
      ["/admin/financiacion", "Financiación propia"],
      ["/admin/tesoreria", "Tesorería"],
      ["/admin/tesoreria/financiaciones", "Cuotas y vencimientos"],
      ["/admin/taller", "Taller — órdenes de trabajo"],
      ["/admin/turnos", "Turnos del taller"],
      ["/admin/calendario", "Calendario"],
      ["/admin/modelos", "Modelos 0KM"],
      ["/admin/productos", "Productos de la tienda"],
      ["/admin/pedidos", "Pedidos de la tienda"],
      ["/admin/cupones", "Cupones de descuento"],
      ["/admin/promociones", "Promociones"],
      ["/admin/crm", "CRM / Leads"],
      ["/admin/clientes", "Clientes"],
      ["/admin/outreach", "Outreach — avisos por WhatsApp"],
      ["/admin/meta", "Instagram — publicar con un botón"],
      ["/admin/meta/calendario", "Calendario de publicaciones"],
      ["/admin/meta/ads", "Meta Ads desde el panel"],
      ["/admin/ml", "Mercado Libre — publicar con un botón"],
      ["/admin/noticias", "Noticias / blog"],
      ["/admin/newsletter", "Newsletter"],
      ["/admin/testimonios", "Testimonios"],
      ["/admin/finanzas", "Finanzas"],
      ["/admin/finanzas/movimientos", "Finanzas — libro de movimientos"],
      ["/admin/finanzas/anual", "Finanzas — matriz anual"],
      ["/admin/finanzas/cuentas-y-cheques", "Finanzas — cuentas y cheques"],
      ["/admin/finanzas/costos-fijos", "Finanzas — costos fijos"],
      ["/admin/contador", "Para el contador"],
      ["/admin/facturacion", "Facturación (ARCA)"],
      ["/admin/proveedores", "Proveedores"],
      ["/admin/sistema", "Sistema — procesos automáticos"],
      ["/admin/asistente", "Asistente IA"],
    ],
  },
  {
    slug: "vespa-bahia",
    login: "https://www.vespabahia.com.ar/admin",
    user: "cauce",
    pass: "cauce123",
    rutas: [
      ["/admin", "Dashboard"],
      ["/admin/tareas", "Tareas pendientes"],
      ["/admin/stock-motos", "Stock por unidad física"],
      ["/admin/stock-motos/vendidas", "Vendidas"],
      ["/admin/stock-motos/cargar-factura", "Cargar stock desde factura"],
      ["/admin/mandatos", "Mandatos de venta"],
      ["/admin/ordenes-compra", "Órdenes de compra (boleto)"],
      ["/admin/presupuestos", "Presupuestos"],
      ["/admin/taller", "Taller — órdenes de trabajo"],
      ["/admin/turnos", "Turnos del taller"],
      ["/admin/test-rides", "Test rides agendados desde la web"],
      ["/admin/calendario", "Calendario"],
      ["/admin/modelos", "Modelos"],
      ["/admin/productos", "Productos de la tienda"],
      ["/admin/pedidos", "Pedidos de la tienda"],
      ["/admin/cupones", "Cupones"],
      ["/admin/promociones", "Promociones"],
      ["/admin/hot-sale", "Hot Sale"],
      ["/admin/crm", "CRM / Leads"],
      ["/admin/clientes", "Clientes"],
      ["/admin/finanzas", "Finanzas — resumen general"],
      ["/admin/finanzas/movimientos", "Finanzas — libro de movimientos"],
      ["/admin/finanzas/anual", "Finanzas — matriz anual"],
      ["/admin/finanzas/cuentas-y-cheques", "Finanzas — cartera"],
      ["/admin/finanzas/costos-fijos", "Finanzas — costos fijos"],
      ["/admin/facturacion", "Facturación (ARCA)"],
      ["/admin/tesoreria", "Tesorería"],
      ["/admin/qr", "Códigos QR"],
      ["/admin/noticias", "Noticias"],
      ["/admin/proveedores", "Proveedores"],
    ],
  },
  {
    slug: "zatiori-espejos",
    login: "https://zatiori.vercel.app/login",
    user: "admin@zatiori.com",
    pass: "zatiori2026",
    rutas: [
      ["/panel", "Dashboard"],
      ["/panel/pedidos", "Pedidos — pipeline de 6 estados"],
      ["/panel/pedidos/nuevo", "Cargar pedido a medida"],
      ["/panel/fabrica", "Cola de fábrica"],
      ["/panel/catalogo", "Catálogo"],
      ["/panel/catalogo/nuevo", "Publicar espejo"],
      ["/panel/clientes", "Clientes"],
      ["/panel/proveedores", "Proveedores"],
      ["/panel/instagram", "Instagram automático"],
      ["/panel/resenas", "Reseñas verificadas"],
      ["/panel/configuracion", "Configuración"],
    ],
  },
  {
    slug: "la-base",
    login: "https://la-base-vespa-bahia.vercel.app/admin",
    user: "admin",
    pass: "labase2026",
    rutas: [
      ["/admin", "Dashboard"],
      ["/admin/hoy", "Hoy — el parte del día"],
      ["/admin/calendario", "Calendario del mes"],
      ["/admin/reservas", "Reservas"],
      ["/admin/reservas/nueva", "Cargar reserva"],
      ["/admin/checkin", "Check-in con QR"],
      ["/admin/caja", "Caja en 4 monedas"],
      ["/admin/espera", "Lista de espera"],
      ["/admin/rental", "Rental de equipos"],
      ["/admin/instructores", "Instructores"],
      ["/admin/mi-agenda", "Mi agenda (vista del instructor)"],
      ["/admin/liquidaciones", "Liquidaciones de instructores"],
      ["/admin/bolsa", "Bolsa de trabajo"],
      ["/admin/leads", "Leads"],
      ["/admin/tarifas", "Tarifas de temporada"],
      ["/admin/temporada", "Temporada"],
      ["/admin/noticias", "Noticias"],
      ["/admin/auditoria", "Auditoría — quién hizo qué"],
    ],
  },
];

async function main() {
  const b = await chromium.launch();
  for (const sitio of SITIOS) {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5 });
    const p = await ctx.newPage();
    console.log("==", sitio.slug);
    try {
      await p.goto(sitio.login, { waitUntil: "domcontentloaded", timeout: 35000 });
      await p.waitForTimeout(2500);
      const passInput = p.locator('input[type="password"]').first();
      if ((await passInput.count()) > 0) {
        await p
          .locator('input[type="text"], input[type="email"], input[name*="user" i], input[autocomplete="username"]')
          .first()
          .fill(sitio.user);
        await passInput.fill(sitio.pass);
        await passInput.press("Enter");
        await p.waitForTimeout(6000);
      }
      const base = new URL(sitio.login).origin;
      const urls: { titulo: string; url: string }[] = [];
      for (const [href, titulo] of sitio.rutas) {
        try {
          const res = await p.goto(base + href, { waitUntil: "networkidle", timeout: 30000 });
          if (!res || res.status() >= 400 || p.url().includes("login")) {
            console.log("  — salteada:", href);
            continue;
          }
          await p.waitForTimeout(1800);
          await p.addStyleTag({ content: BLUR_CSS }).catch(() => {});
          await p.evaluate(BLUR_JS).catch(() => {});
          await p.waitForTimeout(400);
          const up = await uploadToTenant({
            slug: "sistema",
            scope: ["casos", sitio.slug, "admin-full"],
            buffer: await p.screenshot(),
            originalName: titulo + ".png",
          });
          urls.push({ titulo, url: up.url });
          console.log("  ✅", titulo);
        } catch {
          console.log("  ✗ error:", href);
        }
      }
      console.log("JSON", sitio.slug, JSON.stringify(urls));
    } catch (e) {
      console.log("  ✗", e instanceof Error ? e.message.slice(0, 80) : "?");
    }
    await ctx.close();
  }
  await b.close();
}
main();
