/**
 * Construye los 20 workflows PLANTILLA en n8n (uno por receta del recetario)
 * y guarda el id en Recipe.n8nTemplateId.
 *
 * Diseño:
 * - Triggers reales (webhook / cron).
 * - Lógica real en nodos Code (clasificación, filtros, cadencias).
 * - Integración REAL con Cauce OS vía hooks ({{cauce_url}}/api/hooks/{{cliente_slug}}/…).
 * - Los pasos que requieren credenciales externas (Meta/MP/AFIP/Sheets) quedan como
 *   NoOp con nombre explícito "(pendiente credencial)" — se reemplazan en onboarding.
 * - Variables {{x}} se reemplazan al instanciar por cliente (lib/n8n.instantiateRecipe).
 *
 * Idempotente: si la receta ya tiene n8nTemplateId vivo en n8n, la saltea.
 * Uso: npx tsx scripts/n8n-templates.ts
 */
import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const db = new PrismaClient();
const N8N_URL = process.env.N8N_URL!.replace(/\/$/, "");
const KEY = process.env.N8N_API_KEY!;

type Node = {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: Record<string, unknown>;
};

let nid = 0;
const P = (i: number, row = 0): [number, number] => [i * 240, row * 180];

function cron(name: string, expr: string, i = 0, row = 0): Node {
  return {
    id: `n${++nid}`, name, type: "n8n-nodes-base.scheduleTrigger", typeVersion: 1.2,
    position: P(i, row),
    parameters: { rule: { interval: [{ field: "cronExpression", expression: expr }] } },
  };
}
function webhook(name: string, path: string, i = 0, row = 0): Node {
  return {
    id: `n${++nid}`, name, type: "n8n-nodes-base.webhook", typeVersion: 2,
    position: P(i, row),
    parameters: { httpMethod: "POST", path, options: {} },
  };
}
function code(name: string, js: string, i: number, row = 0): Node {
  return {
    id: `n${++nid}`, name, type: "n8n-nodes-base.code", typeVersion: 2,
    position: P(i, row),
    parameters: { jsCode: js },
  };
}
function http(name: string, method: string, url: string, i: number, row = 0, body?: string): Node {
  return {
    id: `n${++nid}`, name, type: "n8n-nodes-base.httpRequest", typeVersion: 4.2,
    position: P(i, row),
    parameters: {
      method, url,
      sendHeaders: true,
      headerParameters: { parameters: [{ name: "x-cauce-secret", value: "{{cauce_secret}}" }] },
      ...(body
        ? { sendBody: true, specifyBody: "json", jsonBody: body }
        : {}),
      options: {},
    },
  };
}
function noop(name: string, i: number, row = 0): Node {
  return {
    id: `n${++nid}`, name, type: "n8n-nodes-base.noOp", typeVersion: 1,
    position: P(i, row),
    parameters: {},
  };
}
function note(content: string): Node {
  return {
    id: `n${++nid}`, name: `Nota ${nid}`, type: "n8n-nodes-base.stickyNote", typeVersion: 1,
    position: [-300, -200],
    parameters: { content, width: 360, height: 140 },
  };
}

/** Conexiones lineales: A→B→C…; extra: pares [from,to] adicionales. */
function chain(nodes: Node[], extra: [string, string][] = []) {
  const conns: Record<string, { main: { node: string; type: string; index: number }[][] }> = {};
  const flow = nodes.filter((n) => n.type !== "n8n-nodes-base.stickyNote");
  for (let i = 0; i < flow.length - 1; i++) {
    conns[flow[i].name] = { main: [[{ node: flow[i + 1].name, type: "main", index: 0 }]] };
  }
  for (const [from, to] of extra) {
    if (!conns[from]) conns[from] = { main: [[]] };
    conns[from].main[0].push({ node: to, type: "main", index: 0 });
  }
  return conns;
}

async function createWf(name: string, nodes: Node[], connections: unknown): Promise<string> {
  const res = await fetch(`${N8N_URL}/api/v1/workflows`, {
    method: "POST",
    headers: { "X-N8N-API-KEY": KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ name, nodes, connections, settings: { executionOrder: "v1" } }),
  });
  if (!res.ok) throw new Error(`${name}: n8n ${res.status} ${(await res.text()).slice(0, 250)}`);
  const wf = (await res.json()) as { id: string };
  return wf.id;
}

const HOOK = "{{cauce_url}}/api/hooks/{{cliente_slug}}";

/** Definición de las 20 plantillas, indexadas por nombre EXACTO de la receta en DB. */
const TEMPLATES: Record<string, () => { nodes: Node[]; connections: unknown }> = {
  "Bot FAQ + captura de lead (WhatsApp o IG)": () => {
    const n = [
      note("PLANTILLA Cauce — Bot FAQ + captura.\nEl webhook recibe el mensaje entrante del canal (Meta).\nClasifica con keywords del contenido del negocio; si es intención de compra, da de alta el lead en el CRM del cliente (Cauce OS) y avisa al dueño."),
      webhook("Mensaje entrante", "{{cliente_slug}}-bot-faq", 0),
      code("Clasificar intención", `// Contenido del negocio (se actualiza desde el portal del cliente)
const FAQS = \`{{faq}}\`;
const msg = String($json.body?.message ?? $json.message ?? "").toLowerCase();
const intencionCompra = /(quiero|precio|comprar|pedido|encargar|reservar|turno|cotiz)/.test(msg);
return [{ json: { ...$json, msg, intencionCompra, faqs: FAQS } }];`, 1),
      code("¿Es lead?", `return $json.intencionCompra ? [{ json: $json }] : [];`, 2),
      http("Alta de lead en CRM (Cauce OS)", "POST", `${HOOK}/lead`, 3, 0,
        `{ "nombre": "Contacto WhatsApp", "telefono": "={{ $json.body?.from || 'sin número' }}", "consulta": "={{ $json.msg }}" }`),
      noop("Avisar al dueño por WhatsApp (pendiente credencial Meta)", 4),
      noop("Responder FAQ con el contenido del negocio (pendiente credencial Meta)", 3, 1),
    ];
    return { nodes: n, connections: chain(n.slice(0, 6), [["Clasificar intención", "Responder FAQ con el contenido del negocio (pendiente credencial Meta)"]]) };
  },

  "Respuesta y derivación de reclamos": () => {
    const n = [
      note("PLANTILLA Cauce — Reclamos.\nDetecta reclamo y severidad por keywords; lo grave se deriva YA al dueño, lo leve recibe respuesta empática y registro."),
      webhook("Mensaje entrante", "{{cliente_slug}}-reclamos", 0),
      code("Detectar reclamo y severidad", `const msg = String($json.body?.message ?? "").toLowerCase();
const grave = /(roto|nunca llegó|estafa|denuncia|abogado|defensa del consumidor|reembolso)/.test(msg);
return [{ json: { ...$json, msg, esReclamo: /(queja|reclamo|mal|problema|error|demora)/.test(msg) || grave, grave } }];`, 1),
      code("¿Grave?", `return $json.grave ? [{ json: $json }] : [];`, 2),
      noop("Derivar URGENTE al dueño (pendiente credencial Meta)", 3),
      noop("Respuesta empática + registro (pendiente credencial Meta)", 3, 1),
    ];
    return { nodes: n, connections: chain(n.slice(0, 5), [["Detectar reclamo y severidad", "Respuesta empática + registro (pendiente credencial Meta)"]]) };
  },

  "Encuesta post-venta / pedido de reseña": () => {
    const n = [
      note("PLANTILLA Cauce — Encuesta post-venta.\nTodos los días lee las ventas/estadías cerradas, manda encuesta de 1 pregunta; si la nota es alta pide reseña en Google con el link del negocio."),
      cron("Todos los días 11:00", "0 11 * * *", 0),
      noop("Leer ventas del día (conectar origen en onboarding)", 1),
      noop("Enviar encuesta 1-pregunta (pendiente credencial Meta)", 2),
      code("¿Puntaje alto?", `const score = Number($json.score ?? 5);
return score >= 4 ? [{ json: { ...$json, link: "{{link_resena}}" } }] : [];`, 3),
      noop("Pedir reseña en Google con el link", 4),
    ];
    return { nodes: n, connections: chain(n) };
  },

  "Captura multicanal → CRM": () => {
    const n = [
      note("PLANTILLA Cauce — Captura multicanal.\nTodas las consultas (IG/web/WhatsApp/portales) entran por este webhook, se normalizan y caen al CRM del cliente en Cauce OS con su fuente. Nadie queda sin respuesta."),
      webhook("Consulta entrante (cualquier canal)", "{{cliente_slug}}-captura", 0),
      code("Normalizar fuente y datos", `const b = $json.body ?? $json;
return [{ json: {
  name: b.name || b.nombre || "Consulta sin nombre",
  phone: b.phone || b.telefono || "",
  email: b.email || "",
  source: b.source || b.canal || "bot",
  notes: "Consulta: " + (b.message || b.mensaje || "(sin texto)"),
} }];`, 1),
      http("Alta en CRM (Cauce OS)", "POST", `${HOOK}/lead`, 2, 0,
        `{ "nombre": "={{ $json.name }}", "telefono": "={{ $json.phone || 'sin número' }}", "consulta": "={{ $json.notes }}" }`),
      noop("Bienvenida instantánea (pendiente credencial Meta)", 3),
    ];
    return { nodes: n, connections: chain(n) };
  },

  "Seguimiento de presupuesto no cerrado": () => {
    const n = [
      note("PLANTILLA Cauce — Seguimiento de presupuestos.\nCadencia {{frecuencia_seguimiento}}: lee los presupuestos enviados sin respuesta y manda el toque que corresponde. Corta cuando el cliente contesta."),
      cron("Cada hora hábil", "0 9-19 * * 1-6", 0),
      noop("Leer presupuestos enviados (planilla del negocio — onboarding)", 1),
      code("Filtrar por cadencia 24h/72h/7d", `const ahora = Date.now();
const items = ($input.all() ?? []).filter(i => i.json.estado === "enviado" && !i.json.respondio);
return items.map(i => {
  const horas = (ahora - new Date(i.json.enviadoEl ?? ahora).getTime()) / 36e5;
  const toque = horas >= 168 ? 3 : horas >= 72 ? 2 : horas >= 24 ? 1 : 0;
  return { json: { ...i.json, toque } };
}).filter(i => i.json.toque > 0);`, 2),
      noop("Enviar seguimiento según toque (pendiente credencial Meta)", 3),
      noop("Marcar toque enviado en la planilla", 4),
    ];
    return { nodes: n, connections: chain(n) };
  },

  "Calificación + cotización automática": () => {
    const n = [
      note("PLANTILLA Cauce — Calificación + cotización.\nLead nuevo → score por criterios del negocio → si califica, arma la cotización con la lista de precios y la manda. Todo queda en el CRM."),
      webhook("Lead nuevo", "{{cliente_slug}}-calificacion", 0),
      code("Calificar por criterios", `const b = $json.body ?? $json;
// Criterios del negocio: {{criterios}}
let score = 0;
if (b.presupuesto) score += 40;
if (b.urgencia === "alta" || b.urgente) score += 30;
if (b.zona) score += 30;
return [{ json: { ...b, score, califica: score >= 50 } }];`, 1),
      code("¿Califica?", `return $json.califica ? [{ json: $json }] : [];`, 2),
      noop("Armar y enviar cotización (lista de precios — onboarding)", 3),
      http("Registrar en CRM (Cauce OS)", "POST", `${HOOK}/lead`, 4, 0,
        `{ "nombre": "={{ $json.name || 'Lead calificado' }}", "telefono": "={{ $json.phone || 'sin número' }}", "consulta": "={{ 'Score: ' + $json.score + ' — cotización enviada' }}" }`),
      noop("Registrar no calificado para nutrir después", 3, 1),
    ];
    return { nodes: n, connections: chain(n.slice(0, 6), [["Calificar por criterios", "Registrar no calificado para nutrir después"]]) };
  },

  "Reactivación de clientes inactivos": () => {
    const n = [
      note("PLANTILLA Cauce — Reactivación.\nSemanal: busca clientes sin compra/visita hace más de {{meses_inactivo}} meses y les manda una oferta para que vuelvan."),
      cron("Lunes 10:00", "0 10 * * 1", 0),
      noop("Leer historial de clientes (planilla/CRM — onboarding)", 1),
      code("Filtrar inactivos", `const MESES = Number("{{meses_inactivo}}") || 3;
const corte = Date.now() - MESES * 30 * 864e5;
return ($input.all() ?? []).filter(i => new Date(i.json.ultimaCompra ?? 0).getTime() < corte);`, 2),
      noop("Enviar oferta de reactivación (pendiente credencial Meta)", 3),
    ];
    return { nodes: n, connections: chain(n) };
  },

  "Publicación programada multicanal": () => {
    const n = [
      note("PLANTILLA Cauce — Publicación programada.\nLee el calendario de contenido del negocio y publica lo del día en IG/FB a la hora configurada. El dueño solo carga la planilla."),
      cron("Todos los días {{hora_publicacion}}", "0 18 * * *", 0),
      noop("Leer calendario de contenido (Sheets — onboarding)", 1),
      code("¿Hay post para hoy?", `const hoy = new Date().toISOString().slice(0,10);
return ($input.all() ?? []).filter(i => String(i.json.fecha).slice(0,10) === hoy && !i.json.publicado);`, 2),
      noop("Publicar en Instagram/Facebook (pendiente credencial Meta)", 3),
      noop("Marcar como publicado", 4),
    ];
    return { nodes: n, connections: chain(n) };
  },

  "Generador de contenido por caso de éxito": () => {
    const n = [
      note("PLANTILLA Cauce — Contenido por caso de éxito.\nCuando se carga un trabajo terminado, la IA arma el copy del post y se lo manda al dueño para aprobar con un sí/no."),
      webhook("Caso de éxito cargado", "{{cliente_slug}}-caso-exito", 0),
      noop("Generar copy con IA (pendiente créditos Anthropic)", 1),
      noop("Mandar borrador al dueño para aprobar (pendiente Meta)", 2),
      code("¿Aprobado?", `return ($json.body?.aprobado ?? $json.aprobado) ? [{ json: $json }] : [];`, 3),
      noop("Publicar (pendiente credencial Meta)", 4),
    ];
    return { nodes: n, connections: chain(n) };
  },

  "Respuesta automática a comentarios/DMs de campañas": () => {
    const n = [
      note("PLANTILLA Cauce — Ads que se atienden solos.\nComentario o DM en campaña → respuesta automática al instante con la info + alta del interesado en el CRM. Cero ventas perdidas por demora."),
      webhook("Comentario/DM de campaña", "{{cliente_slug}}-ads", 0),
      code("Clasificar consulta", `const msg = String($json.body?.message ?? "").toLowerCase();
const pide = /(precio|info|talle|stock|envío|envio|cuanto)/.test(msg);
return [{ json: { ...$json, pideInfo: pide } }];`, 1),
      noop("Responder DM con info y oferta {{oferta}} (pendiente Meta)", 2),
      http("Alta del interesado en CRM (Cauce OS)", "POST", `${HOOK}/lead`, 3, 0,
        `{ "nombre": "Interesado de campaña", "telefono": "={{ $json.body?.from || 'sin número' }}", "consulta": "Vino de un anuncio — pidió info" }`),
    ];
    return { nodes: n, connections: chain(n) };
  },

  "Alerta de stock bajo": () => {
    const n = [
      note("PLANTILLA Cauce — Alerta de stock.\nDos veces al día compara stock contra mínimo {{stock_minimo}} y avisa al dueño ANTES del faltante, con lista de reposición."),
      cron("9:00 y 17:00", "0 9,17 * * *", 0),
      noop("Leer stock (planilla/sistema — onboarding)", 1),
      code("Filtrar bajo mínimo", `const MIN = Number("{{stock_minimo}}") || 5;
return ($input.all() ?? []).filter(i => Number(i.json.stock ?? 99) <= MIN);`, 2),
      code("¿Hay faltantes?", `return $input.all().length ? [{ json: { faltantes: $input.all().map(i=>i.json) } }] : [];`, 3),
      noop("Avisar al dueño con lista de reposición (pendiente Meta)", 4),
    ];
    return { nodes: n, connections: chain(n) };
  },

  "Catálogo sincronizado": () => {
    const n = [
      note("PLANTILLA Cauce — Catálogo sincronizado.\nMantiene el catálogo de venta alineado con el origen (planilla/sistema): altas, precios y stock se actualizan solos."),
      cron("Cada 6 horas", "0 */6 * * *", 0),
      noop("Leer catálogo origen (onboarding)", 1),
      code("Detectar diferencias", `// compara origen vs destino y emite solo los cambios
return ($input.all() ?? []).filter(i => i.json.cambiado === true || i.json.nuevo === true);`, 2),
      noop("Actualizar catálogo destino (tienda/WhatsApp Business — onboarding)", 3),
    ];
    return { nodes: n, connections: chain(n) };
  },

  "Confirmación y seguimiento de pedidos": () => {
    const n = [
      note("PLANTILLA Cauce — Seguimiento de pedidos.\nCada cambio de estado dispara el mensaje correspondiente al cliente: confirmado → en preparación → enviado/listo → entregado. El cliente deja de preguntar '¿salió?'."),
      webhook("Cambio de estado de pedido", "{{cliente_slug}}-pedidos", 0),
      code("Armar mensaje según estado", `const b = $json.body ?? $json;
const msgs = {
  nuevo: "¡Recibimos tu pedido! Te confirmamos en breve.",
  confirmado: "Pedido confirmado ✅ Ya lo estamos preparando.",
  enviado: "Tu pedido salió 🚚 Llega hoy.",
  listo: "¡Tu pedido está listo para retirar!",
  entregado: "¡Gracias por comprar en {{cliente_nombre}}!",
};
return [{ json: { ...b, mensaje: msgs[b.estado] ?? null } }];`, 1),
      code("¿Estado conocido?", `return $json.mensaje ? [{ json: $json }] : [];`, 2),
      noop("Enviar mensaje al cliente (pendiente credencial Meta)", 3),
    ];
    return { nodes: n, connections: chain(n) };
  },

  "Recordatorio de turnos/citas": () => {
    const n = [
      note("PLANTILLA Cauce — Recordatorio de turnos.\nTodos los días a las {{hora_envio}} lee los turnos de mañana (Cauce OS o Calendar) y manda recordatorio con confirmar/cancelar. Los olvidos vuelven a la caja."),
      cron("Todos los días 19:00", "0 19 * * *", 0),
      noop("Leer turnos de mañana (Cauce OS / Calendar — onboarding)", 1),
      code("Armar recordatorios", `return ($input.all() ?? []).map(i => ({ json: {
  ...i.json,
  mensaje: \`Hola \${i.json.nombre ?? ""}! Te recordamos tu turno de mañana \${i.json.hora ?? ""} en {{cliente_nombre}}. Respondé 1 para confirmar, 2 para cancelar.\`,
} }));`, 2),
      noop("Enviar recordatorio (pendiente credencial Meta)", 3),
      webhook("Respuesta del cliente (1/2)", "{{cliente_slug}}-turno-respuesta", 0, 1),
      code("Interpretar respuesta", `const r = String($json.body?.message ?? "").trim();
return [{ json: { confirmar: r === "1", cancelar: r === "2" } }];`, 1, 1),
      noop("Actualizar estado del turno en la agenda", 2, 1),
    ];
    return {
      nodes: n,
      connections: chain(n.slice(0, 5), [
        ["Respuesta del cliente (1/2)", "Interpretar respuesta"],
        ["Interpretar respuesta", "Actualizar estado del turno en la agenda"],
      ]),
    };
  },

  "Agendado self-service por WhatsApp": () => {
    const n = [
      note("PLANTILLA Cauce — Agendado self-service.\nEl cliente pide turno por WhatsApp → el bot consulta los huecos REALES en Cauce OS, ofrece opciones, y al elegir agenda directo en el sistema del negocio. Integración 100% real con los hooks."),
      webhook("Pide turno por WhatsApp", "{{cliente_slug}}-pedir-turno", 0),
      http("Consultar huecos libres (Cauce OS)", "GET", `${HOOK}/slots?date={{ $now.plus(1, 'day').toFormat('yyyy-MM-dd') }}`, 1),
      code("Armar opciones para el cliente", `const slots = ($json.slots ?? []).slice(0, 5);
return [{ json: { opciones: slots.map((s, i) => \`\${i+1}) \${s}\`).join("\\n") } }];`, 2),
      noop("Ofrecer huecos por WhatsApp (pendiente credencial Meta)", 3),
      webhook("Elige hueco", "{{cliente_slug}}-elegir-turno", 0, 1),
      http("Agendar en Cauce OS", "POST", `${HOOK}/book`, 1, 1,
        `{ "nombre": "={{ $json.body.nombre || 'Cliente WhatsApp' }}", "telefono": "={{ $json.body.telefono || 'sin número' }}", "fecha": "={{ $json.body.fecha }}", "hora": "={{ $json.body.hora }}", "servicio": "Turno pedido por WhatsApp" }`),
      noop("Confirmar turno al cliente (pendiente credencial Meta)", 2, 1),
    ];
    return {
      nodes: n,
      connections: chain(n.slice(0, 5), [
        ["Elige hueco", "Agendar en Cauce OS"],
        ["Agendar en Cauce OS", "Confirmar turno al cliente (pendiente credencial Meta)"],
      ]),
    };
  },

  "Registro de entradas y salidas": () => {
    const n = [
      note("PLANTILLA Cauce — Entradas y salidas.\nEl empleado manda 'llegué' / 'me voy' por WhatsApp y queda el registro con hora. Los viernes sale el reporte semanal de horas al dueño."),
      webhook("Mensaje del empleado", "{{cliente_slug}}-fichaje", 0),
      code("Registrar movimiento", `const msg = String($json.body?.message ?? "").toLowerCase();
const tipo = /llegu|entro|entré/.test(msg) ? "entrada" : /me voy|salgo|salí/.test(msg) ? "salida" : null;
return tipo ? [{ json: { empleado: $json.body?.from ?? "?", tipo, ts: new Date().toISOString() } }] : [];`, 1),
      noop("Guardar registro (planilla RRHH — onboarding)", 2),
      cron("Viernes 20:00 — reporte semanal", "0 20 * * 5", 0, 1),
      code("Armar reporte de horas", `// suma horas por empleado de la semana
return [{ json: { reporte: "Horas de la semana por empleado" } }];`, 1, 1),
      noop("Enviar reporte al dueño (pendiente Meta)", 2, 1),
    ];
    return {
      nodes: n,
      connections: chain(n.slice(0, 4), [
        ["Viernes 20:00 — reporte semanal", "Armar reporte de horas"],
        ["Armar reporte de horas", "Enviar reporte al dueño (pendiente Meta)"],
      ]),
    };
  },

  "Recordatorio de turnos de empleados": () => {
    const n = [
      note("PLANTILLA Cauce — Turnos del personal.\nCada día lee la grilla de horarios del personal y le avisa a cada uno su turno de mañana. Cambios de último momento incluidos."),
      cron("Todos los días 20:00", "0 20 * * *", 0),
      noop("Leer grilla de horarios (planilla — onboarding)", 1),
      code("Armar avisos por empleado", `return ($input.all() ?? []).map(i => ({ json: {
  ...i.json, aviso: \`Hola \${i.json.empleado}! Mañana trabajás \${i.json.horario} en {{cliente_nombre}}.\`,
} }));`, 2),
      noop("Enviar aviso a cada empleado (pendiente Meta)", 3),
    ];
    return { nodes: n, connections: chain(n) };
  },

  "Venta → factura → registro": () => {
    const n = [
      note("PLANTILLA Cauce — Venta → factura → registro.\nCada venta dispara el comprobante ({{tipo_factura}}) y el asiento en la contabilidad. Cero doble carga."),
      webhook("Venta nueva", "{{cliente_slug}}-venta", 0),
      code("Armar comprobante", `const b = $json.body ?? $json;
return [{ json: { cliente: b.cliente, items: b.items ?? [], total: b.total ?? 0, tipo: "{{tipo_factura}}" } }];`, 1),
      noop("Emitir factura (AFIP/facturador — pendiente credencial)", 2),
      noop("Registrar en contabilidad (planilla/sistema — onboarding)", 3),
      noop("Mandar factura al cliente (pendiente Meta)", 4),
    ];
    return { nodes: n, connections: chain(n) };
  },

  "Conciliación de pagos": () => {
    const n = [
      note("PLANTILLA Cauce — Conciliación de pagos.\nTodos los días cruza los cobros de Mercado Pago contra pedidos/facturas y marca SOLO las diferencias para revisar. De un día de trabajo a minutos."),
      cron("Todos los días 7:00", "0 7 * * *", 0),
      noop("Leer cobros de Mercado Pago (pendiente token MP)", 1),
      noop("Leer pedidos/facturas (planilla/sistema — onboarding)", 2),
      code("Cruzar y detectar diferencias", `// matchea por monto+referencia; emite solo lo que no cierra
const cobros = $input.all();
return cobros.filter(c => !c.json.matcheado);`, 3),
      code("¿Hay diferencias?", `return $input.all().length ? [{ json: { diferencias: $input.all().map(i=>i.json) } }] : [];`, 4),
      noop("Avisar al dueño solo lo que no cierra (pendiente Meta)", 5),
    ];
    return { nodes: n, connections: chain(n) };
  },

  "Recordatorio de cobros pendientes": () => {
    const n = [
      note("PLANTILLA Cauce — Cobros pendientes.\nDetecta facturas vencidas hace más de {{dias_vencido}} días y persigue el cobro solo: recordatorio cordial, reintento a los 7 días, y si no hay caso avisa al dueño."),
      cron("Todos los días 10:00", "0 10 * * *", 0),
      noop("Leer cuentas por cobrar (planilla — onboarding)", 1),
      code("Filtrar vencidos y cadencia", `const DIAS = Number("{{dias_vencido}}") || 3;
const ahora = Date.now();
return ($input.all() ?? []).filter(i => {
  const dias = (ahora - new Date(i.json.vence ?? ahora).getTime()) / 864e5;
  return !i.json.pagado && dias >= DIAS;
}).map(i => ({ json: { ...i.json, toque: (i.json.toques ?? 0) + 1 } }));`, 2),
      code("¿Sigue sin pagar tras 2 toques?", `return $input.all().filter(i => i.json.toque > 2);`, 3),
      noop("Avisar al dueño con el resumen", 4),
      noop("Enviar recordatorio de pago cordial (pendiente Meta)", 3, 1),
    ];
    return { nodes: n, connections: chain(n.slice(0, 5), [["Filtrar vencidos y cadencia", "Enviar recordatorio de pago cordial (pendiente Meta)"]]) };
  },
};

async function main() {
  const recipes = await db.recipe.findMany();
  console.log(`🌊 ${recipes.length} recetas en DB · ${Object.keys(TEMPLATES).length} plantillas definidas\n`);
  let creadas = 0;
  for (const r of recipes) {
    const builder = TEMPLATES[r.name];
    if (!builder) {
      console.log(`— sin plantilla definida: ${r.name}`);
      continue;
    }
    if (r.n8nTemplateId) {
      const check = await fetch(`${N8N_URL}/api/v1/workflows/${r.n8nTemplateId}`, {
        headers: { "X-N8N-API-KEY": KEY },
      });
      if (check.ok) {
        console.log(`✓ ya existe: ${r.name}`);
        continue;
      }
    }
    const { nodes, connections } = builder();
    const id = await createWf(`[PLANTILLA] ${r.name}`, nodes, connections);
    await db.recipe.update({ where: { id: r.id }, data: { n8nTemplateId: id } });
    creadas++;
    console.log(`✅ ${r.name} → ${id}`);
  }
  console.log(`\n🌊 ${creadas} plantillas creadas en n8n.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
