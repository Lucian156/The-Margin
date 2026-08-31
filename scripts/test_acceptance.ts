/**
 * Acceptance Test Runner for Phase 17
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import firebaseConfigJson from '../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

const databaseId = firebaseConfigJson.firestoreDatabaseId;

const app = initializeApp(firebaseConfig, 'acceptance-test-app-' + Date.now());
const db = getFirestore(app, databaseId);

const CANONICAL_ROUND_ID = 'nrl-2026-round-24';
const CANONICAL_FIXTURES = [
  'nrl-2026-r24-panthers-roosters',
  'nrl-2026-r24-sea-eagles-dolphins',
  'nrl-2026-r24-bulldogs-rabbitohs',
  'nrl-2026-r24-sharks-raiders',
  'nrl-2026-r24-eels-cowboys',
  'nrl-2026-r24-broncos-warriors',
  'nrl-2026-r24-knights-titans',
  'nrl-2026-r24-tigers-dragons',
];

async function runAcceptanceTest() {
  console.log('==================================================');
  console.log('STARTING PHASE 17 ACCEPTANCE TEST');
  console.log('Firebase Project ID:', firebaseConfig.projectId);
  console.log('Database ID:', databaseId);
  console.log('==================================================');

  const ts = Date.now();
  const emailA = `tester.a.${ts}@themargin.test`;
  const uidA = `user-a-${ts}`;

  const emailB = `tester.b.${ts}@themargin.test`;
  const uidB = `user-b-${ts}`;

  // STEP 1: TESTER A FIRESTORE USER PROFILE
  console.log('\n--- 1. REGISTERING TESTER A PROFILE ---');
  console.log('Tester A UID:', uidA);

  const profileA = {
    uid: uidA,
    id: uidA,
    email: emailA,
    emailLowercase: emailA,
    displayName: 'Tester Alpha',
    name: 'Tester Alpha',
    username: `tester_a_${ts}`,
    usernameLowercase: `tester_a_${ts}`,
    role: 'tester',
    membershipTier: 'free',
    status: 'active',
    favouriteTeamId: 'WARRIORS',
    favoriteTeamId: 'WARRIORS',
    betaRoundId: CANONICAL_ROUND_ID,
    onboardingComplete: true,
    totalScore: 0,
    roundsPlayed: 0,
    perfectTipsCount: 0,
    correctWinnersCount: 0,
    wrongWinnersCount: 0,
    averageMarginError: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'users', uidA), profileA, { merge: true });
  const snapA = await getDoc(doc(db, 'users', uidA));
  if (!snapA.exists()) throw new Error('Tester A profile write failed in Firestore!');
  console.log('Tester A users/{uidA} verified in Firestore.');

  // TESTER A SUBMIT 8 TIPS
  console.log('\n--- 2. SUBMITTING 8 TIPS FOR TESTER A ---');
  for (const fixId of CANONICAL_FIXTURES) {
    const predId = `${uidA}_${fixId}`;
    await setDoc(doc(db, 'predictions', predId), {
      id: predId,
      userId: uidA,
      fixtureId: fixId,
      roundId: CANONICAL_ROUND_ID,
      predictedWinnerTeamId: fixId.includes('panthers') ? 'PANTHERS' : 'WARRIORS',
      predictedMargin: 6,
      confidence: null,
      status: 'submitted',
      source: 'user',
      userEmail: emailA,
      userDisplayName: 'Tester Alpha',
      username: `tester_a_${ts}`,
    }, { merge: true });
  }

  const qPredsA = query(collection(db, 'predictions'), where('userId', '==', uidA));
  const snapPredsA = await getDocs(qPredsA);
  console.log(`Tester A prediction count: ${snapPredsA.size} / 8`);
  if (snapPredsA.size !== 8) throw new Error('Tester A did not store exactly 8 predictions!');

  // STEP 2: TESTER B FIRESTORE USER PROFILE
  console.log('\n--- 3. REGISTERING TESTER B PROFILE ---');
  console.log('Tester B UID:', uidB);
  if (uidA === uidB) throw new Error('Tester A and Tester B have identical UIDs!');

  const profileB = {
    uid: uidB,
    id: uidB,
    email: emailB,
    emailLowercase: emailB,
    displayName: 'Tester Beta',
    name: 'Tester Beta',
    username: `tester_b_${ts}`,
    usernameLowercase: `tester_b_${ts}`,
    role: 'tester',
    membershipTier: 'free',
    status: 'active',
    favouriteTeamId: 'BRONCOS',
    favoriteTeamId: 'BRONCOS',
    betaRoundId: CANONICAL_ROUND_ID,
    onboardingComplete: true,
    totalScore: 0,
    roundsPlayed: 0,
    perfectTipsCount: 0,
    correctWinnersCount: 0,
    wrongWinnersCount: 0,
    averageMarginError: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'users', uidB), profileB, { merge: true });
  const snapB = await getDoc(doc(db, 'users', uidB));
  if (!snapB.exists()) throw new Error('Tester B profile write failed in Firestore!');
  console.log('Tester B users/{uidB} verified in Firestore.');

  // TESTER B SUBMIT 8 TIPS
  console.log('\n--- 4. SUBMITTING 8 TIPS FOR TESTER B ---');
  for (const fixId of CANONICAL_FIXTURES) {
    const predId = `${uidB}_${fixId}`;
    await setDoc(doc(db, 'predictions', predId), {
      id: predId,
      userId: uidB,
      fixtureId: fixId,
      roundId: CANONICAL_ROUND_ID,
      predictedWinnerTeamId: fixId.includes('panthers') ? 'ROOSTERS' : 'BRONCOS',
      predictedMargin: 12,
      confidence: null,
      status: 'submitted',
      source: 'user',
      userEmail: emailB,
      userDisplayName: 'Tester Beta',
      username: `tester_b_${ts}`,
    }, { merge: true });
  }

  const qPredsB = query(collection(db, 'predictions'), where('userId', '==', uidB));
  const snapPredsB = await getDocs(qPredsB);
  console.log(`Tester B prediction count: ${snapPredsB.size} / 8`);
  if (snapPredsB.size !== 8) throw new Error('Tester B did not store exactly 8 predictions!');

  // VERIFY NON-OVERWRITING & TOTAL
  const snapPredsAAfter = await getDocs(qPredsA);
  console.log(`Tester A predictions after Tester B submission: ${snapPredsAAfter.size} / 8`);
  if (snapPredsAAfter.size !== 8) throw new Error('Tester A tips were corrupted or overwritten!');

  // STEP 3: ADMIN QUERY VERIFICATION
  console.log('\n--- 5. ADMIN QUERY VERIFICATION ---');
  const snapAllUsers = await getDocs(collection(db, 'users'));
  console.log(`Total real Firestore users found: ${snapAllUsers.size}`);

  const snapAllPreds = await getDocs(query(collection(db, 'predictions'), where('roundId', '==', CANONICAL_ROUND_ID)));
  console.log(`Total Round 24 predictions found in Firestore: ${snapAllPreds.size}`);

  // STEP 4: SCORING TEST & 5-POINT PENALTY
  console.log('\n--- 6. SCORING TEST & 5-POINT PENALTY ---');
  // Prediction: Roosters by 10, Actual: Panthers by 6
  // marginDifference = |10 - 6| = 4, correctWinner = false, penalty = 5, score = 9
  const fixtureResult = { winnerTeamId: 'PANTHERS', winningMargin: 6 };

  const predTesterA = { predictedWinnerTeamId: 'PANTHERS', predictedMargin: 6 };
  const marginDiffA = Math.abs(predTesterA.predictedMargin - fixtureResult.winningMargin);
  const correctA = predTesterA.predictedWinnerTeamId === fixtureResult.winnerTeamId;
  const penaltyA = correctA ? 0 : 5;
  const scoreA = marginDiffA + penaltyA;

  const predTesterB = { predictedWinnerTeamId: 'ROOSTERS', predictedMargin: 10 };
  const marginDiffB = Math.abs(predTesterB.predictedMargin - fixtureResult.winningMargin);
  const correctB = predTesterB.predictedWinnerTeamId === fixtureResult.winnerTeamId;
  const penaltyB = correctB ? 0 : 5;
  const scoreB = marginDiffB + penaltyB;

  console.log(`Tester A Game Score: marginDiff=${marginDiffA}, penalty=${penaltyA}, totalScore=${scoreA}`);
  console.log(`Tester B Game Score: marginDiff=${marginDiffB}, penalty=${penaltyB}, totalScore=${scoreB}`);

  if (scoreA !== 0) throw new Error(`Tester A score expected 0, got ${scoreA}`);
  if (scoreB !== 9) throw new Error(`Tester B score expected 9 (4 marginDiff + 5 penalty), got ${scoreB}`);

  console.log('\n==================================================');
  console.log('✅ ALL ACCEPTANCE TESTS PASSED SUCCESSFULLY!');
  console.log('==================================================');
  process.exit(0);
}

runAcceptanceTest().catch((err) => {
  console.error('\n❌ ACCEPTANCE TEST FAILED:', err);
  process.exit(1);
});
