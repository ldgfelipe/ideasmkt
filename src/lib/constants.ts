import { LinkedinIcon, TwitterIcon, GithubIcon } from '../assets/icons/index.tsx';

export const COMPANY_INFO = {
  name: 'IdeasMKT',
  description:
    'Agencia de marketing digital especializada en transformar negocios a través de estrategias basadas en datos y tecnología.',
  email: 'ldgframe@gmail.com',
  // Número de contacto/WhatsApp en formato internacional sin «+» (para wa.me).
  whatsapp: '522227328662',
  phone: '+52 222 732 8662'
};

export const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/services', label: 'Servicios' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contacto' }
];

export const FOOTER_LINKS = [
  {
    title: 'Servicios',
    links: [
      { href: '/services#seo', label: 'SEO' },
      { href: '/services#ppc', label: 'Publicidad Pagada' },
      { href: '/services#social', label: 'Redes Sociales' },
      { href: '/services#content', label: 'Contenido' },
      { href: '/services#email', label: 'Email Marketing' },
      { href: '/services#software', label: 'Sistemas a la medida' },
      { href: '/services#web', label: 'Páginas Web' }
    ]
  },
  {
    title: 'Empresa',
    links: [
      { href: '/about', label: 'Acerca de' },
      { href: '/contact', label: 'Contacto' },
      { href: '/careers', label: 'Carreras' }
    ]
  },
  {
    title: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacidad' },
      { href: '/terms', label: 'Términos' }
    ]
  }
];

export const SOCIAL_LINKS = [
  {
    name: 'LinkedIn',
    href: 'https://linkedin.com',
    icon: LinkedinIcon
  },
  {
    name: 'Twitter',
    href: 'https://twitter.com',
    icon: TwitterIcon
  },
  {
    name: 'GitHub',
    href: 'https://github.com',
    icon: GithubIcon
  }
];

export const SERVICES = [
  {
    id: 'seo',
    title: 'SEO',
    subtitle: 'Optimización para Motores de Búsqueda',
    description:
      'Posiciona tu sitio web en los primeros resultados de Google con estrategias técnicas y de contenido.',
    icon: '🔍',
    features: ['Auditoría SEO', 'Palabras clave', 'Link building', 'Velocidad']
  },
  {
    id: 'ppc',
    title: 'Publicidad Pagada',
    subtitle: 'Google Ads & Meta Ads',
    description:
      'Genera leads de calidad con campañas de publicidad pagada en Google y Meta.',
    icon: '📈',
    features: ['Google Ads', 'Meta Ads', 'Remarketing', 'A/B Testing']
  },
  {
    id: 'social',
    title: 'Redes Sociales',
    subtitle: 'Gestión Integral',
    description:
      'Crea comunidad y engagement con contenido auténtico en todas las redes sociales.',
    icon: '📱',
    features: ['Content calendar', 'Community mgmt', 'Analytics', 'Paid ads']
  },
  {
    id: 'content',
    title: 'Contenido',
    subtitle: 'Estrategia y Producción',
    description:
      'Desarrollamos contenido que conecta con tu audiencia y genera conversión.',
    icon: '✍️',
    features: ['Copywriting', 'Video', 'Infografías', 'E-books']
  },
  {
    id: 'email',
    title: 'Email Marketing',
    subtitle: 'Campañas que llegan a la bandeja correcta',
    description:
      'Diseñamos estrategias de email marketing con segmentación y automatizaciones para nutrir a tus contactos y convertir más.',
    icon: '✉️',
    features: ['Newsletters', 'Automatizaciones', 'Segmentación', 'A/B testing']
  },
  {
    id: 'software',
    title: 'Programación de sistemas a la medida',
    subtitle: 'Software hecho para tu operación',
    description:
      'Desarrollamos sistemas y aplicaciones a la medida: paneles de administración, integraciones, bases de datos y automatizaciones.',
    icon: '💻',
    features: ['Aplicaciones web', 'Paneles y reportes', 'Integraciones y APIs', 'Bases de datos']
  },
  {
    id: 'web',
    title: 'Realización de páginas web',
    subtitle: 'Diseño y desarrollo a medida',
    description:
      'Creamos páginas web y landing pages rápidas, responsivas y optimizadas para convertir visitantes en clientes.',
    icon: '🌐',
    features: ['Diseño responsivo', 'Landing pages', 'Optimización de velocidad', 'Dominio y hosting']
  }
];
