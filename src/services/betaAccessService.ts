/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { signInAnonymously, User as FirebaseUser } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export interface BetaAccessInput {
  displayName: string;
  email: string;
  favouriteTeamId?: string | null;
}

export async function createRound25BetaTester(input: BetaAccessInput) {
  const displayName = input.displayName.trim();
  const email = input.email.trim().toLowerCase();

  if (displayName.length < 2) {
    throw new Error('Enter your name.');
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Enter a valid email address.');
  }

  try {
    const existingEmailQuery = query(
      collection(db, 'users'),
      where('emailLowercase', '==', email),
      where('status', '==', 'active'),
      limit(1)
    );

    const existingEmail = await getDocs(existingEmailQuery);

    if (!existingEmail.empty && existingEmail.docs[0].id !== auth.currentUser?.uid) {
      throw new Error(
        'This email is already registered for the beta. Use the original browser or contact the administrator.'
      );
    }
  } catch (err: any) {
    if (err?.message?.includes('already registered')) {
      throw err;
    }
    // If querying Firestore fails due to rules or missing index, continue to set user doc
    console.warn('Existing email check warning:', err);
  }

  let firebaseUser: FirebaseUser;

  if (auth.currentUser) {
    firebaseUser = auth.currentUser;
  } else {
    try {
      const credential = await signInAnonymously(auth);
      firebaseUser = credential.user;
    } catch (authErr: any) {
      console.error('Anonymous Auth Error:', authErr);
      if (authErr?.code === 'auth/operation-not-allowed') {
        throw new Error('Beta access is not enabled. Please contact the administrator.');
      }
      throw new Error(authErr?.message || 'Could not initiate anonymous beta session.');
    }
  }

  const userReference = doc(db, 'users', firebaseUser.uid);
  const existingProfile = await getDoc(userReference).catch(() => null);

  const profileData = {
    uid: firebaseUser.uid,
    displayName,
    displayNameLowercase: displayName.toLowerCase(),
    email,
    emailLowercase: email,
    favouriteTeamId: input.favouriteTeamId ?? null,
    role: 'tester',
    membershipTier: 'free',
    status: 'active',
    accessMode: 'round-25-beta',
    activeRoundId: 'nrl-2026-round-25',
    onboardingComplete: true,
    updatedAt: serverTimestamp(),
    lastAccessAt: serverTimestamp(),
    ...(existingProfile && existingProfile.exists()
      ? {}
      : {
          createdAt: serverTimestamp(),
        }),
  };

  await setDoc(userReference, profileData, { merge: true });

  const verification = await getDoc(userReference);

  if (!verification.exists()) {
    throw new Error('Your beta profile could not be saved.');
  }

  return {
    uid: firebaseUser.uid,
    profile: verification.data(),
  };
}
