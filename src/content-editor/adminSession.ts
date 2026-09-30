import { useSyncExternalStore } from 'react';
import { getIdTokenResult, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from './firebase';

let admin = false;
let ready = false;
let generation = 0;
const listeners = new Set<() => void>();
export function hasAdminSession() { return admin; }
export function useAdminSession() {
  const state = useSyncExternalStore(
    listener => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    () => `${admin}:${ready}`,
  );
  const [adminValue, readyValue] = state.split(':');
  return { admin: adminValue === 'true', ready: readyValue === 'true' };
}
onAuthStateChanged(auth, async user => {
  const current = ++generation;
  let allowed = false;
  try { allowed = user ? (await getIdTokenResult(user)).claims.admin === true : false; } catch { allowed = false; }
  if (current !== generation) return;
  admin = allowed; ready = true;
  listeners.forEach(listener => listener());
  window.dispatchEvent(new Event('tree-film-auth-updated'));
});
export async function signOutAdmin() { await signOut(auth); }
export async function signInAdmin(email: string, password: string) {
  try {
    const result = await signInWithEmailAndPassword(auth, email.trim(), password);
    if ((await getIdTokenResult(result.user, true)).claims.admin !== true) { await signOut(auth); return false; }
    admin = true; ready = true; listeners.forEach(listener => listener());
    window.dispatchEvent(new Event('tree-film-auth-updated'));
    return true;
  } catch { return false; }
}
