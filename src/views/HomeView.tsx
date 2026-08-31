/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Trophy,
  Activity,
  Award,
  Swords,
  Users,
  Clock,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Zap,
  ArrowUpRight,
  ShieldAlert,
  Flame,
  Bot
} from 'lucide-react';
import { User } from '../types';
import { getFixtures, getTips, getUsers, getRounds, getUserTips } from '../services/storageService';
import { getTeamById } from '../data/nrlTeams';
import { TeamBadge } from '../components/TeamBadge';
import { getEffectiveFixtureStatus } from '../utils/matchStatus';

interface HomeViewProps {
  currentUser: User;
  setActiveTab: (tab: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ currentUser, setActiveTab }) => {
  const fixtures = getFixtures();
  const tips = getUserTips(currentUser.id || currentUser.uid || currentUser.username);
  const users = getUsers();
  const rounds = getRounds();
  const activeRound = rounds.find((r) => r.isCurrent) || rounds[0] || { id: 'nrl-2026-round-27', number: 27, name: 'Round 27' };
  const currentRoundFixtures = fixtures.filter((f) => f.roundId === activeRound.id || f.roundId === `round-${activeRound.number}` || f.roundId === `r${activeRound.number}`) || fixtures;
  const activeFixtures = currentRoundFixtures.length > 0 ? currentRoundFixtures : fixtures;
  const submittedTipsCount = activeFixtures.filter((f) => tips.some((t) => t.fixtureId === f.id)).length;
  const isTipsComplete = submittedTipsCount === activeFixtures.length && activeFixtures.length > 0;

  // Rank calculation
  const currentRank = users.findIndex((u) => u.id === currentUser.id) + 1 || 1;
  const topUsers = users.slice(0, 3);

  // Live / completed status counts
  const liveCount = fixtures.filter((f) => getEffectiveFixtureStatus(f) === 'LIVE').length;
  const completedCount = fixtures.filter((f) => getEffectiveFixtureStatus(f) === 'COMPLETED').length;

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* HERO WELCOME BANNER */}
      <div className="bg-gradient-to-br from-[#031128] via-[#0A2D55] to-[#020812] text-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-[#0A2D55] shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-15 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#FFBF00] via-transparent to-transparent" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-[#FFBF00] text-[#031128] font-black text-[10px] sm:text-xs px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-lg uppercase tracking-wider shadow">
                ROUND {activeRound.number} ACTIVE
              </span>
              <span className="bg-[#159B5D] text-white text-[10px] sm:text-xs font-bold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full flex items-center gap-1.5 shadow">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                LOWEST SCORE WINS
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white font-sans leading-none">
              WELCOME BACK, <span className="text-[#FFBF00]">{currentUser.name.toUpperCase()}</span>
            </h1>

            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed max-w-xl">
              Predict the winning NRL team and margin. 0 error is a perfect score! Keep your score low to climb the overall leaderboard and dominate your duels.
            </p>

            <div className="pt-2 flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab('tips')}
                className="bg-[#FFBF00] hover:bg-[#FFE179] text-[#031128] font-black text-xs sm:text-sm px-5 py-2.5 rounded-xl uppercase tracking-wider flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
              >
                <Trophy className="w-4 h-4" />
                {isTipsComplete ? `Review Your Round ${activeRound.number} Tips` : `Submit Round ${activeRound.number} Tips`}
              </button>
              <button
                onClick={() => setActiveTab('live')}
                className="bg-[#020812] hover:bg-[#0A2D55] text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-[#0A2D55] flex items-center gap-2 transition-colors"
              >
                <Activity className="w-4 h-4 text-[#DF4351]" />
                Live Scores & Results
              </button>
            </div>
          </div>

          {/* QUICK DASHBOARD SUMMARY WIDGET */}
          <div className="grid grid-cols-2 gap-3 bg-[#020812]/90 p-4 rounded-2xl border border-[#0A2D55] shrink-0 w-full lg:w-80 shadow-2xl">
            <div className="bg-[#031128] p-3 rounded-xl border border-[#0A2D55] text-center">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Season Rank</span>
              <span className="text-2xl font-black text-[#FFBF00] font-mono">#{currentRank}</span>
              <span className="text-[10px] text-gray-400 block mt-0.5">out of {users.length} tippers</span>
            </div>

            <div className="bg-[#031128] p-3 rounded-xl border border-[#0A2D55] text-center">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Score</span>
              <span className="text-2xl font-black text-white font-mono">{currentUser.totalScore}</span>
              <span className="text-[10px] text-gray-400 block mt-0.5">pts (lower is better)</span>
            </div>

            <div className="col-span-2 bg-[#0A2D55]/60 p-3 rounded-xl border border-[#0A2D55] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-300 font-bold uppercase block">Round {activeRound.number} Tips Status</span>
                <span className="text-xs font-black text-white">
                  {submittedTipsCount} / {activeFixtures.length} Matches Tipped
                </span>
              </div>
              {isTipsComplete ? (
                <span className="bg-[#159B5D] text-white text-[10px] font-extrabold px-2 py-1 rounded-lg flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> LOCKED IN
                </span>
              ) : (
                <button
                  onClick={() => setActiveTab('tips')}
                  className="bg-[#FFBF00] text-[#031128] text-[10px] font-black px-2.5 py-1 rounded-lg hover:bg-[#FFE179]"
                >
                  COMPLETE TIPS
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QUICK HUB NAVIGATION CARDS */}
      <div className="space-y-3">
        <h2 className="text-xs font-black text-[#0A2D55] uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#FFBF00]" />
          Competition Quick Access
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Card 1: SUBMIT TIPS */}
          <button
            onClick={() => setActiveTab('tips')}
            className="bg-white hover:bg-[#EEF2F6] text-[#031128] p-4 rounded-2xl border border-[#DDE4EC] shadow-sm flex flex-col items-center text-center justify-between gap-2 group transition-all transform hover:-translate-y-0.5"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#FFBF00] text-[#031128] flex items-center justify-center font-black shadow-sm group-hover:scale-110 transition-transform">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-xs uppercase tracking-wider text-[#031128]">Submit Tips</h3>
              <p className="text-[10px] text-gray-500 mt-0.5">Round {activeRound.number} predictions</p>
            </div>
          </button>

          {/* Card 2: LIVE MATCHES & RESULTS */}
          <button
            onClick={() => setActiveTab('live')}
            className="bg-white hover:bg-[#EEF2F6] text-[#031128] p-4 rounded-2xl border border-[#DDE4EC] shadow-sm flex flex-col items-center text-center justify-between gap-2 group transition-all transform hover:-translate-y-0.5"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#DF4351] text-white flex items-center justify-center font-black shadow-sm group-hover:scale-110 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-xs uppercase tracking-wider text-[#031128]">Live & Results</h3>
              <p className="text-[10px] text-gray-500 mt-0.5">Scores & match clocks</p>
            </div>
          </button>

          {/* Card 3: OVERALL LADDER */}
          <button
            onClick={() => setActiveTab('ladder')}
            className="bg-white hover:bg-[#EEF2F6] text-[#031128] p-4 rounded-2xl border border-[#DDE4EC] shadow-sm flex flex-col items-center text-center justify-between gap-2 group transition-all transform hover:-translate-y-0.5"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#0A2D55] text-white flex items-center justify-center font-black shadow-sm group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5 text-[#FFBF00]" />
            </div>
            <div>
              <h3 className="font-black text-xs uppercase tracking-wider text-[#031128]">Overall Ladder</h3>
              <p className="text-[10px] text-gray-500 mt-0.5">Rankings & scores</p>
            </div>
          </button>

          {/* Card 4: HEAD-TO-HEAD DUELS */}
          <button
            onClick={() => setActiveTab('duels')}
            className="bg-white hover:bg-[#EEF2F6] text-[#031128] p-4 rounded-2xl border border-[#DDE4EC] shadow-sm flex flex-col items-center text-center justify-between gap-2 group transition-all transform hover:-translate-y-0.5"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#031128] text-white flex items-center justify-center font-black shadow-sm group-hover:scale-110 transition-transform">
              <Swords className="w-5 h-5 text-[#DF4351]" />
            </div>
            <div>
              <h3 className="font-black text-xs uppercase tracking-wider text-[#031128]">My Duels</h3>
              <p className="text-[10px] text-gray-500 mt-0.5">Weekly 1v1 challenges</p>
            </div>
          </button>

          {/* Card 5: LEAGUES */}
          <button
            onClick={() => setActiveTab('leagues')}
            className="col-span-2 sm:col-span-1 bg-white hover:bg-[#EEF2F6] text-[#031128] p-4 rounded-2xl border border-[#DDE4EC] shadow-sm flex flex-col items-center text-center justify-between gap-2 group transition-all transform hover:-translate-y-0.5"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#159B5D] text-white flex items-center justify-center font-black shadow-sm group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-xs uppercase tracking-wider text-[#031128]">Leagues</h3>
              <p className="text-[10px] text-gray-500 mt-0.5">Private competitions</p>
            </div>
          </button>
        </div>
      </div>

      {/* ROUND FIXTURES PREVIEW GRID */}
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-[#DDE4EC] shadow-sm">
          <div>
            <h2 className="font-black text-base text-[#031128] uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#FFBF00]" />
              Round {activeRound.number} Match Schedule Preview
            </h2>
            <p className="text-xs text-gray-500">
              {activeFixtures.length} NRL matches in Round {activeRound.number}. Predict winning margins to earn points.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('tips')}
            className="bg-[#031128] hover:bg-[#0A2D55] text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors shrink-0"
          >
            Enter Tips <ChevronRight className="w-4 h-4 text-[#FFBF00]" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {activeFixtures.map((fixture) => {
            const homeTeam = getTeamById(fixture.homeTeamId);
            const awayTeam = getTeamById(fixture.awayTeamId);
            const userTip = tips.find((t) => t.fixtureId === fixture.id);
            const tippedTeam = userTip ? getTeamById(userTip.predictedWinnerTeamId) : null;

            return (
              <div
                key={fixture.id}
                className="bg-white p-4 rounded-2xl border border-[#DDE4EC] shadow-sm flex flex-col justify-between space-y-3 hover:border-[#FFBF00]/60 transition-all"
              >
                <div className="flex items-center justify-between text-[11px] text-gray-500 border-b border-[#DDE4EC] pb-2 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#0A2D55]" />
                    {new Date(fixture.startTime).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                  {(() => {
                    const status = getEffectiveFixtureStatus(fixture);
                    if (status === 'LIVE') {
                      return (
                        <span className="bg-[#DF4351] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full animate-pulse">
                          LIVE ({fixture.matchClock || 'In Progress'})
                        </span>
                      );
                    }
                    if (status === 'COMPLETED') {
                      return (
                        <span className="bg-gray-200 text-gray-700 font-bold text-[9px] px-2 py-0.5 rounded">
                          FULL TIME
                        </span>
                      );
                    }
                    return (
                      <span className="text-[#0A2D55] font-bold text-[10px]">
                        {new Date(fixture.startTime).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </span>
                    );
                  })()}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TeamBadge teamId={fixture.homeTeamId} size="sm" />
                      <span className="font-black text-xs text-[#031128]">{homeTeam?.name}</span>
                    </div>
                    {fixture.status !== 'UPCOMING' && (
                      <span className="font-mono font-black text-sm text-[#031128]">{fixture.homeScore ?? 0}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TeamBadge teamId={fixture.awayTeamId} size="sm" />
                      <span className="font-black text-xs text-[#031128]">{awayTeam?.name}</span>
                    </div>
                    {fixture.status !== 'UPCOMING' && (
                      <span className="font-mono font-black text-sm text-[#031128]">{fixture.awayScore ?? 0}</span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#DDE4EC] flex items-center justify-between text-xs">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Your Tip:</span>
                  {userTip ? (
                    <span className="font-black text-[#031128] text-[11px] bg-[#FFBF00]/20 text-[#031128] px-2 py-0.5 rounded-md border border-[#FFBF00]/40">
                      {tippedTeam?.shortName} by +{userTip.predictedMargin}
                    </span>
                  ) : (
                    <span className="text-[10px] text-red-500 font-bold italic">Not Tipped</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TWO COLUMN BOTTOM SECTION: TOP LEADERBOARD + MAJOR SPONSOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TOP LEADERBOARD PREVIEW (2 COLS) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#DDE4EC] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#DDE4EC] pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#FFBF00]" />
              <h3 className="font-black text-base text-[#031128] uppercase tracking-wider">
                Overall Season Top 3 Leaderboard
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('ladder')}
              className="text-xs font-bold text-[#0A2D55] hover:text-[#FFBF00] flex items-center gap-1 transition-colors"
            >
              Full Ladder <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {topUsers.map((user, idx) => {
              const rank = idx + 1;
              const isCurrentUser = user.id === currentUser.id;

              return (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isCurrentUser ? 'bg-[#FFBF00]/10 border-[#FFBF00]' : 'bg-[#EEF2F6] border-[#DDE4EC]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-[#031128] text-[#FFBF00] font-mono font-black text-xs flex items-center justify-center">
                      #{rank}
                    </span>
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-8 h-8 rounded-lg object-cover border border-[#DDE4EC]"
                    />
                    <div>
                      <p className="font-extrabold text-xs text-[#031128] flex items-center gap-1">
                        {user.name}
                        {isCurrentUser && (
                          <span className="bg-[#031128] text-[#FFBF00] text-[8px] font-black px-1.5 py-0.5 rounded">
                            YOU
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-gray-500">@{user.username}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-black font-mono text-sm text-[#031128] block">
                      {user.totalScore} <span className="text-[10px] font-normal text-gray-500">pts</span>
                    </span>
                    <span className="text-[10px] text-[#159B5D] font-bold">
                      {user.correctWinnersCount} Correct Winners
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MAJOR SPONSOR CARD (1 COL) */}
        <div className="bg-[#031128] text-white rounded-2xl border border-[#0A2D55] p-5 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <span className="bg-[#FFBF00] text-[#031128] font-black text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
              Official Major Sponsor
            </span>
            <h3 className="font-black text-lg text-white uppercase tracking-tight mt-2">
              Cross Country Rentals (CCR)
            </h3>
            <p className="text-xs text-gray-300 mt-1 leading-relaxed">
              Proud major sponsor of The Margin Round 24 Beta. Rent 12-seater vans, SUVs, and commercial vehicles across New Zealand & Australia.
            </p>
          </div>

          <div className="bg-[#020812] p-3 rounded-xl border border-[#0A2D55] space-y-1">
            <span className="text-[10px] text-[#FFBF00] font-bold uppercase tracking-wider block">
              Round 24 Prize Pool
            </span>
            <p className="text-xs font-bold text-white">
              $500 CCR Rental Voucher for the Lowest Margin Score Tipper!
            </p>
          </div>

          <button
            onClick={() => setActiveTab('partner-hub')}
            className="w-full bg-[#0A2D55] hover:bg-[#103B6B] text-white text-xs font-bold py-2.5 rounded-xl border border-[#0A2D55] transition-colors flex items-center justify-center gap-1.5"
          >
            Explore Prizes & Sponsor <ArrowUpRight className="w-4 h-4 text-[#FFBF00]" />
          </button>
        </div>
      </div>
    </div>
  );
};
