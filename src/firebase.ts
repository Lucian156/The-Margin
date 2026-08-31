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
  validateFirebaseConfig,
  runFirebaseHealthCheck,
  ConfigValidationResult,
  FirebaseHealthStatus,
  PLACEHOLDER_KEYWORDS,
} from './lib/firebase';

export {
  app,
  auth,
  db,
  storage,
  firebaseConfig,
  databaseId,
  isFirebaseConfigValid,
  firebaseConfigError,
  validateFirebaseConfig,
  runFirebaseHealthCheck,
  PLACEHOLDER_KEYWORDS,
};

export type { ConfigValidationResult, FirebaseHealthStatus };
export default firebaseApp;
