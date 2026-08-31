import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
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

const app = initializeApp(firebaseConfig, 'check-users-app-' + Date.now());
const db = getFirestore(app, databaseId);

async function checkUsers() {
  console.log('Fetching users from collection "users"...');
  const snap = await getDocs(collection(db, 'users'));
  console.log(`Found ${snap.size} user documents in Firestore:`);
  snap.forEach((doc) => {
    console.log(` - ID: ${doc.id} | data:`, JSON.stringify(doc.data()));
  });
  process.exit(0);
}

checkUsers().catch((err) => {
  console.error('Error fetching users:', err);
  process.exit(1);
});
