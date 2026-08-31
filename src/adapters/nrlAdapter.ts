/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Fixture, NRLRound } from '../types';

/**
 * Clean sports-data adapter interface according to The Margin specifications.
 * Allows seamless integration of Sportradar, StatsPerform, or official NRL APIs in production.
 */
export interface INRLDataProvider {
  providerName: string;
  isLiveFeedConnected: boolean;
  fetchRounds(): Promise<NRLRound[]>;
  fetchFixturesForRound(roundId: string): Promise<Fixture[]>;
  fetchLiveScores(): Promise<Partial<Fixture>[]>;
  simulateLiveMatchUpdate(fixtureId: string, homeDelta: number, awayDelta: number): Promise<Fixture>;
}

/**
 * Prototype implementation backing local/seeded sports data.
 */
export class MockNRLAdapter implements INRLDataProvider {
  providerName = 'The Margin Mock NRL Feed v2.4 (Official Adapter)';
  isLiveFeedConnected = true;

  async fetchRounds(): Promise<NRLRound[]> {
    const { getRounds } = await import('../services/storageService');
    return getRounds();
  }

  async fetchFixturesForRound(roundId: string): Promise<Fixture[]> {
    const { getFixturesForRound } = await import('../services/storageService');
    return getFixturesForRound(roundId);
  }

  async fetchLiveScores(): Promise<Partial<Fixture>[]> {
    const { getFixtures } = await import('../services/storageService');
    const fixtures = getFixtures();
    return fixtures
      .filter((f) => f.status === 'LIVE')
      .map((f) => ({
        id: f.id,
        homeScore: f.homeScore,
        awayScore: f.awayScore,
        matchClock: f.matchClock,
        period: f.period,
        status: f.status,
      }));
  }

  async simulateLiveMatchUpdate(fixtureId: string, homeDelta: number, awayDelta: number): Promise<Fixture> {
    const { getFixtures, saveFixture } = await import('../services/storageService');
    const fixtures = getFixtures();
    const fixture = fixtures.find((f) => f.id === fixtureId);

    if (!fixture) {
      throw new Error(`Fixture ${fixtureId} not found`);
    }

    const newHomeScore = Math.max(0, (fixture.homeScore || 0) + homeDelta);
    const newAwayScore = Math.max(0, (fixture.awayScore || 0) + awayDelta);

    let winnerTeamId: string | null = null;
    let winningMargin: number | null = null;

    if (newHomeScore > newAwayScore) {
      winnerTeamId = fixture.homeTeamId;
      winningMargin = newHomeScore - newAwayScore;
    } else if (newAwayScore > newHomeScore) {
      winnerTeamId = fixture.awayTeamId;
      winningMargin = newAwayScore - newHomeScore;
    }

    const updated: Fixture = {
      ...fixture,
      status: 'LIVE',
      period: fixture.period === 'NOT_STARTED' ? '1ST_HALF' : fixture.period,
      homeScore: newHomeScore,
      awayScore: newAwayScore,
      winnerTeamId,
      winningMargin,
    };

    saveFixture(updated);
    return updated;
  }
}

export const nrlAdapter = new MockNRLAdapter();
