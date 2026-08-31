/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import firebaseApp, {
  app,
  auth,
  db,
  storage,
  firebaseConfig,
  databaseId,
  isFirebaseConfigValid,
  firebaseConfigError,
} from '../lib/firebase';

export {
  firebaseApp,
  app,
  auth,
  db,
  storage,
  firebaseConfig,
  databaseId,
  isFirebaseConfigValid,
  firebaseConfigError,
};
export default firebaseApp;
