#!/usr/bin/env bash
# =============================================================================
# simular-todos.sh — "foto --simular" en todos los proyectos del servidor
# =============================================================================
#
# Solo mira: no crea commits, no sube nada y no toca archivos de ningún
# proyecto. Corre git-vps.sh foto --simular en cada carpeta, uno por uno y con
# baja prioridad, y junta todo en un único informe para pasarle a Claude.
#
# USO (como root, con git-vps.sh en la misma carpeta que este script)
#   bash simular-todos.sh                 todos los de la lista de abajo
#   bash simular-todos.sh CARPETA...      solo esas carpetas
# =============================================================================
set -u

AQUI="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="$AQUI/git-vps.sh"
[ -s "$SCRIPT" ] || { echo "Falta $SCRIPT: bajalo primero (ver docs/GIT-GUIA.md, Paso 1)." >&2; exit 1; }

# Proyectos con git y conectados con GitHub (según el diagnóstico del 27/09/2026).
# La tienda (/var/www/nexovet-shop) ya está hecha y no hace falta.
PROYECTOS=(
  /var/www/centro-comando
  /opt/chatbotLamascotera
  /var/www/landigia
  /var/www/landing-general
  /var/www/landing-lamascotera-preview
  /var/www/logistica-system
  /var/www/mi-franquicia
  /var/www/milegajo
  /var/www/portal-vendedores
  /var/www/sistema-finanzas
  /var/www/sistema-rrhh
  /var/www/club-mascotera
  /var/www/crm-cerebro
  /var/www/landing-lamascotera
  /var/www/mi-sucursal
  /var/www/sistema-compras
  /opt/sistema_compras
)
[ $# -gt 0 ] && PROYECTOS=("$@")

umask 077
INFORME="${TMPDIR:-/tmp}/simular-todos-$(date +%Y%m%d-%H%M).txt"
{ echo "Simulación de fotos — $(date '+%Y-%m-%d %H:%M') — $(hostname)"
  echo "(Solo lectura: no se creó ningún commit ni se subió nada.)"; } > "$INFORME" \
  || { echo "No pude crear $INFORME" >&2; exit 1; }

echo "Revisando ${#PROYECTOS[@]} proyecto(s), de a uno. Puede tardar varios minutos."
echo
for d in "${PROYECTOS[@]}"; do
  printf '  %-42s ' "$d"
  if [ ! -d "$d" ]; then
    echo "no existe"; printf '\n#### %s: no existe\n' "$d" >> "$INFORME"; continue
  fi
  if [ ! -e "$d/.git" ]; then
    echo "sin git (primero: iniciar)"; printf '\n#### %s: sin git\n' "$d" >> "$INFORME"; continue
  fi
  if [ -z "$(git -c safe.directory="$d" -C "$d" remote 2>/dev/null)" ]; then
    echo "sin GitHub (primero: iniciar)"; printf '\n#### %s: tiene git pero no GitHub\n' "$d" >> "$INFORME"; continue
  fi
  salida="$(timeout 1800 bash "$SCRIPT" foto "$d" --simular </dev/null 2>&1)"; rc=$?
  detalle="$(printf '%s\n' "$salida" | sed -n 's/.*Detalle completo guardado en: //p' | tail -1)"
  { printf '\n################################################################\n'
    printf '#### %s (código de salida %s)\n' "$d" "$rc"
    printf '%s\n' "$salida"
    if [ -n "$detalle" ] && [ -f "$detalle" ]; then
      printf '\n---- detalle completo ----\n'; cat "$detalle"
    fi; } >> "$INFORME"
  if [ "$rc" -ne 0 ]; then echo "ERROR (ver informe)"
  elif printf '%s' "$salida" | grep -q 'es PÚBLICO'; then echo "OJO: el repositorio de GitHub es PÚBLICO"
  elif printf '%s' "$salida" | grep -q 'se va a frenar por las alertas'; then echo "tiene alertas graves"
  elif printf '%s' "$salida" | grep -q 'No hay nada nuevo'; then echo "igual a GitHub"
  else echo "ok"; fi
done

[ -n "${SUDO_USER:-}" ] && chown "$SUDO_USER" "$INFORME" 2>/dev/null
echo
echo "Listo. Informe completo: $INFORME"
echo "Bajalo a tu PC (en PowerShell):  scp nexovet:$INFORME ."
echo "y pasáselo a Claude."
