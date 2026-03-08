# La-Ganga

Multi-Stream Dashboard para Kick.

## Configuración de despliegue (GitHub Actions)

El `client_secret` de Kick **nunca se guarda en el código fuente**.  
En su lugar se inyecta en el momento del despliegue mediante un secreto de GitHub Actions.

### Pasos para configurar

1. Ve a **Settings → Secrets and variables → Actions** en este repositorio.
2. Crea un nuevo secreto llamado exactamente `KICK_CLIENT_SECRET` y pega el valor de tu
   client secret de Kick.
3. En **Settings → Pages**, elige como fuente **GitHub Actions** en lugar de una rama.
4. Cada vez que se haga `push` a `main`, el workflow `.github/workflows/deploy.yml`
   reemplazará el marcador `__KICK_CLIENT_SECRET__` por el secreto real y publicará el
   sitio en GitHub Pages.

> **Importante:** el secreto nunca queda visible en el código fuente ni en el historial de git.
> El archivo HTML que se publica (artefacto de Actions) contiene el valor real, pero ese
> artefacto no se sube al repositorio.

## OAuth2 con Kick (PKCE)

El flujo de autenticación usa **Authorization Code + PKCE** (sin backend requerido).  
El `client_secret` se incluye en el intercambio de código solo si fue inyectado por el
workflow; de lo contrario se omite automáticamente.

**Redirect URI que debes registrar en el portal de Kick:**
```
https://<tu-usuario>.github.io/<nombre-del-repo>/
```
