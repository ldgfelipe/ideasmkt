import { useEffect, useState } from 'react';
import { auth, onAuthStateChanged, db } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, type QuerySnapshot, type DocumentData } from 'firebase/firestore';

interface Lead {
  id: string;
  name: string;
  email: string;
  company?: string;
  message: string;
  status: string;
  createdAt: { toDate: () => Date } | null;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthChecked(true);
      setLoading(false);
      if (!u) {
        window.location.href = '/login';
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!db || !user) return;
    const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as Lead[];
      setLeads(data);
    });
    return () => unsubscribe();
  }, [user]);

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    window.location.href = '/login';
  };

  const newLeads = leads.filter((l) => l.status === 'new').length;

  return (
    <div className="min-h-screen">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Panel de Administración</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            <p className="text-gray-500 text-sm">Total de leads</p>
            <p className="text-3xl font-bold text-gray-900">{leads.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            <p className="text-gray-500 text-sm">Nuevos</p>
            <p className="text-3xl font-bold text-purple-600">{newLeads}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            <p className="text-gray-500 text-sm">Tasa de conversión</p>
            <p className="text-3xl font-bold text-green-600">
              {leads.length ? Math.round((newLeads / leads.length) * 100) : 0}%
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Leads recientes</h2>
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
                      <td className="p-4 text-gray-600 max-w-xs truncate">{lead.message}</td>
                      <td className="p-4 text-gray-600">
                        {lead.createdAt
                          ? new Date(lead.createdAt.toDate()).toLocaleDateString('es-ES')
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
      </main>
    </div>
  );
}
