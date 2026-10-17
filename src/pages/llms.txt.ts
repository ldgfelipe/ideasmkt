import type { APIRoute } from 'astro';
import { getBlogPosts } from '../lib/blog';
import { SERVICES, COMPANY_INFO } from '../lib/constants';

/**
 * /llms.txt — resumen del sitio en Markdown para asistentes y buscadores con IA.
 * Estándar propuesto en https://llmstxt.org
 */
export const GET: APIRoute = async ({ site }) => {
  const base = (site ?? new URL('https://ideasmkt.web.app')).href.replace(/\/$/, '');
  const posts = await getBlogPosts();

  const lines = [
    `# ${COMPANY_INFO.name}`,
    '',
    `> ${COMPANY_INFO.description} Servicios: ${SERVICES.map((s) => s.title).join(', ')}. Idioma: español.`,
    '',
    '## Contacto',
    `- WhatsApp: ${COMPANY_INFO.phone} — https://wa.me/${COMPANY_INFO.whatsapp}`,
    `- Correo: ${COMPANY_INFO.email}`,
    '- Formulario: ' + `${base}/contact/`,
    '',
    '## Páginas principales',
    `- [Inicio](${base}/): agencia de marketing digital; presentación y formulario de contacto.`,
    `- [Servicios](${base}/services/): ${SERVICES.map((s) => s.title).join(', ')}.`,
    `- [Preguntas frecuentes](${base}/faq/): dudas sobre servicios, proceso, tiempos y costos.`,
    `- [Blog](${base}/blog/): artículos y guías de marketing digital.`,
    `- [Contacto](${base}/contact/): WhatsApp y formulario.`,
    '',
    '## Servicios',
    ...SERVICES.map((s) => `- ${s.title} — ${s.subtitle}: ${s.description}`),
    '',
    '## Artículos del blog',
    ...posts.map((p) => `- [${p.title}](${base}/blog/${p.slug}/): ${p.description}`),
    '',
    '## Optional',
    `- [Aviso de privacidad](${base}/privacy/)`,
    `- [Términos y condiciones](${base}/terms/)`,
    ''
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
};
