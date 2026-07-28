#!/bin/bash
# Agente diario de leads de Cauce — corre con la cuenta Max vía claude CLI.
# Guardián horario: SOLO corre entre las 3 y las 7 AM. Si la Mac estaba dormida
# y launchd lo dispara al despertar (9am, 14hs...), se saltea el día para no
# comerle la ventana de 5 horas a Fran.
HORA=$(date +%H)
LOG="$HOME/Library/Logs/cauce-lead-agent.log"
if [ "$HORA" -lt 3 ] || [ "$HORA" -ge 7 ]; then
  echo "$(date) — fuera de ventana nocturna (hora $HORA), salteo el día" >> "$LOG"
  exit 0
fi
cd "/Users/juanfri/Desktop/CAUCE FABLE/cauce" || exit 1
# Bandera del admin: si Fran lo apagó desde /admin/leads, no corre.
ESTADO=$(PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH" npx tsx --env-file=.env -e "import{db}from'./src/lib/db';db.bandera.findUnique({where:{clave:'agente-leads'}}).then(b=>{console.log(b&&!b.activa?'PAUSADO':'ACTIVO');process.exit(0)}).catch(()=>{console.log('ACTIVO');process.exit(0)})" 2>/dev/null | tail -1)
if [ "$ESTADO" = "PAUSADO" ]; then
  echo "$(date) — agente PAUSADO desde el admin, no corro" >> "$LOG"
  exit 0
fi
echo "═══ $(date) — corrida del agente de leads ═══" >> "$LOG"
PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH" claude -p "$(cat scripts/agente-leads-prompt.md)" \
  --dangerously-skip-permissions \
  >> "$LOG" 2>&1
echo "─── fin $(date) (exit $?) ───" >> "$LOG"
