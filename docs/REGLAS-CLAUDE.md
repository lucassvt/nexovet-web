# Reglas para trabajar en el servidor de Nexovet

(Para Claude en VS Code y en cualquier sesión que toque el servidor. Versión 28/09/2026.)

La **versión oficial** de cada sistema es la que corre en el servidor (`ssh nexovet`).
GitHub guarda una copia revisada de cada uno. Las copias en las PCs **no** son oficiales.

## Nunca

- **Copiar archivos de una PC al servidor** (scp, rsync, sftp, pegar archivos enteros) salvo
  un deploy que Lucas pida explícitamente. Así se pisaban versiones nuevas con viejas.
- **Usar git a mano en el servidor**: nada de `git add`, `git commit`, `git push`, `git pull`,
  `git merge`, `git checkout <rama>`, `git switch`, `git stash`, `git reset`, `git restore`,
  `git clean` ni `git rebase`. Para guardar se usa `guardar` (abajo), que revisa contraseñas
  antes de subir.
- Usar `--ignorar-alertas` o `--permitir-publico` sin que Lucas lo autorice en el chat, para ese
  proyecto puntual.
- Tocar `.env`, claves o certificados sin pedido explícito.

## Cómo se trabaja

1. Los cambios se hacen **en el servidor**, en la carpeta del proyecto. Antes de editar un
   archivo, leé su versión actual **en el servidor** (no la de la PC).
2. Hacer una copia de respaldo antes de editar está bien (`archivo.bak_motivo_fecha`): no se sube.
3. Cuando el cambio está terminado **y funciona**, guardalo en GitHub:

   ```bash
   ssh nexovet "cd ~/nexovet-git && bash git-vps.sh guardar CARPETA --si --mensaje 'qué cambió' --autor 'Nombre <mail>'"
   ```

   - Siempre con la **CARPETA** del proyecto (tabla de abajo). Sin carpeta, guarda la tienda.
   - Si frena por alertas (`✖`, `[GRAVE]` o "Cosas para revisar"), **no insistas** ni uses
     `--ignorar-alertas`: mostrale la salida a Lucas.
   - Si dice "rama aparte" o "GitHub tiene cambios que el servidor no tiene", no hagas nada más:
     avisale a Lucas.
4. Ver cómo está un proyecto (solo lee): `ssh nexovet "cd ~/nexovet-git && bash git-vps.sh estado CARPETA"`.
5. Llevar código de GitHub al servidor es un **deploy**: no lo hagas solo, se hace acompañado.

## Proyectos listos (se guardan con `guardar`)

| Sistema | CARPETA |
|---|---|
| Tienda online | `/var/www/nexovet-shop` |
| Mi Legajo | `/var/www/milegajo` |
| Club Mascotera | `/var/www/club-mascotera` |
| Chatbot | `/opt/chatbotLamascotera` |
| Landigia | `/var/www/landigia` |
| Landing general | `/var/www/landing-general` |
| Landing La Mascotera | `/var/www/landing-lamascotera` |
| Landing (preview) | `/var/www/landing-lamascotera-preview` |
| Mi Franquicia | `/var/www/mi-franquicia` |
| RRHH | `/var/www/sistema-rrhh` |
| Compras (web) | `/var/www/sistema-compras` |
| Compras v2 | `/opt/sistema_compras` |
| Panel de logística | `/opt/logistica-panel` |
| Express (app) | `/var/www/express/app` |
| Agente de gerencia (Teo) | `/opt/agente-gerencia` |
| MCP Nexovet | `/opt/mcp-nexovet` |
| Evolution API | `/opt/evolution-api` |
| Odoo | `/opt/odoo` |

## Proyectos que todavía NO se guardan (esperan la ronda de seguridad)

`/var/www/centro-comando`, `/var/www/logistica-system`, `/var/www/portal-vendedores`,
`/var/www/sistema-finanzas`, `/var/www/crm-cerebro`, `/var/www/mi-sucursal` y
`/var/www/express/backend`. Tienen contraseñas escritas en el código. Se puede seguir
trabajando en ellos como siempre (con las mismas reglas de "Nunca"), pero `guardar` los va a
rechazar: no busques otra forma de subirlos.

Guía completa: `docs/GIT-GUIA.md` en el repositorio `lucassvt/nexovet-web`.
