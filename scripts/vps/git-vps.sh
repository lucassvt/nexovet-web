#!/usr/bin/env bash
# =============================================================================
# git-vps.sh — Guardar en GitHub el código del servidor sin romper nada
# =============================================================================
#
# Sirve para cualquier proyecto del servidor (la tienda, Express, logística…).
# Este script NUNCA modifica ni borra archivos del sistema en vivo.
# Lo que escribe va dentro de la carpeta oculta .git (el historial) o en una
# carpeta temporal. Única excepción: "alinear" y "guardar" pueden traer de
# GitHub documentación (docs/, scripts/vps/, archivos .md de la raíz), siempre
# que el servidor no la haya modificado. Traer cambios de código de GitHub al
# servidor (un "deploy") NO lo hace este script: se hace acompañado.
#
# Nunca sube el historial local tal cual: cada foto o guardado es un único
# cambio, revisado, encima de lo que GitHub ya tiene.
#
# MODOS
#   estado    Cómo está el proyecto comparado con GitHub. Solo lectura.
#
#   foto      Sube una "foto" de TODOS los archivos, tal como están ahora, a
#             una rama NUEVA de GitHub (vps/foto-FECHA) para revisarla y
#             convertirla en la versión oficial (main). Se usa hasta alinear.
#
#   alinear   Una sola vez, después de que la foto se aprobó en main:
#             conecta el servidor con main sin modificar archivos.
#
#   guardar   El día a día (después de alinear): guarda los cambios del
#             servidor como un commit en main y lo sube a GitHub.
#
#   iniciar   Para un proyecto que todavía no está en GitHub: crea la carpeta
#             oculta .git si no existe (no toca ningún archivo) y la conecta
#             con un repositorio PRIVADO nuevo de GitHub (--url), creado con
#             README. Después: foto.
#
# USO
#   bash git-vps.sh <modo> [carpeta] [opciones]
#   (sin carpeta, usa /var/www/nexovet-shop)
#
# OPCIONES
#   --simular            Todo el análisis, sin crear commits ni subir nada.
#   --mensaje "texto"    Qué cambiaste (para guardar).
#   --autor "Nombre <mail>"
#   --excluir PATRON     No subir lo que coincida (sintaxis .gitignore, por
#                        ejemplo 'clientes.csv' o 'backend/src/tmp/'). Se
#                        puede repetir. Queda recordado para las próximas veces.
#   --incluir RUTA       Incluir una carpeta o archivo que el .gitignore del
#                        proyecto deja afuera por error (por ejemplo
#                        'frontend/app/(dashboard)/documents/'). La lista de
#                        exclusiones de este script se sigue aplicando adentro.
#                        Queda recordado para las próximas veces.
#   --ignorar-alertas    Seguir aunque se detecten posibles contraseñas.
#                        Solo después de revisar que son falsas alarmas.
#   --permitir-publico   Subir aunque el repositorio de GitHub sea público.
#   --rama NOMBRE        (foto) Nombre de la rama nueva.
#   --remoto NOMBRE      Remoto de git (por defecto: origin).
#   --url DIRECCIÓN      (iniciar) Repositorio nuevo de GitHub, por ejemplo
#                        https://github.com/lucassvt/express
#   --si                 No pedir la confirmación final (las de seguridad
#                        se piden igual).
#
# EJEMPLOS
#   bash git-vps.sh estado
#   bash git-vps.sh foto --simular
#   bash git-vps.sh foto
#   bash git-vps.sh alinear
#   bash git-vps.sh guardar --autor "Lourdes <mail@ejemplo.com>" --mensaje "Banner de envíos"
# =============================================================================

set -uo pipefail

VERSION="2.6"
DIR_POR_DEFECTO="/var/www/nexovet-shop"
: "${HOME:=$(getent passwd "$(id -un)" 2>/dev/null | cut -d: -f6)}"
export HOME

# ---------------------------------------------------------------------------
# Opciones
# ---------------------------------------------------------------------------
MODO=""; DIR=""; SIMULAR=0; SI=0; IGNORAR_ALERTAS=0; PERMITIR_PUBLICO=0
MENSAJE=""; AUTOR=""; RAMA_NUEVA=""; REMOTO="origin"; URL_NUEVA=""
EXCLUIR_EXTRA=(); INCLUIR_EXTRA=()

ayuda() { awk 'NR>1 && !/^#/{exit} NR>1{sub(/^# ?/,""); print}' "$0"; }
valor() {
  if [ $# -lt 2 ] || [ -z "$2" ]; then
    echo "Falta el valor de $1 (ver: bash $0 --help)" >&2; exit 2
  fi
}

while [ $# -gt 0 ]; do
  case "$1" in
    estado|foto|alinear|guardar|iniciar) MODO="$1"; shift ;;
    actualizar)
      echo "Traer código de GitHub al servidor es un deploy y se hace acompañado (pedíselo a Claude). Este script no lo hace." >&2
      exit 2 ;;
    --simular) SIMULAR=1; shift ;;
    --si) SI=1; shift ;;
    --ignorar-alertas) IGNORAR_ALERTAS=1; shift ;;
    --permitir-publico) PERMITIR_PUBLICO=1; shift ;;
    --mensaje) valor "$@"; MENSAJE="$2"; shift 2 ;;
    --autor)   valor "$@"; AUTOR="$2"; shift 2 ;;
    --rama)    valor "$@"; RAMA_NUEVA="$2"; shift 2 ;;
    --remoto)  valor "$@"; REMOTO="$2"; shift 2 ;;
    --url)     valor "$@"; URL_NUEVA="$2"; shift 2 ;;
    --excluir) valor "$@"; EXCLUIR_EXTRA+=("$2"); shift 2 ;;
    --incluir) valor "$@"; INCLUIR_EXTRA+=("$2"); shift 2 ;;
    -h|--help|ayuda) ayuda; exit 0 ;;
    --version) echo "git-vps.sh $VERSION"; exit 0 ;;
    -*) echo "Opción desconocida: $1 (ver: bash $0 --help)" >&2; exit 2 ;;
    *) if [ -z "$DIR" ]; then DIR="$1"; shift; else echo "Argumento de más: $1" >&2; exit 2; fi ;;
  esac
done
if [ -z "$MODO" ]; then
  [ -n "$DIR" ] && echo "Falta el modo, o '$DIR' no es un modo válido (estado, foto, alinear, guardar, iniciar)." >&2
  ayuda; exit 2
fi
[ -n "$DIR" ] || DIR="$DIR_POR_DEFECTO"

# ---------------------------------------------------------------------------
# Presentación (7 y 8 = la terminal, para que los avisos siempre se vean)
# ---------------------------------------------------------------------------
exec 7>&1 8>&2
if [ -t 1 ]; then
  ROJO=$'\e[31m'; VERDE=$'\e[32m'; AMARILLO=$'\e[33m'; NEGRITA=$'\e[1m'; NORMAL=$'\e[0m'
else
  ROJO=""; VERDE=""; AMARILLO=""; NEGRITA=""; NORMAL=""
fi
info()  { printf '%s\n' "$*"; }
paso()  { printf '\n%s== %s ==%s\n' "$NEGRITA" "$*" "$NORMAL"; }
ok()    { printf '%s✔ %s%s\n' "$VERDE" "$*" "$NORMAL"; }
aviso() { printf '%s⚠ %s%s\n' "$AMARILLO" "$*" "$NORMAL"; }
error() { printf '%s✖ %s%s\n' "$ROJO" "$*" "$NORMAL" >&2; }
morir() { error "$*"; exit 1; }
# Cómo se escribe un comando de este script para ESTE proyecto (siempre con la carpeta)
comando() { printf 'bash %s %s %s' "$0" "$1" "$DIR"; }
# Mensaje al cancelar una confirmación, fiel a lo que ya pasó
cancelar() {
  if [ "$TOCO_GIT" = 1 ]; then
    morir "Cancelado. No se subió nada. (El servidor ya se había puesto al día con GitHub sin tocar archivos del sistema.)"
  fi
  if [ "$DOCS_ESCRITOS" = 1 ]; then
    morir "Cancelado. No se subió nada. (Se había actualizado documentación que venía de GitHub; ningún otro archivo se tocó.)"
  fi
  morir "Cancelado. No se hizo nada."
}

# preguntar "texto" PALABRA → 0 solo si el usuario escribe PALABRA (--si la saltea)
preguntar() {
  [ "$SI" = 1 ] && return 0
  [ -t 0 ] || morir "Hace falta confirmar pero no hay una terminal interactiva. Si estás seguro, usá --si."
  local r; read -r -p "$1 " r; r="${r//[[:space:]]/}"; [ "${r^^}" = "$2" ]
}
# Igual, pero --si NO la saltea (confirmaciones de seguridad).
preguntar_seguridad() {
  [ -t 0 ] || return 1
  local r; read -r -p "$1 " r; r="${r//[[:space:]]/}"; [ "${r^^}" = "$2" ]
}

# Nunca pedir usuario/contraseña de GitHub por teclado (GitHub no acepta
# contraseñas y lo tipeado podría quedar en el historial de la consola).
export GIT_TERMINAL_PROMPT=0 GIT_PAGER=cat PAGER=cat

ARBOL_VACIO="4b825dc642cb6eb9a060e54bf8d69288fbee4904"
SELLO="$(date +%Y%m%d-%H%M%S)"
TMPD=""; GITDIR=""; ARREGLAR_DUENO=0; DUENO_GIT=""; DUENO_DIR=""; PASO=""
ALT_ORIG="${GIT_ALTERNATE_OBJECT_DIRECTORIES:-}"
CUARENTENA=""; TOCO_GIT=0; DOCS_ESCRITOS=0; ESCRIBIENDO=""
# Baja prioridad de CPU y disco, para no afectar al sistema mientras corre
BAJA=(nice -n 15); command -v ionice >/dev/null 2>&1 && BAJA+=(ionice -c3)

# git con protecciones: sin hooks (podrían modificar archivos), sin fsmonitor,
# sin autostash, sin mantenimiento automático, sin índice dividido.
g() {
  git -c safe.directory="$DIR" -c core.hooksPath=/dev/null -c core.fsmonitor=false \
      -c core.quotePath=false -c merge.autoStash=false -c rebase.autoStash=false \
      -c gc.auto=0 -c maintenance.auto=false -c core.splitIndex=false \
      -c splitIndex.sharedIndexExpire=never -c core.bigFileThreshold=16m --no-pager -C "$DIR" "$@"
}
# git con un índice temporal propio (el del servidor no se toca)
gi() { GIT_INDEX_FILE="$TMPD/indice" g "$@"; }
# SSH que nunca se queda esperando una respuesta por teclado
ssh_sin_preguntas() {
  local base="${GIT_SSH_COMMAND:-$(g config --get core.sshCommand 2>/dev/null || echo ssh)}"
  printf '%s -o BatchMode=yes -o ConnectTimeout=15' "$base"
}
sonda() { GIT_SSH_COMMAND="$(ssh_sin_preguntas)" timeout --foreground 45 git -c safe.directory="$DIR" -C "$DIR" "$@"; }

limpiar() {
  local s=$?
  trap '' INT TERM HUP   # que un segundo Ctrl-C no deje la limpieza a medias
  [ -n "$CUARENTENA" ] && rm -rf -- "${CUARENTENA:?}"
  [ -n "$ESCRIBIENDO" ] && rm -f -- "${ESCRIBIENDO:?}"
  if [ "$ARREGLAR_DUENO" = 1 ] && [ -n "$GITDIR" ] && [ -n "$DUENO_GIT" ] && [ -e "$TMPD/inicio" ]; then
    # Lo que root creó dentro de .git vuelve al dueño (sin seguir enlaces)
    find "$GITDIR" -xdev \( -uid 0 -o -gid 0 \) ! -type l -newer "$TMPD/inicio" \
      -exec chown -h "$DUENO_GIT" {} + 2>/dev/null || true
    # Archivos nuevos que se agregaron al proyecto (documentación)
    if [ -s "$TMPD/escritos.txt" ] && [ -n "$DUENO_DIR" ]; then
      while IFS= read -r p; do
        [ -n "$p" ] && chown -h -R "$DUENO_DIR" -- "$DIR/$p" 2>/dev/null || true
      done < "$TMPD/escritos.txt"
    fi
  fi
  [ -n "$TMPD" ] && rm -rf "$TMPD"
  exit $s
}
al_cancelar() {
  {
    echo
    case "$PASO" in
      rama)     error "Cancelado mientras se movía la rama de git (ningún archivo del sistema se tocó). Corré: $(comando estado) y pasale la salida a Claude." ;;
      commit)   if [ -n "$COMMIT" ] && [ -n "${RAMA_SUBIENDO:-}" ] && \
                   [ "$(sonda ls-remote "$REMOTO" "refs/heads/$RAMA_SUBIENDO" 2>/dev/null | awk '{print $1}')" = "$COMMIT" ]; then
                  error "Cancelado, pero GitHub YA recibió los cambios. Ningún archivo del sistema se tocó. Corré de nuevo '$(comando guardar)' para terminar."
                else
                  error "Cancelado durante la subida. Ningún archivo del sistema se tocó. Corré de nuevo: $(comando guardar)"
                fi ;;
      escribir) error "Cancelado mientras se agregaba documentación que venía de GitHub. Ningún otro archivo se tocó. Corré: $(comando estado)" ;;
      *)        if [ "$TOCO_GIT" = 1 ]; then
                  error "Cancelado. No se subió nada. (El servidor ya se había puesto al día con GitHub sin tocar archivos del sistema.)"
                elif [ "$DOCS_ESCRITOS" = 1 ]; then
                  error "Cancelado. No se subió nada. (Se había actualizado documentación que venía de GitHub; ningún otro archivo se tocó.)"
                else
                  error "Cancelado por el usuario. No se cambió ningún archivo del sistema."
                fi ;;
    esac
  } >&7 2>&8
  exit 130
}
trap limpiar EXIT
trap al_cancelar INT TERM HUP

# ---------------------------------------------------------------------------
# Lo que NUNCA se sube desde el servidor (vale para archivos que todavía no
# estaban en git; los que ya estaban se siguen guardando y se revisan aparte).
# ---------------------------------------------------------------------------
EXCLUSIONES_BASE='
# --- Credenciales y configuración local ---
.env*
*.env
env.backup*
!.env.template
!.env.example
!.env.sample
*.pem
*.key
*.crt
*.p12
*.pfx
*.jks
*.keystore
*.ppk
id_rsa*
id_dsa*
id_ecdsa*
id_ed25519*
.git-credentials
.netrc
.pgpass
.htpasswd
credentials*.json
*credentials*.json
*service-account*.json
*service_account*.json
client_secret*.json
secrets/
.secrets/
.npmrc
.claude/settings.local.json
CLAUDE.local.md
.*_history
.viminfo
.lesshst
# --- Dependencias y compilados (se regeneran) ---
node_modules/
__pycache__/
*.pyc
*.pyo
venv/
.venv/
env/
*.egg-info/
.pytest_cache/
.mypy_cache/
.ruff_cache/
celerybeat-schedule*
.gradle/
android/app/build/
android/.gradle/
ios/Pods/
out/
.next/
.medusa/
dist/
build/
.turbo/
.cache/
.parcel-cache/
.swc/
.vercel/
.eslintcache
.pnpm-store/
.yarn/cache/
.yarn/unplugged/
.yarn/install-state.gz
.pnp.*
coverage/
test-results/
playwright-report/
*.tsbuildinfo
next-env.d.ts
# --- Archivos subidos por usuarios / generados ---
uploads/
/backend/static/
/backend/private/
# --- Bases de datos, volcados y exportaciones (pueden tener datos de clientes) ---
*.rdb
*.dump
*.sql.gz
*.sql.zip
*.sql.bz2
*dump*.sql
*backup*.sql
/*.sql
/backend/*.sql
/backend-storefront/*.sql
*.sqlite
*.sqlite3
*.db
*.db-journal
*.db-wal
*.db-shm
*.csv
*.tsv
*.xls
*.xlsx
*.ods
# --- Comprimidos y respaldos ---
*.tar
*.tar.gz
*.tgz
*.gz
*.zip
*.rar
*.7z
/backups/
/backup/
# --- Copias hechas a mano mientras se edita en vivo ---
*.bak
*.bak.*
*.bak-*
*.bak_*
*.bak[0-9]*
*.bk
*.bk-*
*.bk_*
*.orig-*
*.orig_*
*.old-*
*.old_*
*.deprecated
.git-vps-*
*.old
*.orig
*.rej
*.save
*.swp
*.swo
*~
*.tmp
*.backup
*.backup.*
*-copy.*
*_copy.*
* copy.*
* (copy)*
* - copia*
* - Copia*
*.backup*/
*-backup*/
*_backup*/
*.bak/
*.old/
.history/
/tmp/
.tmp/
# --- Logs, procesos y basura ---
*.log
/logs/
/backend/logs/
/backend-storefront/logs/
nohup.out
*.pid
.pm2/
.DS_Store
Thumbs.db
desktop.ini
.idea/
.vscode/
'


# ---------------------------------------------------------------------------
# Preparación y chequeos comunes
# ---------------------------------------------------------------------------
preparar() {
  command -v git >/dev/null 2>&1 || morir "git no está instalado en este servidor."
  [ -d "$DIR" ] || morir "No existe la carpeta $DIR"
  DIR="$(cd "$DIR" && pwd -P)"
  local out
  if ! out="$(g rev-parse --show-toplevel 2>&1)"; then
    if printf '%s' "$out" | grep -qi 'dubious ownership\|unsafe repository'; then
      morir "git no confía en esta carpeta porque su dueño es otro usuario ('$(stat -c %U "$DIR" 2>/dev/null)').
   Solución (agrega una línea a tu configuración de git; no toca el proyecto):
       git config --global --add safe.directory $DIR
   y volvé a correr el mismo comando."
    fi
    morir "La carpeta $DIR no es un repositorio git (o git no la puede leer):
   $out
   → Mandale la salida de diagnostico.sh a Claude para armarlo con cuidado."
  fi
  if [ "$out" != "$DIR" ]; then info "(Uso la raíz del repositorio: $out)"; DIR="$out"; fi
  GITDIR="$(g rev-parse --absolute-git-dir)"
  local f
  for f in MERGE_HEAD rebase-merge rebase-apply CHERRY_PICK_HEAD REVERT_HEAD BISECT_LOG; do
    [ -e "$GITDIR/$f" ] && morir "Hay una operación de git a medio terminar ($f). No sigo para no empeorar nada. Pasale esta salida a Claude."
  done
  g remote get-url "$REMOTO" >/dev/null 2>&1 || morir "No existe el remoto '$REMOTO'. Remotos configurados: $(g remote | tr '\n' ' ')"
  # URL tal como está configurada (sin reescrituras insteadOf), para reconocer GitHub
  URL_REMOTO="$(g config --get "remote.$REMOTO.url" 2>/dev/null || g remote get-url "$REMOTO")"

  DUENO_GIT="$(stat -c %u:%g "$GITDIR")"
  DUENO_DIR="$(stat -c %u:%g "$DIR")"
  if [ "$(id -u)" != "${DUENO_GIT%%:*}" ]; then
    if [ "$(id -u)" = 0 ]; then
      [ "$MODO" = estado ] || ARREGLAR_DUENO=1
    elif [ "$MODO" != estado ] && [ ! -w "$GITDIR/objects" ]; then
      morir "No tenés permiso de escritura en $GITDIR (es de '$(stat -c %U "$GITDIR")'). Corré el script como ese usuario."
    fi
  fi

  TMPD="$(mktemp -d "${TMPDIR:-/tmp}/git-vps.XXXXXX")" || morir "No pude crear una carpeta temporal"
  touch -d '2 seconds ago' "$TMPD/inicio" 2>/dev/null || touch "$TMPD/inicio"
  : > "$TMPD/escritos.txt"

  [ "$MODO" = estado ] && return 0

  local libre
  libre="$(df -Pk "$TMPD" | awk 'NR==2{print $4}')"
  [ -n "$libre" ] && [ "$libre" -lt 262144 ] && morir "Queda poco espacio en ${TMPDIR:-/tmp} ($((libre/1024)) MB). Liberá espacio antes de seguir."
  libre="$(df -Pk "$GITDIR" | awk 'NR==2{print $4}')"
  [ -n "$libre" ] && [ "$libre" -lt 512000 ] && morir "Queda poco espacio en disco ($((libre/1024)) MB). Liberá espacio antes de seguir."

  # Candado: dos personas no pueden correr el script a la vez
  if command -v flock >/dev/null 2>&1; then
    local candado="$GITDIR/git-vps.lock"
    [ -e "$candado" ] || ( umask 022; : >> "$candado" ) 2>/dev/null
    { exec 9<"$candado"; } 2>/dev/null || morir "No pude abrir el candado $candado (permisos). Avisale a Claude."
    if ! flock -n 9; then
      info "Otra persona está usando el script en este momento; espero hasta 1 minuto…"
      flock -w 60 9 || morir "Sigue ocupado. Probá de nuevo cuando la otra persona termine. No se hizo nada."
    fi
  fi
  # Restos de una ejecución anterior que se cortó de golpe (el candado asegura que no hay otra corriendo)
  find "$GITDIR/objects" -maxdepth 1 -name 'incoming-git-vps-*' -mmin +60 -exec rm -rf {} + 2>/dev/null
  [ -e "$GITDIR/index.lock" ] && morir "Existe $GITDIR/index.lock: alguien está usando git en este momento (o quedó colgado).
   Esperá un minuto y reintentá. Si nadie está usando git y persiste, avisale a Claude."
  return 0
}

# Si una ejecución anterior no pudo refrescar el índice, se arregla ahora.
reparar_indice_pendiente() {
  if [ -e "$GITDIR/git-vps-indice-pendiente" ] && [ ! -e "$GITDIR/index.lock" ]; then
    g reset -q && rm -f "$GITDIR/git-vps-indice-pendiente" && info "(Índice de git refrescado: había quedado pendiente de la vez anterior.)"
  fi
  return 0
}

esta_alineado() { [ "$(g config --get nexovetgit.alineado 2>/dev/null)" = "1" ]; }

# Rama principal de GitHub y si el repositorio es público
SLUG=""; VISIBILIDAD="desconocida"; RAMA_PPAL=""
consultar_github() {
  local u; u="$(printf '%s' "$URL_REMOTO" | sed -E 's#/+$##; s#\.git$##')"
  case "$u" in
    *github.com[:/]*) SLUG="$(printf '%s' "$u" | sed -E 's#^.*github\.com(:[0-9]+)?[:/]+##')" ;;
    *://*github*/*/*) SLUG="$(printf '%s' "$u" | sed -E 's#^[a-z+]+://[^/]+/##')" ;;
    *github*:*/*)     SLUG="$(printf '%s' "$u" | sed -E 's#^[^:]*:##')" ;;
  esac
  [[ "$SLUG" =~ ^[A-Za-z0-9-]+/[A-Za-z0-9._-]+$ ]] || SLUG=""
  local ls
  if ls="$(sonda ls-remote --symref "$REMOTO" HEAD 2>/dev/null)"; then
    RAMA_PPAL="$(printf '%s\n' "$ls" | awk '/^ref:/{sub("refs/heads/","",$2); print $2; exit}')"
  else
    aviso "No pude consultar GitHub (sin conexión, faltan credenciales o es la primera conexión por SSH). Ver docs/GIT-GUIA.md → 'Credenciales'."
  fi
  if [ -z "$RAMA_PPAL" ]; then
    RAMA_PPAL="$(g symbolic-ref -q --short "refs/remotes/$REMOTO/HEAD" 2>/dev/null | sed "s#^$REMOTO/##")"
  fi
  [ -n "$RAMA_PPAL" ] || RAMA_PPAL="main"
  if [ -n "$SLUG" ] && command -v curl >/dev/null 2>&1; then
    local api web
    api="$(curl -s -m 10 -o /dev/null -w '%{http_code}' "https://api.github.com/repos/$SLUG" 2>/dev/null || true)"
    web="$(curl -s -m 10 -o /dev/null -w '%{http_code}' "https://github.com/$SLUG.git/info/refs?service=git-upload-pack" 2>/dev/null || true)"
    if [ "$api" = 200 ] || [ "$web" = 200 ]; then
      VISIBILIDAD="publico"
    elif [ "$api" = 404 ] && { [ "$web" = 401 ] || [ "$web" = 404 ]; }; then
      VISIBILIDAD="privado"
    fi
  fi
}

exigir_privado() {
  case "$VISIBILIDAD" in
    publico)
      if [ "$PERMITIR_PUBLICO" = 1 ]; then
        aviso "El repositorio $SLUG es PÚBLICO y elegiste subir igual (--permitir-publico)."
      else
        morir "El repositorio $SLUG es PÚBLICO: cualquier persona en internet puede ver lo que se suba.
   Antes de subir el código del servidor, hacelo privado:
     GitHub → repositorio → Settings → General → abajo de todo 'Danger Zone'
     → 'Change repository visibility' → Private.
   Después volvé a correr este mismo comando. No se subió nada."
      fi ;;
    privado) ok "El repositorio de GitHub es privado." ;;
    *)
      if [ "$PERMITIR_PUBLICO" = 1 ]; then
        aviso "No pude verificar si el repositorio es público o privado; sigo porque usaste --permitir-publico."
      else
        aviso "No pude verificar si el repositorio de GitHub es público o privado."
        preguntar_seguridad "¿Confirmás que el repositorio es PRIVADO? Escribí SI para seguir:" SI \
          || morir "Cancelado. No se hizo nada. (Sin terminal interactiva: verificá a mano y usá --permitir-publico.)"
      fi ;;
  esac
}

explicar_error_red() {
  local f="$1"
  if grep -qi 'Host key verification failed' "$f"; then
    error "Es la primera conexión por SSH: corré una vez  ssh -T git@github-nexovet  (o el host que uses) y respondé yes."
  elif grep -qi 'Could not resolve hostname github-' "$f"; then
    error "Este usuario ($(id -un)) no tiene el bloque 'Host github-…' en ~/.ssh/config: hacé el paso de credenciales de la guía como este usuario."
  elif grep -qi 'could not resolve host\|network is unreachable\|timed out\|connection refused\|connection reset\|no route to host' "$f"; then
    error "Parece un problema de conexión a internet. Probá de nuevo en un rato."
  elif grep -qi 'read only\|write access to repository not granted' "$f"; then
    error "La deploy key no tiene permiso de escritura: en GitHub → Settings → Deploy keys, agregala de nuevo tildando 'Allow write access'."
  elif grep -qi 'Repository not found' "$f"; then
    error "GitHub no encuentra el repositorio con estas credenciales (¿la clave está cargada en ese repositorio? ¿la URL del remoto es correcta?)."
  elif grep -qi 'authentication\|permission denied\|403\|could not read username\|terminal prompts disabled\|could not read from remote' "$f"; then
    error "GitHub no aceptó las credenciales del servidor. Ver docs/GIT-GUIA.md → 'Credenciales'."
  fi
  return 0
}

traer_de_github() {
  info "Consultando GitHub (git fetch: solo descarga información, no toca archivos)…"
  if ! GIT_SSH_COMMAND="$(ssh_sin_preguntas)" g fetch --quiet --prune "$REMOTO" > "$TMPD/fetch.log" 2>&1; then
    sed -E 's#(://[^:/@[:space:]]+:)[^@[:space:]]+@#\1****@#g; s/^/    /' "$TMPD/fetch.log"
    explicar_error_red "$TMPD/fetch.log"
    morir "No pude conectarme con GitHub. No se hizo nada."
  fi
}

# ---------------------------------------------------------------------------
# Exclusiones (las base + las pedidas con --excluir, que quedan recordadas)
# ---------------------------------------------------------------------------
cargar_exclusiones() {
  local f="$TMPD/excluir" rec="$GITDIR/git-vps-excluir" ext
  printf '%s\n' "$EXCLUSIONES_BASE" > "$f" || morir "No pude preparar la lista de exclusiones."
  # -c core.excludesFile reemplaza al del usuario: se incorpora a mano
  ext="$(g config --get core.excludesFile 2>/dev/null || true)"
  ext="${ext/#\~/$HOME}"
  [ -z "$ext" ] && ext="${XDG_CONFIG_HOME:-$HOME/.config}/git/ignore"
  [ -r "$ext" ] && { echo "# --- exclusiones del usuario ---"; cat "$ext"; } >> "$f"
  : > "$TMPD/excl_extra"
  [ -s "$rec" ] && cat "$rec" >> "$TMPD/excl_extra"
  if [ "${#EXCLUIR_EXTRA[@]}" -gt 0 ]; then
    local i pat
    for i in "${!EXCLUIR_EXTRA[@]}"; do
      pat="${EXCLUIR_EXTRA[$i]}"
      case "$pat" in
        "$DIR"/*) pat="/${pat#"$DIR"/}" ;;                      # ruta absoluta dentro del proyecto
        /*) [ -e "$DIR$pat" ] || [ -e "$DIR/${pat#/}" ] || morir "--excluir '$pat': esa ruta no está dentro de $DIR. Usá una ruta relativa al proyecto, por ejemplo 'backend/src/clientes.csv'." ;;
        ./*) pat="/${pat#./}" ;;
      esac
      EXCLUIR_EXTRA[$i]="$pat"
    done
    printf '%s\n' "${EXCLUIR_EXTRA[@]}" >> "$TMPD/excl_extra"
  fi
  sed -i '/^[[:space:]]*$/d' "$TMPD/excl_extra"
  if [ -s "$TMPD/excl_extra" ]; then
    { echo "# --- pedidas con --excluir ---"; cat "$TMPD/excl_extra"; } >> "$f"
  fi
  [ -s "$rec" ] && info "(Sigo excluyendo lo que se pidió antes con --excluir: $(tr '\n' ' ' < "$rec"))"
  # Si faltara el archivo, git no avisaría y subiría todo
  [ -s "$f" ] || morir "No pude preparar la lista de exclusiones."
  cargar_inclusiones
}

# Rutas que el .gitignore del proyecto deja afuera por error (--incluir, recordadas)
cargar_inclusiones() {
  local rec="$GITDIR/git-vps-incluir" i pat real
  : > "$TMPD/incluir"
  [ -s "$rec" ] && cat "$rec" >> "$TMPD/incluir"
  for i in "${!INCLUIR_EXTRA[@]}"; do
    pat="${INCLUIR_EXTRA[$i]}"
    case "$pat" in
      "$DIR"/*) pat="${pat#"$DIR"/}" ;;
      ./*) pat="${pat#./}" ;;
      /*) morir "--incluir '$pat': usá una ruta relativa al proyecto, por ejemplo 'frontend/app/documents/'." ;;
    esac
    pat="${pat%/}"
    real="$(realpath -m -- "$DIR/$pat" 2>/dev/null)"
    case "$real" in
      "$DIR"/.git|"$DIR"/.git/*) morir "--incluir '$pat': no se puede incluir la carpeta .git." ;;
      "$DIR"/*) ;;
      *) morir "--incluir '$pat': esa ruta no está dentro de $DIR." ;;
    esac
    [ -e "$DIR/$pat" ] || morir "--incluir '$pat': no existe $DIR/$pat."
    INCLUIR_EXTRA[$i]="$pat"
    printf '%s\n' "$pat" >> "$TMPD/incluir"
  done
  sed -i '/^[[:space:]]*$/d' "$TMPD/incluir"
  sort -u "$TMPD/incluir" -o "$TMPD/incluir"
  [ -s "$rec" ] && info "(Sigo incluyendo lo que se pidió antes con --incluir: $(tr '\n' ' ' < "$rec"))"
  return 0
}

recordar_exclusiones() {
  if [ "${#INCLUIR_EXTRA[@]}" -gt 0 ]; then
    { [ -f "$GITDIR/git-vps-incluir" ] && cat "$GITDIR/git-vps-incluir"; printf '%s\n' "${INCLUIR_EXTRA[@]}"; } \
      | sed '/^[[:space:]]*$/d' | sort -u > "$TMPD/inc.nuevo" && cat "$TMPD/inc.nuevo" > "$GITDIR/git-vps-incluir"
  fi
  [ "${#EXCLUIR_EXTRA[@]}" -gt 0 ] || return 0
  local rec="$GITDIR/git-vps-excluir"
  { [ -f "$rec" ] && cat "$rec"; printf '%s\n' "${EXCLUIR_EXTRA[@]}"; } | sed '/^[[:space:]]*$/d' | sort -u > "$TMPD/rec.nuevo" \
    && cat "$TMPD/rec.nuevo" > "$rec"
}

# Copia las exclusiones a .git/info/exclude (archivo interno de git) para que
# un "git add" manual también las respete. El bloque se reescribe cada vez.
asegurar_exclusiones_permanentes() {
  local f="$GITDIR/info/exclude"
  mkdir -p "$GITDIR/info"
  [ -f "$f" ] || : > "$f"
  awk '/^# >>> git-vps.sh/{skip=1} !skip{print} /^# <<< git-vps.sh/{skip=0}' "$f" > "$TMPD/exclude.nuevo"
  {
    echo "# >>> git-vps.sh (bloque automático, no editar)"
    printf '%s\n' "$EXCLUSIONES_BASE"
    [ -s "$GITDIR/git-vps-excluir" ] && cat "$GITDIR/git-vps-excluir"
    echo "# <<< git-vps.sh"
  } >> "$TMPD/exclude.nuevo"
  cat "$TMPD/exclude.nuevo" > "$f"
}

# ---------------------------------------------------------------------------
# Foto de los archivos, con índice temporal y datos en cuarentena: nada del
# servidor se toca y, si se cancela, no queda nada ocupando disco.
# ---------------------------------------------------------------------------
ARBOL=""; ARMADO_SOBRE=""
sacar_foto_archivos() { # $1 = commit sobre el que se arma (o vacío)
  ARMADO_SOBRE="$1"
  paso "Leyendo los archivos del proyecto (no se modifica nada)"
  # Cuarentena en el MISMO disco que .git: al confirmar, los datos se mueven
  # (sin copiar ni ocupar más lugar); si se cancela, se borra entera.
  CUARENTENA="$(mktemp -d "$GITDIR/objects/incoming-git-vps-XXXXXX")" || morir "No pude preparar la carpeta temporal dentro de .git."
  export GIT_OBJECT_DIRECTORY="$CUARENTENA"
  export GIT_ALTERNATE_OBJECT_DIRECTORIES="$GITDIR/objects${ALT_ORIG:+:$ALT_ORIG}"
  if [ -n "$ARMADO_SOBRE" ]; then
    gi read-tree "$ARMADO_SOBRE" || morir "No pude leer el commit $ARMADO_SOBRE."
    g ls-tree -r -z --name-only "$ARMADO_SOBRE" | LC_ALL=C sort -z > "$TMPD/base.z"
  else
    gi read-tree --empty || morir "No pude preparar el índice temporal."
    : > "$TMPD/base.z"
  fi

  # Antes de leer nada: ¿algún archivo gigante? ¿alcanza el disco?
  gi -c core.excludesFile="$TMPD/excluir" ls-files -z -o --exclude-standard | LC_ALL=C sort -z > "$TMPD/nuevos_std.z"
  gi ls-files -z -o --exclude-from="$TMPD/excluir" | LC_ALL=C sort -z > "$TMPD/nuevos_x.z"
  LC_ALL=C comm -z -12 "$TMPD/nuevos_std.z" "$TMPD/nuevos_x.z" > "$TMPD/candidatos.z"
  cat "$TMPD/candidatos.z" "$TMPD/base.z" \
    | (cd "$DIR" && xargs -0 -r stat --printf '%s %n\0' -- 2>/dev/null) | tr '\n\0' ' \n' > "$TMPD/tamanos.txt"
  local grandes kb libre_git libre_tmp dev_git dev_tmp
  grandes="$(awk '$1>95*1048576{ s=$1; $1=""; printf "      %d MB%s\n", s/1048576, $0 }' "$TMPD/tamanos.txt")"
  [ -z "$grandes" ] || morir "Hay archivos de más de 95 MB (GitHub no los acepta):
$grandes
   Excluilos con --excluir 'ruta' y repetí. No se hizo nada."
  kb="$(awk '{s+=$1} END{print int(s/1024)}' "$TMPD/tamanos.txt")"
  libre_git="$(df -Pk "$GITDIR" | awk 'NR==2{print $4}')"; dev_git="$(df -P "$GITDIR" | awk 'NR==2{print $1}')"
  libre_tmp="$(df -Pk "$TMPD" | awk 'NR==2{print $4}')";   dev_tmp="$(df -P "$TMPD" | awk 'NR==2{print $1}')"
  if [ "$dev_git" = "$dev_tmp" ]; then
    [ -n "$libre_git" ] && [ $((kb * 2 + 786432)) -gt "$libre_git" ] && \
      morir "Leer los archivos necesita unos $((kb * 2 / 1024 + 768)) MB libres y hay $((libre_git/1024)) MB. No sigo para no llenar el disco del servidor."
  else
    [ -n "$libre_git" ] && [ $((kb + 524288)) -gt "$libre_git" ] && \
      morir "Leer los archivos necesita unos $((kb / 1024 + 512)) MB libres en el disco del proyecto y hay $((libre_git/1024)) MB. No sigo para no llenar el disco del servidor."
    [ -n "$libre_tmp" ] && [ $((kb + 262144)) -gt "$libre_tmp" ] && \
      morir "La revisión necesita unos $((kb / 1024 + 256)) MB libres en ${TMPDIR:-/tmp} y hay $((libre_tmp/1024)) MB."
  fi

  if ! "${BAJA[@]}" env GIT_INDEX_FILE="$TMPD/indice" git -c safe.directory="$DIR" -c core.hooksPath=/dev/null \
       -c core.fsmonitor=false -c core.bigFileThreshold=16m -c core.excludesFile="$TMPD/excluir" \
       -c advice.addEmbeddedRepo=false -C "$DIR" add -A . 2>"$TMPD/add.err"; then
    sed 's/^/    /' "$TMPD/add.err" >&2
    morir "Falló la lectura de archivos (git add). No se hizo nada."
  fi
  grep -v '^warning: LF will be replaced\|^warning: in the working copy\|^warning: CRLF will be replaced' "$TMPD/add.err" | head -20

  # --incluir: lo que el .gitignore del proyecto deja afuera por error entra igual
  # (la lista propia de abajo se sigue aplicando adentro de esas carpetas)
  if [ -s "$TMPD/incluir" ]; then
    local inc grandes_inc=""
    while IFS= read -r inc; do
      [ -e "$DIR/$inc" ] || [ -L "$DIR/$inc" ] || continue
      grandes_inc+="$(find "$DIR/$inc" -xdev -type f -size +97280k -printf '      %p\n' 2>/dev/null)"
      "${BAJA[@]}" env GIT_INDEX_FILE="$TMPD/indice" git -c safe.directory="$DIR" -c core.hooksPath=/dev/null \
        -c core.fsmonitor=false -c core.bigFileThreshold=16m -c core.excludesFile="$TMPD/excluir" \
        -c advice.addEmbeddedRepo=false --literal-pathspecs -C "$DIR" add -f -- "$inc" 2>>"$TMPD/add.err" \
        || morir "No pude incluir '$inc' (--incluir). No se hizo nada."
    done < "$TMPD/incluir"
    [ -z "$grandes_inc" ] || morir "Hay archivos de más de 95 MB en lo pedido con --incluir (GitHub no los acepta):
$grandes_inc   No se hizo nada."
  fi

  # La lista propia manda aunque un .gitignore del proyecto diga lo contrario
  # (backend/.gitignore tiene '!src/**'): lo NUEVO que coincida queda afuera.
  gi ls-files -z -c -i --exclude-from="$TMPD/excluir" | LC_ALL=C sort -z > "$TMPD/excl_idx.z"
  LC_ALL=C comm -z -23 "$TMPD/excl_idx.z" "$TMPD/base.z" > "$TMPD/forzados.z"
  if [ -s "$TMPD/forzados.z" ]; then
    gi update-index -z --force-remove --stdin < "$TMPD/forzados.z" || morir "No pude aplicar las exclusiones."
  fi
  # --excluir sobre archivos que YA estaban en git: se conserva la versión anterior
  : > "$TMPD/excl_track.z"; : > "$TMPD/docs_gh.z"
  if [ -s "$TMPD/excl_extra" ] && [ -n "$ARMADO_SOBRE" ]; then
    GIT_INDEX_FILE="$TMPD/indice_base" g read-tree "$ARMADO_SOBRE"
    GIT_INDEX_FILE="$TMPD/indice_base" g ls-files -z -c -i --exclude-from="$TMPD/excl_extra" > "$TMPD/excl_track.z"
  fi
  # En la foto: documentación que GitHub ya tiene y el servidor nunca tuvo
  # (docs/, scripts/vps/, *.md de la raíz) no se propone borrar. Si el git del
  # servidor sí la tenía y falta, es que el servidor la borró: eso se respeta.
  if [ "$MODO" = foto ] && [ -n "$ARMADO_SOBRE" ]; then
    local head_srv; head_srv="$(g rev-parse -q --verify HEAD || true)"
    tr '\0' '\n' < "$TMPD/base.z" | while IFS= read -r p; do
      es_doc "$p" || continue
      { [ -e "$DIR/$p" ] || [ -L "$DIR/$p" ]; } && continue
      [ -n "$head_srv" ] && g cat-file -e "$head_srv:$p" 2>/dev/null && continue
      printf '%s\0' "$p"
    done > "$TMPD/docs_gh.z"
  fi
  if [ -s "$TMPD/excl_track.z" ] || [ -s "$TMPD/docs_gh.z" ]; then
    cat "$TMPD/excl_track.z" "$TMPD/docs_gh.z" | xargs -0 env GIT_INDEX_FILE="$TMPD/indice" git -c safe.directory="$DIR" --literal-pathspecs -C "$DIR" \
      reset -q "$ARMADO_SOBRE" -- || morir "No pude aplicar --excluir a archivos que ya estaban en git."
  fi

  # Repositorios git dentro del proyecto: git guardaría solo un puntero
  local nuevos_anidados="" p
  while IFS= read -r p; do
    [ -z "$p" ] && continue
    if [ -z "$ARMADO_SOBRE" ] || [ "$(g ls-tree "$ARMADO_SOBRE" -- "$p" | awk '{print $1}')" != "160000" ]; then
      nuevos_anidados+="      $p"$'\n'
    fi
  done < <(gi ls-files -s | awk -F'\t' '$1 ~ /^160000 /{print $2}')
  [ -z "$nuevos_anidados" ] || morir "Hay carpetas que son repositorios git propios DENTRO del proyecto:
$nuevos_anidados   Git no guardaría su contenido, solo un puntero. Pasale esta salida a Claude
   (o, si esas carpetas no importan, repetí con --excluir 'carpeta/'). No se hizo nada."

  ARBOL="$(gi write-tree)" || morir "No pude armar la foto."
  { gi -c core.excludesFile="$TMPD/excluir" ls-files -o -i --exclude-standard --directory 2>/dev/null
    tr '\0' '\n' < "$TMPD/forzados.z"; } | sed '/^$/d' | sort -u > "$TMPD/afuera.txt"
  tr '\0' '\n' < "$TMPD/excl_track.z" | sed '/^$/d' > "$TMPD/excl_track.txt"
  tr '\0' '\n' < "$TMPD/docs_gh.z" | sed '/^$/d' > "$TMPD/docs_gh.txt"
}

# Pasa los datos de la cuarentena a .git (recién después de confirmar)
# Pasa los datos de la cuarentena a .git (recién después de confirmar).
# Cada archivo se MUEVE dentro del mismo disco (operación atómica): nunca queda
# un dato a medio escribir, aunque se corte la luz o aprieten Ctrl-C.
guardar_objetos() {
  unset GIT_OBJECT_DIRECTORY
  if [ -n "$ALT_ORIG" ]; then export GIT_ALTERNATE_OBJECT_DIRECTORIES="$ALT_ORIG"; else unset GIT_ALTERNATE_OBJECT_DIRECTORIES; fi
  [ -n "$CUARENTENA" ] && [ -d "$CUARENTENA" ] || return 0
  local f d
  # objetos sueltos (carpetas de 2 letras)
  while IFS= read -r -d '' f; do
    d="$GITDIR/objects/${f%/*}"
    if [ ! -d "$d" ]; then
      mkdir -p "$d" && chmod --reference="$GITDIR/objects" "$d" 2>/dev/null
    fi
    [ -e "$GITDIR/objects/$f" ] && continue
    mv -f -- "$CUARENTENA/$f" "$GITDIR/objects/$f" || morir "No pude guardar los datos dentro de .git. No se subió nada."
  done < <(cd "$CUARENTENA" && find . -mindepth 2 -maxdepth 2 -type f -path './??/*' -printf '%P\0')
  # paquetes (archivos grandes): primero el .pack, después el .idx que lo activa
  if [ -d "$CUARENTENA/pack" ]; then
    mkdir -p "$GITDIR/objects/pack"
    for f in "$CUARENTENA"/pack/*.pack; do [ -e "$f" ] && mv -f -- "$f" "$GITDIR/objects/pack/"; done
    for f in "$CUARENTENA"/pack/*.idx;  do [ -e "$f" ] && mv -f -- "$f" "$GITDIR/objects/pack/"; done
  fi
  rm -rf "$CUARENTENA"; CUARENTENA=""
  [ -z "$ARBOL" ] || g cat-file -e "${ARBOL}^{tree}" 2>/dev/null \
    || morir "La foto quedó incompleta dentro de .git. No se subió nada. Pasale esta salida a Claude."
}

# ---------------------------------------------------------------------------
# Revisión de lo que se va a subir
# ---------------------------------------------------------------------------
N_NUEVOS=0; N_MODIF=0; N_BORRADOS=0; N_OTROS=0; BLOQUEOS=0; ADVERTENCIAS=0

agregar_hallazgo() { # nivel archivo motivo
  printf '%s\t%s\t%s\n' "$1" "$2" "$3" >> "$TMPD/hallazgos.tsv" || morir "No pude anotar una alerta (¿disco lleno?). No se subió nada."
}
enmascarar_valor() { local v="$1"; printf '%s…(%d caracteres)' "${v:0:6}" "${#v}"; }

analizar() { # $1 = árbol de lo que GitHub ya tiene   $2 = árbol a subir
  local -x LC_ALL=C
  local base="$1" nuevo="$2"
  paso "Revisando lo que GitHub todavía no tiene"
  : > "$TMPD/hallazgos.tsv"
  g diff-tree -r -z --no-renames --raw "$base" "$nuevo" > "$TMPD/raw.z" || morir "No pude listar los cambios. No se subió nada."
  : > "$TMPD/cambios.tsv"
  local meta ruta st sha_nuevo
  while IFS= read -r -d '' meta && IFS= read -r -d '' ruta; do
    st="${meta##* }"; st="${st:0:1}"
    sha_nuevo="$(printf '%s' "$meta" | awk '{print $4}')"
    printf '%s\t%s\t%s\n' "$st" "$sha_nuevo" "$ruta" >> "$TMPD/cambios.tsv"
  done < "$TMPD/raw.z"
  N_NUEVOS="$(awk -F'\t' '$1=="A"' "$TMPD/cambios.tsv" | wc -l)"
  N_MODIF="$(awk -F'\t' '$1=="M"' "$TMPD/cambios.tsv" | wc -l)"
  N_BORRADOS="$(awk -F'\t' '$1=="D"' "$TMPD/cambios.tsv" | wc -l)"
  N_OTROS="$(awk -F'\t' '$1!="A" && $1!="M" && $1!="D"' "$TMPD/cambios.tsv" | wc -l)"

  awk -F'\t' '$1!="D"' "$TMPD/cambios.tsv" > "$TMPD/vivos.tsv"
  if [ -s "$TMPD/vivos.tsv" ]; then
    cut -f2 "$TMPD/vivos.tsv" | g cat-file --batch-check='%(objectsize)' > "$TMPD/tam.txt"
    paste "$TMPD/tam.txt" "$TMPD/vivos.tsv" > "$TMPD/vivos_tam.tsv"
  else
    : > "$TMPD/vivos_tam.tsv"
  fi

  # 1) Tamaño y nombres peligrosos (sin importar lo que diga .gitignore)
  local tam est sha r nombre low
  while IFS=$'\t' read -r tam est sha r; do
    [[ "$tam" =~ ^[0-9]+$ ]] || tam=0
    if [ "$tam" -gt $((95*1024*1024)) ]; then
      agregar_hallazgo ALTA "$r" "pesa $((tam/1048576)) MB: GitHub rechaza archivos de más de 100 MB"
    elif [ "$tam" -gt $((20*1024*1024)) ]; then
      agregar_hallazgo MEDIA "$r" "pesa $((tam/1048576)) MB (¿seguro que va en git?)"
    fi
    nombre="${r##*/}"
    low="$(printf '%s' "$r" | tr '[:upper:]' '[:lower:]')"
    case "$nombre" in
      .env.template|.env.example|.env.sample|.env.dist) ;;
      .env|.env.*|*.env) agregar_hallazgo ALTA "$r" "archivo de variables de entorno (suele tener contraseñas y tokens)" ;;
      .git-credentials|.netrc|.pgpass|.htpasswd|id_rsa|id_dsa|id_ecdsa|id_ed25519)
        agregar_hallazgo ALTA "$r" "archivo de credenciales" ;;
    esac
    case "$low" in
      *.pem|*.key|*.p12|*.pfx|*.jks|*.keystore|*.ppk) agregar_hallazgo ALTA "$r" "clave o certificado privado" ;;
      *credentials*.json|*service-account*.json|*service_account*.json|*client_secret*.json)
        agregar_hallazgo ALTA "$r" "archivo de credenciales de un servicio" ;;
      *.sql|*.sql.gz|*.dump|*.sqlite|*.sqlite3|*.db)
        if [ "$tam" -gt $((1024*1024)) ]; then
          agregar_hallazgo ALTA "$r" "parece un volcado de base de datos ($((tam/1024)) KB): puede tener datos de clientes"
        else
          agregar_hallazgo MEDIA "$r" "archivo SQL/base de datos: revisá que no tenga datos reales"
        fi ;;
      *.csv|*.tsv|*.xls|*.xlsx|*.ods|*.jsonl|*.ndjson)
        agregar_hallazgo MEDIA "$r" "planilla/exportación de datos: revisá que no tenga datos de clientes ni costos" ;;
      *.json)
        if [ "$est" = A ] && [ "$tam" -gt $((1024*1024)) ]; then
          agregar_hallazgo MEDIA "$r" "archivo de datos nuevo de $((tam/1024)) KB: revisá que no tenga datos de clientes ni costos"
        fi ;;
    esac
  done < "$TMPD/vivos_tam.tsv"

  # 2) Contenido: líneas nuevas de archivos de texto (en modo bytes, para que
  #    un carácter raro o un byte nulo no apague la revisión)
  g diff-tree -r -p -U0 --no-renames --no-color --no-ext-diff --no-textconv \
      --src-prefix=a/ --dst-prefix=b/ "$base" "$nuevo" 2>"$TMPD/diff.err" \
    | awk '
        /^diff --git /{hdr=1; next}
        hdr && /^\+\+\+ /{ f=substr($0,5); if (f ~ /^b\//) f=substr(f,3); next }
        /^@@/{ hdr=0; next }
        !hdr && /^\+/{ print f "\t" substr($0,2) }' \
    | tr -d '\000' > "$TMPD/agregado.tsv" \
    || morir "No pude revisar el contenido de los archivos (¿disco lleno en ${TMPDIR:-/tmp}?). No se subió nada."

  # 3) Archivos binarios: se revisa el texto que tengan adentro
  local add del
  while IFS=$'\t' read -r -d '' add del r; do
    [ "$add" = "-" ] || continue
    low="$(printf '%s' "$r" | tr '[:upper:]' '[:lower:]')"
    case "$low" in
      *.png|*.jpg|*.jpeg|*.gif|*.webp|*.avif|*.ico|*.bmp|*.woff|*.woff2|*.ttf|*.otf|*.eot|*.mp4|*.webm|*.mov|*.mp3|*.ogg|*.wav) continue ;;
      *.zip|*.tar|*.tgz|*.gz|*.bz2|*.xz|*.7z|*.rar)
        agregar_hallazgo ALTA "$r" "archivo comprimido: no se puede revisar lo que tiene adentro (podría tener un .env o un volcado)"
        continue ;;
    esac
    sha="$(g rev-parse -q --verify "$nuevo:$r" 2>/dev/null || true)"
    [ -n "$sha" ] || continue
    tam="$(g cat-file -s "$sha" 2>/dev/null || echo 0)"
    if [ "$tam" -le $((5*1024*1024)) ]; then
      g cat-file blob "$sha" | tr -d '\000' | tr -c '[:print:]\n' '\n' | awk -v p="$r" 'length($0)>=6{print p "\t" $0}' >> "$TMPD/agregado.tsv" \
        || morir "No pude revisar $r (¿disco lleno?). No se subió nada."
    fi
    agregar_hallazgo MEDIA "$r" "archivo binario: revisá que no tenga datos privados"
  done < <(g diff-tree -r -z --numstat --no-renames --diff-filter=AM "$base" "$nuevo")

  # nivel|descripción|flags de grep|expresión
  local patrones=(
    'ALTA|clave privada||-----BEGIN ([A-Z0-9]+ )*PRIVATE KEY( BLOCK)?-----'
    'ALTA|token de GitHub||(gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})'
    'ALTA|token de Mercado Pago||(APP_USR|TEST)-[0-9]{6,}-[0-9]{6}-[0-9a-f]{20,}-[0-9]{4,}'
    'ALTA|clave de API de IA (Anthropic/OpenAI)||(sk-ant-[A-Za-z0-9_-]{20,}|sk-proj-[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{40,})'
    'ALTA|clave secreta de Medusa||sk_[0-9a-f]{32,}'
    'ALTA|clave de AWS||AKIA[0-9A-Z]{16}'
    'ALTA|clave de Google||AIza[0-9A-Za-z_-]{35}'
    'ALTA|token de Slack||(xox[abprs]-[A-Za-z0-9-]{10,}|hooks\.slack\.com/services/[A-Za-z0-9/]{20,})'
    'ALTA|token de bot de Telegram||[0-9]{8,10}:AA[A-Za-z0-9_-]{30,}'
    'ALTA|token de npm||(_authToken=[^[:space:]$]{10,}|npm_[A-Za-z0-9]{36})'
    'ALTA|dirección con usuario y contraseña||[a-zA-Z][a-zA-Z0-9+.-]*://[^/[:space:]:@"'"'"'`]+:[^/[:space:]@"'"'"'`]{3,}@'
    'MEDIA|token JWT||eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}'
    'MEDIA|contraseña/token escrito en el código|-i|(pass|password|passwd|pwd|secret|token|api[_-]?key|access[_-]?key|client[_-]?secret|auth[_-]?key|clave|contrase..?a)[a-z0-9_]*["'"'"'`]?[[:space:]]*[:=][[:space:]]*["'"'"'`][^"'"'"'`[:space:]]{8,}["'"'"'`]'
    'MEDIA|contraseña/token sin comillas|-i|(pass(word|wd)?|pwd|secret|token|api[_-]?key|authorization|[a-z0-9]+_key|clave|contrase..?a)[a-z0-9_]*["'"'"'`]?[[:space:]]*[:=][[:space:]]*[`"'"'"']?([A-Za-z0-9_!@#%^&*+=/-]{3,}[0-9][A-Za-z0-9_!@#%^&*+=/-]*|[A-Za-z0-9_!@#%^&*+=/-]*[0-9][A-Za-z0-9_!@#%^&*+=/-]{3,})'
    'MEDIA|variable secreta con valor||(PASS|PASSWORD|PASSWD|SECRET|TOKEN|API_KEY|APIKEY|ACCESS_KEY|PRIVATE_KEY|CLAVE|CONTRASE..?A)[A-Z0-9_]*[[:space:]]*(=|:[[:space:]])[[:space:]]*[^[:space:]$"'"'"'{}()<>]{8,}'
    'MEDIA|valor por defecto de una clave||(PASS|SECRET|TOKEN|KEY|PWD)[A-Z0-9_]*[[:space:]]*(\|\||\?\?)[[:space:]]*["'"'"'`][^"'"'"'`[:space:]]{6,}["'"'"'`]'
    'MEDIA|encabezado de autorización|-i|(bearer|basic)[[:space:]]+[A-Za-z0-9._~+/=-]{20,}'
  )
  local p nivel desc flags re linea archivo m cand
  for p in "${patrones[@]}"; do
    nivel="${p%%|*}"; p="${p#*|}"
    desc="${p%%|*}"; p="${p#*|}"
    flags="${p%%|*}"; re="${p#*|}"
    while IFS= read -r linea; do
      archivo="${linea%%$'\t'*}"
      m=""
      while IFS= read -r cand; do
        if [ "$desc" = "dirección con usuario y contraseña" ] && \
           { printf '%s' "$cand" | grep -aqiE ':(password|pass|pwd|contrase..?a|secret|changeme|x{3,}|\*+|<[^>]*>|your[_a-z-]*|user|usuario)@' \
             || printf '%s' "$cand" | grep -aqE ':\$(\{[A-Za-z_][A-Za-z0-9_]*\}|[A-Z_][A-Z0-9_]*)@'; }; then
          continue   # ejemplos típicos o variables (${DB_PASS}, $DB_PASS), no claves reales
        fi
        m="$cand"; break
      done < <(printf '%s' "${linea#*$'\t'}" | grep -aoE $flags -- "$re" | head -20)
      [ -z "$m" ] && continue
      agregar_hallazgo "$nivel" "$archivo" "$desc: $(enmascarar_valor "$m")"
    done < <(grep -aE $flags -- "$re" "$TMPD/agregado.tsv" 2>/dev/null | head -300)
  done

  # 4) Datos personales: muchos emails distintos en un mismo archivo
  local n
  while IFS=$'\t' read -r archivo n; do
    [ -n "$archivo" ] && agregar_hallazgo MEDIA "$archivo" "parece tener datos personales ($n)"
  done < <(awk -F'\t' '{
      f=$1; sub(/^[^\t]*\t/,"")
      k=split($0,a,/[^A-Za-z0-9._%+@-]+/)
      for(i=1;i<=k;i++) if (a[i] ~ /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+[.][A-Za-z0-9.-]*[A-Za-z][A-Za-z]$/) {
        key=f SUBSEP a[i]; if(!(key in s)){s[key]=1; c[f]++} }
    } END { for (x in c) if (c[x]>=20) print x "\t" c[x] " emails distintos" }' "$TMPD/agregado.tsv")
  # DNI, teléfonos y domicilios con nombre de campo (JSON, CSV, texto)
  while IFS=$'\t' read -r archivo n; do
    [ -n "$archivo" ] && agregar_hallazgo MEDIA "$archivo" "parece tener datos personales ($n)"
  done < <(awk -F'\t' '{ l=tolower($0)
        n=gsub(/(dni|documento|telefono|tel.?fono|celular|whatsapp|domicilio|direcci.?n|cuil|cuit)["'"'"']?[[:space:]]*([:=,;|]|[[:space:]]+[0-9])/, "&", l)
        c[$1]+=n }
      END { for (x in c) if (c[x]>=20) print x "\t" c[x] " datos de DNI/teléfono/domicilio" }' "$TMPD/agregado.tsv")

  sort -u "$TMPD/hallazgos.tsv" -o "$TMPD/hallazgos.tsv" || morir "No pude ordenar las alertas. No se subió nada."
  BLOQUEOS="$(grep -c '^ALTA' "$TMPD/hallazgos.tsv" || true)"
  ADVERTENCIAS="$(grep -c '^MEDIA' "$TMPD/hallazgos.tsv" || true)"
}

mostrar_resumen() {
  paso "Resumen de lo que se subiría"
  info "  Archivos nuevos:      $N_NUEVOS"
  info "  Archivos modificados: $N_MODIF"
  info "  Archivos borrados:    $N_BORRADOS"
  [ "$N_OTROS" -gt 0 ] && info "  Otros cambios:        $N_OTROS"
  local total=$((N_NUEVOS+N_MODIF+N_BORRADOS+N_OTROS))
  if [ "$total" -gt 0 ] && [ "$total" -le 40 ]; then
    info ""
    awk -F'\t' '{ e=($1=="A"?"nuevo":($1=="D"?"borrado":"cambia")); printf "    [%s] %s\n", e, $3 }' "$TMPD/cambios.tsv"
  elif [ "$total" -gt 40 ]; then
    info ""
    info "  Cambios por carpeta (las 20 con más cambios):"
    awk -F'\t' '{ n=split($3,a,"/"); if (n>2) print a[1]"/"a[2]"/"; else if (n==2) print a[1]"/"; else print "(raíz)" }' "$TMPD/cambios.tsv" \
      | sort | uniq -c | sort -rn | head -20 | sed 's/^/    /'
    if [ "$N_BORRADOS" -gt 0 ]; then
      info "  Archivos que estaban en GitHub y en el servidor ya NO existen:"
      awk -F'\t' '$1=="D"{print "    - "$3}' "$TMPD/cambios.tsv" | head -40
      [ "$N_BORRADOS" -gt 40 ] && info "    … y $((N_BORRADOS-40)) más"
    fi
  fi
  if [ -s "$TMPD/afuera.txt" ]; then
    local na; na="$(wc -l < "$TMPD/afuera.txt")"
    info ""
    info "  Quedan AFUERA a propósito ($na): siguen en el servidor, no se suben."
    info "  (Si acá aparece algo que SÍ es código, avisale a Claude.)"
    head -25 "$TMPD/afuera.txt" | sed 's/^/    · /'
    [ "$na" -gt 25 ] && info "    · … y $((na-25)) más"
  fi
  if [ -s "$TMPD/excl_track.txt" ]; then
    info ""
    info "  Excluidos con --excluir que ya estaban en git (se deja la versión anterior):"
    head -20 "$TMPD/excl_track.txt" | sed 's/^/    · /'
  fi
  if [ -s "$TMPD/docs_gh.txt" ]; then
    info ""
    info "  Documentación que ya está en GitHub y el servidor no tiene (se conserva, no se borra):"
    head -10 "$TMPD/docs_gh.txt" | sed 's/^/    · /'
  fi
  # Detalle completo para revisar con calma (rutas y alertas enmascaradas, sin contenido)
  DETALLE="${TMPDIR:-/tmp}/git-vps-detalle-$(printf '%s' "${DIR#/}" | tr '/' '_').txt"
  ( umask 077
    { echo "Detalle de la revisión — $(date '+%Y-%m-%d %H:%M') — $DIR"
      echo; echo "== Cambios ($total) =="
      awk -F'\t' '{ e=($1=="A"?"nuevo":($1=="D"?"borrado":"cambia")); printf "[%s] %s\n", e, $3 }' "$TMPD/cambios.tsv"
      echo; echo "== Quedan afuera =="; cat "$TMPD/afuera.txt" 2>/dev/null
      echo; echo "== Excluidos con --excluir (ya estaban en git) =="; cat "$TMPD/excl_track.txt" 2>/dev/null
      echo; echo "== Documentación de GitHub que se conserva =="; cat "$TMPD/docs_gh.txt" 2>/dev/null
      echo; echo "== Alertas =="
      awk -F'\t' '{ printf "[%s] %s → %s\n", ($1=="ALTA"?"GRAVE":"revisar"), $2, $3 }' "$TMPD/hallazgos.tsv" 2>/dev/null
    } > "$DETALLE" ) 2>/dev/null && info "" && info "  Detalle completo guardado en: $DETALLE"
  [ -n "${SUDO_USER:-}" ] && chown "$SUDO_USER" "$DETALLE" 2>/dev/null
  local peso
  peso="$(awk -F'\t' '{s+=$1} END{printf "%.1f", s/1048576}' "$TMPD/vivos_tam.tsv")"
  info ""
  info "  Tamaño de lo nuevo/modificado: ${peso} MB"
  if [ -s "$TMPD/hallazgos.tsv" ]; then
    info ""
    if [ "$BLOQUEOS" -gt 0 ]; then
      error "ALERTAS DE SEGURIDAD ($BLOQUEOS graves, $ADVERTENCIAS para revisar):"
    else
      aviso "Cosas para revisar ($ADVERTENCIAS):"
    fi
    sort -t$'\t' -k1,1 "$TMPD/hallazgos.tsv" | head -60 \
      | awk -F'\t' '{ printf "    [%s] %s → %s\n", ($1=="ALTA"?"GRAVE":"revisar"), $2, $3 }'
    local th; th="$(wc -l < "$TMPD/hallazgos.tsv")"
    [ "$th" -gt 60 ] && info "    … y $((th-60)) más"
  else
    ok "No se detectaron contraseñas, tokens ni archivos peligrosos."
  fi
  return 0
}

frenar_si_hay_alertas() {
  if [ "$BLOQUEOS" -gt 0 ]; then
    if [ "$IGNORAR_ALERTAS" = 1 ]; then
      aviso "Hay alertas graves pero elegiste seguir (--ignorar-alertas)."
    else
      morir "Frené porque hay alertas graves: podría subirse una contraseña, un token o datos privados.
   Qué hacer:
     • Si el archivo NO tiene que ir a GitHub: repetí agregando --excluir 'ruta/del/archivo'
     • Si la contraseña está escrita dentro del código: hay que pasarla al .env (pedíselo a Claude)
     • Si revisaste y es una falsa alarma: repetí con --ignorar-alertas
   No se subió nada."
    fi
  fi
  if [ "$ADVERTENCIAS" -gt 0 ] && [ "$BLOQUEOS" -eq 0 ] && [ "$IGNORAR_ALERTAS" = 0 ]; then
    preguntar_seguridad "Hay $ADVERTENCIAS cosas para revisar (arriba). ¿Las revisaste y querés seguir? Escribí SI:" SI \
      || morir "Cancelado. No se subió nada. (Sin terminal interactiva: revisá y usá --ignorar-alertas.)"
  fi
  return 0
}

# ---------------------------------------------------------------------------
# Commits y subida
# ---------------------------------------------------------------------------
resolver_autor() { # $1 = preguntar | nopreguntar
  local nombre mail
  if [ -n "$AUTOR" ]; then
    nombre="$(printf '%s' "$AUTOR" | sed -E 's/[[:space:]]*<.*$//')"
    mail="$(printf '%s' "$AUTOR" | sed -nE 's/.*<([^>]+)>.*/\1/p')"
  else
    nombre="$(g config user.name 2>/dev/null || true)"
    mail="$(g config user.email 2>/dev/null || true)"
    if [ -z "$nombre" ] && [ "$1" = preguntar ] && [ -t 0 ] && [ "$SI" = 0 ]; then
      read -r -p "¿Quién está guardando estos cambios? (tu nombre): " nombre
    fi
  fi
  [ -n "$nombre" ] || nombre="Nexovet VPS"
  [ -n "$mail" ] || mail="vps@nexovet.invalid"
  export GIT_AUTHOR_NAME="$nombre" GIT_AUTHOR_EMAIL="$mail" GIT_COMMITTER_NAME="$nombre" GIT_COMMITTER_EMAIL="$mail"
}

COMMIT=""; RAMA_SUBIENDO=""
crear_commit() { # $1 = mensaje   $2 = padre (o vacío)
  local padres=()
  [ -n "${2:-}" ] && padres=(-p "$2")
  COMMIT="$(printf '%s\n' "$1" | g commit-tree "$ARBOL" ${padres[@]+"${padres[@]}"})" || morir "No pude crear el commit. No se subió nada."
}

# subir REFSPEC → 0 si subió;  RECHAZADO=1 si GitHub tenía cambios nuevos
RECHAZADO=0
subir() {
  RECHAZADO=0
  info "Subiendo a GitHub ($REMOTO → ${1#*:})…"
  if "${BAJA[@]}" git -c safe.directory="$DIR" -c core.hooksPath=/dev/null -c pack.threads=1 \
       -c pack.windowMemory=64m -c pack.deltaCacheSize=16m -c core.bigFileThreshold=16m \
       -C "$DIR" push "$REMOTO" "$1" > "$TMPD/push.log" 2>&1; then
    return 0
  fi
  sed -E 's#(://[^:/@[:space:]]+:)[^@[:space:]]+@#\1****@#g; s/^/    /' "$TMPD/push.log"
  if grep -qi 'protected branch\|GH006\|pre-receive hook declined\|push declined' "$TMPD/push.log"; then
    RECHAZADO=2
    error "GitHub no permite subir directo a esa rama (está protegida)."
  elif grep -qi 'rejected\|non-fast-forward\|fetch first' "$TMPD/push.log"; then
    RECHAZADO=1
    error "GitHub rechazó la subida porque tiene cambios nuevos que el servidor no tiene."
  elif grep -qi 'file size limit\|exceeds\|large files' "$TMPD/push.log"; then
    error "Hay un archivo demasiado grande. Excluilo con --excluir."
  else
    explicar_error_red "$TMPD/push.log"
  fi
  return 1
}

url_github() { [ -n "$SLUG" ] && printf 'https://github.com/%s' "$SLUG"; }

# Antes de subir: ¿lo que se revisó como "ya está en GitHub" sigue estando?
# (si alguien limpió el historial de GitHub mientras tanto, no se vuelve a subir)
base_sigue_en_github() { # $1 = commit base (o vacío)
  [ -n "${1:-}" ] || return 0
  GIT_SSH_COMMAND="$(ssh_sin_preguntas)" g fetch --quiet --prune "$REMOTO" >/dev/null 2>&1 || return 0
  local r
  for r in $(g for-each-ref --format='%(objectname)' "refs/remotes/$REMOTO/"); do
    g merge-base --is-ancestor "$1" "$r" 2>/dev/null && return 0
  done
  morir "GitHub cambió su historial mientras tanto (¿alguien lo limpió?). No se subió nada. Corré de nuevo."
}

# ---------------------------------------------------------------------------
# Cambios que llegan de GitHub: ¿se pueden aceptar sin tocar el sistema?
#   sin efecto → el servidor ya tiene esa versión (o una más nueva que él mismo subió)
#   escribir   → documentación (docs/, scripts/vps/, *.md de la raíz) que el
#                servidor no modificó
#   deploy     → cualquier otra cosa: este script NO lo hace
# ---------------------------------------------------------------------------
# Lo único que este script trae de GitHub al servidor: documentación.
es_doc() { case "$1" in docs/*|scripts/vps/*) return 0 ;; */*) return 1 ;; *.md) return 0 ;; esac; return 1; }
clasificar_entrantes() { # $1 desde  $2 hasta
  local desde="$1" hasta="$2" est r blob_hasta blob_desde blob_local modo_hasta existe c d
  local ceros=0000000000000000000000000000000000000000
  : > "$TMPD/escribir.txt"; : > "$TMPD/sin_efecto.txt"; : > "$TMPD/deploy.txt"; : > "$TMPD/propios.txt"
  # Versiones que el propio servidor subió (guardados): "versión anterior → versión nueva → ruta"
  for c in $(g for-each-ref --sort=-refname --count=40 --format='%(objectname)' refs/vps-guardados/); do
    g diff-tree -r --no-renames --no-commit-id "$c" 2>/dev/null \
      | awk '{print $3 "\t" $4 "\t" substr($0, index($0,"\t")+1)}' >> "$TMPD/propios.txt"
  done
  # ¿Esta versión local vino de GitHub en algún commit de desde..hasta?
  fue_de_github() { local cc; [ -n "$2" ] || return 1
    for cc in $(g rev-list "$desde..$hasta" -- "$1" 2>/dev/null); do
      [ "$(g rev-parse -q --verify "$cc:$1" 2>/dev/null)" = "$2" ] && return 0
    done; return 1; }
  while IFS= read -r -d '' est && IFS= read -r -d '' r; do
    # Nada que pase por un enlace simbólico
    d="$(dirname "$r")"
    while [ "$d" != "." ] && [ "$d" != "/" ]; do
      if [ -L "$DIR/$d" ]; then printf '[pasa por un enlace] %s\n' "$r" >> "$TMPD/deploy.txt"; continue 2; fi
      d="$(dirname "$d")"
    done
    existe=0; { [ -e "$DIR/$r" ] || [ -L "$DIR/$r" ]; } && existe=1
    blob_hasta=""; modo_hasta=""
    if [ "$est" != D ]; then
      blob_hasta="$(g rev-parse -q --verify "$hasta:$r" 2>/dev/null || true)"
      modo_hasta="$(g ls-tree "$hasta" -- "$r" | awk '{print $1}')"
    fi
    blob_desde="$(g rev-parse -q --verify "$desde:$r" 2>/dev/null || true)"
    blob_local=""
    if [ -L "$DIR/$r" ]; then
      blob_local="$(printf '%s' "$(readlink "$DIR/$r")" | g hash-object --stdin)"
    elif [ -f "$DIR/$r" ]; then
      blob_local="$(g hash-object -- "$r" 2>/dev/null || true)"
    fi
    if [ "$est" = D ]; then
      if [ "$existe" = 0 ]; then printf '%s\n' "$r" >> "$TMPD/sin_efecto.txt"
      elif es_doc "$r" && [ -n "$blob_local" ] && { [ "$blob_local" = "$blob_desde" ] || fue_de_github "$r" "$blob_local"; }; then
        printf 'D\t%s\t%s\n' "$r" "$blob_local" >> "$TMPD/escribir.txt"
      else printf '[se borraría] %s\n' "$r" >> "$TMPD/deploy.txt"; fi
      continue
    fi
    # Igual contenido y mismo permiso de ejecución → no hay nada que hacer
    if [ "$existe" = 1 ] && [ -n "$blob_local" ] && [ "$blob_local" = "$blob_hasta" ]; then
      if [ "$modo_hasta" = 100755 ] && [ -f "$DIR/$r" ] && [ ! -x "$DIR/$r" ]; then :
      elif [ "$modo_hasta" = 100644 ] && [ -f "$DIR/$r" ] && [ -x "$DIR/$r" ]; then :
      else printf '%s\n' "$r" >> "$TMPD/sin_efecto.txt"; continue; fi
    fi
    # GitHub tiene la versión que el mismo servidor subió desde esta misma base,
    # y el servidor la siguió editando: vale la del servidor.
    if [ "$existe" = 1 ] && [ -n "$blob_hasta" ] && grep -qxF -- "${blob_desde:-$ceros}	$blob_hasta	$r" "$TMPD/propios.txt"; then
      printf '%s\n' "$r" >> "$TMPD/sin_efecto.txt"; continue
    fi
    # El servidor lo había borrado en un guardado y GitHub lo tiene: vale el borrado del servidor.
    if [ "$existe" = 0 ] && [ "$est" != A ] && grep -qxF -- "${blob_desde:-$ceros}	$ceros	$r" "$TMPD/propios.txt"; then
      printf '%s\n' "$r" >> "$TMPD/sin_efecto.txt"; continue
    fi
    if [ "$modo_hasta" = 120000 ] || [ "$modo_hasta" = 160000 ]; then
      printf '[enlace o submódulo] %s\n' "$r" >> "$TMPD/deploy.txt"
    elif ! es_doc "$r"; then
      printf '[código o archivo del sistema] %s\n' "$r" >> "$TMPD/deploy.txt"
    elif [ "$est" = A ] && [ "$existe" = 0 ]; then
      printf 'A\t%s\t-\n' "$r" >> "$TMPD/escribir.txt"
    elif [ "$existe" = 1 ] && [ -n "$blob_local" ] && { [ "$blob_local" = "$blob_desde" ] || fue_de_github "$r" "$blob_local"; }; then
      printf 'M\t%s\t%s\n' "$r" "$blob_local" >> "$TMPD/escribir.txt"
    else
      printf '[documentación que el servidor también cambió] %s\n' "$r" >> "$TMPD/deploy.txt"
    fi
  done < <(g diff-tree -r -z --no-renames --name-status "$desde" "$hasta")
}

mostrar_entrantes() {
  if [ -s "$TMPD/escribir.txt" ]; then
    info "  Archivos de GitHub que se agregan/actualizan en el servidor (solo documentación):"
    head -30 "$TMPD/escribir.txt" | awk -F'\t' '{ printf "    %s %s\n", ($1=="A"?"+ nuevo":($1=="M"?"~ actualiza":"- quita")), $2 }'
  fi
  [ -s "$TMPD/sin_efecto.txt" ] && info "  ($(wc -l < "$TMPD/sin_efecto.txt") cambio(s) de GitHub que el servidor ya tiene: no se toca nada)"
  return 0
}

respaldar_posicion() { # $1 = rama que se va a mover   $2 = destino
  local h m necesita=0
  h="$(g rev-parse -q --verify HEAD || true)"
  m="$(g rev-parse -q --verify "refs/heads/$1" || true)"
  { [ -n "$h" ] && ! g merge-base --is-ancestor "$h" "$2"; } && necesita=1
  { [ -n "$m" ] && ! g merge-base --is-ancestor "$m" "$2"; } && necesita=1
  [ "$(g symbolic-ref --short -q HEAD || true)" != "$1" ] && necesita=1
  [ "$necesita" = 1 ] || return 0
  [ -n "$h" ] && g update-ref -m "git-vps respaldo" "refs/vps-respaldo/$SELLO" "$h"
  [ -n "$m" ] && [ "$m" != "$h" ] && g update-ref -m "git-vps respaldo" "refs/vps-respaldo/$SELLO-$1" "$m"
  [ -f "$GITDIR/index" ] && cp -p "$GITDIR/index" "$GITDIR/index.respaldo-$SELLO"
  info "  (posición anterior de git guardada en refs/vps-respaldo/$SELLO)"
}

avisar_preparados() {
  g rev-parse -q --verify HEAD >/dev/null || return 0
  if ! GIT_OPTIONAL_LOCKS=0 g diff-index --cached --quiet HEAD -- 2>/dev/null; then
    aviso "Hay cambios 'preparados' a mano en git (git add / git rm --cached). El índice de git se va a rehacer (los archivos no se tocan):"
    GIT_OPTIONAL_LOCKS=0 g diff-index --cached --name-status HEAD -- | head -20 | sed 's/^/    /'
    preguntar "¿Seguir? Escribí SI:" SI || cancelar
  fi
  return 0
}

# Deja el índice de git igual al último commit (no toca archivos)
refrescar_indice() {
  local au i
  au="$(g ls-files -v 2>/dev/null | sed -n 's/^[a-z] //p')"
  for i in 1 2 3 4 5; do
    if g reset -q 2>/dev/null; then
      rm -f "$GITDIR/git-vps-indice-pendiente"
      [ -n "$au" ] && printf '%s\n' "$au" | g update-index --assume-unchanged --stdin 2>/dev/null
      return 0
    fi
    sleep 1
  done
  : > "$GITDIR/git-vps-indice-pendiente"
  aviso "No pude refrescar el índice de git (otro programa lo estaba usando). No es grave: se arregla solo la próxima vez que corras el script."
  return 1
}

# Mueve la rama al commit indicado sin tocar archivos
mover_rama() { # $1 rama  $2 destino  $3 valor anterior esperado (o vacío)
  PASO=rama
  respaldar_posicion "$1" "$2"
  : > "$GITDIR/git-vps-indice-pendiente"   # si se corta acá, la próxima vez se arregla
  if [ -n "${3:-}" ]; then
    g update-ref -m "git-vps" "refs/heads/$1" "$2" "$3" || morir "La rama cambió mientras tanto (¿alguien más usó git?). Ningún archivo se tocó; reintentá."
  else
    g update-ref -m "git-vps" "refs/heads/$1" "$2" || morir "No pude mover la rama."
  fi
  if [ "$(g symbolic-ref --short -q HEAD || true)" != "$1" ]; then
    g symbolic-ref HEAD "refs/heads/$1" || morir "No pude cambiar de rama."
  fi
  refrescar_indice || true
  g branch --set-upstream-to="$REMOTO/$1" "$1" >/dev/null 2>&1 || true
  TOCO_GIT=1
  PASO=""
}

# Escribe los archivos "seguros" (nuevos, fuera de las apps) desde el índice
# Escribe (antes de mover la rama) los archivos que clasificar_entrantes marcó
# como "escribir". Cada uno se escribe completo en un temporal y se renombra.
escribir_entrantes() { # $1 = commit de donde salen
  [ -s "$TMPD/escribir.txt" ] || return 0
  local hasta="$1" op r esperado top tmp modo real rel fallas="" saltados=""
  PASO=escribir
  while IFS=$'\t' read -r op r esperado; do
    [ -z "$r" ] && continue
    # El destino real (siguiendo enlaces) tiene que seguir siendo documentación del proyecto
    real="$(realpath -m -- "$DIR/$r" 2>/dev/null)"
    rel="${real#"$DIR"/}"
    if [ "$rel" = "$real" ] || ! es_doc "$rel"; then fallas+="      $r (el destino real no es documentación del proyecto)"$'\n'; continue; fi
    # Si alguien lo editó mientras se esperaba la confirmación, no se toca
    if [ "$op" != A ] && [ -n "$esperado" ] && [ "$esperado" != "-" ] && [ "$(g hash-object -- "$r" 2>/dev/null)" != "$esperado" ]; then
      saltados+="      $r"$'\n'; continue
    fi
    if [ "$op" = D ]; then
      rm -f -- "${DIR:?}/${r:?}" || fallas+="      $r"$'\n'
      DOCS_ESCRITOS=1
      continue
    fi
    if [ "$op" = A ]; then
      { [ -e "$DIR/$r" ] || [ -L "$DIR/$r" ]; } && continue   # nunca pisar algo que apareció
      top="$r"
      while [ "$(dirname "$top")" != "." ] && [ ! -e "$DIR/$(dirname "$top")" ]; do top="$(dirname "$top")"; done
      printf '%s\n' "$top" >> "$TMPD/escritos.txt"
    fi
    modo="$(g ls-tree "$hasta" -- "$r" | awk '{print $1}')"
    mkdir -p -- "$DIR/$(dirname "$r")" 2>/dev/null
    tmp="$DIR/$(dirname "$r")/.git-vps-$$-$(basename "$r")"; ESCRIBIENDO="$tmp"
    if g cat-file blob "$hasta:$r" > "$tmp" 2>/dev/null; then
      if [ -e "$DIR/$r" ]; then chown --reference="$DIR/$r" "$tmp" 2>/dev/null; chmod --reference="$DIR/$r" "$tmp" 2>/dev/null; fi
      [ "$modo" = 100755 ] && chmod +x "$tmp"
      mv -f -- "$tmp" "$DIR/$r" || { rm -f -- "${tmp:?}"; fallas+="      $r"$'\n'; }
    else
      rm -f -- "${tmp:?}"; fallas+="      $r"$'\n'
    fi
    ESCRIBIENDO=""
    DOCS_ESCRITOS=1
  done < "$TMPD/escribir.txt"
  sort -u "$TMPD/escritos.txt" -o "$TMPD/escritos.txt"
  PASO=""
  [ -z "$saltados" ] || aviso "Estos archivos se editaron mientras esperaba la confirmación y no se tocaron:
$saltados"
  [ -z "$fallas" ] || morir "No pude escribir estos archivos de documentación que venían de GitHub:
$fallas   La rama de git no se movió y ningún archivo del sistema se tocó. Pasale esta salida a Claude."
  return 0
}

# Cuenta lo que "guardar" subiría (con las mismas reglas), sin escribir nada.
PEND_GUARDAR=0; PEND_EXCLUIDOS=0
contar_pendientes() {
  local -x LC_ALL=C GIT_OPTIONAL_LOCKS=0
  g -c core.excludesFile="$TMPD/excluir" ls-files -z -o --exclude-standard 2>/dev/null | sort -z > "$TMPD/p_std.z"
  g ls-files -z -o --exclude-from="$TMPD/excluir" 2>/dev/null | sort -z > "$TMPD/p_x.z"
  comm -z -12 "$TMPD/p_std.z" "$TMPD/p_x.z" > "$TMPD/p_new.z"
  # Lo pedido con --incluir cuenta aunque el .gitignore del proyecto lo ignore
  if [ -s "$TMPD/incluir" ]; then
    local inc
    while IFS= read -r inc; do
      g --literal-pathspecs ls-files -z -o --exclude-from="$TMPD/excluir" -- "$inc" 2>/dev/null
    done < "$TMPD/incluir" >> "$TMPD/p_new.z"
  fi
  local nuevos; nuevos="$(sort -z -u "$TMPD/p_new.z" | tr -cd '\0' | wc -c)"
  g status --porcelain=v1 -z -uno 2>/dev/null | tr '\0' '\n' | sed -E 's/^.. //' | sed '/^$/d' | sort -u > "$TMPD/p_mod.txt"
  : > "$TMPD/p_track.txt"
  if [ -s "$TMPD/excl_extra" ]; then
    g ls-files -z -c -i --exclude-from="$TMPD/excl_extra" 2>/dev/null | tr '\0' '\n' | sort -u > "$TMPD/p_track.txt"
  fi
  PEND_EXCLUIDOS="$(comm -12 "$TMPD/p_mod.txt" "$TMPD/p_track.txt" | wc -l)"
  PEND_GUARDAR=$(( $(wc -l < "$TMPD/p_mod.txt") - PEND_EXCLUIDOS + nuevos ))
}

# ===========================================================================
# MODO: estado
# ===========================================================================
modo_estado() {
  preparar
  cargar_exclusiones
  consultar_github
  paso "Proyecto $DIR"
  info "  Remoto:        $(printf '%s' "$URL_REMOTO" | sed -E 's#(://)[^@/]+@#\1****@#')"
  info "  Repositorio:   ${SLUG:-?} ($VISIBILIDAD) — rama principal: $RAMA_PPAL"
  info "  Rama local:    $(g symbolic-ref --short -q HEAD || echo '(ninguna)')"
  if g rev-parse -q --verify HEAD >/dev/null; then
    info "  Último commit: $(g log -1 --format='%h  %ad  %an  "%s"' --date=format:'%Y-%m-%d %H:%M') ($(g log -1 --format=%cr))"
  fi
  contar_pendientes
  info "  Sin guardar:   $PEND_GUARDAR archivo(s) con cambios$( [ "$PEND_EXCLUIDOS" -gt 0 ] && printf ' (+%s excluidos a propósito)' "$PEND_EXCLUIDOS")"
  local remoto_sha head_sha
  remoto_sha="$(sonda ls-remote "$REMOTO" "refs/heads/$RAMA_PPAL" 2>/dev/null | awk '{print $1}')"
  head_sha="$(g rev-parse -q --verify HEAD || true)"
  if [ -n "$remoto_sha" ] && [ -n "$head_sha" ]; then
    if [ "$remoto_sha" = "$head_sha" ]; then
      info "  vs GitHub:     el último commit coincide con $RAMA_PPAL de GitHub"
    elif ! g cat-file -e "${remoto_sha}^{commit}" 2>/dev/null; then
      info "  vs GitHub:     GitHub tiene commits que este servidor todavía no descargó"
    elif g merge-base --is-ancestor "$remoto_sha" "$head_sha"; then
      info "  vs GitHub:     el servidor tiene $(g rev-list --count "$remoto_sha..$head_sha") commit(s) sin subir"
    elif g merge-base --is-ancestor "$head_sha" "$remoto_sha"; then
      info "  vs GitHub:     GitHub tiene $(g rev-list --count "$head_sha..$remoto_sha") commit(s) que el servidor no tiene"
    else
      info "  vs GitHub:     divergidos (cada lado tiene commits distintos)"
    fi
  fi
  [ -s "$GITDIR/git-vps-excluir" ] && info "  Exclusiones recordadas: $(tr '\n' ' ' < "$GITDIR/git-vps-excluir")"
  [ -s "$GITDIR/git-vps-incluir" ] && info "  Inclusiones recordadas: $(tr '\n' ' ' < "$GITDIR/git-vps-incluir")"
  [ -e "$GITDIR/git-vps-indice-pendiente" ] && info "  (Índice de git pendiente de refrescar: se arregla solo en el próximo guardar.)"
  local fotos; fotos="$(g for-each-ref --sort=-refname --format='    %(refname:short)  %(objectname:short)' refs/vps-fotos/ | head -5)"
  paso "Próximo paso"
  if esta_alineado; then
    info "  El servidor está alineado con la versión oficial. Para guardar cambios: $(comando guardar)"
  elif [ -n "$fotos" ]; then
    info "  Fotos sacadas, esperando aprobación en GitHub:"
    info "$fotos"
    info "  Cuando la foto esté aprobada en GitHub: $(comando alinear)"
  else
    info "  Todavía no hay versión oficial. Primero: $(comando foto) --simular   y después:   $(comando foto)"
  fi
  return 0
}

# ===========================================================================
# MODO: foto
# ===========================================================================
modo_foto() {
  preparar
  if esta_alineado; then
    ok "Este servidor ya está alineado con la versión oficial: no hace falta otra foto."
    info "   Para guardar cambios: $(comando guardar)"
    return 0
  fi
  cargar_exclusiones
  consultar_github
  [ "$SIMULAR" = 1 ] || exigir_privado
  local rama="${RAMA_NUEVA:-vps/foto-$SELLO}"
  git check-ref-format --branch "$rama" >/dev/null 2>&1 || morir "Nombre de rama inválido: $rama"
  traer_de_github
  # La foto se arma ENCIMA de lo que GitHub ya tiene: se revisa todo lo que
  # GitHub no tiene (incluso commits del servidor que nunca se subieron) y el
  # resultado es exactamente lo que hay en el servidor.
  local base_commit base_arbol="$ARBOL_VACIO" h rama_local arriba
  base_commit="$(g rev-parse -q --verify "refs/remotes/$REMOTO/$RAMA_PPAL" || true)"
  h="$(g rev-parse -q --verify HEAD || true)"
  # Si el servidor está en otra rama que también está en GitHub (y que ya
  # contiene a main), la foto se arma sobre esa rama: así se conserva su historial.
  rama_local="$(g symbolic-ref --short -q HEAD || true)"
  if [ -n "$rama_local" ] && [ "$rama_local" != "$RAMA_PPAL" ] && [ -n "$h" ]; then
    arriba="$(g rev-parse -q --verify "refs/remotes/$REMOTO/$rama_local" || true)"
    if [ -n "$arriba" ] && g merge-base --is-ancestor "$arriba" "$h" \
       && { [ -z "$base_commit" ] || g merge-base --is-ancestor "$base_commit" "$arriba"; }; then
      base_commit="$arriba"
      info "(El servidor está en la rama '$rama_local', que también está en GitHub: la foto se arma sobre ella y conserva su historial.)"
    fi
  fi
  [ -n "$base_commit" ] && base_arbol="$(g rev-parse "$base_commit^{tree}")"
  if [ -n "$h" ] && [ -n "$base_commit" ] && ! g merge-base --is-ancestor "$h" "$base_commit"; then
    info "(El servidor tiene commits propios que GitHub no tiene; la foto incluye igual todos sus archivos.)"
  fi

  sacar_foto_archivos "$base_commit"
  if [ "$ARBOL" = "$base_arbol" ]; then
    ok "No hay nada nuevo: los archivos del servidor son idénticos a $RAMA_PPAL de GitHub."
    if [ "$SIMULAR" = 0 ] && [ -n "$base_commit" ]; then
      g update-ref -m "git-vps foto" "refs/vps-fotos/$SELLO" "$base_commit"
      info "   No hace falta subir nada. Ya se puede conectar el servidor: $(comando alinear)"
    fi
    return 0
  fi
  analizar "$base_arbol" "$ARBOL"
  mostrar_resumen
  if [ "$SIMULAR" = 1 ]; then
    paso "Simulación terminada"
    [ "$VISIBILIDAD" = publico ] && aviso "Ojo: el repositorio $SLUG es PÚBLICO. Hacelo privado antes de la foto real."
    [ "$BLOQUEOS" -gt 0 ] && aviso "La foto real se va a frenar por las alertas graves de arriba (hay que resolverlas antes)."
    ok "No se creó ningún commit ni se subió nada (y no quedó nada ocupando disco)."
    return 0
  fi
  frenar_si_hay_alertas

  paso "Confirmación"
  info "  Se va a subir una foto del estado actual de $DIR"
  info "  a la rama NUEVA de GitHub: $rama"
  info "  No cambia ningún archivo del servidor ni la rama principal de GitHub."
  preguntar "Escribí SI para continuar:" SI || cancelar

  resolver_autor nopreguntar
  guardar_objetos
  local msg="${MENSAJE:-Foto del servidor $(hostname) ($DIR) $(date '+%Y-%m-%d %H:%M')}"
  msg+=$'\n\n'"Estado real de los archivos en producción, tomado con scripts/vps/git-vps.sh foto."
  msg+=$'\n'"Nuevos: $N_NUEVOS · Modificados: $N_MODIF · Borrados: $N_BORRADOS"
  crear_commit "$msg" "$base_commit"
  recordar_exclusiones
  base_sigue_en_github "$base_commit"
  g update-ref -m "git-vps foto" "refs/vps-fotos/$SELLO" "$COMMIT"

  if subir "$COMMIT:refs/heads/$rama"; then
    ok "Foto subida a GitHub en la rama $rama ($(g rev-parse --short "$COMMIT"))"
    if [ -n "$SLUG" ]; then
      info ""
      info "  Ver la foto:        $(url_github)/tree/$rama"
      info "  Comparar con $RAMA_PPAL:  $(url_github)/compare/$RAMA_PPAL...$rama"
    fi
    info ""
    info "  Próximo paso: pasale a Claude el nombre de la rama ($rama) para que la revise"
    info "  y se apruebe como versión oficial. Después: $(comando alinear)"
    info "  Mientras tanto no hace falta 'guardar'. Para respaldar lo nuevo, saquen otra foto."
  else
    g update-ref -d "refs/vps-fotos/$SELLO" "$COMMIT" 2>/dev/null
    info "  No se subió nada. Cuando se resuelva, corré de nuevo: $(comando foto)"
    exit 1
  fi
}

# ===========================================================================
# MODO: alinear
# ===========================================================================
modo_alinear() {
  preparar
  reparar_indice_pendiente
  cargar_exclusiones
  consultar_github
  traer_de_github
  local oficial rama_actual head_actual
  oficial="$(g rev-parse -q --verify "refs/remotes/$REMOTO/$RAMA_PPAL")" || morir "No encuentro la rama $RAMA_PPAL en GitHub."
  rama_actual="$(g symbolic-ref --short -q HEAD || true)"
  head_actual="$(g rev-parse -q --verify HEAD || true)"
  if esta_alineado && [ "$rama_actual" = "$RAMA_PPAL" ]; then
    ok "El servidor ya está alineado con $RAMA_PPAL. Para guardar cambios: $(comando guardar)"
    return 0
  fi

  # Elegir la foto aprobada:
  #  1) la más nueva que esté incluida en main (botón "Create a merge commit")
  #  2) la más nueva cuyo contenido sea idéntico a un commit de main (Squash/Rebase)
  #  3) la más nueva cuya diferencia con main no requiera un deploy
  local fotos c nombre foto="" nombre_foto="" t
  fotos="$(g for-each-ref --sort=-refname --format='%(objectname) %(refname)' refs/vps-fotos/)"
  [ -n "$fotos" ] || morir "No hay ninguna foto subida desde este servidor. Primero: $(comando foto)"
  while read -r c nombre; do
    [ -n "$c" ] && g merge-base --is-ancestor "$c" "$oficial" && { foto="$c"; nombre_foto="$nombre"; break; }
  done <<< "$fotos"
  if [ -z "$foto" ]; then
    g log --format='%T' -300 "$oficial" > "$TMPD/arboles_main.txt"
    while read -r c nombre; do
      [ -z "$c" ] && continue
      t="$(g rev-parse "$c^{tree}")"
      grep -qx "$t" "$TMPD/arboles_main.txt" && { foto="$c"; nombre_foto="$nombre"; break; }
    done <<< "$fotos"
  fi
  if [ -z "$foto" ]; then
    while read -r c nombre; do
      [ -z "$c" ] && continue
      clasificar_entrantes "$c" "$oficial"
      [ -s "$TMPD/deploy.txt" ] || { foto="$c"; nombre_foto="$nombre"; break; }
    done <<< "$fotos"
  fi
  if [ -z "$foto" ]; then
    clasificar_entrantes "$(printf '%s\n' "$fotos" | head -1 | cut -d' ' -f1)" "$oficial"
    error "La versión oficial ($RAMA_PPAL) no coincide con ninguna foto de este servidor. Diferencias:"
    head -30 "$TMPD/deploy.txt" | sed 's/^/    /'
    local nd; nd="$(wc -l < "$TMPD/deploy.txt")"; [ "$nd" -gt 30 ] && info "    … y $((nd-30)) más"
    morir "O la foto todavía no se aprobó en GitHub, o $RAMA_PPAL tiene cambios que el servidor no
   tiene (llevarlos es un deploy y se hace acompañado). Pasale esta salida a Claude.
   No se modificó nada."
  fi
  clasificar_entrantes "$foto" "$oficial"
  if [ -s "$TMPD/deploy.txt" ]; then
    error "La foto está en $RAMA_PPAL, pero después GitHub recibió cambios que el servidor no tiene:"
    head -30 "$TMPD/deploy.txt" | sed 's/^/    /'
    morir "Llevarlos al servidor es un deploy y se hace acompañado. Pasale esta salida a Claude. No se modificó nada."
  fi
  # Documentación que está en main y el servidor nunca tuvo (docs/, scripts/vps/): se agrega
  g ls-tree -r --name-only "$oficial" | while IFS= read -r p; do
    es_doc "$p" || continue
    { [ -e "$DIR/$p" ] || [ -L "$DIR/$p" ]; } && continue
    # El servidor lo tenía y lo borró: no se vuelve a escribir
    [ -n "$head_actual" ] && g cat-file -e "$head_actual:$p" 2>/dev/null && continue
    if g cat-file -e "$foto:$p" 2>/dev/null \
       && [ "$(g rev-parse -q --verify "$foto:$p")" != "$(g rev-parse -q --verify "$foto^:$p" 2>/dev/null || true)" ]; then
      continue    # la foto tenía la versión del servidor y después el servidor lo borró
    fi
    grep -q "^A	$p	" "$TMPD/escribir.txt" || printf 'A\t%s\t-\n' "$p"
  done >> "$TMPD/escribir.txt"
  info "  Foto:              $(g log -1 --format='%h %ad' --date=format:'%Y-%m-%d %H:%M' "$foto")"
  info "  Oficial en GitHub: $(g log -1 --format='%h %s' "$oficial")"

  if [ -n "$head_actual" ] && ! g merge-base --is-ancestor "$head_actual" "$oficial"; then
    aviso "El servidor tiene commits propios que no están en GitHub. No se pierden (quedan en el respaldo) y sus archivos no se tocan:"
    g log --format='    %h %ad %s' --date=short "$oficial..$head_actual" | head -10
    preguntar "¿Seguir? Escribí SI:" SI || cancelar
  fi
  local main_local; main_local="$(g rev-parse -q --verify "refs/heads/$RAMA_PPAL" || true)"
  if [ -n "$main_local" ] && [ "$main_local" != "$head_actual" ] && ! g merge-base --is-ancestor "$main_local" "$oficial"; then
    aviso "La rama local '$RAMA_PPAL' tiene commits que no están en GitHub (quedan en el respaldo)."
    preguntar "¿Seguir? Escribí SI:" SI || cancelar
  fi
  avisar_preparados

  paso "Plan"
  info "  1. Guardar la posición actual de git (respaldo)."
  info "  2. Apuntar la rama local '$RAMA_PPAL' a la versión oficial, sin tocar archivos del sistema."
  mostrar_entrantes
  preguntar "Escribí SI para empezar:" SI || cancelar

  escribir_entrantes "$oficial"
  mover_rama "$RAMA_PPAL" "$oficial" "$main_local"
  asegurar_exclusiones_permanentes
  g config nexovetgit.alineado 1
  # Las fotos ya usadas (esa y las anteriores) dejan de estar "pendientes"
  while read -r c nombre; do
    [ -z "$c" ] && continue
    if [[ ! "$nombre" > "$nombre_foto" ]]; then
      g update-ref "refs/vps-fotos-usadas/${nombre#refs/vps-fotos/}" "$c" && g update-ref -d "$nombre" "$c"
    fi
  done <<< "$fotos"
  ok "Servidor alineado con $RAMA_PPAL. Ningún archivo del sistema se modificó."

  contar_pendientes
  if [ "$PEND_GUARDAR" -gt 0 ]; then
    info "  Hay $PEND_GUARDAR archivo(s) del servidor distintos de la versión oficial (cambios hechos después de la foto)."
    info "  Guardalos con: $(comando guardar)"
  else
    ok "El servidor y GitHub están sincronizados."
  fi
  [ "$PEND_EXCLUIDOS" -gt 0 ] && info "  ($PEND_EXCLUIDOS archivo(s) con cambios que excluiste a propósito: no se suben.)"
  info "  Nota: 'git status' a mano puede mostrar archivos de más; no usen git add/commit a mano, usen guardar."
  return 0
}

# ===========================================================================
# MODO: guardar
# ===========================================================================
modo_guardar() {
  preparar
  if ! esta_alineado; then
    morir "Este servidor todavía no está alineado con la versión oficial.
   Pasos: $(comando foto)  →  se revisa y se aprueba en GitHub  →  $(comando alinear)
   (Mientras tanto, para respaldar lo nuevo, se puede sacar otra foto.)"
  fi
  reparar_indice_pendiente
  cargar_exclusiones
  consultar_github
  [ "$SIMULAR" = 1 ] || exigir_privado
  local rama; rama="$(g symbolic-ref --short -q HEAD)" || morir "El servidor no está en ninguna rama. Pasale '$(comando estado)' a Claude."
  if [ "$rama" != "$RAMA_PPAL" ]; then
    aviso "La rama local es '$rama' y la principal de GitHub es '$RAMA_PPAL'."
    preguntar "¿Guardar igual en '$rama'? Escribí SI:" SI || cancelar
  fi
  traer_de_github
  local remota="refs/remotes/$REMOTO/$rama" head_sha r_sha b_sha padre lado_a_lado=0
  head_sha="$(g rev-parse HEAD)"
  r_sha="$(g rev-parse -q --verify "$remota" || true)"
  [ -n "$r_sha" ] || r_sha="$(g rev-parse -q --verify "refs/remotes/$REMOTO/$RAMA_PPAL" || true)"
  [ -n "$r_sha" ] || morir "No encuentro la rama '$rama' ni '$RAMA_PPAL' en GitHub. Pasale '$(comando estado)' a Claude."
  # b_sha: lo último de GitHub que el servidor ya contiene
  b_sha="$(g merge-base "$head_sha" "$r_sha" 2>/dev/null || true)"
  [ -n "$b_sha" ] || morir "El historial del servidor no tiene nada en común con GitHub. Pasale '$(comando estado)' a Claude."

  padre="$r_sha"
  if [ "$b_sha" != "$r_sha" ]; then
    clasificar_entrantes "$b_sha" "$r_sha"
    if [ -s "$TMPD/deploy.txt" ]; then
      lado_a_lado=1; padre="$b_sha"
      aviso "GitHub tiene cambios que el servidor todavía no tiene:"
      head -15 "$TMPD/deploy.txt" | sed 's/^/    /'
      info "  Para no mezclar a ciegas, tus cambios se suben a una rama APARTE (vps/guardado-$SELLO)."
      info "  Llevar esos cambios de GitHub al servidor es un deploy: se hace acompañado (pedíselo a Claude)."
    else
      info "GitHub solo tiene documentación nueva: el servidor se pone al día solo."
      mostrar_entrantes
      if [ "$SIMULAR" = 1 ]; then
        padre="$b_sha"   # la simulación no escribe nada: se compara contra lo que el servidor ya tiene
      else
        if [ -s "$TMPD/escribir.txt" ]; then
          preguntar "Escribí SI para agregar/actualizar esa documentación y seguir:" SI || cancelar
        fi
        escribir_entrantes "$r_sha"
      fi
    fi
  fi
  if [ "$head_sha" != "$b_sha" ]; then
    aviso "El servidor tiene $(g rev-list --count "$b_sha..$head_sha") commit(s) que GitHub no tiene: no se suben tal cual. Su contenido final va dentro de este guardado, revisado."
  fi

  sacar_foto_archivos "$padre"
  if [ "$ARBOL" = "$(g rev-parse "$padre^{tree}")" ]; then
    recordar_exclusiones
    if [ "$SIMULAR" = 0 ] && [ "$lado_a_lado" = 0 ] && [ "$head_sha" != "$padre" ]; then
      avisar_preparados
      mover_rama "$rama" "$padre" "$head_sha"
      ok "No hay cambios para subir. El servidor quedó al día con GitHub (sin tocar archivos del sistema)."
    else
      ok "No hay nada para guardar: el servidor coincide con GitHub."
    fi
    [ -s "$TMPD/excl_track.txt" ] && info "   (Los cambios en archivos que excluiste con --excluir no se suben.)"
    return 0
  fi

  analizar "$(g rev-parse "$padre^{tree}")" "$ARBOL"
  mostrar_resumen
  if [ "$SIMULAR" = 1 ]; then
    paso "Simulación terminada"
    ok "No se creó ningún commit ni se subió nada."
    return 0
  fi
  frenar_si_hay_alertas
  [ "$lado_a_lado" = 0 ] && avisar_preparados

  if [ -z "$MENSAJE" ] && [ -t 0 ] && [ "$SI" = 0 ]; then
    read -r -p "¿Qué cambiaste? (una línea, ej: 'arreglo precio en carrito'): " MENSAJE
  fi
  [ -n "$MENSAJE" ] || MENSAJE="Cambios guardados desde el servidor $(date '+%Y-%m-%d %H:%M')"
  resolver_autor preguntar
  paso "Confirmación"
  info "  Commit: \"$MENSAJE\"  (autor: $GIT_AUTHOR_NAME)"
  if [ "$lado_a_lado" = 1 ]; then
    info "  Se sube a la rama aparte vps/guardado-$SELLO. No cambia ningún archivo del servidor."
  else
    info "  Se sube a '$rama' en GitHub. No cambia ningún archivo del servidor."
  fi
  preguntar "Escribí SI para guardar:" SI || cancelar

  guardar_objetos
  crear_commit "$MENSAJE" "$padre"
  recordar_exclusiones
  base_sigue_en_github "$padre"
  if [ "$lado_a_lado" = 1 ]; then
    g update-ref -m "git-vps guardado" "refs/vps-guardados/$SELLO" "$COMMIT"
    subir "$COMMIT:refs/heads/vps/guardado-$SELLO" || { g update-ref -d "refs/vps-guardados/$SELLO" "$COMMIT"; exit 1; }
    ok "Cambios subidos a la rama aparte vps/guardado-$SELLO"
    [ -n "$SLUG" ] && info "  $(url_github)/compare/$rama...vps/guardado-$SELLO"
    info "  Pasale ese link a Claude para que lo combine con '$rama'."
    return 0
  fi
  # Se anota como "propio" antes de subir: si se corta justo después de que GitHub
  # lo aceptó, la próxima vez se reconoce como cambio del servidor.
  g update-ref -m "git-vps guardado" "refs/vps-guardados/$SELLO" "$COMMIT"
  # Primero se sube; recién si GitHub lo aceptó se mueve la rama del servidor
  PASO=commit; RAMA_SUBIENDO="$rama"
  if subir "$COMMIT:refs/heads/$rama"; then
    PASO=""; RAMA_SUBIENDO=""
    mover_rama "$rama" "$COMMIT" "$head_sha"
    asegurar_exclusiones_permanentes
    ok "Guardado y subido a GitHub ($rama): $(g rev-parse --short HEAD) \"$MENSAJE\""
    [ -n "$SLUG" ] && info "  $(url_github)/commit/$(g rev-parse HEAD)"
    return 0
  fi
  PASO=""; RAMA_SUBIENDO=""
  if [ "$RECHAZADO" != 0 ]; then
    base_sigue_en_github "$padre"
    if subir "$COMMIT:refs/heads/vps/guardado-$SELLO"; then
      ok "Tus cambios quedaron en la rama aparte vps/guardado-$SELLO (el servidor no cambió)."
      [ -n "$SLUG" ] && info "  Pasale a Claude: $(url_github)/compare/$rama...vps/guardado-$SELLO"
      return 0
    fi
  fi
  info "  No se subió nada y el servidor quedó como estaba. Repetí 'guardar' cuando se resuelva."
  exit 1
}

# ===========================================================================
# MODO: iniciar (proyecto sin git)
# ===========================================================================
modo_iniciar() {
  command -v git >/dev/null 2>&1 || morir "git no está instalado en este servidor."
  [ -d "$DIR" ] || morir "No existe la carpeta $DIR"
  DIR="$(cd "$DIR" && pwd -P)"
  local otro ya_tenia=0
  if [ -e "$DIR/.git" ]; then
    # Ya tiene git: solo se acepta si todavía no está conectada con ningún GitHub
    [ -d "$DIR/.git" ] || morir "La carpeta .git de $DIR no es una carpeta común. Pasale esta salida a Claude. No se hizo nada."
    otro="$(g rev-parse --show-toplevel 2>/dev/null || true)"
    [ "$otro" = "$DIR" ] || morir "git no puede leer $DIR/.git. Pasale esta salida a Claude. No se hizo nada."
    [ -z "$(g remote)" ] || morir "Esta carpeta ya tiene git y está conectada con $(g config --get remote.origin.url 2>/dev/null || g remote | head -1).
   Para seguir: $(comando foto) --simular"
    for otro in MERGE_HEAD rebase-merge rebase-apply CHERRY_PICK_HEAD REVERT_HEAD BISECT_LOG; do
      [ -e "$DIR/.git/$otro" ] && morir "Hay una operación de git a medio terminar ($otro). Pasale esta salida a Claude. No se hizo nada."
    done
    ya_tenia=1
  else
    otro="$(git -c safe.directory='*' -C "$DIR" rev-parse --show-toplevel 2>/dev/null || true)"
    [ -z "$otro" ] || morir "Esta carpeta está dentro de otro repositorio git ($otro). Pasale esta salida a Claude. No se hizo nada."
  fi
  [ -n "$URL_NUEVA" ] || morir "Falta --url con el repositorio nuevo de GitHub (por ejemplo: --url https://github.com/lucassvt/express)."
  # Si nginx sirve archivos directo de esta carpeta, un .git quedaría descargable
  if command -v nginx >/dev/null 2>&1; then
    local rt
    while read -r rt; do
      [ -z "$rt" ] && continue
      case "$DIR/" in "$rt"/*|"$rt/") morir "nginx sirve archivos directamente desde $rt: crear .git acá podría exponer el código. Pasale esto a Claude. No se hizo nada." ;; esac
    done < <(nginx -T 2>/dev/null | awk '$1=="root"||$1=="alias"{v=$2; gsub(/[;"\047]/,"",v); sub(/\/+$/,"",v); if (v!="") print v}' | sort -u)
  fi
  TMPD="$(mktemp -d "${TMPDIR:-/tmp}/git-vps.XXXXXX")" || morir "No pude crear una carpeta temporal"
  URL_REMOTO="$URL_NUEVA"
  local remoto_guardado="$REMOTO"; REMOTO="$URL_NUEVA"
  consultar_github
  REMOTO="$remoto_guardado"
  [ -n "$SLUG" ] || morir "La dirección no parece un repositorio de GitHub: $URL_NUEVA"
  exigir_privado
  sonda ls-remote --heads "$URL_NUEVA" > "$TMPD/heads.txt" 2>/dev/null \
    || morir "No pude conectarme con $URL_NUEVA (¿existe el repositorio? ¿el servidor tiene credenciales?)."
  [ -s "$TMPD/heads.txt" ] || morir "El repositorio de GitHub está vacío. Borralo y crealo de nuevo tildando 'Add a README file'."
  paso "Plan"
  info "  Carpeta:      $DIR"
  info "  Repositorio:  $SLUG (privado) — rama principal: $RAMA_PPAL"
  if [ "$ya_tenia" = 1 ]; then
    info "  La carpeta ya tiene git (con su historial) pero no está conectada: solo se agrega la conexión."
    info "  Su historial NO se sube tal cual: la foto va a ser un único cambio revisado."
  else
    info "  Se crea la carpeta oculta .git y se conecta con GitHub."
  fi
  info "  NO se toca ningún archivo del proyecto."
  preguntar "Escribí SI para continuar:" SI || morir "Cancelado. No se hizo nada."
  if [ "$ya_tenia" = 1 ]; then
    local dueno_cfg; dueno_cfg="$(stat -c %u:%g "$DIR/.git/config" 2>/dev/null || true)"
    g remote add origin "$URL_NUEVA" || morir "No pude conectar con GitHub."
    [ "$(id -u)" = 0 ] && [ -n "$dueno_cfg" ] && chown "$dueno_cfg" "$DIR/.git/config" 2>/dev/null
  else
    { g init -q && g symbolic-ref HEAD "refs/heads/$RAMA_PPAL"; } || morir "No pude crear el repositorio."
    g remote add origin "$URL_NUEVA" || morir "No pude conectar con GitHub."
    if [ "$(id -u)" = 0 ] && [ "$(stat -c %u "$DIR")" != 0 ]; then
      chown -R "$(stat -c %u:%g "$DIR")" "$DIR/.git" 2>/dev/null
    fi
  fi
  ok "Listo: $DIR ya tiene git y está conectado con $SLUG. Ningún archivo del proyecto cambió."
  info "  Próximo paso: $(comando foto) --simular   y después   $(comando foto)"
}

case "$MODO" in
  iniciar) modo_iniciar ;;
  estado) modo_estado ;;
  foto) modo_foto ;;
  alinear) modo_alinear ;;
  guardar) modo_guardar ;;
esac
