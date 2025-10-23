# IMPEL Panamá — ULTIMATE (White + IA + Serverless)
Listo para producción (Vercel).

## Incluye
- Tema **blanco** premium, minimalista y rápido.
- **Logo PNG transparente** (sin bordes blancos) y app icon.
- Hero con **foto de fachada** (assets/storefront.jpg).
- **Catálogo realista** con imágenes locales (`assets/*.jpg`) y `data/products.json` editable.
- **Asistente IA real**: `/api/chat` (OpenAI) + BYOK (opcional).
- **Formulario**: `/api/contact` (SMTP/Nodemailer) o fallback `mailto:`.
- **PWA** (manifest + service worker), SEO (Schema.org), sitemap, robots, 404.
- Código accesible y semántico.

## Deploy (Vercel)
Variables de entorno:
- `OPENAI_API_KEY` (obligatoria para IA).
- (Opcional email) `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_TO`.

## Editar WhatsApp
En `script.js` → `COMPANY.whatsapp` (solo dígitos con 507).

## Catálogo
Edite `data/products.json`. Para agregar fotos reales, súbalas a `assets/` y actualice el campo `img`.
