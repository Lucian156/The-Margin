/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, collection, getDocs, limit, query } from 'firebase/firestore';
import { getStorage, FirebaseStorage, ref } from 'firebase/storage';
import firebaseConfigJson from '../../firebase-applet-config.json';

const env = (import.meta as any).env || {};

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId || '',
  appId: env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId || '',
};

export const databaseId = firebaseConfigJson.firestoreDatabaseId || '(default)';

export const PLACEHOLDER_KEYWORDS = [
  'placeholder',
  'your-',
  'test-',
  'xxx',
  'undefined',
  'null',
  'change_me',
  'my_api_key',
];

export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  configDetails: {
    apiKey: { value: string; isOk: boolean; error?: string };
    authDomain: { value: string; isOk: boolean; error?: string };
    projectId: { value: string; isOk: boolean; error?: string };
    storageBucket: { value: string; isOk: boolean; error?: string };
    messagingSenderId: { value: string; isOk: boolean; error?: string };
    appId: { value: string; isOk: boolean; error?: string };
  };
}

export function validateFirebaseConfig(): ConfigValidationResult {
  const checkField = (val: string, name: string): { value: string; isOk: boolean; error?: string } => {
    if (!val || typeof val !== 'string' || val.trim() === '') {
      return { value: val || '', isOk: false, error: `${name} is missing or undefined.` };
    }
    const lower = val.toLowerCase();
    for (const kw of PLACEHOLDER_KEYWORDS) {
      if (lower.includes(kw)) {
        return { value: val, isOk: false, error: `${name} contains a placeholder or test value ("${val}").` };
      }
    }
    return { value: val, isOk: true };
  };

  const apiKeyCheck = checkField(firebaseConfig.apiKey, 'VITE_FIREBASE_API_KEY');
  const authDomainCheck = checkField(firebaseConfig.authDomain, 'VITE_FIREBASE_AUTH_DOMAIN');
  const projectIdCheck = checkField(firebaseConfig.projectId, 'VITE_FIREBASE_PROJECT_ID');
  const storageBucketCheck = checkField(firebaseConfig.storageBucket, 'VITE_FIREBASE_STORAGE_BUCKET');
  const senderIdCheck = checkField(firebaseConfig.messagingSenderId, 'VITE_FIREBASE_MESSAGING_SENDER_ID');
  const appIdCheck = checkField(firebaseConfig.appId, 'VITE_FIREBASE_APP_ID');

  const errors: string[] = [];
  if (apiKeyCheck.error) errors.push(apiKeyCheck.error);
  if (authDomainCheck.error) errors.push(authDomainCheck.error);
  if (projectIdCheck.error) errors.push(projectIdCheck.error);
  if (storageBucketCheck.error) errors.push(storageBucketCheck.error);
  if (senderIdCheck.error) errors.push(senderIdCheck.error);
  if (appIdCheck.error) errors.push(appIdCheck.error);

  return {
    isValid: errors.length === 0,
    errors,
    configDetails: {
      apiKey: apiKeyCheck,
      authDomain: authDomainCheck,
      projectId: projectIdCheck,
      storageBucket: storageBucketCheck,
      messagingSenderId: senderIdCheck,
      appId: appIdCheck,
    },
  };
}

const validatedConfig = validateFirebaseConfig();
export const isFirebaseConfigValid = validatedConfig.isValid;
export const firebaseConfigError = validatedConfig.errors.join('; ');

export const firebaseApp: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const app: FirebaseApp = firebaseApp;
export const auth: Auth = getAuth(firebaseApp);
export const db: Firestore = getFirestore(firebaseApp, databaseId);
export const storage: FirebaseStorage = getStorage(firebaseApp);

export interface FirebaseHealthStatus {
  appConnected: { status: 'green' | 'red'; message: string; details?: string };
  authConnected: { status: 'green' | 'red'; message: string; details?: string };
  firestoreConnected: { status: 'green' | 'red'; message: string; details?: string };
  storageConnected: { status: 'green' | 'red'; message: string; details?: string };
  configValidation: ConfigValidationResult;
  checkedAt: string;
}

export async function runFirebaseHealthCheck(): Promise<FirebaseHealthStatus> {
  const configVal = validateFirebaseConfig();

  // 1. Firebase App Connected
  let appStatus: 'green' | 'red' = 'red';
  let appMessage = 'Firebase App initialization failed.';
  let appDetails = '';

  try {
    if (firebaseApp && firebaseApp.name) {
      appStatus = 'green';
      appMessage = `App initialized (${firebaseApp.name})`;
      appDetails = `Project ID: ${firebaseConfig.projectId}`;
    }
  } catch (err: any) {
    appMessage = `App error: ${err.message}`;
  }

  // 2. Authentication Connected
  let authStatus: 'green' | 'red' = 'red';
  let authMessage = 'Authentication service unavailable.';
  let authDetails = '';

  if (!configVal.configDetails.apiKey.isOk) {
    authMessage = 'Authentication blocked due to invalid/placeholder API key.';
  } else {
    try {
      if (auth && auth.app) {
        authStatus = 'green';
        authMessage = `Auth active (${auth.currentUser ? 'User Session Live' : 'Ready'})`;
        authDetails = `Domain: ${firebaseConfig.authDomain}`;
      }
    } catch (err: any) {
      authMessage = `Auth error: ${err.message}`;
    }
  }

  // 3. Firestore Connected
  let firestoreStatus: 'green' | 'red' = 'red';
  let firestoreMessage = 'Firestore connection failed.';
  let firestoreDetails = '';

  try {
    const qUsers = query(collection(db, 'users'), limit(1));
    await getDocs(qUsers);
    firestoreStatus = 'green';
    firestoreMessage = 'Firestore database connected and responsive.';
    firestoreDetails = `Database ID: ${databaseId}`;
  } catch (err: any) {
    if (
      err.code === 'permission-denied' ||
      err.code === 'failed-precondition' ||
      (err.message && err.message.includes('permission'))
    ) {
      firestoreStatus = 'green';
      firestoreMessage = 'Firestore connected (Database online & rules active).';
      firestoreDetails = `Database: ${databaseId}`;
    } else {
      firestoreMessage = `Firestore error: ${err.message || err.code}`;
    }
  }

  // 4. Storage Connected
  let storageStatus: 'green' | 'red' = 'red';
  let storageMessage = 'Firebase Storage bucket unavailable.';
  let storageDetails = '';

  try {
    if (storage && storage.app) {
      ref(storage, '_health_test.txt');
      storageStatus = 'green';
      storageMessage = 'Storage bucket connected.';
      storageDetails = `Bucket: ${firebaseConfig.storageBucket}`;
    }
  } catch (err: any) {
    storageMessage = `Storage error: ${err.message}`;
  }

  return {
    appConnected: { status: appStatus, message: appMessage, details: appDetails },
    authConnected: { status: authStatus, message: authMessage, details: authDetails },
    firestoreConnected: { status: firestoreStatus, message: firestoreMessage, details: firestoreDetails },
    storageConnected: { status: storageStatus, message: storageMessage, details: storageDetails },
    configValidation: configVal,
    checkedAt: new Date().toLocaleTimeString(),
  };
}

console.log('[Firebase Init] Project ID:', firebaseConfig.projectId);
console.log('[Firebase Init] Auth Domain:', firebaseConfig.authDomain);
console.log('[Firebase Init] Database ID:', databaseId);

export default firebaseApp;
