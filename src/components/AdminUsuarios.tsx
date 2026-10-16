// Usuarios y roles. Al registrarse en /login toda cuenta entra como "cliente";
// aquí un administrador puede ascender a "admin" (o volver a "cliente").
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useSession, type Session } from '../lib/session';
import AdminShell from './admin/AdminShell';

interface Usuario {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  createdAt?: { toDate: () => Date } | null;
}

export default function AdminUsuarios() {
  const session: Session = useSession();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !session.isAdmin) return;
    return onSnapshot(collection(db, 'users'), (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Usuario[];
      data.sort((a, b) => (a.email ?? '').localeCompare(b.email ?? '', 'es'));
      setUsuarios(data);
    });
  }, [session.isAdmin]);

  const changeRole = async (usuario: Usuario, role: string) => {
    if (!db) return;
    if (
      usuario.id === session.user?.uid &&
      role !== 'admin' &&
      !confirm('Vas a quitarte el rol de administrador. ¿Continuar?')
    ) {
      return;
    }
    setBusy(usuario.id);
    setError('');
    try {
      await updateDoc(doc(db, 'users', usuario.id), { role, updatedAt: serverTimestamp() });
    } catch (err) {
      console.error(err);
      setError('No se pudo cambiar el rol.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <AdminShell session={session} current="/admin/usuarios">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-semibold text-gray-900">Usuarios ({usuarios.length})</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-6 text-sm">
        Los clientes se dan de alta desde <span className="font-medium">/login</span> (pestaña
        «Crear cuenta») y entran con el rol <span className="font-medium">cliente</span>. Aquí les
        cambias el rol cuando corresponda.
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        {usuarios.length === 0 ? (
          <p className="text-gray-500 p-6">Todavía no hay usuarios registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-left p-4 font-medium">Correo</th>
                  <th className="text-left p-4 font-medium">Nombre</th>
                  <th className="text-left p-4 font-medium">Rol</th>
                  <th className="text-left p-4 font-medium">Alta</th>
                  <th className="text-left p-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usuarios.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">
                      {usuario.email || '—'}
                      {usuario.id === session.user?.uid && (
                        <span className="ml-2 text-xs text-purple-600">(tú)</span>
                      )}
                    </td>
                    <td className="p-4 text-gray-600">{usuario.name || '—'}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          usuario.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {usuario.role ?? 'cliente'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">
                      {usuario.createdAt
                        ? new Date(usuario.createdAt.toDate()).toLocaleDateString('es-MX')
                        : '—'}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-3">
                        {usuario.role !== 'admin' && (
                          <button
                            disabled={busy === usuario.id}
                            onClick={() => changeRole(usuario, 'admin')}
                            className="text-purple-600 hover:underline text-sm disabled:opacity-50"
                          >
                            Hacer administrador
                          </button>
                        )}
                        {usuario.role === 'admin' && (
                          <button
                            disabled={busy === usuario.id}
                            onClick={() => changeRole(usuario, 'cliente')}
                            className="text-red-500 hover:underline text-sm disabled:opacity-50"
                          >
                            Quitar administrador
                          </button>
                        )}
                      </div>
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
