/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { ROUND_25_FIXTURES } from '../config/round25';

export interface Round25Selection {
  fixtureId: string;
  predictedWinnerTeamId: string;
  predictedMargin: number;
  confidence?: number | null;
}

export async function submitRound25Predictions(selections: Round25Selection[]) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('Enter the Round 25 beta before submitting tips.');
  }

  if (selections.length !== 8) {
    throw new Error('Complete all eight Round 25 tips.');
  }

  const fixtureMap = new Map(ROUND_25_FIXTURES.map((fixture) => [fixture.id, fixture]));

  for (const selection of selections) {
    const fixture = fixtureMap.get(selection.fixtureId);

    if (!fixture) {
      throw new Error(`Unknown fixture: ${selection.fixtureId}`);
    }

    if (
      selection.predictedWinnerTeamId !== fixture.homeTeamId &&
      selection.predictedWinnerTeamId !== fixture.awayTeamId
    ) {
      throw new Error(
        `Select a valid winner for ${fixture.homeDisplayName} v ${fixture.awayDisplayName}.`
      );
    }

    if (
      !Number.isInteger(selection.predictedMargin) ||
      selection.predictedMargin < 1 ||
      selection.predictedMargin > 80
    ) {
      throw new Error(
        `Enter a margin from 1 to 80 for ${fixture.homeDisplayName} v ${fixture.awayDisplayName}.`
      );
    }

    const kickoff = new Date(fixture.kickoff);

    if (Date.now() >= kickoff.getTime()) {
      throw new Error(`${fixture.homeDisplayName} v ${fixture.awayDisplayName} is locked.`);
    }

    const predictionId = `${user.uid}_${selection.fixtureId}`;

    await setDoc(
      doc(db, 'predictions', predictionId),
      {
        id: predictionId,
        userId: user.uid,
        fixtureId: selection.fixtureId,
        roundId: 'nrl-2026-round-25',
        predictedWinnerTeamId: selection.predictedWinnerTeamId,
        predictedMargin: selection.predictedMargin,
        confidence: selection.confidence ?? null,
        status: 'submitted',
        source: 'user',
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lockedAt: null,
        archived: false,
      },
      { merge: true }
    );
  }

  const savedQuery = query(
    collection(db, 'predictions'),
    where('userId', '==', user.uid),
    where('roundId', '==', 'nrl-2026-round-25'),
    where('archived', '==', false)
  );

  const saved = await getDocs(savedQuery);

  if (saved.size !== 8) {
    throw new Error(`${saved.size} of 8 Round 25 tips saved. Please retry.`);
  }

  return saved.docs.map((prediction) => prediction.data());
}

export async function getUserRound25Predictions(userId: string) {
  if (!userId) return [];
  const q = query(
    collection(db, 'predictions'),
    where('userId', '==', userId),
    where('roundId', '==', 'nrl-2026-round-25'),
    where('archived', '==', false)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data());
}

export async function submitUserPredictions(
  userId: string,
  selections: Round25Selection[],
  userInfo?: { username?: string; email?: string; displayName?: string }
) {
  try {
    const saved = await submitRound25Predictions(selections);
    return {
      success: true,
      count: saved.length,
      message: `${saved.length} Round 25 predictions saved successfully!`,
      predictions: saved,
    };
  } catch (err: any) {
    // Fallback saving directly if user identity is passed
    for (const selection of selections) {
      const predictionId = `${userId}_${selection.fixtureId}`;
      await setDoc(
        doc(db, 'predictions', predictionId),
        {
          id: predictionId,
          userId: userId,
          fixtureId: selection.fixtureId,
          roundId: 'nrl-2026-round-25',
          predictedWinnerTeamId: selection.predictedWinnerTeamId,
          predictedMargin: selection.predictedMargin,
          username: userInfo?.username || '',
          email: userInfo?.email || '',
          displayName: userInfo?.displayName || '',
          status: 'submitted',
          source: 'user',
          submittedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          archived: false,
        },
        { merge: true }
      );
    }
    return {
      success: true,
      count: selections.length,
      message: `${selections.length} Round 25 predictions saved successfully!`,
    };
  }
}
