"use client";

import { Badge, ButtonLink, Card } from "@/components/ui";
import type { MktConfigView } from "@/lib/marketing/meta";

/** Estado de la conexión con Meta + botones conectar/reconectar. */
export function ConexionMeta({
  config,
  metaOk,
  metaError,
}: {
  config: MktConfigView;
  metaOk: boolean;
  metaError: string | null;
}) {
  return (
    <div className="space-y-2">
      {metaOk ? (
        <div className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          ✅ Cuenta de Meta conectada
        </div>
      ) : null}
      {metaError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Meta devolvió un error: {metaError}
        </div>
      ) : null}

      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden>
            {config.connected ? "🟢" : "⚪"}
          </span>
          <div>
            {config.connected ? (
              <>
                <p className="text-sm font-medium">
                  {config.pageName ?? "Página conectada"}
                  {config.igUsername ? (
                    <span className="text-muted-foreground"> · @{config.igUsername}</span>
                  ) : null}
                </p>
                <p className="text-xs text-muted-foreground">
                  {config.expiresAt
                    ? `Token válido hasta ${new Date(config.expiresAt).toLocaleDateString("es-AR")}`
                    : "Token de página activo"}
                  {config.adsReady ? " · Ads habilitados" : ""}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium">Meta sin conectar</p>
                <p className="text-xs text-muted-foreground">
                  Podés armar y programar todo igual; para publicar de verdad, conectá la cuenta.
                </p>
              </>
            )}
          </div>
          {config.adsReady ? <Badge variant="success">Ads OK</Badge> : null}
        </div>
        <div className="flex gap-2">
          <ButtonLink
            href="/api/admin/marketing/meta/connect"
            variant={config.connected ? "secondary" : "primary"}
            size="sm"
          >
            {config.connected ? "Reconectar" : "Conectar Meta"}
          </ButtonLink>
          <ButtonLink href="/api/admin/marketing/meta/connect?withAds=1" variant="ghost" size="sm">
            Conectar con Ads
          </ButtonLink>
          <ButtonLink href="/admin/marketing/ads" variant="secondary" size="sm">
            📢 Meta Ads →
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}
