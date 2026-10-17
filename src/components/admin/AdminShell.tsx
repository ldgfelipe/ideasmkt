// Armazón del panel: comprueba la sesión y el rol, pinta la cabecera y las
// pestañas, y devuelve el contenido. Lo usan todas las vistas de /admin.
import { useEffect, type ReactNode } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import type { Session } from '../../lib/session';

const TABS = [
  { href: '/admin', label: 'Resumen' },
  { href: '/admin/paginas', label: 'Páginas y estadísticas' },
  { href: '/admin/mensajes', label: 'Mensajes' },
  { href: '/admin/usuarios', label: 'Usuarios' },
  { href: '/admin/blog', label: 'Blog' }
];

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
    </div>
  );
}

export default function AdminShell({
  session,
  current,
  children
}: {
  session: Session;
  current: string;
  children: ReactNode;
}) {
  const { user, profile, loading, isAdmin } = session;

  // Sin sesión no hay nada que ver: al login.
  useEffect(() => {
    if (!loading && !user) window.location.href = '/login';
  }, [loading, user]);

  if (loading || !user) return <Spinner />;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow border border-gray-100 p-8 max-w-md text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Sin permisos</h1>
          <p className="text-gray-600 mb-6">
            Tu cuenta (<span className="font-medium">{user.email}</span>) tiene el rol{' '}
            <span className="font-medium">{profile?.role ?? 'cliente'}</span>. Solo los
            administradores pueden acceder a este panel.
          </p>
          <button
            onClick={() => {
              if (auth) signOut(auth).then(() => (window.location.href = '/login'));
            }}
            className="bg-purple-600 text-white px-5 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Panel de Administración</h1>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center gap-2 text-sm text-gray-600">
              {user.email}
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                {profile?.role ?? 'admin'}
              </span>
            </span>
            <button
              onClick={() => {
                if (auth) signOut(auth).then(() => (window.location.href = '/login'));
              }}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <nav className="flex flex-wrap gap-3 mb-8">
          {TABS.map((tab) => (
            <a
              key={tab.href}
              href={tab.href}
              className={
                tab.href === current
                  ? 'bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium'
                  : 'bg-white text-gray-700 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50'
              }
            >
              {tab.label}
            </a>
          ))}
        </nav>

        {children}
      </main>
    </div>
  );
}
