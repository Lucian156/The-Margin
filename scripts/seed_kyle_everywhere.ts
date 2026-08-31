import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import firebaseConfigJson from '../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

const namedDatabaseId = firebaseConfigJson.firestoreDatabaseId;

const app1 = initializeApp(firebaseConfig, 'app-named-' + Date.now());
const dbNamed = getFirestore(app1, namedDatabaseId);

const app2 = initializeApp(firebaseConfig, 'app-default-' + Date.now());
const dbDefault = getFirestore(app2);

const auth = getAuth(app1);

async function seedKyleEverywhere() {
  console.log('Seeding Kyle Campbell across all database instances & auth...');

  const email = 'kyle.campbell@themargin.app';
  const pass = 'TheMargin2026!';
  const name = 'Kyle Campbell';
  const username = 'kyle_campbell';

  let authUid = 'kyle-campbell-uid';

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    authUid = cred.user.uid;
    console.log('✅ Created Firebase Auth account with UID:', authUid);
  } catch (err: any) {
    console.log('Auth creation note:', err?.code || err?.message);
    if (err?.code === 'auth/email-already-in-use') {
      try {
        const signCred = await signInWithEmailAndPassword(auth, email, pass);
        authUid = signCred.user.uid;
        console.log('✅ Signed in existing Firebase Auth account UID:', authUid);
      } catch (signInErr) {
        console.warn('Sign in existing Auth failed:', signInErr);
      }
    }
  }

  const profileData = {
    id: authUid,
    uid: authUid,
    email: email,
    emailLowercase: email.toLowerCase(),
    displayName: name,
    name: name,
    username: username,
    usernameLowercase: username.toLowerCase(),
    role: 'tester',
    membershipTier: 'margin-plus',
    status: 'active',
    favoriteTeamId: 'WARRIORS',
    favouriteTeamId: 'WARRIORS',
    betaRoundId: 'nrl-2026-round-24',
    onboardingComplete: true,
    totalScore: 0,
    roundsPlayed: 0,
    perfectTipsCount: 0,
    correctWinnersCount: 0,
    wrongWinnersCount: 0,
    averageMarginError: 0,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  // Write to named database
  await setDoc(doc(dbNamed, 'users', authUid), profileData, { merge: true });
  await setDoc(doc(dbNamed, 'users', 'kyle_campbell'), profileData, { merge: true });
  await setDoc(doc(dbNamed, 'users', 'kyle-campbell-uid'), profileData, { merge: true });

  // Write to default database as well
  try {
    await setDoc(doc(dbDefault, 'users', authUid), profileData, { merge: true });
    await setDoc(doc(dbDefault, 'users', 'kyle_campbell'), profileData, { merge: true });
    await setDoc(doc(dbDefault, 'users', 'kyle-campbell-uid'), profileData, { merge: true });
    console.log('✅ Wrote to default database as well');
  } catch (e) {
    console.warn('Could not write to default database:', e);
  }

  // Record auth record
  try {
    await setDoc(doc(dbNamed, 'auth_records', authUid), {
      uid: authUid,
      email: email,
      displayName: name,
      createdAt: new Date().toISOString(),
      lastSignInAt: new Date().toISOString(),
    }, { merge: true });
  } catch (e) {
    console.warn('Could not write auth_records:', e);
  }

  console.log('Finished seeding Kyle Campbell everywhere!');
  process.exit(0);
}

seedKyleEverywhere().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
