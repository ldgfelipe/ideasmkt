# Notas de desarrollo — Tarjeta Digital Zabdín Studio

Última sesión: 20/ago/2026

## Estado actual (`src/pages/td/zabdi-studio.astro`)

> Ruta pública: `/td/zabdi-studio`. La ruta antigua `/td/zabdin-studio` redirige 301 (ver `firebase.json`).

- Página reconstruida para parecerse a `public/zabdin/TARJETA_DIGITAL.jpg` (diseño de referencia del PDF).
- Estructura vertical en flujo hacia abajo, columna única `max-w-[1050px]` centrada.
- Fondo: `fondo-tarjeta.webp` (extraído limpio del PDF, sin botones/textos) con `bg-cover bg-center bg-no-repeat`.
- Barras gris cálido `#a2a19f` arriba y abajo (en el diseño eran vectoriales; hechas en CSS). Los iconos sociales van sobre la barra inferior.
- Logo: `logo-zabdin.webp` (optimizado desde `logo-zabdin-1.png`, 900x670, transparencia) — tamaño actual `w-[85%] max-w-[440px]`.
- Tagline: imagen `donde-comienza.webp` bajo el logo.
- 4 botones píldora (solo imágenes, sin fondo): quienes somos, catálogo, agenda tu cita, ubicación.
- Footer: Facebook + Instagram + WhatsApp (`whatsapp.svg` creado nuevo).

## Pendientes

- URLs reales en el objeto `links` al inicio del archivo:
  - quienesSomos, catalogo, agenda (WhatsApp falta número), facebook, instagram, whatsapp
  - ubicacion ya apunta a búsqueda de Google Maps (confirmar place real)
- Seguir comparando contra la imagen de referencia y ajustar detalles visuales.

## Hallazgos importantes (no repetir)

- `logo-zabdin.webp` original y `page-1-hi.png` eran la hoja informativa completa del PDF (1720x1282), NO un logo. El logo bueno es `logo-zabdin-1.png`.
- El fondo extraído del PDF no incluye las barras grises ni botones (eran vectoriales).
- CRÍTICO: esta página debe importar `../../styles/global.css` o Tailwind no aplica ningún estilo (ya corregido, fue causa de "no se ven los cambios").
- El dev server a veces queda atado solo a IPv6; reiniciar con `npx astro dev --background --host` para acceso por 127.0.0.1 y red local (192.168.137.80:4321).
- Assets limpios generados: `fondo-tarjeta.webp`, `logo-tarjeta.webp` (reemplazado), `whatsapp.svg`.

## Comandos útiles

- Dev: `npx astro dev --background --host` / parar: `npx astro dev stop`
- Build: `npx astro build`
