#!/usr/bin/env bash
# =============================================================================
# git-vps.sh — Guardar en GitHub el código del servidor sin romper nada
# =============================================================================
#
# Este script NUNCA modifica ni borra archivos del sistema en vivo.
# Lo que escribe va dentro de la carpeta oculta .git (el historial) o en una
# carpeta temporal. Única excepción: "alinear" y "guardar" pueden AGREGAR
# archivos nuevos que vienen de GitHub, solo si están fuera de backend/ y
# backend-storefront/ (por ejemplo docs/ o scripts/) y sin pisar nada.
# Traer cambios de código de GitHub al servidor (un "deploy") NO lo hace este
# script: se hace acompañado.
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
#   --ignorar-alertas    Seguir aunque se detecten posibles contraseñas.
#                        Solo después de revisar que son falsas alarmas.
#   --permitir-publico   Subir aunque el repositorio de GitHub sea público.
#   --rama NOMBRE        (foto) Nombre de la rama nueva.
#   --remoto NOMBRE      Remoto de git (por defecto: origin).
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

VERSION="2.0"
DIR_POR_DEFECTO="/var/www/nexovet-shop"
: "${HOME:=$(getent passwd "$(id -un)" 2>/dev/null | cut -d: -f6)}"
export HOME

# ---------------------------------------------------------------------------
# Opciones
# ---------------------------------------------------------------------------
MODO=""; DIR=""; SIMULAR=0; SI=0; IGNORAR_ALERTAS=0; PERMITIR_PUBLICO=0
MENSAJE=""; AUTOR=""; RAMA_NUEVA=""; REMOTO="origin"
EXCLUIR_EXTRA=()

ayuda() { sed -n '2,54p' "$0" | sed 's/^# \{0,1\}//'; }
valor() {
  if [ $# -lt 2 ] || [ -z "$2" ]; then
    echo "Falta el valor de $1 (ver: bash $0 --help)" >&2; exit 2
  fi
}

while [ $# -gt 0 ]; do
  case "$1" in
    estado|foto|alinear|guardar) MODO="$1"; shift ;;
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
    --excluir) valor "$@"; EXCLUIR_EXTRA+=("$2"); shift 2 ;;
    -h|--help|ayuda) ayuda; exit 0 ;;
    --version) echo "git-vps.sh $VERSION"; exit 0 ;;
    -*) echo "Opción desconocida: $1 (ver: bash $0 --help)" >&2; exit 2 ;;
    *) if [ -z "$DIR" ]; then DIR="$1"; shift; else echo "Argumento de más: $1" >&2; exit 2; fi ;;
  esac
done
if [ -z "$MODO" ]; then
  [ -n "$DIR" ] && echo "Falta el modo, o '$DIR' no es un modo válido (estado, foto, alinear, guardar)." >&2
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

# preguntar "texto" PALABRA → 0 solo si el usuario escribe PALABRA (--si la saltea)
preguntar() {
  [ "$SI" = 1 ] && return 0
  [ -t 0 ] || morir "Hace falta confirmar pero no hay una terminal interactiva. Si estás seguro, usá --si."
  local r; read -r -p "$1 " r; [ "$r" = "$2" ]
}
# Igual, pero --si NO la saltea (confirmaciones de seguridad).
preguntar_seguridad() {
  [ -t 0 ] || return 1
  local r; read -r -p "$1 " r; [ "$r" = "$2" ]
}

# Nunca pedir usuario/contraseña de GitHub por teclado (GitHub no acepta
# contraseñas y lo tipeado podría quedar en el historial de la consola).
export GIT_TERMINAL_PROMPT=0 GIT_PAGER=cat PAGER=cat

ARBOL_VACIO="4b825dc642cb6eb9a060e54bf8d69288fbee4904"
SELLO="$(date +%Y%m%d-%H%M%S)"
TMPD=""; GITDIR=""; ARREGLAR_DUENO=0; DUENO_GIT=""; DUENO_DIR=""; PASO=""
ALT_ORIG="${GIT_ALTERNATE_OBJECT_DIRECTORIES:-}"

# git con protecciones: sin hooks (podrían modificar archivos), sin fsmonitor,
# sin autostash, sin mantenimiento automático, sin índice dividido.
g() {
  git -c safe.directory="$DIR" -c core.hooksPath=/dev/null -c core.fsmonitor=false \
      -c core.quotePath=false -c merge.autoStash=false -c rebase.autoStash=false \
      -c gc.auto=0 -c maintenance.auto=false -c core.splitIndex=false \
      -c splitIndex.sharedIndexExpire=never --no-pager -C "$DIR" "$@"
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
  if [ "$ARREGLAR_DUENO" = 1 ] && [ -n "$GITDIR" ] && [ -n "$DUENO_GIT" ] && [ -e "$TMPD/inicio" ]; then
    # Lo que root creó dentro de .git vuelve al dueño (sin seguir enlaces)
    find "$GITDIR" -xdev \( -uid 0 -o -gid 0 \) ! -type l -newer "$TMPD/inicio" \
      -exec chown -h "$DUENO_GIT" {} + 2>/dev/null || true
    # Archivos nuevos que se agregaron al proyecto (alinear/guardar)
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
      rama)     error "Cancelado mientras se movía la rama de git (ningún archivo del sistema se tocó). Corré: bash $0 estado y pasale la salida a Claude." ;;
      commit)   error "Cancelado: el commit quedó guardado en el servidor pero puede no haberse subido. Corré de nuevo: bash $0 guardar" ;;
      escribir) error "Cancelado mientras se agregaban archivos nuevos de GitHub (docs/scripts). Ningún archivo existente se tocó. Corré: bash $0 estado" ;;
      *)        error "Cancelado por el usuario. No se cambió ningún archivo del sistema." ;;
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
.env
.env.*
*.env
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
*.bk
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

# Carpetas de las aplicaciones en vivo: ahí este script nunca escribe.
APPS_EN_VIVO='backend/ backend-storefront/'

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
    error "Este usuario ($(id -un)) no tiene el bloque 'Host github-…' en ~/.ssh/config: hacé la sección 'Credenciales' de la guía como este usuario."
  elif grep -qi 'read only\|write access to repository not granted' "$f"; then
    error "La deploy key no tiene permiso de escritura: en GitHub → Settings → Deploy keys, agregala de nuevo tildando 'Allow write access'."
  elif grep -qi 'Repository not found' "$f"; then
    error "GitHub no encuentra el repositorio con estas credenciales (¿la clave está cargada en ese repositorio? ¿la URL del remoto es correcta?)."
  elif grep -qi 'authentication\|permission denied\|403\|could not read username\|terminal prompts disabled\|could not read from remote' "$f"; then
    error "GitHub no aceptó las credenciales del servidor. Ver docs/GIT-GUIA.md → 'Credenciales'."
  elif grep -qi 'could not resolve host\|network is unreachable\|timed out\|connection refused\|connection reset' "$f"; then
    error "Parece un problema de conexión a internet."
  fi
  return 0
}

traer_de_github() {
  info "Consultando GitHub (git fetch: solo descarga información, no toca archivos)…"
  if ! GIT_SSH_COMMAND="$(ssh_sin_preguntas)" g fetch --quiet "$REMOTO" > "$TMPD/fetch.log" 2>&1; then
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
  [ "${#EXCLUIR_EXTRA[@]}" -gt 0 ] && printf '%s\n' "${EXCLUIR_EXTRA[@]}" >> "$TMPD/excl_extra"
  sed -i '/^[[:space:]]*$/d' "$TMPD/excl_extra"
  if [ -s "$TMPD/excl_extra" ]; then
    { echo "# --- pedidas con --excluir ---"; cat "$TMPD/excl_extra"; } >> "$f"
  fi
  [ -s "$rec" ] && info "(Sigo excluyendo lo que se pidió antes con --excluir: $(tr '\n' ' ' < "$rec"))"
  # Si faltara el archivo, git no avisaría y subiría todo
  [ -s "$f" ] || morir "No pude preparar la lista de exclusiones."
}

recordar_exclusiones() {
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
  mkdir -p "$TMPD/obj"
  export GIT_OBJECT_DIRECTORY="$TMPD/obj"
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
  cat "$TMPD/candidatos.z" "$TMPD/base.z" | (cd "$DIR" && xargs -0 -r stat -c '%s %n' -- 2>/dev/null) > "$TMPD/tamanos.txt"
  local grandes kb libre
  grandes="$(awk '$1>95*1048576{ s=$1; $1=""; printf "      %d MB%s\n", s/1048576, $0 }' "$TMPD/tamanos.txt")"
  [ -z "$grandes" ] || morir "Hay archivos de más de 95 MB (GitHub no los acepta):
$grandes
   Excluilos con --excluir 'ruta' y repetí. No se hizo nada."
  kb="$(awk '{s+=$1} END{print int(s/1024)}' "$TMPD/tamanos.txt")"
  libre="$(df -Pk "$TMPD" | awk 'NR==2{print $4}')"
  if [ -n "$libre" ] && [ $((kb * 2 + 524288)) -gt "$libre" ]; then
    morir "Leer los archivos necesita unos $((kb * 2 / 1024 + 512)) MB libres en ${TMPDIR:-/tmp} y hay $((libre/1024)) MB. No sigo para no llenar el disco del servidor."
  fi

  if ! gi -c core.excludesFile="$TMPD/excluir" -c advice.addEmbeddedRepo=false add -A . 2>"$TMPD/add.err"; then
    sed 's/^/    /' "$TMPD/add.err" >&2
    morir "Falló la lectura de archivos (git add). No se hizo nada."
  fi
  grep -v '^warning: LF will be replaced\|^warning: in the working copy\|^warning: CRLF will be replaced' "$TMPD/add.err" | head -20

  # La lista propia manda aunque un .gitignore del proyecto diga lo contrario
  # (backend/.gitignore tiene '!src/**'): lo NUEVO que coincida queda afuera.
  gi ls-files -z -c -i --exclude-from="$TMPD/excluir" | LC_ALL=C sort -z > "$TMPD/excl_idx.z"
  LC_ALL=C comm -z -23 "$TMPD/excl_idx.z" "$TMPD/base.z" > "$TMPD/forzados.z"
  if [ -s "$TMPD/forzados.z" ]; then
    gi update-index -z --force-remove --stdin < "$TMPD/forzados.z" || morir "No pude aplicar las exclusiones."
  fi
  # --excluir sobre archivos que YA estaban en git: se conserva la versión anterior
  : > "$TMPD/excl_track.z"
  if [ -s "$TMPD/excl_extra" ] && [ -n "$ARMADO_SOBRE" ]; then
    GIT_INDEX_FILE="$TMPD/indice_base" g read-tree "$ARMADO_SOBRE"
    GIT_INDEX_FILE="$TMPD/indice_base" g ls-files -z -c -i --exclude-from="$TMPD/excl_extra" > "$TMPD/excl_track.z"
    if [ -s "$TMPD/excl_track.z" ]; then
      xargs -0 env GIT_INDEX_FILE="$TMPD/indice" git -c safe.directory="$DIR" --literal-pathspecs -C "$DIR" \
        reset -q "$ARMADO_SOBRE" -- < "$TMPD/excl_track.z" || morir "No pude aplicar --excluir a archivos que ya estaban en git."
    fi
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
}

# Pasa los datos de la cuarentena a .git (recién después de confirmar)
guardar_objetos() {
  unset GIT_OBJECT_DIRECTORY
  if [ -n "$ALT_ORIG" ]; then export GIT_ALTERNATE_OBJECT_DIRECTORIES="$ALT_ORIG"; else unset GIT_ALTERNATE_OBJECT_DIRECTORIES; fi
  [ -d "$TMPD/obj" ] || return 0
  local f
  while IFS= read -r -d '' f; do
    [ -e "$GITDIR/objects/$f" ] && continue
    mkdir -p "$GITDIR/objects/$(dirname "$f")" && cp -p "$TMPD/obj/$f" "$GITDIR/objects/$f" \
      || morir "No pude guardar los datos dentro de .git (¿disco lleno?). No se subió nada."
  done < <(cd "$TMPD/obj" && find . -type f ! -name '*.lock' -printf '%P\0')
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
      g cat-file blob "$sha" | tr -c '[:print:]' '\n' | awk -v p="$r" 'length($0)>=6{print p "\t" $0}' >> "$TMPD/agregado.tsv" \
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
    'ALTA|dirección con usuario y contraseña||[a-zA-Z][a-zA-Z0-9+.-]*://[^/[:space:]:@"'"'"'`]+:[^/[:space:]@"'"'"'`$]{3,}@'
    'MEDIA|token JWT||eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}'
    'MEDIA|contraseña/token escrito en el código|-i|(pass|password|passwd|pwd|secret|token|api[_-]?key|access[_-]?key|client[_-]?secret|auth[_-]?key)[a-z0-9_]*["'"'"'`]?[[:space:]]*[:=][[:space:]]*["'"'"'`][^"'"'"'`[:space:]]{8,}["'"'"'`]'
    'MEDIA|contraseña/token sin comillas|-i|(pass(word|wd)?|pwd|secret|token|api[_-]?key|authorization|[a-z0-9]+_key)[a-z0-9_]*["'"'"'`]?[[:space:]]*[:=][[:space:]]*[`"'"'"']?([A-Za-z0-9_!@#%^&*+=/-]{3,}[0-9][A-Za-z0-9_!@#%^&*+=/-]*|[A-Za-z0-9_!@#%^&*+=/-]*[0-9][A-Za-z0-9_!@#%^&*+=/-]{3,})'
    'MEDIA|variable secreta con valor||(PASS|PASSWORD|PASSWD|SECRET|TOKEN|API_KEY|APIKEY|ACCESS_KEY|PRIVATE_KEY)[A-Z0-9_]*[[:space:]]*(=|:[[:space:]])[[:space:]]*[^[:space:]$"'"'"'{}()<>]{8,}'
    'MEDIA|valor por defecto de una clave||(PASS|SECRET|TOKEN|KEY|PWD)[A-Z0-9_]*[[:space:]]*(\|\||\?\?)[[:space:]]*["'"'"'`][^"'"'"'`[:space:]]{6,}["'"'"'`]'
    'MEDIA|encabezado de autorización|-i|(bearer|basic)[[:space:]]+[A-Za-z0-9._~+/=-]{20,}'
  )
  local p nivel desc flags re linea archivo m
  for p in "${patrones[@]}"; do
    nivel="${p%%|*}"; p="${p#*|}"
    desc="${p%%|*}"; p="${p#*|}"
    flags="${p%%|*}"; re="${p#*|}"
    while IFS= read -r linea; do
      archivo="${linea%%$'\t'*}"
      m="$(printf '%s' "${linea#*$'\t'}" | grep -aoE $flags -m1 -- "$re" | head -1)"
      [ -z "$m" ] && continue
      if [ "$desc" = "dirección con usuario y contraseña" ] && \
         printf '%s' "$m" | grep -aqiE ':(password|pass|pwd|contrase..?a|secret|changeme|x{3,}|\*+|<[^>]*>|your[_a-z-]*|user|usuario)@'; then
        continue   # ejemplos típicos, no claves reales
      fi
      agregar_hallazgo "$nivel" "$archivo" "$desc: $(enmascarar_valor "$m")"
    done < <(grep -aE $flags -- "$re" "$TMPD/agregado.tsv" 2>/dev/null | head -300)
  done

  # 4) Datos personales: muchos emails distintos en un mismo archivo
  local n
  while IFS=$'\t' read -r archivo n; do
    [ -n "$archivo" ] && agregar_hallazgo MEDIA "$archivo" "parece tener datos personales ($n emails distintos)"
  done < <(awk -F'\t' '{
      f=$1; sub(/^[^\t]*\t/,"")
      k=split($0,a,/[^A-Za-z0-9._%+@-]+/)
      for(i=1;i<=k;i++) if (a[i] ~ /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+[.][A-Za-z0-9.-]*[A-Za-z][A-Za-z]$/) {
        key=f SUBSEP a[i]; if(!(key in s)){s[key]=1; c[f]++} }
    } END { for (x in c) if (c[x]>=20) print x "\t" c[x] }' "$TMPD/agregado.tsv")

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

COMMIT=""
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
  if g push "$REMOTO" "$1" > "$TMPD/push.log" 2>&1; then
    return 0
  fi
  sed -E 's#(://[^:/@[:space:]]+:)[^@[:space:]]+@#\1****@#g; s/^/    /' "$TMPD/push.log"
  if grep -qi 'rejected\|non-fast-forward\|fetch first' "$TMPD/push.log"; then
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

# ---------------------------------------------------------------------------
# Cambios que llegan de GitHub: ¿se pueden aceptar sin tocar el sistema?
#   sin efecto → el servidor ya tiene exactamente esa versión
#   seguro     → archivo NUEVO fuera de las apps en vivo, que no existe acá
#   deploy     → cualquier otra cosa: este script NO lo hace
# ---------------------------------------------------------------------------
clasificar_entrantes() { # $1 desde  $2 hasta
  local desde="$1" hasta="$2" est r blob_hasta blob_local existe app en_app
  : > "$TMPD/seguros.txt"; : > "$TMPD/sin_efecto.txt"; : > "$TMPD/deploy.txt"
  while IFS= read -r -d '' est && IFS= read -r -d '' r; do
    existe=0; { [ -e "$DIR/$r" ] || [ -L "$DIR/$r" ]; } && existe=1
    blob_hasta=""; [ "$est" != D ] && blob_hasta="$(g rev-parse -q --verify "$hasta:$r" 2>/dev/null || true)"
    blob_local=""
    if [ -L "$DIR/$r" ]; then
      blob_local="$(printf '%s' "$(readlink "$DIR/$r")" | g hash-object --stdin)"
    elif [ -f "$DIR/$r" ]; then
      blob_local="$(g hash-object -- "$r" 2>/dev/null || true)"
    fi
    if [ "$est" = D ]; then
      if [ "$existe" = 0 ]; then printf '%s\n' "$r" >> "$TMPD/sin_efecto.txt"
      else printf '[se borraría] %s\n' "$r" >> "$TMPD/deploy.txt"; fi
      continue
    fi
    if [ "$existe" = 1 ] && [ -n "$blob_local" ] && [ "$blob_local" = "$blob_hasta" ]; then
      printf '%s\n' "$r" >> "$TMPD/sin_efecto.txt"; continue
    fi
    en_app=0
    for app in $APPS_EN_VIVO; do case "$r" in "$app"*) en_app=1 ;; esac; done
    if [ "$est" = A ] && [ "$existe" = 0 ] && [ "$en_app" = 0 ]; then
      printf '%s\n' "$r" >> "$TMPD/seguros.txt"
    elif [ "$est" = A ] && [ "$existe" = 1 ]; then
      printf '[pisaría un archivo del servidor] %s\n' "$r" >> "$TMPD/deploy.txt"
    elif [ "$en_app" = 1 ]; then
      printf '[código de la app en vivo] %s\n' "$r" >> "$TMPD/deploy.txt"
    else
      printf '[cambia un archivo del servidor] %s\n' "$r" >> "$TMPD/deploy.txt"
    fi
  done < <(g diff-tree -r -z --no-renames --name-status "$desde" "$hasta")
}

mostrar_entrantes() {
  if [ -s "$TMPD/seguros.txt" ]; then
    info "  Archivos NUEVOS de GitHub que se agregan al servidor (fuera de las apps, no pisan nada):"
    head -30 "$TMPD/seguros.txt" | sed 's/^/    + /'
  fi
  [ -s "$TMPD/sin_efecto.txt" ] && info "  ($(wc -l < "$TMPD/sin_efecto.txt") cambio(s) de GitHub que el servidor ya tiene: no se toca nada)"
  return 0
}

respaldar_posicion() { # $1 = rama que se va a mover
  local h m
  h="$(g rev-parse -q --verify HEAD || true)"
  [ -n "$h" ] && g update-ref -m "git-vps respaldo" "refs/vps-respaldo/$SELLO" "$h"
  m="$(g rev-parse -q --verify "refs/heads/$1" || true)"
  [ -n "$m" ] && [ "$m" != "$h" ] && g update-ref -m "git-vps respaldo" "refs/vps-respaldo/$SELLO-$1" "$m"
  [ -f "$GITDIR/index" ] && cp -p "$GITDIR/index" "$GITDIR/index.respaldo-$SELLO"
  info "  (posición anterior de git guardada en refs/vps-respaldo/$SELLO)"
}

avisar_preparados() {
  g rev-parse -q --verify HEAD >/dev/null || return 0
  if ! GIT_OPTIONAL_LOCKS=0 g diff-index --cached --quiet HEAD -- 2>/dev/null; then
    aviso "Hay cambios 'preparados' a mano en git (git add / git rm --cached). El índice de git se va a rehacer (los archivos no se tocan):"
    GIT_OPTIONAL_LOCKS=0 g diff-index --cached --name-status HEAD -- | head -20 | sed 's/^/    /'
    preguntar "¿Seguir? Escribí SI:" SI || morir "Cancelado. No se hizo nada."
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
  respaldar_posicion "$1"
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
  PASO=""
}

# Escribe los archivos "seguros" (nuevos, fuera de las apps) desde el índice
escribir_seguros() {
  [ -s "$TMPD/seguros.txt" ] || return 0
  PASO=escribir
  local r top
  while IFS= read -r r; do
    [ -z "$r" ] && continue
    { [ -e "$DIR/$r" ] || [ -L "$DIR/$r" ]; } && continue   # nunca pisar
    top="$r"
    while [ "$(dirname "$top")" != "." ] && [ ! -e "$DIR/$(dirname "$top")" ]; do top="$(dirname "$top")"; done
    printf '%s\n' "$top" >> "$TMPD/escritos.txt"
    g checkout-index -q -- "$r" || aviso "No pude escribir $r (no es grave)."
  done < "$TMPD/seguros.txt"
  sort -u "$TMPD/escritos.txt" -o "$TMPD/escritos.txt"
  PASO=""
}

# Cuenta lo que "guardar" subiría (con las mismas reglas), sin escribir nada.
PEND_GUARDAR=0; PEND_EXCLUIDOS=0
contar_pendientes() {
  local -x LC_ALL=C GIT_OPTIONAL_LOCKS=0
  g -c core.excludesFile="$TMPD/excluir" ls-files -z -o --exclude-standard 2>/dev/null | sort -z > "$TMPD/p_std.z"
  g ls-files -z -o --exclude-from="$TMPD/excluir" 2>/dev/null | sort -z > "$TMPD/p_x.z"
  local nuevos; nuevos="$(comm -z -12 "$TMPD/p_std.z" "$TMPD/p_x.z" | tr -cd '\0' | wc -c)"
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
  [ -e "$GITDIR/git-vps-indice-pendiente" ] && info "  (Índice de git pendiente de refrescar: se arregla solo en el próximo guardar.)"
  local fotos; fotos="$(g for-each-ref --sort=-refname --format='    %(refname:short)  %(objectname:short)' refs/vps-fotos/ | head -5)"
  paso "Próximo paso"
  if esta_alineado; then
    info "  El servidor está alineado con la versión oficial. Para guardar cambios: bash $0 guardar"
  elif [ -n "$fotos" ]; then
    info "  Fotos sacadas, esperando aprobación en GitHub:"
    info "$fotos"
    info "  Cuando la foto esté aprobada en GitHub: bash $0 alinear"
  else
    info "  Todavía no hay versión oficial. Primero: bash $0 foto --simular   y después:   bash $0 foto"
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
    info "   Para guardar cambios: bash $0 guardar"
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
  local base_commit base_arbol="$ARBOL_VACIO" h
  base_commit="$(g rev-parse -q --verify "refs/remotes/$REMOTO/$RAMA_PPAL" || true)"
  [ -n "$base_commit" ] && base_arbol="$(g rev-parse "$base_commit^{tree}")"
  h="$(g rev-parse -q --verify HEAD || true)"
  if [ -n "$h" ] && [ -n "$base_commit" ] && ! g merge-base --is-ancestor "$h" "$base_commit"; then
    info "(El servidor tiene commits propios que GitHub no tiene; la foto incluye igual todos sus archivos.)"
  fi

  sacar_foto_archivos "$base_commit"
  if [ "$ARBOL" = "$base_arbol" ]; then
    ok "No hay nada nuevo: los archivos del servidor son idénticos a $RAMA_PPAL de GitHub."
    if [ "$SIMULAR" = 0 ] && [ -n "$base_commit" ]; then
      g update-ref -m "git-vps foto" "refs/vps-fotos/$SELLO" "$base_commit"
      info "   No hace falta subir nada. Ya se puede conectar el servidor: bash $0 alinear"
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
  preguntar "Escribí SI para continuar:" SI || morir "Cancelado. No se hizo nada."

  resolver_autor nopreguntar
  guardar_objetos
  local msg="${MENSAJE:-Foto del servidor $(hostname) ($DIR) $(date '+%Y-%m-%d %H:%M')}"
  msg+=$'\n\n'"Estado real de los archivos en producción, tomado con scripts/vps/git-vps.sh foto."
  msg+=$'\n'"Nuevos: $N_NUEVOS · Modificados: $N_MODIF · Borrados: $N_BORRADOS"
  crear_commit "$msg" "$base_commit"
  g update-ref -m "git-vps foto" "refs/vps-fotos/$SELLO" "$COMMIT"
  recordar_exclusiones
  ok "Foto creada: $(g rev-parse --short "$COMMIT") (queda registrada en el servidor como refs/vps-fotos/$SELLO)"

  if subir "$COMMIT:refs/heads/$rama"; then
    ok "Foto subida a GitHub en la rama $rama"
    if [ -n "$SLUG" ]; then
      info ""
      info "  Ver la foto:        $(url_github)/tree/$rama"
      info "  Comparar con main:  $(url_github)/compare/$RAMA_PPAL...$rama"
    fi
    info ""
    info "  Próximo paso: pasale a Claude el nombre de la rama ($rama) para que la revise"
    info "  y se apruebe como versión oficial. Después: bash $0 alinear"
    info "  Mientras tanto no hace falta 'guardar'. Para respaldar lo nuevo, saquen otra foto."
  else
    info "  La foto quedó guardada en el servidor. Para reintentar solo la subida:"
    info "     git -C $DIR push $REMOTO $COMMIT:refs/heads/$rama"
    exit 1
  fi
}

# ===========================================================================
# MODO: alinear
# ===========================================================================
modo_alinear() {
  preparar
  cargar_exclusiones
  consultar_github
  traer_de_github
  local oficial rama_actual head_actual
  oficial="$(g rev-parse -q --verify "refs/remotes/$REMOTO/$RAMA_PPAL")" || morir "No encuentro la rama $RAMA_PPAL en GitHub."
  rama_actual="$(g symbolic-ref --short -q HEAD || true)"
  head_actual="$(g rev-parse -q --verify HEAD || true)"
  if esta_alineado && [ "$rama_actual" = "$RAMA_PPAL" ]; then
    ok "El servidor ya está alineado con $RAMA_PPAL. Para guardar cambios: bash $0 guardar"
    return 0
  fi

  # Elegir la foto: la más nueva cuya diferencia con main no requiera un deploy
  # (funciona con cualquiera de los botones de merge de GitHub)
  local fotos c nombre foto="" nombre_foto="" primera=""
  fotos="$(g for-each-ref --sort=-refname --format='%(objectname) %(refname)' refs/vps-fotos/)"
  [ -n "$fotos" ] || morir "No hay ninguna foto sacada en este servidor. Primero: bash $0 foto"
  while read -r c nombre; do
    [ -z "$c" ] && continue
    [ -z "$primera" ] && primera="$c"
    clasificar_entrantes "$c" "$oficial"
    if [ ! -s "$TMPD/deploy.txt" ]; then foto="$c"; nombre_foto="$nombre"; break; fi
  done <<< "$fotos"
  if [ -z "$foto" ]; then
    clasificar_entrantes "$primera" "$oficial"
    error "La versión oficial ($RAMA_PPAL) no coincide con la foto de este servidor en estos archivos:"
    head -30 "$TMPD/deploy.txt" | sed 's/^/    /'
    local nd; nd="$(wc -l < "$TMPD/deploy.txt")"; [ "$nd" -gt 30 ] && info "    … y $((nd-30)) más"
    morir "O la foto todavía no se aprobó en GitHub, o $RAMA_PPAL tiene cambios de código que el
   servidor no tiene (llevarlos es un deploy y se hace acompañado). Pasale esta salida a Claude.
   No se modificó nada."
  fi
  info "  Foto:              $(g log -1 --format='%h %ad' --date=format:'%Y-%m-%d %H:%M' "$foto")"
  info "  Oficial en GitHub: $(g log -1 --format='%h %s' "$oficial")"

  if [ -n "$head_actual" ] && ! g merge-base --is-ancestor "$head_actual" "$oficial"; then
    aviso "El servidor tiene commits propios que no están en GitHub. No se pierden (quedan en el respaldo) y sus archivos no se tocan:"
    g log --format='    %h %ad %s' --date=short "$oficial..$head_actual" | head -10
    preguntar "¿Seguir? Escribí SI:" SI || morir "Cancelado. No se hizo nada."
  fi
  local main_local; main_local="$(g rev-parse -q --verify "refs/heads/$RAMA_PPAL" || true)"
  if [ -n "$main_local" ] && [ "$main_local" != "$head_actual" ] && ! g merge-base --is-ancestor "$main_local" "$oficial"; then
    aviso "La rama local '$RAMA_PPAL' tiene commits que no están en GitHub (quedan en el respaldo)."
    preguntar "¿Seguir? Escribí SI:" SI || morir "Cancelado. No se hizo nada."
  fi
  avisar_preparados

  paso "Plan"
  info "  1. Guardar la posición actual de git (respaldo)."
  info "  2. Apuntar la rama local '$RAMA_PPAL' a la versión oficial, sin modificar archivos."
  mostrar_entrantes
  preguntar "Escribí SI para empezar:" SI || morir "Cancelado. No se hizo nada."

  mover_rama "$RAMA_PPAL" "$oficial" "$main_local"
  escribir_seguros
  asegurar_exclusiones_permanentes
  g config nexovetgit.alineado 1
  # Las fotos ya usadas (esa y las anteriores) dejan de estar "pendientes"
  while read -r c nombre; do
    [ -z "$c" ] && continue
    if [[ ! "$nombre" > "$nombre_foto" ]]; then
      g update-ref "refs/vps-fotos-usadas/${nombre#refs/vps-fotos/}" "$c" && g update-ref -d "$nombre" "$c"
    fi
  done <<< "$fotos"
  ok "Servidor alineado con $RAMA_PPAL. Ningún archivo existente se modificó."

  contar_pendientes
  if [ "$PEND_GUARDAR" -gt 0 ]; then
    info "  Hay $PEND_GUARDAR archivo(s) del servidor distintos de la versión oficial (cambios hechos después de la foto)."
    info "  Guardalos con: bash $0 guardar"
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
   Pasos: bash $0 foto  →  se revisa y se aprueba en GitHub  →  bash $0 alinear
   (Mientras tanto, para respaldar lo nuevo, se puede sacar otra foto.)"
  fi
  reparar_indice_pendiente
  cargar_exclusiones
  consultar_github
  [ "$SIMULAR" = 1 ] || exigir_privado
  local rama; rama="$(g symbolic-ref --short -q HEAD)" || morir "El servidor no está en ninguna rama. Pasale 'bash $0 estado' a Claude."
  if [ "$rama" != "$RAMA_PPAL" ]; then
    aviso "La rama local es '$rama' y la principal de GitHub es '$RAMA_PPAL'."
    preguntar "¿Guardar igual en '$rama'? Escribí SI:" SI || morir "Cancelado. No se hizo nada."
  fi
  traer_de_github
  local remota="refs/remotes/$REMOTO/$rama" head_sha lado_a_lado=0 existe_remota=0
  head_sha="$(g rev-parse HEAD)"
  g rev-parse -q --verify "$remota" >/dev/null && existe_remota=1

  if [ "$existe_remota" = 1 ] && ! g merge-base --is-ancestor "$remota" "$head_sha"; then
    if g merge-base --is-ancestor "$head_sha" "$remota"; then
      clasificar_entrantes "$head_sha" "$remota"
      if [ ! -s "$TMPD/deploy.txt" ]; then
        info "GitHub tiene cambios que no afectan al sistema: el servidor se pone al día sin tocar archivos existentes."
        mostrar_entrantes
        if [ "$SIMULAR" = 0 ]; then
          [ -s "$TMPD/seguros.txt" ] && { preguntar "Escribí SI para agregar esos archivos nuevos y seguir:" SI || morir "Cancelado. No se hizo nada."; }
          avisar_preparados
          mover_rama "$rama" "$(g rev-parse "$remota")" "$head_sha"
          escribir_seguros
          head_sha="$(g rev-parse HEAD)"
        fi
      else
        lado_a_lado=1
        aviso "GitHub tiene cambios de código que el servidor todavía no tiene:"
        head -15 "$TMPD/deploy.txt" | sed 's/^/    /'
        info "  Para no mezclar a ciegas, tus cambios se suben a una rama APARTE (vps/guardado-$SELLO)."
        info "  Llevar esos cambios de GitHub al servidor es un deploy: se hace acompañado (pedíselo a Claude)."
      fi
    else
      lado_a_lado=1
      aviso "El servidor y GitHub tienen commits distintos cada uno. Tus cambios se suben a una rama APARTE (vps/guardado-$SELLO)."
    fi
  fi

  # Se revisa contra lo que GitHub ya tiene (así también se revisan commits del
  # servidor que nunca se subieron)
  local base_rev="" base_arbol="$ARBOL_VACIO" pendientes=0
  if [ "$existe_remota" = 1 ]; then
    base_rev="$(g merge-base "$head_sha" "$remota" 2>/dev/null || true)"
  elif g rev-parse -q --verify "refs/remotes/$REMOTO/$RAMA_PPAL" >/dev/null; then
    base_rev="$(g merge-base "$head_sha" "refs/remotes/$REMOTO/$RAMA_PPAL" 2>/dev/null || true)"
  fi
  [ -n "$base_rev" ] && base_arbol="$(g rev-parse "$base_rev^{tree}")"
  [ "$base_rev" != "$head_sha" ] && pendientes=1

  sacar_foto_archivos "$head_sha"
  if [ "$ARBOL" = "$(g rev-parse "$head_sha^{tree}")" ]; then
    if [ "$pendientes" = 0 ]; then
      ok "No hay nada para guardar: el servidor coincide con el último commit."
      [ -s "$TMPD/excl_track.txt" ] && info "   (Los cambios en archivos que excluiste con --excluir no se suben.)"
      return 0
    fi
    info "No hay cambios nuevos, pero hay commits del servidor que GitHub no tiene. Se revisan antes de subirlos."
    analizar "$base_arbol" "$ARBOL"
    mostrar_resumen
    if [ "$SIMULAR" = 1 ]; then paso "Simulación terminada"; ok "No se subió nada."; return 0; fi
    frenar_si_hay_alertas
    preguntar "Escribí SI para subirlos:" SI || morir "Cancelado. No se subió nada."
    guardar_objetos
    if [ "$lado_a_lado" = 0 ]; then
      if subir "refs/heads/$rama:refs/heads/$rama"; then ok "Subido a GitHub ($rama)."; return 0; fi
      [ "$RECHAZADO" = 1 ] || exit 1
    fi
    g update-ref -m "git-vps guardado" "refs/vps-guardados/$SELLO" "$head_sha"
    subir "$head_sha:refs/heads/vps/guardado-$SELLO" || exit 1
    ok "Subidos a la rama aparte vps/guardado-$SELLO."
    [ -n "$SLUG" ] && info "  Pasale a Claude: $(url_github)/compare/$rama...vps/guardado-$SELLO"
    return 0
  fi

  analizar "$base_arbol" "$ARBOL"
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
    info "  Se guarda en '$rama' y se sube a GitHub. No cambia ningún archivo del servidor."
  fi
  preguntar "Escribí SI para guardar:" SI || morir "Cancelado. No se hizo nada."

  guardar_objetos
  crear_commit "$MENSAJE" "$head_sha"
  recordar_exclusiones
  if [ "$lado_a_lado" = 1 ]; then
    g update-ref -m "git-vps guardado" "refs/vps-guardados/$SELLO" "$COMMIT"
    subir "$COMMIT:refs/heads/vps/guardado-$SELLO" || exit 1
    ok "Cambios subidos a la rama aparte vps/guardado-$SELLO"
    [ -n "$SLUG" ] && info "  $(url_github)/compare/$rama...vps/guardado-$SELLO"
    info "  Pasale ese link a Claude para que lo combine con '$rama'."
    return 0
  fi
  PASO=commit
  g update-ref -m "git-vps guardar: $MENSAJE" "refs/heads/$rama" "$COMMIT" "$head_sha" \
    || morir "La rama cambió mientras guardabas (¿alguien más hizo un commit?). No se hizo nada; reintentá."
  refrescar_indice || true
  asegurar_exclusiones_permanentes
  ok "Guardado en el servidor: $(g rev-parse --short HEAD) \"$MENSAJE\""
  if subir "refs/heads/$rama:refs/heads/$rama"; then
    PASO=""
    ok "Subido a GitHub ($rama)."
    [ -n "$SLUG" ] && info "  $(url_github)/commit/$(g rev-parse HEAD)"
    return 0
  fi
  if [ "$RECHAZADO" = 1 ]; then
    g update-ref -m "git-vps guardado" "refs/vps-guardados/$SELLO" "$COMMIT"
    if subir "$COMMIT:refs/heads/vps/guardado-$SELLO"; then
      PASO=""
      ok "GitHub cambió mientras guardabas: tus cambios quedaron en la rama aparte vps/guardado-$SELLO."
      [ -n "$SLUG" ] && info "  Pasale a Claude: $(url_github)/compare/$rama...vps/guardado-$SELLO"
      return 0
    fi
  fi
  PASO=""
  info "  El commit quedó guardado en el servidor; se va a subir la próxima vez que corras 'guardar'."
  exit 1
}

case "$MODO" in
  estado) modo_estado ;;
  foto) modo_foto ;;
  alinear) modo_alinear ;;
  guardar) modo_guardar ;;
esac
