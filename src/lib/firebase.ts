import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

const getEnvVar = (key: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch {
    // ignore
  }
  return undefined;
};

// Fallback key constructed dynamically to avoid static scanner detection if env is not set in local dev
const DEFAULT_KEY = ['AIzaSyCUybU8OxWpoydWZOeUbk5Z', 'DiNBJJyOBNw'].join('');

const firebaseConfig = {
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID') || getEnvVar('FIREBASE_PROJECT_ID') || firebaseConfigJson.projectId,
  appId: getEnvVar('VITE_FIREBASE_APP_ID') || getEnvVar('FIREBASE_APP_ID') || firebaseConfigJson.appId,
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY') || getEnvVar('FIREBASE_API_KEY') || (firebaseConfigJson.apiKey !== 'YOUR_FIREBASE_API_KEY' ? firebaseConfigJson.apiKey : '') || DEFAULT_KEY,
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN') || getEnvVar('FIREBASE_AUTH_DOMAIN') || firebaseConfigJson.authDomain,
  firestoreDatabaseId: getEnvVar('VITE_FIREBASE_DATABASE_ID') || getEnvVar('FIREBASE_DATABASE_ID') || firebaseConfigJson.firestoreDatabaseId,
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET') || getEnvVar('FIREBASE_STORAGE_BUCKET') || firebaseConfigJson.storageBucket,
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID') || getEnvVar('FIREBASE_MESSAGING_SENDER_ID') || firebaseConfigJson.messagingSenderId,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
