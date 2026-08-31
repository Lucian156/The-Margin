/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SEEDED_AUTO_PICK_RECORDS,
  SEEDED_BILLING_HISTORY,
  SEEDED_DUELS,
  SEEDED_FIXTURES,
  SEEDED_H2H_FINALS,
  SEEDED_H2H_LEAGUES,
  SEEDED_H2H_MATCHUPS,
  SEEDED_H2H_POSITION_MOVEMENTS,
  SEEDED_H2H_STANDINGS,
  SEEDED_LEAGUES,
  SEEDED_ROUNDS,
  SEEDED_TIPS,
  SEEDED_USERS,
} from '../data/seedData';
import {
  AutoPickRecord,
  AutoPickSettings,
  Fixture,
  HeadToHeadDuel,
  HeadToHeadFinalMatchup,
  HeadToHeadLeague,
  HeadToHeadMatchup,
  HeadToHeadPositionMovement,
  HeadToHeadStanding,
  League,
  MembershipHistoryRecord,
  MembershipTier,
  NRLRound,
  Tip,
  User,
  UserMembership,
} from '../types';
import { calculateRoundScore } from '../utils/scoring';
import {
  updateFixtureInFirestore,
  saveTipToFirestore,
  saveUserToFirestore,
  fetchAllUsersFromFirestore,
  saveLeagueToFirestore,
  fetchLeaguesFromFirestore,
  saveH2HLeagueToFirestore,
  fetchH2HLeaguesFromFirestore,
  fetchAllTipsFromFirestore,
  fetchFixturesFromFirestore,
} from './firestoreService';

export const STORAGE_KEYS = {
  USERS: 'the_margin_users',
  CURRENT_USER: 'the_margin_current_user',
  ROUNDS: 'the_margin_rounds',
  FIXTURES: 'the_margin_fixtures',
  TIPS: 'the_margin_tips',
  LEAGUES: 'the_margin_leagues',
  DUELS: 'the_margin_duels',
  BILLING_HISTORY: 'the_margin_billing_history',
  AUTO_PICK_RECORDS: 'the_margin_auto_pick_records',
  H2H_LEAGUES: 'the_margin_h2h_leagues',
  H2H_STANDINGS: 'the_margin_h2h_standings',
  H2H_MATCHUPS: 'the_margin_h2h_matchups',
  H2H_POSITION_MOVEMENTS: 'the_margin_h2h_position_movements',
  H2H_FINALS: 'the_margin_h2h_finals',
};

// Initialize default storage if empty
export function initializeStorage(): void {
  if (typeof window === 'undefined') return;

  const PURGE_KEY = 'the_margin_round_27_release_v1';
  if (!localStorage.getItem(PURGE_KEY)) {
    // Purge old mock/previous round storage to guarantee fresh Round 27 fixtures
    localStorage.removeItem(STORAGE_KEYS.ROUNDS);
    localStorage.removeItem(STORAGE_KEYS.FIXTURES);
    localStorage.setItem(PURGE_KEY, 'true');
  }

  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ROUNDS)) {
    localStorage.setItem(STORAGE_KEYS.ROUNDS, JSON.stringify(SEEDED_ROUNDS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.FIXTURES)) {
    localStorage.setItem(STORAGE_KEYS.FIXTURES, JSON.stringify(SEEDED_FIXTURES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.TIPS)) {
    localStorage.setItem(STORAGE_KEYS.TIPS, JSON.stringify(SEEDED_TIPS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.LEAGUES)) {
    localStorage.setItem(STORAGE_KEYS.LEAGUES, JSON.stringify(SEEDED_LEAGUES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.DUELS)) {
    localStorage.setItem(STORAGE_KEYS.DUELS, JSON.stringify(SEEDED_DUELS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.BILLING_HISTORY)) {
    localStorage.setItem(STORAGE_KEYS.BILLING_HISTORY, JSON.stringify(SEEDED_BILLING_HISTORY));
  }
  if (!localStorage.getItem(STORAGE_KEYS.AUTO_PICK_RECORDS)) {
    localStorage.setItem(STORAGE_KEYS.AUTO_PICK_RECORDS, JSON.stringify(SEEDED_AUTO_PICK_RECORDS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.H2H_LEAGUES)) {
    localStorage.setItem(STORAGE_KEYS.H2H_LEAGUES, JSON.stringify(SEEDED_H2H_LEAGUES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.H2H_STANDINGS)) {
    localStorage.setItem(STORAGE_KEYS.H2H_STANDINGS, JSON.stringify(SEEDED_H2H_STANDINGS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.H2H_MATCHUPS)) {
    localStorage.setItem(STORAGE_KEYS.H2H_MATCHUPS, JSON.stringify(SEEDED_H2H_MATCHUPS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.H2H_POSITION_MOVEMENTS)) {
    localStorage.setItem(STORAGE_KEYS.H2H_POSITION_MOVEMENTS, JSON.stringify(SEEDED_H2H_POSITION_MOVEMENTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.H2H_FINALS)) {
    localStorage.setItem(STORAGE_KEYS.H2H_FINALS, JSON.stringify(SEEDED_H2H_FINALS));
  }

  // Ensure all existing local users are enrolled in default leagues
  try {
    const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS);
    if (rawUsers) {
      const users: User[] = JSON.parse(rawUsers);
      users.forEach((u) => autoJoinDefaultLeagues(u));
    }
  } catch {}
}

export function resetStorageToDefault(): void {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEEDED_USERS));
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  localStorage.setItem(STORAGE_KEYS.ROUNDS, JSON.stringify(SEEDED_ROUNDS));
  localStorage.setItem(STORAGE_KEYS.FIXTURES, JSON.stringify(SEEDED_FIXTURES));
  localStorage.setItem(STORAGE_KEYS.TIPS, JSON.stringify(SEEDED_TIPS));
  localStorage.setItem(STORAGE_KEYS.LEAGUES, JSON.stringify(SEEDED_LEAGUES));
  localStorage.setItem(STORAGE_KEYS.DUELS, JSON.stringify(SEEDED_DUELS));
  localStorage.setItem(STORAGE_KEYS.BILLING_HISTORY, JSON.stringify(SEEDED_BILLING_HISTORY));
  localStorage.setItem(STORAGE_KEYS.AUTO_PICK_RECORDS, JSON.stringify(SEEDED_AUTO_PICK_RECORDS));
  localStorage.setItem(STORAGE_KEYS.H2H_LEAGUES, JSON.stringify(SEEDED_H2H_LEAGUES));
  localStorage.setItem(STORAGE_KEYS.H2H_STANDINGS, JSON.stringify(SEEDED_H2H_STANDINGS));
  localStorage.setItem(STORAGE_KEYS.H2H_MATCHUPS, JSON.stringify(SEEDED_H2H_MATCHUPS));
  localStorage.setItem(STORAGE_KEYS.H2H_POSITION_MOVEMENTS, JSON.stringify(SEEDED_H2H_POSITION_MOVEMENTS));
  localStorage.setItem(STORAGE_KEYS.H2H_FINALS, JSON.stringify(SEEDED_H2H_FINALS));
}

// Current User Operations
export function getCurrentUser(): User {
  initializeStorage();
  let currentUser: User | null = null;
  const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  if (raw) {
    try {
      const u = JSON.parse(raw);
      if (u && u.id && u.name) currentUser = u;
    } catch (e) {
      // fallback
    }
  }

  if (!currentUser) {
    currentUser = {
      id: 'user-beta-admin',
      name: 'Lucian Armstrong',
      username: 'LucianA',
      email: 'lucianarmstrong2019@gmail.com',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      isAdmin: true,
      favoriteTeamId: 'WARRIORS',
      totalScore: 0,
      roundsPlayed: 0,
      perfectTipsCount: 0,
      correctWinnersCount: 0,
      wrongWinnersCount: 0,
      averageMarginError: 0,
      bio: 'Round 24 Beta Tipper',
      homeRegion: 'Auckland, NZ',
      memberSince: 'August 2026',
    };
  }

  // Calculate currentUser score dynamically based on tips & completed fixtures
  const fixtures = getFixtures();
  const tips = getTips();
  const userTips = tips.filter((t) => t.userId === currentUser.id);
  const scoreRes = calculateRoundScore(userTips, fixtures);

  const updatedUser: User = {
    ...currentUser,
    totalScore: scoreRes.totalScore,
    perfectTipsCount: scoreRes.perfectCount,
    correctWinnersCount: scoreRes.correctCount,
    wrongWinnersCount: scoreRes.wrongCount,
    averageMarginError:
      userTips.length > 0
        ? parseFloat((scoreRes.totalScore / Math.max(1, scoreRes.calculatedResults.length)).toFixed(1))
        : 0,
  };

  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedUser));
  return updatedUser;
}

export function setCurrentUser(user: User): void {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
}

export function getUsers(): User[] {
  initializeStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.USERS);
  let users: User[] = raw ? JSON.parse(raw) : [];

  const userMap = new Map<string, User>();
  users.forEach((u) => {
    if (u && (u.id || u.uid)) {
      const key = u.id || u.uid;
      userMap.set(key, u);
    }
  });

  // Ensure current user is present in the list of users
  const currentRaw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  if (currentRaw) {
    try {
      const cu: User = JSON.parse(currentRaw);
      if (cu && cu.id) {
        userMap.set(cu.id, { ...userMap.get(cu.id), ...cu });
      }
    } catch (e) {
      // ignore
    }
  }

  users = Array.from(userMap.values());

  // Recalculate leaderboard scores dynamically from tips & completed fixtures
  const fixtures = getFixtures();
  const tips = getTips();

  const recalculatedUsers = users.map((u) => {
    const userTips = tips.filter((t) => t.userId === u.id);
    const scoreRes = calculateRoundScore(userTips, fixtures);
    return {
      ...u,
      totalScore: scoreRes.totalScore,
      perfectTipsCount: scoreRes.perfectCount,
      correctWinnersCount: scoreRes.correctCount,
      wrongWinnersCount: scoreRes.wrongCount,
      averageMarginError:
        userTips.length > 0
          ? parseFloat((scoreRes.totalScore / Math.max(1, scoreRes.calculatedResults.length)).toFixed(1))
          : 0,
    };
  }).sort((a, b) => a.totalScore - b.totalScore); // Lowest total score is #1!

  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(recalculatedUsers));

  // Sync current user if in list
  const currentRawObj = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  if (currentRawObj) {
    try {
      const cu: User = JSON.parse(currentRawObj);
      const match = recalculatedUsers.find((u) => u.id === cu.id);
      if (match) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(match));
      }
    } catch (e) {
      // ignore
    }
  }

  return recalculatedUsers;
}

export function autoJoinDefaultLeagues(user: User): void {
  if (!user || !user.id || typeof window === 'undefined') return;

  // 1. Join default Overall League (R24 BETA Overall, code: Lucian2026)
  const leaguesRaw = localStorage.getItem(STORAGE_KEYS.LEAGUES);
  const leagues: League[] = leaguesRaw ? JSON.parse(leaguesRaw) : [...SEEDED_LEAGUES];
  let overallLeague = leagues.find(
    (l) => l.code.toUpperCase() === 'LUCIAN2026' || l.id === 'league-r24-beta-overall' || l.name === 'R24 BETA Overall'
  );

  if (!overallLeague) {
    overallLeague = {
      id: 'league-r24-beta-overall',
      name: 'R24 BETA Overall',
      code: 'Lucian2026',
      description: 'Official R24 BETA Overall Tipping League',
      createdByUserId: 'system',
      isPrivate: false,
      memberUserIds: [user.id],
      createdAt: new Date().toISOString(),
    };
    leagues.push(overallLeague);
  } else if (!overallLeague.memberUserIds.includes(user.id)) {
    overallLeague.memberUserIds.push(user.id);
  }
  localStorage.setItem(STORAGE_KEYS.LEAGUES, JSON.stringify(leagues));
  saveLeagueToFirestore(overallLeague).catch(() => {});

  // 2. Join default H2H League (R24 BETA Head to Head, code: Lucian2026)
  const h2hLeaguesRaw = localStorage.getItem(STORAGE_KEYS.H2H_LEAGUES);
  const h2hLeagues: HeadToHeadLeague[] = h2hLeaguesRaw ? JSON.parse(h2hLeaguesRaw) : [...SEEDED_H2H_LEAGUES];
  let h2hLeague = h2hLeagues.find(
    (l) => l.code.toUpperCase() === 'LUCIAN2026' || l.id === 'h2h-r24-beta' || l.name === 'R24 BETA Head to Head'
  );

  if (!h2hLeague) {
    h2hLeague = {
      id: 'h2h-r24-beta',
      name: 'R24 BETA Head to Head',
      code: 'Lucian2026',
      description: 'Official R24 BETA Head to Head Competition',
      createdByUserId: 'system',
      administratorName: 'The Margin Admin',
      isPrivate: false,
      memberUserIds: [user.id],
      finalsEnabled: false,
      seasonFormat: 'Weekly Head-to-Head',
      createdAt: new Date().toISOString(),
      pointsConfig: { win: 2, draw: 1, loss: 0 },
    };
    h2hLeagues.push(h2hLeague);
  } else if (!h2hLeague.memberUserIds.includes(user.id)) {
    h2hLeague.memberUserIds.push(user.id);
  }
  localStorage.setItem(STORAGE_KEYS.H2H_LEAGUES, JSON.stringify(h2hLeagues));
  saveH2HLeagueToFirestore(h2hLeague).catch(() => {});

  // 3. Ensure standing entry exists in H2H standing list
  const standingsRaw = localStorage.getItem(STORAGE_KEYS.H2H_STANDINGS);
  const standings: HeadToHeadStanding[] = standingsRaw ? JSON.parse(standingsRaw) : [];
  const existingStanding = standings.find(
    (s) => s.leagueId === h2hLeague!.id && s.userId === user.id
  );
  if (!existingStanding) {
    standings.push({
      id: `std-${user.id}-${h2hLeague.id}`,
      leagueId: h2hLeague.id,
      userId: user.id,
      playerName: user.name || 'Tipper',
      avatarUrl: user.avatarUrl,
      rank: standings.filter((s) => s.leagueId === h2hLeague!.id).length + 1,
      previousRank: standings.filter((s) => s.leagueId === h2hLeague!.id).length + 1,
      positionMovement: 0,
      movementDirection: 'SAME',
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      correctWinners: 0,
      perfectPredictions: 0,
      totalScore: 0,
      differential: 0,
      lastFiveForm: [],
      winningStreak: 0,
      competitionPoints: 0,
      favoriteTeamId: user.favoriteTeamId || 'WARRIORS',
      membershipTier: user.membership?.tier || 'free',
    });
    localStorage.setItem(STORAGE_KEYS.H2H_STANDINGS, JSON.stringify(standings));
  }
}

export function registerUser(name: string, email: string, username: string, favoriteTeamId?: string): User {
  const users = getUsers();
  const nameParts = name.trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const newUser: User = {
    id: `user-${Date.now()}`,
    name,
    username,
    email,
    firstName,
    lastName,
    membershipTier: 'Free',
    avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
    isAdmin: false,
    favoriteTeamId: favoriteTeamId || 'WARRIORS',
    memberSince: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    totalScore: 0,
    roundsPlayed: 0,
    perfectTipsCount: 0,
    correctWinnersCount: 0,
    wrongWinnersCount: 0,
    averageMarginError: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  console.log("NEW USER CREATED", newUser);

  users.push(newUser);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  setCurrentUser(newUser);

  saveUserToFirestore(newUser)
    .then(async () => {
      const allUsers = await fetchAllUsersFromFirestore();
      console.log("TOTAL USERS IN DATABASE", allUsers.length);
      console.log(allUsers);
    })
    .catch((err) => console.error('Error saving user to Firestore:', err));

  autoJoinDefaultLeagues(newUser);
  return newUser;
}

// Rounds & Fixtures Operations
export function getRounds(): NRLRound[] {
  initializeStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.ROUNDS);
  return raw ? JSON.parse(raw) : SEEDED_ROUNDS;
}

export function getCurrentRound(): NRLRound {
  const rounds = getRounds();
  return rounds.find((r) => r.isCurrent) || rounds[0];
}

export function getFixtures(): Fixture[] {
  initializeStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.FIXTURES);
  const list: Fixture[] = raw ? JSON.parse(raw) : SEEDED_FIXTURES;

  // Ensure all 8 official seed fixtures are present in the fixture list
  const fixMap = new Map<string, Fixture>();
  SEEDED_FIXTURES.forEach((sf) => fixMap.set(sf.id, sf));
  if (Array.isArray(list)) {
    list.forEach((f) => {
      if (f && f.id) {
        fixMap.set(f.id, { ...fixMap.get(f.id), ...f });
      }
    });
  }
  const mergedList = Array.from(fixMap.values());

  const now = new Date();
  let modified = false;
  const sanitized = mergedList.map((f) => {
    // Normalize roundId alias
    if (f.roundId === 'r24') {
      f = { ...f, roundId: 'round-24' };
      modified = true;
    }
    if (f.status === 'LIVE' && f.startTime) {
      const start = new Date(f.startTime);
      const hasScores = (f.homeScore ?? 0) > 0 || (f.awayScore ?? 0) > 0;
      if (now < start && !hasScores) {
        modified = true;
        return {
          ...f,
          status: 'UPCOMING' as const,
          period: 'NOT_STARTED' as const,
          homeScore: null,
          awayScore: null,
          winnerTeamId: null,
          winningMargin: null,
        };
      }
    }
    return f;
  });

  if (modified || sanitized.length !== list.length) {
    localStorage.setItem(STORAGE_KEYS.FIXTURES, JSON.stringify(sanitized));
  }

  return sanitized;
}

export function getFixturesForRound(roundId: string): Fixture[] {
  return getFixtures().filter(
    (f) =>
      f.roundId === roundId ||
      (roundId === 'round-24' && f.roundId === 'r24') ||
      (roundId === 'r24' && f.roundId === 'round-24')
  );
}

export function saveFixture(fixture: Fixture): void {
  const fixtures = getFixtures();
  const idx = fixtures.findIndex((f) => f.id === fixture.id);
  if (idx >= 0) {
    fixtures[idx] = fixture;
  } else {
    fixtures.push(fixture);
  }
  localStorage.setItem(STORAGE_KEYS.FIXTURES, JSON.stringify(fixtures));
  updateFixtureInFirestore(fixture).catch(() => {});
}

export function saveFixtures(fixturesList: Fixture[]): void {
  const fixtures = getFixtures();
  const map = new Map<string, Fixture>();
  fixtures.forEach((f) => map.set(f.id, f));
  fixturesList.forEach((f) => map.set(f.id, f));
  const updated = Array.from(map.values());
  localStorage.setItem(STORAGE_KEYS.FIXTURES, JSON.stringify(updated));
  fixturesList.forEach((f) => {
    updateFixtureInFirestore(f).catch(() => {});
  });
}

// Tips Operations
export function getTips(): Tip[] {
  initializeStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.TIPS);
  const parsed: any[] = raw ? JSON.parse(raw) : SEEDED_TIPS;

  const seenKeys = new Set<string>();
  const seenIds = new Set<string>();
  const cleanTips: Tip[] = [];

  for (const t of parsed) {
    if (!t) continue;
    const uid = String(t.userId || t.uid || t.username || 'unknown');
    const fixtureId = String(t.fixtureId || '');
    if (!fixtureId) continue;

    const key = `${uid}_${fixtureId}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);

    const teamId = String(t.predictedWinnerTeamId || t.selectedTeamId || t.winnerId || '');
    const margin = Number(t.predictedMargin ?? t.margin ?? 0);

    let tipId = t.id || `tip-${uid}-${fixtureId}`;
    if (seenIds.has(tipId)) {
      tipId = `tip-${uid}-${fixtureId}-${Math.random().toString(36).substring(2, 7)}`;
    }
    seenIds.add(tipId);

    let submittedAtStr = typeof t.submittedAt === 'string' ? t.submittedAt : new Date().toISOString();
    if (t.submittedAt && typeof t.submittedAt === 'object' && t.submittedAt.seconds) {
      submittedAtStr = new Date(t.submittedAt.seconds * 1000).toISOString();
    }

    cleanTips.push({
      ...t,
      id: tipId,
      userId: uid,
      username: t.username || t.userDisplayName || t.name || uid,
      userEmail: t.userEmail || t.email || '',
      roundId: String(t.roundId || 'round-24'),
      fixtureId,
      predictedWinnerTeamId: teamId,
      selectedTeamId: teamId,
      predictedMargin: margin,
      submittedAt: submittedAtStr,
      isLocked: !!t.isLocked,
    });
  }

  return cleanTips;
}

export function getUserTips(userOrId: string | User | any): Tip[] {
  if (!userOrId) return [];
  const allTips = getTips();
  const targetSet = new Set<string>();

  if (typeof userOrId === 'string') {
    const clean = userOrId.toLowerCase().trim();
    if (clean) targetSet.add(clean);

    const users = getUsers();
    const foundUser = users.find((u) =>
      (u.id && u.id.toLowerCase() === clean) ||
      (u.uid && u.uid.toLowerCase() === clean) ||
      (u.username && u.username.toLowerCase() === clean) ||
      (u.email && u.email.toLowerCase() === clean)
    );
    if (foundUser) {
      if (foundUser.id) targetSet.add(foundUser.id.toLowerCase());
      if (foundUser.uid) targetSet.add(foundUser.uid.toLowerCase());
      if (foundUser.username) targetSet.add(foundUser.username.toLowerCase());
      if (foundUser.email) targetSet.add(foundUser.email.toLowerCase());
    }
  } else if (typeof userOrId === 'object') {
    if (userOrId.id) targetSet.add(String(userOrId.id).toLowerCase());
    if (userOrId.uid) targetSet.add(String(userOrId.uid).toLowerCase());
    if (userOrId.username) targetSet.add(String(userOrId.username).toLowerCase());
    if (userOrId.email) targetSet.add(String(userOrId.email).toLowerCase());
  }

  if (targetSet.size === 0) return [];

  const fixtureTipMap = new Map<string, Tip>();
  allTips.forEach((t) => {
    if (!t || !t.fixtureId) return;
    const uid = (t.userId || (t as any).uid || '').toString().toLowerCase();
    const uname = (t.username || (t as any).userDisplayName || '').toString().toLowerCase();
    const uemail = ((t as any).userEmail || (t as any).email || '').toString().toLowerCase();

    if (targetSet.has(uid) || targetSet.has(uname) || targetSet.has(uemail)) {
      fixtureTipMap.set(t.fixtureId, t);
    }
  });

  return Array.from(fixtureTipMap.values());
}

export function saveTip(userId: string, fixtureId: string, predictedWinnerTeamId: string, predictedMargin: number): Tip {
  const tips = getTips();
  const users = getUsers();
  const targetLower = (userId || '').toLowerCase();
  const user = users.find((u) =>
    (u.id && u.id.toLowerCase() === targetLower) ||
    (u.uid && u.uid.toLowerCase() === targetLower) ||
    (u.username && u.username.toLowerCase() === targetLower) ||
    (u.email && u.email.toLowerCase() === targetLower)
  );

  const cleanUserId = user?.uid || user?.id || userId;

  const existingIdx = tips.findIndex((t) =>
    (t.userId === cleanUserId || t.userId === userId || (user?.username && t.username === user.username)) &&
    t.fixtureId === fixtureId
  );

  const newId = existingIdx >= 0 && tips[existingIdx].id
    ? tips[existingIdx].id
    : `tip-${cleanUserId}-${fixtureId}-${Date.now()}`;

  const updatedTip: Tip = {
    id: newId,
    userId: cleanUserId,
    username: user?.username || user?.name || user?.displayName || cleanUserId,
    roundId: 'round-24',
    roundName: 'Round 24',
    fixtureId,
    predictedWinnerTeamId,
    predictedMargin,
    submittedAt: new Date().toISOString(),
    isLocked: false,
  };

  if (existingIdx >= 0) {
    tips[existingIdx] = updatedTip;
  } else {
    tips.push(updatedTip);
  }

  localStorage.setItem(STORAGE_KEYS.TIPS, JSON.stringify(tips));

  console.log("PICK SAVED", updatedTip);

  saveTipToFirestore(updatedTip)
    .then(async () => {
      const allPicks = await fetchAllTipsFromFirestore();
      console.log("TOTAL PICKS", allPicks.length);
      console.log(allPicks);
    })
    .catch((err) => console.error('Error saving tip to Firestore:', err));

  // Trigger users score update immediately
  getUsers();

  return updatedTip;
}

// Leagues Operations
export function getLeagues(): League[] {
  initializeStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.LEAGUES);
  return raw ? JSON.parse(raw) : SEEDED_LEAGUES;
}

export function createLeague(name: string, description: string, isPrivate: boolean, createdByUserId: string): League {
  const leagues = getLeagues();
  const newLeague: League = {
    id: `league-${Date.now()}`,
    name,
    code: name.substring(0, 4).toUpperCase() + Math.floor(1000 + Math.random() * 9000),
    description,
    createdByUserId,
    memberUserIds: [createdByUserId],
    isPrivate,
    createdAt: new Date().toISOString(),
  };

  leagues.push(newLeague);
  localStorage.setItem(STORAGE_KEYS.LEAGUES, JSON.stringify(leagues));
  saveLeagueToFirestore(newLeague).catch(() => {});
  return newLeague;
}

export function joinLeagueByCode(code: string, userId: string): League | null {
  const leagues = getLeagues();
  const league = leagues.find((l) => l.code.toUpperCase() === code.trim().toUpperCase());
  if (!league) return null;

  if (!league.memberUserIds.includes(userId)) {
    league.memberUserIds.push(userId);
    localStorage.setItem(STORAGE_KEYS.LEAGUES, JSON.stringify(leagues));
    saveLeagueToFirestore(league).catch(() => {});
  }
  return league;
}

// Head-to-Head Duels Operations
export function getDuels(): HeadToHeadDuel[] {
  initializeStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.DUELS);
  return raw ? JSON.parse(raw) : SEEDED_DUELS;
}

export function createDuel(challengerUserId: string, opponentUserId: string, roundId: string): HeadToHeadDuel {
  const duels = getDuels();
  const newDuel: HeadToHeadDuel = {
    id: `duel-${Date.now()}`,
    challengerUserId,
    opponentUserId,
    roundId,
    status: 'ACCEPTED', // Auto accepted for prototype ease
    createdAt: new Date().toISOString(),
  };
  duels.push(newDuel);
  localStorage.setItem(STORAGE_KEYS.DUELS, JSON.stringify(duels));
  return newDuel;
}

// User Update Operations
export function updateUser(updatedUser: User): User {
  const users = getUsers();
  const index = users.findIndex((u) => u.id === updatedUser.id);
  if (index >= 0) {
    users[index] = { ...users[index], ...updatedUser };
  } else {
    users.push(updatedUser);
  }
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

  const currentUser = getCurrentUser();
  if (currentUser.id === updatedUser.id) {
    setCurrentUser({ ...currentUser, ...updatedUser });
  }

  saveUserToFirestore(updatedUser).catch(() => {});

  return updatedUser;
}

export function updateUserMembership(userId: string, tier: MembershipTier, billingCycle: 'monthly' | 'annual' = 'monthly'): User {
  const currentUser = getCurrentUser();
  const updatedMembership: UserMembership = {
    userId,
    tier,
    billingCycle,
    status: 'active',
    startDate: new Date().toISOString().split('T')[0],
    nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  };

  const updatedUser = {
    ...currentUser,
    membership: updatedMembership,
  };

  updateUser(updatedUser);

  // Add billing record
  const planNames: Record<MembershipTier, string> = {
    free: 'FREE',
    'margin-plus': 'THE MARGIN+',
    'margin-pro': 'THE MARGIN PRO',
  };
  const prices: Record<MembershipTier, number> = {
    free: 0,
    'margin-plus': billingCycle === 'annual' ? 49.99 : 4.99,
    'margin-pro': billingCycle === 'annual' ? 99.99 : 9.99,
  };

  if (tier !== 'free') {
    addBillingHistoryRecord({
      id: `bill-${Date.now()}`,
      userId,
      tier,
      date: new Date().toISOString().split('T')[0],
      amount: prices[tier],
      status: 'paid',
      description: `${planNames[tier]} ${billingCycle === 'annual' ? 'Annual' : 'Monthly'} Subscription (Demonstration)`,
    });
  }

  return updatedUser;
}

// Billing History Operations
export function getBillingHistory(userId?: string): MembershipHistoryRecord[] {
  initializeStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.BILLING_HISTORY);
  const records: MembershipHistoryRecord[] = raw ? JSON.parse(raw) : SEEDED_BILLING_HISTORY;
  if (userId) {
    return records.filter((r) => r.userId === userId);
  }
  return records;
}

export function addBillingHistoryRecord(record: MembershipHistoryRecord): void {
  const records = getBillingHistory();
  records.unshift(record);
  localStorage.setItem(STORAGE_KEYS.BILLING_HISTORY, JSON.stringify(records));
}

// Auto Pick Records Operations
export function getAutoPickRecords(userId?: string): AutoPickRecord[] {
  initializeStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.AUTO_PICK_RECORDS);
  const records: AutoPickRecord[] = raw ? JSON.parse(raw) : SEEDED_AUTO_PICK_RECORDS;
  if (userId) {
    return records.filter((r) => r.userId === userId);
  }
  return records;
}

export function addAutoPickRecord(record: AutoPickRecord): void {
  const records = getAutoPickRecords();
  records.unshift(record);
  localStorage.setItem(STORAGE_KEYS.AUTO_PICK_RECORDS, JSON.stringify(records));
}

// ==========================================
// HEAD-TO-HEAD COMPETITION SERVICE OPERATIONS
// ==========================================

export function getH2HLeagues(): HeadToHeadLeague[] {
  initializeStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.H2H_LEAGUES);
  return raw ? JSON.parse(raw) : SEEDED_H2H_LEAGUES;
}

export function getH2HLeagueById(leagueId: string): HeadToHeadLeague | undefined {
  return getH2HLeagues().find((l) => l.id === leagueId);
}

export function createH2HLeague(
  name: string,
  description: string,
  isPrivate: boolean,
  createdByUserId: string,
  administratorName: string,
  finalsEnabled: boolean = true
): HeadToHeadLeague {
  const leagues = getH2HLeagues();
  const newLeague: HeadToHeadLeague = {
    id: `h2h-league-${Date.now()}`,
    name,
    code: (name.substring(0, 3) + Math.floor(1000 + Math.random() * 9000)).toUpperCase(),
    description,
    createdByUserId,
    administratorName,
    memberUserIds: [createdByUserId],
    isPrivate,
    imageUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=200&auto=format&fit=crop&q=80',
    finalsEnabled,
    seasonFormat: 'Weekly Head-to-Head',
    createdAt: new Date().toISOString(),
    pointsConfig: { win: 2, draw: 1, loss: 0 },
  };

  leagues.push(newLeague);
  localStorage.setItem(STORAGE_KEYS.H2H_LEAGUES, JSON.stringify(leagues));
  saveH2HLeagueToFirestore(newLeague).catch(() => {});
  
  // Also create initial standings entry for creator
  const standings = getH2HStandings();
  const creatorUser = getUsers().find((u) => u.id === createdByUserId);
  standings.push({
    id: `std-${Date.now()}`,
    leagueId: newLeague.id,
    userId: createdByUserId,
    playerName: administratorName || creatorUser?.name || 'Player',
    avatarUrl: creatorUser?.avatarUrl,
    rank: 1,
    previousRank: 1,
    positionMovement: 0,
    movementDirection: 'SAME',
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    correctWinners: 0,
    perfectPredictions: 0,
    totalScore: 0,
    differential: 0,
    lastFiveForm: [],
    winningStreak: 0,
    competitionPoints: 0,
    favoriteTeamId: creatorUser?.favoriteTeamId || 'WARRIORS',
    membershipTier: creatorUser?.membership?.tier || 'free',
  });
  localStorage.setItem(STORAGE_KEYS.H2H_STANDINGS, JSON.stringify(standings));

  return newLeague;
}

export function joinH2HLeagueByCode(code: string, userId: string): HeadToHeadLeague | null {
  const leagues = getH2HLeagues();
  const league = leagues.find((l) => l.code.trim().toUpperCase() === code.trim().toUpperCase());
  if (!league) return null;

  if (!league.memberUserIds.includes(userId)) {
    league.memberUserIds.push(userId);
    localStorage.setItem(STORAGE_KEYS.H2H_LEAGUES, JSON.stringify(leagues));

    // Add standing entry
    const standings = getH2HStandings();
    const user = getUsers().find((u) => u.id === userId);
    standings.push({
      id: `std-${Date.now()}`,
      leagueId: league.id,
      userId,
      playerName: user?.name || 'New Tipper',
      avatarUrl: user?.avatarUrl,
      rank: standings.filter((s) => s.leagueId === league.id).length + 1,
      previousRank: standings.filter((s) => s.leagueId === league.id).length + 1,
      positionMovement: 0,
      movementDirection: 'SAME',
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      correctWinners: 0,
      perfectPredictions: 0,
      totalScore: 0,
      differential: 0,
      lastFiveForm: [],
      winningStreak: 0,
      competitionPoints: 0,
      favoriteTeamId: user?.favoriteTeamId || 'WARRIORS',
      membershipTier: user?.membership?.tier || 'free',
    });
    localStorage.setItem(STORAGE_KEYS.H2H_STANDINGS, JSON.stringify(standings));
  }

  return league;
}

/**
 * EXACT DUELS LADDER RANKING ORDER (as required by prompt specifications):
 * 1. Most Competition Points (descending)
 * 2. Best Differential (descending - higher positive diff is better)
 * 3. Lowest cumulative Total Score (ascending - lower total score is better)
 * 4. Most Perfect Predictions (descending)
 * 5. Most Correct Winners (descending)
 * 6. Most Head-to-Head wins (descending)
 * 7. Alphabetical player name (ascending)
 */
export function sortH2HStandings(standings: HeadToHeadStanding[]): HeadToHeadStanding[] {
  return [...standings].sort((a, b) => {
    if (b.competitionPoints !== a.competitionPoints) {
      return b.competitionPoints - a.competitionPoints; // 1. Competition Points
    }
    if (b.differential !== a.differential) {
      return b.differential - a.differential; // 2. Differential (higher positive is better)
    }
    if (a.totalScore !== b.totalScore) {
      return a.totalScore - b.totalScore; // 3. Total Score (lower is better)
    }
    if (b.perfectPredictions !== a.perfectPredictions) {
      return b.perfectPredictions - a.perfectPredictions; // 4. Perfect Predictions
    }
    if (b.correctWinners !== a.correctWinners) {
      return b.correctWinners - a.correctWinners; // 5. Correct Winners
    }
    if (b.wins !== a.wins) {
      return b.wins - a.wins; // 6. Head-to-Head wins
    }
    return a.playerName.localeCompare(b.playerName); // 7. Alphabetical fallback
  });
}

export function getH2HStandings(leagueId?: string): HeadToHeadStanding[] {
  initializeStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.H2H_STANDINGS);
  const standings: HeadToHeadStanding[] = raw ? JSON.parse(raw) : SEEDED_H2H_STANDINGS;
  
  const filtered = leagueId ? standings.filter((s) => s.leagueId === leagueId) : standings;
  const sorted = sortH2HStandings(filtered);

  // Dynamically assign ranks based on strict sorting rule
  return sorted.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));
}

export function ensureH2HRandomPairings(
  leagueId: string = 'h2h-r24-beta',
  roundId: string = 'round-24',
  forceReshuffle: boolean = false
): HeadToHeadMatchup[] {
  initializeStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.H2H_MATCHUPS);
  let allMatchups: HeadToHeadMatchup[] = raw ? JSON.parse(raw) : SEEDED_H2H_MATCHUPS;

  const existingRoundMatchups = allMatchups.filter(
    (m) => m.leagueId === leagueId && m.roundId === roundId
  );

  // If pairings already exist for this round & league and not forcing reshuffle, return existing
  if (existingRoundMatchups.length > 0 && !forceReshuffle) {
    return existingRoundMatchups;
  }

  // Gather players from league members and registered users
  const league = getH2HLeagueById(leagueId);
  const allUsers = getUsers();
  let playerIds = Array.from(
    new Set([...(league?.memberUserIds || []), ...allUsers.map((u) => u.id)])
  );

  if (playerIds.length === 0) {
    playerIds = ['system'];
  }

  // Fisher-Yates random shuffle for Head to Head pairing
  const shuffled = [...playerIds];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  if (shuffled.length % 2 !== 0) {
    shuffled.push('BYE');
  }

  const newRoundMatchups: HeadToHeadMatchup[] = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    const p1 = shuffled[i];
    const p2 = shuffled[i + 1];
    newRoundMatchups.push({
      id: `h2h-rand-${leagueId}-${roundId}-${i / 2}`,
      leagueId,
      roundId,
      roundNumber: 24,
      player1Id: p1,
      player2Id: p2,
      player1RoundScore: 0,
      player2RoundScore: 0,
      player1Differential: 0,
      player2Differential: 0,
      winnerUserId: p2 === 'BYE' ? p1 : null,
      status: p2 === 'BYE' ? 'BYE' : 'UPCOMING',
      winningDifference: 0,
    });
  }

  // Update storage
  const otherMatchups = allMatchups.filter(
    (m) => !(m.leagueId === leagueId && m.roundId === roundId)
  );
  const updatedAll = [...otherMatchups, ...newRoundMatchups];
  localStorage.setItem(STORAGE_KEYS.H2H_MATCHUPS, JSON.stringify(updatedAll));

  return newRoundMatchups;
}

export function getH2HMatchups(leagueId?: string, roundId?: string): HeadToHeadMatchup[] {
  initializeStorage();
  const targetLeagueId = leagueId || 'h2h-r24-beta';
  const targetRoundId = roundId || 'round-24';

  // Ensure random pairs exist
  ensureH2HRandomPairings(targetLeagueId, targetRoundId);

  const raw = localStorage.getItem(STORAGE_KEYS.H2H_MATCHUPS);
  let matchups: HeadToHeadMatchup[] = raw ? JSON.parse(raw) : SEEDED_H2H_MATCHUPS;

  if (leagueId) {
    matchups = matchups.filter((m) => m.leagueId === leagueId);
  }
  if (roundId) {
    matchups = matchups.filter((m) => m.roundId === roundId);
  }
  return matchups;
}

export function saveH2HMatchup(matchup: HeadToHeadMatchup): void {
  const matchups = getH2HMatchups();
  const idx = matchups.findIndex((m) => m.id === matchup.id);
  if (idx >= 0) {
    matchups[idx] = matchup;
  } else {
    matchups.push(matchup);
  }
  localStorage.setItem(STORAGE_KEYS.H2H_MATCHUPS, JSON.stringify(matchups));
}

export function getH2HPositionMovements(leagueId?: string): HeadToHeadPositionMovement[] {
  initializeStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.H2H_POSITION_MOVEMENTS);
  const records: HeadToHeadPositionMovement[] = raw ? JSON.parse(raw) : SEEDED_H2H_POSITION_MOVEMENTS;
  if (leagueId) {
    return records.filter((r) => r.leagueId === leagueId);
  }
  return records;
}

export function getH2HFinals(leagueId?: string): HeadToHeadFinalMatchup[] {
  initializeStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.H2H_FINALS);
  const finals: HeadToHeadFinalMatchup[] = raw ? JSON.parse(raw) : SEEDED_H2H_FINALS;
  if (leagueId) {
    return finals.filter((f) => f.leagueId === leagueId);
  }
  return finals;
}

/**
 * Round-Robin scheduling algorithm for Head-to-Head leagues
 */
export function generateH2HSeasonSchedule(leagueId: string): HeadToHeadMatchup[] {
  const league = getH2HLeagueById(leagueId);
  if (!league) return [];

  const rounds = getRounds();
  const memberIds = [...league.memberUserIds];
  if (memberIds.length % 2 !== 0) {
    memberIds.push('BYE');
  }

  const numTeams = memberIds.length;
  const numRounds = rounds.length; // e.g. 27 NRL rounds
  const matchups: HeadToHeadMatchup[] = [];

  const teams = [...memberIds];

  for (let r = 0; r < numRounds; r++) {
    const round = rounds[r] || { id: `round-${r + 1}`, number: r + 1 };

    for (let i = 0; i < numTeams / 2; i++) {
      const p1 = teams[i];
      const p2 = teams[numTeams - 1 - i];

      if (p1 !== 'BYE' || p2 !== 'BYE') {
        matchups.push({
          id: `h2h-m-${leagueId}-r${round.number}-${i}`,
          leagueId,
          roundId: round.id,
          roundNumber: round.number,
          player1Id: p1,
          player2Id: p2,
          player1RoundScore: 0,
          player2RoundScore: 0,
          player1Differential: 0,
          player2Differential: 0,
          winnerUserId: p2 === 'BYE' ? p1 : null,
          status: p2 === 'BYE' ? 'BYE' : 'UPCOMING',
          winningDifference: 0,
        });
      }
    }

    // Rotate teams (keep index 0 fixed)
    teams.splice(1, 0, teams.pop()!);
  }

  const existingMatchups = getH2HMatchups().filter((m) => m.leagueId !== leagueId);
  const allMatchups = [...existingMatchups, ...matchups];
  localStorage.setItem(STORAGE_KEYS.H2H_MATCHUPS, JSON.stringify(allMatchups));

  return matchups;
}

export async function syncFirestoreDataToStorage(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const [remoteUsers, remoteTips, remoteLeagues, remoteH2HLeagues, remoteFixtures] = await Promise.all([
      fetchAllUsersFromFirestore(),
      fetchAllTipsFromFirestore(),
      fetchLeaguesFromFirestore(),
      fetchH2HLeaguesFromFirestore(),
      fetchFixturesFromFirestore(),
    ]);

    const localUsers = getUsers();
    const userMap = new Map<string, User>();
    localUsers.forEach((u) => {
      if (u && (u.id || u.uid)) userMap.set(u.id || u.uid, u);
    });
    if (remoteUsers && remoteUsers.length > 0) {
      remoteUsers.forEach((u) => {
        if (u && (u.id || u.uid)) userMap.set(u.id || u.uid, u);
      });
    }
    const allUsersList = Array.from(userMap.values());
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(allUsersList));
    allUsersList.forEach((u) => {
      autoJoinDefaultLeagues(u);
    });

    if (remoteTips && remoteTips.length > 0) {
      const localTips = getTips();
      const tipMap = new Map<string, Tip>();
      localTips.forEach((t) => tipMap.set(`${t.userId}_${t.fixtureId}`, t));
      remoteTips.forEach((t) => tipMap.set(`${t.userId}_${t.fixtureId}`, t));
      localStorage.setItem(STORAGE_KEYS.TIPS, JSON.stringify(Array.from(tipMap.values())));
    }

    if (remoteLeagues && remoteLeagues.length > 0) {
      const localLeagues = getLeagues();
      const leagueMap = new Map<string, League>();
      localLeagues.forEach((l) => leagueMap.set(l.id, l));
      remoteLeagues.forEach((l) => leagueMap.set(l.id, l));
      localStorage.setItem(STORAGE_KEYS.LEAGUES, JSON.stringify(Array.from(leagueMap.values())));
    }

    if (remoteH2HLeagues && remoteH2HLeagues.length > 0) {
      const localH2H = getH2HLeagues();
      const h2hMap = new Map<string, HeadToHeadLeague>();
      localH2H.forEach((l) => h2hMap.set(l.id, l));
      remoteH2HLeagues.forEach((l) => h2hMap.set(l.id, l));
      localStorage.setItem(STORAGE_KEYS.H2H_LEAGUES, JSON.stringify(Array.from(h2hMap.values())));
    }

    if (remoteFixtures && remoteFixtures.length > 0) {
      const localFixtures = getFixtures();
      const map = new Map<string, Fixture>();
      SEEDED_FIXTURES.forEach((sf) => map.set(sf.id, sf));
      localFixtures.forEach((f) => map.set(f.id, f));
      remoteFixtures.forEach((f) => {
        if (f && f.id) map.set(f.id, { ...map.get(f.id), ...f });
      });
      localStorage.setItem(STORAGE_KEYS.FIXTURES, JSON.stringify(Array.from(map.values())));
    }
  } catch (err) {
    console.warn('Sync from Firestore failed:', err);
  }
}

