/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PredictionDoc {
  id: string;
  userId: string;
  fixtureId: string;
  roundId: string;
  predictedWinnerTeamId: string;
  predictedMargin: number;
  submittedAt?: string;
  archived?: boolean;
}

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { db, auth } from './firebase';
import {
  Fixture,
  HeadToHeadLeague,
  HeadToHeadMatchup,
  HeadToHeadStanding,
  League,
  Tip,
  User,
  NRLRound,
} from '../types';

import { ROUND_25_FIXTURES, CANONICAL_ROUND_ID } from '../config/round25';

export const OFFICIAL_ROUND_25_FIXTURES: Fixture[] = ROUND_25_FIXTURES;
export const OFFICIAL_ROUND_24_FIXTURES: Fixture[] = ROUND_25_FIXTURES;

// Helper to check if a value is a Firestore sentinel (serverTimestamp, FieldValue, Timestamp)
function isFirestoreSentinel(val: any): boolean {
  if (!val || typeof val !== 'object') return false;
  if (val instanceof Date) return true;
  if (val.constructor && (val.constructor.name === 'FieldValue' || val.constructor.name === 'Timestamp')) return true;
  if (typeof val._methodName === 'string') return true;
  if (typeof val.isEqual === 'function' && typeof val.toMillis === 'function') return true;
  return false;
}

// Utility to strip undefined properties before sending to Firestore
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

// Seed Fixtures to Firestore if empty
export async function seedFirestoreFixtures(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, 'fixtures'));
    if (snap.empty) {
      for (const fix of OFFICIAL_ROUND_24_FIXTURES) {
        await setDoc(doc(db, 'fixtures', fix.id), sanitizeForFirestore(fix));
      }
    }
  } catch (err) {
    console.warn('Firestore fixtures seed check:', err);
  }
}

// User Profile Operations
export async function fetchUserFromFirestore(userId: string): Promise<User | null> {
  try {
    const docRef = doc(db, 'users', userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as User;
    }
    return null;
  } catch (err) {
    console.error('Error fetching user:', err);
    return null;
  }
}

export async function saveUserToFirestore(user: User): Promise<void> {
  try {
    await setDoc(doc(db, 'users', user.id), sanitizeForFirestore(user), { merge: true });
  } catch (err) {
    console.error('Error saving user to Firestore:', err);
  }
}

export async function fetchAllUsersFromFirestore(): Promise<User[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    const list: User[] = [];
    snap.forEach((d) => {
      list.push(d.data() as User);
    });
    return list;
  } catch (err) {
    console.error('Error fetching all users:', err);
    return [];
  }
}

export function subscribeAllUsersFromFirestore(callback: (users: User[]) => void): () => void {
  try {
    return onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const list: User[] = [];
        snap.forEach((d) => list.push(d.data() as User));
        callback(list);
      },
      (err) => console.warn('User subscription notice:', err)
    );
  } catch (e) {
    console.warn('User subscription setup error:', e);
    return () => {};
  }
}

export async function fetchAuthRecordsFromFirestore(): Promise<any[]> {
  try {
    const snap = await getDocs(collection(db, 'auth_records'));
    const list: any[] = [];
    snap.forEach((d) => list.push(d.data()));
    return list;
  } catch (err) {
    console.warn('Error fetching auth_records:', err);
    return [];
  }
}

export async function fetchRegistrationErrorsFromFirestore(): Promise<any[]> {
  try {
    const snap = await getDocs(collection(db, 'registration_errors'));
    const list: any[] = [];
    snap.forEach((d) => list.push(d.data()));
    // Sort newest errors first
    return list.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
  } catch (err) {
    console.warn('Error fetching registration_errors:', err);
    return [];
  }
}

export async function repairMissingUserRecords(): Promise<{
  totalAuthCount: number;
  totalFirestoreCount: number;
  repairedCount: number;
  patchedCount: number;
  repairedUsernames: string[];
}> {
  console.log('[repairMissingUserRecords] Starting audit and repair process...');
  const [authRecords, firestoreUsers] = await Promise.all([
    fetchAuthRecordsFromFirestore(),
    fetchAllUsersFromFirestore(),
  ]);

  const userMap = new Map<string, User>();
  firestoreUsers.forEach((u) => {
    if (u && (u.uid || u.id)) {
      userMap.set(u.uid || u.id, u);
    }
  });

  let repairedCount = 0;
  let patchedCount = 0;
  const repairedUsernames: string[] = [];

  // 1. Check every Auth record to ensure a corresponding Firestore document exists in users/{uid}
  for (const authRec of authRecords) {
    const uid = authRec.uid;
    if (!uid) continue;

    const existingDoc = userMap.get(uid);
    if (!existingDoc) {
      const cleanEmail = (authRec.email || '').toLowerCase().trim();
      const cleanName = authRec.displayName || cleanEmail.split('@')[0] || 'Player';
      const cleanUsername = cleanName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const isAdminUser = cleanEmail.includes('admin') || cleanEmail.includes('lucian');

      const repairedUserDoc: User = {
        id: uid,
        uid: uid,
        email: cleanEmail,
        name: cleanName,
        displayName: cleanName,
        username: cleanUsername,
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        role: isAdminUser ? 'admin' : 'player',
        isAdmin: isAdminUser,
        membershipTier: 'free',
        status: 'active',
        favoriteTeamId: 'WARRIORS',
        totalScore: 0,
        roundsPlayed: 0,
        perfectTipsCount: 0,
        correctWinnersCount: 0,
        wrongWinnersCount: 0,
        averageMarginError: 0,
        createdAt: authRec.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: authRec.lastSignInAt || new Date().toISOString(),
        memberSince: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      };

      await setDoc(doc(db, 'users', uid), sanitizeForFirestore({
        ...repairedUserDoc,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }), { merge: true });

      repairedCount++;
      repairedUsernames.push(`${cleanName} (@${cleanUsername}) [${cleanEmail}]`);
      console.log('[repairMissingUserRecords] Created missing Firestore document for Auth user:', uid);
    }
  }

  // 2. Patch existing Firestore documents missing required fields
  for (const u of firestoreUsers) {
    const uid = u.uid || u.id;
    if (!uid) continue;

    const missingFields: Record<string, any> = {};
    if (!u.uid) missingFields.uid = uid;
    if (!u.email) missingFields.email = '';
    if (!u.displayName) missingFields.displayName = u.name || 'Player';
    if (!u.username) missingFields.username = (u.displayName || u.name || 'player').toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (!u.createdAt) missingFields.createdAt = new Date().toISOString();
    if (!u.membershipTier) missingFields.membershipTier = 'free';
    if (!u.role) missingFields.role = u.isAdmin ? 'admin' : 'tester';
    if (!u.status) missingFields.status = 'active';
    if (!u.betaRoundId) missingFields.betaRoundId = 'nrl-2026-round-24';

    if (Object.keys(missingFields).length > 0) {
      await setDoc(doc(db, 'users', uid), sanitizeForFirestore(missingFields), { merge: true });
      patchedCount++;
      console.log('[repairMissingUserRecords] Patched missing fields for user doc:', uid, missingFields);
    }
  }

  // 3. Normalize legacy predictions and picks into predictions/{uid_fixtureId}
  let migratedPredictionsCount = 0;
  try {
    const picksSnap = await getDocs(collection(db, 'picks'));
    for (const d of picksSnap.docs) {
      const data = d.data();
      const uid = data.userId || data.uid;
      const fixId = data.fixtureId;
      if (uid && fixId) {
        const canonicalDocId = `${uid}_${fixId}`;
        const teamId = data.predictedWinnerTeamId || data.selectedTeamId || data.winnerId || '';
        const margin = Number(data.predictedMargin ?? data.margin ?? 0);

        const predPayload = {
          id: canonicalDocId,
          userId: uid,
          fixtureId: fixId,
          roundId: 'nrl-2026-round-24',
          predictedWinnerTeamId: teamId,
          predictedMargin: margin,
          confidence: data.confidence ?? null,
          status: 'submitted',
          submittedAt: data.submittedAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lockedAt: null,
          source: data.source || 'user',
          username: data.username || '',
          userEmail: data.userEmail || data.email || '',
          userDisplayName: data.userDisplayName || data.name || '',
        };

        await setDoc(doc(db, 'predictions', canonicalDocId), sanitizeForFirestore(predPayload), { merge: true });
        migratedPredictionsCount++;
      }
    }
  } catch (err) {
    console.warn('[repairMissingUserRecords] Prediction normalization notice:', err);
  }

  // 4. Record Migration Audit Event in adminAuditEvents
  try {
    const auditId = `audit-migration-${Date.now()}`;
    await setDoc(doc(db, 'adminAuditEvents', auditId), {
      id: auditId,
      eventType: 'SYSTEM_REPAIR_AND_MIGRATION',
      totalAuthCount: authRecords.length,
      totalFirestoreCount: firestoreUsers.length,
      repairedUserCount: repairedCount,
      patchedUserCount: patchedCount,
      migratedPredictionsCount,
      repairedUsernames,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString(),
    });
  } catch (auditErr) {
    console.warn('[repairMissingUserRecords] Failed to log audit event:', auditErr);
  }

  const updatedFirestoreUsers = await fetchAllUsersFromFirestore();

  return {
    totalAuthCount: authRecords.length,
    totalFirestoreCount: updatedFirestoreUsers.length,
    repairedCount,
    patchedCount,
    repairedUsernames,
  };
}

// Fixture Operations
export async function fetchFixturesFromFirestore(): Promise<Fixture[]> {
  try {
    const snap = await getDocs(collection(db, 'fixtures'));
    if (snap.empty) {
      await seedFirestoreFixtures();
      return OFFICIAL_ROUND_24_FIXTURES;
    }
    const list: Fixture[] = [];
    snap.forEach((d) => list.push(d.data() as Fixture));

    // Ensure all 8 official Round 24 fixtures are present even if Firestore has only a partial set
    const fixMap = new Map<string, Fixture>();
    OFFICIAL_ROUND_24_FIXTURES.forEach((f) => fixMap.set(f.id, f));
    list.forEach((f) => {
      if (f && f.id) {
        fixMap.set(f.id, { ...fixMap.get(f.id), ...f });
      }
    });

    return Array.from(fixMap.values());
  } catch (err) {
    console.warn('Fallback to local fixtures:', err);
    return OFFICIAL_ROUND_24_FIXTURES;
  }
}

export async function updateFixtureInFirestore(fixture: Fixture): Promise<void> {
  try {
    await setDoc(doc(db, 'fixtures', fixture.id), sanitizeForFirestore(fixture), { merge: true });
  } catch (err) {
    console.error('Error updating fixture in Firestore:', err);
  }
}

// Prediction / Picks Operations
export async function saveTipToFirestore(tip: Tip): Promise<void> {
  try {
    const roundId = tip.roundId || 'round-24';
    const pickId = `${tip.userId}_${roundId}_${tip.fixtureId}`;
    const predDocId = `${tip.userId}_${tip.fixtureId}`;

    const pickData = {
      id: pickId,
      userId: tip.userId,
      uid: tip.userId,
      username: tip.username || '',
      userDisplayName: tip.username || 'Player',
      roundId,
      fixtureId: tip.fixtureId,
      selectedTeamId: tip.predictedWinnerTeamId,
      predictedWinnerTeamId: tip.predictedWinnerTeamId,
      predictedMargin: Number(tip.predictedMargin),
      status: 'submitted',
      submittedAt: tip.submittedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isLocked: tip.isLocked || false,
    };

    const batch = writeBatch(db);
    batch.set(doc(db, 'picks', pickId), sanitizeForFirestore(pickData), { merge: true });
    batch.set(doc(db, 'predictions', predDocId), sanitizeForFirestore({ ...tip, id: predDocId }), { merge: true });
    await batch.commit();
  } catch (err) {
    console.error('Error saving tip to Firestore picks & predictions:', err);
    throw err;
  }
}

export async function saveRoundPicksToFirestore(
  roundId: string,
  selections: Array<{ fixtureId: string; selectedTeamId: string; selectedTeamName?: string; predictedMargin: number }>,
  user: { id: string; email?: string; name?: string; username?: string }
): Promise<void> {
  if (!user || !user.id) {
    throw new Error('User required to save picks');
  }

  const batch = writeBatch(db);
  const nowIso = new Date().toISOString();

  selections.forEach((sel) => {
    const pickId = `${user.id}_${roundId}_${sel.fixtureId}`;
    const predDocId = `${user.id}_${sel.fixtureId}`;

    const pickRef = doc(db, 'picks', pickId);
    const predRef = doc(db, 'predictions', predDocId);

    const pickPayload = {
      id: pickId,
      userId: user.id,
      uid: user.id,
      userEmail: user.email || '',
      userDisplayName: user.name || user.username || 'Player',
      username: user.username || '',
      roundId: String(roundId),
      fixtureId: String(sel.fixtureId),
      selectedTeamId: sel.selectedTeamId,
      selectedTeamName: sel.selectedTeamName || '',
      predictedWinnerTeamId: sel.selectedTeamId,
      predictedMargin: Number(sel.predictedMargin),
      status: 'submitted',
      submittedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isLocked: false,
    };

    const tipPayload = {
      id: predDocId,
      userId: user.id,
      username: user.username || user.name || 'Player',
      roundId: String(roundId),
      fixtureId: String(sel.fixtureId),
      predictedWinnerTeamId: sel.selectedTeamId,
      predictedMargin: Number(sel.predictedMargin),
      submittedAt: nowIso,
      isLocked: false,
    };

    batch.set(pickRef, sanitizeForFirestore(pickPayload), { merge: true });
    batch.set(predRef, sanitizeForFirestore(tipPayload), { merge: true });
  });

  await batch.commit();
  console.log(`[saveRoundPicksToFirestore] Successfully saved ${selections.length} picks for UID ${user.id}`);
}

export function normalizeTipDoc(p: any): Tip {
  const uid = String(p?.userId || p?.uid || p?.username || 'unknown');
  const teamId = String(p?.predictedWinnerTeamId || p?.selectedTeamId || p?.winnerId || '');
  const margin = Number(p?.predictedMargin ?? p?.margin ?? 0);
  const fixtureId = String(p?.fixtureId || '');

  let submittedAtStr = new Date().toISOString();
  if (p?.submittedAt) {
    if (typeof p.submittedAt === 'string') {
      submittedAtStr = p.submittedAt;
    } else if (p.submittedAt.toDate && typeof p.submittedAt.toDate === 'function') {
      submittedAtStr = p.submittedAt.toDate().toISOString();
    } else if (typeof p.submittedAt === 'object' && p.submittedAt.seconds) {
      submittedAtStr = new Date(p.submittedAt.seconds * 1000).toISOString();
    }
  }

  return {
    id: p?.id || `tip-${uid}-${fixtureId}`,
    userId: uid,
    username: p?.username || p?.userDisplayName || p?.name || uid,
    userEmail: p?.userEmail || p?.email || '',
    roundId: String(p?.roundId || 'round-24'),
    fixtureId,
    predictedWinnerTeamId: teamId,
    selectedTeamId: teamId,
    predictedMargin: margin,
    submittedAt: submittedAtStr,
    isLocked: !!p?.isLocked,
  } as Tip;
}

export async function fetchUserTipsFromFirestore(userId: string): Promise<Tip[]> {
  try {
    const allTips = await fetchAllTipsFromFirestore();
    const target = (userId || '').toLowerCase().trim();
    if (!target) return [];

    const users = await fetchAllUsersFromFirestore();
    const user = users.find((u) =>
      (u.id && u.id.toLowerCase() === target) ||
      (u.uid && u.uid.toLowerCase() === target) ||
      (u.username && u.username.toLowerCase() === target) ||
      (u.email && u.email.toLowerCase() === target)
    );

    const aliases = new Set<string>([target]);
    if (user) {
      if (user.id) aliases.add(user.id.toLowerCase());
      if (user.uid) aliases.add(user.uid.toLowerCase());
      if (user.username) aliases.add(user.username.toLowerCase());
      if (user.email) aliases.add(user.email.toLowerCase());
    }

    return allTips.filter((t) => {
      const uid = (t.userId || (t as any).uid || '').toString().toLowerCase();
      const uname = (t.username || '').toString().toLowerCase();
      const uemail = ((t as any).userEmail || (t as any).email || '').toString().toLowerCase();
      return aliases.has(uid) || aliases.has(uname) || aliases.has(uemail);
    });
  } catch (err) {
    console.error('Error fetching user tips:', err);
    return [];
  }
}

export async function fetchAllTipsFromFirestore(): Promise<any[]> {
  try {
    const snapPicks = await getDocs(collection(db, 'picks'));
    const list: any[] = [];
    snapPicks.forEach((d) => {
      const data = d.data();
      list.push(normalizeTipDoc({ ...data, id: data.id || d.id }));
    });

    const snapPreds = await getDocs(collection(db, 'predictions'));
    const pickMap = new Map<string, any>();
    list.forEach((p) => {
      const uid = p.userId || p.uid;
      if (uid && p.fixtureId) {
        const key = `${uid}_${p.fixtureId}`;
        pickMap.set(key, p);
      }
    });

    snapPreds.forEach((d) => {
      const p = normalizeTipDoc({ ...d.data(), id: d.id });
      const uid = p.userId || (p as any).uid;
      if (uid && p.fixtureId) {
        const key = `${uid}_${p.fixtureId}`;
        if (!pickMap.has(key)) {
          pickMap.set(key, p);
        }
      }
    });

    return Array.from(pickMap.values());
  } catch (err) {
    console.error('Error fetching all tips:', err);
    return [];
  }
}

export function subscribeAllTipsFromFirestore(callback: (tips: any[]) => void): () => void {
  try {
    let picksList: any[] = [];
    let predsList: any[] = [];

    const emitMerged = () => {
      const map = new Map<string, any>();
      picksList.forEach((p) => {
        const norm = normalizeTipDoc(p);
        const uid = norm.userId;
        if (uid && norm.fixtureId) {
          map.set(`${uid}_${norm.fixtureId}`, norm);
        }
      });
      predsList.forEach((p) => {
        const norm = normalizeTipDoc(p);
        const uid = norm.userId;
        if (uid && norm.fixtureId) {
          const key = `${uid}_${norm.fixtureId}`;
          if (!map.has(key)) {
            map.set(key, norm);
          }
        }
      });
      callback(Array.from(map.values()));
    };

    const unsubPicks = onSnapshot(collection(db, 'picks'), (snap) => {
      picksList = [];
      snap.forEach((d) => picksList.push({ ...d.data(), id: d.id }));
      emitMerged();
    }, (err) => console.warn('Picks listener notice:', err));

    const unsubPreds = onSnapshot(collection(db, 'predictions'), (snap) => {
      predsList = [];
      snap.forEach((d) => predsList.push({ ...d.data(), id: d.id }));
      emitMerged();
    }, (err) => console.warn('Predictions listener notice:', err));

    return () => {
      unsubPicks();
      unsubPreds();
    };
  } catch (e) {
    console.warn('Tips subscription setup error:', e);
    return () => {};
  }
}

// League Operations
export async function fetchLeaguesFromFirestore(): Promise<League[]> {
  try {
    const snap = await getDocs(collection(db, 'leagues'));
    const list: League[] = [];
    snap.forEach((d) => list.push(d.data() as League));
    return list;
  } catch (err) {
    console.error('Error fetching leagues:', err);
    return [];
  }
}

export async function saveLeagueToFirestore(league: League): Promise<void> {
  try {
    await setDoc(doc(db, 'leagues', league.id), sanitizeForFirestore(league), { merge: true });
  } catch (err) {
    console.error('Error saving league:', err);
  }
}

// Head-To-Head Operations
export async function fetchH2HLeaguesFromFirestore(): Promise<HeadToHeadLeague[]> {
  try {
    const snap = await getDocs(collection(db, 'headToHeadLeagues'));
    const list: HeadToHeadLeague[] = [];
    snap.forEach((d) => list.push(d.data() as HeadToHeadLeague));
    return list;
  } catch (err) {
    console.error('Error fetching H2H leagues:', err);
    return [];
  }
}

export async function saveH2HLeagueToFirestore(league: HeadToHeadLeague): Promise<void> {
  try {
    await setDoc(doc(db, 'headToHeadLeagues', league.id), sanitizeForFirestore(league), { merge: true });
  } catch (err) {
    console.error('Error saving H2H league:', err);
  }
}

export async function fetchH2HMatchupsFromFirestore(leagueId?: string): Promise<HeadToHeadMatchup[]> {
  try {
    const col = collection(db, 'headToHeadMatchups');
    const q = leagueId ? query(col, where('leagueId', '==', leagueId)) : col;
    const snap = await getDocs(q);
    const list: HeadToHeadMatchup[] = [];
    snap.forEach((d) => list.push(d.data() as HeadToHeadMatchup));
    return list;
  } catch (err) {
    console.error('Error fetching H2H matchups:', err);
    return [];
  }
}

export async function saveH2HMatchupToFirestore(matchup: HeadToHeadMatchup): Promise<void> {
  try {
    await setDoc(doc(db, 'headToHeadMatchups', matchup.id), sanitizeForFirestore(matchup), { merge: true });
  } catch (err) {
    console.error('Error saving H2H matchup:', err);
  }
}

export async function fetchH2HStandingsFromFirestore(leagueId?: string): Promise<HeadToHeadStanding[]> {
  try {
    const col = collection(db, 'headToHeadStandings');
    const q = leagueId ? query(col, where('leagueId', '==', leagueId)) : col;
    const snap = await getDocs(q);
    const list: HeadToHeadStanding[] = [];
    snap.forEach((d) => list.push(d.data() as HeadToHeadStanding));
    return list;
  } catch (err) {
    console.error('Error fetching H2H standings:', err);
    return [];
  }
}

export async function saveH2HStandingToFirestore(standing: HeadToHeadStanding): Promise<void> {
  try {
    const docId = `${standing.leagueId}_${standing.userId}`;
    await setDoc(doc(db, 'headToHeadStandings', docId), sanitizeForFirestore({ ...standing, id: docId }), { merge: true });
  } catch (err) {
    console.error('Error saving H2H standing:', err);
  }
}

// App Settings (e.g. Round Schedule Confirmation)
export interface AppSettings {
  scheduleConfirmed: boolean;
  scheduleConfirmedBy?: string;
  scheduleConfirmedAt?: string;
  unconfirmedAt?: string;
}

const APP_SETTINGS_KEY = 'the_margin_app_settings';

export function getAppSettingsLocal(): AppSettings {
  return {
    scheduleConfirmed: true,
    scheduleConfirmedBy: 'Official NRL Draw',
    scheduleConfirmedAt: '2026-08-01T00:00:00.000Z',
  };
}

export function saveAppSettingsLocal(settings: AppSettings): void {
  try {
    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify({
      scheduleConfirmed: true,
      scheduleConfirmedBy: 'Official NRL Draw',
      scheduleConfirmedAt: '2026-08-01T00:00:00.000Z',
    }));
  } catch (e) {
    console.error('Failed to save local app settings', e);
  }
}

export async function fetchAppSettingsFromFirestore(): Promise<AppSettings> {
  const confirmedSettings: AppSettings = {
    scheduleConfirmed: true,
    scheduleConfirmedBy: 'Official NRL Draw',
    scheduleConfirmedAt: '2026-08-01T00:00:00.000Z',
  };
  saveAppSettingsLocal(confirmedSettings);
  return confirmedSettings;
}

export async function updateAppSettingsInFirestore(settings: AppSettings): Promise<void> {
  const cleanSettings: AppSettings = {
    scheduleConfirmed: true,
    scheduleConfirmedBy: 'Official NRL Draw',
    scheduleConfirmedAt: new Date().toISOString(),
  };

  saveAppSettingsLocal(cleanSettings);

  try {
    const docRef = doc(db, 'appSettings', 'round24');
    await setDoc(
      docRef,
      {
        scheduleConfirmed: true,
        scheduleConfirmedBy: 'Official NRL Draw',
        scheduleConfirmedAt: cleanSettings.scheduleConfirmedAt,
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Error saving app settings:', err);
  }
}

// Feedback submission
export async function submitFeedbackToFirestore(feedback: {
  userId: string;
  category: string;
  whatHappened: string;
  whatExpected: string;
  page: string;
  contactPermission: boolean;
}): Promise<void> {
  try {
    const id = `fb-${Date.now()}`;
    await setDoc(doc(db, 'feedback', id), sanitizeForFirestore({
      id,
      ...feedback,
      createdAt: new Date().toISOString(),
    }));
  } catch (err) {
    console.error('Error submitting feedback:', err);
  }
}
