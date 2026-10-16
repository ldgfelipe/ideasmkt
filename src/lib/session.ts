// Sesión de usuario y perfil con rol.
//
// El rol vive en Firestore (`users/{uid}.role`): "admin" o "cliente". El perfil
// se crea la primera vez que alguien entra (siempre como "cliente"; las reglas
// lo fuerzan) y solo un administrador puede cambiarlo desde /admin/usuarios.
import { useEffect, useState } from 'react';
import { auth, db, onAuthStateChanged, type User } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export type Role = 'admin' | 'cliente';

export interface Profile {
  uid: string;
  email: string;
  name: string;
  role: Role;
  createdAt?: unknown;
}

/**
 * Asegura que el usuario tenga perfil en `users/{uid}`. Si no existe lo crea
 * como "cliente" (único rol permitido al registrarse) y devuelve el perfil.
 */
export async function ensureProfile(user: User): Promise<Profile> {
  const base: Profile = {
    uid: user.uid,
    email: user.email ?? '',
    name: user.displayName ?? '',
    role: 'cliente'
  };

  if (!db) return base;

  const ref = doc(db, 'users', user.uid);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    await setDoc(ref, {
      email: base.email,
      name: base.name,
      role: 'cliente',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return base;
  }

  const data = snapshot.data();
  return {
    uid: user.uid,
    email: data.email ?? base.email,
    name: data.name ?? base.name,
    role: (data.role as Role) ?? 'cliente',
    createdAt: data.createdAt
  };
}

async function fetchProfile(user: User): Promise<Profile> {
  if (!db) {
    return { uid: user.uid, email: user.email ?? '', name: '', role: 'cliente' };
  }
  const snapshot = await getDoc(doc(db, 'users', user.uid));
  const data = snapshot.exists() ? snapshot.data() : {};
  return {
    uid: user.uid,
    email: (data.email as string) ?? user.email ?? '',
    name: (data.name as string) ?? user.displayName ?? '',
    role: (data.role as Role) ?? 'cliente',
    createdAt: data.createdAt
  };
}

export interface Session {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
}

/** Estado de sesión (usuario + perfil con rol) para los paneles. */
export function useSession(): Session {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      if (!nextUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      try {
        setProfile(await fetchProfile(nextUser));
      } catch (error) {
        console.error('No se pudo leer el perfil:', error);
        setProfile({ uid: nextUser.uid, email: nextUser.email ?? '', name: '', role: 'cliente' });
      }
      setUser(nextUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { user, profile, loading, isAdmin: profile?.role === 'admin' };
}
