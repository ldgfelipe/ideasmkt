// Resumen del panel: leads y unas cuantas cifras globales. Las estadísticas
// detalladas por página viven en /admin/paginas.
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import {
  collection,
  getCountFromServer,
  onSnapshot,
  orderBy,
  query,
  where,
  type DocumentData,
  type QuerySnapshot
} from 'firebase/firestore';
import { useSession, type Session } from '../lib/session';
import AdminShell from './admin/AdminShell';

interface Lead {
  id: string;
  name: string;
  email: string;
  company?: string;
  message: string;
  source?: string;
  status: string;
  createdAt: { toDate: () => Date } | null;
}

const isoToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
};

export default function AdminDashboard() {
  const session: Session = useSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [newMessages, setNewMessages] = useState(0);
  const [callClicks, setCallClicks] = useState(0);
  const [eventsToday, setEventsToday] = useState(0);
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    if (!db || !session.isAdmin) return;

    const unsubscribeLeads = onSnapshot(
      query(collection(db, 'leads'), orderBy('createdAt', 'desc')),
      (snapshot: QuerySnapshot<DocumentData>) => {
        setLeads(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Lead[]);
      }
    );

    const unsubscribeCalls = onSnapshot(
      query(collection(db, 'eventos'), where('type', '==', 'call_click')),
      (snapshot) => setCallClicks(snapshot.size)
    );

    const unsubscribeMessages = onSnapshot(
      query(collection(db, 'mensajes'), where('status', '==', 'nuevo')),
      (snapshot) => setNewMessages(snapshot.size)
    );

    getCountFromServer(query(collection(db, 'eventos'), where('date', '==', isoToday())))
      .then((snapshot) => setEventsToday(snapshot.data().count))
      .catch((error) => console.error('No se pudo contar los eventos de hoy:', error));

    getCountFromServer(collection(db, 'paginas'))
      .then((snapshot) => setPageCount(snapshot.data().count))
      .catch((error) => console.error('No se pudo contar las páginas:', error));

    return () => {
      unsubscribeLeads();
      unsubscribeCalls();
      unsubscribeMessages();
    };
  }, [session.isAdmin]);

  const newLeads = leads.filter((l) => l.status === 'new').length;

  const card = (label: string, value: number | string, color = 'text-gray-900') => (
    <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
      <p className="text-gray-500 text-sm">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );

  return (
    <AdminShell session={session} current="/admin">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {card('Total de leads', leads.length)}
        {card('Nuevos', newLeads, 'text-purple-600')}
        {card(
          'Tasa de conversión',
          `${leads.length ? Math.round((newLeads / leads.length) * 100) : 0}%`,
          'text-green-600'
        )}
        {card('Clics en llamada', callClicks, 'text-blue-600')}
        {card('Mensajes nuevos', newMessages, 'text-amber-600')}
        {card('Eventos hoy', eventsToday)}
        {card('Páginas registradas', pageCount)}
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Leads recientes</h2>
          <a href="/admin/paginas" className="text-sm text-purple-600 hover:underline">
            Ver estadísticas por página →
          </a>
        </div>
        {leads.length === 0 ? (
          <p className="text-gray-500 p-6">No hay leads todavía.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-left p-4 font-medium">Nombre</th>
                  <th className="text-left p-4 font-medium">Email</th>
                  <th className="text-left p-4 font-medium">Empresa</th>
                  <th className="text-left p-4 font-medium">Origen</th>
                  <th className="text-left p-4 font-medium">Mensaje</th>
                  <th className="text-left p-4 font-medium">Fecha</th>
                  <th className="text-left p-4 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">{lead.name}</td>
                    <td className="p-4 text-gray-600">{lead.email}</td>
                    <td className="p-4 text-gray-600">{lead.company || '-'}</td>
                    <td className="p-4 text-gray-600">{lead.source || 'sitio'}</td>
                    <td className="p-4 text-gray-600 max-w-xs truncate">{lead.message}</td>
                    <td className="p-4 text-gray-600">
                      {lead.createdAt
                        ? new Date(lead.createdAt.toDate()).toLocaleDateString('es-MX')
                        : '—'}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          lead.status === 'new'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {lead.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
