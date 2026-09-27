#!/usr/bin/env bash
# =============================================================================
# git-vps.sh — Guardar el código del VPS en GitHub sin romper nada
# =============================================================================
#
# MODOS (de menos a más "invasivo"):
#
#   estado     Muestra cómo está el proyecto comparado con GitHub.
#              Solo lectura: no escribe nada.
#
#   foto       Saca una "foto" de TODOS los archivos del proyecto tal como están
#              ahora y la sube a GitHub en una rama NUEVA (vps/foto-FECHA).
#              NO toca ningún archivo del sistema, ni la rama actual, ni el
#              índice de git. Solo agrega datos dentro de la carpeta .git.
#
#   alinear    Se usa UNA vez, cuando la foto ya fue aprobada en la rama
#              principal (main) de GitHub. Conecta la copia del servidor con esa
#              versión oficial SIN modificar archivos del sistema. Si en GitHub
#              hubiera cambios posteriores a la foto, los muestra y pregunta
#              antes de traerlos.
#
#   guardar    Uso diario. Guarda los cambios del servidor como un commit en la
#              rama actual (main) y lo sube a GitHub. NO modifica archivos del
#              sistema. Si GitHub tiene cambios que el servidor no tiene, en vez
#              de mezclar, sube tus cambios a una rama aparte (vps/guardado-FECHA).
#
#   actualizar Trae al servidor los cambios que están en GitHub y no en el
#              servidor. ESTO SÍ CAMBIA ARCHIVOS DEL SISTEMA EN VIVO (es un
#              "deploy"). Muestra la lista y pide confirmación.
#
# USO:
#   bash git-vps.sh <modo> [carpeta] [opciones]
#   (si no se indica carpeta, usa /var/www/nexovet-shop)
#
# OPCIONES:
#   --simular            Hace todo el análisis pero no crea commits ni sube nada.
#   --mensaje "texto"    Descripción del commit (qué cambiaste).
#   --autor "Nombre <mail>"  Quién hace el commit.
#   --rama NOMBRE        (foto) Nombre de la rama nueva en GitHub.
#   --foto REF           (alinear) Qué foto usar (por defecto, la última sacada).
#   --excluir PATRON     No incluir archivos que coincidan (sintaxis .gitignore).
#                        Se puede repetir: --excluir 'data/*.csv' --excluir tmp/
#   --ignorar-alertas    Seguir aunque se detecten posibles contraseñas/tokens.
#                        Usar SOLO después de revisar que son falsas alarmas.
#   --permitir-publico   Permitir subir aunque el repositorio de GitHub sea público.
#   --remoto NOMBRE      Remoto de git (por defecto: origin).
#   --si                 No pedir la confirmación final (las alertas de seguridad
#                        igual frenan).
#
# EJEMPLOS:
#   bash git-vps.sh estado
#   bash git-vps.sh foto --simular
#   bash git-vps.sh foto
#   bash git-vps.sh guardar --autor "Lourdes <mail@ejemplo.com>" --mensaje "Nuevo banner de envíos"
# =============================================================================

set -uo pipefail

VERSION="1.0"
DIR_POR_DEFECTO="/var/www/nexovet-shop"

# ---------------------------------------------------------------------------
# Opciones
# ---------------------------------------------------------------------------
MODO=""
DIR=""
SIMULAR=0
SI=0
IGNORAR_ALERTAS=0
PERMITIR_PUBLICO=0
MENSAJE=""
AUTOR=""
RAMA_NUEVA=""
FOTO_REF=""
REMOTO="origin"
EXCLUIR_EXTRA=()

ayuda() { sed -n '2,62p' "$0" | sed 's/^# \{0,1\}//'; }

while [ $# -gt 0 ]; do
  case "$1" in
    estado|foto|alinear|guardar|actualizar) MODO="$1"; shift ;;
    --simular) SIMULAR=1; shift ;;
    --si) SI=1; shift ;;
    --ignorar-alertas) IGNORAR_ALERTAS=1; shift ;;
    --permitir-publico) PERMITIR_PUBLICO=1; shift ;;
    --mensaje) MENSAJE="${2:-}"; shift 2 ;;
    --autor) AUTOR="${2:-}"; shift 2 ;;
    --rama) RAMA_NUEVA="${2:-}"; shift 2 ;;
    --foto) FOTO_REF="${2:-}"; shift 2 ;;
    --remoto) REMOTO="${2:-}"; shift 2 ;;
    --excluir) EXCLUIR_EXTRA+=("${2:-}"); shift 2 ;;
    -h|--help|ayuda) ayuda; exit 0 ;;
    --version) echo "git-vps.sh $VERSION"; exit 0 ;;
    -*) echo "Opción desconocida: $1 (ver: bash $0 --help)" >&2; exit 2 ;;
    *) if [ -z "$DIR" ]; then DIR="$1"; shift; else echo "Argumento de más: $1" >&2; exit 2; fi ;;
  esac
done
[ -n "$MODO" ] || { ayuda; exit 2; }
[ -n "$DIR" ] || DIR="$DIR_POR_DEFECTO"

# ---------------------------------------------------------------------------
# Presentación
# ---------------------------------------------------------------------------
if [ -t 1 ]; then
  ROJO=$'\e[31m'; VERDE=$'\e[32m'; AMARILLO=$'\e[33m'; NEGRITA=$'\e[1m'; NORMAL=$'\e[0m'
else
  ROJO=""; VERDE=""; AMARILLO=""; NEGRITA=""; NORMAL=""
fi
info()   { printf '%s\n' "$*"; }
paso()   { printf '\n%s== %s ==%s\n' "$NEGRITA" "$*" "$NORMAL"; }
ok()     { printf '%s✔ %s%s\n' "$VERDE" "$*" "$NORMAL"; }
aviso()  { printf '%s⚠ %s%s\n' "$AMARILLO" "$*" "$NORMAL"; }
error()  { printf '%s✖ %s%s\n' "$ROJO" "$*" "$NORMAL" >&2; }
morir()  { error "$*"; exit 1; }

# preguntar "texto" PALABRA  → devuelve 0 solo si el usuario escribe PALABRA
preguntar() {
  if [ "$SI" = 1 ]; then return 0; fi
  if [ ! -t 0 ]; then morir "Hace falta confirmar pero no hay una terminal interactiva. Si estás seguro, usá --si."; fi
  local r
  read -r -p "$1 " r
  [ "$r" = "$2" ]
}
# Igual que preguntar, pero --si NO la saltea (confirmaciones de seguridad).
preguntar_seguridad() {
  if [ ! -t 0 ]; then return 1; fi
  local r
  read -r -p "$1 " r
  [ "$r" = "$2" ]
}

# Sin terminal no se pueden tipear credenciales: que git falle en vez de colgarse.
[ -t 0 ] || export GIT_TERMINAL_PROMPT=0
export GIT_PAGER=cat PAGER=cat

ARBOL_VACIO="4b825dc642cb6eb9a060e54bf8d69288fbee4904"
SELLO="$(date +%Y%m%d-%H%M%S)"
TMPD=""
GITDIR=""
ARREGLAR_DUENO=0
DUENO_GIT=""

# git con protecciones: sin hooks (un hook podría modificar archivos), sin
# fsmonitor, sin pager, rutas legibles.
g() {
  git -c safe.directory="$DIR" -c core.hooksPath=/dev/null -c core.fsmonitor=false \
      -c core.quotePath=false -c merge.autoStash=false -c rebase.autoStash=false -c gc.auto=0 \
      --no-pager -C "$DIR" "$@"
}
# git usando un índice temporal (el índice real del servidor no se toca).
gi() { GIT_INDEX_FILE="$TMPD/indice" g "$@"; }

limpiar() {
  local s=$?
  [ -n "$TMPD" ] && rm -rf "$TMPD"
  if [ "$ARREGLAR_DUENO" = 1 ] && [ -n "$GITDIR" ] && [ -n "$DUENO_GIT" ]; then
    find "$GITDIR" -user root -exec chown "$DUENO_GIT" {} + 2>/dev/null || true
  fi
  exit $s
}
trap limpiar EXIT
trap 'echo; error "Cancelado por el usuario. No quedó nada a medias: lo que no se confirmó no se hizo."; exit 130' INT TERM

# ---------------------------------------------------------------------------
# Lista de exclusiones: lo que NUNCA debe subirse a GitHub desde el servidor.
# (Solo afecta archivos nuevos; lo que ya estaba en git se sigue guardando.)
# ---------------------------------------------------------------------------
EXCLUSIONES_BASE='
# --- Credenciales y configuración local (NUNCA a GitHub) ---
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
# --- Dependencias y compilados (se regeneran con npm install / build) ---
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
# --- Archivos que suben los usuarios / generados en runtime ---
uploads/
/backend/static/
/backend/private/
# --- Bases de datos, dumps y exportaciones (pueden tener datos de clientes) ---
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
*.xls
*.xlsx
# --- Comprimidos y respaldos ---
*.tar
*.tar.gz
*.tgz
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

armar_exclusiones() {
  local f="$TMPD/excluir" global
  printf '%s\n' "$EXCLUSIONES_BASE" > "$f"
  # Respetar también las exclusiones globales que ya tuviera el usuario.
  global="$(g config --get core.excludesFile 2>/dev/null || true)"
  global="${global/#\~/$HOME}"
  [ -z "$global" ] && global="${XDG_CONFIG_HOME:-$HOME/.config}/git/ignore"
  [ -r "$global" ] && { echo "# --- exclusiones globales del usuario ---"; cat "$global"; } >> "$f"
  if [ "${#EXCLUIR_EXTRA[@]}" -gt 0 ]; then
    echo "# --- exclusiones pedidas con --excluir ---" >> "$f"
    printf '%s\n' "${EXCLUIR_EXTRA[@]}" >> "$f"
  fi
  # Si el archivo no existiera, git lo ignoraría EN SILENCIO y subiría todo.
  [ -s "$f" ] || morir "No pude preparar la lista de exclusiones."
}

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
      local d; d="$(stat -c %U "$DIR" 2>/dev/null)"
      morir "git no confía en esta carpeta porque su dueño es otro usuario ('$d').
   Opción recomendada: correr el script como ese usuario:
       sudo -u $d bash $0 $MODO $DIR
   Opción alternativa (solo agrega una línea a tu configuración de git, no toca el proyecto):
       git config --global --add safe.directory $DIR"
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
  # URL tal cual está configurada (sin reescrituras insteadOf), para reconocer GitHub
  URL_REMOTO="$(g config --get "remote.$REMOTO.url" 2>/dev/null || g remote get-url "$REMOTO")"

  DUENO_GIT="$(stat -c %U "$GITDIR")"
  if [ "$(id -un)" != "$DUENO_GIT" ]; then
    if [ "$(id -u)" = 0 ]; then
      ARREGLAR_DUENO=1   # al terminar, los archivos nuevos de .git vuelven a su dueño
    elif [ "$MODO" != estado ] && [ ! -w "$GITDIR/objects" ]; then
      morir "No tenés permiso de escritura en $GITDIR (es de '$DUENO_GIT'). Corré: sudo -u $DUENO_GIT bash $0 $MODO $DIR"
    fi
  fi

  TMPD="$(mktemp -d "${TMPDIR:-/tmp}/git-vps.XXXXXX")" || morir "No pude crear una carpeta temporal"

  if [ "$MODO" != estado ]; then
    if command -v flock >/dev/null 2>&1; then
      exec 9>>"$GITDIR/git-vps.lock"
      flock -n 9 || morir "Ya hay otra ejecución de este script en curso (¿otra persona guardando?). Esperá a que termine."
    fi
    [ -e "$GITDIR/index.lock" ] && morir "Existe $GITDIR/index.lock: alguien está usando git en este momento (o quedó colgado).
   Esperá un minuto y reintentá. Si nadie está usando git y persiste, avisale a Claude."
    local libre; libre="$(df -Pk "$GITDIR" | awk 'NR==2{print $4}')"
    [ -n "$libre" ] && [ "$libre" -lt 512000 ] && morir "Queda poco espacio en disco ($((libre/1024)) MB). Liberá espacio antes de seguir."
  fi
}

# Detecta la rama principal de GitHub y si el repositorio es público.
SLUG=""; VISIBILIDAD="desconocida"; RAMA_PPAL=""
consultar_github() {
  case "$URL_REMOTO" in
    *github.com[:/]*) SLUG="$(printf '%s' "$URL_REMOTO" | sed -E 's#^.*github\.com[:/]+##; s#\.git$##; s#/+$##')" ;;
    *github*:*/*)     SLUG="$(printf '%s' "$URL_REMOTO" | sed -E 's#^[^:]*:##; s#\.git$##; s#/+$##')" ;;  # alias SSH (deploy key)
  esac
  local ls
  if ls="$(timeout 30 git -c safe.directory="$DIR" -C "$DIR" ls-remote --symref "$REMOTO" HEAD 2>/dev/null)"; then
    RAMA_PPAL="$(printf '%s\n' "$ls" | awk '/^ref:/{sub("refs/heads/","",$2); print $2; exit}')"
  fi
  [ -n "$RAMA_PPAL" ] || RAMA_PPAL="main"
  if [ -n "$SLUG" ] && command -v curl >/dev/null 2>&1; then
    local code
    code="$(curl -s -m 10 -o /dev/null -w '%{http_code}' "https://api.github.com/repos/$SLUG" 2>/dev/null || true)"
    case "$code" in
      200) VISIBILIDAD="publico" ;;
      404) VISIBILIDAD="privado" ;;
      *)   VISIBILIDAD="desconocida" ;;
    esac
  fi
}

exigir_privado() {
  case "$VISIBILIDAD" in
    publico)
      if [ "$PERMITIR_PUBLICO" = 1 ]; then
        aviso "El repositorio $SLUG es PÚBLICO y elegiste subir igual (--permitir-publico)."
      else
        morir "El repositorio $SLUG es PÚBLICO: cualquier persona en internet puede ver lo que se suba.
   Antes de subir el código real del servidor, hacelo privado:
     GitHub → repositorio → Settings → General → abajo de todo 'Danger Zone'
     → 'Change repository visibility' → Private.
   Después volvé a correr este mismo comando.
   (Si de verdad querés subirlo público, agregá --permitir-publico.)"
      fi ;;
    privado) ok "El repositorio de GitHub es privado." ;;
    *)
      if [ "$PERMITIR_PUBLICO" = 1 ]; then
        aviso "No pude verificar si el repositorio es público o privado; sigo porque usaste --permitir-publico."
      else
        aviso "No pude verificar si el repositorio de GitHub es público o privado."
        preguntar_seguridad "¿Confirmás que el repositorio es PRIVADO? Escribí SI para seguir:" SI \
          || morir "Cancelado. No se hizo nada. (Sin terminal interactiva: verificá a mano y usá --permitir-publico.)"
      fi
      ;;
  esac
}

# ---------------------------------------------------------------------------
# Foto de los archivos (índice temporal: no toca nada del servidor)
# ---------------------------------------------------------------------------
ARBOL=""; BASE_ARBOL=""; HEAD_SHA=""
sacar_foto_archivos() {
  paso "Leyendo los archivos del proyecto (no se modifica nada)"
  HEAD_SHA="$(g rev-parse -q --verify HEAD 2>/dev/null || true)"
  if [ -n "$HEAD_SHA" ]; then
    gi read-tree HEAD || morir "No pude leer el último commit."
    BASE_ARBOL="$(g rev-parse "HEAD^{tree}")"
  else
    gi read-tree --empty || morir "No pude preparar el índice temporal."
    BASE_ARBOL="$ARBOL_VACIO"
  fi
  if ! gi -c core.excludesFile="$TMPD/excluir" -c advice.addEmbeddedRepo=false add -A . 2>"$TMPD/add.err"; then
    cat "$TMPD/add.err" >&2
    morir "Falló la lectura de archivos (git add)."
  fi
  grep -v '^warning: LF will be replaced\|^warning: in the working copy' "$TMPD/add.err" | head -20
  # --excluir también tiene que valer para archivos que YA estaban en git
  # (las reglas tipo .gitignore solo afectan archivos nuevos): para esos se
  # conserva la versión del último commit y el cambio del servidor no se sube.
  if [ "${#EXCLUIR_EXTRA[@]}" -gt 0 ] && [ -n "$HEAD_SHA" ]; then
    local pat
    for pat in "${EXCLUIR_EXTRA[@]}"; do
      [ -n "$pat" ] || continue
      gi reset -q "$HEAD_SHA" -- "${pat%/}" >/dev/null 2>&1 || true
    done
  fi
  # Repositorios git dentro del proyecto: git guardaría solo un "puntero", no los archivos.
  local anidados
  anidados="$(gi ls-files -s | awk '$1=="160000"{ $1=$2=$3=""; sub(/^ +/,""); print }')"
  if [ -n "$anidados" ]; then
    local nuevos_anidados=""
    local p
    while IFS= read -r p; do
      [ -z "$p" ] && continue
      if [ -z "$HEAD_SHA" ] || [ "$(g ls-tree HEAD -- "$p" | awk '{print $1}')" != "160000" ]; then
        nuevos_anidados+="      $p"$'\n'
      fi
    done <<< "$anidados"
    if [ -n "$nuevos_anidados" ]; then
      morir "Hay carpetas que son repositorios git propios DENTRO del proyecto:
$nuevos_anidados   Git no guardaría su contenido, solo un puntero. Pasale esta salida a Claude para decidir
   (o, si esas carpetas no importan, repetí con --excluir 'carpeta/')."
    fi
  fi
  ARBOL="$(gi write-tree)" || morir "No pude armar la foto."
  # Lo que queda afuera (sigue en el servidor, no se sube)
  gi -c core.excludesFile="$TMPD/excluir" ls-files -o -i --exclude-standard --directory 2>/dev/null > "$TMPD/afuera.txt" || true
}

# ---------------------------------------------------------------------------
# Análisis de lo que se va a subir
# ---------------------------------------------------------------------------
N_NUEVOS=0; N_MODIF=0; N_BORRADOS=0; N_OTROS=0
BLOQUEOS=0; ADVERTENCIAS=0

agregar_hallazgo() { # nivel archivo motivo
  if [ "$1" = ALTA ]; then BLOQUEOS=$((BLOQUEOS+1)); else ADVERTENCIAS=$((ADVERTENCIAS+1)); fi
  printf '%s\t%s\t%s\n' "$1" "$2" "$3" >> "$TMPD/hallazgos.tsv"
}

enmascarar_valor() { # muestra solo el principio de un posible secreto
  local v="$1"
  printf '%s…(%d caracteres)' "${v:0:6}" "${#v}"
}

analizar() {
  paso "Analizando qué cambió respecto del último commit"
  : > "$TMPD/hallazgos.tsv"
  # Lista de cambios: estado, sha nuevo, ruta
  g diff-tree -r -z --no-renames --raw "$BASE_ARBOL" "$ARBOL" > "$TMPD/raw.z"
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

  # Tamaños de los archivos nuevos/modificados
  awk -F'\t' '$1!="D"' "$TMPD/cambios.tsv" > "$TMPD/vivos.tsv"
  if [ -s "$TMPD/vivos.tsv" ]; then
    cut -f2 "$TMPD/vivos.tsv" | g cat-file --batch-check='%(objectsize)' > "$TMPD/tam.txt"
    paste "$TMPD/tam.txt" "$TMPD/vivos.tsv" > "$TMPD/vivos_tam.tsv"
  else
    : > "$TMPD/vivos_tam.tsv"
  fi

  # 1) Archivos demasiado grandes
  local tam est sha r
  while IFS=$'\t' read -r tam est sha r; do
    [[ "$tam" =~ ^[0-9]+$ ]] || continue
    if [ "$tam" -gt $((95*1024*1024)) ]; then
      agregar_hallazgo ALTA "$r" "pesa $((tam/1048576)) MB: GitHub rechaza archivos de más de 100 MB (excluilo con --excluir)"
    elif [ "$tam" -gt $((20*1024*1024)) ]; then
      agregar_hallazgo MEDIA "$r" "pesa $((tam/1048576)) MB (¿seguro que va en git?)"
    fi
  done < "$TMPD/vivos_tam.tsv"

  # 2) Nombres de archivo peligrosos (independiente de las reglas de .gitignore)
  while IFS=$'\t' read -r tam est sha r; do
    [[ "$tam" =~ ^[0-9]+$ ]] || tam=0
    local base="${r##*/}" low
    low="$(printf '%s' "$r" | tr '[:upper:]' '[:lower:]')"
    case "$base" in
      .env.template|.env.example|.env.sample|.env.dist) ;;
      .env|.env.*)
        agregar_hallazgo ALTA "$r" "archivo de variables de entorno (suele tener contraseñas y tokens)" ;;
      .git-credentials|.netrc|.pgpass|.htpasswd|id_rsa|id_dsa|id_ecdsa|id_ed25519)
        agregar_hallazgo ALTA "$r" "archivo de credenciales" ;;
    esac
    case "$low" in
      *.pem|*.key|*.p12|*.pfx|*.jks|*.keystore|*.ppk)
        agregar_hallazgo ALTA "$r" "clave o certificado privado" ;;
      *credentials*.json|*service-account*.json|*service_account*.json|*client_secret*.json)
        agregar_hallazgo ALTA "$r" "archivo de credenciales de un servicio" ;;
      *.sql|*.sql.gz|*.dump|*.sqlite|*.sqlite3|*.db)
        if [ "$tam" -gt $((1024*1024)) ]; then
          agregar_hallazgo ALTA "$r" "parece un volcado de base de datos ($((tam/1024)) KB): puede tener datos de clientes"
        else
          agregar_hallazgo MEDIA "$r" "archivo de base de datos/SQL: revisá que no tenga datos reales"
        fi ;;
      *.csv|*.xls|*.xlsx|*.json)
        if [ "$est" = A ] && [ "$tam" -gt $((1024*1024)) ]; then
          agregar_hallazgo MEDIA "$r" "archivo de datos nuevo de $((tam/1024)) KB: revisá que no tenga datos de clientes ni costos"
        fi ;;
    esac
  done < "$TMPD/vivos_tam.tsv"

  # 3) Contenido: líneas agregadas que parecen contraseñas o tokens
  g diff-tree -r -p -U0 --no-renames --no-color --no-ext-diff --no-textconv "$BASE_ARBOL" "$ARBOL" 2>/dev/null \
    | awk '
        /^diff --git /{hdr=1; next}
        hdr && /^\+\+\+ /{ f=substr($0,5); if (f ~ /^b\//) f=substr(f,3); next }
        /^@@/{ hdr=0; next }
        !hdr && /^\+/{ print f "\t" substr($0,2) }' > "$TMPD/agregado.tsv"

  # nivel|descripción|flags grep|expresión
  local patrones=(
    'ALTA|clave privada||-----BEGIN ([A-Z0-9]+ )*PRIVATE KEY-----'
    'ALTA|token de GitHub||(gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})'
    'ALTA|token de Mercado Pago||(APP_USR|TEST)-[0-9]{6,}-[0-9]{6}-[0-9a-f]{20,}-[0-9]{4,}'
    'ALTA|clave de API de IA (Anthropic/OpenAI)||(sk-ant-[A-Za-z0-9_-]{20,}|sk-proj-[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{40,})'
    'ALTA|clave de AWS||AKIA[0-9A-Z]{16}'
    'ALTA|clave de Google||AIza[0-9A-Za-z_-]{35}'
    'ALTA|token de Slack||xox[abprs]-[A-Za-z0-9-]{10,}'
    'ALTA|token de npm||(_authToken=[^[:space:]$]{10,}|npm_[A-Za-z0-9]{36})'
    'ALTA|dirección con usuario y contraseña||[a-zA-Z][a-zA-Z0-9+.-]*://[^/[:space:]:@"'"'"'`]+:[^/[:space:]@"'"'"'`$]{3,}@'
    'MEDIA|token JWT||eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}'
    'MEDIA|contraseña/token escrito en el código|-i|(pass|password|passwd|pwd|secret|token|api[_-]?key|access[_-]?key|client[_-]?secret|auth[_-]?key)[a-z0-9_]*["'"'"']?[[:space:]]*[:=][[:space:]]*["'"'"'][^"'"'"'[:space:]]{8,}["'"'"']'
    'MEDIA|variable secreta con valor||(PASS|PASSWORD|PASSWD|SECRET|TOKEN|API_KEY|APIKEY|ACCESS_KEY|PRIVATE_KEY)[A-Z0-9_]*[[:space:]]*(=|:[[:space:]])[[:space:]]*[^[:space:]$"'"'"'{}()<>]{8,}'
    'MEDIA|encabezado Authorization||Bearer[[:space:]]+[A-Za-z0-9._~+/-]{20,}'
  )
  local p nivel desc flags re linea archivo m
  for p in "${patrones[@]}"; do
    nivel="${p%%|*}"; p="${p#*|}"
    desc="${p%%|*}"; p="${p#*|}"
    flags="${p%%|*}"; re="${p#*|}"
    while IFS= read -r linea; do
      archivo="${linea%%$'\t'*}"
      m="$(printf '%s' "${linea#*$'\t'}" | grep -oE $flags -m1 -- "$re" | head -1)"
      [ -z "$m" ] && continue
      # Falsas alarmas típicas de ejemplos: usuario:password@, :xxx@, :<clave>@ …
      if [ "$desc" = "dirección con usuario y contraseña" ] && \
         printf '%s' "$m" | grep -qiE ':(password|pass|pwd|contrase(ñ|n)a|secret|changeme|x{3,}|\*+|<[^>]*>|your[_a-z-]*|user|usuario)@'; then
        continue
      fi
      agregar_hallazgo "$nivel" "$archivo" "$desc: $(enmascarar_valor "$m")"
    done < <(grep -E $flags -- "$re" "$TMPD/agregado.tsv" 2>/dev/null | head -200)
  done
  # Contar hallazgos únicos
  sort -u "$TMPD/hallazgos.tsv" -o "$TMPD/hallazgos.tsv"
  BLOQUEOS="$(grep -c '^ALTA' "$TMPD/hallazgos.tsv" || true)"
  ADVERTENCIAS="$(grep -c '^MEDIA' "$TMPD/hallazgos.tsv" || true)"
}

mostrar_resumen() {
  paso "Resumen de lo que se guardaría"
  info "  Archivos nuevos:      $N_NUEVOS"
  info "  Archivos modificados: $N_MODIF"
  info "  Archivos borrados:    $N_BORRADOS"
  [ "$N_OTROS" -gt 0 ] && info "  Otros cambios:        $N_OTROS"
  if [ $((N_NUEVOS+N_MODIF+N_OTROS)) -gt 0 ]; then
    info ""
    info "  Cambios por carpeta (las 20 con más cambios):"
    awk -F'\t' '$1!="D"{ n=split($3,a,"/"); if (n>2) print a[1]"/"a[2]"/"; else if (n==2) print a[1]"/"; else print "(raíz)" }' "$TMPD/cambios.tsv" \
      | sort | uniq -c | sort -rn | head -20 | sed 's/^/    /'
  fi
  if [ "$N_BORRADOS" -gt 0 ]; then
    info ""
    info "  Archivos que estaban en git y en el servidor ya NO existen (se registran como borrados):"
    awk -F'\t' '$1=="D"{print "    - "$3}' "$TMPD/cambios.tsv" | head -40
    [ "$N_BORRADOS" -gt 40 ] && info "    … y $((N_BORRADOS-40)) más"
  fi
  if [ -s "$TMPD/afuera.txt" ]; then
    local na; na="$(wc -l < "$TMPD/afuera.txt")"
    info ""
    info "  Quedan AFUERA a propósito ($na entradas: siguen en el servidor, no se suben):"
    head -25 "$TMPD/afuera.txt" | sed 's/^/    · /'
    [ "$na" -gt 25 ] && info "    · … y $((na-25)) más"
  fi
  local peso
  peso="$(awk -F'\t' '{s+=$1} END{printf "%.1f", s/1048576}' "$TMPD/vivos_tam.tsv")"
  info ""
  info "  Tamaño de lo nuevo/modificado: ${peso} MB"
  if [ -s "$TMPD/hallazgos.tsv" ]; then
    info ""
    if [ "$BLOQUEOS" -gt 0 ]; then
      error "ALERTAS DE SEGURIDAD ($BLOQUEOS graves, $ADVERTENCIAS a revisar):"
    else
      aviso "Cosas para revisar ($ADVERTENCIAS):"
    fi
    sort -u "$TMPD/hallazgos.tsv" | sort -t$'\t' -k1,1 | head -60 | awk -F'\t' '{ printf "    [%s] %s → %s\n", ($1=="ALTA"?"GRAVE":"revisar"), $2, $3 }'
    local total; total="$(sort -u "$TMPD/hallazgos.tsv" | wc -l)"
    [ "$total" -gt 60 ] && info "    … y $((total-60)) más"
  else
    ok "No se detectaron contraseñas, tokens ni archivos peligrosos."
  fi
}

frenar_si_hay_alertas() {
  if [ "$BLOQUEOS" -gt 0 ]; then
    if [ "$IGNORAR_ALERTAS" = 1 ]; then
      aviso "Hay alertas graves pero elegiste seguir (--ignorar-alertas)."
    else
      morir "Frené porque hay alertas graves: podría subirse una contraseña o un token.
   Qué hacer:
     • Si el archivo NO debe ir a GitHub: repetí el comando agregando --excluir 'ruta/del/archivo'
     • Si la contraseña está escrita dentro del código: hay que pasarla a un archivo .env (pedíselo a Claude)
     • Si revisaste y es una falsa alarma: repetí con --ignorar-alertas
   No se subió nada."
    fi
  fi
  if [ "$ADVERTENCIAS" -gt 0 ] && [ "$BLOQUEOS" -eq 0 ] && [ "$SIMULAR" = 0 ] && [ "$IGNORAR_ALERTAS" = 0 ]; then
    preguntar_seguridad "Hay $ADVERTENCIAS cosas para revisar (arriba). ¿Las revisaste y querés seguir? Escribí SI:" SI \
      || morir "Cancelado. No se subió nada. (Sin terminal interactiva: revisá y usá --ignorar-alertas.)"
  fi
}

# ---------------------------------------------------------------------------
# Commits y subida
# ---------------------------------------------------------------------------
resolver_autor() { # $1 = nombre por defecto si no hay nada configurado
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
  export GIT_AUTHOR_NAME="$nombre" GIT_AUTHOR_EMAIL="$mail"
  export GIT_COMMITTER_NAME="$nombre" GIT_COMMITTER_EMAIL="$mail"
}

COMMIT=""
crear_commit() { # $1 = mensaje
  local padres=()
  [ -n "$HEAD_SHA" ] && padres=(-p "$HEAD_SHA")
  COMMIT="$(printf '%s\n' "$1" | g commit-tree "$ARBOL" ${padres[@]+"${padres[@]}"})" || morir "No pude crear el commit."
}

# subir REFSPEC → 0 si subió
subir() {
  info "Subiendo a GitHub ($REMOTO → ${1#*:})…"
  if g push "$REMOTO" "$1" > "$TMPD/push.log" 2>&1; then
    return 0
  fi
  sed 's/^/    /' "$TMPD/push.log" | sed -E 's#(://[^:/@[:space:]]+:)[^@[:space:]]+@#\1****@#g'
  if grep -qi 'rejected\|non-fast-forward\|fetch first' "$TMPD/push.log"; then
    error "GitHub rechazó la subida porque tiene cambios que el servidor no tiene."
  elif grep -qi 'authentication\|permission\|403\|could not read username\|terminal prompts disabled\|denied' "$TMPD/push.log"; then
    error "GitHub no aceptó las credenciales del servidor (usuario/token). Ver docs/GIT-GUIA.md → 'Credenciales'."
  elif grep -qi 'file size limit\|exceeds\|large files' "$TMPD/push.log"; then
    error "Hay un archivo demasiado grande. Excluilo con --excluir."
  else
    error "No se pudo subir (¿sin internet?)."
  fi
  return 1
}

url_github() { [ -n "$SLUG" ] && printf 'https://github.com/%s' "$SLUG"; }

asegurar_exclusiones_permanentes() {
  # Copia las exclusiones a .git/info/exclude (archivo interno de git, no del
  # sistema) para que también un "git add" manual las respete.
  local f="$GITDIR/info/exclude"
  mkdir -p "$GITDIR/info"
  if ! grep -q '^# >>> git-vps.sh' "$f" 2>/dev/null; then
    { echo "# >>> git-vps.sh (no borrar este bloque)"; printf '%s\n' "$EXCLUSIONES_BASE"; echo "# <<< git-vps.sh"; } >> "$f"
    ok "Protecciones agregadas a .git/info/exclude (archivo interno de git)."
  fi
}

# ---------------------------------------------------------------------------
# Comparaciones
# ---------------------------------------------------------------------------
traer_de_github() {
  info "Consultando GitHub (git fetch: solo descarga información, no toca archivos)…"
  if ! g fetch --quiet "$REMOTO" > "$TMPD/fetch.log" 2>&1; then
    sed 's/^/    /' "$TMPD/fetch.log" | sed -E 's#(://[^:/@[:space:]]+:)[^@[:space:]]+@#\1****@#g'
    morir "No pude conectarme con GitHub."
  fi
}

# ===========================================================================
# MODO: estado
# ===========================================================================
modo_estado() {
  preparar
  armar_exclusiones
  consultar_github
  paso "Proyecto $DIR"
  info "  Remoto:        $(printf '%s' "$URL_REMOTO" | sed -E 's#(://)[^@/]+@#\1****@#')"
  info "  Repositorio:   ${SLUG:-?} ($VISIBILIDAD) — rama principal: $RAMA_PPAL"
  info "  Rama local:    $(g symbolic-ref --short -q HEAD || echo '(ninguna)')"
  if g rev-parse -q --verify HEAD >/dev/null; then
    info "  Último commit: $(g log -1 --format='%h  %ad  %an  "%s"' --date=format:'%Y-%m-%d %H:%M') ($(g log -1 --format=%cr))"
  fi
  local st mod del
  st="$(GIT_OPTIONAL_LOCKS=0 g -c core.excludesFile="$TMPD/excluir" status --porcelain=v1 -uall 2>/dev/null)"
  mod="$(printf '%s\n' "$st" | grep -c '^ M\|^M' || true)"
  del="$(printf '%s\n' "$st" | grep -c '^ D\|^D' || true)"
  info "  Sin guardar:   $mod modificados, $del borrados, $(printf '%s\n' "$st" | grep -c '^??' || true) nuevos"
  local remoto_sha head_sha
  remoto_sha="$(timeout 30 git -c safe.directory="$DIR" -C "$DIR" ls-remote "$REMOTO" "refs/heads/$RAMA_PPAL" 2>/dev/null | awk '{print $1}')"
  head_sha="$(g rev-parse -q --verify HEAD || true)"
  if [ -n "$remoto_sha" ] && [ -n "$head_sha" ]; then
    if [ "$remoto_sha" = "$head_sha" ]; then
      info "  vs GitHub:     el último commit coincide con $RAMA_PPAL de GitHub"
    elif ! g cat-file -e "${remoto_sha}^{commit}" 2>/dev/null; then
      info "  vs GitHub:     GitHub tiene commits que este servidor no descargó todavía"
    elif g merge-base --is-ancestor "$remoto_sha" "$head_sha"; then
      info "  vs GitHub:     el servidor tiene $(g rev-list --count "$remoto_sha..$head_sha") commit(s) sin subir"
    elif g merge-base --is-ancestor "$head_sha" "$remoto_sha"; then
      info "  vs GitHub:     GitHub tiene $(g rev-list --count "$head_sha..$remoto_sha") commit(s) que el servidor no tiene"
    else
      info "  vs GitHub:     divergidos (cada lado tiene commits distintos)"
    fi
  fi
  local fotos; fotos="$(g for-each-ref --sort=-refname --format='    %(refname:short)  %(objectname:short)  %(contents:subject)' refs/vps-fotos/ | head -5)"
  [ -n "$fotos" ] && { info "  Fotos sacadas desde este servidor:"; info "$fotos"; }
  return 0
}

# ===========================================================================
# MODO: foto
# ===========================================================================
modo_foto() {
  preparar
  armar_exclusiones
  consultar_github
  [ "$SIMULAR" = 1 ] || exigir_privado
  local rama="${RAMA_NUEVA:-vps/foto-$SELLO}"
  git check-ref-format --branch "$rama" >/dev/null 2>&1 || morir "Nombre de rama inválido: $rama"

  sacar_foto_archivos
  if [ "$ARBOL" = "$BASE_ARBOL" ]; then
    ok "No hay nada nuevo: los archivos del servidor son idénticos al último commit ($(g rev-parse --short HEAD))."
    info "   Si ese commit ya está en GitHub, no hace falta ninguna foto."
    return 0
  fi
  analizar
  mostrar_resumen
  if [ "$SIMULAR" = 1 ]; then
    paso "Simulación terminada"
    [ "$VISIBILIDAD" = publico ] && aviso "Ojo: el repositorio $SLUG es PÚBLICO. Hacelo privado antes de la foto real."
    [ "$BLOQUEOS" -gt 0 ] && aviso "La foto real se va a frenar por las alertas graves de arriba (hay que resolverlas antes)."
    ok "No se creó ningún commit ni se subió nada."
    return 0
  fi
  frenar_si_hay_alertas

  paso "Confirmación"
  info "  Se va a crear una foto con el estado actual de $DIR"
  info "  y se va a subir a GitHub en la rama NUEVA: $rama"
  info "  Esto NO cambia ningún archivo del servidor ni la rama principal de GitHub."
  preguntar "Escribí SI para continuar:" SI || morir "Cancelado. No se hizo nada."

  resolver_autor "Nexovet VPS"
  local msg="${MENSAJE:-Foto del servidor $(hostname) ($DIR) $(date '+%Y-%m-%d %H:%M')}"
  msg+=$'\n\n'"Estado real de los archivos en producción, tomado con scripts/vps/git-vps.sh foto."
  msg+=$'\n'"Nuevos: $N_NUEVOS · Modificados: $N_MODIF · Borrados: $N_BORRADOS"
  crear_commit "$msg"
  g update-ref -m "git-vps foto" "refs/vps-fotos/$SELLO" "$COMMIT"
  ok "Foto creada: $(g rev-parse --short "$COMMIT") (guardada también en el servidor como refs/vps-fotos/$SELLO)"

  if subir "$COMMIT:refs/heads/$rama"; then
    ok "Foto subida a GitHub en la rama $rama"
    if [ -n "$SLUG" ]; then
      info ""
      info "  Ver la foto:        $(url_github)/tree/$rama"
      info "  Comparar con main:  $(url_github)/compare/$RAMA_PPAL...$rama"
    fi
    info ""
    info "  Próximo paso: pasale a Claude el nombre de la rama ($rama) para que la revise"
    info "  y la convierta en la versión oficial (main). Después: bash $0 alinear"
  else
    info "  La foto quedó guardada en el servidor. Para reintentar la subida:"
    info "     git -C $DIR push $REMOTO $COMMIT:refs/heads/$rama"
    exit 1
  fi
}

# ===========================================================================
# Traer cambios de GitHub al servidor (usado por alinear y actualizar)
# ===========================================================================
aplicar_cambios_de_github() { # $1 desde (commit local)  $2 hasta (commit oficial)
  local desde="$1" hasta="$2"
  g diff-tree -r --no-renames --name-status "$desde" "$hasta" > "$TMPD/entrantes.txt"
  if [ ! -s "$TMPD/entrantes.txt" ]; then
    # Mismo contenido (por ejemplo, un merge commit): avanzar la rama no toca archivos.
    g merge --ff-only --quiet "$hasta" > "$TMPD/merge.log" 2>&1 || { cat "$TMPD/merge.log"; morir "No pude avanzar la rama."; }
    ok "La rama local quedó igual a GitHub (no hubo que cambiar ningún archivo)."
    return 0
  fi
  local n; n="$(wc -l < "$TMPD/entrantes.txt")"
  paso "GitHub tiene $n archivo(s) distintos que se escribirían en el servidor"
  awk -F'\t' '{ e=($1=="A"?"nuevo":($1=="D"?"se BORRA":"cambia")); printf "    [%s] %s\n", e, $2 }' "$TMPD/entrantes.txt" | head -60
  [ "$n" -gt 60 ] && info "    … y $((n-60)) más"

  # Revisar archivo por archivo cómo está en el servidor:
  #   - si el servidor no lo tocó → git lo actualiza sin problema;
  #   - si el servidor ya tiene exactamente la versión de GitHub → no hay nada que pisar;
  #   - si el servidor tiene OTRA versión → se pisaría trabajo: frenar.
  local est r blob_desde blob_hasta blob_local existe choques="" n_iguales=0
  : > "$TMPD/iguales.txt"
  while IFS=$'\t' read -r est r; do
    blob_desde="$(g rev-parse -q --verify "$desde:$r" 2>/dev/null || true)"
    blob_hasta="$(g rev-parse -q --verify "$hasta:$r" 2>/dev/null || true)"
    existe=0; { [ -e "$DIR/$r" ] || [ -L "$DIR/$r" ]; } && existe=1
    blob_local=""
    [ "$existe" = 1 ] && [ -f "$DIR/$r" ] && blob_local="$(g hash-object -- "$r" 2>/dev/null || true)"
    if { [ "$existe" = 1 ] && [ -n "$blob_local" ] && [ "$blob_local" = "$blob_desde" ]; } || \
       { [ "$existe" = 0 ] && [ -z "$blob_desde" ]; }; then
      continue                                   # el servidor no lo tocó
    fi
    if { [ "$existe" = 0 ] && [ -z "$blob_hasta" ]; } || \
       { [ -n "$blob_local" ] && [ "$blob_local" = "$blob_hasta" ]; }; then
      printf '%s\n' "$r" >> "$TMPD/iguales.txt"  # el servidor ya está igual a GitHub
      n_iguales=$((n_iguales+1))
      continue
    fi
    choques+="      $r"$'\n'
  done < "$TMPD/entrantes.txt"
  if [ -n "$choques" ]; then
    morir "Estos archivos cambiaron en el servidor Y en GitHub (con contenido distinto); traerlos pisaría trabajo del servidor:
$choques   Primero guardá lo del servidor (bash $0 guardar) y pedile a Claude que combine las dos versiones.
   No se modificó nada."
  fi
  [ "$n_iguales" -gt 0 ] && info "  ($n_iguales de esos archivos ya están en el servidor con el mismo contenido: no se pisan)"
  cut -f2 "$TMPD/entrantes.txt" | sort -u > "$TMPD/entrantes_rutas.txt"
  # Avisos de cosas que requieren acción extra
  local extra=""
  grep -qE '(^|/)package(-lock)?\.json$' "$TMPD/entrantes_rutas.txt" && extra+="    • Cambiaron dependencias (package.json): después hay que correr 'npm install' en esa carpeta y reiniciar con pm2.\n"
  grep -qE 'migration|/migrations/' "$TMPD/entrantes_rutas.txt" && extra+="    • Hay migraciones de base de datos: pueden requerir 'npx medusa db:migrate'.\n"
  grep -qE '(^|/)(medusa-config\.ts|next\.config\.js|ecosystem\.config\.js|docker-compose\.yml|nginx[^/]*\.conf|\.env\.template)$' "$TMPD/entrantes_rutas.txt" && extra+="    • Cambió configuración (medusa-config / next.config / pm2 / docker / nginx): puede requerir reinicio.\n"
  [ -n "$extra" ] && { aviso "Atención después de actualizar:"; printf '%b' "$extra"; }

  aviso "Esto MODIFICA archivos del sistema EN VIVO (los de la lista). Hacelo en un horario tranquilo."
  if grep -q '^backend/' "$TMPD/entrantes_rutas.txt"; then
    aviso "Hay archivos de backend/: el backend (Medusa, modo desarrollo) se reinicia solo y puede no responder 10-60 segundos."
  fi
  preguntar "Escribí ACTUALIZAR para traer estos cambios al servidor:" ACTUALIZAR \
    || { info "No se trajo nada. El servidor sigue igual."; return 2; }
  # Los que ya están iguales se anotan en el índice (no se escriben archivos)
  local q
  while IFS= read -r q; do
    [ -z "$q" ] && continue
    if [ -e "$DIR/$q" ]; then g update-index --add -- "$q"; else g update-index --remove -- "$q"; fi
  done < "$TMPD/iguales.txt"
  if ! g merge --ff-only "$hasta" > "$TMPD/merge.log" 2>&1; then
    sed 's/^/    /' "$TMPD/merge.log"
    morir "Git no pudo aplicar los cambios y no modificó nada. Pasale esta salida a Claude."
  fi
  ok "Cambios traídos. La rama del servidor quedó igual a GitHub ($(g rev-parse --short HEAD))."
  [ -n "$extra" ] && aviso "Acordate de los pasos extra de arriba (npm install / reinicio)."
  return 0
}

respaldar_estado_git() {
  local h; h="$(g rev-parse -q --verify HEAD || true)"
  [ -n "$h" ] && g update-ref -m "git-vps respaldo" "refs/vps-respaldo/$SELLO" "$h"
  [ -f "$GITDIR/index" ] && cp -p "$GITDIR/index" "$GITDIR/index.respaldo-$SELLO"
  info "  (respaldo de la posición anterior: refs/vps-respaldo/$SELLO)"
}

# ===========================================================================
# MODO: alinear
# ===========================================================================
modo_alinear() {
  preparar
  consultar_github
  traer_de_github
  local oficial="refs/remotes/$REMOTO/$RAMA_PPAL"
  g rev-parse -q --verify "$oficial" >/dev/null || morir "No encuentro la rama $RAMA_PPAL en GitHub."
  local foto
  if [ -n "$FOTO_REF" ]; then
    foto="$(g rev-parse -q --verify "$FOTO_REF^{commit}")" || morir "No encuentro la foto '$FOTO_REF'."
  else
    foto="$(g for-each-ref --sort=-refname --count=1 --format='%(objectname)' refs/vps-fotos/)"
    [ -n "$foto" ] || morir "No encontré ninguna foto sacada en este servidor. Primero: bash $0 foto"
  fi
  info "  Foto:              $(g log -1 --format='%h %s' "$foto")"
  info "  Oficial en GitHub: $(g log -1 --format='%h %s' "$oficial")"
  g merge-base --is-ancestor "$foto" "$oficial" \
    || morir "La foto todavía no está incluida en $RAMA_PPAL de GitHub. Primero hay que aprobarla (merge) en GitHub; pedíselo a Claude."

  local head_actual; head_actual="$(g rev-parse -q --verify HEAD || true)"
  if [ -n "$head_actual" ] && ! g merge-base --is-ancestor "$head_actual" "$foto"; then
    aviso "El servidor tiene commits hechos DESPUÉS de la foto (no se pierden: quedan en el respaldo y sus archivos no se tocan):"
    g log --format='    %h %ad %s' --date=short "$foto..$head_actual" | head -10
    preguntar "¿Seguir igual? Escribí SI:" SI || morir "Cancelado. No se hizo nada."
  fi

  paso "Plan"
  info "  1. Guardar un respaldo de la posición actual de git (no de archivos: esos no se tocan)."
  info "  2. Apuntar la rama local '$RAMA_PPAL' a la foto, sin modificar archivos."
  info "  3. Si GitHub tiene algo posterior a la foto, mostrarlo y preguntar antes de traerlo."
  preguntar "Escribí SI para empezar:" SI || morir "Cancelado. No se hizo nada."

  respaldar_estado_git
  asegurar_exclusiones_permanentes
  local rama_actual; rama_actual="$(g symbolic-ref --short -q HEAD || true)"
  g update-ref -m "git-vps alinear" "refs/heads/$RAMA_PPAL" "$foto" || morir "No pude mover la rama."
  if [ "$rama_actual" != "$RAMA_PPAL" ]; then
    g symbolic-ref HEAD "refs/heads/$RAMA_PPAL" || morir "No pude cambiar de rama."
    info "  (la rama local pasó de '${rama_actual:-ninguna}' a '$RAMA_PPAL', sin tocar archivos)"
  fi
  g reset -q --mixed "$foto" || morir "No pude actualizar el índice. Respaldo en refs/vps-respaldo/$SELLO"
  g branch --set-upstream-to="$REMOTO/$RAMA_PPAL" "$RAMA_PPAL" >/dev/null 2>&1 || true
  ok "La rama local '$RAMA_PPAL' ahora apunta a la foto. Ningún archivo del sistema cambió."

  aplicar_cambios_de_github "$foto" "$oficial"
  local r=$?
  paso "Listo"
  local pend; pend="$(GIT_OPTIONAL_LOCKS=0 g status --porcelain=v1 | wc -l)"
  if [ "$pend" -gt 0 ]; then
    info "  Hay $pend cambio(s) del servidor posteriores a la foto. Guardalos con: bash $0 guardar"
  else
    ok "El servidor y GitHub están sincronizados."
  fi
  [ "$r" = 2 ] && info "  (Quedaron cambios de GitHub sin traer; cuando quieras: bash $0 actualizar)"
  return 0
}

# ===========================================================================
# MODO: guardar
# ===========================================================================
modo_guardar() {
  preparar
  armar_exclusiones
  consultar_github
  [ "$SIMULAR" = 1 ] || exigir_privado
  local rama; rama="$(g symbolic-ref --short -q HEAD)" || morir "El servidor no está en ninguna rama. Usá 'foto' o pedile ayuda a Claude."
  if [ "$rama" != "$RAMA_PPAL" ]; then
    aviso "La rama local es '$rama' y la principal de GitHub es '$RAMA_PPAL'. ¿Ya corriste 'alinear'?"
    preguntar "¿Guardar igual en la rama '$rama'? Escribí SI:" SI || morir "Cancelado. No se hizo nada."
  fi
  traer_de_github
  local remota="refs/remotes/$REMOTO/$rama"
  local lado_a_lado=0
  if g rev-parse -q --verify "$remota" >/dev/null; then
    if ! g merge-base --is-ancestor "$remota" HEAD; then
      lado_a_lado=1
      aviso "GitHub tiene cambios en '$rama' que el servidor todavía no tiene:"
      g log --format='    %h %ad %an: %s' --date=short "HEAD..$remota" | head -10
      info "  Para no mezclar a ciegas, tus cambios se van a subir a una rama APARTE (vps/guardado-$SELLO)"
      info "  y Claude los combina en GitHub. Después, 'actualizar' trae todo al servidor."
    fi
  fi

  sacar_foto_archivos
  if [ "$ARBOL" = "$BASE_ARBOL" ]; then
    if [ "$lado_a_lado" = 0 ] && g rev-parse -q --verify "$remota" >/dev/null && [ "$(g rev-parse HEAD)" != "$(g rev-parse "$remota")" ]; then
      info "No hay cambios nuevos, pero hay commits sin subir. Subiéndolos…"
      [ "$SIMULAR" = 1 ] && { ok "Simulación: no se subió nada."; return 0; }
      subir "refs/heads/$rama:refs/heads/$rama" && ok "Subido." || exit 1
    else
      ok "No hay nada para guardar: el servidor coincide con el último commit."
    fi
    return 0
  fi
  analizar
  mostrar_resumen
  if [ "$SIMULAR" = 1 ]; then
    paso "Simulación terminada"
    ok "No se creó ningún commit ni se subió nada."
    return 0
  fi
  frenar_si_hay_alertas

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

  crear_commit "$MENSAJE"
  if [ "$lado_a_lado" = 1 ]; then
    g update-ref -m "git-vps guardado" "refs/vps-fotos/$SELLO" "$COMMIT"
    subir "$COMMIT:refs/heads/vps/guardado-$SELLO" || exit 1
    ok "Cambios subidos a la rama vps/guardado-$SELLO"
    [ -n "$SLUG" ] && info "  $(url_github)/compare/$rama...vps/guardado-$SELLO"
    info "  Pasale ese link a Claude para que lo combine con '$rama'."
    return 0
  fi
  # Avanzar la rama local sin tocar archivos (update-ref atómico: falla si alguien más la movió)
  g update-ref -m "git-vps guardar: $MENSAJE" "refs/heads/$rama" "$COMMIT" "$HEAD_SHA" \
    || morir "La rama cambió mientras guardabas (¿alguien más hizo un commit?). No se hizo nada; reintentá."
  if ! g reset -q --mixed; then
    aviso "El commit se creó pero no pude refrescar el índice. Corré más tarde: git -C $DIR reset -q"
  fi
  asegurar_exclusiones_permanentes
  ok "Guardado en el servidor: $(g rev-parse --short HEAD) \"$MENSAJE\""
  if subir "refs/heads/$rama:refs/heads/$rama"; then
    ok "Subido a GitHub ($rama)."
    [ -n "$SLUG" ] && info "  $(url_github)/commit/$(g rev-parse HEAD)"
  else
    info "  El commit quedó guardado en el servidor; se va a subir la próxima vez que corras 'guardar'."
    exit 1
  fi
}

# ===========================================================================
# MODO: actualizar
# ===========================================================================
modo_actualizar() {
  preparar
  consultar_github
  local rama; rama="$(g symbolic-ref --short -q HEAD)" || morir "El servidor no está en ninguna rama. Pedile ayuda a Claude."
  traer_de_github
  local remota="refs/remotes/$REMOTO/$rama"
  g rev-parse -q --verify "$remota" >/dev/null || morir "La rama '$rama' no existe en GitHub."
  if [ "$(g rev-parse HEAD)" = "$(g rev-parse "$remota")" ]; then
    ok "El servidor ya tiene todo lo que hay en GitHub ($rama)."
    return 0
  fi
  if ! g merge-base --is-ancestor HEAD "$remota"; then
    morir "El servidor tiene commits que GitHub no tiene. Primero: bash $0 guardar (y si GitHub tiene cambios propios, Claude los combina)."
  fi
  info "  Commits nuevos en GitHub:"
  g log --format='    %h %ad %an: %s' --date=short "HEAD..$remota" | head -20
  respaldar_estado_git
  g reset -q --mixed   # índice = último commit (no toca archivos)
  aplicar_cambios_de_github HEAD "$remota"
  return 0
}

case "$MODO" in
  estado) modo_estado ;;
  foto) modo_foto ;;
  alinear) modo_alinear ;;
  guardar) modo_guardar ;;
  actualizar) modo_actualizar ;;
esac
