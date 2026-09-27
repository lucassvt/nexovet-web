# Guía de git para Nexovet

Para Lucas y Lourdes. Cómo tener en GitHub la versión oficial del código que corre en
el servidor, sin romper nada mientras las sucursales venden.

---

## 0. Antes que nada: seguridad

1. **El repositorio de GitHub tiene que ser privado** (ver Paso 2). Mientras sea público,
   cualquiera puede leer el código.
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

En este servidor el sistema corre en **modo desarrollo**: si cambia un archivo dentro de
`backend/`, Medusa se reinicia solo y la tienda puede no responder entre 10 y 60 segundos.

| Seguro (no cambia archivos) | Cuidado (cambia archivos en vivo) | Peligroso (borra trabajo o sube secretos) |
|---|---|---|
| `git status`, `git log`, `git diff`, `git fetch`, `git show` | `git pull`, `git merge`, `git checkout rama`, `git switch`, `git stash pop`, `git rebase` | `git stash` (vuelve TODOS los archivos al último commit), `git restore`, `git checkout -- archivo`, `git reset --hard`, `git clean`, `git stash drop`, `git push --force`, y también `git add` / `git commit` / `git push` a mano (se saltean los controles de contraseñas: usen `guardar`) |

> **Si `git pull` dice "Please commit your changes or stash them", NO hagan `git stash`.**
> Corran `bash ~/nexovet-git/git-vps.sh estado` y pásenle la salida a Claude.

Para guardar y subir, usen siempre el script de abajo, que hace todo con los controles.

---

## 2. Dónde estamos

- **Servidor:** la tienda vive en `/var/www/nexovet-shop` (backend Medusa + tienda Next.js).
  Se trabaja directo ahí, en vivo.
- **GitHub:** el repositorio `lucassvt/nexovet-web` tiene el código del **19 de abril de 2026**.
  Todo lo que se hizo después existe solamente en el servidor.
- **Riesgo actual:** si el disco del servidor falla o alguien borra algo por error, esos
  meses de trabajo no tienen copia en ningún otro lado.
- **Objetivo:** que `main` en GitHub sea igual a lo que corre hoy (la "versión oficial"),
  y que de ahí en más cada cambio quede guardado.

---

## 3. Los dos scripts

Están en `scripts/vps/` de este repositorio. Se copian al servidor **fuera** de la carpeta
del proyecto.

- **`diagnostico.sh`**: recorre el servidor y arma un informe (qué proyectos hay, cuáles
  están en git, qué tan desactualizados están, qué procesos corren y qué dominio apunta a
  qué carpeta). **Solo lectura.** Tapa lo que parezcan contraseñas, pero hay que leerlo
  antes de compartirlo.
- **`git-vps.sh`**: el que guarda en GitHub. **Nunca modifica ni borra archivos del
  sistema.** Solo escribe dentro de `.git`. La única excepción es agregar archivos
  **nuevos** que vengan de GitHub fuera de `backend/` y `backend-storefront/` (por ejemplo,
  esta guía), sin pisar nada.

| Modo | Cuándo | Qué hace |
|---|---|---|
| `estado` | Cuando quieran | Muestra cómo está todo y cuál es el próximo paso. Solo lee. |
| `foto` | Al principio, hasta alinear | Sube **todo** lo que hay hoy a una rama nueva (`vps/foto-FECHA`) para revisarla. |
| `alinear` | Una sola vez | Conecta el servidor con la versión oficial, cuando la foto ya se aprobó. |
| `guardar` | El día a día | Guarda los cambios del servidor en `main` y los sube. |

Controles que hacen `foto` y `guardar` antes de subir:

- **Frenan si el repositorio de GitHub es público.**
- **Dejan afuera** los archivos nuevos que no deben ir a git: `.env`, claves, `node_modules`,
  `.next`, `.medusa`, imágenes subidas por el admin (`backend/static`), volcados de base de
  datos, comprimidos, logs, planillas `.csv`/`.xlsx` y copias de respaldo hechas a mano.
  Muestran la lista de lo que quedó afuera. Todo eso **sigue en el servidor**; solo no se sube.
- Los archivos que **ya estaban** en git se siguen guardando. Si son planillas, datos o
  SQL, el script avisa para que los revisen.
- **Buscan contraseñas, tokens y datos personales** en todo lo que GitHub todavía no tiene
  (Mercado Pago, GitHub, claves privadas, direcciones con usuario y contraseña, listas de
  emails, etc.). Si encuentran algo grave, no suben nada y explican qué hacer.
- **Frenan con archivos de más de 95 MB** (GitHub no los acepta) y si no alcanza el disco.
- **Tienen un candado**: si los dos lo corren a la vez, el segundo espera hasta un minuto y,
  si sigue ocupado, se frena con un aviso. Hay que repetirlo después.
- **`--simular`** hace todo el análisis sin crear ni subir nada, y no deja nada ocupando disco.

---

## 4. Crear la versión oficial (una sola vez)

Háganlo siempre como **el mismo usuario** del servidor: el dueño de la carpeta del
proyecto. Para saber cuál es: `stat -c %U /var/www/nexovet-shop/.git`

### Paso 1: Copiar los scripts al servidor

```bash
mkdir -p ~/nexovet-git && cd ~/nexovet-git
RAMA=claude/git-workflow-official-version-7shxms     # cuando esto esté aprobado: RAMA=main
curl -fsSLO https://raw.githubusercontent.com/lucassvt/nexovet-web/$RAMA/scripts/vps/git-vps.sh
curl -fsSLO https://raw.githubusercontent.com/lucassvt/nexovet-web/$RAMA/scripts/vps/diagnostico.sh
ls -l
```

Los dos archivos tienen que pesar varios KB. Si pesan 0, no sigan.

Si el repositorio ya es privado, `curl` va a fallar. Una vez hecho el Paso 3, se bajan con
el git del proyecto (`fetch` y `show` no tocan archivos del sistema):

```bash
cd /var/www/nexovet-shop
git fetch origin claude/git-workflow-official-version-7shxms
git show FETCH_HEAD:scripts/vps/git-vps.sh     > ~/nexovet-git/git-vps.sh.nuevo
git show FETCH_HEAD:scripts/vps/diagnostico.sh > ~/nexovet-git/diagnostico.sh.nuevo
mv ~/nexovet-git/git-vps.sh.nuevo ~/nexovet-git/git-vps.sh
mv ~/nexovet-git/diagnostico.sh.nuevo ~/nexovet-git/diagnostico.sh
```

### Paso 2: Hacer privado el repositorio

GitHub → repositorio `nexovet-web` → **Settings** → **General** → abajo de todo, en
*Danger Zone* → **Change repository visibility** → **Private**. No afecta al servidor.

### Paso 3: Credenciales de GitHub en el servidor

Para subir, el servidor necesita permiso sobre el repositorio. Lo más acotado es una
**deploy key**, que sirve para este repositorio y para ningún otro. Hagan esto como el
mismo usuario que va a correr los scripts:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/nexovet_deploy -N "" -C "vps nexovet-web"
cat ~/.ssh/nexovet_deploy.pub
```

1. En GitHub: repositorio → **Settings** → **Deploy keys** → **Add deploy key**. Pegar lo que
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

Tiene que decir algo como *"Hi lucassvt/nexovet-web! You've successfully authenticated"*.
Después:

```bash
git -C /var/www/nexovet-shop remote set-url origin git@github-nexovet:lucassvt/nexovet-web.git
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

### Paso 5: Foto de prueba (no sube nada)

```bash
bash ~/nexovet-git/git-vps.sh foto --simular
```

Muestra qué archivos son nuevos, cuáles cambiaron o se borraron, qué queda afuera y si
hay alertas. **Si hay alertas, péguenle la salida a Claude antes de seguir.**

### Paso 6: Foto real

```bash
bash ~/nexovet-git/git-vps.sh foto
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
bash ~/nexovet-git/git-vps.sh alinear
```

Conecta la copia del servidor con `main` sin modificar archivos. Si `main` tiene archivos
nuevos fuera de las apps (por ejemplo, esta guía), los agrega sin pisar nada. Si `main`
tuviera **cambios de código** que el servidor no tiene, `alinear` no hace nada y avisa: eso
es un deploy y se hace acompañado.

---

## 5. El día a día

### Guardar lo que hicieron en el servidor

Cada vez que terminan un cambio **y funciona**:

```bash
bash ~/nexovet-git/git-vps.sh guardar --autor "Lourdes <su-mail>" --mensaje "Banner de envíos gratis"
```

Si no ponen `--mensaje`, el script lo pregunta. Pongan una frase que diga **qué** cambió.

Como los dos trabajan en la misma carpeta, un `guardar` incluye los cambios de los dos.
Está bien, pero conviene avisarse ("guardo yo").

`git status` a mano puede mostrar archivos que el script igual deja afuera. Hagan caso a lo
que dice `bash ~/nexovet-git/git-vps.sh estado`.

### Cambios que llegan desde GitHub (por ejemplo, hechos con Claude en la web)

`guardar` **nunca trae código de GitHub al servidor**:

- Si GitHub solo tiene archivos nuevos fuera de las apps (documentación, scripts), el
  servidor se pone al día solo, sin tocar nada existente.
- Si GitHub tiene **cambios de código** que el servidor no tiene, `guardar` sube sus
  cambios a una rama aparte (`vps/guardado-FECHA`) y da un link para Claude.

Llevar código de GitHub al servidor es un **deploy**. Por ahora se hace **acompañado**
(pídanselo a Claude), en un horario tranquilo. Por eso, **no aprueben pull requests con
cambios de código en `main` si no van a hacer el deploy enseguida.**

---

## 6. Cuando el script frena

| Mensaje | Qué hacer |
|---|---|
| "El repositorio es PÚBLICO" | Hacerlo privado (Paso 2) y repetir. |
| "ALERTAS DE SEGURIDAD … GRAVE" | Si el archivo no tiene que ir a GitHub: repetir con `--excluir 'ruta/archivo'` (queda recordado para las próximas veces). Si la contraseña está escrita dentro del código, hay que moverla al `.env` (pídanselo a Claude). Si es una falsa alarma: `--ignorar-alertas`. |
| "Cosas para revisar" | Leer la lista. Si está todo bien, escribir `SI`. |
| "todavía no está alineado" | Seguir el plan del Paso 5 al 8. |
| "git no confía en esta carpeta" | Correr el comando que muestra el mensaje (`git config --global --add safe.directory …`) y repetir. |
| "Existe index.lock" | Alguien está usando git. Esperar un minuto y repetir. |
| "No pude conectarme con GitHub" / credenciales | Revisar el Paso 3. Si dice *Host key verification failed*: `ssh -T git@github-nexovet`. |
| "cambios de código que el servidor no tiene" | No se tocó nada. Pasarle la salida a Claude. |

`estado`, `foto`, `alinear` y `guardar` no modifican ni borran archivos del sistema: aunque
algo falle a la mitad o aprieten Ctrl+C, la tienda sigue igual. Antes de mover una rama, el
script guarda la posición anterior de git en `refs/vps-respaldo/FECHA`.

---

## 7. Glosario rápido

- **Copia de trabajo:** los archivos de verdad, los que usa el sistema.
- **Índice:** la lista de lo que va a entrar en el próximo commit. Para armar la foto, el
  script usa un índice temporal propio. Después de `guardar` y `alinear`, rehace el índice
  del servidor para que coincida con el último commit (los archivos no se tocan).
- **HEAD:** el último commit sobre el que está parado el servidor.
- **Remoto (`origin`):** el repositorio de GitHub.
- **Pull request (PR):** un pedido para sumar una rama a `main`, que alguien revisa y aprueba.
- **Merge:** sumar los cambios de una rama a otra.
- **Deploy:** llevar código nuevo al servidor en vivo.
