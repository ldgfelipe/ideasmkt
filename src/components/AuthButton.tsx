// Botón de sesión de la cabecera pública: entra por /login (correo y
// contraseña), muestra la cuenta y el acceso al panel si es administrador.
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { useSession } from '../lib/session';

export default function AuthButton() {
  const { user, profile, loading } = useSession();

  if (loading) {
    return (
      <div className="flex items-center justify-center w-8 h-8">
        <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <a
        href="/login"
        className="text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
      >
        Iniciar sesión
      </a>
    );
  }

  const initials = (user.displayName || user.email || '?')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <div className="flex items-center gap-3">
      {user.photoURL ? (
        <img
          src={user.photoURL}
          alt={user.displayName || 'Cuenta'}
          className="w-8 h-8 rounded-full object-cover"
        />
      ) : (
        <span className="w-8 h-8 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">
          {initials}
        </span>
      )}
      {profile?.role === 'admin' && (
        <a
          href="/admin"
          className="text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors"
        >
          Panel
        </a>
      )}
      <button
        onClick={() => {
          if (auth) signOut(auth);
        }}
        className="text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors"
      >
        Salir
      </button>
    </div>
  );
}
