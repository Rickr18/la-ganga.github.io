# La-Ganga

Multi-Stream Dashboard para Kick. Proyecto **100% estático (Frontend)** desplegado en GitHub Pages.

## Descripción

Dashboard de multistreaming para seguir a los streamers de La Ganga en Kick simultáneamente.
No requiere backend, servidor, ni autenticación. Todo funciona directamente en el navegador.

## Características

- **Multi-stream:** Ve hasta 6 streams de Kick al mismo tiempo.
- **Modo Cine:** Expande uno o varios streams a pantalla completa sin interrumpir el audio.
- **Chat en tiempo real:** Visualiza el chat oficial de Kick (solo lectura).
- **Estado en vivo:** Muestra si cada streamer está conectado, cuántos espectadores tiene y qué juega.
- **Silenciar todo:** Botón global para silenciar todos los streams con un clic.
- **Notificaciones Discord:** Configura un webhook para recibir alertas cuando un streamer se conecta.

## Despliegue

El sitio se publica automáticamente en GitHub Pages desde la rama `main`.
No se requiere ninguna configuración adicional ni secretos.

## Tecnologías

- HTML5
- CSS con variables nativas
- JavaScript (React 18 via CDN + Babel Standalone)
- API pública de Kick (sin autenticación)
