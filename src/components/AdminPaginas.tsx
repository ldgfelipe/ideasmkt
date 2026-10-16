// Catálogo de páginas (landings /lp y tarjetas digitales /td) con sus
// estadísticas: visitas, visitantes únicos, clics, clics en llamada y leads.
//
// Los datos salen de la colección `eventos` (la escribe <Analytics /> en cada
// página) y de `leads` (los formularios). Se agregan aquí, en el navegador,
// sobre el rango de fechas elegido.
import { useEffect, useMemo, useState } from 'react';
import { db } from '../lib/firebase';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { useSession, type Session } from '../lib/session';
import AdminShell from './admin/AdminShell';

const RANGES = [
  { days: 1, label: 'Hoy' },
  { days: 7, label: '7 días' },
  { days: 30, label: '30 días' },
  { days: 90, label: '90 días' }
];

const EVENT_LIMIT = 5000;
const LEAD_LIMIT = 2000;

/** Clave para lo que no viene de una landing ni tarjeta (el sitio, contacto…). */
const SITE_KEY = 'sitio';

interface Pagina {
  id: string;
  tipo: 'lp' | 'td';
  slug: string;
  nombre: string;
  ruta: string;
  estado: string;
  descripcion?: string;
}

interface Evento {
  id: string;
  type: string;
  pageId: string;
  kind?: string;
  label?: string;
  location?: string;
  device?: string;
  date: string;
  sessionId?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

interface Lead {
  id: string;
  name?: string;
  email?: string;
  source?: string;
  status?: string;
  createdAt?: { toDate: () => Date } | null;
}

interface Stats {
  views: number;
  clicks: number;
  calls: number;
  leads: number;
  visitors: Set<string>;
  byDay: Record<string, number>;
  byLabel: Record<string, number>;
  byKind: Record<string, number>;
  byDevice: Record<string, number>;
  bySource: Record<string, number>;
}

const emptyStats = (): Stats => ({
  views: 0,
  clicks: 0,
  calls: 0,
  leads: 0,
  visitors: new Set<string>(),
  byDay: {},
  byLabel: {},
  byKind: {},
  byDevice: {},
  bySource: {}
});

const emptyForm = {
  nombre: '',
  tipo: 'lp' as 'lp' | 'td',
  slug: '',
  ruta: '',
  estado: 'activa',
  descripcion: ''
};

const isoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;

/** Primer día (00:00 local) del rango de N días que termina hoy. */
function startOfRange(days: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - (days - 1));
  return date;
}

function bump(bag: Record<string, number>, key: string | undefined) {
  if (!key) return;
  bag[key] = (bag[key] ?? 0) + 1;
}

export default function AdminPaginas() {
  const session: Session = useSession();
  const [paginas, setPaginas] = useState<Pagina[]>([]);
  const [rangeDays, setRangeDays] = useState(30);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [truncated, setTruncated] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Catálogo de páginas (en vivo).
  useEffect(() => {
    if (!db || !session.isAdmin) return;
    return onSnapshot(collection(db, 'paginas'), (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Pagina[];
      data.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
      setPaginas(data);
    });
  }, [session.isAdmin]);

  // Eventos y leads del rango elegido.
  useEffect(() => {
    if (!db || !session.isAdmin) return;
    let active = true;
    setStatsLoading(true);

    (async () => {
      const start = startOfRange(rangeDays);
      try {
        const [eventosSnap, leadsSnap] = await Promise.all([
          getDocs(
            query(
              collection(db, 'eventos'),
              where('date', '>=', isoDate(start)),
              orderBy('date', 'desc'),
              limit(EVENT_LIMIT)
            )
          ),
          getDocs(
            query(
              collection(db, 'leads'),
              where('createdAt', '>=', Timestamp.fromDate(start)),
              limit(LEAD_LIMIT)
            )
          )
        ]);
        if (!active) return;
        setEventos(eventosSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Evento[]);
        setLeads(leadsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Lead[]);
        setTruncated(
          eventosSnap.size >= EVENT_LIMIT || leadsSnap.size >= LEAD_LIMIT
        );
      } catch (err) {
        console.error('No se pudieron leer las estadísticas:', err);
        if (active) setError('No se pudieron leer las estadísticas.');
      } finally {
        if (active) setStatsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [rangeDays, session.isAdmin]);

  // Agregación por página.
  const { perPage, totals } = useMemo(() => {
    const map = new Map<string, Stats>();
    const grand = emptyStats();

    const get = (pageId: string) => {
      let stats = map.get(pageId);
      if (!stats) {
        stats = emptyStats();
        map.set(pageId, stats);
      }
      return stats;
    };

    for (const evento of eventos) {
      const stats = get(evento.pageId || SITE_KEY);
      stats.byDay[evento.date] = (stats.byDay[evento.date] ?? 0) + 1;
      if (evento.type === 'page_view') {
        stats.views += 1;
        grand.views += 1;
        if (evento.sessionId) {
          stats.visitors.add(evento.sessionId);
          grand.visitors.add(evento.sessionId);
        }
        bump(stats.byDevice, evento.device);
        bump(grand.byDevice, evento.device);
        bump(stats.bySource, evento.utm_source || evento.referrer || 'directo');
        bump(grand.bySource, evento.utm_source || evento.referrer || 'directo');
      } else {
        stats.clicks += 1;
        grand.clicks += 1;
        if (evento.type === 'call_click') {
          stats.calls += 1;
          grand.calls += 1;
        }
        bump(stats.byLabel, evento.label);
        bump(grand.byLabel, evento.label);
        bump(stats.byKind, evento.kind);
        bump(grand.byKind, evento.kind);
      }
    }

    for (const lead of leads) {
      const key = lead.source || SITE_KEY;
      get(key).leads += 1;
      grand.leads += 1;
    }

    return { perPage: map, totals: grand };
  }, [eventos, leads]);

  /** Etiquetas de "procedencia" juntas (utm o referrer). */
  const sourceLabel = (source: string) => source;

  const days = useMemo(() => {
    const list: string[] = [];
    const start = startOfRange(rangeDays);
    for (let i = 0; i < rangeDays; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      list.push(isoDate(d));
    }
    return list;
  }, [rangeDays]);

  const knownIds = new Set(paginas.map((p) => p.id));
  const orphanIds = [...perPage.keys()].filter((id) => !knownIds.has(id) && id !== SITE_KEY);
  const hasSiteStats = perPage.has(SITE_KEY);

  const selectedStats = selected ? perPage.get(selected) : undefined;
  const selectedLeads = selected
    ? leads.filter((l) => (l.source || SITE_KEY) === selected)
    : [];

  const startEditing = (pagina: Pagina) => {
    setEditingId(pagina.id);
    setForm({
      nombre: pagina.nombre ?? '',
      tipo: pagina.tipo ?? 'lp',
      slug: pagina.slug ?? '',
      ruta: pagina.ruta ?? '',
      estado: pagina.estado ?? 'activa',
      descripcion: pagina.descripcion ?? ''
    });
    setShowForm(true);
    setMessage('');
    setError('');
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  };

  const save = async () => {
    if (!db) return;
    setError('');
    setMessage('');

    const slug = form.slug.trim().toLowerCase();
    if (!form.nombre.trim()) return setError('El nombre es obligatorio.');
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return setError('El identificador solo admite minúsculas, números y guiones.');
    }

    setSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'paginas', editingId), {
          nombre: form.nombre.trim(),
          ruta: form.ruta.trim(),
          estado: form.estado,
          descripcion: form.descripcion.trim(),
          updatedAt: serverTimestamp()
        });
        setMessage('Página actualizada.');
      } else {
        const pageId = `${form.tipo}-${slug}`;
        if (knownIds.has(pageId)) {
          setSaving(false);
          return setError('Ya existe una página con ese tipo e identificador.');
        }
        await setDoc(doc(db, 'paginas', pageId), {
          pageId,
          tipo: form.tipo,
          slug,
          nombre: form.nombre.trim(),
          ruta: form.ruta.trim() || `/${form.tipo}/${slug}/`,
          estado: form.estado,
          descripcion: form.descripcion.trim(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        setMessage(`Página registrada como "${pageId}".`);
      }
      resetForm();
      setShowForm(false);
    } catch (err) {
      console.error(err);
      setError('No se pudo guardar la página.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (pagina: Pagina) => {
    if (!db) return;
    if (!confirm(`¿Quitar "${pagina.nombre}" del catálogo? Los datos ya medidos se conservan.`))
      return;
    try {
      await deleteDoc(doc(db, 'paginas', pagina.id));
      if (selected === pagina.id) setSelected(null);
    } catch (err) {
      console.error(err);
      setError('No se pudo eliminar la página.');
    }
  };

  const card = (label: string, value: number | string, color = 'text-gray-900') => (
    <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
      <p className="text-gray-500 text-sm">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );

  const BarChart = ({ data }: { data: Record<string, number> }) => {
    const max = Math.max(1, ...days.map((d) => data[d] ?? 0));
    return (
      <div>
        <div className="flex items-end gap-1 h-32">
          {days.map((day) => {
            const value = data[day] ?? 0;
            return (
              <div
                key={day}
                className="flex-1 bg-purple-500 rounded-t min-h-[2px]"
                style={{ height: `${Math.round((value / max) * 100)}%` }}
                title={`${day}: ${value}`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{days[0]}</span>
          <span>{days[days.length - 1]}</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Cada barra es un día (el día más alto del rango: {max} evento{max === 1 ? '' : 's'}).
        </p>
      </div>
    );
  };

  const RankList = ({
    title,
    data,
    emptyText = 'Sin datos todavía.'
  }: {
    title: string;
    data: Record<string, number>;
    emptyText?: string;
  }) => {
    const rows = Object.entries(data)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    return (
      <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
        <h4 className="font-semibold text-gray-900 mb-3 text-sm">{title}</h4>
        {rows.length === 0 ? (
          <p className="text-sm text-gray-400">{emptyText}</p>
        ) : (
          <ul className="space-y-2">
            {rows.map(([key, value]) => (
              <li key={key} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-gray-700 truncate">{key}</span>
                <span className="font-semibold text-gray-900">{value}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <AdminShell session={session} current="/admin/paginas">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex gap-2">
          {RANGES.map((range) => (
            <button
              key={range.days}
              onClick={() => setRangeDays(range.days)}
              className={
                range.days === rangeDays
                  ? 'bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium'
                  : 'bg-white text-gray-700 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50'
              }
            >
              {range.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
        >
          {showForm ? 'Cancelar' : '+ Registrar página'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {message}
        </div>
      )}
      {truncated && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-6 text-sm">
          Se alcanzó el tope de eventos leídos ({EVENT_LIMIT.toLocaleString('es-MX')}). Los
          totales pueden quedarse cortos; prueba un rango más corto.
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl shadow border border-gray-100 p-6 mb-8">
          <h2 className="font-semibold text-gray-900 mb-4">
            {editingId ? `Editar página (${editingId})` : 'Registrar página'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Friganta"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
              <select
                value={form.tipo}
                disabled={!!editingId}
                onChange={(e) => setForm({ ...form, tipo: e.target.value as 'lp' | 'td' })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
              >
                <option value="lp">Landing page (/lp)</option>
                <option value="td">Tarjeta digital (/td)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Identificador *
              </label>
              <input
                value={form.slug}
                disabled={!!editingId}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
                placeholder="friganta"
              />
              <p className="text-xs text-gray-400 mt-1">
                Clave de medición: {form.tipo}-{form.slug || '…'} (debe coincidir con el
                componente &lt;Analytics pageId="…" /&gt; de la página).
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ruta</label>
              <input
                value={form.ruta}
                onChange={(e) => setForm({ ...form, ruta: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="/lp/friganta/"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="activa">Activa</option>
                <option value="pausada">Pausada</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <input
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Landing de captación para Friganta"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-5">
            <button
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {saving ? 'Guardando…' : editingId ? 'Actualizar' : 'Registrar'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {card('Visitas', totals.views)}
        {card('Visitantes únicos', totals.visitors.size)}
        {card('Clics', totals.clicks, 'text-purple-600')}
        {card('Clics en llamada', totals.calls, 'text-blue-600')}
        {card('Leads', totals.leads, 'text-green-600')}
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Páginas registradas</h2>
          <span className="text-sm text-gray-500">
            {statsLoading ? 'Leyendo eventos…' : `${eventos.length} eventos en el rango`}
          </span>
        </div>
        {paginas.length === 0 && !hasSiteStats ? (
          <p className="text-gray-500 p-6">
            Todavía no hay páginas registradas. Usa «Registrar página».
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-left p-4 font-medium">Página</th>
                  <th className="text-left p-4 font-medium">Tipo</th>
                  <th className="text-right p-4 font-medium">Visitas</th>
                  <th className="text-right p-4 font-medium">Únicos</th>
                  <th className="text-right p-4 font-medium">Clics</th>
                  <th className="text-right p-4 font-medium">Llamadas</th>
                  <th className="text-right p-4 font-medium">Leads</th>
                  <th className="text-right p-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginas.map((pagina) => {
                  const stats = perPage.get(pagina.id);
                  return (
                    <tr
                      key={pagina.id}
                      className={`hover:bg-gray-50 cursor-pointer ${
                        selected === pagina.id ? 'bg-purple-50' : ''
                      }`}
                      onClick={() => setSelected(selected === pagina.id ? null : pagina.id)}
                    >
                      <td className="p-4">
                        <div className="font-medium text-gray-900">{pagina.nombre}</div>
                        <div className="text-xs text-gray-400">
                          {pagina.ruta || `/${pagina.tipo}/${pagina.slug}/`} · {pagina.id}
                          {pagina.estado === 'pausada' && (
                            <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                              pausada
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-gray-600 uppercase">{pagina.tipo}</td>
                      <td className="p-4 text-right font-semibold">{stats?.views ?? 0}</td>
                      <td className="p-4 text-right">{stats?.visitors.size ?? 0}</td>
                      <td className="p-4 text-right">{stats?.clicks ?? 0}</td>
                      <td className="p-4 text-right">{stats?.calls ?? 0}</td>
                      <td className="p-4 text-right">{stats?.leads ?? 0}</td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(pagina);
                          }}
                          className="text-purple-600 hover:underline text-sm mr-3"
                        >
                          Editar
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            remove(pagina);
                          }}
                          className="text-red-500 hover:underline text-sm"
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {hasSiteStats && (
                  <tr
                    className={`hover:bg-gray-50 cursor-pointer ${
                      selected === SITE_KEY ? 'bg-purple-50' : ''
                    }`}
                    onClick={() => setSelected(selected === SITE_KEY ? null : SITE_KEY)}
                  >
                    <td className="p-4">
                      <div className="font-medium text-gray-900">Sitio web</div>
                      <div className="text-xs text-gray-400">
                        Contacto y páginas sin medición propia · {SITE_KEY}
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">—</td>
                    <td className="p-4 text-right font-semibold">
                      {perPage.get(SITE_KEY)?.views ?? 0}
                    </td>
                    <td className="p-4 text-right">
                      {perPage.get(SITE_KEY)?.visitors.size ?? 0}
                    </td>
                    <td className="p-4 text-right">{perPage.get(SITE_KEY)?.clicks ?? 0}</td>
                    <td className="p-4 text-right">{perPage.get(SITE_KEY)?.calls ?? 0}</td>
                    <td className="p-4 text-right">{perPage.get(SITE_KEY)?.leads ?? 0}</td>
                    <td className="p-4 text-right text-xs text-gray-400">solo lectura</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {orphanIds.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-8 text-sm">
          Hay {orphanIds.length} clave(s) con eventos pero sin página registrada:{' '}
          <span className="font-mono">{orphanIds.join(', ')}</span>. Regístralas para verlas en la
          tabla.
        </div>
      )}

      {selected && selectedStats && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Detalle:{' '}
              {paginas.find((p) => p.id === selected)?.nombre ??
                (selected === SITE_KEY ? 'Sitio web' : selected)}
            </h2>
            <button
              onClick={() => setSelected(null)}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Cerrar detalle
            </button>
          </div>

          <div className="bg-white rounded-xl shadow border border-gray-100 p-5 mb-6">
            <h4 className="font-semibold text-gray-900 mb-3 text-sm">Eventos por día</h4>
            <BarChart data={selectedStats.byDay} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <RankList title="Clics más frecuentes" data={selectedStats.byLabel} />
            <RankList title="Tipo de clic" data={selectedStats.byKind} />
            <RankList title="Dispositivos" data={selectedStats.byDevice} />
            <RankList
              title="Procedencia"
              data={Object.fromEntries(
                Object.entries(selectedStats.bySource).map(([k, v]) => [sourceLabel(k), v])
              )}
            />
          </div>

          <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h4 className="font-semibold text-gray-900 text-sm">
                Leads de esta página ({selectedLeads.length})
              </h4>
            </div>
            {selectedLeads.length === 0 ? (
              <p className="text-gray-500 p-6 text-sm">Sin leads en el rango elegido.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="text-left p-4 font-medium">Nombre</th>
                      <th className="text-left p-4 font-medium">Email</th>
                      <th className="text-left p-4 font-medium">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedLeads.map((lead) => (
                      <tr key={lead.id}>
                        <td className="p-4 font-medium text-gray-900">{lead.name || '—'}</td>
                        <td className="p-4 text-gray-600">{lead.email || '—'}</td>
                        <td className="p-4 text-gray-600">
                          {lead.createdAt
                            ? new Date(lead.createdAt.toDate()).toLocaleDateString('es-MX')
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-2">Cómo se mide una página</h2>
        <p className="text-sm text-gray-600 mb-3">
          En la página (.astro) añade el componente y usa la misma clave que registraste aquí:
        </p>
        <pre className="bg-gray-900 text-gray-100 text-xs rounded-lg p-4 overflow-x-auto">
{`---
import Analytics from '../components/Analytics.astro';
---
<body>
  <Analytics pageId="lp-friganta" tipo="lp" />`}
        </pre>
        <p className="text-xs text-gray-500 mt-3">
          Se registran visitas (una por sesión) y clics en enlaces, botones, PDFs, WhatsApp, correo
          y llamadas. Sin cookies ni IP. Para excluir algo, añade <code>data-no-track</code>.
        </p>
      </div>
    </AdminShell>
  );
}
