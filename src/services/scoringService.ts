/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Fixture, User } from '../types';
import { CANONICAL_ROUND_ID } from '../config/round25';
import { PredictionDoc } from './firestoreService';

export interface MatchResult {
  fixtureId: string;
  homeScore: number;
  awayScore: number;
  winnerTeamId: string;
  winningMargin: number;
}

export interface GameScoreResult {
  correctWinner: boolean;
  perfectPrediction: boolean;
  marginDifference: number;
  penalty: number;
  score: number;
}

/**
 * Official Five-Point Penalty calculation
 */
export function calculateGameScore(
  prediction: { predictedWinnerTeamId: string; predictedMargin: number },
  result: MatchResult
): GameScoreResult {
  const marginDifference = Math.abs(prediction.predictedMargin - result.winningMargin);
  const correctWinner = prediction.predictedWinnerTeamId === result.winnerTeamId;
  const penalty = correctWinner ? 0 : 5;

  return {
    correctWinner,
    perfectPrediction: correctWinner && marginDifference === 0,
    marginDifference,
    penalty,
    score: marginDifference + penalty,
  };
}

export interface UserRoundScoreSummary {
  userId: string;
  roundId: string;
  gamesScored: number;
  correctWinners: number;
  wrongWinners: number;
  perfectPredictions: number;
  totalScore: number;
  averageMarginError: number;
  gameScores: Record<string, GameScoreResult>;
}

/**
 * Calculate scores across completed fixtures for all predictions and save to gameScores and roundScores in Firestore
 */
export async function recalculateAllScores(
  completedFixtures: Fixture[],
  allPredictions: PredictionDoc[],
  allUsers: User[]
): Promise<Map<string, UserRoundScoreSummary>> {
  const matchResultsMap = new Map<string, MatchResult>();

  completedFixtures.forEach((fix) => {
    if (fix.status === 'COMPLETED' && fix.winnerTeamId && fix.winningMargin !== null) {
      matchResultsMap.set(fix.id, {
        fixtureId: fix.id,
        homeScore: fix.homeScore || 0,
        awayScore: fix.awayScore || 0,
        winnerTeamId: fix.winnerTeamId,
        winningMargin: fix.winningMargin,
      });
    }
  });

  const userSummaries = new Map<string, UserRoundScoreSummary>();

  // Ensure every registered user has an entry in userSummaries
  allUsers.forEach((u) => {
    const uid = u.uid || u.id;
    if (uid) {
      userSummaries.set(uid, {
        userId: uid,
        roundId: CANONICAL_ROUND_ID,
        gamesScored: 0,
        correctWinners: 0,
        wrongWinners: 0,
        perfectPredictions: 0,
        totalScore: 0,
        averageMarginError: 0,
        gameScores: {},
      });
    }
  });

  // Calculate scores for each prediction that matches a completed fixture
  allPredictions.forEach((pred) => {
    const uid = pred.userId;
    const result = matchResultsMap.get(pred.fixtureId);

    if (uid && result) {
      const summary = userSummaries.get(uid) || {
        userId: uid,
        roundId: CANONICAL_ROUND_ID,
        gamesScored: 0,
        correctWinners: 0,
        wrongWinners: 0,
        perfectPredictions: 0,
        totalScore: 0,
        averageMarginError: 0,
        gameScores: {},
      };

      const gameScoreRes = calculateGameScore(pred, result);

      summary.gamesScored += 1;
      if (gameScoreRes.correctWinner) summary.correctWinners += 1;
      else summary.wrongWinners += 1;
      if (gameScoreRes.perfectPrediction) summary.perfectPredictions += 1;
      summary.totalScore += gameScoreRes.score;
      summary.gameScores[pred.fixtureId] = gameScoreRes;

      userSummaries.set(uid, summary);
    }
  });

  // Finalize averages and write to Firestore idempotently
  for (const [uid, summary] of userSummaries.entries()) {
    summary.averageMarginError =
      summary.gamesScored > 0
        ? parseFloat((summary.totalScore / summary.gamesScored).toFixed(1))
        : 0;

    if (summary.gamesScored > 0) {
      try {
        const roundScoreRef = doc(db, 'roundScores', `${uid}_${CANONICAL_ROUND_ID}`);
        await setDoc(
          roundScoreRef,
          {
            userId: uid,
            roundId: CANONICAL_ROUND_ID,
            gamesScored: summary.gamesScored,
            correctWinners: summary.correctWinners,
            wrongWinners: summary.wrongWinners,
            perfectPredictions: summary.perfectPredictions,
            totalScore: summary.totalScore,
            averageMarginError: summary.averageMarginError,
            gameScores: summary.gameScores,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        // Update user stats in users/{uid}
        const userRef = doc(db, 'users', uid);
        await setDoc(
          userRef,
          {
            totalScore: summary.totalScore,
            correctWinnersCount: summary.correctWinners,
            wrongWinnersCount: summary.wrongWinners,
            perfectTipsCount: summary.perfectPredictions,
            averageMarginError: summary.averageMarginError,
            roundsPlayed: 1,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err) {
        console.warn(`Error writing roundScores for user ${uid}:`, err);
      }
    }
  }

  return userSummaries;
}
