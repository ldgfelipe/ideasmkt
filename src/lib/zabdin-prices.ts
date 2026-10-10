// Lista de precios oficial 2026 — Zabdín Studio
// Fuente: lista de precios proporcionada por el cliente.

export type CategoryId =
  | 'cabello'
  | 'unas'
  | 'manos-pies'
  | 'facial-corporal'
  | 'promociones';

export interface Category {
  id: CategoryId;
  label: string;
  /** Emoji/ícono decorativo de la categoría */
  emoji: string;
}

export interface PriceOption {
  /** Tamaño, zona o variante (ej. "Corto", "1-2", "Axila") */
  label: string;
  /** Precio ya formateado (ej. "$1,500") */
  price: string;
}

export interface Service {
  id: string;
  name: string;
  category: CategoryId;
  /** Palabras clave para el buscador (sinónimos, categorías) */
  keywords: string[];
  /** Descripción corta opcional */
  description?: string;
  /** Nota adicional (ej. retoques, rangos) */
  note?: string;
  /** Precio único cuando no hay variantes */
  price?: string;
  /** Variantes de precio (tamaños, zonas, etc.) */
  options?: PriceOption[];
}

export const CATEGORIES: Category[] = [
  { id: 'cabello', label: 'Cabello', emoji: '💇‍♀️' },
  { id: 'unas', label: 'Uñas', emoji: '💅' },
  { id: 'manos-pies', label: 'Manos y Pies', emoji: '🦶' },
  { id: 'facial-corporal', label: 'Facial y Corporal', emoji: '✨' },
  { id: 'promociones', label: 'Promociones por Día', emoji: '🎉' }
];

export const SERVICES: Service[] = [
  // ───────────────────────── CABELLO ─────────────────────────
  {
    id: 'alisado-aleman',
    name: 'Alisado Alemán con Keratina',
    category: 'cabello',
    keywords: ['alisado', 'aleman', 'keratina', 'alisar', 'liso'],
    note: 'Retoque: $750 (Corto) / $950 (Mediano)',
    options: [
      { label: 'Corto', price: '$980' },
      { label: 'Mediano', price: '$1,500' },
      { label: 'Largo', price: '$1,700' },
      { label: 'Extralargo', price: '$2,000' }
    ]
  },
  {
    id: 'thermal-hair-therapy',
    name: 'Thermal Hair Therapy',
    category: 'cabello',
    keywords: ['thermal', 'terapia', 'tratamiento', 'keratina'],
    options: [
      { label: 'Corto', price: '$500' },
      { label: 'Mediano', price: '$600' },
      { label: 'Largo', price: '$700' },
      { label: 'Extralargo', price: '$800' }
    ]
  },
  {
    id: 'corte',
    name: 'Corte',
    category: 'cabello',
    keywords: ['corte', 'cortar', 'cabello'],
    options: [
      { label: 'Corto', price: '$180' },
      { label: 'Mediano', price: '$220' },
      { label: 'Largo', price: '$260' },
      { label: 'Extralargo', price: '$290' }
    ]
  },
  {
    id: 'corte-nina',
    name: 'Corte Niña',
    category: 'cabello',
    keywords: ['corte', 'nina', 'niña', 'kids', 'infantil'],
    options: [
      { label: 'Corto', price: '$100' },
      { label: 'Mediano', price: '$150' },
      { label: 'Largo', price: '$180' },
      { label: 'Extralargo', price: '$200' }
    ]
  },
  {
    id: 'efecto-color',
    name: 'Efecto Color',
    category: 'cabello',
    keywords: ['efecto', 'color', 'tinte', 'cabello'],
    options: [
      { label: 'Corto', price: '$1,300' },
      { label: 'Mediano', price: '$1,600' },
      { label: 'Largo', price: '$1,800' },
      { label: 'Extralargo', price: '$2,200' }
    ]
  },
  {
    id: 'moldeado-secadora',
    name: 'Moldeado con Secadora',
    category: 'cabello',
    keywords: ['moldeado', 'secadora', 'cambio de look'],
    options: [
      { label: 'Corto', price: '$150' },
      { label: 'Mediano', price: '$200' },
      { label: 'Largo', price: '$230' },
      { label: 'Extralargo', price: '$270' }
    ]
  },
  {
    id: 'ondulado',
    name: 'Ondulado',
    category: 'cabello',
    keywords: ['ondulado', 'ondas', 'rizado'],
    options: [
      { label: 'Corto', price: '$120' },
      { label: 'Mediano', price: '$180' },
      { label: 'Largo', price: '$200' },
      { label: 'Extralargo', price: '$250' }
    ]
  },
  {
    id: 'planchado',
    name: 'Planchado',
    category: 'cabello',
    keywords: ['planchado', 'plancha', 'liso'],
    options: [
      { label: 'Corto', price: '$100' },
      { label: 'Mediano', price: '$150' },
      { label: 'Largo', price: '$180' },
      { label: 'Extralargo', price: '$200' }
    ]
  },
  {
    id: 'retoque-tinte',
    name: 'Retoque de Tinte',
    category: 'cabello',
    keywords: ['retoque', 'tinte', 'raiz', 'raíz', 'color'],
    options: [
      { label: 'Corto', price: '$480' },
      { label: 'Mediano', price: '$500' }
    ]
  },
  {
    id: 'tinte',
    name: 'Tinte',
    category: 'cabello',
    keywords: ['tinte', 'color', 'coloracion', 'coloración'],
    options: [
      { label: 'Corto', price: '$570' },
      { label: 'Mediano', price: '$690' },
      { label: 'Largo', price: '$810' },
      { label: 'Extralargo', price: '$890' }
    ]
  },
  {
    id: 'bano-de-color',
    name: 'Baño de Color',
    category: 'cabello',
    keywords: ['bano', 'baño', 'color', 'tono'],
    options: [
      { label: 'Corto', price: '$400' },
      { label: 'Mediano', price: '$450' },
      { label: 'Largo', price: '$530' },
      { label: 'Extralargo', price: '$550' }
    ]
  },
  {
    id: 'peinado-maquillaje',
    name: 'Peinado y Maquillaje Casual',
    category: 'cabello',
    keywords: ['peinado', 'maquillaje', 'casual', 'evento'],
    price: '$890'
  },

  // ────────────────────────── UÑAS ──────────────────────────
  {
    id: 'rubber-color',
    name: 'Rubber Color',
    category: 'unas',
    keywords: ['rubber', 'color', 'unas', 'uñas', 'gel'],
    options: [
      { label: 'Bajo', price: '$180' },
      { label: 'Medio', price: '$220' },
      { label: 'Largo', price: '$250' }
    ]
  },
  {
    id: 'unas-acrilicas',
    name: 'Uñas Acrílicas',
    category: 'unas',
    keywords: ['acrilicas', 'acrílicas', 'acrilico', 'diseño', 'unas', 'uñas'],
    options: [
      { label: '1 - 2', price: '$360' },
      { label: '3 - 4', price: '$470' },
      { label: '5 - 6', price: '$490' }
    ]
  },
  {
    id: 'unas-soft-gel',
    name: 'Uñas Soft Gel',
    category: 'unas',
    keywords: ['soft gel', 'softgel', 'gel', 'unas', 'uñas'],
    options: [
      { label: '1 - 2', price: '$370' },
      { label: '3 - 4', price: '$360' },
      { label: '5 - 6', price: '$420' }
    ]
  },
  {
    id: 'retoques-retiros',
    name: 'Retoques y Retiros',
    category: 'unas',
    keywords: ['retoque', 'retiro', 'retiros', 'bano', 'baño', 'acrilico', 'gel'],
    note: 'Precios según el servicio previo',
    options: [
      { label: 'Baño de acrílico', price: 'Desde $200' },
      { label: 'Retiro de acrílico', price: '$90 - $150' },
      { label: 'Retiro de gel', price: '$30 - $70' }
    ]
  },

  // ────────────────────── MANOS Y PIES ──────────────────────
  {
    id: 'gel-kids',
    name: 'Gel Kids',
    category: 'manos-pies',
    keywords: ['gel', 'kids', 'nina', 'niña', 'manos', 'infantil'],
    price: '$100'
  },
  {
    id: 'manicura-expres',
    name: 'Manicura Expres',
    category: 'manos-pies',
    keywords: ['manicura', 'expres', 'manos', 'unas', 'uñas'],
    price: '$200'
  },
  {
    id: 'manicura-spa',
    name: 'Manicura Spa',
    category: 'manos-pies',
    keywords: ['manicura', 'spa', 'manos', 'unas', 'uñas'],
    price: '$230'
  },
  {
    id: 'manicura-spa-ultrasonik',
    name: 'Manicura Spa Ultrasonik',
    category: 'manos-pies',
    keywords: ['manicura', 'spa', 'ultrasonik', 'ultrasonido', 'manos'],
    price: '$300'
  },
  {
    id: 'esmalte-pies',
    name: 'Esmalte en Pies',
    category: 'manos-pies',
    keywords: ['esmalte', 'pies', 'pintauñas'],
    price: '$70'
  },
  {
    id: 'gel-pies',
    name: 'Gel Pies',
    category: 'manos-pies',
    keywords: ['gel', 'pies', 'semipermanente'],
    price: '$120'
  },
  {
    id: 'pedicura-basico',
    name: 'Pedicura Básico',
    category: 'manos-pies',
    keywords: ['pedicura', 'basico', 'básico', 'pies'],
    price: '$310'
  },
  {
    id: 'pedicura-terapeutico',
    name: 'Pedicura Terapéutico',
    category: 'manos-pies',
    keywords: ['pedicura', 'terapeutico', 'terapéutico', 'pies', 'spa'],
    price: '$350'
  },

  // ───────────────────── FACIAL Y CORPORAL ─────────────────────
  {
    id: 'laminado-ceja',
    name: 'Laminado de Ceja',
    category: 'facial-corporal',
    keywords: ['laminado', 'ceja', 'cejas', 'facial'],
    price: '$160'
  },
  {
    id: 'lifting',
    name: 'Lifting',
    category: 'facial-corporal',
    keywords: ['lifting', 'lifting de pestanas', 'pestanas', 'pestañas'],
    price: '$340'
  },
  {
    id: 'pigmento-ceja-pestana',
    name: 'Pigmento de Ceja / Pestaña',
    category: 'facial-corporal',
    keywords: ['pigmento', 'ceja', 'pestana', 'pestaña', 'tinte'],
    price: '$50'
  },
  {
    id: 'depilacion',
    name: 'Depilación con Cera',
    category: 'facial-corporal',
    keywords: ['depilacion', 'depilación', 'cera', 'ceja', 'bigote', 'axila', 'facial'],
    options: [
      { label: 'Ceja con cera', price: '$50' },
      { label: 'Bigote', price: '$80' },
      { label: 'Axila', price: '$210' },
      { label: 'Facial', price: '$220' }
    ]
  },
  {
    id: 'extension-pestanas',
    name: 'Extensión de Pestañas',
    category: 'facial-corporal',
    keywords: ['extension', 'extensión', 'pestanas', 'pestañas', 'clasicas', 'hibridas', 'volumen'],
    options: [
      { label: 'Clásicas / Efecto Natural', price: '$550' },
      { label: 'Híbridas', price: '$590' },
      { label: 'Volumen Fibras Tecnológicas', price: '$680' }
    ]
  },

  // ─────────────────── PROMOCIONES POR DÍA ───────────────────
  {
    id: 'promo-lunes',
    name: 'Lunes',
    category: 'promociones',
    keywords: ['lunes', 'ruleta', 'suerte', 'promocion', 'promoción'],
    description: 'Ruleta de la suerte',
    note: '¡Participa y gana premios en tu visita!'
  },
  {
    id: 'promo-martes',
    name: 'Martes',
    category: 'promociones',
    keywords: ['martes', 'pedicura', 'gel', 'promocion', 'promoción'],
    description: 'Pedicura + Gel',
    options: [
      { label: 'Pedicura Terapéutico + Gel', price: '$430' },
      { label: 'Pedicura Básico + Gel', price: '$399' }
    ]
  },
  {
    id: 'promo-miercoles',
    name: 'Miércoles',
    category: 'promociones',
    keywords: ['miercoles', 'miércoles', 'lifting', 'laminado', 'ceja', 'promocion'],
    description: 'Lifting + Laminado de Ceja',
    price: '$399'
  },
  {
    id: 'promo-jueves',
    name: 'Jueves',
    category: 'promociones',
    keywords: ['jueves', 'manicura', 'gel', 'promocion', 'promoción'],
    description: 'Manicura + Gel',
    price: '$300'
  },
  {
    id: 'promo-viernes',
    name: 'Viernes',
    category: 'promociones',
    keywords: ['viernes', 'tratamiento', 'aleman', 'alemán', 'descuento', 'promocion'],
    description: 'Tratamiento Alemán',
    note: '15% de descuento'
  }
];

export function getCategoryLabel(id: CategoryId): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}
