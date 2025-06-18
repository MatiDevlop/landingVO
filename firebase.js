// src/js/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, set, get, child } from "firebase/database";

// lee la configuración desde las vars de entorno (Vite)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Exporta funciones para reservar y leer slots
export function bookSlot(eventId, matricula, rol, horario) {
  const slotsRef = ref(db, `events/${eventId}/slots`);
  const newSlotRef = push(slotsRef);
  return set(newSlotRef, {
    matricula,
    rol,
    horario,
    bookedAt: new Date().toISOString()
  });
}

export async function getSlots(eventId) {
  const snapshot = await get(child(ref(db), `events/${eventId}/slots`));
  return snapshot.exists() ? snapshot.val() : {};
}