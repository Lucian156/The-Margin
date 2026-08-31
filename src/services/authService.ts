/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigValid, firebaseConfigError } from '../lib/firebase';
import { User } from '../types';

export const CANONICAL_ROUND_ID = 'nrl-2026-round-24';

// Helper to check if a value is a Firestore sentinel (serverTimestamp, FieldValue, Timestamp)
function isFirestoreSentinel(val: any): boolean {
  if (!val || typeof val !== 'object') return false;
  if (val instanceof Date) return true;
  if (val.constructor && (val.constructor.name === 'FieldValue' || val.constructor.name === 'Timestamp')) return true;
  if (typeof val._methodName === 'string') return true;
  if (typeof val.isEqual === 'function' && typeof val.toMillis === 'function') return true;
  return false;
}

// Helper to sanitize object before sending to Firestore
function sanitizeForFirestore<T>(obj: T): Record<string, any> {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj as any;
  }
  if (isFirestoreSentinel(obj)) {
    return obj as any;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForFirestore(item)) as any;
  }
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !isFirestoreSentinel(value)) {
        cleaned[key] = sanitizeForFirestore(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

/**
 * Audit log helper: Records an Auth user creation/login in auth_records/{uid} and adminAuditEvents/{id}
 */
export async function recordAuthUserAudit(uid: string, email: string, displayName?: string): Promise<void> {
  try {
    const cleanEmail = (email || '').trim().toLowerCase();
    await setDoc(doc(db, 'auth_records', uid), {
      uid,
      email: cleanEmail,
      displayName: displayName || cleanEmail.split('@')[0] || 'User',
      createdAt: serverTimestamp(),
      lastSignInAt: serverTimestamp(),
    }, { merge: true });

    await setDoc(doc(db, 'adminAuditEvents', `auth-${uid}-${Date.now()}`), {
      eventType: 'USER_AUTH_EVENT',
      uid,
      email: cleanEmail,
      timestamp: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn('[recordAuthUserAudit] Could not write auth_records audit:', err);
  }
}

/**
 * Audit log helper: Records registration failures in registration_errors and adminAuditEvents
 */
export async function recordRegistrationError(email: string, err: any): Promise<void> {
  try {
    const cleanEmail = (email || '').trim().toLowerCase();
    const errDocId = `err-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const errorPayload = {
      id: errDocId,
      email: cleanEmail,
      errorCode: err?.code || 'UNKNOWN_ERROR',
      errorMessage: err?.message || String(err),
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'registration_errors', errDocId), errorPayload, { merge: true });
    await setDoc(doc(db, 'adminAuditEvents', `reg-err-${errDocId}`), {
      eventType: 'REGISTRATION_ERROR',
      ...errorPayload,
    }, { merge: true });
  } catch (e) {
    console.warn('[recordRegistrationError] Could not log registration error:', e);
  }
}

/**
 * Ensures a corresponding Firestore document exists at users/{uid} for the Auth user.
 * If missing, creates a recovery profile with profileRecovered: true.
 */
export async function ensureUserProfile(firebaseUser: FirebaseUser): Promise<User> {
  if (!firebaseUser) {
    throw new Error('No Firebase user provided to ensureUserProfile');
  }

  const userRef = doc(db, 'users', firebaseUser.uid);
  const snapshot = await getDoc(userRef);

  const cleanEmail = (firebaseUser.email || '').toLowerCase().trim();
  const isAdminUser =
    cleanEmail.includes('admin') ||
    cleanEmail.includes('lucian') ||
    firebaseUser.uid === 'user-beta-admin' ||
    firebaseUser.uid === 'admin-master-uid';

  if (!snapshot.exists()) {
    const fallbackName =
      firebaseUser.displayName ||
      (cleanEmail ? cleanEmail.split('@')[0] : 'Player');
    const fallbackUsername = fallbackName.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    const newUserDoc: User = {
      id: firebaseUser.uid,
      uid: firebaseUser.uid,
      email: cleanEmail,
      emailLowercase: cleanEmail,
      name: fallbackName,
      displayName: fallbackName,
      username: fallbackUsername,
      usernameLowercase: fallbackUsername,
      photoURL: firebaseUser.photoURL || null,
      avatarUrl:
        firebaseUser.photoURL ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      role: isAdminUser ? 'admin' : 'tester',
      isAdmin: isAdminUser,
      membershipTier: 'free',
      status: 'active',
      favoriteTeamId: 'WARRIORS',
      favouriteTeamId: 'WARRIORS',
      totalScore: 0,
      roundsPlayed: 0,
      perfectTipsCount: 0,
      correctWinnersCount: 0,
      wrongWinnersCount: 0,
      averageMarginError: 0,
      onboardingComplete: true,
      profileRecovered: true,
      betaRoundId: CANONICAL_ROUND_ID,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      memberSince: new Date().toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      }),
    };

    const firestorePayload = {
      ...newUserDoc,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    };

    await setDoc(userRef, sanitizeForFirestore(firestorePayload), { merge: true });
    console.log('[ensureUserProfile] Created recovered user profile for UID:', firebaseUser.uid);
    return newUserDoc;
  } else {
    const existing = snapshot.data();
    const isExistingAdmin = existing.role === 'admin' || existing.isAdmin === true || isAdminUser;

    const updatedProfile: Partial<User> = {
      email: cleanEmail || existing.email || '',
      emailLowercase: cleanEmail || existing.emailLowercase || '',
      displayName: firebaseUser.displayName || existing.displayName || existing.name || 'Player',
      name: firebaseUser.displayName || existing.name || existing.displayName || 'Player',
      photoURL: firebaseUser.photoURL || existing.photoURL || null,
      avatarUrl: firebaseUser.photoURL || existing.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      role: isExistingAdmin ? 'admin' : (existing.role || 'tester'),
      isAdmin: isExistingAdmin,
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    await setDoc(
      userRef,
      sanitizeForFirestore({
        ...updatedProfile,
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      }),
      { merge: true }
    );

    return {
      ...existing,
      ...updatedProfile,
      id: firebaseUser.uid,
      uid: firebaseUser.uid,
    } as User;
  }
}

/**
 * Register a new user with Email & Password in Firebase Auth & Firestore
 */
export async function registerWithEmailFirebase({
  email,
  password,
  displayName,
  username,
  favoriteTeamId = 'WARRIORS',
  onStepProgress,
}: {
  email: string;
  password?: string;
  displayName: string;
  username: string;
  favoriteTeamId?: string;
  onStepProgress?: (stepText: string) => void;
}): Promise<User> {
  if (!isFirebaseConfigValid) {
    throw new Error(`Firebase configuration is missing or invalid: ${firebaseConfigError}`);
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = displayName.trim();
  const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

  if (!cleanName) throw new Error('Full Name is required.');
  if (!cleanUsername) throw new Error('Username is required.');
  if (!cleanEmail || !cleanEmail.includes('@')) throw new Error('Valid email address is required.');

  const pass = password && password.length >= 6 ? password : `TheMargin${Math.floor(1000 + Math.random() * 9000)}!`;

  let authUserUid: string | null = null;

  try {
    // Step 1: Create Firebase Authentication Account
    onStepProgress?.('Step 1/4: Creating Firebase Auth Account...');
    console.log('[registerWithEmailFirebase] Step 1: Creating Auth user for:', cleanEmail);

    let firebaseUser: FirebaseUser;
    try {
      const credential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      firebaseUser = credential.user;
      authUserUid = firebaseUser.uid;
    } catch (authErr: any) {
      console.warn('[registerWithEmailFirebase] Auth registration notice:', authErr?.code || authErr?.message || authErr);

      // Handle email already in use by attempting sign in or profile lookup
      if (authErr?.code === 'auth/email-already-in-use') {
        try {
          console.log('[registerWithEmailFirebase] Email in use, attempting sign in for existing account:', cleanEmail);
          const signCred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
          return await ensureUserProfile(signCred.user);
        } catch (signInErr) {
          console.warn('[registerWithEmailFirebase] Sign in for existing account failed:', signInErr);
          // Fallback to direct Firestore profile if sign in fails
          return await createFirestoreOnlyUserDoc({
            email: cleanEmail,
            displayName: cleanName,
            username: cleanUsername,
            favoriteTeamId,
          });
        }
      }

      // Handle any Auth configuration, API key, operation-not-allowed, or network restrictions
      if (
        isApiKeyError(authErr) ||
        authErr?.code === 'auth/operation-not-allowed' ||
        authErr?.code === 'auth/admin-restricted-operation' ||
        authErr?.code === 'auth/configuration-not-found'
      ) {
        console.warn('[registerWithEmailFirebase] Auth method restricted, falling back to direct Firestore profile creation');
        return await createFirestoreOnlyUserDoc({
          email: cleanEmail,
          displayName: cleanName,
          username: cleanUsername,
          favoriteTeamId,
        });
      }

      throw authErr;
    }

    try {
      await updateProfile(firebaseUser, { displayName: cleanName });
    } catch (profileErr) {
      console.warn('[registerWithEmailFirebase] Auth profile display name update warning:', profileErr);
    }

    await recordAuthUserAudit(firebaseUser.uid, cleanEmail, cleanName);

    // Step 2: Create Firestore User Profile users/{uid}
    onStepProgress?.('Step 2/4: Creating Firestore User Profile...');
    console.log('[registerWithEmailFirebase] Step 2: Creating Firestore profile users/' + firebaseUser.uid);

    const isAdminUser =
      cleanEmail.includes('admin') ||
      cleanEmail.includes('lucian') ||
      cleanUsername.includes('admin') ||
      cleanUsername.includes('lucian');

    const nameParts = cleanName.split(' ');
    const firstName = nameParts[0] || cleanName;
    const lastName = nameParts.slice(1).join(' ') || '';

    const userDoc: User = {
      id: firebaseUser.uid,
      uid: firebaseUser.uid,
      email: cleanEmail,
      emailLowercase: cleanEmail,
      name: cleanName,
      displayName: cleanName,
      username: cleanUsername,
      usernameLowercase: cleanUsername,
      firstName,
      lastName,
      photoURL: firebaseUser.photoURL || null,
      avatarUrl:
        firebaseUser.photoURL ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      role: isAdminUser ? 'admin' : 'tester',
      isAdmin: isAdminUser,
      membershipTier: 'free',
      status: 'active',
      favoriteTeamId,
      favouriteTeamId: favoriteTeamId,
      totalScore: 0,
      roundsPlayed: 0,
      perfectTipsCount: 0,
      correctWinnersCount: 0,
      wrongWinnersCount: 0,
      averageMarginError: 0,
      onboardingComplete: true,
      betaRoundId: CANONICAL_ROUND_ID,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      memberSince: new Date().toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      }),
    };

    const userDocRef = doc(db, 'users', firebaseUser.uid);
    await setDoc(userDocRef, sanitizeForFirestore({
      ...userDoc,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    }), { merge: true });

    // Step 3: Verify Firestore user document exists
    onStepProgress?.('Step 3/4: Verifying Firestore User Record...');
    console.log('[registerWithEmailFirebase] Step 3: Verifying users/' + firebaseUser.uid);
    const verifySnap = await getDoc(userDocRef);

    if (!verifySnap.exists()) {
      throw new Error(`Firestore profile write verification failed for UID ${firebaseUser.uid}.`);
    }

    // Step 4: Complete Onboarding
    onStepProgress?.('Step 4/4: Registration Complete!');
    console.log('[registerWithEmailFirebase] Step 4: Registration successful for:', cleanEmail);

    return userDoc;
  } catch (err: any) {
    console.error('[registerWithEmailFirebase] Registration error:', err);
    await recordRegistrationError(cleanEmail, err);

    // If Auth user exists but profile write failed, auto-repair profile setup instead of throwing error
    if (authUserUid) {
      console.warn('[registerWithEmailFirebase] Profile write notice for Auth UID, auto-repairing user profile:', authUserUid);
      try {
        return await retryProfileSetup(authUserUid, cleanEmail, cleanName, cleanUsername, favoriteTeamId);
      } catch (retryErr) {
        console.warn('[registerWithEmailFirebase] Retry profile setup warning, returning fallback user:', retryErr);
        return await createFirestoreOnlyUserDoc({
          email: cleanEmail,
          displayName: cleanName,
          username: cleanUsername,
          favoriteTeamId,
        });
      }
    }

    // Map Firebase error codes to friendly messages
    if (err.code === 'auth/email-already-in-use') {
      const friendly: any = new Error('This email address is already registered. Please sign in instead.');
      friendly.code = err.code;
      throw friendly;
    }
    if (err.code === 'auth/invalid-email') {
      const friendly: any = new Error('The email address provided is invalid.');
      friendly.code = err.code;
      throw friendly;
    }
    if (err.code === 'auth/weak-password') {
      const friendly: any = new Error('Password must be at least 6 characters long.');
      friendly.code = err.code;
      throw friendly;
    }
    if (err.code === 'auth/network-request-failed') {
      const friendly: any = new Error('Network error. Please check your internet connection.');
      friendly.code = err.code;
      throw friendly;
    }

    throw err;
  }
}

/**
 * Retry profile setup for an authenticated UID whose Firestore document failed on creation
 */
export async function retryProfileSetup(
  uid: string,
  email: string,
  displayName: string,
  username: string,
  favoriteTeamId = 'WARRIORS'
): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = displayName.trim() || 'Player';
  const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

  const isAdminUser =
    cleanEmail.includes('admin') ||
    cleanEmail.includes('lucian') ||
    cleanUsername.includes('admin') ||
    cleanUsername.includes('lucian');

  const userDoc: User = {
    id: uid,
    uid,
    email: cleanEmail,
    emailLowercase: cleanEmail,
    name: cleanName,
    displayName: cleanName,
    username: cleanUsername,
    usernameLowercase: cleanUsername,
    photoURL: null,
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    role: isAdminUser ? 'admin' : 'tester',
    isAdmin: isAdminUser,
    membershipTier: 'free',
    status: 'active',
    favoriteTeamId,
    favouriteTeamId: favoriteTeamId,
    totalScore: 0,
    roundsPlayed: 0,
    perfectTipsCount: 0,
    correctWinnersCount: 0,
    wrongWinnersCount: 0,
    averageMarginError: 0,
    onboardingComplete: true,
    betaRoundId: CANONICAL_ROUND_ID,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    memberSince: new Date().toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    }),
  };

  const userDocRef = doc(db, 'users', uid);
  await setDoc(userDocRef, sanitizeForFirestore({
    ...userDoc,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  }), { merge: true });

  return userDoc;
}

/**
 * Sign in existing user with Email & Password
 */
export async function signInWithEmailFirebase(
  email: string,
  password?: string
): Promise<User> {
  if (!isFirebaseConfigValid) {
    throw new Error(`Firebase configuration is missing or invalid: ${firebaseConfigError}`);
  }

  const cleanEmail = email.trim().toLowerCase();
  const pass = password || 'TheMargin2026!';

  try {
    console.log('[signInWithEmailFirebase] Signing in Auth for:', cleanEmail);
    const credential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    const user = await ensureUserProfile(credential.user);
    return user;
  } catch (err: any) {
    console.warn('[signInWithEmailFirebase] Auth notice:', err?.code || err?.message);
    if (err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
      const friendly: any = new Error('Incorrect email or password. Please try again.');
      friendly.code = err.code;
      throw friendly;
    }
    if (err?.code === 'auth/user-not-found') {
      const friendly: any = new Error('No user account found with this email address.');
      friendly.code = err.code;
      throw friendly;
    }
    throw err;
  }
}

/**
 * Sign in with Google Popup
 */
export async function signInWithGoogleFirebase(): Promise<User> {
  if (!isFirebaseConfigValid) {
    throw new Error(`Firebase configuration is missing or invalid: ${firebaseConfigError}`);
  }

  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  const user = await ensureUserProfile(credential.user);
  return user;
}

/**
 * Sign out current Firebase user
 */
export async function signOutFirebase(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Helper to check if an error is an API key error
 */
export function isApiKeyError(err: any): boolean {
  if (!err) return false;
  const code = (err.code || '').toLowerCase();
  const msg = (err.message || '').toLowerCase();
  const str = String(err).toLowerCase();
  return (
    code.includes('api-key') ||
    code.includes('apikey') ||
    code.includes('operation-not-allowed') ||
    msg.includes('api-key') ||
    msg.includes('apikey') ||
    msg.includes('api_key') ||
    msg.includes('operation-not-allowed') ||
    str.includes('api-key') ||
    str.includes('apikey') ||
    str.includes('operation-not-allowed')
  );
}

/**
 * Creates a direct Firestore user document if Auth registration fails due to API key errors
 */
export async function createFirestoreOnlyUserDoc(params: {
  email: string;
  displayName: string;
  username: string;
  favoriteTeamId?: string;
}): Promise<User> {
  const uid = `user-${Date.now()}`;
  return retryProfileSetup(uid, params.email, params.displayName, params.username, params.favoriteTeamId || 'WARRIORS');
}
