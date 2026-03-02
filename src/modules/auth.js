/**
 * Auth — Module d'authentification Firebase
 */

import { auth } from './firebase.js';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  signOut as firebaseSignOut,
} from 'firebase/auth';

export let currentUser = null;

const listeners = [];
let unsubAuth = null;

export function initAuth() {
  return new Promise((resolve) => {
    let resolved = false;
    unsubAuth = onAuthStateChanged(auth, (user) => {
      currentUser = user;
      listeners.forEach((fn) => fn(user));
      if (!resolved) { resolved = true; resolve(user); }
    });
  });
}

export function onAuthChange(fn) {
  listeners.push(fn);
  return () => {
    const i = listeners.indexOf(fn);
    if (i !== -1) listeners.splice(i, 1);
  };
}

export function destroyAuth() {
  if (unsubAuth) { unsubAuth(); unsubAuth = null; }
}

export async function signUpWithEmail(email, password, displayName) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  currentUser = auth.currentUser;
  return cred.user;
}

export async function signInWithEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

export async function signOut() {
  await firebaseSignOut(auth);
}
