/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface NRLTeam {
  id: string;
  name: string;
  shortName: string;
  code: string;
  primaryColor: string;
  secondaryColor: string;
  venue: string;
  city: string;
}

export type FixtureStatus = 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'scheduled' | 'IN_PROGRESS';
export type MatchPeriod = 'NOT_STARTED' | '1ST_HALF' | 'HALF_TIME' | '2ND_HALF' | 'FULL_TIME';

export interface Fixture {
  id: string;
  roundId: string;
  homeTeamId: string;
  awayTeamId: string;
  startTime?: string; // ISO string
  venue: string;
  status: FixtureStatus;
  period?: MatchPeriod;
  matchClock?: string; // e.g., "34'" or "FT"
  homeScore?: number | null;
  awayScore?: number | null;
  winnerTeamId?: string | null;
  winningMargin?: number | null;
  homeDisplayName?: string;
  awayDisplayName?: string;
  homeTeamName?: string;
  awayTeamName?: string;
  kickoff?: string;
  kickoffTime?: string;
  displayKickoff?: string;
}

export interface Tip {
  id: string;
  userId: string;
  username?: string;
  roundId?: string;
  roundName?: string;
  fixtureId: string;
  predictedWinnerTeamId: string;
  predictedMargin: number; // e.g. 1-50
  submittedAt: string;
  isLocked: boolean;
}

export interface TipCalculationResult {
  tipId?: string;
  fixtureId: string;
  predictedWinnerId: string;
  predictedMargin: number;
  actualWinnerId: string | null;
  actualMargin: number | null;
  marginDifference: number;
  penaltyApplied: number; // Always 0 for correct winner, 5 for wrong winner
  gameScore: number; // marginDifference + penaltyApplied
  isCorrectWinner: boolean;
  isPerfectPrediction: boolean;
}

export interface User {
  id: string;
  uid?: string;
  name?: string;
  displayName?: string;
  username: string;
  usernameLowercase?: string;
  email: string;
  emailLowercase?: string;
  betaRoundId?: string;
  favouriteTeamId?: string;
  onboardingComplete?: boolean;
  profileRecovered?: boolean;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  photoURL?: string;
  isAdmin: boolean;
  role?: string;
  status?: string;
  accessMode?: string;
  isDemo?: boolean;
  activeRoundId?: string;
  lastLoginAt?: string;
  favoriteTeamId?: string;
  totalScore: number; // Lowest is best!
  roundsPlayed: number;
  perfectTipsCount: number;
  correctWinnersCount: number;
  wrongWinnersCount: number;
  averageMarginError: number;
  membership?: UserMembership;
  membershipTier?: string;
  bio?: string;
  homeRegion?: string;
  memberSince?: string;
  createdAt?: string;
  updatedAt?: string;
  seasonRank?: number | null;
  seasonCorrectTips?: number;
  seasonPerfectMargins?: number;
  wins?: number;
  losses?: number;
  draws?: number;
  autoPickSettings?: AutoPickSettings;
  privacySettings?: ProfilePrivacySettings;
  notificationSettings?: NotificationSettings;
}

// Membership Types
export type MembershipTier = 'free' | 'margin-plus' | 'margin-pro';

export type MembershipFeature =
  | 'weeklyTips'
  | 'overallComp'
  | 'postMatchScores'
  | 'privateLeagues'
  | 'privateDuels'
  | 'basicProfile'
  | 'advancedProfileStats'
  | 'liveGameScore'
  | 'liveRoundScore'
  | 'liveOverallRank'
  | 'livePrivateRank'
  | 'liveDuelScore'
  | 'autoPicks'
  | 'reducedAds'
  | 'priorityNotifications'
  | 'advancedShareCards'
  | 'dataExport'
  | 'aiPredictor'
  | 'communityPickInsights'
  | 'predictionComparison'
  | 'teamInsights'
  | 'roundStrategy'
  | 'personalisedInsights'
  | 'proReport';

export interface UserMembership {
  userId: string;
  tier: MembershipTier;
  billingCycle: 'monthly' | 'annual';
  status: 'active' | 'cancelled' | 'trial';
  startDate: string;
  endDate?: string;
  nextBillingDate?: string;
}

export interface MembershipPlan {
  id: string;
  tier: MembershipTier;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  features: MembershipFeature[];
  highlighted?: boolean;
  highlight?: boolean;
  badge?: string;
  badgeText?: string;
  highlightsList: string[];
}

export interface MembershipHistoryRecord {
  id: string;
  userId: string;
  tier: MembershipTier;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'cancelled';
  description: string;
}

// Profile & Statistics Types
export interface ProfilePrivacySettings {
  isPublicProfile: boolean;
  showFavoriteTeam: boolean;
  showStatistics: boolean;
  showLeagueMemberships: boolean;
  allowDuelChallenges: boolean;
  searchVisibility: boolean;
}

export interface NotificationSettings {
  tipsOpen: boolean;
  tipsClosingReminder: boolean;
  oneHourLockoutReminder: boolean;
  liveGameUpdate: boolean;
  overallRankMovement: boolean;
  privateLeagueMovement: boolean;
  duelChallenge: boolean;
  duelScoreMovement: boolean;
  roundFinalised: boolean;
  membershipNotification: boolean;
  sponsorOffer: boolean;
}

export interface PlayerProfile {
  userId: string;
  fullName: string;
  username: string;
  email: string;
  profileImage?: string;
  favouriteTeamId?: string;
  biography?: string;
  homeRegion?: string;
  memberSince: string;
  membership: UserMembership;
  privacy: ProfilePrivacySettings;
  notificationSettings: NotificationSettings;
}

export interface PlayerSeasonStats {
  userId: string;
  seasonId: string;
  overallRank: number;
  currentRoundRank: number;
  overallScore: number;
  currentRoundScore: number;
  roundWins: number;
  correctWinners: number;
  wrongWinners: number;
  perfectPredictions: number;
  averageMarginError: number;
  bestRoundScore: number;
  worstRoundScore: number;
  topFiveFinishes: number;
  correctWinnerPercentage: number;
  headToHeadRecord: string; // e.g., "9 wins, 1 draw, 2 losses"
  duelCompetitionPoints: number;
  duelDifferential: number;
  bestWinningStreak: number;
}

export interface PlayerTeamStats {
  teamId: string;
  tips: number;
  correctWinners: number;
  wrongWinners: number;
  perfectPredictions: number;
  correctWinnerPercentage: number;
  averageMarginError: number;
}

export interface PlayerRoundHistory {
  roundId: string;
  roundNumber: number;
  roundScore: number;
  roundRank: number;
  overallRank: number;
  positionMovement: number;
  correctWinners: number;
  wrongWinners: number;
  perfectPredictions: number;
  averageMarginError: number;
  duelOpponentName?: string;
  duelOpponentAvatar?: string;
  duelResult?: 'win' | 'draw' | 'loss';
  duelScore?: string;
  duelPointsEarned?: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedDate?: string;
  progress: number;
  target: number;
}

// Auto Picks Types
export type AutoPickStrategy =
  | 'favourite'
  | 'home'
  | 'community'
  | 'random'
  | 'lowest_margin'
  | 'fixed_margin'
  | 'recent_avg';

export interface AutoPickSettings {
  isEnabled: boolean;
  strategy: AutoPickStrategy;
  defaultMargin: number;
  maxMargin: number;
  applyToAllCompetitions: boolean;
  notifyOnUse: boolean;
  requireConfirmation: boolean;
}

export interface AutoPickRecord {
  id: string;
  userId: string;
  fixtureId: string;
  roundId: string;
  strategy: AutoPickStrategy;
  selectedTeamId: string;
  selectedMargin: number;
  appliedAt: string;
  gameScore?: number;
}

// AI & Community Insights Types
export interface AiPrediction {
  fixtureId: string;
  predictedWinnerTeamId: string;
  predictedMargin: number;
  confidenceScore: number; // 0 - 100
  reasoningSummary: string;
  recentTeamForm: string;
  homeAwayIndicator: string;
}

export interface CommunityInsight {
  fixtureId: string;
  homeTeamPercentage: number;
  awayTeamPercentage: number;
  communityAverageMargin: number;
  communityMedianMargin: number;
  mostCommonMarginRange: string;
  perfectPredictionPercentage: number;
}

export interface League {
  id: string;
  name: string;
  code: string;
  description: string;
  createdByUserId: string;
  memberUserIds: string[];
  isPrivate: boolean;
  createdAt: string;
}

export interface HeadToHeadDuel {
  id: string;
  challengerUserId: string;
  opponentUserId: string;
  roundId: string;
  status: 'PENDING' | 'ACCEPTED' | 'COMPLETED';
  winnerUserId?: string | null;
  challengerScore?: number;
  opponentScore?: number;
  createdAt: string;
}

export interface HeadToHeadLeague {
  id: string;
  name: string;
  code: string;
  description: string;
  createdByUserId: string;
  administratorName: string;
  memberUserIds: string[];
  isPrivate: boolean;
  imageUrl?: string;
  finalsEnabled: boolean;
  seasonFormat: string; // e.g. "Weekly Head-to-Head"
  createdAt: string;
  pointsConfig: {
    win: number;
    draw: number;
    loss: number;
  };
}

export interface HeadToHeadStanding {
  id: string;
  leagueId: string;
  userId: string;
  playerName: string;
  avatarUrl?: string;
  rank: number;
  previousRank: number;
  positionMovement: number; // e.g. +3, -2, 0
  movementDirection: 'UP' | 'DOWN' | 'SAME';
  played: number;
  wins: number;
  draws: number;
  losses: number;
  correctWinners: number;
  perfectPredictions: number;
  totalScore: number; // Cumulative round scores (lower is better)
  differential: number; // Sum of (opponent Round Score - player Round Score). Positive is good!
  lastFiveForm: ('W' | 'D' | 'L')[];
  winningStreak: number;
  competitionPoints: number; // Wins * 2 + Draws * 1
  favoriteTeamId?: string;
  membershipTier?: MembershipTier;
}

export interface HeadToHeadMatchup {
  id: string;
  leagueId: string;
  roundId: string;
  roundNumber: number;
  player1Id: string;
  player2Id: string; // "BYE" for odd league sizes
  player1RoundScore: number;
  player2RoundScore: number;
  player1Differential: number; // player2Score - player1Score
  player2Differential: number; // player1Score - player2Score
  winnerUserId: string | 'DRAW' | 'BYE' | null;
  status: 'UPCOMING' | 'TIPS_OPEN' | 'TIPS_LOCKED' | 'LIVE' | 'COMPLETED' | 'DRAW' | 'POSTPONED' | 'CANCELLED' | 'BYE';
  winningDifference: number; // Math.abs(player1RoundScore - player2RoundScore)
  player1CorrectWinners?: number;
  player1PerfectPredictions?: number;
  player2CorrectWinners?: number;
  player2PerfectPredictions?: number;
  isFeatured?: boolean;
  notes?: string;
}

export interface HeadToHeadPositionMovement {
  id: string;
  leagueId: string;
  roundId: string;
  roundNumber: number;
  userId: string;
  playerName: string;
  positionBefore: number;
  positionAfter: number;
  movementAmount: number;
  direction: 'UP' | 'DOWN' | 'SAME';
  previousPoints: number;
  newPoints: number;
  previousDifferential: number;
  newDifferential: number;
}

export interface HeadToHeadFinalMatchup {
  id: string;
  leagueId: string;
  stage: 'QUARTER_FINAL' | 'SEMI_FINAL' | 'PRELIMINARY_FINAL' | 'GRAND_FINAL';
  stageName: string;
  matchNumber: number;
  player1Id: string;
  player2Id: string;
  player1Score?: number;
  player2Score?: number;
  winnerUserId?: string;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED';
}

export interface NRLRound {
  id: string;
  number: number;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isCompleted: boolean;
}

export interface UnitTestResult {
  id: string;
  testName: string;
  description: string;
  passed: boolean;
  expectedScore: number;
  actualScore: number;
  expectedFormula: string;
  actualFormula: string;
  details: string;
}
