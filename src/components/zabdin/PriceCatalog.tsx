import { useMemo, useState } from 'react';
import {
  CATEGORIES,
  SERVICES,
  type CategoryId,
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

function ServiceCard({ service }: { service: Service }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-rose-100 bg-white/95 p-4 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <h3 className="td-display text-lg font-semibold leading-snug text-stone-800">
          {service.name}
        </h3>
        {service.price && (
          <span className="shrink-0 rounded-full bg-[#cf3080]/10 px-3 py-1 text-base font-bold text-[#cf3080]">
            {service.price}
          </span>
        )}
      </div>

      {service.description && (
        <p className="mt-1 text-base text-stone-600">{service.description}</p>
      )}

      {service.note && (
        <p className="mt-1 text-sm font-medium text-amber-700">{service.note}</p>
      )}

      {service.options && service.options.length > 0 && (
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {service.options.map((option) => (
            <li
              key={option.label}
              className="flex items-center justify-between gap-2 rounded-lg bg-rose-50/80 px-3 py-2 text-base"
            >
              <span className="text-stone-700">{option.label}</span>
              <span className="font-semibold text-[#cf3080]">{option.price}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
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

  return (
    <div className="w-full">
      {/* Buscador */}
      <div className="relative mx-auto mb-5 max-w-xl">
        <svg
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-rose-400"
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
          placeholder="Buscar servicio: acrílicas, lifting, alisado, pedicura…"
          aria-label="Buscar servicio por nombre"
          className="w-full rounded-full border border-rose-200 bg-white py-3.5 pl-12 pr-11 text-base text-stone-700 shadow-sm outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-200"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Limpiar búsqueda"
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-lg text-stone-400 transition hover:bg-rose-100 hover:text-rose-600"
          >
            ×
          </button>
        )}
      </div>

      {/* Filtros por categoría */}
      <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0">
        <button
          type="button"
          onClick={() => setFilter('all')}
          aria-pressed={filter === 'all'}
          className={`shrink-0 rounded-full border px-4 py-2.5 text-base font-medium transition ${
            filter === 'all'
              ? 'border-[#cf3080] bg-[#cf3080] text-white shadow-sm'
              : 'border-rose-200 bg-white text-stone-600 hover:bg-rose-50'
          }`}
        >
          Todas
        </button>
        {CATEGORIES.map((category) => {
          const active = filter === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => setFilter(category.id)}
              aria-pressed={active}
              className={`shrink-0 rounded-full border px-4 py-2.5 text-base font-medium transition ${
                active
                  ? 'border-[#cf3080] bg-[#cf3080] text-white shadow-sm'
                  : 'border-rose-200 bg-white text-stone-600 hover:bg-rose-50'
              }`}
            >
              <span className="mr-1" aria-hidden="true">
                {category.emoji}
              </span>
              {category.label}
              <span
                className={`ml-1.5 text-xs ${
                  active ? 'text-rose-100' : 'text-stone-400'
                }`}
              >
                {counts.get(category.id) ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Resultados */}
      <p className="mb-4 text-center text-base text-stone-600" aria-live="polite">
        {total === 0
          ? 'Sin resultados'
          : `${total} ${total === 1 ? 'servicio' : 'servicios'} ${
              filter === 'all' ? 'en total' : 'en esta categoría'
            }`}
      </p>

      {total === 0 ? (
        <div className="rounded-2xl border border-dashed border-rose-200 bg-white/70 px-6 py-12 text-center">
          <p className="text-3xl" aria-hidden="true">
            🔍
          </p>
          <p className="mt-2 text-lg font-medium text-stone-700">
            No encontramos servicios para “{query}”.
          </p>
          <p className="mt-1 text-base text-stone-600">
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
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.category.id}>
              <h3 className="td-display mb-3 flex items-center gap-2 text-xl font-bold text-stone-800">
                <span aria-hidden="true">{group.category.emoji}</span>
                {group.category.label}
                <span className="ml-1 rounded-full bg-[#cf3080]/10 px-2 py-0.5 text-xs font-semibold text-[#cf3080]">
                  {group.services.length}
                </span>
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.services.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
