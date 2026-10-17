// Bandeja de mensajes del formulario de /contact. Cada mensaje vive en la
// colección `mensajes` (el público solo puede crear; el admin lee y gestiona).
// Aquí se leen, se marcan como leído/respondido y se borran.
import { useEffect, useMemo, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useSession, type Session } from '../lib/session';
import AdminShell from './admin/AdminShell';

interface Mensaje {
  id: string;
  name?: string;
  email?: string;
  company?: string;
  message?: string;
  source?: string;
  status?: string;
  createdAt?: { toDate: () => Date } | null;
}

type Estado = 'nuevo' | 'leido' | 'respondido';

const STATUS_LABEL: Record<Estado, string> = {
  nuevo: 'Nuevo',
  leido: 'Leído',
  respondido: 'Respondido'
};

const STATUS_STYLE: Record<Estado, string> = {
  nuevo: 'bg-purple-100 text-purple-700',
  leido: 'bg-gray-100 text-gray-600',
  respondido: 'bg-green-100 text-green-700'
};

function estadoDe(mensaje: Mensaje): Estado {
  const status = mensaje.status as Estado | undefined;
  return status && status in STATUS_LABEL ? status : 'nuevo';
}

function fechaDe(mensaje: Mensaje) {
  if (!mensaje.createdAt) return '—';
  return new Date(mensaje.createdAt.toDate()).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function AdminMensajes() {
  const session: Session = useSession();
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [filtro, setFiltro] = useState<'todos' | Estado>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [abierto, setAbierto] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!db || !session.isAdmin) return;
    const unsubscribe = onSnapshot(
      query(collection(db, 'mensajes'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setMensajes(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Mensaje[]);
      },
      (err) => {
        console.error('No se pudieron cargar los mensajes:', err);
        setError('No se pudieron cargar los mensajes. Revisa los permisos de Firestore.');
      }
    );
    return () => unsubscribe();
  }, [session.isAdmin]);

  const conteo = useMemo(() => {
    const total = { nuevo: 0, leido: 0, respondido: 0 };
    for (const mensaje of mensajes) total[estadoDe(mensaje)] += 1;
    return total;
  }, [mensajes]);

  const visibles = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return mensajes.filter((mensaje) => {
      if (filtro !== 'todos' && estadoDe(mensaje) !== filtro) return false;
      if (!termino) return true;
      return [mensaje.name, mensaje.email, mensaje.company, mensaje.message]
        .filter(Boolean)
        .some((campo) => String(campo).toLowerCase().includes(termino));
    });
  }, [mensajes, filtro, busqueda]);

  const cambiarEstado = async (mensaje: Mensaje, status: Estado) => {
    if (!db) return;
    setBusy(mensaje.id);
    setError('');
    try {
      await updateDoc(doc(db, 'mensajes', mensaje.id), { status, updatedAt: serverTimestamp() });
    } catch (err) {
      console.error(err);
      setError('No se pudo actualizar el mensaje.');
    } finally {
      setBusy(null);
    }
  };

  const eliminar = async (mensaje: Mensaje) => {
    if (!db) return;
    if (!window.confirm(`¿Borrar el mensaje de ${mensaje.name || mensaje.email || 'este contacto'}?`)) {
      return;
    }
    setBusy(mensaje.id);
    setError('');
    try {
      await deleteDoc(doc(db, 'mensajes', mensaje.id));
      if (abierto === mensaje.id) setAbierto(null);
    } catch (err) {
      console.error(err);
      setError('No se pudo borrar el mensaje.');
    } finally {
      setBusy(null);
    }
  };

  const respuestaHref = (mensaje: Mensaje) => {
    const asunto = encodeURIComponent('Re: tu mensaje a IdeasMKT');
    return `mailto:${mensaje.email ?? ''}?subject=${asunto}`;
  };

  const stat = (label: string, value: number, color: string) => (
    <div className="bg-white rounded-xl shadow p-4 border border-gray-100">
      <p className="text-gray-500 text-sm">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );

  return (
    <AdminShell session={session} current="/admin/mensajes">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stat('Total', mensajes.length, 'text-gray-900')}
        {stat('Nuevos', conteo.nuevo, 'text-purple-600')}
        {stat('Leídos', conteo.leido, 'text-gray-700')}
        {stat('Respondidos', conteo.respondido, 'text-green-600')}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex flex-wrap gap-2">
          {(['todos', 'nuevo', 'leido', 'respondido'] as const).map((opcion) => (
            <button
              key={opcion}
              onClick={() => setFiltro(opcion)}
              className={
                filtro === opcion
                  ? 'bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium'
                  : 'bg-white text-gray-700 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50'
              }
            >
              {opcion === 'todos' ? 'Todos' : STATUS_LABEL[opcion]}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, correo o texto…"
          className="sm:ml-auto w-full sm:w-72 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        {visibles.length === 0 ? (
          <p className="text-gray-500 p-6">
            {mensajes.length === 0
              ? 'Todavía no hay mensajes del formulario de contacto.'
              : 'No hay mensajes que coincidan con el filtro.'}
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {visibles.map((mensaje) => {
              const estado = estadoDe(mensaje);
              const expandido = abierto === mensaje.id;
              return (
                <li key={mensaje.id} className="hover:bg-gray-50">
                  <button
                    type="button"
                    onClick={() => setAbierto(expandido ? null : mensaje.id)}
                    className="w-full text-left p-4 sm:p-6 flex flex-col sm:flex-row sm:items-start gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">
                          {mensaje.name || 'Sin nombre'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[estado]}`}>
                          {STATUS_LABEL[estado]}
                        </span>
                        {mensaje.company && (
                          <span className="text-sm text-gray-500">· {mensaje.company}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{mensaje.email || '—'}</p>
                      {!expandido && (
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                          {mensaje.message || '(sin mensaje)'}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap sm:pt-1">
                      {fechaDe(mensaje)}
                    </span>
                  </button>

                  {expandido && (
                    <div className="px-4 sm:px-6 pb-6 -mt-1">
                      <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 whitespace-pre-wrap text-gray-700 text-sm">
                        {mensaje.message || '(sin mensaje)'}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-4">
                        <a
                          href={respuestaHref(mensaje)}
                          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                        >
                          Responder por correo
                        </a>
                        {estado !== 'leido' && (
                          <button
                            disabled={busy === mensaje.id}
                            onClick={() => cambiarEstado(mensaje, 'leido')}
                            className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
                          >
                            Marcar como leído
                          </button>
                        )}
                        {estado !== 'respondido' && (
                          <button
                            disabled={busy === mensaje.id}
                            onClick={() => cambiarEstado(mensaje, 'respondido')}
                            className="bg-white text-green-700 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
                          >
                            Marcar como respondido
                          </button>
                        )}
                        {estado !== 'nuevo' && (
                          <button
                            disabled={busy === mensaje.id}
                            onClick={() => cambiarEstado(mensaje, 'nuevo')}
                            className="text-gray-500 hover:underline text-sm disabled:opacity-50"
                          >
                            Marcar como nuevo
                          </button>
                        )}
                        <button
                          disabled={busy === mensaje.id}
                          onClick={() => eliminar(mensaje)}
                          className="text-red-500 hover:underline text-sm ml-auto disabled:opacity-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-4">
        Los mensajes llegan desde el formulario de{' '}
        <a href="/contact" className="underline">
          /contact
        </a>{' '}
        y se guardan en Firestore (colección «mensajes»). Solo los administradores pueden verlos.
      </p>
    </AdminShell>
  );
}
