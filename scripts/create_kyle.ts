import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
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

const app = initializeApp(firebaseConfig, 'kyle-setup-app-' + Date.now());
const db = getFirestore(app, databaseId);

async function createKyleAccount() {
  console.log('==================================================');
  console.log('CREATING USER LOGIN FOR KYLE CAMPBELL');
  console.log('Firebase Project ID:', firebaseConfig.projectId);
  console.log('Database ID:', databaseId);
  console.log('==================================================');

  const uid = 'kyle-campbell-uid';
  const email = 'kyle.campbell@themargin.app';
  const name = 'Kyle Campbell';
  const username = 'kyle_campbell';

  const userProfile = {
    id: uid,
    uid: uid,
    email: email,
    emailLowercase: email.toLowerCase(),
    displayName: name,
    name: name,
    username: username,
    usernameLowercase: username.toLowerCase(),
    role: 'tester',
    membershipTier: 'margin-plus',
    status: 'active',
    favouriteTeamId: 'WARRIORS',
    favoriteTeamId: 'WARRIORS',
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

  await setDoc(doc(db, 'users', uid), userProfile, { merge: true });
  
  // Also create with lowercase email document ID if applicable
  const altUid = 'kyle_campbell';
  await setDoc(doc(db, 'users', altUid), { ...userProfile, id: altUid, uid: altUid }, { merge: true });

  const snap = await getDoc(doc(db, 'users', uid));
  if (snap.exists()) {
    console.log('✅ Successfully created Kyle Campbell profile in Firestore!');
    console.log('Document path: users/' + uid);
    console.log('User details:', snap.data());
  } else {
    console.error('❌ Failed to verify Kyle Campbell profile in Firestore.');
  }

  process.exit(0);
}

createKyleAccount().catch((err) => {
  console.error('❌ Error creating Kyle Campbell:', err);
  process.exit(1);
});
