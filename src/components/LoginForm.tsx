import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  googleProvider
} from '../lib/firebase';
import { ensureProfile } from '../lib/session';

// Google necesita las credenciales OAuth configuradas en la consola de Firebase
// (Authentication → Sign-in method → Google). Hasta entonces el botón se
// oculta para no ofrecer algo que fallaría.
const GOOGLE_SIGNIN_ENABLED = false;

export default function LoginForm() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    try {
      if (!auth) throw new Error('Firebase no está configurado.');

      const credential =
        mode === 'register'
          ? await createUserWithEmailAndPassword(auth, email.trim(), password)
          : await signInWithEmailAndPassword(auth, email.trim(), password);

      // Al registrarse, el perfil se crea como "cliente"; si ya existía se
      // respeta el rol asignado.
      const profile = await ensureProfile(credential.user);
      window.location.href = profile.role === 'admin' ? '/admin' : '/';
    } catch (err: any) {
      console.error(err);
      setError(getErrorMessage(err?.code));
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (!auth) return;
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      const profile = await ensureProfile(credential.user);
      window.location.href = profile.role === 'admin' ? '/admin' : '/';
    } catch (err: any) {
      console.error(err);
      setError(getErrorMessage(err?.code));
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!auth) return;
    if (!email.trim()) {
      setError('Escribe tu correo y vuelve a pulsar «¿Olvidaste tu contraseña?».');
      return;
    }
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setNotice(`Te enviamos un enlace para restablecer la contraseña a ${email.trim()}.`);
    } catch (err: any) {
      console.error(err);
      setError(getErrorMessage(err?.code));
    }
  };

  return (
    <div className="card">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}
      {notice && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {notice}
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setError(null);
            setNotice(null);
          }}
          className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
            mode === 'login'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('register');
            setError(null);
            setNotice(null);
          }}
          className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
            mode === 'register'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Crear cuenta
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Correo electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="tu@correo.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        {mode === 'register' && (
          <p className="text-xs text-gray-500">
            Tu cuenta se crea con el rol <span className="font-medium">cliente</span>. Un
            administrador puede darte más permisos.
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          {loading
            ? 'Un momento…'
            : mode === 'register'
              ? 'Crear cuenta'
              : 'Entrar'}
        </button>
      </form>

      {mode === 'login' && (
        <button
          type="button"
          onClick={handleReset}
          className="mt-4 text-sm text-purple-600 hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </button>
      )}

      {GOOGLE_SIGNIN_ENABLED && (
        <>
          <div className="flex items-center gap-3 my-6">
            <span className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">o</span>
            <span className="flex-1 h-px bg-gray-200" />
          </div>
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg py-3 hover:bg-gray-50 transition-colors disabled:opacity-70"
          >
            Continuar con Google
          </button>
        </>
      )}

      <p className="mt-6 text-center text-sm text-gray-500">
        Al continuar aceptas nuestros{' '}
        <a href="/terms" className="text-purple-600 hover:underline">
          Términos
        </a>{' '}
        y{' '}
        <a href="/privacy" className="text-purple-600 hover:underline">
          Privacidad
        </a>
      </p>
    </div>
  );
}

function getErrorMessage(code?: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Ese correo ya tiene una cuenta. Inicia sesión o recupera tu contraseña.';
    case 'auth/invalid-email':
      return 'El correo no es válido.';
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Correo o contraseña incorrectos.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Inténtalo más tarde.';
    case 'auth/operation-not-allowed':
      return 'Ese método de acceso aún no está habilitado en Firebase.';
    case 'auth/user-disabled':
      return 'Esta cuenta está deshabilitada.';
    case 'auth/network-request-failed':
      return 'Sin conexión. Revisa tu red e inténtalo de nuevo.';
    default:
      return 'Ocurrió un error. Inténtalo de nuevo.';
  }
}
