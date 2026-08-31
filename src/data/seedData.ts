/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Achievement,
  AiPrediction,
  AutoPickRecord,
  CommunityInsight,
  Fixture,
  HeadToHeadDuel,
  HeadToHeadFinalMatchup,
  HeadToHeadLeague,
  HeadToHeadMatchup,
  HeadToHeadPositionMovement,
  HeadToHeadStanding,
  League,
  MembershipHistoryRecord,
  MembershipPlan,
  NRLRound,
  PlayerRoundHistory,
  PlayerTeamStats,
  Tip,
  User,
} from '../types';

import { ROUND_25_FIXTURES } from '../config/round25';

// ONLY Round 25 Beta as requested
export const SEEDED_ROUNDS: NRLRound[] = [
  {
    id: 'nrl-2026-round-25',
    number: 25,
    name: 'THE MARGIN ROUND 25 BETA',
    startDate: '2026-08-20',
    endDate: '2026-08-23',
    isCurrent: true,
    isCompleted: false,
  },
];

// Default registered beta players (empty - only real Firestore user profiles are displayed)
export const SEEDED_USERS: User[] = [];

// Round 25 Official Fixtures
export const SEEDED_FIXTURES: Fixture[] = ROUND_25_FIXTURES;

export const SEEDED_TIPS: Tip[] = [];

export const SEEDED_LEAGUES: League[] = [
  {
    id: 'league-r24-beta-overall',
    name: 'R24 BETA Overall',
    code: 'Lucian2026',
    description: 'Official R24 BETA Overall Tipping League',
    createdByUserId: 'system',
    isPrivate: false,
    memberUserIds: [],
    createdAt: '2026-08-01',
  },
];

export const SEEDED_DUELS: HeadToHeadDuel[] = [];

export const SEEDED_MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: 'plan-free',
    tier: 'free',
    name: 'FREE',
    monthlyPrice: 0,
    annualPrice: 0,
    description: 'Core tipping experience with winner and margin selections.',
    highlight: false,
    badgeText: '',
    highlightsList: [
      'Weekly NRL winner & margin predictions',
      'Overall Competition Leaderboard',
      'Post-match official game scores',
      '1 Private League & 1 Head-to-Head Duel',
      'Basic Player Profile',
    ],
    features: [
      'weeklyTips',
      'overallComp',
      'postMatchScores',
      'privateLeagues',
      'privateDuels',
      'basicProfile',
    ],
  },
  {
    id: 'plan-plus',
    tier: 'margin-plus',
    name: 'THE MARGIN+',
    monthlyPrice: 4.99,
    annualPrice: 49.99,
    description: 'Real-time live scoring, unlimited leagues, Auto Picks & advanced stats.',
    highlighted: true,
    highlight: true,
    badge: 'MOST POPULAR',
    badgeText: 'MOST POPULAR',
    highlightsList: [
      'Everything in FREE Plan',
      'Live in-play game scores & round ranks',
      'Auto Picks automated fallback protection',
      'Unlimited Private Leagues & H2H Duels',
      'Advanced profile stats & team accuracy',
      'Reduced banner advertisements',
    ],
    features: [
      'weeklyTips',
      'overallComp',
      'postMatchScores',
      'privateLeagues',
      'privateDuels',
      'basicProfile',
      'advancedProfileStats',
      'liveGameScore',
      'liveRoundScore',
      'liveOverallRank',
      'livePrivateRank',
      'liveDuelScore',
      'autoPicks',
      'reducedAds',
      'priorityNotifications',
      'advancedShareCards',
      'dataExport',
    ],
  },
  {
    id: 'plan-pro',
    tier: 'margin-pro',
    name: 'THE MARGIN PRO',
    monthlyPrice: 9.99,
    annualPrice: 99.99,
    description: 'AI Predictor, community insights, team analytics & downloadable Pro reports.',
    highlight: false,
    badge: 'ULTIMATE INSIGHT',
    badgeText: 'ULTIMATE AI POWER',
    highlightsList: [
      'Everything in THE MARGIN+',
      'AI Predictor match models & probability %',
      'Community crowd pick distributions',
      'AI vs Community comparison matrix',
      'Personalised tipper feedback & bias alerts',
      'Downloadable Pro Strategy Reports (PDF)',
    ],
    features: [
      'weeklyTips',
      'overallComp',
      'postMatchScores',
      'privateLeagues',
      'privateDuels',
      'basicProfile',
      'advancedProfileStats',
      'liveGameScore',
      'liveRoundScore',
      'liveOverallRank',
      'livePrivateRank',
      'liveDuelScore',
      'autoPicks',
      'reducedAds',
      'priorityNotifications',
      'advancedShareCards',
      'dataExport',
      'aiPredictor',
      'communityPickInsights',
      'predictionComparison',
      'teamInsights',
      'roundStrategy',
      'personalisedInsights',
      'proReport',
    ],
  },
];

export const SEEDED_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach-1',
    title: 'ROUND WINNER',
    description: 'Win an individual NRL round.',
    icon: 'Trophy',
    unlocked: false,
    progress: 0,
    target: 1,
  },
  {
    id: 'ach-2',
    title: 'PERFECT PREDICTOR',
    description: 'Make an exact winning-team and margin prediction.',
    icon: 'Target',
    unlocked: false,
    progress: 0,
    target: 1,
  },
  {
    id: 'ach-3',
    title: 'FOUR-ROUND STREAK',
    description: 'Win four consecutive Head-to-Head Duels.',
    icon: 'Zap',
    unlocked: false,
    progress: 0,
    target: 4,
  },
  {
    id: 'ach-4',
    title: 'DUEL LEADER',
    description: 'Reach first position on a Duels Ladder.',
    icon: 'Crown',
    unlocked: false,
    progress: 0,
    target: 1,
  },
  {
    id: 'ach-5',
    title: 'TOP TEN',
    description: 'Reach the top ten of the Overall Competition.',
    icon: 'Award',
    unlocked: false,
    progress: 0,
    target: 10,
  },
];

export const SEEDED_ROUND_HISTORIES: PlayerRoundHistory[] = [];

export const SEEDED_TEAM_STATS: PlayerTeamStats[] = [];

export const SEEDED_BILLING_HISTORY: MembershipHistoryRecord[] = [];

export const SEEDED_AUTO_PICK_RECORDS: AutoPickRecord[] = [];

export const SEEDED_AI_PREDICTIONS: Record<string, AiPrediction> = {
  'fix-2401': {
    fixtureId: 'fix-2401',
    predictedWinnerTeamId: 'WARRIORS',
    predictedMargin: 6,
    confidenceScore: 82,
    reasoningSummary: 'Warriors show strong home winning rate at Go Media Stadium.',
    recentTeamForm: 'WWLWW vs LWWLL',
    homeAwayIndicator: 'Home Advantage (+4.5 pts)',
  },
  'fix-2402': {
    fixtureId: 'fix-2402',
    predictedWinnerTeamId: 'BRONCOS',
    predictedMargin: 4,
    confidenceScore: 74,
    reasoningSummary: 'Broncos forward pack dominance in night games at Suncorp.',
    recentTeamForm: 'WLWWW vs WWLLW',
    homeAwayIndicator: 'Home Advantage (+2.1 pts)',
  },
};

export const SEEDED_COMMUNITY_INSIGHTS: Record<string, CommunityInsight> = {
  'fix-2401': {
    fixtureId: 'fix-2401',
    homeTeamPercentage: 78,
    awayTeamPercentage: 22,
    communityAverageMargin: 8.4,
    communityMedianMargin: 6,
    mostCommonMarginRange: '1-12 points',
    perfectPredictionPercentage: 18,
  },
};

export const SEEDED_H2H_LEAGUES: HeadToHeadLeague[] = [
  {
    id: 'h2h-r24-beta',
    name: 'R24 BETA Head to Head',
    code: 'Lucian2026',
    description: 'Official R24 BETA Head to Head Competition',
    createdByUserId: 'system',
    administratorName: 'The Margin Admin',
    isPrivate: false,
    memberUserIds: [],
    finalsEnabled: false,
    seasonFormat: 'Weekly Head-to-Head',
    createdAt: '2026-08-01',
    pointsConfig: { win: 2, draw: 1, loss: 0 },
  },
];

export const SEEDED_H2H_STANDINGS: HeadToHeadStanding[] = [];

export const SEEDED_H2H_MATCHUPS: HeadToHeadMatchup[] = [];

export const SEEDED_H2H_POSITION_MOVEMENTS: HeadToHeadPositionMovement[] = [];

export const SEEDED_H2H_FINALS: HeadToHeadFinalMatchup[] = [];
