/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Swords,
  Plus,
  Trophy,
  Flame,
  Search,
  ArrowUp,
  ArrowDown,
  Minus,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Users,
  Calendar,
  BarChart3,
  Award,
  Sparkles,
  ChevronRight,
  Shield,
  Filter,
  UserCheck,
  Zap,
  TrendingUp,
  Crown,
  Eye,
  Info,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import {
  HeadToHeadDuel,
  HeadToHeadLeague,
  HeadToHeadMatchup,
  HeadToHeadStanding,
  User,
  MembershipTier,
  Fixture
} from '../types';
import {
  createH2HLeague,
  ensureH2HRandomPairings,
  getFixturesForRound,
  getH2HFinals,
  getH2HLeagueById,
  getH2HLeagues,
  getH2HMatchups,
  getH2HPositionMovements,
  getH2HStandings,
  getRounds,
  getTips,
  getUsers,
  joinH2HLeagueByCode,
  saveH2HMatchup
} from '../services/storageService';
import { getTeamById } from '../data/nrlTeams';
import { PlayerProfileModal } from '../components/PlayerProfileModal';

interface DuelsViewProps {
  currentUser: User;
  initialTab?: string;
  onLogout?: () => void;
}

export const DuelsView: React.FC<DuelsViewProps> = ({ currentUser, initialTab = 'overview', onLogout }) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('h2h-r25-beta');
  const [selectedRoundId, setSelectedRoundId] = useState<string>('nrl-2026-round-25');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showTopTenOnly, setShowTopTenOnly] = useState<boolean>(false);
  const [selectedPlayerStanding, setSelectedPlayerStanding] = useState<HeadToHeadStanding | null>(null);
  const [selectedUserForModal, setSelectedUserForModal] = useState<User | null>(null);
  const [sortBy, setSortBy] = useState<string>('default');

  // Modals state
  const [showChallengeModal, setShowChallengeModal] = useState<boolean>(false);
  const [showCreateLeagueModal, setShowCreateLeagueModal] = useState<boolean>(false);
  const [showJoinLeagueModal, setShowJoinLeagueModal] = useState<boolean>(false);

  // Forms state
  const [challengeOpponentId, setChallengeOpponentId] = useState<string>('');
  const [newLeagueName, setNewLeagueName] = useState<string>('');
  const [newLeagueDesc, setNewLeagueDesc] = useState<string>('');
  const [newLeagueIsPrivate, setNewLeagueIsPrivate] = useState<boolean>(false);
  const [joinLeagueCode, setJoinLeagueCode] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Data fetching
  const leagues = getH2HLeagues();
  const currentLeague = getH2HLeagueById(selectedLeagueId) || leagues[0];
  const standings = getH2HStandings(selectedLeagueId);
  const matchups = getH2HMatchups(selectedLeagueId);
  const currentRoundMatchups = matchups.filter((m) => m.roundId === selectedRoundId);
  const rounds = getRounds();
  const currentRoundObj = rounds.find((r) => r.id === selectedRoundId) || rounds.find((r) => r.isCurrent) || rounds[0];
  const positionMovements = getH2HPositionMovements(selectedLeagueId);
  const finalsList = getH2HFinals(selectedLeagueId);
  const allUsers = getUsers();

  // Signed in user standing in current H2H league
  const myStanding = standings.find((s) => s.userId === currentUser.id) || standings[0];
  
  // Signed in user current round matchup
  const myCurrentMatchup = currentRoundMatchups.find(
    (m) => m.player1Id === currentUser.id || m.player2Id === currentUser.id
  ) || currentRoundMatchups[0];

  const opponentUser = myCurrentMatchup
    ? allUsers.find((u) => u.id === (myCurrentMatchup.player1Id === currentUser.id ? myCurrentMatchup.player2Id : myCurrentMatchup.player1Id))
    : null;

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sort and filter standings
  let displayedStandings = [...standings];

  if (searchQuery.trim()) {
    displayedStandings = displayedStandings.filter((s) =>
      s.playerName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  if (showTopTenOnly) {
    displayedStandings = displayedStandings.slice(0, 10);
  }

  if (sortBy === 'pts') {
    displayedStandings.sort((a, b) => b.competitionPoints - a.competitionPoints);
  } else if (sortBy === 'diff') {
    displayedStandings.sort((a, b) => b.differential - a.differential);
  } else if (sortBy === 'score') {
    displayedStandings.sort((a, b) => a.totalScore - b.totalScore); // Lower total score is better
  } else if (sortBy === 'wins') {
    displayedStandings.sort((a, b) => b.wins - a.wins);
  } else if (sortBy === 'pp') {
    displayedStandings.sort((a, b) => b.perfectPredictions - a.perfectPredictions);
  } else if (sortBy === 'cw') {
    displayedStandings.sort((a, b) => b.correctWinners - a.correctWinners);
  } else if (sortBy === 'name') {
    displayedStandings.sort((a, b) => a.playerName.localeCompare(b.playerName));
  }

  const handleCreateLeagueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeagueName.trim()) return;
    const created = createH2HLeague(
      newLeagueName,
      newLeagueDesc,
      newLeagueIsPrivate,
      currentUser.id,
      currentUser.name
    );
    setSelectedLeagueId(created.id);
    setShowCreateLeagueModal(false);
    setNewLeagueName('');
    setNewLeagueDesc('');
    triggerToast(`Created Head-to-Head League: ${created.name} (Code: ${created.code})`);
  };

  const handleJoinLeagueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinLeagueCode.trim()) return;
    const joined = joinH2HLeagueByCode(joinLeagueCode, currentUser.id);
    if (joined) {
      setSelectedLeagueId(joined.id);
      setShowJoinLeagueModal(false);
      setJoinLeagueCode('');
      triggerToast(`Joined Head-to-Head League: ${joined.name}`);
    } else {
      triggerToast('Invalid League Code. Please check and try again.');
    }
  };

  const handleIssueChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeOpponentId) return;
    const opp = allUsers.find((u) => u.id === challengeOpponentId);
    setShowChallengeModal(false);
    triggerToast(`1v1 Head-to-Head Challenge sent to ${opp?.name || 'opponent'} for Round 20!`);
  };

  return (
    <div className="space-y-6 pb-16 animate-fadeIn">
      {/* Player Profile & Picks Modal */}
      {selectedUserForModal && (
        <PlayerProfileModal
          user={selectedUserForModal}
          onClose={() => setSelectedUserForModal(null)}
          isAdmin={currentUser.isAdmin}
        />
      )}
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-[#FFBF00] text-[#031128] font-black text-xs px-4 py-3 rounded-xl shadow-2xl border border-white/20 flex items-center gap-2 animate-bounce">
          <Zap className="w-4 h-4 text-[#031128]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Hero Header */}
      <div className="bg-[#031128] text-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-[#0A2D55] shadow-2xl relative overflow-hidden">
        {/* Background Accent Glow */}
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-[#FFBF00]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-1.5 sm:space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-[#FFBF00] text-[#031128] font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                <Swords className="w-3 h-3" /> Season Head-to-Head Competition
              </span>
              <span className="bg-[#0A2D55] text-[#FFE179] text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#0A2D55]">
                {currentLeague?.name} ({currentLeague?.code})
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white font-sans">
              Head-to-Head Duels
            </h1>

            {/* MANDATORY RETENTION MESSAGE */}
            <p className="text-[#FFE179] font-black text-xs sm:text-base tracking-wide flex items-center gap-1.5 pt-0.5">
              <Sparkles className="w-4 h-4 text-[#FFBF00] shrink-0" />
              “Every round is a new matchup. Every result matters.”
            </p>

            <p className="text-slate-300 text-xs sm:text-sm">
              Face off weekly against mates. Your standard NRL margin tips automatically power both the Overall Competition and your Head-to-Head matchups.
            </p>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
            <button
              onClick={() => setShowChallengeModal(true)}
              className="flex-1 sm:flex-none justify-center bg-[#FFBF00] hover:bg-[#FFE179] text-[#031128] font-extrabold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg transition-transform hover:scale-105"
            >
              <Swords className="w-4 h-4" /> Challenge
            </button>
            <button
              onClick={() => setShowCreateLeagueModal(true)}
              className="flex-1 sm:flex-none justify-center bg-[#0A2D55] hover:bg-[#0A2D55]/80 text-white font-bold px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs border border-[#0A2D55] flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4 text-[#FFBF00]" /> Create League
            </button>
            <button
              onClick={() => setShowJoinLeagueModal(true)}
              className="flex-1 sm:flex-none justify-center bg-white/10 hover:bg-white/20 text-white font-bold px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs border border-white/20 flex items-center gap-1.5 transition-colors"
            >
              <Users className="w-4 h-4" /> Join League
            </button>
          </div>
        </div>

        {/* League Selector Ribbon */}
        <div className="mt-4 sm:mt-6 pt-4 sm:pt-5 border-t border-[#0A2D55] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Active League:</span>
            <select
              value={selectedLeagueId}
              onChange={(e) => setSelectedLeagueId(e.target.value)}
              className="bg-[#020812] text-white border border-[#0A2D55] rounded-xl text-xs font-bold px-3 py-1.5 focus:ring-2 focus:ring-[#FFBF00] outline-none flex-1 sm:flex-none"
            >
              {leagues.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.memberUserIds.length} Tippers)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
            <span>Admin: <strong className="text-white">{currentLeague?.administratorName}</strong></span>
            <span>Format: <strong className="text-[#FFBF00]">{currentLeague?.seasonFormat}</strong></span>
            <span>Finals: <strong className="text-white">{currentLeague?.finalsEnabled ? 'Top 8 Bracket' : 'None'}</strong></span>
          </div>
        </div>

        {/* 2 Hours Before First Game Random Pairing Banner */}
        <div className="mt-4 p-3.5 bg-[#020812] border border-[#0A2D55] rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FFBF00]/10 border border-[#FFBF00]/30 flex items-center justify-center text-[#FFBF00] shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="font-extrabold text-white text-xs flex items-center gap-2">
                <span>Random H2H Matchmaking Rules</span>
                <span className="bg-[#159B5D]/20 text-[#159B5D] text-[9px] font-black px-2 py-0.5 rounded-full border border-[#159B5D]/30 uppercase">
                  Automated Cutoff
                </span>
              </p>
              <p className="text-slate-300 text-[11px] mt-0.5">
                Exactly <strong>2 hours before the first match</strong> of Round 24 starts, all players in the Head-to-Head league are randomly paired against each other for the round.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              ensureH2HRandomPairings(selectedLeagueId, selectedRoundId, true);
              triggerToast('⚡ H2H Random Pairings re-shuffled for Round 24!');
            }}
            className="px-3 py-1.5 rounded-lg bg-[#0A2D55] hover:bg-[#0A2D55]/80 text-[#FFBF00] font-bold text-[11px] flex items-center gap-1.5 border border-[#FFBF00]/30 shrink-0 transition-all active:scale-95"
            title="Force random pairing reshuffle for current round"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reshuffle Random Pairings</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#DDE4EC] overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'overview', label: 'H2H Overview', icon: Trophy },
          { id: 'ladder', label: 'Detailed H2H Ladder', icon: BarChart3 },
          { id: 'fixtures', label: 'Season Matchups', icon: Calendar },
          { id: 'matchup', label: 'Live Duel Matchup', icon: Swords },
          { id: 'leagues', label: 'All Leagues', icon: Users },
          { id: 'finals', label: 'Finals Bracket', icon: Crown },
          { id: 'stats', label: 'H2H Statistics', icon: TrendingUp },
          { id: 'movers', label: 'Position Movers', icon: Zap },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
                isActive
                  ? 'bg-[#031128] text-[#FFBF00] shadow-md border border-[#0A2D55]'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-[#031128]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#FFBF00]' : 'text-gray-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Summary Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#DDE4EC] p-5 rounded-2xl shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Ladder Position</span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-[#031128]">
                  {myStanding ? `#${myStanding.rank}` : '-'}
                </span>
                {myStanding && (
                  <span className="text-xs font-extrabold text-[#159B5D] bg-[#159B5D]/10 px-2 py-0.5 rounded">
                    Rank #{myStanding.rank}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500 pt-1">
                Out of {standings.length} tippers in {currentLeague?.name || 'Head-to-Head League'}
              </p>
            </div>

            <div className="bg-white border border-[#DDE4EC] p-5 rounded-2xl shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Competition Points</span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-[#FFBF00] font-mono">
                  {myStanding?.competitionPoints ?? 0}
                </span>
                <span className="text-xs font-bold text-gray-600 font-mono">Win: 2 | Draw: 1</span>
              </div>
              <p className="text-[11px] text-gray-500 pt-1">
                {myStanding?.wins ?? 0} Wins, {myStanding?.draws ?? 0} Draws, {myStanding?.losses ?? 0} Losses
              </p>
            </div>

            <div className="bg-white border border-[#DDE4EC] p-5 rounded-2xl shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Season Differential</span>
              <div className="flex items-baseline justify-between">
                <span
                  className={`text-3xl font-black font-mono ${
                    (myStanding?.differential || 0) >= 0 ? 'text-[#159B5D]' : 'text-[#DF4351]'
                  }`}
                >
                  {(myStanding?.differential || 0) > 0 ? `+${myStanding?.differential}` : (myStanding?.differential ?? 0)}
                </span>
                <span className="text-xs font-bold text-gray-600">Opp Margin Difference</span>
              </div>
              <p className="text-[11px] text-gray-500 pt-1">Sum of all completed matchup differentials</p>
            </div>

            <div className="bg-white border border-[#DDE4EC] p-5 rounded-2xl shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Form & Streak</span>
              <div className="flex items-center gap-1 mt-1 min-h-[24px]">
                {myStanding?.lastFiveForm && myStanding.lastFiveForm.length > 0 ? (
                  myStanding.lastFiveForm.map((res, i) => (
                    <span
                      key={i}
                      className={`w-6 h-6 rounded flex items-center justify-center font-black text-xs text-white ${
                        res === 'W' ? 'bg-[#159B5D]' : res === 'D' ? 'bg-[#FFBF00] text-[#031128]' : 'bg-[#DF4351]'
                      }`}
                    >
                      {res}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400 italic">No games played yet</span>
                )}
              </div>
              <p className="text-[11px] text-gray-500 pt-2 font-semibold">
                Winning Streak: <strong className="text-[#031128] font-bold">{myStanding?.winningStreak ?? 0} Games</strong>
              </p>
            </div>
          </div>

          {/* Current Live Matchup Feature Banner */}
          <div className="bg-[#031128] text-white p-6 rounded-2xl border border-[#0A2D55] shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#0A2D55] pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-[#DF4351] text-white text-[10px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider">
                  {myCurrentMatchup?.status === 'LIVE' ? 'LIVE MATCHUP' : 'ROUND MATCHUP'}
                </span>
                <span className="text-xs font-bold text-[#FFE179]">{currentRoundObj?.name || 'Round 24'} H2H Clash</span>
              </div>
              <button
                onClick={() => setActiveTab('matchup')}
                className="text-xs text-[#FFBF00] hover:underline font-bold flex items-center gap-1"
              >
                Inspect Game-by-Game Tips <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {myCurrentMatchup && opponentUser ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center text-center">
                {/* Fighter 1 (User) */}
                <div className="flex flex-col items-center space-y-2 p-3 bg-[#020812] rounded-xl border border-[#0A2D55]">
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-[#FFBF00]"
                  />
                  <div>
                    <p className="font-extrabold text-base text-white">{currentUser.name} (You)</p>
                    <p className="text-xs text-slate-400">
                      Rank #{myStanding?.rank ?? 1} • {myStanding?.competitionPoints ?? 0} Pts
                    </p>
                  </div>
                  <div className="bg-[#031128] px-3 py-1 rounded-lg border border-[#0A2D55] mt-2">
                    <span className="text-2xl font-black text-[#FFBF00] font-mono">
                      {myCurrentMatchup.player1Id === currentUser.id
                        ? myCurrentMatchup.player1RoundScore
                        : myCurrentMatchup.player2RoundScore}{' '}
                      <span className="text-xs text-slate-400 font-sans">Margin Pts</span>
                    </span>
                  </div>
                </div>

                {/* VS Center Pillar */}
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-[#FFBF00] text-[#031128] rounded-full inline-flex items-center justify-center font-black text-lg shadow-xl mx-auto">
                    VS
                  </div>
                  <p className="text-xs font-extrabold text-[#FFE179] uppercase">
                    {myCurrentMatchup.status === 'LIVE' ? 'Match In Progress' : 'Matchup Status'}
                  </p>
                  <div className="text-xs text-slate-300 bg-[#0A2D55]/60 p-2 rounded-lg font-mono">
                    Lead: <strong className="text-[#159B5D]">+{myCurrentMatchup.winningDifference || 0} pts</strong>
                  </div>
                </div>

                {/* Fighter 2 (Opponent) */}
                <div className="flex flex-col items-center space-y-2 p-3 bg-[#020812] rounded-xl border border-[#0A2D55]">
                  <img
                    src={opponentUser.avatarUrl}
                    alt={opponentUser.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-600"
                  />
                  <div>
                    <p className="font-extrabold text-base text-white">{opponentUser.name}</p>
                    <p className="text-xs text-slate-400">
                      {opponentUser.username ? `@${opponentUser.username}` : 'Participant'}
                    </p>
                  </div>
                  <div className="bg-[#031128] px-3 py-1 rounded-lg border border-[#0A2D55] mt-2">
                    <span className="text-2xl font-black text-slate-300 font-mono">
                      {myCurrentMatchup.player1Id === currentUser.id
                        ? myCurrentMatchup.player2RoundScore
                        : myCurrentMatchup.player1RoundScore}{' '}
                      <span className="text-xs text-slate-400 font-sans">Margin Pts</span>
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-3">
                <Swords className="w-10 h-10 text-[#FFBF00] mx-auto opacity-80" />
                <p className="text-sm font-bold text-slate-200">No active head-to-head duel matchup assigned for this round.</p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Issue a 1v1 challenge to a friend or join a Head-to-Head league to generate round-by-round fixture matchups!
                </p>
                <button
                  onClick={() => setShowChallengeModal(true)}
                  className="bg-[#FFBF00] hover:bg-[#FFE179] text-[#031128] font-black text-xs px-4 py-2 rounded-xl transition-transform hover:scale-105 inline-flex items-center gap-1.5 shadow"
                >
                  <Swords className="w-3.5 h-3.5" /> Issue 1v1 Challenge
                </button>
              </div>
            )}
          </div>

          {/* Quick Nav Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setActiveTab('ladder')}
              className="p-5 bg-white border border-[#DDE4EC] rounded-2xl text-left hover:border-[#FFBF00] transition-colors shadow-sm space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <BarChart3 className="w-6 h-6 text-[#031128] group-hover:text-[#FFBF00]" />
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="font-extrabold text-sm text-[#031128] uppercase">Detailed Season Ladder</h3>
              <p className="text-xs text-gray-500">
                15 desktop columns, rank movements, differential tie-breakers and full player stats.
              </p>
            </button>

            <button
              onClick={() => setActiveTab('fixtures')}
              className="p-5 bg-white border border-[#DDE4EC] rounded-2xl text-left hover:border-[#FFBF00] transition-colors shadow-sm space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <Calendar className="w-6 h-6 text-[#031128] group-hover:text-[#FFBF00]" />
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="font-extrabold text-sm text-[#031128] uppercase">Round-by-Round Matchups</h3>
              <p className="text-xs text-gray-500">
                Inspect past clear wins, narrow finishes, draws, and upcoming round fixtures.
              </p>
            </button>

            <button
              onClick={() => setActiveTab('finals')}
              className="p-5 bg-white border border-[#DDE4EC] rounded-2xl text-left hover:border-[#FFBF00] transition-colors shadow-sm space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <Crown className="w-6 h-6 text-[#031128] group-hover:text-[#FFBF00]" />
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="font-extrabold text-sm text-[#031128] uppercase">Finals Series Bracket</h3>
              <p className="text-xs text-gray-500">
                Top 8 postseason knockout path to the Head-to-Head Championship trophy.
              </p>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: DETAILED H2H LADDER */}
      {activeTab === 'ladder' && (
        <div className="space-y-6">
          {/* Controls & Filter Bar */}
          <div className="bg-white border border-[#DDE4EC] p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search player..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 rounded-xl border border-[#DDE4EC] text-xs font-medium focus:ring-2 focus:ring-[#FFBF00] outline-none"
                />
              </div>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="p-1.5 rounded-xl border border-[#DDE4EC] text-xs font-bold text-gray-700 focus:ring-2 focus:ring-[#FFBF00] outline-none"
              >
                <option value="default">Sort: Default H2H Ranking</option>
                <option value="pts">Sort: Competition Points</option>
                <option value="diff">Sort: Differential</option>
                <option value="score">Sort: Lowest Total Score</option>
                <option value="wins">Sort: Wins</option>
                <option value="pp">Sort: Perfect Predictions</option>
                <option value="cw">Sort: Correct Winners</option>
                <option value="name">Sort: Player Name</option>
              </select>

              {/* Find Me Button */}
              <button
                onClick={() => {
                  setSearchQuery(currentUser.name);
                }}
                className="bg-[#0A2D55] text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-[#031128] transition-colors"
              >
                Find Me
              </button>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-gray-600 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTopTenOnly}
                  onChange={(e) => setShowTopTenOnly(e.target.checked)}
                  className="rounded border-gray-300 text-[#FFBF00] focus:ring-[#FFBF00]"
                />
                Show Top 10 Only
              </label>

              <span className="text-xs text-gray-400 font-mono">
                Showing {displayedStandings.length} / {standings.length} tippers
              </span>
            </div>
          </div>

          {/* DESKTOP 15-COLUMN LADDER TABLE */}
          <div className="hidden md:block bg-white rounded-2xl border border-[#DDE4EC] shadow-sm overflow-hidden">
            {displayedStandings.length === 0 ? (
              <div className="p-12 text-center text-[#031128]">
                <Swords className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-black uppercase text-[#031128]">No completed matchups yet.</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                  Head-to-Head duels and ladder standings will calculate once official Round 24 match results are finalized.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#031128] text-white text-[11px] font-black uppercase tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="py-3 px-3 text-center">Rank</th>
                    <th className="py-3 px-2 text-center">Move</th>
                    <th className="py-3 px-4">Player</th>
                    <th className="py-3 px-2 text-center">Badge</th>
                    <th className="py-3 px-2 text-center">P</th>
                    <th className="py-3 px-2 text-center text-[#159B5D]">W</th>
                    <th className="py-3 px-2 text-center text-[#FFBF00]">D</th>
                    <th className="py-3 px-2 text-center text-[#DF4351]">L</th>
                    <th className="py-3 px-2 text-center">CW</th>
                    <th className="py-3 px-2 text-center">PP</th>
                    <th className="py-3 px-3 text-center">Total Score</th>
                    <th className="py-3 px-3 text-center">Diff</th>
                    <th className="py-3 px-3 text-center">Form</th>
                    <th className="py-3 px-2 text-center">Streak</th>
                    <th className="py-3 px-4 text-center bg-[#0A2D55] text-[#FFBF00]">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE4EC] text-xs font-medium">
                  {displayedStandings.map((s) => {
                    const isMe = s.userId === currentUser.id;
                    const isTopFour = s.rank <= 4;
                    const isTopEight = s.rank <= 8;

                    return (
                      <tr
                        key={s.id}
                        onClick={() => setSelectedPlayerStanding(s)}
                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                          isMe
                            ? 'bg-[#FFBF00]/10 font-bold border-l-4 border-l-[#FFBF00]'
                            : s.rank % 2 === 0
                            ? 'bg-[#EEF2F6]/40'
                            : 'bg-white'
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-3.5 px-3 text-center font-black">
                          <span
                            className={`w-6 h-6 rounded-lg inline-flex items-center justify-center font-mono ${
                              s.rank === 1
                                ? 'bg-[#FFBF00] text-[#031128] font-black'
                                : isTopFour
                                ? 'bg-[#0A2D55] text-white'
                                : 'text-gray-700'
                            }`}
                          >
                            {s.rank}
                          </span>
                        </td>

                        {/* Movement */}
                        <td className="py-3.5 px-2 text-center">
                          {s.movementDirection === 'UP' && (
                            <span className="text-[#159B5D] font-black text-[10px] inline-flex items-center gap-0.5">
                              <ArrowUp className="w-3 h-3" />
                              {s.positionMovement}
                            </span>
                          )}
                          {s.movementDirection === 'DOWN' && (
                            <span className="text-[#DF4351] font-black text-[10px] inline-flex items-center gap-0.5">
                              <ArrowDown className="w-3 h-3" />
                              {Math.abs(s.positionMovement)}
                            </span>
                          )}
                          {s.movementDirection === 'SAME' && (
                            <span className="text-gray-400 font-bold text-[10px]">
                              —
                            </span>
                          )}
                        </td>

                        {/* Player */}
                        <td className="py-3.5 px-4 font-bold text-[#111D31]">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={s.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                              alt={s.playerName}
                              className="w-7 h-7 rounded-lg object-cover border border-[#DDE4EC]"
                            />
                            <div>
                              <p className="flex items-center gap-1.5">
                                {s.playerName}
                                {isMe && (
                                  <span className="bg-[#FFBF00] text-[#031128] text-[9px] font-black px-1.5 py-0.2 rounded uppercase">
                                    YOU
                                  </span>
                                )}
                              </p>
                              {isTopFour && (
                                <span className="text-[9px] text-[#159B5D] font-bold uppercase">
                                  Finals Qualified
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Membership Badge */}
                        <td className="py-3.5 px-2 text-center">
                          {s.membershipTier === 'margin-pro' && (
                            <span className="bg-[#FFBF00]/20 text-[#031128] font-black text-[9px] px-2 py-0.5 rounded border border-[#FFBF00]/40 uppercase">
                              PRO
                            </span>
                          )}
                          {s.membershipTier === 'margin-plus' && (
                            <span className="bg-[#0A2D55]/10 text-[#0A2D55] font-bold text-[9px] px-2 py-0.5 rounded uppercase">
                              PLUS
                            </span>
                          )}
                          {(!s.membershipTier || s.membershipTier === 'free') && (
                            <span className="text-gray-400 text-[9px] font-mono uppercase">FREE</span>
                          )}
                        </td>

                        {/* P, W, D, L */}
                        <td className="py-3.5 px-2 text-center font-mono text-gray-700">{s.played}</td>
                        <td className="py-3.5 px-2 text-center font-mono font-bold text-[#159B5D]">{s.wins}</td>
                        <td className="py-3.5 px-2 text-center font-mono text-[#FFBF00] font-bold">{s.draws}</td>
                        <td className="py-3.5 px-2 text-center font-mono text-[#DF4351]">{s.losses}</td>

                        {/* CW, PP */}
                        <td className="py-3.5 px-2 text-center font-mono text-gray-700">{s.correctWinners}</td>
                        <td className="py-3.5 px-2 text-center font-mono font-bold text-[#FFBF00]">
                          {s.perfectPredictions}
                        </td>

                        {/* Total Score */}
                        <td className="py-3.5 px-3 text-center font-mono text-slate-800 font-bold">
                          {s.totalScore}
                        </td>

                        {/* Differential */}
                        <td className="py-3.5 px-3 text-center font-mono font-black">
                          <span
                            className={
                              s.differential > 0
                                ? 'text-[#159B5D]'
                                : s.differential < 0
                                ? 'text-[#DF4351]'
                                : 'text-gray-500'
                            }
                          >
                            {s.differential > 0 ? `+${s.differential}` : s.differential}
                          </span>
                        </td>

                        {/* Last 5 Form */}
                        <td className="py-3.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-0.5">
                            {s.lastFiveForm.map((res, i) => (
                              <span
                                key={i}
                                className={`w-4 h-4 rounded text-[9px] font-black text-white flex items-center justify-center ${
                                  res === 'W'
                                    ? 'bg-[#159B5D]'
                                    : res === 'D'
                                    ? 'bg-[#FFBF00] text-[#031128]'
                                    : 'bg-[#DF4351]'
                                }`}
                              >
                                {res}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Winning Streak */}
                        <td className="py-3.5 px-2 text-center font-mono font-bold text-gray-700">
                          {s.winningStreak}W
                        </td>

                        {/* Competition Points */}
                        <td className="py-3.5 px-4 text-center bg-[#0A2D55]/5 font-black text-sm text-[#0A2D55] font-mono">
                          {s.competitionPoints}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            )}
          </div>

          {/* MOBILE STACKED EXPANDABLE CARDS */}
          <div className="md:hidden space-y-3">
            {displayedStandings.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-[#DDE4EC] text-center text-[#031128]">
                <Swords className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <h3 className="text-base font-black uppercase text-[#031128]">No completed matchups yet.</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Head-to-Head duels and ladder standings will calculate once official Round 24 match results are finalized.
                </p>
              </div>
            ) : (
              displayedStandings.map((s) => {
              const isMe = s.userId === currentUser.id;
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedPlayerStanding(s)}
                  className={`p-4 rounded-2xl border shadow-sm space-y-3 cursor-pointer transition-all ${
                    isMe
                      ? 'bg-[#FFBF00]/10 border-[#FFBF00] ring-2 ring-[#FFBF00]/30'
                      : 'bg-white border-[#DDE4EC]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 bg-[#031128] text-white rounded-xl flex items-center justify-center font-black text-xs font-mono">
                        #{s.rank}
                      </span>
                      <img
                        src={s.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                        alt={s.playerName}
                        className="w-10 h-10 rounded-xl object-cover border border-[#DDE4EC]"
                      />
                      <div>
                        <p className="font-extrabold text-sm text-[#111D31] flex items-center gap-1">
                          {s.playerName}
                          {isMe && (
                            <span className="bg-[#FFBF00] text-[#031128] text-[9px] font-black px-1.5 rounded uppercase">
                              YOU
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">
                          {s.wins}W - {s.draws}D - {s.losses}L Record
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xl font-black text-[#0A2D55] font-mono">
                        {s.competitionPoints} <span className="text-[10px] text-gray-500 font-sans">Pts</span>
                      </span>
                      <p
                        className={`text-xs font-mono font-bold ${
                          s.differential >= 0 ? 'text-[#159B5D]' : 'text-[#DF4351]'
                        }`}
                      >
                        Diff: {s.differential > 0 ? `+${s.differential}` : s.differential}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#DDE4EC] text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500 text-[10px] uppercase font-bold mr-1">Form:</span>
                      {s.lastFiveForm.map((res, i) => (
                        <span
                          key={i}
                          className={`w-4 h-4 rounded text-[9px] font-black text-white flex items-center justify-center ${
                            res === 'W'
                              ? 'bg-[#159B5D]'
                              : res === 'D'
                              ? 'bg-[#FFBF00] text-[#031128]'
                              : 'bg-[#DF4351]'
                          }`}
                        >
                          {res}
                        </span>
                      ))}
                    </div>

                    <span className="text-[10px] font-bold text-[#0A2D55] flex items-center gap-1">
                      View Full Breakdown <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SEASON FIXTURES & MATCHUPS */}
      {activeTab === 'fixtures' && (
        <div className="space-y-6">
          {/* Round Selector Bar */}
          <div className="bg-white border border-[#DDE4EC] p-4 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#FFBF00]" />
              <span className="text-sm font-extrabold text-[#031128]">Select NRL Round:</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
              {rounds.slice(13, 22).map((r) => {
                const isSelected = r.id === selectedRoundId;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRoundId(r.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-[#031128] text-[#FFBF00] border border-[#FFBF00]'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {r.name} {r.isCurrent && ' (Live)'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Matchups List */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold uppercase text-[#031128] tracking-wider px-1">
              {currentRoundObj?.name || 'Round 24'} Head-to-Head Fixtures
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentRoundMatchups.map((m) => {
                const p1 = allUsers.find((u) => u.id === m.player1Id);
                const p2 = allUsers.find((u) => u.id === m.player2Id);
                const isMyMatchup = m.player1Id === currentUser.id || m.player2Id === currentUser.id;

                return (
                  <div
                    key={m.id}
                    className={`p-5 rounded-2xl border shadow-sm space-y-4 ${
                      isMyMatchup
                        ? 'bg-[#031128] text-white border-[#FFBF00] ring-2 ring-[#FFBF00]/30'
                        : 'bg-white border-[#DDE4EC] text-[#111D31]'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-gray-200/20 pb-3">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-gray-500/20">
                        {m.status} MATCHUP
                      </span>
                      {m.isFeatured && (
                        <span className="text-[10px] font-black text-[#FFBF00] flex items-center gap-1 uppercase">
                          <Flame className="w-3 h-3" /> Featured Clash
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 items-center text-center">
                      {/* Player 1 */}
                      <div className="space-y-1">
                        <img
                          src={p1?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                          alt={p1?.name}
                          className="w-10 h-10 rounded-xl object-cover mx-auto border border-[#FFBF00]"
                        />
                        <p className="font-extrabold text-xs truncate">{p1?.name || 'Player 1'}</p>
                        <span className="text-lg font-black font-mono">
                          {m.player1RoundScore} <span className="text-[9px] font-normal text-gray-400">pts</span>
                        </span>
                      </div>

                      {/* Result Difference */}
                      <div className="space-y-1">
                        <span className="text-xs font-black text-[#FFBF00]">
                          {m.winningDifference > 0 ? `Diff: ${m.winningDifference} pts` : 'Level'}
                        </span>
                        <div className="text-[10px] font-mono text-gray-400">
                          {m.winnerUserId === 'DRAW' ? 'DRAW' : m.winnerUserId ? 'FINAL' : 'IN PROGRESS'}
                        </div>
                      </div>

                      {/* Player 2 */}
                      <div className="space-y-1">
                        <img
                          src={p2?.avatarUrl || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80'}
                          alt={p2?.name}
                          className="w-10 h-10 rounded-xl object-cover mx-auto border border-[#FFBF00]"
                        />
                        <p className="font-extrabold text-xs truncate">{p2?.name || 'Player 2'}</p>
                        <span className="text-lg font-black font-mono">
                          {m.player2RoundScore} <span className="text-[9px] font-normal text-gray-400">pts</span>
                        </span>
                      </div>
                    </div>

                    {m.notes && (
                      <p className="text-[11px] text-slate-300 bg-[#0A2D55]/40 p-2.5 rounded-xl border border-[#0A2D55] italic">
                        {m.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LIVE DUEL MATCHUP */}
      {activeTab === 'matchup' && (
        <div className="space-y-6">
          <div className="bg-[#031128] text-white p-6 rounded-2xl border border-[#0A2D55] space-y-4">
            <h3 className="text-lg font-extrabold text-[#FFBF00] uppercase flex items-center gap-2">
              <Swords className="w-5 h-5" /> Game-by-Game Head-to-Head Comparison
            </h3>
            <p className="text-xs text-slate-300">
              Compare exact predictions for each NRL game in the round. Formula: Correct Winner = |Predicted - Actual|, Wrong Winner = |Predicted - Actual| + 5 pts penalty. Lower total round margin score wins!
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0A2D55] text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">NRL Match</th>
                    <th className="py-2.5 px-3 text-center text-[#FFBF00]">Lucian&apos;s Tip</th>
                    <th className="py-2.5 px-3 text-center text-[#FFE179]">Josh&apos;s Tip</th>
                    <th className="py-2.5 px-3 text-center text-white">Actual Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0A2D55] text-xs font-medium text-slate-200">
                  <tr className="hover:bg-[#0A2D55]/40">
                    <td className="py-3 px-3 font-bold">Warriors vs Panthers</td>
                    <td className="py-3 px-3 text-center text-[#FFBF00] font-mono">WARRIORS by 8</td>
                    <td className="py-3 px-3 text-center text-[#FFE179] font-mono">WARRIORS by 12</td>
                    <td className="py-3 px-3 text-center text-emerald-400 font-mono font-bold">WARRIORS by 6</td>
                  </tr>
                  <tr className="hover:bg-[#0A2D55]/40">
                    <td className="py-3 px-3 font-bold">Roosters vs Rabbitohs</td>
                    <td className="py-3 px-3 text-center text-[#FFBF00] font-mono">ROOSTERS by 4</td>
                    <td className="py-3 px-3 text-center text-[#FFE179] font-mono">RABBITOHS by 6</td>
                    <td className="py-3 px-3 text-center text-emerald-400 font-mono font-bold">ROOSTERS by 10</td>
                  </tr>
                  <tr className="hover:bg-[#0A2D55]/40">
                    <td className="py-3 px-3 font-bold">Storm vs Broncos</td>
                    <td className="py-3 px-3 text-center text-[#FFBF00] font-mono">STORM by 10</td>
                    <td className="py-3 px-3 text-center text-[#FFE179] font-mono">STORM by 8</td>
                    <td className="py-3 px-3 text-center text-emerald-400 font-mono font-bold">STORM by 10 (PERFECT)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ALL LEAGUES */}
      {activeTab === 'leagues' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {leagues.map((l) => (
              <div
                key={l.id}
                className={`bg-white border rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between ${
                  l.id === selectedLeagueId ? 'border-[#FFBF00] ring-2 ring-[#FFBF00]/30' : 'border-[#DDE4EC]'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="bg-[#0A2D55] text-white text-[10px] font-bold px-2.5 py-0.5 rounded uppercase">
                      Code: {l.code}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">{l.memberUserIds.length} Members</span>
                  </div>

                  <h3 className="font-extrabold text-lg text-[#031128]">{l.name}</h3>
                  <p className="text-xs text-gray-600 line-clamp-2">{l.description}</p>
                </div>

                <div className="pt-3 border-t border-[#DDE4EC] flex items-center justify-between">
                  <span className="text-[11px] text-gray-500">Admin: {l.administratorName}</span>
                  <button
                    onClick={() => {
                      setSelectedLeagueId(l.id);
                      setActiveTab('ladder');
                    }}
                    className="bg-[#031128] text-[#FFBF00] font-bold text-xs px-3.5 py-1.5 rounded-xl hover:bg-[#0A2D55] transition-colors"
                  >
                    Open League Ladder
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: FINALS BRACKET */}
      {activeTab === 'finals' && (
        <div className="bg-[#031128] text-white p-6 rounded-2xl border border-[#0A2D55] space-y-6">
          <div className="flex items-center justify-between border-b border-[#0A2D55] pb-3">
            <div>
              <h3 className="text-lg font-black text-[#FFBF00] uppercase">Head-to-Head Finals Bracket</h3>
              <p className="text-xs text-slate-300">Top 8 postseason knockout series for {currentLeague?.name || 'Head-to-Head League'}</p>
            </div>
            <span className="bg-[#159B5D]/20 text-[#159B5D] text-xs font-bold px-3 py-1 rounded-full border border-[#159B5D]/40">
              Finals Format Enabled
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quarter Finals</h4>
              {finalsList.filter((f) => f.stage === 'QUARTER_FINAL').map((f) => (
                <div key={f.id} className="p-3 bg-[#020812] border border-[#0A2D55] rounded-xl text-xs space-y-1">
                  <p className="font-bold text-[#FFBF00] text-[10px] uppercase">{f.stageName}</p>
                  <div className="flex justify-between text-slate-200">
                    <span>Lucian Armstrong (#1)</span>
                    <span className="font-mono">TBD</span>
                  </div>
                  <div className="flex justify-between text-slate-200">
                    <span>Matty Johns (#8)</span>
                    <span className="font-mono">TBD</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Semi Finals</h4>
              {finalsList.filter((f) => f.stage === 'SEMI_FINAL').map((f) => (
                <div key={f.id} className="p-3 bg-[#020812] border border-[#0A2D55] rounded-xl text-xs space-y-1">
                  <p className="font-bold text-[#FFE179] text-[10px] uppercase">{f.stageName}</p>
                  <div className="flex justify-between text-slate-400">
                    <span>Winner QF 1</span>
                    <span className="font-mono">TBD</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Grand Final</h4>
              <div className="p-4 bg-gradient-to-br from-[#0A2D55] to-[#020812] border-2 border-[#FFBF00] rounded-xl text-xs space-y-2 text-center">
                <Crown className="w-8 h-8 text-[#FFBF00] mx-auto" />
                <p className="font-black text-[#FFBF00] uppercase text-sm">H2H Championship Trophy</p>
                <p className="text-[11px] text-slate-300">Winner SF 1 vs Winner SF 2</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7 & 8: STATS & MOVERS */}
      {(activeTab === 'stats' || activeTab === 'movers') && (
        <div className="bg-white p-6 rounded-2xl border border-[#DDE4EC] space-y-4">
          <h3 className="font-extrabold text-[#031128] uppercase text-sm">
            {activeTab === 'stats' ? 'Head-to-Head Statistics & Rivalries' : 'Round Position Movement & Biggest Movers'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-[#EEF2F6] rounded-xl space-y-1">
              <span className="text-gray-500 font-bold uppercase text-[10px]">Highest Round Differential</span>
              <p className="text-lg font-black text-[#031128]">
                {myStanding?.differential ? `+${myStanding.differential} Points` : 'N/A'}
              </p>
            </div>
            <div className="p-4 bg-[#EEF2F6] rounded-xl space-y-1">
              <span className="text-gray-500 font-bold uppercase text-[10px]">Longest Winning Streak</span>
              <p className="text-lg font-black text-[#159B5D]">
                {myStanding?.winningStreak ? `${myStanding.winningStreak} Games` : '0 Games'}
              </p>
            </div>
            <div className="p-4 bg-[#EEF2F6] rounded-xl space-y-1">
              <span className="text-gray-500 font-bold uppercase text-[10px]">Most Perfect Predictions</span>
              <p className="text-lg font-black text-[#FFBF00]">
                {currentUser?.perfectTipsCount ? `${currentUser.perfectTipsCount} Exact Margins` : '0 Exact Margins'}
              </p>
            </div>
          </div>

          {onLogout && (
            <div className="pt-4 border-t border-[#DDE4EC] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <p className="font-extrabold text-[#031128] text-xs uppercase flex items-center gap-1.5">
                  <LogOut className="w-4 h-4 text-red-500" /> Account Log Out
                </p>
                <p className="text-[11px] text-gray-500">
                  Signed in as <strong>{currentUser.name}</strong> (@{currentUser.username})
                </p>
              </div>
              <button
                onClick={onLogout}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase shadow flex items-center justify-center gap-1.5 transition-all active:scale-95 shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ISSUE CHALLENGE */}
      {showChallengeModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#DDE4EC] space-y-4">
            <h3 className="text-lg font-black text-[#031128] uppercase flex items-center gap-2">
              <Swords className="w-5 h-5 text-[#FFBF00]" /> Issue 1v1 Challenge
            </h3>
            <form onSubmit={handleIssueChallenge} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Select Opponent</label>
                <select
                  required
                  value={challengeOpponentId}
                  onChange={(e) => setChallengeOpponentId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#DDE4EC] text-sm font-medium focus:ring-2 focus:ring-[#FFBF00] outline-none"
                >
                  <option value="">-- Choose Tipper --</option>
                  {allUsers
                    .filter((u) => u.id !== currentUser.id)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} (@{u.username})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowChallengeModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#FFBF00] hover:bg-[#FFE179] text-[#031128] font-bold px-4 py-2 rounded-xl text-xs shadow"
                >
                  Send Challenge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE H2H LEAGUE */}
      {showCreateLeagueModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#DDE4EC] space-y-4">
            <h3 className="text-lg font-black text-[#031128] uppercase flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#FFBF00]" /> Create Head-to-Head League
            </h3>
            <form onSubmit={handleCreateLeagueSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">League Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Workmates Footy Duels"
                  value={newLeagueName}
                  onChange={(e) => setNewLeagueName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#DDE4EC] text-sm font-medium focus:ring-2 focus:ring-[#FFBF00] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="League details, stakes, bragging rights..."
                  value={newLeagueDesc}
                  onChange={(e) => setNewLeagueDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#DDE4EC] text-xs font-medium focus:ring-2 focus:ring-[#FFBF00] outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="priv"
                  checked={newLeagueIsPrivate}
                  onChange={(e) => setNewLeagueIsPrivate(e.target.checked)}
                  className="rounded border-gray-300 text-[#FFBF00] focus:ring-[#FFBF00]"
                />
                <label htmlFor="priv" className="text-xs font-bold text-gray-700">
                  Private League (Require Invite Code)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateLeagueModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#031128] text-[#FFBF00] font-extrabold px-4 py-2 rounded-xl text-xs shadow"
                >
                  Create League
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: JOIN H2H LEAGUE */}
      {showJoinLeagueModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#DDE4EC] space-y-4">
            <h3 className="text-lg font-black text-[#031128] uppercase flex items-center gap-2">
              <Users className="w-5 h-5 text-[#FFBF00]" /> Join Head-to-Head League
            </h3>
            <form onSubmit={handleJoinLeagueSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Enter League Invite Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lucian2026"
                  value={joinLeagueCode}
                  onChange={(e) => setJoinLeagueCode(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#DDE4EC] text-sm font-mono font-bold uppercase focus:ring-2 focus:ring-[#FFBF00] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinLeagueModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#FFBF00] hover:bg-[#FFE179] text-[#031128] font-bold px-4 py-2 rounded-xl text-xs shadow"
                >
                  Join League
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: PLAYER DETAIL DRAWER */}
      {selectedPlayerStanding && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#DDE4EC] space-y-4">
            <div className="flex items-center justify-between border-b border-[#DDE4EC] pb-3">
              <div className="flex items-center gap-3">
                <img
                  src={selectedPlayerStanding.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                  alt={selectedPlayerStanding.playerName}
                  className="w-12 h-12 rounded-xl object-cover border border-[#FFBF00]"
                />
                <div>
                  <h3 className="font-extrabold text-base text-[#031128]">{selectedPlayerStanding.playerName}</h3>
                  <p className="text-xs text-gray-500">
                    Rank #{selectedPlayerStanding.rank} • {selectedPlayerStanding.competitionPoints} Competition Points
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlayerStanding(null)}
                className="text-gray-400 hover:text-gray-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#EEF2F6] rounded-xl">
                <span className="text-gray-500 block text-[10px] font-bold uppercase">Record (W-D-L)</span>
                <span className="font-black text-sm text-[#031128]">
                  {selectedPlayerStanding.wins}W - {selectedPlayerStanding.draws}D - {selectedPlayerStanding.losses}L
                </span>
              </div>
              <div className="p-3 bg-[#EEF2F6] rounded-xl">
                <span className="text-gray-500 block text-[10px] font-bold uppercase">Differential</span>
                <span className="font-black text-sm text-[#159B5D]">
                  +{selectedPlayerStanding.differential} Margin Pts
                </span>
              </div>
              <div className="p-3 bg-[#EEF2F6] rounded-xl">
                <span className="text-gray-500 block text-[10px] font-bold uppercase">Correct Winners</span>
                <span className="font-black text-sm text-[#031128]">{selectedPlayerStanding.correctWinners}</span>
              </div>
              <div className="p-3 bg-[#EEF2F6] rounded-xl">
                <span className="text-gray-500 block text-[10px] font-bold uppercase">Perfect Predictions</span>
                <span className="font-black text-sm text-[#FFBF00]">{selectedPlayerStanding.perfectPredictions}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setSelectedPlayerStanding(null);
                  setShowChallengeModal(true);
                }}
                className="bg-[#FFBF00] text-[#031128] font-black text-xs px-4 py-2 rounded-xl shadow"
              >
                Challenge Tipper
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
