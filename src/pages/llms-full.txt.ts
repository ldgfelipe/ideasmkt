import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SERVICES, COMPANY_INFO } from '../lib/constants';

/**
 * /llms-full.txt — contenido completo (servicios + artículos) en texto plano,
 * pensado para que los asistentes de IA citen información exacta del sitio.
 */
export const GET: APIRoute = async ({ site }) => {
  const base = (site ?? new URL('https://ideasmkt.web.app')).href.replace(/\/$/, '');
  const posts = await getCollection('blog');
  const dateFormatter = new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const parts: string[] = [];

  parts.push(
    `# ${COMPANY_INFO.name} — información completa`,
    '',
    `> ${COMPANY_INFO.description}`,
    '',
    `Contacto: WhatsApp ${COMPANY_INFO.phone} (https://wa.me/${COMPANY_INFO.whatsapp}) · Correo ${COMPANY_INFO.email} · Web ${base}/`,
    '',
    '## Servicios',
    ''
  );

  for (const s of SERVICES) {
    parts.push(`### ${s.title}`, `_${s.subtitle}_`, '', s.description, '', `Incluye: ${s.features.join(', ')}.`, `Más información: ${base}/services/#${s.id}`, '');
  }

  parts.push('## Artículos del blog', '');

  for (const post of posts) {
    parts.push(
      `### ${post.data.title}`,
      '',
      `Autor: ${post.data.author} · Publicado: ${dateFormatter.format(post.data.pubDate)} · etiquetas: ${post.data.tags.join(', ')}.`,
      '',
      post.data.description,
      '',
      (post.body ?? '').trim(),
      '',
      `Fuente: ${base}/blog/${post.id}/`,
      ''
    );
  }

  return new Response(parts.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
};
