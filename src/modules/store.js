/**
 * Store — Gestion des données (Firestore)
 */

import { db } from './firebase.js';
import * as auth from './auth.js';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { normalize } from './utils.js';

export let recipes = [];

let onChange = null;
let unsubStore = null;

export function setOnChange(fn) {
  onChange = fn;
}

function notify() {
  if (onChange) onChange();
}

function requireAuth() {
  if (!auth.currentUser) throw new Error('Authentification requise');
}

function requireOwner(id) {
  requireAuth();
  const recipe = recipes.find(r => r.id === id);
  if (!recipe) throw new Error('Recette introuvable');
  if (recipe.userId !== auth.currentUser.uid) throw new Error('Vous n\'êtes pas le propriétaire de cette recette');
}

export function initStore() {
  unsubStore = onSnapshot(collection(db, 'recipes'), (snap) => {
    recipes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    notify();
  });
}

export function destroyStore() {
  if (unsubStore) { unsubStore(); unsubStore = null; }
}

// ---- Recipes ----
export async function addRecipe(data) {
  requireAuth();
  await addDoc(collection(db, 'recipes'), {
    ...data,
    userId: auth.currentUser.uid,
    authorName: auth.currentUser.displayName || auth.currentUser.email,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateRecipe(id, data) {
  requireOwner(id);
  await updateDoc(doc(db, 'recipes', id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function removeRecipe(id) {
  requireOwner(id);
  await deleteDoc(doc(db, 'recipes', id));
}

// ---- Tags (derived from recipes) ----
export function getAllTags() {
  const map = new Map(); // normalized → { label, count }
  for (const r of recipes) {
    for (const tag of r.tags || []) {
      const norm = normalize(tag);
      if (!norm) continue;
      const existing = map.get(norm);
      if (existing) {
        existing.count++;
      } else {
        map.set(norm, { label: tag, normalized: norm, count: 1 });
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}
