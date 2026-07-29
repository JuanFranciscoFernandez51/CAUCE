"use client";

import Link from "next/link";
import { Badge, EmptyState, Table, Td, Th } from "@/components/ui";
import { InlineEdit } from "../inline-edit";

export type ClienteRow = {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  mandatos: number;
  boletos: number;
  vehiculos: number;
  ultimoContacto: string | null;
};

/**
 * Lista de clientes de la concesionaria, editable DE LAS DOS FORMAS: inline
 * acá (teléfono y email) y con 👁 para entrar a la ficha completa.
 */
export function ClientesTable({ slug, clientes }: { slug: string; clientes: ClienteRow[] }) {
  if (clientes.length === 0) {
    return (
      <EmptyState
        icon="🧑"
        title="Sin clientes acá"
        detail="Cada mandato o boleto que cargues da de alta al cliente automáticamente."
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
          <Th className="text-center">Mandatos</Th>
          <Th className="text-center">Boletos</Th>
          <Th className="text-center">Vehículos</Th>
          <Th>Último contacto</Th>
          <Th className="w-20"></Th>
        </tr>
      </thead>
      <tbody>
        {clientes.map((c) => {
          const endpoint = `/api/os/${slug}/contacts/${c.id}`;
          return (
            <tr key={c.id} className="hover:bg-muted/40">
              <Td className="font-medium">
                <Link href={`/os/${slug}/clientes/${c.id}`} className="hover:text-primary">
                  {c.nombre}
                </Link>
              </Td>
              <Td className="text-sm">
                <InlineEdit endpoint={endpoint} field="phone" value={c.telefono} placeholder="+ teléfono" />
              </Td>
              <Td className="text-sm">
                <InlineEdit endpoint={endpoint} field="email" value={c.email} placeholder="+ email" />
              </Td>
              <Td className="text-center text-sm">
                {c.mandatos > 0 ? <Badge variant="default">{c.mandatos}</Badge> : <span className="text-muted-foreground/40">—</span>}
              </Td>
              <Td className="text-center text-sm">
                {c.boletos > 0 ? <Badge variant="primary">{c.boletos}</Badge> : <span className="text-muted-foreground/40">—</span>}
              </Td>
              <Td className="text-center text-sm">
                {c.vehiculos > 0 ? c.vehiculos : <span className="text-muted-foreground/40">—</span>}
              </Td>
              <Td className="text-sm text-muted-foreground">{c.ultimoContacto ?? "—"}</Td>
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
                      href={`https://wa.me/${c.telefono.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="WhatsApp"
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
