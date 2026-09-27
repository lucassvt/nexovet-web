# Guía de git para Nexovet

Para Lucas y Lourdes. Cómo tener en GitHub la versión oficial del código que corre en
el servidor, sin romper nada mientras las sucursales venden.

---

## 1. Git en 5 minutos

| Palabra | Qué es, en criollo |
|---|---|
| **Repositorio** | Una carpeta con memoria. Además de los archivos, guarda todo su historial (en la subcarpeta oculta `.git`). |
| **Commit** | Una **foto** de todos los archivos en un momento, con fecha, autor y una frase ("arreglo precio en carrito"). Una vez sacada, no se pierde. |
| **Rama** | Una línea de fotos. `main` es la rama **oficial**. Se pueden crear otras para probar sin tocar la oficial. |
| **GitHub** | Una copia en la nube del repositorio. **No es el servidor**: el servidor no se actualiza solo desde GitHub, ni GitHub desde el servidor. Hay que mover las fotos a mano. |
| **push** | Subir fotos del servidor a GitHub. |
| **fetch** | Bajar *información* de GitHub. No toca ningún archivo del sistema. |
| **pull / merge / checkout** | Aplicar cambios a los archivos. **Esto sí cambia lo que corre en vivo.** |

### Qué comandos son seguros en el servidor

Esto es lo más importante de la guía. En este servidor el sistema corre en **modo
desarrollo**: si cambia un archivo dentro de `backend/`, Medusa se reinicia solo y
la tienda puede no responder entre 10 y 60 segundos.

| Seguro (no toca archivos en vivo) | Cuidado (cambia archivos en vivo) | Peligroso (puede borrar trabajo) |
|---|---|---|
| `git status`, `git log`, `git diff`, `git fetch`, `git add`, `git commit`, `git push` | `git pull`, `git merge`, `git checkout` / `git switch`, `git restore`, `git stash pop`, `git rebase` | `git reset --hard`, `git clean`, `git checkout -- archivo`, `git stash drop`, `git push --force` |

**Regla:** en el servidor, nunca usen los comandos de la columna "peligroso". Los de
"cuidado" solo en horario tranquilo y sabiendo qué van a traer. Los scripts de abajo
hacen todo esto por ustedes, con los controles necesarios.

---

## 2. Dónde estamos

- **Servidor:** la tienda vive en `/var/www/nexovet-shop` (backend Medusa + tienda Next.js).
  Se trabaja directo ahí, en vivo.
- **GitHub:** el repositorio `lucassvt/nexovet-web` tiene el código del **19 de abril de 2026**.
  Todo lo que se hizo después existe solamente en el servidor.
- **Riesgo actual:** si el disco del servidor falla o alguien borra algo por error, esos
  cinco meses de trabajo no tienen copia en ningún otro lado.
- **Objetivo:** que `main` en GitHub sea igual a lo que corre hoy (la "versión oficial"),
  y que de ahí en más cada cambio quede guardado.

---

## 3. Los dos scripts

Están en `scripts/vps/` de este repositorio. Se copian al servidor **fuera** de la carpeta
del proyecto (así no se mezclan con el código).

- **`diagnostico.sh`**: recorre el servidor y arma un informe (qué proyectos hay, cuáles
  están en git, qué tan desactualizados están, qué procesos corren y qué dominio apunta
  a qué carpeta). **Solo lectura.** No muestra contraseñas.
- **`git-vps.sh`**: el que guarda en GitHub. Tiene 5 modos:

| Modo | Para qué | ¿Toca archivos del sistema? |
|---|---|---|
| `estado` | Ver cómo está el proyecto respecto de GitHub | No. Solo lee. |
| `foto` | Subir **todo** lo que hay hoy a una rama nueva (`vps/foto-FECHA`) | **No.** Solo escribe dentro de `.git`. |
| `alinear` | Una sola vez: conectar el servidor con la versión oficial | No, salvo que GitHub tenga algo nuevo: en ese caso lo muestra y pregunta. |
| `guardar` | Día a día: guardar los cambios y subirlos | **No.** Solo escribe dentro de `.git`. |
| `actualizar` | Traer al servidor cambios que están en GitHub | **Sí.** Es un "deploy": pide confirmación. |

Controles que hacen `foto` y `guardar` antes de subir cualquier cosa:

- **Frenan si el repositorio de GitHub es público.**
- **Dejan afuera** los `.env`, las claves, `node_modules`, `.next`, `.medusa`, las imágenes
  subidas por el admin (`backend/static`), los volcados de base de datos, los comprimidos,
  los logs, las exportaciones `.csv`/`.xlsx` y las copias de respaldo hechas a mano. Al
  final muestran la lista de lo que quedó afuera. Todo eso **sigue en el servidor**: solo
  no se sube.
- **Buscan contraseñas y tokens** en lo que se va a subir (Mercado Pago, GitHub, claves
  privadas, direcciones con usuario y contraseña, etc.). Si encuentran algo grave, no suben
  nada y explican qué hacer.
- **Frenan con archivos de más de 95 MB**, porque GitHub no los acepta.
- **Tienen un candado**: si Lucas y Lourdes corren el script a la vez, el segundo espera.
- **Tienen `--simular`**: hace todo el análisis sin crear ni subir nada.

---

## 4. Plan para crear la versión oficial (una sola vez)

### Paso 1: Copiar los scripts al servidor

Conectados por SSH al servidor, como el mismo usuario con el que trabajan siempre:

```bash
mkdir -p ~/nexovet-git && cd ~/nexovet-git
RAMA=claude/git-workflow-official-version-7shxms
curl -fsSLO https://raw.githubusercontent.com/lucassvt/nexovet-web/$RAMA/scripts/vps/git-vps.sh
curl -fsSLO https://raw.githubusercontent.com/lucassvt/nexovet-web/$RAMA/scripts/vps/diagnostico.sh
ls -l
```

Si el repositorio ya es privado, `curl` va a fallar. En ese caso bájenlos usando el git del
proyecto. `fetch` y `show` no tocan archivos del sistema:

```bash
cd /var/www/nexovet-shop
git fetch origin claude/git-workflow-official-version-7shxms
git show FETCH_HEAD:scripts/vps/git-vps.sh     > ~/nexovet-git/git-vps.sh
git show FETCH_HEAD:scripts/vps/diagnostico.sh > ~/nexovet-git/diagnostico.sh
```

### Paso 2: Hacer privado el repositorio

GitHub → repositorio `nexovet-web` → **Settings** → **General** → abajo de todo,
en *Danger Zone* → **Change repository visibility** → **Private**.

Esto no afecta al servidor. Hoy el repositorio es público: cualquiera puede leer el código
y la configuración.

### Paso 3: Diagnóstico (solo lectura)

```bash
sudo bash ~/nexovet-git/diagnostico.sh
```

Tarda uno o dos minutos. Deja el informe en `/tmp/diagnostico-git-….txt`. **Léanlo**
(no debería tener contraseñas: solo nombres de archivos) y péguenlo en la conversación con
Claude. Con eso se ve si hay otros sistemas en el servidor que también convenga guardar
(por ejemplo, el Centro de Comando).

### Paso 4: Foto de prueba (sin subir nada)

```bash
bash ~/nexovet-git/git-vps.sh foto --simular
```

Muestra cuántos archivos son nuevos, cuántos cambiaron y cuántos se borraron, qué queda
afuera y si hay alertas de seguridad. Si hay alertas, péguenle la salida a Claude antes de
seguir.

### Paso 5: Foto real

```bash
bash ~/nexovet-git/git-vps.sh foto
```

Pide escribir `SI`. Crea la rama `vps/foto-FECHA` en GitHub con el estado exacto del servidor.
**No cambia nada en el servidor ni en `main`.**

### Paso 6: Revisión y aprobación (lo hace Claude)

Pásenle a Claude el nombre de la rama. Claude revisa la foto, abre un *pull request*
contra `main` y ustedes lo aprueban en GitHub con el botón *Merge*. Desde ese momento
**`main` es la versión oficial**.

### Paso 7: Alinear el servidor (una sola vez)

```bash
bash ~/nexovet-git/git-vps.sh alinear
```

Conecta la copia del servidor con `main` sin modificar archivos. Si en GitHub hubiera algo
posterior a la foto (por ejemplo, esta guía), lo lista y pide escribir `ACTUALIZAR` antes
de traerlo. Esta guía y los scripts no están dentro de `backend/`, así que traerlos no
reinicia nada.

---

## 5. El día a día

### Guardar lo que hicieron en el servidor

Cada vez que terminan un cambio **y funciona**:

```bash
bash ~/nexovet-git/git-vps.sh guardar --autor "Lourdes <su-mail>" --mensaje "Banner de envíos gratis"
```

Si no ponen `--mensaje`, el script lo pregunta. Pongan una frase que diga **qué** cambió.
Dentro de tres meses van a buscar esa frase.

Como los dos trabajan en la misma carpeta, un `guardar` incluye los cambios de los dos.
Está bien, pero conviene avisarse ("guardo yo").

### Cambios hechos desde Claude Code en la web

Los cambios que Claude prepara en la web quedan en GitHub, no en el servidor. Para llevarlos
al servidor:

1. Primero **guardar** lo del servidor (`guardar`).
2. Aprobar en GitHub el pull request de Claude.
3. En un horario tranquilo: `bash ~/nexovet-git/git-vps.sh actualizar`.

`actualizar` lista los archivos que va a cambiar y pide escribir `ACTUALIZAR`. Si un archivo
cambió en los dos lados, **no pisa nada** y avisa. Si cambiaron dependencias
(`package.json`), avisa que después hay que correr `npm install` y reiniciar con pm2.

### Si GitHub tiene cambios que el servidor no tiene

`guardar` no mezcla a ciegas. Sube los cambios del servidor a una rama aparte
(`vps/guardado-FECHA`) y da un link. Pásenle ese link a Claude para que combine las dos
versiones, y después corran `actualizar`.

---

## 6. Cuando el script frena

| Mensaje | Qué hacer |
|---|---|
| "El repositorio es PÚBLICO" | Hacerlo privado (Paso 2) y repetir. |
| "ALERTAS DE SEGURIDAD … GRAVE" | Si el archivo no tiene que ir a GitHub: repetir con `--excluir 'ruta/archivo'`. Si la contraseña está escrita dentro del código, hay que moverla al `.env` (pídanselo a Claude). Si es una falsa alarma: `--ignorar-alertas`. |
| "Cosas para revisar" | Leer la lista. Si está todo bien, escribir `SI`. |
| "git no confía en esta carpeta (dubious ownership)" | Correr el script como el dueño de la carpeta, con el comando que muestra el mensaje. |
| "Existe index.lock" | Alguien está usando git. Esperar un minuto y repetir. |
| "GitHub no aceptó las credenciales" | Ver la sección 7. |
| "Estos archivos cambiaron en el servidor Y en GitHub" | No se tocó nada. Primero `guardar` y pedirle a Claude que combine. |

Nada de lo que hacen `estado`, `foto`, `guardar` ni `alinear` cambia archivos del
sistema, así que aunque algo falle a la mitad, la tienda sigue igual. Antes de mover algo,
el script guarda la posición anterior de git en `refs/vps-respaldo/FECHA`.

---

## 7. Credenciales de GitHub en el servidor

Para subir (`push`) el servidor necesita permiso sobre el repositorio. La opción más acotada
es una **deploy key**: da acceso a este repositorio y a ningún otro.

```bash
ssh-keygen -t ed25519 -f ~/.ssh/nexovet_deploy -N "" -C "vps nexovet-web"
cat ~/.ssh/nexovet_deploy.pub
```

1. En GitHub: repositorio → **Settings** → **Deploy keys** → **Add deploy key**. Pegar el
   contenido del `.pub`, tildar **Allow write access** y guardar.
2. En el servidor:

```bash
cat >> ~/.ssh/config <<'EOF'
Host github-nexovet
  HostName github.com
  User git
  IdentityFile ~/.ssh/nexovet_deploy
  IdentitiesOnly yes
EOF
git -C /var/www/nexovet-shop remote set-url origin git@github-nexovet:lucassvt/nexovet-web.git
bash ~/nexovet-git/git-vps.sh estado
```

(Cambiar la URL del remoto solo modifica la configuración de git, no los archivos del
sistema.)

---

## 8. Glosario rápido

- **Working tree / copia de trabajo:** los archivos de verdad, los que usa el sistema.
- **Índice (staging):** la lista de lo que va a entrar en el próximo commit. Los scripts
  usan un índice temporal propio para no tocar el del servidor.
- **HEAD:** el último commit sobre el que está parado el servidor.
- **Remoto (`origin`):** el repositorio de GitHub.
- **Pull request (PR):** un pedido para sumar una rama a `main`, que alguien revisa y aprueba.
- **Merge:** sumar los cambios de una rama a otra.
