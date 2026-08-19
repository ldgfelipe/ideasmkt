import { useState, useEffect } from 'react';
import {
  auth,
  signInWithPopup,
  onAuthStateChanged,
  googleProvider,
  type User
} from '../lib/firebase';
import {
  signOut
} from 'firebase/auth';

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    if (!auth) return;
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center w-8 h-8">
        <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <img
          src={user.photoURL || 'https://via.placeholder.com/40'}
          alt={user.displayName || 'User'}
          className="w-8 h-8 rounded-full object-cover"
        />
        <button
          onClick={handleLogout}
          className="text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors"
        >
          Salir
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      className="btn-primary text-sm py-2 px-4"
    >
      Iniciar sesión
    </button>
  );
}
