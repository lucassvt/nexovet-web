# Guía de git para Nexovet

Para Lucas y Lourdes. Cómo tener en GitHub la versión oficial del código que corre en
el servidor, sin romper nada mientras las sucursales venden. Vale para **todos** los
proyectos del servidor (la tienda, Express, logística, finanzas, etc.), no solo la tienda.

---

## 0. Antes que nada: seguridad

1. **Los repositorios con código de la empresa tienen que ser privados.** El de la tienda
   (`nexovet-shop`) ya lo es. Hay una copia vieja, `nexovet-web`, que es **pública** y tiene
   contraseñas escritas: hay que ocultarla (ver Paso 2).
2. **Hacerlo privado no borra lo que ya se vio.** Si alguna vez hubo contraseñas escritas en
   el código (Claude les pasa la lista aparte), hay que **cambiarlas** igual: el usuario
   admin de la tienda, las bases de datos y cualquier token. Háganlo fuera del horario de venta.

---

## 1. Git en 5 minutos

| Palabra | Qué es, en criollo |
|---|---|
| **Repositorio** | Una carpeta con memoria. Además de los archivos, guarda todo su historial (en la subcarpeta oculta `.git`). |
| **Commit** | Una **foto** de todos los archivos en un momento, con fecha, autor y una frase ("arreglo precio en carrito"). Una vez sacada, no se pierde. |
| **Rama** | Una línea de fotos. `main` es la rama **oficial**. |
| **GitHub** | Una copia en la nube del repositorio. **No es el servidor**: el servidor no se actualiza solo desde GitHub, ni GitHub desde el servidor. |
| **push** | Subir fotos del servidor a GitHub. |
| **fetch** | Bajar *información* de GitHub. No toca ningún archivo del sistema. |
| **pull / merge / checkout** | Aplicar cambios a los archivos. **Esto sí cambia lo que corre en vivo.** |

### Qué comandos se pueden usar en el servidor

Hoy la tienda corre **compilada** (Medusa desde `backend/.medusa/server` y la tienda con
`next start`): cambiar un archivo no cambia lo que ven los clientes hasta que alguien
recompila y reinicia con pm2. Igual, un `git pull` o un `git stash` pueden dejar el código
fuente distinto de lo que corre, y el próximo reinicio o compilación lo pone en vivo.

| Seguro (no cambia archivos) | Cuidado (cambia archivos en vivo) | Peligroso (borra trabajo o sube secretos) |
|---|---|---|
| `git status`, `git log`, `git diff`, `git fetch`, `git show` | `git pull`, `git merge`, `git checkout rama`, `git switch`, `git stash pop`, `git rebase` | `git stash` (vuelve TODOS los archivos al último commit), `git restore`, `git checkout -- archivo`, `git reset --hard`, `git clean`, `git stash drop`, `git push --force`, y también `git add` / `git commit` / `git push` a mano (se saltean los controles de contraseñas: usen `guardar`) |

> **Si `git pull` dice "Please commit your changes or stash them", NO hagan `git stash`.**
> Corran `bash ~/nexovet-git/git-vps.sh estado` y pásenle la salida a Claude.

En otros proyectos (por ejemplo Express o los de Python) el sistema puede leer los archivos
directamente: ahí un `git pull` o un `git stash` cambian lo que corre **en el momento**.

Para guardar y subir, usen siempre el script de abajo, que hace todo con los controles.

---

## 2. Dónde estamos

- **La versión oficial es la del servidor.** GitHub se pone igual al servidor, nunca al revés.
- **La tienda ya está hecha:** `/var/www/nexovet-shop` → `lucassvt/nexovet-shop` (privado).
  `main` en GitHub es igual a lo que corre, y el servidor quedó alineado el 27/09/2026.
- **Faltan los otros proyectos del servidor.** La lista y en qué paso está cada uno está en
  la sección 8. Se hacen de a uno, con los mismos pasos que la tienda.
- `lucassvt/nexovet-web` es una copia vieja (abril) y **pública**: no es la que usa el servidor.
- **Riesgo mientras tanto:** si el disco del servidor falla o alguien borra algo por error,
  lo que no esté en GitHub no tiene copia en ningún otro lado.

---

## 3. Los scripts

Están en `scripts/vps/` de este repositorio. Se copian al servidor **fuera** de la carpeta
del proyecto.

- **`diagnostico.sh`**: recorre el servidor y arma un informe (qué proyectos hay, cuáles
  están en git, qué tan desactualizados están, qué procesos corren y qué dominio apunta a
  qué carpeta). **Solo lectura.** Tapa lo que parezcan contraseñas, pero hay que leerlo
  antes de compartirlo.
- **`simular-todos.sh`**: corre la foto de prueba (`foto --simular`) en todos los proyectos,
  uno por uno, y junta el resultado en un solo informe. **Solo lectura.**
- **`git-vps.sh`**: el que guarda en GitHub. Sirve para cualquier proyecto: se le pasa la
  carpeta (`bash git-vps.sh guardar /var/www/express/app`). **Nunca modifica ni borra
  archivos del sistema.** Escribe dentro de `.git` y, como única excepción, puede traer desde
  GitHub **documentación** (`docs/`, `scripts/vps/` y archivos `.md` de la carpeta principal),
  siempre que el servidor no la haya modificado. Cualquier otro archivo que llegue de GitHub
  es un deploy y no lo toca.

| Modo | Cuándo | Qué hace |
|---|---|---|
| `estado` | Cuando quieran | Muestra cómo está todo y cuál es el próximo paso. Solo lee. |
| `iniciar` | Una sola vez, solo en proyectos que no están en GitHub | Crea la carpeta oculta `.git` (si no existe) y la conecta con un repositorio privado nuevo. No toca archivos. |
| `foto` | Al principio, hasta alinear | Sube **todo** lo que hay hoy a una rama nueva (`vps/foto-FECHA`) para revisarla. |
| `alinear` | Una sola vez | Conecta el servidor con la versión oficial, cuando la foto ya se aprobó. |
| `guardar` | El día a día | Guarda los cambios del servidor en `main` y los sube. |

Controles que hacen `foto` y `guardar` antes de subir:

- **Frenan si el repositorio de GitHub es público.**
- **Dejan afuera** los archivos nuevos que no deben ir a git: `.env`, claves y certificados,
  `node_modules`, `venv` y `__pycache__` de Python, carpetas compiladas (`.next`, `.medusa`,
  `dist`, `build`), archivos subidos por usuarios, volcados de base de datos, comprimidos,
  logs, planillas `.csv`/`.xlsx` y copias de respaldo hechas a mano (`.bak`, `.old`, etc.).
  Muestran la lista de lo que quedó afuera. Todo eso **sigue en el servidor**; solo no se sube.
- Los archivos que **ya estaban** en git se siguen guardando. Si son planillas, datos o
  SQL, el script avisa para que los revisen.
- **Buscan contraseñas, tokens y datos personales** en todo lo que GitHub todavía no tiene
  (Mercado Pago, GitHub, claves privadas, direcciones con usuario y contraseña, listas de
  emails, DNI o teléfonos, etc.). Si encuentran algo grave, no suben nada y explican qué hacer.
- **Nunca suben el historial local tal cual.** Si alguien hizo commits a mano en el
  servidor, no se suben uno por uno: se sube un único cambio con el estado final, revisado.
  Así, una contraseña que se commiteó y después se borró no llega a GitHub.
- **Frenan con archivos de más de 95 MB** (GitHub no los acepta) y si no alcanza el disco.
- **Tienen un candado**: si los dos lo corren a la vez, el segundo espera hasta un minuto y,
  si sigue ocupado, se frena con un aviso. Hay que repetirlo después.
- **`--simular`** hace todo el análisis sin crear ni subir nada, y no deja nada ocupando disco.

---

## 4. Crear la versión oficial (una sola vez)

Se hace **una vez por proyecto**. En los ejemplos, `CARPETA` es la carpeta del proyecto
(por ejemplo `/var/www/logistica-system`). Sin carpeta, el script usa la tienda.

Hoy todo se hace como **root** (el servidor sube a GitHub con las credenciales de root). Si
root crea algo dentro de un `.git` de otro usuario, el script se lo devuelve a su dueño.

### Paso 1: Copiar los scripts al servidor

```bash
mkdir -p ~/nexovet-git && cd ~/nexovet-git
RAMA=claude/git-workflow-official-version-7shxms     # cuando esto esté aprobado: RAMA=main
curl -fsSLO https://raw.githubusercontent.com/lucassvt/nexovet-web/$RAMA/scripts/vps/git-vps.sh
curl -fsSLO https://raw.githubusercontent.com/lucassvt/nexovet-web/$RAMA/scripts/vps/diagnostico.sh
curl -fsSLO https://raw.githubusercontent.com/lucassvt/nexovet-web/$RAMA/scripts/vps/simular-todos.sh
ls -l
```

Los archivos tienen que pesar varios KB. Si pesan 0, no sigan.

Si el repositorio `nexovet-web` ya es privado, `curl` va a fallar. Una vez hecho el Paso 3, se bajan con
el git del proyecto (`fetch` y `show` no tocan archivos del sistema):

```bash
cd /var/www/nexovet-shop
git fetch https://github.com/lucassvt/nexovet-web claude/git-workflow-official-version-7shxms
git show FETCH_HEAD:scripts/vps/git-vps.sh > ~/nexovet-git/git-vps.sh.nuevo \
  && [ -s ~/nexovet-git/git-vps.sh.nuevo ] && mv ~/nexovet-git/git-vps.sh.nuevo ~/nexovet-git/git-vps.sh
git show FETCH_HEAD:scripts/vps/diagnostico.sh > ~/nexovet-git/diagnostico.sh.nuevo \
  && [ -s ~/nexovet-git/diagnostico.sh.nuevo ] && mv ~/nexovet-git/diagnostico.sh.nuevo ~/nexovet-git/diagnostico.sh
ls -l ~/nexovet-git
```

Si algún comando da error, no sigan: los archivos anteriores quedan como estaban.

### Paso 2: Hacer privada la copia vieja

El repositorio de la tienda (`nexovet-shop`) ya es privado. La copia vieja `nexovet-web` no:
GitHub → repositorio `nexovet-web` → **Settings** → **General** → abajo de todo, en
*Danger Zone* → **Change repository visibility** → **Private**. No afecta al servidor.

### Paso 3: Credenciales de GitHub en el servidor

Para subir, el servidor necesita permiso sobre el repositorio. Lo más acotado es una
**deploy key**, que sirve para este repositorio y para ningún otro. Hagan esto como el
mismo usuario que va a correr los scripts:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/nexovet_deploy -N "" -C "vps nexovet-shop"
cat ~/.ssh/nexovet_deploy.pub
```

(Hoy el servidor ya sube a GitHub con credenciales guardadas de root, así que este paso es
opcional: sirve para reemplazarlas por una llave que solo abre este repositorio.)

1. En GitHub: repositorio `nexovet-shop` → **Settings** → **Deploy keys** → **Add deploy key**. Pegar lo que
   mostró el `cat`, **tildar "Allow write access"** y guardar.
2. En el servidor:

```bash
cat >> ~/.ssh/config <<'EOF'
Host github-nexovet
  HostName github.com
  User git
  IdentityFile ~/.ssh/nexovet_deploy
  IdentitiesOnly yes
  StrictHostKeyChecking accept-new
EOF
ssh -T git@github-nexovet
```

Tiene que decir algo como *"Hi lucassvt/nexovet-shop! You've successfully authenticated"*.
Después:

```bash
git -C /var/www/nexovet-shop remote set-url origin git@github-nexovet:lucassvt/nexovet-shop.git
bash ~/nexovet-git/git-vps.sh estado
```

Cambiar la URL del remoto solo modifica la configuración de git, no los archivos.

> **Si en algún momento aparece `Username for 'https://github.com':` o `Password`,
> aprieten Ctrl+C.** No escriban su usuario ni su contraseña: GitHub no las acepta y lo
> escrito puede quedar guardado en la consola. Hagan este paso de credenciales.

### Paso 4: Diagnóstico (solo lectura)

```bash
sudo bash ~/nexovet-git/diagnostico.sh
```

Tarda uno o dos minutos y deja el informe en `/tmp/diagnostico-git-….txt`. Ábranlo con
`less /tmp/diagnostico-git-*.txt`, **léanlo** (buscar líneas con *password*, *token* o
*key* que se hayan escapado) y péguenlo en la conversación con Claude. Con eso se ve si hay
otros sistemas en el servidor que también convenga guardar (por ejemplo, el Centro de Comando).

### Paso 4b: Solo si el proyecto no está en GitHub

Algunos proyectos no tienen git, o lo tienen sin conexión con GitHub (sección 8). Para esos:

1. En GitHub: **New repository** → nombre (por ejemplo `express-app`) → **Private** →
   tildar **Add a README file** → **Create repository**.
2. En el servidor:

```bash
bash ~/nexovet-git/git-vps.sh iniciar CARPETA --url https://github.com/lucassvt/NOMBRE
```

Pide escribir `SI`. Frena si el repositorio es público o está vacío. Crea la carpeta oculta
`.git` y la conecta; **no toca ningún archivo del proyecto**. Después sigan con el Paso 5.

### Paso 5: Foto de prueba (no sube nada)

```bash
bash ~/nexovet-git/git-vps.sh foto CARPETA --simular
```

Muestra qué archivos son nuevos, cuáles cambiaron o se borraron, qué queda afuera y si
hay alertas. La lista completa queda en `/tmp/git-vps-detalle-…txt` (un archivo por
proyecto). **Pásenle ese archivo a Claude antes de seguir**, haya alertas o no.

Para simular **todos los proyectos de una vez** (sección 8):

```bash
bash ~/nexovet-git/simular-todos.sh
```

Revisa uno por uno, muestra una línea por proyecto y deja todo junto en
`/tmp/simular-todos-FECHA.txt` para pasarle a Claude. Tampoco sube ni cambia nada.

### Paso 6: Foto real

```bash
bash ~/nexovet-git/git-vps.sh foto CARPETA
```

Pide escribir `SI`. Crea en GitHub la rama `vps/foto-FECHA` con el estado exacto del
servidor. **No cambia nada en el servidor ni en `main`.**

### Paso 7: Revisión y aprobación

Pásenle a Claude el nombre de la rama. Claude revisa la foto y abre un *pull request* contra
`main`. Ustedes lo aprueban en GitHub con el botón verde **Merge pull request**
(cualquiera de sus opciones funciona). Desde ese momento **`main` es la versión oficial**.

La revisión puede tardar. Mientras tanto sigan trabajando normal. **`guardar` todavía no
funciona.** Si quieren respaldar lo nuevo, saquen otra foto (Paso 6).

### Paso 8: Alinear el servidor (una sola vez)

```bash
bash ~/nexovet-git/git-vps.sh alinear CARPETA
```

Conecta la copia del servidor con `main` sin tocar archivos del sistema. Si `main` tiene
documentación que el servidor no tiene (por ejemplo, el README que crea GitHub), la agrega.
Si `main` tuviera **cambios de código** que el servidor no tiene, `alinear` no hace nada y
avisa: eso es un deploy y se hace acompañado.

---

## 5. El día a día

### Guardar lo que hicieron en el servidor

Cada vez que terminan un cambio **y funciona**:

```bash
bash ~/nexovet-git/git-vps.sh guardar CARPETA --autor "Lourdes <su-mail>" --mensaje "Banner de envíos gratis"
```

Si no ponen `--mensaje`, el script lo pregunta. Pongan una frase que diga **qué** cambió.
Si tocaron dos proyectos, corran `guardar` una vez por cada carpeta.

Como los dos trabajan en la misma carpeta, un `guardar` incluye los cambios de los dos.
Está bien, pero conviene avisarse ("guardo yo").

`git status` a mano puede mostrar archivos que el script igual deja afuera. Hagan caso a lo
que dice `bash ~/nexovet-git/git-vps.sh estado`.

### Cambios que llegan desde GitHub (por ejemplo, hechos con Claude en la web)

`guardar` **nunca trae código de GitHub al servidor**:

- Si GitHub solo tiene documentación (`docs/`, `scripts/vps/`, `.md` de la carpeta
  principal), el servidor se pone al día solo y después guarda normalmente.
- Si GitHub tiene **cualquier otro cambio** (código, configuración, archivos nuevos, o
  documentación que el servidor también cambió), `guardar` sube los cambios del servidor a una rama aparte (`vps/guardado-FECHA`)
  y da un link para Claude. Cuando Claude la combina sin cambios, el siguiente `guardar`
  vuelve solo a `main`.

Llevar código de GitHub al servidor es un **deploy**. Por ahora se hace **acompañado**
(pídanselo a Claude), en un horario tranquilo. Por eso, **no aprueben pull requests con
cambios de código en `main` si no van a hacer el deploy enseguida.**

---

## 6. Cuando el script frena

| Mensaje | Qué hacer |
|---|---|
| "El repositorio es PÚBLICO" | Hacerlo privado (Paso 2) y repetir. |
| "El repositorio de GitHub está vacío" (`iniciar`) | Borrar ese repositorio en GitHub, crearlo de nuevo tildando **Add a README file** y repetir. |
| "Esta carpeta ya tiene git y está conectada" (`iniciar`) | No hace falta `iniciar`: sigan con el Paso 5. |
| "nginx sirve archivos directamente desde …" (`iniciar`) | No se hizo nada. Pásenle la salida a Claude: hay que resolverlo antes para no exponer el código. |
| "ALERTAS DE SEGURIDAD … GRAVE" | Si el archivo no tiene que ir a GitHub: repetir con `--excluir 'ruta/archivo'` (queda recordado para las próximas veces). Si la contraseña está escrita dentro del código, hay que moverla al `.env` (pídanselo a Claude). Si es una falsa alarma: `--ignorar-alertas`. |
| "Cosas para revisar" | Leer la lista. Si está todo bien, escribir `SI`. |
| "todavía no está alineado" | Seguir el plan del Paso 5 al 8. |
| "git no confía en esta carpeta" | Correr el comando que muestra el mensaje (`git config --global --add safe.directory …`) y repetir. |
| "Existe index.lock" | Alguien está usando git. Esperar un minuto y repetir. |
| "No pude conectarme con https://github.com/…" (`iniciar`) | Revisar que el nombre del repositorio esté bien escrito. Si está bien, la credencial guardada en el servidor no tiene permiso sobre ese repositorio nuevo: pásenle la salida a Claude. |
| "No pude conectarme con GitHub" / credenciales | Revisar el Paso 3. Si dice *Host key verification failed*: `ssh -T git@github-nexovet`. |
| "GitHub tiene cambios que el servidor todavía no tiene" | No se tocó nada; lo del servidor quedó en una rama aparte. Pasarle el link a Claude. |
| "No pude escribir estos archivos de documentación" | Suele ser un tema de permisos. No se movió nada; pasarle la salida a Claude. |

`estado`, `iniciar`, `foto`, `alinear` y `guardar` no modifican ni borran archivos del
sistema: aunque algo falle a la mitad o aprieten Ctrl+C, el sistema sigue igual. `guardar` primero sube y
recién después mueve la rama del servidor; si la subida falla, el servidor queda como
estaba. Cuando el script tiene que mover la rama de una forma que no es "hacia adelante"
(por ejemplo en `alinear`), guarda antes la posición anterior en `refs/vps-respaldo/FECHA`.

---

## 7. Glosario rápido

- **Copia de trabajo:** los archivos de verdad, los que usa el sistema.
- **Índice:** la lista de lo que va a entrar en el próximo commit. Para armar cada foto o
  guardado, el script usa un índice temporal propio. Después de `guardar` y `alinear`,
  rehace el índice del servidor para que coincida con el último commit (los archivos no
  se tocan).
- **HEAD:** el último commit sobre el que está parado el servidor.
- **Remoto (`origin`):** el repositorio de GitHub.
- **Pull request (PR):** un pedido para sumar una rama a `main`, que alguien revisa y aprueba.
- **Merge:** sumar los cambios de una rama a otra.
- **Deploy:** llevar código nuevo al servidor en vivo.

---

## 8. Todos los proyectos del servidor

Según el diagnóstico del 27/09/2026. Se hacen de a uno: Pasos 5 a 8 (y antes el 4b si hace
falta). **Nombre en GitHub** es el repositorio que ya existe o el que hay que crear (privado,
con README).

| Carpeta | Nombre en GitHub | Cómo está |
|---|---|---|
| `/var/www/nexovet-shop` | `nexovet-shop` | Hecho (27/09). Solo `guardar`. |
| `/var/www/centro-comando` | `centro-comando` | Tiene GitHub. Falta foto. |
| `/opt/chatbotLamascotera` | `chatbotLamascotera` | Tiene GitHub (rama `testing`, 3 commits sin subir). Falta foto. |
| `/var/www/landigia` | `landigia` | Tiene GitHub. Falta foto. |
| `/var/www/landing-general` | `landing-general` | Tiene GitHub. Falta foto. |
| `/var/www/landing-lamascotera-preview` | `landing-lamascotera-preview` | Tiene GitHub, sin cambios. Falta foto. |
| `/var/www/logistica-system` | `logistica-system` | Tiene GitHub (32 commits sin subir). Falta foto. |
| `/var/www/mi-franquicia` | `mi-franquicia` | Tiene GitHub. Falta foto. |
| `/var/www/milegajo` | `milegajo` | Tiene GitHub. Falta foto. |
| `/var/www/portal-vendedores` | `portal-vendedores` | Tiene GitHub. Falta foto. |
| `/var/www/sistema-finanzas` | `sistema-finanzas` | Tiene GitHub. Falta foto. |
| `/var/www/sistema-rrhh` | `sistema-rrhh` | Tiene GitHub, sin cambios. Falta foto. |
| `/var/www/club-mascotera` | (lo dice la foto) | Tiene git; el diagnóstico no lo pudo leer. Falta foto. |
| `/var/www/crm-cerebro` | (lo dice la foto) | Ídem. |
| `/var/www/landing-lamascotera` | (lo dice la foto) | Ídem. |
| `/var/www/mi-sucursal` | (lo dice la foto) | Ídem. |
| `/var/www/sistema-compras` | (lo dice la foto) | Ídem. |
| `/opt/sistema_compras` | (lo dice la foto) | Ídem. |
| `/opt/mcp-nexovet` | `mcp-nexovet` (crear) | Tiene git pero no GitHub: Paso 4b. |
| `/var/www/express/app` | `express-app` (crear) | Sin git: Paso 4b. |
| `/var/www/express/backend` | `express-backend` (crear) | Sin git: Paso 4b. |
| `/opt/agente-gerencia` | `agente-gerencia` (crear) | Sin git: Paso 4b. |
| `/opt/logistica-panel` | `logistica-panel` (ya existe: copia de abril) | Sin git: Paso 4b, usando ese repositorio (no hace falta crearlo). |
| `/opt/evolution-api` | `evolution-api-config` (crear) | Sin git (solo configuración y scripts): Paso 4b. |
| `/opt/odoo` | `odoo-nexovet` (crear) | Sin git: Paso 4b. |

`/root` no es un proyecto: no se sube.
