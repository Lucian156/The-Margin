/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Activity, PlusCircle, CheckCircle2, Award, Calendar, Zap, Clock } from 'lucide-react';
import { Fixture, User } from '../types';
import { getFixtures, getTips, getUserTips } from '../services/storageService';
import { getTeamById } from '../data/nrlTeams';
import { TeamBadge } from '../components/TeamBadge';
import { nrlAdapter } from '../adapters/nrlAdapter';
import { calculateGameScore } from '../utils/scoring';
import { getEffectiveFixtureStatus } from '../utils/matchStatus';

interface LiveCentreViewProps {
  currentUser: User;
}

export const LiveCentreView: React.FC<LiveCentreViewProps> = ({ currentUser }) => {
  const [fixtures, setFixtures] = useState<Fixture[]>(getFixtures());
  const [updatingFixtureId, setUpdatingFixtureId] = useState<string | null>(null);

  const tips = getUserTips(currentUser.id || currentUser.uid || currentUser.username);
  const tipMap = new Map(tips.map((t) => [t.fixtureId, t]));

  const liveMatches = fixtures.filter((f) => getEffectiveFixtureStatus(f) === 'LIVE');
  const upcomingMatches = fixtures.filter((f) => getEffectiveFixtureStatus(f) === 'UPCOMING');
  const completedMatches = fixtures.filter((f) => getEffectiveFixtureStatus(f) === 'COMPLETED');

  const handleSimulateScore = async (fixtureId: string, homeDelta: number, awayDelta: number) => {
    if (!currentUser?.isAdmin) return; // Strict security guard
    setUpdatingFixtureId(fixtureId);
    try {
      const updated = await nrlAdapter.simulateLiveMatchUpdate(fixtureId, homeDelta, awayDelta);
      setFixtures((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingFixtureId(null);
    }
  };

  const formatFixtureDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-AU', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-[#031128] text-white p-4 sm:p-8 rounded-2xl border border-[#0A2D55] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
            <span className="bg-[#DF4351] text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              Live Match Centre
            </span>
            <span className="text-xs text-gray-300 font-medium">Real-Time Match Tracking</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black uppercase text-white font-sans">
            Live Matches & Projected Scores
          </h1>
          <p className="text-gray-300 text-xs sm:text-sm mt-1 max-w-xl">
            Watch NRL scores progress in real-time during kick-off and track your projected tipping margin score.
          </p>
        </div>

        <div className="bg-[#020812] p-2.5 sm:p-3.5 rounded-xl border border-[#0A2D55] text-left sm:text-right shrink-0 hidden sm:block">
          <p className="text-[10px] text-gray-400 font-bold uppercase">Data Feed Connection</p>
          <p className="text-xs font-bold text-[#159B5D] flex items-center gap-1 mt-0.5 sm:justify-end">
            <CheckCircle2 className="w-3.5 h-3.5" /> Official Data Provider Active
          </p>
        </div>
      </div>

      {/* SECTION 1: LIVE MATCHES IN PROGRESS */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-[#111D31] uppercase tracking-wide flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#DF4351]" /> Matches Live In Progress
        </h2>

        {liveMatches.length === 0 ? (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#DDE4EC] text-center space-y-2">
            <div className="w-10 h-10 bg-[#EEF2F6] rounded-full flex items-center justify-center mx-auto text-[#0A2D55]">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-[#031128] uppercase">No Matches Currently Live</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              There are no matches actively in progress right now. Matches will automatically display live scores and clock updates here as soon as they kick off.
            </p>
          </div>
        ) : (
          liveMatches.map((fixture) => {
            const homeTeam = getTeamById(fixture.homeTeamId);
            const awayTeam = getTeamById(fixture.awayTeamId);
            const savedTip = tipMap.get(fixture.id);

            const currentHomeScore = fixture.homeScore || 0;
            const currentAwayScore = fixture.awayScore || 0;
            const currentLeader =
              currentHomeScore > currentAwayScore
                ? fixture.homeTeamId
                : currentAwayScore > currentHomeScore
                ? fixture.awayTeamId
                : null;
            const currentMargin = Math.abs(currentHomeScore - currentAwayScore);

            const liveProjScore = savedTip
              ? calculateGameScore(
                  savedTip.predictedWinnerTeamId,
                  savedTip.predictedMargin,
                  currentLeader,
                  currentMargin
                )
              : null;

            return (
              <div
                key={fixture.id}
                className="bg-white rounded-2xl border border-[#DDE4EC] shadow-sm overflow-hidden p-5 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-[#DDE4EC] pb-3 text-xs">
                  <span className="font-bold text-[#0A2D55]">{fixture.venue}</span>
                  <span className="bg-[#DF4351] text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    LIVE - {fixture.matchClock || 'In Progress'}
                  </span>
                </div>

                {/* Scoreboard */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-8 flex items-center justify-between bg-[#EEF2F6] p-4 rounded-xl border border-[#DDE4EC]">
                    <div className="flex items-center gap-3">
                      <TeamBadge teamId={fixture.homeTeamId} size="lg" />
                      <div>
                        <p className="font-extrabold text-base text-[#111D31]">{homeTeam?.name}</p>
                        <p className="text-xs text-gray-500 font-semibold">Home Team</p>
                      </div>
                    </div>

                    <div className="text-center px-4">
                      <span className="text-2xl font-black font-mono text-[#031128]">
                        {fixture.homeScore ?? 0} - {fixture.awayScore ?? 0}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 block uppercase">
                        Current Score
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-right justify-end">
                      <div>
                        <p className="font-extrabold text-base text-[#111D31]">{awayTeam?.name}</p>
                        <p className="text-xs text-gray-500 font-semibold">Away Team</p>
                      </div>
                      <TeamBadge teamId={fixture.awayTeamId} size="lg" />
                    </div>
                  </div>

                  {/* Projected Tip Score Card */}
                  <div className="md:col-span-4 bg-[#031128] text-white p-4 rounded-xl border border-[#0A2D55] flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-[#FFBF00] uppercase tracking-wider block">
                        Your Tip Projection
                      </span>
                      {savedTip ? (
                        <p className="text-xs font-bold text-white mt-1">
                          Tipped: {getTeamById(savedTip.predictedWinnerTeamId)?.shortName} by {savedTip.predictedMargin} pts
                        </p>
                      ) : (
                        <p className="text-xs text-red-400 font-semibold mt-1">No tip submitted</p>
                      )}
                    </div>

                    {liveProjScore && (
                      <div className="mt-3 pt-2 border-t border-[#0A2D55] flex justify-between items-center">
                        <span className="text-xs text-gray-300 font-mono">Projected Score:</span>
                        <span className="text-xl font-black text-[#FFBF00] font-mono">
                          {liveProjScore.gameScore} pts
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Match Event Simulator - RESTRICTED STRICTLY TO ADMIN USERS */}
                {currentUser?.isAdmin && (
                  <div className="bg-[#020812] p-3 rounded-xl border border-[#0A2D55] flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-gray-300 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-[#FFBF00]" /> Admin Match Simulator:
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSimulateScore(fixture.id, 6, 0)}
                        disabled={updatingFixtureId === fixture.id}
                        className="bg-[#0A2D55] hover:bg-[#031128] text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-[#DDE4EC]/20 transition-colors flex items-center gap-1"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-[#FFBF00]" /> +6 Home Try
                      </button>
                      <button
                        onClick={() => handleSimulateScore(fixture.id, 0, 6)}
                        disabled={updatingFixtureId === fixture.id}
                        className="bg-[#0A2D55] hover:bg-[#031128] text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-[#DDE4EC]/20 transition-colors flex items-center gap-1"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-[#FFBF00]" /> +6 Away Try
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* SECTION 2: UPCOMING FIXTURES */}
      <div className="space-y-4 pt-4 border-t border-[#DDE4EC]">
        <h2 className="text-lg font-black text-[#111D31] uppercase tracking-wide flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#0A2D55]" /> Upcoming Round Fixtures
        </h2>

        {upcomingMatches.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-[#DDE4EC] text-center text-gray-500 text-xs sm:text-sm">
            No upcoming fixtures scheduled for this round.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingMatches.map((fixture) => {
              const homeTeam = getTeamById(fixture.homeTeamId);
              const awayTeam = getTeamById(fixture.awayTeamId);
              const savedTip = tipMap.get(fixture.id);

              return (
                <div
                  key={fixture.id}
                  className="bg-white rounded-2xl border border-[#DDE4EC] shadow-sm p-4 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-[#DDE4EC] pb-2 text-xs">
                    <span className="font-bold text-gray-500 truncate max-w-[200px]">{fixture.venue}</span>
                    <span className="bg-[#0A2D55] text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase">
                      UPCOMING
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-[#EEF2F6] p-3 rounded-xl border border-[#DDE4EC]">
                    <div className="flex items-center gap-2">
                      <TeamBadge teamId={fixture.homeTeamId} size="md" />
                      <div>
                        <p className="font-extrabold text-xs sm:text-sm text-[#111D31]">
                          {homeTeam?.shortName}
                        </p>
                      </div>
                    </div>

                    <div className="text-center">
                      <span className="text-xs font-black text-[#0A2D55] block">
                        {formatFixtureDateTime(fixture.startTime)}
                      </span>
                      <span className="text-[10px] text-gray-400 font-semibold block uppercase">
                        Scheduled Kick-Off
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <p className="font-extrabold text-xs sm:text-sm text-[#111D31] text-right">
                        {awayTeam?.shortName}
                      </p>
                      <TeamBadge teamId={fixture.awayTeamId} size="md" />
                    </div>
                  </div>

                  {/* Submitted Tip Status */}
                  <div className="bg-[#031128] text-white p-3 rounded-xl border border-[#0A2D55] flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">Your Tip Status</span>
                      {savedTip ? (
                        <p className="font-bold text-[#FFBF00] mt-0.5">
                          Tipped: {getTeamById(savedTip.predictedWinnerTeamId)?.shortName} by {savedTip.predictedMargin} pts
                        </p>
                      ) : (
                        <p className="text-red-400 text-[11px] font-semibold mt-0.5">No tip submitted yet</p>
                      )}
                    </div>
                    {savedTip && (
                      <span className="bg-[#159B5D] text-white text-[10px] font-black px-2 py-0.5 rounded">
                        LOCKED
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 3: COMPLETED MATCH RESULTS */}
      <div className="space-y-4 pt-4 border-t border-[#DDE4EC]">
        <h2 className="text-lg font-black text-[#111D31] uppercase tracking-wide flex items-center gap-2">
          <Award className="w-5 h-5 text-[#159B5D]" /> Final Match Results & Scorecards
        </h2>

        {completedMatches.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-[#DDE4EC] text-center text-gray-500 text-xs sm:text-sm">
            No completed matches yet in this round. Final scores will update here as matches conclude!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedMatches.map((fixture) => {
              const homeTeam = getTeamById(fixture.homeTeamId);
              const awayTeam = getTeamById(fixture.awayTeamId);
              const savedTip = tipMap.get(fixture.id);

              const homeScore = fixture.homeScore || 0;
              const awayScore = fixture.awayScore || 0;
              const winnerTeamId =
                homeScore > awayScore
                  ? fixture.homeTeamId
                  : awayScore > homeScore
                  ? fixture.awayTeamId
                  : null;
              const actualMargin = Math.abs(homeScore - awayScore);

              const gameScoreResult = savedTip
                ? calculateGameScore(
                    savedTip.predictedWinnerTeamId,
                    savedTip.predictedMargin,
                    winnerTeamId,
                    actualMargin
                  )
                : null;

              return (
                <div
                  key={fixture.id}
                  className="bg-white rounded-2xl border border-[#DDE4EC] shadow-sm p-4 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-[#DDE4EC] pb-2 text-xs">
                    <span className="font-bold text-gray-500">{fixture.venue}</span>
                    <span className="bg-[#031128] text-[#FFBF00] font-black text-[10px] px-2.5 py-0.5 rounded-full">
                      FULL TIME
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-[#EEF2F6] p-3 rounded-xl border border-[#DDE4EC]">
                    <div className="flex items-center gap-2">
                      <TeamBadge teamId={fixture.homeTeamId} size="md" />
                      <div>
                        <p className={`font-black text-xs sm:text-sm ${winnerTeamId === fixture.homeTeamId ? 'text-[#159B5D]' : 'text-gray-700'}`}>
                          {homeTeam?.shortName}
                        </p>
                      </div>
                    </div>

                    <div className="text-center font-mono font-black text-base sm:text-lg text-[#031128]">
                      {homeScore} - {awayScore}
                    </div>

                    <div className="flex items-center gap-2">
                      <p className={`font-black text-xs sm:text-sm text-right ${winnerTeamId === fixture.awayTeamId ? 'text-[#159B5D]' : 'text-gray-700'}`}>
                        {awayTeam?.shortName}
                      </p>
                      <TeamBadge teamId={fixture.awayTeamId} size="md" />
                    </div>
                  </div>

                  {/* Tip score outcome */}
                  <div className="bg-[#031128] text-white p-3 rounded-xl border border-[#0A2D55] flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">Your Prediction</span>
                      {savedTip ? (
                        <p className="font-bold text-white mt-0.5">
                          Tipped: {getTeamById(savedTip.predictedWinnerTeamId)?.shortName} (+{savedTip.predictedMargin})
                        </p>
                      ) : (
                        <p className="text-red-400 text-[11px] font-semibold">No tip submitted</p>
                      )}
                    </div>

                    {gameScoreResult && (
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 font-bold uppercase block">Margin Error</span>
                        <span className="font-mono font-black text-sm text-[#FFBF00]">
                          {gameScoreResult.gameScore === 0 ? '0 (PERFECT!)' : `+${gameScoreResult.gameScore} pts`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

