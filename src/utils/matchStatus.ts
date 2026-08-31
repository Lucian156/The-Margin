/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Fixture } from '../types';

/**
 * Utility to determine if a fixture is actively live in real-time.
 * Ensures games before kick-off with no active scores are NOT marked live.
 */
export function isMatchLiveNow(f: Fixture): boolean {
  if (f.status === 'COMPLETED') return false;

  const now = new Date();

  if (f.startTime) {
    const start = new Date(f.startTime);

    // If kickoff time is in the future
    if (now < start) {
      // Only live if an admin/simulator explicitly added active match scores
      const hasScores = (f.homeScore ?? 0) > 0 || (f.awayScore ?? 0) > 0;
      return f.status === 'LIVE' && hasScores;
    }

    // If kickoff time has passed, game is live for 120 minutes
    const end = new Date(start.getTime() + 120 * 60 * 1000);
    if (now >= start && now <= end) {
      return true;
    }
  }

  // Fallback: If marked live explicitly and has active scores
  if (f.status === 'LIVE') {
    return (f.homeScore ?? 0) > 0 || (f.awayScore ?? 0) > 0;
  }

  return false;
}

/**
 * Returns the effective status of a fixture: 'UPCOMING' | 'LIVE' | 'COMPLETED'
 */
export function getEffectiveFixtureStatus(f: Fixture): 'UPCOMING' | 'LIVE' | 'COMPLETED' {
  if (f.status === 'COMPLETED') return 'COMPLETED';
  if (isMatchLiveNow(f)) return 'LIVE';
  return 'UPCOMING';
}
