import { useMemo, useState } from 'react';
import {
  CATEGORIES,
  SERVICES,
  type CategoryId,
  type PriceOption,
  type Service
} from '../../lib/zabdin-prices';

type Filter = CategoryId | 'all';

/** Normaliza texto: quita acentos y pasa a minúsculas para búsquedas flexibles. */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/** Cadena buscable de un servicio (nombre + keywords + opciones + notas). */
function searchableText(service: Service): string {
  return normalize(
    [
      service.name,
      service.description ?? '',
      service.note ?? '',
      ...(service.keywords ?? []),
      ...(service.options?.map((option) => option.label) ?? [])
    ].join(' ')
  );
}

/** Primer número de un precio ("$1,500" → 1500). */
function firstNumber(value: string): number | null {
  const match = value.replace(/,/g, '').match(/\d+/);
  return match ? Number(match[0]) : null;
}

/** Precio más bajo de las opciones, formateado como aparece en la lista. */
function cheapestOption(options?: PriceOption[]): string | null {
  if (!options || options.length === 0) return null;
  let best: { value: number; raw: string } | null = null;
  for (const option of options) {
    const value = firstNumber(option.price);
    if (value === null) continue;
    if (!best || value < best.value) best = { value, raw: option.price };
  }
  return best ? best.raw : null;
}

/** Fila "lista de precios": nombre · · · · · · precio. */
function PriceRow({
  label,
  price,
  faint = false
}: {
  label: string;
  price: string;
  faint?: boolean;
}) {
  return (
    <div className={`flex items-end gap-2 ${faint ? 'pl-3' : ''}`}>
      <span
        className={`leading-tight ${
          faint
            ? 'text-[0.9rem] text-[#6f655b]'
            : 'text-[1rem] font-medium text-[#5f564d]'
        }`}
      >
        {label}
      </span>
      <span
        aria-hidden="true"
        className={`mb-[0.3rem] min-w-4 flex-1 border-b border-dotted ${
          faint ? 'border-[#e6d9c9]' : 'border-[#dcc9b6]'
        }`}
      />
      <span
        className={`shrink-0 leading-tight ${
          faint
            ? 'text-[0.9rem] font-semibold text-[#c95e91]'
            : 'text-[1rem] font-bold text-[#cf3080]'
        }`}
      >
        {price}
      </span>
    </div>
  );
}

function ServiceItem({ service }: { service: Service }) {
  const raw = service.price ?? cheapestOption(service.options);
  const from = raw
    ? /^desde\b/i.test(raw.trim())
      ? raw
      : `Desde ${raw}`
    : null;

  return (
    <li className="py-2.5">
      {from ? (
        <PriceRow label={service.name} price={from} />
      ) : (
        <p className="text-[1rem] font-medium leading-tight text-[#5f564d]">
          {service.name}
        </p>
      )}

      {service.description && (
        <p className="mt-0.5 text-[0.84rem] leading-snug text-[#9b8f83]">
          {service.description}
        </p>
      )}

      {service.note && (
        <p className="mt-0.5 text-[0.82rem] font-medium italic leading-snug text-[#b0803f]">
          {service.note}
        </p>
      )}

      {service.options && service.options.length > 0 && (
        <ul className="mt-1.5 space-y-1">
          {service.options.map((option) => (
            <li key={option.label}>
              <PriceRow label={option.label} price={option.price} faint />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export default function PriceCatalog() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const normalizedQuery = normalize(query.trim());

  const counts = useMemo(() => {
    const map = new Map<CategoryId, number>();
    for (const service of SERVICES) {
      map.set(service.category, (map.get(service.category) ?? 0) + 1);
    }
    return map;
  }, []);

  const filtered = useMemo(() => {
    return SERVICES.filter((service) => {
      if (filter !== 'all' && service.category !== filter) return false;
      if (!normalizedQuery) return true;
      return searchableText(service).includes(normalizedQuery);
    });
  }, [filter, normalizedQuery]);

  const groups = useMemo(() => {
    return CATEGORIES.map((category) => ({
      category,
      services: filtered.filter((service) => service.category === category.id)
    })).filter((group) => group.services.length > 0);
  }, [filtered]);

  const total = filtered.length;

  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-4 py-2 text-[0.94rem] font-semibold tracking-wide transition ${
      active
        ? 'border-[#cf3080] bg-[#cf3080] text-white shadow-sm'
        : 'border-[#e3d2bf] bg-white/70 text-[#6f655b] hover:border-[#cf3080]/50 hover:text-[#cf3080]'
    }`;

  return (
    <div className="w-full">
      {/* Buscador + filtros (fijos al hacer scroll) */}
      <div className="sticky top-0 z-20 -mx-4 mb-7 border-b border-[#e8dac9] bg-[#f6ece2]/95 px-4 py-3 backdrop-blur sm:mx-0 sm:px-0">
        <div className="relative mx-auto max-w-xl">
          <svg
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#c795b0]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
            />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar: acrílicas, lifting, alisado, pedicura…"
            aria-label="Buscar servicio por nombre"
            className="w-full rounded-full border border-[#e3d2bf] bg-white py-3 pl-12 pr-11 text-base text-[#5f564d] shadow-sm outline-none transition placeholder:text-[#b3a596] focus:border-[#cf3080] focus:ring-2 focus:ring-[#cf3080]/20"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-lg text-[#a3938a] transition hover:bg-[#f0dfe9] hover:text-[#cf3080]"
            >
              ×
            </button>
          )}
        </div>

        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0">
          <button
            type="button"
            onClick={() => setFilter('all')}
            aria-pressed={filter === 'all'}
            className={chip(filter === 'all')}
          >
            Todas
          </button>
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setFilter(category.id)}
              aria-pressed={filter === category.id}
              className={chip(filter === category.id)}
            >
              {category.label}
              <span
                className={`ml-1.5 text-xs ${
                  filter === category.id ? 'text-white/70' : 'text-[#b3a596]'
                }`}
              >
                {counts.get(category.id) ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Resultados */}
      <p
        className="mb-5 text-center text-[0.95rem] text-[#8c8075]"
        aria-live="polite"
      >
        {total === 0
          ? 'Sin resultados'
          : `${total} ${total === 1 ? 'servicio' : 'servicios'} ${
              filter === 'all' ? 'en total' : 'en esta categoría'
            }`}
      </p>

      {total === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#e0cfbc] bg-white/60 px-6 py-12 text-center">
          <p className="text-3xl" aria-hidden="true">
            🔍
          </p>
          <p className="mt-2 text-lg font-medium text-[#5f564d]">
            No encontramos servicios para “{query}”.
          </p>
          <p className="mt-1 text-base text-[#8c8075]">
            Prueba con otro término o revisa las categorías.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setFilter('all');
            }}
            className="mt-4 rounded-full bg-[#cf3080] px-6 py-3 text-base font-semibold text-white transition hover:bg-[#b02870]"
          >
            Ver todos los servicios
          </button>
        </div>
      ) : (
        <div className="space-y-9">
          {groups.map((group) => (
            <section key={group.category.id}>
              <h3 className="td-display mb-1 text-center text-[1.05rem] font-bold uppercase tracking-[0.18em] text-[#cf3080]">
                {group.category.label}
              </h3>
              <div
                className="mb-2 flex items-center justify-center gap-3 text-[#e0cbb5]"
                aria-hidden="true"
              >
                <span className="h-px w-10 bg-current" />
                <span className="text-[0.7rem] text-[#cf3080]">◆</span>
                <span className="h-px w-10 bg-current" />
              </div>
              <ul className="divide-y divide-[#efe4d6]">
                {group.services.map((service) => (
                  <ServiceItem key={service.id} service={service} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
