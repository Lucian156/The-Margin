/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Fixture, Tip, TipCalculationResult, UnitTestResult } from '../types';

/**
 * Calculates the Game Score for a single fixture prediction according to official The Margin rules.
 * 
 * Rules:
 * 1. Correct Winner: Game Score = Math.abs(predictedMargin - actualMargin)
 * 2. Wrong Winner: Game Score = Math.abs(predictedMargin - actualMargin) + 5
 * 3. Perfect Prediction: Correct winner & exact margin = 0 points
 * 
 * Note: Penalty for wrong winner is ALWAYS EXACTLY 5 points.
 */
export function calculateGameScore(
  predictedWinnerId: string,
  predictedMargin: number,
  actualWinnerId: string | null,
  actualMargin: number | null
): TipCalculationResult {
  // If game is not completed or draw with null actual margin
  if (!actualWinnerId || actualMargin === null) {
    return {
      fixtureId: '',
      predictedWinnerId,
      predictedMargin,
      actualWinnerId: null,
      actualMargin: null,
      marginDifference: 0,
      penaltyApplied: 0,
      gameScore: 0,
      isCorrectWinner: false,
      isPerfectPrediction: false,
    };
  }

  const isCorrectWinner = predictedWinnerId === actualWinnerId;
  const marginDifference = Math.abs(predictedMargin - actualMargin);

  if (isCorrectWinner) {
    const isPerfectPrediction = marginDifference === 0;
    return {
      fixtureId: '',
      predictedWinnerId,
      predictedMargin,
      actualWinnerId,
      actualMargin,
      marginDifference,
      penaltyApplied: 0,
      gameScore: marginDifference,
      isCorrectWinner: true,
      isPerfectPrediction,
    };
  } else {
    // Wrong Winner penalty is ALWAYS 5 points
    const penaltyApplied = 5;
    const gameScore = marginDifference + penaltyApplied;
    return {
      fixtureId: '',
      predictedWinnerId,
      predictedMargin,
      actualWinnerId,
      actualMargin,
      marginDifference,
      penaltyApplied,
      gameScore,
      isCorrectWinner: false,
      isPerfectPrediction: false,
    };
  }
}

/**
 * Calculates user's total score for a set of fixtures and tips.
 */
export function calculateRoundScore(
  userTips: Tip[],
  completedFixtures: Fixture[]
): {
  totalScore: number;
  calculatedResults: TipCalculationResult[];
  perfectCount: number;
  correctCount: number;
  wrongCount: number;
} {
  let totalScore = 0;
  let perfectCount = 0;
  let correctCount = 0;
  let wrongCount = 0;
  const calculatedResults: TipCalculationResult[] = [];

  const fixtureMap = new Map<string, Fixture>();
  completedFixtures.forEach((f) => fixtureMap.set(f.id, f));

  userTips.forEach((tip) => {
    const fixture = fixtureMap.get(tip.fixtureId);
    if (fixture && fixture.status === 'COMPLETED' && fixture.winnerTeamId && fixture.winningMargin !== null) {
      const res = calculateGameScore(
        tip.predictedWinnerTeamId,
        tip.predictedMargin,
        fixture.winnerTeamId,
        fixture.winningMargin
      );
      res.tipId = tip.id;
      res.fixtureId = fixture.id;

      calculatedResults.push(res);
      totalScore += res.gameScore;

      if (res.isPerfectPrediction) perfectCount++;
      if (res.isCorrectWinner) correctCount++;
      else wrongCount++;
    }
  });

  return {
    totalScore,
    calculatedResults,
    perfectCount,
    correctCount,
    wrongCount,
  };
}

/**
 * Runs mandatory unit tests on all scoring calculation scenarios
 * as specified by official The Margin requirements.
 */
export function runScoringUnitTests(): UnitTestResult[] {
  const tests: UnitTestResult[] = [];

  // Test 1: Correct Winner - Warriors by 10 vs Warriors by 6
  {
    const res = calculateGameScore('WARRIORS', 10, 'WARRIORS', 6);
    const passed = res.gameScore === 4 && res.isCorrectWinner && res.penaltyApplied === 0;
    tests.push({
      id: 'test-1-correct-winner',
      testName: 'Correct Winner Difference',
      description: 'Player predicts Warriors by 10. Actual result is Warriors by 6.',
      passed,
      expectedScore: 4,
      actualScore: res.gameScore,
      expectedFormula: '|10 - 6| = 4 points (0 penalty)',
      actualFormula: `|${res.predictedMargin} - ${res.actualMargin}| = ${res.marginDifference} + ${res.penaltyApplied} penalty = ${res.gameScore} points`,
      details: 'Formula: Math.abs(10 - 6) = 4 points',
    });
  }

  // Test 2: Wrong Winner - Warriors by 10 vs Penrith by 6 (Exact prompt specification!)
  {
    const res = calculateGameScore('WARRIORS', 10, 'PANTHERS', 6);
    const passed = res.gameScore === 9 && !res.isCorrectWinner && res.penaltyApplied === 5;
    tests.push({
      id: 'test-2-wrong-winner',
      testName: 'Wrong Winner Penalty (5 Points)',
      description: 'Player predicts Warriors by 10. Actual result is Penrith by 6.',
      passed,
      expectedScore: 9,
      actualScore: res.gameScore,
      expectedFormula: '|10 - 6| + 5 = 9 points',
      actualFormula: `|${res.predictedMargin} - ${res.actualMargin}| (${res.marginDifference}) + ${res.penaltyApplied} penalty = ${res.gameScore} points`,
      details: 'Formula: Math.abs(10 - 6) + 5 = 4 + 5 = 9 points. (Must be 5-point penalty, never 10 or 15).',
    });
  }

  // Test 3: Perfect Prediction - Bulldogs by 4 vs Bulldogs by 4
  {
    const res = calculateGameScore('BULLDOGS', 4, 'BULLDOGS', 4);
    const passed = res.gameScore === 0 && res.isPerfectPrediction && res.isCorrectWinner;
    tests.push({
      id: 'test-3-perfect-prediction',
      testName: 'Perfect Prediction (0 Points)',
      description: 'Player predicts Bulldogs by 4. Actual result is Bulldogs by 4.',
      passed,
      expectedScore: 0,
      actualScore: res.gameScore,
      expectedFormula: '|4 - 4| = 0 points',
      actualFormula: `|${res.predictedMargin} - ${res.actualMargin}| = ${res.gameScore} points`,
      details: 'Formula: Math.abs(4 - 4) = 0 points. Perfect score!',
    });
  }

  // Test 4: High Margin Difference Wrong Winner - Storm by 24 vs Broncos by 2
  {
    const res = calculateGameScore('STORM', 24, 'BRONCOS', 2);
    const passed = res.gameScore === 27 && res.penaltyApplied === 5;
    tests.push({
      id: 'test-4-high-margin-wrong-winner',
      testName: 'High Margin Difference + Wrong Winner',
      description: 'Player predicts Storm by 24. Actual result is Broncos by 2.',
      passed,
      expectedScore: 27,
      actualScore: res.gameScore,
      expectedFormula: '|24 - 2| + 5 = 27 points',
      actualFormula: `|${res.predictedMargin} - ${res.actualMargin}| (${res.marginDifference}) + ${res.penaltyApplied} penalty = ${res.gameScore} points`,
      details: 'Formula: Math.abs(24 - 2) + 5 = 22 + 5 = 27 points',
    });
  }

  // Test 5: Exact 1 Point Difference - Eels by 1 vs Eels by 2
  {
    const res = calculateGameScore('EELS', 1, 'EELS', 2);
    const passed = res.gameScore === 1 && res.penaltyApplied === 0;
    tests.push({
      id: 'test-5-one-point-diff',
      testName: 'One Point Margin Off',
      description: 'Player predicts Eels by 1. Actual result is Eels by 2.',
      passed,
      expectedScore: 1,
      actualScore: res.gameScore,
      expectedFormula: '|1 - 2| = 1 point',
      actualFormula: `|${res.predictedMargin} - ${res.actualMargin}| = ${res.gameScore} point`,
      details: 'Formula: Math.abs(1 - 2) = 1 point',
    });
  }

  return tests;
}
