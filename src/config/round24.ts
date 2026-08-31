/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Fixture } from '../types';

export const CANONICAL_ROUND_ID = 'nrl-2026-round-24';

export const CANONICAL_FIXTURE_IDS = [
  'nrl-2026-r24-panthers-roosters',
  'nrl-2026-r24-sea-eagles-dolphins',
  'nrl-2026-r24-bulldogs-rabbitohs',
  'nrl-2026-r24-sharks-raiders',
  'nrl-2026-r24-eels-cowboys',
  'nrl-2026-r24-broncos-warriors',
  'nrl-2026-r24-knights-titans',
  'nrl-2026-r24-tigers-dragons',
] as const;

export const ROUND_24_FIXTURES: Fixture[] = [
  {
    id: 'nrl-2026-r24-panthers-roosters',
    roundId: CANONICAL_ROUND_ID,
    homeTeamId: 'PANTHERS',
    awayTeamId: 'ROOSTERS',
    startTime: '2026-08-13T21:50:00+12:00',
    venue: 'BlueBet Stadium, Penrith',
    status: 'UPCOMING',
    period: 'NOT_STARTED',
    homeScore: null,
    awayScore: null,
    winnerTeamId: null,
    winningMargin: null,
  },
  {
    id: 'nrl-2026-r24-sea-eagles-dolphins',
    roundId: CANONICAL_ROUND_ID,
    homeTeamId: 'SEA_EAGLES',
    awayTeamId: 'DOLPHINS',
    startTime: '2026-08-14T20:00:00+12:00',
    venue: '4 Pines Park, Brookvale',
    status: 'UPCOMING',
    period: 'NOT_STARTED',
    homeScore: null,
    awayScore: null,
    winnerTeamId: null,
    winningMargin: null,
  },
  {
    id: 'nrl-2026-r24-bulldogs-rabbitohs',
    roundId: CANONICAL_ROUND_ID,
    homeTeamId: 'BULLDOGS',
    awayTeamId: 'RABBITOHS',
    startTime: '2026-08-14T22:00:00+12:00',
    venue: 'Belmore Sports Ground, Sydney',
    status: 'UPCOMING',
    period: 'NOT_STARTED',
    homeScore: null,
    awayScore: null,
    winnerTeamId: null,
    winningMargin: null,
  },
  {
    id: 'nrl-2026-r24-sharks-raiders',
    roundId: CANONICAL_ROUND_ID,
    homeTeamId: 'SHARKS',
    awayTeamId: 'RAIDERS',
    startTime: '2026-08-15T17:00:00+12:00',
    venue: 'PointsBet Stadium, Cronulla',
    status: 'UPCOMING',
    period: 'NOT_STARTED',
    homeScore: null,
    awayScore: null,
    winnerTeamId: null,
    winningMargin: null,
  },
  {
    id: 'nrl-2026-r24-eels-cowboys',
    roundId: CANONICAL_ROUND_ID,
    homeTeamId: 'EELS',
    awayTeamId: 'COWBOYS',
    startTime: '2026-08-15T19:30:00+12:00',
    venue: 'CommBank Stadium, Parramatta',
    status: 'UPCOMING',
    period: 'NOT_STARTED',
    homeScore: null,
    awayScore: null,
    winnerTeamId: null,
    winningMargin: null,
  },
  {
    id: 'nrl-2026-r24-broncos-warriors',
    roundId: CANONICAL_ROUND_ID,
    homeTeamId: 'BRONCOS',
    awayTeamId: 'WARRIORS',
    startTime: '2026-08-15T21:35:00+12:00',
    venue: 'Suncorp Stadium, Brisbane',
    status: 'UPCOMING',
    period: 'NOT_STARTED',
    homeScore: null,
    awayScore: null,
    winnerTeamId: null,
    winningMargin: null,
  },
  {
    id: 'nrl-2026-r24-knights-titans',
    roundId: CANONICAL_ROUND_ID,
    homeTeamId: 'KNIGHTS',
    awayTeamId: 'TITANS',
    startTime: '2026-08-16T16:00:00+12:00',
    venue: 'McDonald Jones Stadium, Newcastle',
    status: 'UPCOMING',
    period: 'NOT_STARTED',
    homeScore: null,
    awayScore: null,
    winnerTeamId: null,
    winningMargin: null,
  },
  {
    id: 'nrl-2026-r24-tigers-dragons',
    roundId: CANONICAL_ROUND_ID,
    homeTeamId: 'TIGERS',
    awayTeamId: 'DRAGONS',
    startTime: '2026-08-16T18:05:00+12:00',
    venue: 'Leichhardt Oval, Sydney',
    status: 'UPCOMING',
    period: 'NOT_STARTED',
    homeScore: null,
    awayScore: null,
    winnerTeamId: null,
    winningMargin: null,
  },
];

export const LEGACY_FIXTURE_MAP: Record<string, string> = {
  'fix-2401': 'nrl-2026-r24-panthers-roosters',
  'fix-2402': 'nrl-2026-r24-sea-eagles-dolphins',
  'fix-2403': 'nrl-2026-r24-bulldogs-rabbitohs',
  'fix-2404': 'nrl-2026-r24-sharks-raiders',
  'fix-2405': 'nrl-2026-r24-eels-cowboys',
  'fix-2406': 'nrl-2026-r24-broncos-warriors',
  'fix-2407': 'nrl-2026-r24-knights-titans',
  'fix-2408': 'nrl-2026-r24-tigers-dragons',
};

export function normalizeFixtureId(id: string): string {
  if (!id) return '';
  return LEGACY_FIXTURE_MAP[id] || id;
}

export function normalizeRoundId(id: string): string {
  if (!id) return CANONICAL_ROUND_ID;
  const lower = id.toLowerCase().trim();
  if (
    lower === 'round-24' ||
    lower === 'round24' ||
    lower === '2026-round24' ||
    lower === 'nrl-round-24' ||
    lower === 'round 24'
  ) {
    return CANONICAL_ROUND_ID;
  }
  return CANONICAL_ROUND_ID;
}
