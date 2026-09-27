#!/usr/bin/env bash
# =============================================================================
# diagnostico.sh — Diagnóstico de SOLO LECTURA del servidor (VPS)
# =============================================================================
#
# Qué hace:
#   Recorre el servidor y arma un informe de todos los proyectos que encuentra
#   (carpetas con código), si están o no en git, qué tan desactualizados están
#   respecto de GitHub, qué procesos corren (pm2, docker), qué dominios apuntan
#   a qué carpeta (nginx) y qué tareas programadas hay (cron).
#
# Qué NO hace (garantizado):
#   - No modifica, mueve ni borra ningún archivo de los proyectos.
#   - No hace commit, push, pull, checkout, reset, stash ni nada parecido.
#   - No reinicia servicios ni arranca procesos (pm2 solo se consulta si ya
#     está corriendo).
#   Lo único que escribe es el informe, en /tmp (o donde digas con --salida).
#
# Privacidad:
#   De los archivos .env solo lista el NOMBRE (nunca el contenido), y en
#   cron, procesos, nginx y remotos tapa todo lo que parezca una credencial.
#   Igual, LEELO antes de compartirlo.
#
# Uso:
#   bash diagnostico.sh                      # busca en /var/www /srv /opt /home /root
#   bash diagnostico.sh /otra/carpeta        # agrega carpetas extra a revisar
#   bash diagnostico.sh --salida /root/x.txt # guarda el informe en otro lugar
#
# Conviene correrlo como root (así puede leer nginx, cron y pm2 de todos).
# =============================================================================

set -u
umask 077
: "${HOME:=$(getent passwd "$(id -un)" 2>/dev/null | cut -d: -f6)}"
export HOME
export LC_ALL=C.UTF-8 2>/dev/null || export LC_ALL=C
export GIT_PAGER=cat PAGER=cat GIT_TERMINAL_PROMPT=0 GIT_OPTIONAL_LOCKS=0
export GIT_SSH_COMMAND="${GIT_SSH_COMMAND:-ssh} -o BatchMode=yes -o ConnectTimeout=15"
# Usuario real (si se corrió con sudo)
USUARIO_REAL="${SUDO_USER:-$(id -un)}"
HOME_REAL="$(getent passwd "$USUARIO_REAL" 2>/dev/null | cut -d: -f6)"; HOME_REAL="${HOME_REAL:-$HOME}"

SALIDA="/tmp/diagnostico-git-$(hostname 2>/dev/null || echo vps)-$(date +%Y%m%d-%H%M).txt"
EXTRA=()
while [ $# -gt 0 ]; do
  case "$1" in
    --salida) SALIDA="$2"; shift 2 ;;
    -h|--help) sed -n '2,34p' "$0"; exit 0 ;;
    *) EXTRA+=("$1"); shift ;;
  esac
done

tiene() { command -v "$1" >/dev/null 2>&1; }

# Enmascara cualquier cosa que parezca credencial antes de mostrarla.
enmascarar() {
  sed -E \
    -e 's#(://)[^/@[:space:]]+@#\1****@#g' \
    -e 's#(gh[pousr]_|github_pat_|APP_USR-|TEST-|sk-ant-|sk-proj-|sk-|sk_|xox[abprs]-|AKIA|AIza)[A-Za-z0-9_-]{4,}#\1****#g' \
    -e 's#(bot[0-9]{5,}:)[A-Za-z0-9_-]+#\1****#g' \
    -e 's#(hooks\.slack\.com/services/)[^[:space:]"'"'"']+#\1****#g' \
    -e 's#((Proxy-)?Authorization[[:space:]]*:[[:space:]]*)[^"'"'"']+#\1****#Ig' \
    -e 's#([A-Za-z0-9_-]*(PASS|PWD|TOKEN|SECRET|KEY|AUTH)[A-Za-z0-9_-]*[[:space:]]*[=:][[:space:]]*)("[^"]*"|'"'"'[^'"'"']*'"'"'|[^[:space:]"'"'"']+)#\1****#Ig' \
    -e 's#(Bearer|Basic|Token)[[:space:]]+[^[:space:]"'"'"']+#\1 ****#Ig' \
    -e 's#(^|[[:space:]])(-p|-u|--password|--user|-P)([[:space:]]+|=)?([^-[:space:]][^[:space:]]*)#\1\2\3****#g'
}
# Para cron/pm2: además tapa cualquier cadena larga que parezca un token
enmascarar_fuerte() { enmascarar | sed -E 's#([^A-Za-z0-9/_.-]|^)[A-Za-z0-9_-]{24,}#\1****#g'; }

titulo() { printf '\n==============================================================\n%s\n==============================================================\n' "$1"; }

# git "de solo lectura": sin locks opcionales, sin pager, sin fsmonitor.
G() { git -c safe.directory='*' -c core.fsmonitor=false --no-pager -C "$REPO_DIR" "$@"; }

seccion_sistema() {
  titulo "1. SERVIDOR"
  echo "Fecha:            $(date '+%Y-%m-%d %H:%M:%S %Z')"
  echo "Servidor:         $(hostname 2>/dev/null)"
  echo "Usuario actual:   $(id -un) (uid $(id -u))"
  if [ -r /etc/os-release ]; then . /etc/os-release; echo "Sistema:          ${PRETTY_NAME:-?}"; fi
  echo "Encendido desde:  $(uptime -p 2>/dev/null || uptime)"
  echo "git:              $(git --version 2>/dev/null || echo 'NO INSTALADO')"
  echo "node:             $(node --version 2>/dev/null || echo 'no encontrado')"
  echo "pm2:              $(pm2 --version 2>/dev/null | tail -1 || true)"
  echo "docker:           $(docker --version 2>/dev/null || echo 'no encontrado')"
  echo "gh (GitHub CLI):  $(gh --version 2>/dev/null | head -1 || echo 'no instalado')"
  echo
  echo "--- Espacio en disco ---"
  df -h / /var /var/www /home /root 2>/dev/null | awk 'NR==1 || !seen[$1]++'
  echo
  echo "--- Memoria ---"
  free -h 2>/dev/null || true
}

seccion_git_global() {
  titulo "2. CONFIGURACIÓN DE GIT DEL USUARIO $USUARIO_REAL (sin secretos)"
  HOME="$HOME_REAL" git config --global --get-regexp '^(user\.|credential\.|safe\.|init\.|pull\.|push\.|core\.hookspath|core\.excludesfile|core\.sshcommand)' 2>/dev/null | enmascarar || true
  [ -f "$HOME_REAL/.git-credentials" ] && echo "(existe $HOME_REAL/.git-credentials: hay credenciales guardadas para GitHub — no se muestran)"
  [ -d "$HOME_REAL/.ssh" ] && echo "Claves SSH en $HOME_REAL/.ssh: $(ls "$HOME_REAL/.ssh" 2>/dev/null | grep -Ev '^(known_hosts|authorized_keys|config)' | tr '\n' ' ')"
  [ -f "$HOME_REAL/.ssh/config" ] && echo "Hosts en ~/.ssh/config: $(awk 'tolower($1)=="host"{printf "%s ", $2}' "$HOME_REAL/.ssh/config" 2>/dev/null)"
  if tiene gh; then
    echo "--- gh auth status ---"
    HOME="$HOME_REAL" gh auth status 2>&1 | enmascarar | head -15
  fi
}

# PIDs de procesos de node/next (por nombre del proceso, no por texto del comando)
pids_node() { ps -eo pid=,comm= 2>/dev/null | awk '$2 ~ /^(node|nodejs|npm|next-server|next-router)/{print $1}'; }

# ---------------------------------------------------------------------------
# Descubrir proyectos
# ---------------------------------------------------------------------------
declare -a PROYECTOS=()

agregar_candidato() {
  local d="$1" top
  [ -d "$d" ] || return 0
  d="$(cd "$d" 2>/dev/null && pwd -P)" || return 0
  top="$(git -c safe.directory='*' -C "$d" rev-parse --show-toplevel 2>/dev/null)" && d="$top"
  PROYECTOS+=("$d")
}

descubrir_proyectos() {
  local base marker
  for base in /var/www /srv /opt /home /root ${EXTRA[@]+"${EXTRA[@]}"}; do
    [ -d "$base" ] || continue
    while IFS= read -r -d '' marker; do
      agregar_candidato "$(dirname "$marker")"
    done < <(find "$base" -maxdepth 3 \
               \( -name node_modules -o -name vendor -o -name .next -o -name .medusa \
                  -o -name snap -o -name nvm -o -name rbenv -o -name pyenv -o -name asdf -o -name go \
                  -o \( -type d -name '.*' ! -name .git \) \) -prune -o \
               \( -name .git -o -name package.json -o -name docker-compose.yml -o -name compose.yaml \
                  -o -name composer.json -o -name requirements.txt -o -name manage.py \
                  -o -name ecosystem.config.js -o -name index.php \) -print0 2>/dev/null)
  done
  # Carpetas donde corren procesos de node (pm2, next, medusa…), sin tocar pm2
  local pid
  for pid in $(pids_node); do
    agregar_candidato "$(readlink "/proc/$pid/cwd" 2>/dev/null)"
  done
  # Carpetas de docker compose
  if tiene docker; then
    while IFS= read -r d; do [ -n "$d" ] && agregar_candidato "$d"; done < <(
      docker ps -q 2>/dev/null | xargs -r docker inspect --format '{{index .Config.Labels "com.docker.compose.project.working_dir"}}' 2>/dev/null | sort -u)
  fi
  # Ordenar, quitar duplicados y subcarpetas de otra carpeta ya listada
  local prev="" p
  local -a limpios=()
  while IFS= read -r p; do
    [ -z "$p" ] && continue
    if [ -n "$prev" ] && [ "${p#"$prev"/}" != "$p" ]; then continue; fi
    limpios+=("$p"); prev="$p"
  done < <(printf '%s\n' "${PROYECTOS[@]}" | sort -u)
  PROYECTOS=("${limpios[@]}")
}

# ---------------------------------------------------------------------------
# Informe por proyecto
# ---------------------------------------------------------------------------
comparar_con_github() {
  local remoto="$1" rama_remota sha_remoto relacion n
  local ls
  ls="$(timeout --foreground 25 git -c safe.directory='*' -C "$REPO_DIR" ls-remote --symref "$remoto" HEAD 2>&1)" || {
    echo "    Comparación con GitHub: no se pudo conectar ($(echo "$ls" | tail -1 | enmascarar))"
    return
  }
  rama_remota="$(echo "$ls" | awk '/^ref:/{sub("refs/heads/","",$2); print $2; exit}')"
  sha_remoto="$(echo "$ls" | awk '$2=="HEAD" && $1!="ref:"{print $1; exit}')"
  echo "    Rama principal en GitHub: ${rama_remota:-?} → ${sha_remoto:0:7}"
  local head; head="$(G rev-parse HEAD 2>/dev/null)"
  if [ -z "$sha_remoto" ] || [ -z "$head" ]; then return; fi
  if [ "$head" = "$sha_remoto" ]; then
    relacion="IGUAL: el último commit del servidor es el mismo que el de GitHub"
  elif ! G cat-file -e "${sha_remoto}^{commit}" 2>/dev/null; then
    relacion="GitHub tiene commits que este servidor nunca descargó (alguien subió cosas desde otro lado)"
  elif G merge-base --is-ancestor "$sha_remoto" "$head" 2>/dev/null; then
    n="$(G rev-list --count "${sha_remoto}..${head}")"
    relacion="el servidor tiene $n commit(s) guardados que NUNCA se subieron a GitHub"
  elif G merge-base --is-ancestor "$head" "$sha_remoto" 2>/dev/null; then
    n="$(G rev-list --count "${head}..${sha_remoto}")"
    relacion="GitHub tiene $n commit(s) más nuevos que el servidor no tiene"
  else
    relacion="DIVERGIDOS: servidor y GitHub tienen commits distintos cada uno"
  fi
  echo "    Relación commits servidor ↔ GitHub: $relacion"
  echo "    Ramas en GitHub: $(timeout --foreground 25 git -c safe.directory='*' -C "$REPO_DIR" ls-remote --heads "$remoto" 2>/dev/null | awk '{sub("refs/heads/","",$2); printf "%s ", $2}' | head -c 600)"
}

informe_git() {
  local d="$1"
  REPO_DIR="$d"
  local err
  if ! err="$(G rev-parse --git-dir 2>&1)"; then
    if printf '%s' "$err" | grep -qi 'dubious\|unsafe' && [ "$(id -u)" = 0 ] && command -v runuser >/dev/null 2>&1; then
      COMO_DUENO="$(stat -c %U "$d")"
      G() { runuser -u "$COMO_DUENO" -- git -c core.fsmonitor=false --no-pager -C "$REPO_DIR" "$@"; }
      err="$(G rev-parse --git-dir 2>&1)" || { echo "  Git: hay carpeta .git pero git no la puede leer: $(echo "$err" | tail -2 | tr '\n' ' ')"; G() { git -c safe.directory='*' -c core.fsmonitor=false --no-pager -C "$REPO_DIR" "$@"; }; return; }
      echo "  (git leído como el dueño '$COMO_DUENO' porque esta versión de git no confía en carpetas de otros)"
    else
      echo "  Git: hay carpeta .git pero git no la puede leer: $(echo "$err" | tail -2 | tr '\n' ' ')"
      return
    fi
  fi
  local gitdir owner_git
  gitdir="$(G rev-parse --absolute-git-dir 2>/dev/null)"
  owner_git="$(stat -c '%U:%G' "$gitdir" 2>/dev/null)"
  echo "  Git: SÍ  (carpeta $gitdir, dueño $owner_git — vos sos $(id -un))"
  local foraneos
  foraneos="$(find "$gitdir/objects" -maxdepth 1 ! -user "$(stat -c %U "$gitdir")" 2>/dev/null | head -3 | wc -l)"
  [ "$foraneos" -gt 0 ] && echo "    OJO: hay archivos dentro de .git con otro dueño (puede dar errores de permisos)"
  echo "    Rama actual: $(G symbolic-ref --short -q HEAD 2>/dev/null || echo "(ninguna: HEAD suelto en $(G rev-parse --short HEAD 2>/dev/null))")"
  if G rev-parse -q --verify HEAD >/dev/null; then
    echo "    Último commit: $(G log -1 --format='%h  %ad  %an  "%s"' --date=format:'%Y-%m-%d %H:%M' 2>/dev/null) ($(G log -1 --format=%cr))"
    echo "    Últimos commits:"
    G log -5 --format='      %h %ad %s' --date=short 2>/dev/null
  else
    echo "    (el repositorio no tiene ningún commit todavía)"
  fi
  echo "    Ramas locales:"
  G branch -vv --no-color 2>/dev/null | sed 's/^/      /' | head -15
  local n_st; n_st="$(G stash list 2>/dev/null | wc -l)"
  [ "$n_st" -gt 0 ] && echo "    OJO: hay $n_st 'stash' guardados (cambios apartados que no están en ningún commit)"
  [ -e "$gitdir/index.lock" ] && echo "    OJO: existe index.lock (alguien está usando git ahora, o quedó colgado)"
  for f in MERGE_HEAD rebase-merge rebase-apply CHERRY_PICK_HEAD; do
    [ -e "$gitdir/$f" ] && echo "    OJO: hay una operación de git a medio terminar ($f)"
  done
  local hooks; hooks="$(ls "$gitdir/hooks" 2>/dev/null | grep -v '\.sample$' | tr '\n' ' ')"
  [ -n "$hooks" ] && echo "    Hooks activos (se ejecutan al hacer commit): $hooks"

  echo "    Remotos:"
  local r
  for r in $(G remote 2>/dev/null); do
    local url; url="$(G remote get-url "$r" 2>/dev/null)"
    local tipo="https"; case "$url" in git@*|ssh://*) tipo="ssh";; esac
    local cred=""; case "$url" in https://*@*) cred=" (¡TIENE UN TOKEN/CLAVE ESCRITO EN LA URL!)";; esac
    echo "      $r → $(echo "$url" | enmascarar)  [$tipo]$cred"
  done
  local helper; helper="$(G config --get credential.helper 2>/dev/null)"
  [ -n "$helper" ] && echo "    Guardado de credenciales: $helper"

  # Cambios sin commitear (sin escribir el índice)
  local st mod del otros nuevos
  st="$(G status --porcelain=v1 -uno 2>/dev/null)"
  mod="$(printf '%s\n' "$st" | grep -c '^.M\|^M' || true)"
  del="$(printf '%s\n' "$st" | grep -c '^.D\|^D' || true)"
  otros="$(printf '%s\n' "$st" | grep -vc '^.M\|^M\|^.D\|^D\|^$' || true)"
  nuevos="$(G ls-files -o --exclude-standard 2>/dev/null | wc -l)"
  echo "    Cambios SIN GUARDAR en git: $mod modificados, $del borrados, $otros otros, $nuevos archivos nuevos"
  if [ "$nuevos" -gt 0 ]; then
    echo "    Archivos nuevos por carpeta (top 15):"
    G ls-files -o --exclude-standard 2>/dev/null | awk -F/ '{ if (NF>2) print $1"/"$2"/"; else if (NF==2) print $1"/"; else print "(raíz)" }' \
      | sort | uniq -c | sort -rn | head -15 | sed 's/^/      /'
  fi
  if [ "$mod" -gt 0 ] || [ "$del" -gt 0 ]; then
    echo "    Modificados/borrados por carpeta (top 15):"
    printf '%s\n' "$st" | awk 'NF{ $1=""; sub(/^ /,""); n=split($0,a,"/"); if (n>2) print a[1]"/"a[2]"/"; else if (n==2) print a[1]"/"; else print "(raíz)" }' \
      | sort | uniq -c | sort -rn | head -15 | sed 's/^/      /'
  fi
  local grandes
  grandes="$(G ls-files -o --exclude-standard -z 2>/dev/null | (cd "$d" && xargs -0 -r stat -c '%s %n' 2>/dev/null) | awk '$1>20*1024*1024{printf "      %.0f MB  %s\n", $1/1048576, substr($0, index($0,$2))}' | head -20)"
  [ -n "$grandes" ] && { echo "    Archivos nuevos GRANDES (>20 MB, GitHub no acepta >100 MB):"; echo "$grandes"; }
  local anidados
  anidados="$(find "$d" -mindepth 2 -maxdepth 5 -name node_modules -prune -o -name .git -print 2>/dev/null | head -10)"
  [ -n "$anidados" ] && { echo "    OJO: hay repositorios git DENTRO del proyecto (git no guardaría su contenido):"; echo "$anidados" | sed 's/^/      /'; }
  if G remote get-url origin >/dev/null 2>&1; then comparar_con_github origin; fi
  G() { git -c safe.directory='*' -c core.fsmonitor=false --no-pager -C "$REPO_DIR" "$@"; }
}

# Medusa usa JWT_SECRET/COOKIE_SECRET = "supersecret" si no están definidos.
# En modo desarrollo (npm run dev) Medusa lee SOLO backend/.env (no .env.production).
# Se informa si están definidos, nunca el valor.
chequear_medusa() {
  local d="$1" cfg dirb f var linea
  while IFS= read -r cfg; do
    dirb="$(dirname "$cfg")"
    echo "  Medusa en: ${dirb#"$d"/}"
    for f in .env .env.development .env.production; do
      [ -f "$dirb/$f" ] || { echo "    $f: no existe"; continue; }
      local res=""
      for var in JWT_SECRET COOKIE_SECRET; do
        linea="$(grep -E "^[[:space:]]*(export[[:space:]]+)?$var=" "$dirb/$f" 2>/dev/null | tail -1)"
        if [ -z "$linea" ]; then res+="$var=NO DEFINIDO  "
        elif printf '%s' "$linea" | grep -qE "=[\"']?(supersecret|secret|changeme)?[\"']?[[:space:]]*$"; then res+="$var=VALOR POR DEFECTO/VACÍO  "
        else res+="$var=definido  "
        fi
      done
      echo "    $f: $res"
    done
    echo "    (con 'npm run dev' Medusa lee backend/.env; si ahí falta JWT_SECRET usa 'supersecret' → PELIGRO)"
  done < <(find "$d" -maxdepth 3 -name node_modules -prune -o \( -name 'medusa-config.ts' -o -name 'medusa-config.js' \) -print 2>/dev/null)
}

informe_proyecto() {
  local d="$1"
  titulo "PROYECTO: $d"
  echo "  Dueño de la carpeta: $(stat -c '%U:%G' "$d" 2>/dev/null)"
  echo "  Tamaño (sin node_modules/.next/.git): $(timeout 90 du -sh --exclude=node_modules --exclude=.next --exclude=.git --exclude=.medusa "$d" 2>/dev/null | cut -f1)"
  local ultimo
  ultimo="$(timeout 90 find "$d" \( -name node_modules -o -name .git -o -name .next -o -name .medusa -o -name .cache \) -prune -o -type f -printf '%T@ %TY-%Tm-%Td %TH:%TM  %P\n' 2>/dev/null | sort -rn | head -3 | cut -d' ' -f2-)"
  echo "  Últimos archivos modificados (¿se está trabajando acá?):"
  echo "$ultimo" | sed 's/^/    /'
  local envs
  envs="$(find "$d" -maxdepth 5 -name node_modules -prune -o \( -name '.env' -o -name '.env.*' -o -name '*.pem' -o -name '*.key' -o -name 'credentials*.json' \) -print 2>/dev/null | sed "s#^$d/##" | tr '\n' ' ')"
  echo "  Archivos con posibles secretos (solo el nombre): ${envs:-ninguno}"
  local tipo=""
  [ -f "$d/package.json" ] && tipo+="node "
  [ -f "$d/composer.json" ] && tipo+="php "
  [ -f "$d/index.php" ] && tipo+="php "
  [ -f "$d/requirements.txt" ] || [ -f "$d/manage.py" ] && tipo+="python "
  { [ -f "$d/docker-compose.yml" ] || [ -f "$d/compose.yaml" ]; } && tipo+="docker-compose "
  [ -n "$tipo" ] && echo "  Tipo: $tipo"
  chequear_medusa "$d"
  if [ -d "$d/.git" ] || [ -f "$d/.git" ]; then
    informe_git "$d"
  else
    echo "  Git: NO — esta carpeta no tiene historial de versiones (no está en GitHub desde acá)."
  fi
}

seccion_procesos() {
  titulo "4. PROCESOS QUE ESTÁN CORRIENDO"
  echo "--- procesos de node (carpeta en la que corren) ---"
  local pid encontrados=0
  for pid in $(pids_node); do
    [ -r "/proc/$pid/cmdline" ] || continue
    encontrados=1
    printf '  %-10s pid %-7s carpeta=%s\n      %s\n' "$(ps -o user= -p "$pid" 2>/dev/null)" "$pid" \
      "$(readlink "/proc/$pid/cwd" 2>/dev/null || echo '?')" "$(ps -o args= -p "$pid" 2>/dev/null | cut -c1-160 | enmascarar_fuerte)"
  done
  [ "$encontrados" = 0 ] && echo "  (ninguno visible; si no sos root, corré con sudo)"
  # pm2: solo se consulta un daemon que YA esté corriendo (nunca se arranca uno nuevo)
  local h u
  for h in /root/.pm2 /home/*/.pm2; do
    [ -S "$h/rpc.sock" ] || continue
    u="$(stat -c %U "$h")"
    echo "--- pm2 de $u ---"
    if [ "$(id -un)" = "$u" ]; then
      PM2_HOME="$h" pm2 jlist 2>/dev/null
    elif [ "$(id -u)" = 0 ] && command -v runuser >/dev/null 2>&1; then
      runuser -u "$u" -- env PM2_HOME="$h" pm2 jlist 2>/dev/null
    fi | node -e '
      let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
        let a;try{a=JSON.parse(s.slice(s.indexOf("[")))}catch(e){console.log("  (no se pudo leer; corré con sudo)");return}
        if(!a.length)console.log("  (sin procesos)");
        for(const p of a){const e=p.pm2_env||{};const args=Array.isArray(e.args)?e.args.join(" "):(e.args||"");
          console.log(`  - ${p.name}  [${e.status}]  carpeta=${e.pm_cwd}  comando=${e.pm_exec_path} ${args}  reinicios=${e.restart_time}  NODE_ENV=${(e.env&&e.env.NODE_ENV)||e.NODE_ENV||"-"}`)}
      })' 2>/dev/null | enmascarar_fuerte
  done
  if tiene docker; then
    echo "--- docker ---"
    docker ps --format '  - {{.Names}}  [{{.Status}}]  imagen={{.Image}}  puertos={{.Ports}}' 2>/dev/null || echo "  (sin permiso para docker)"
  fi
  echo "--- Puertos escuchando ---"
  if tiene ss; then
    ss -ltnpH 2>/dev/null | awk '{ proc=$NF; sub(/users:\(\("/,"",proc); sub(/".*/,"",proc); printf "  %-28s %s\n", $4, proc }' | sort -u
    ss -ltnH 2>/dev/null | awk '{print $4}' | sort -u | while read -r dirp; do
      local puerto="${dirp##*:}" host="${dirp%:*}"
      case "$puerto" in 5432|5433|5434|5435|5436|3306|6379|6380|6381|27017|9200|11211)
        case "$host" in 127.*|"[::1]"|localhost) ;;
          *) echo "  PELIGRO: el puerto $puerto (base de datos/cache) escucha en $host → accesible desde afuera si el firewall no lo bloquea." ;;
        esac ;;
      esac
    done
  fi
  if tiene ufw && [ "$(id -u)" = 0 ]; then
    echo "--- Firewall (ufw) ---"
    ufw status 2>/dev/null | head -25 | sed 's/^/  /'
  fi
}

seccion_nginx() {
  titulo "5. NGINX (qué dominio va a qué carpeta o puerto)"
  if ! tiene nginx; then echo "nginx no encontrado."; return; fi
  local conf; conf="$(nginx -T 2>/dev/null)" || { echo "(no pude leer la config: correr como root)"; return; }
  echo "$conf" | grep -E '^# configuration file|^[[:space:]]*(server_name|root|proxy_pass|listen|include)[[:space:]]' \
    | grep -v 'mime.types\|fastcgi\|snippets/\|modules-enabled' | sed 's/^[[:space:]]*/  /' | enmascarar
  echo
  local r
  for r in $(echo "$conf" | awk '$1=="root"{gsub(";","",$2); print $2}' | sort -u); do
    if [ -e "$r/.git" ]; then
      echo "  PELIGRO: nginx sirve la carpeta $r y adentro hay .git → el código podría descargarse desde internet."
    fi
  done
}

seccion_cron() {
  titulo "6. TAREAS PROGRAMADAS (cron) — enmascaradas"
  local u
  if [ "$(id -u)" = 0 ]; then
    for u in $(cut -d: -f1 /etc/passwd); do
      local c; c="$(crontab -l -u "$u" 2>/dev/null | grep -Ev '^[[:space:]]*(#|$)')"
      [ -n "$c" ] && { echo "--- crontab de $u ---"; echo "$c" | enmascarar_fuerte | cut -c1-220; }
    done
  else
    crontab -l 2>/dev/null | grep -Ev '^[[:space:]]*(#|$)' | enmascarar_fuerte | cut -c1-220
  fi
  [ -d /etc/cron.d ] && echo "--- /etc/cron.d: $(ls /etc/cron.d 2>/dev/null | tr '\n' ' ')"
  if tiene systemctl; then
    echo "--- timers de systemd (no del sistema) ---"
    systemctl list-timers --all --no-pager 2>/dev/null | grep -Ev 'apt|logrotate|man-db|fstrim|e2scrub|motd|systemd-|snapd|fwupd|ua-|update-notifier|dpkg|sysstat|^$|NEXT|timers listed' | head -15
  fi
}

main() {
  echo "DIAGNÓSTICO GIT DEL SERVIDOR — solo lectura (no se modificó nada)"
  seccion_sistema
  seccion_git_global
  descubrir_proyectos
  titulo "3. PROYECTOS ENCONTRADOS (${#PROYECTOS[@]})"
  local p
  for p in "${PROYECTOS[@]}"; do
    if [ -e "$p/.git" ]; then echo "  [git]    $p"; else echo "  [SIN git] $p"; fi
  done
  for p in "${PROYECTOS[@]}"; do informe_proyecto "$p"; done
  seccion_procesos
  seccion_nginx
  seccion_cron
  titulo "FIN"
  echo "Informe guardado en: $SALIDA"
  echo "Intenta ocultar contraseñas y tokens, pero LEELO antes de compartirlo"
  echo "(buscá líneas con curl, mysqldump, token, key, password). Después pegalo en la conversación con Claude."
}

main 2>&1 | tee "$SALIDA"
[ -n "${SUDO_USER:-}" ] && chown "$SUDO_USER" "$SALIDA" 2>/dev/null
exit 0
