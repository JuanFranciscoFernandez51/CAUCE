"use client";

import Link from "next/link";
import { Badge, EmptyState, Table, Td, Th } from "@/components/ui";
import { InlineEdit } from "../inline-edit";
import { waLink } from "@/lib/conce-fin";

export type ClienteDoohRow = {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  pantallas: number; // pantallas contratadas (contratos vigentes)
  pausados: number;
  totalMensual: number; // suma de montoMensual de los contratos activos
};

const fmt = (n: number) => `$ ${Math.round(n).toLocaleString("es-AR")}`;

function mensajeCobro(nombre: string, monto: number): string {
  const mes = new Date().toLocaleDateString("es-AR", {
    month: "long",
    timeZone: "America/Argentina/Buenos_Aires",
  });
  const primer = nombre.split(" ")[0];
  return monto > 0
    ? `Hola ${primer}! Te paso el detalle de ${mes}: ${fmt(monto)} por tu pauta en las pantallas. ¡Gracias por seguir con nosotros!`
    : `Hola ${primer}! Te escribo por tu pauta en las pantallas.`;
}

/**
 * Lista de clientes del circuito de pantallas: editable inline acá mismo
 * (nombre, teléfono, email) y con 👁 para entrar a la ficha completa.
 */
export function ClientesDoohTable({ slug, clientes }: { slug: string; clientes: ClienteDoohRow[] }) {
  if (clientes.length === 0) {
    return (
      <EmptyState
        icon="🧑"
        title="Sin clientes acá"
        detail="Cada contrato de pantalla que cargues da de alta al cliente automáticamente."
      />
    );
  }

  return (
    <Table>
      <thead>
        <tr>
          <Th>Cliente</Th>
          <Th>Teléfono</Th>
          <Th>Email</Th>
          <Th className="text-center">Pantallas</Th>
          <Th className="text-right">Por mes</Th>
          <Th>Estado</Th>
          <Th className="w-20"></Th>
        </tr>
      </thead>
      <tbody>
        {clientes.map((c) => {
          const endpoint = `/api/os/${slug}/contacts/${c.id}`;
          return (
            <tr key={c.id} className="hover:bg-muted/40">
              <Td className="font-medium">
                <InlineEdit endpoint={endpoint} field="name" value={c.nombre} />
              </Td>
              <Td className="text-sm">
                <InlineEdit endpoint={endpoint} field="phone" value={c.telefono} placeholder="+ teléfono" />
              </Td>
              <Td className="text-sm">
                <InlineEdit endpoint={endpoint} field="email" value={c.email} placeholder="+ email" />
              </Td>
              <Td className="text-center text-sm">
                {c.pantallas > 0 ? (
                  <Badge variant="primary">{c.pantallas}</Badge>
                ) : (
                  <span className="text-muted-foreground/40">—</span>
                )}
              </Td>
              <Td className="text-right text-sm tabular-nums">
                {c.totalMensual > 0 ? fmt(c.totalMensual) : <span className="text-muted-foreground/40">—</span>}
              </Td>
              <Td className="text-sm">
                {c.pantallas === 0 ? (
                  <Badge variant="default">Sin contratos</Badge>
                ) : c.pausados > 0 && c.totalMensual === 0 ? (
                  <Badge variant="warning">Pausado</Badge>
                ) : c.pausados > 0 ? (
                  <Badge variant="warning">
                    Activo · {c.pausados} pausado{c.pausados === 1 ? "" : "s"}
                  </Badge>
                ) : (
                  <Badge variant="success">Activo</Badge>
                )}
              </Td>
              <Td>
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/os/${slug}/clientes/${c.id}`}
                    title="Abrir la ficha completa"
                    className="text-muted-foreground/60 hover:text-primary"
                  >
                    👁
                  </Link>
                  {c.telefono ? (
                    <a
                      href={waLink(c.telefono, mensajeCobro(c.nombre, c.totalMensual))}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="WhatsApp con el detalle del mes"
                      className="text-muted-foreground/60 hover:text-success"
                    >
                      💬
                    </a>
                  ) : null}
                </div>
              </Td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
