# Reglas para trabajar en el servidor de Nexovet

(Para Claude en VS Code y en cualquier sesión que toque el servidor. Versión 17/11/2026.)

La **versión oficial** de cada sistema es la que corre en el servidor (`ssh nexovet`).
GitHub guarda una copia revisada de cada uno. Las copias en las PCs **no** son oficiales.

## Nunca

- **Subir al servidor copias de la PC**: carpetas o proyectos enteros (scp, rsync, sftp), o un
  archivo que no bajaste recién del servidor. Esas copias pueden estar viejas y pisar lo que
  funciona. Solo con un deploy que Lucas pida explícitamente.
- **Usar git a mano en el servidor**: nada de `git add`, `git commit`, `git push`, `git pull`,
  `git merge`, `git checkout <rama>`, `git switch`, `git stash`, `git reset`, `git restore`,
  `git clean` ni `git rebase`. Para guardar se usa `guardar` (abajo), que revisa contraseñas
  antes de subir.
- Usar `--ignorar-alertas` o `--permitir-publico` sin que Lucas lo autorice en el chat, para ese
  proyecto puntual. **Excepción:** `--ignorar-alertas` está autorizado de forma permanente solo
  para los 7 proyectos marcados con `*` en la tabla de abajo, hasta la ronda de seguridad.
  `--permitir-publico` no está autorizado para ninguno.
- Tocar `.env`, claves o certificados sin pedido explícito.

## Cómo se trabaja

1. Los cambios se hacen **en el servidor**, en la carpeta del proyecto. Para editar un archivo:
   bajalo del servidor, editalo y volvé a subir **ese mismo archivo** enseguida (por SFTP o scp
   está bien), de a uno. Justo antes de subirlo, fijate que en el servidor no haya cambiado
   mientras tanto (misma fecha y tamaño, o mismo contenido). Si cambió, empezá de nuevo desde la
   versión nueva.
2. Hacer una copia de respaldo antes de editar está bien (`archivo.bak_motivo_fecha`): no se sube.
3. Cuando el cambio está terminado **y funciona**, guardalo en GitHub:

   ```bash
   ssh nexovet "cd ~/nexovet-git && bash git-vps.sh guardar CARPETA --si --mensaje 'qué cambió' --autor 'Nombre <mail>'"
   ```

   - Siempre con la **CARPETA** del proyecto (tabla de abajo). Sin carpeta, guarda la tienda.
   - Si frena por alertas (`✖`, `[GRAVE]` o "Cosas para revisar"), **no insistas** ni uses
     `--ignorar-alertas`: mostrale la salida a Lucas. En los 7 proyectos con `*` se guarda con
     `--ignorar-alertas`; si frenan por cualquier otro motivo, mostrale la salida igual.
   - Si dice "rama aparte" o "GitHub tiene cambios que el servidor no tiene", no hagas nada más:
     avisale a Lucas.
4. Ver cómo está un proyecto (solo lee): `ssh nexovet "cd ~/nexovet-git && bash git-vps.sh estado CARPETA"`.
5. Llevar código de GitHub al servidor es un **deploy**: no lo hagas solo, se hace acompañado.
6. `alinear` **no respeta `--simular`**: igual mueve la rama y escribe la documentación. Para ver
   el plan sin cambiar nada, corrélo sin `--si`.

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
| Logística * | `/var/www/logistica-system` |
| Express (backend) * | `/var/www/express/backend` |
| Finanzas * | `/var/www/sistema-finanzas` |
| CRM * | `/var/www/crm-cerebro` |
| Centro de Comando * | `/var/www/centro-comando` |
| Portal Vendedores * | `/var/www/portal-vendedores` |
| Mi Sucursal * | `/var/www/mi-sucursal` |

`*` Subieron el 16/11/2026 tal como estaban y todavía tienen contraseñas escritas en el código.
Cuando se haga la ronda de seguridad, hay que sacar estas marcas y la excepción de
`--ignorar-alertas`.

Guía completa: `docs/GIT-GUIA.md` en el repositorio `lucassvt/nexovet-web`.
