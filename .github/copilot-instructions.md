# Instrucciones para el Agente de Copilot - La Ganga Dashboard (Frontend Only)

## Contexto del Proyecto
Dashboard de multistreaming para la comunidad. Proyecto **100% estático (Frontend)** para GitHub Pages.

## REGLAS DE ORO (No negociables)
- **NADA DE BACKEND:** Prohibido crear archivos `server.js`, `package.json`, carpetas `backend`, o configurar `node_modules` para ejecución en servidor.
- **ESTRICTAMENTE CLIENT-SIDE:** Toda la lógica debe estar en `index.html` o archivos `.js` de frontend.
- **AUTENTICACIÓN:** NO implementar OAuth2, NO usar Client ID, NO solicitar Client Secret. El login es responsabilidad del usuario a través de `kick.com` en su propio navegador.
- **IFRAMES:** Usar solo iframes públicos (`https://player.kick.com/[user]`).

## Comportamiento del Modo Cine
- **Bug de Audio:** Al pasar a "Modo Cine", NO destruir ni recrear el nodo del DOM del iframe.
- **Solución:** Cambiar dinámicamente las clases de Tailwind de `absolute/relative` a `fixed inset-0 z-50` para redimensionar el iframe existente. Esto mantiene el estado del audio.

## Identificadores de "La Ganga" (Fijos)
No permitir la edición de estos nombres. Deben mostrarse siempre así:
- Westcol: "W Reals"
- Willito: "WAKAS"
- Lonche: "FES"
- Chanty: "JP"
- Samulx: "PTG"
- Leandro: "CDLS"

## UI/UX
- **Grid Layout:** Adaptable para 1 a 6 streams simultáneos.
- **Mute All:** Botón global en el Header que silencia todas las instancias.
- **Chat:** Solo mostrar el iframe oficial de Kick. El usuario no puede escribir.

## Tecnologías permitidas
- HTML5, CSS (Tailwind via CDN), JavaScript Vanilla.
