/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  X,
  User as UserIcon,
  Trophy,
  CheckCircle2,
  Sparkles,
  Calendar,
  MapPin,
  Mail,
  ShieldCheck,
  Award,
  AlertCircle,
} from 'lucide-react';
import { Fixture, Tip, User } from '../types';
import { getFixtures, getTips, getUserTips } from '../services/storageService';
import { getTeamById } from '../data/nrlTeams';

interface PlayerProfileModalProps {
  user: User | null;
  onClose: () => void;
  isAdmin?: boolean;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  user,
  onClose,
  isAdmin = false,
}) => {
  if (!user) return null;

  const fixtures = getFixtures();
  const allTips = getTips();
  const userTips = getUserTips(user);
  const favTeam = user.favoriteTeamId ? getTeamById(user.favoriteTeamId) : null;

  const submittedCount = userTips.length;
  const isAllTipped = submittedCount === fixtures.length && fixtures.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-6 animate-fadeIn overflow-y-auto">
      <div className="bg-white text-[#031128] rounded-2xl max-w-3xl w-full shadow-2xl border border-[#DDE4EC] overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header Banner */}
        <div className="bg-[#031128] text-white p-5 sm:p-6 relative shrink-0 border-b border-[#0A2D55]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white bg-white/10 p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <img
              src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={user.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-[#FFBF00] shadow-lg shrink-0"
            />

            <div className="space-y-1 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black uppercase text-white font-sans">
                  {user.name}
                </h2>
                {user.isAdmin && (
                  <span className="bg-[#FFBF00] text-[#031128] text-[10px] font-black uppercase px-2 py-0.5 rounded border border-amber-300">
                    Administrator
                  </span>
                )}
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                  user.membershipTier === 'PRO' ? 'bg-amber-400 text-slate-950' :
                  user.membershipTier === 'FOUNDATION' ? 'bg-purple-300 text-purple-950' :
                  'bg-slate-700 text-slate-200'
                }`}>
                  {user.membershipTier || 'Beta Tipper'}
                </span>
              </div>

              <p className="text-xs text-gray-300 font-mono flex flex-wrap items-center gap-3">
                <span>@{user.username}</span>
                {favTeam && (
                  <span className="flex items-center gap-1.5 font-sans font-bold text-white bg-white/10 px-2 py-0.5 rounded-full text-[11px]">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: favTeam.primaryColor }} />
                    {favTeam.name}
                  </span>
                )}
              </p>

              {(user.email || user.homeRegion) && (
                <div className="pt-1 flex flex-wrap items-center gap-3 text-[11px] text-gray-400">
                  {user.email && (
                    <span className="flex items-center gap-1 font-mono">
                      <Mail className="w-3 h-3 text-amber-400" /> {user.email}
                    </span>
                  )}
                  {user.homeRegion && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-400" /> {user.homeRegion}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-amber-400" /> Joined {user.memberSince || 'August 2026'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Summary Strip */}
        <div className="bg-[#EEF2F6] p-4 border-b border-[#DDE4EC] grid grid-cols-2 sm:grid-cols-4 gap-3 text-center shrink-0">
          <div className="bg-white p-2.5 rounded-xl border border-[#DDE4EC]">
            <p className="text-[10px] font-bold text-gray-500 uppercase">Season Total Score</p>
            <p className="text-xl font-black font-mono text-[#031128]">{user.totalScore ?? 0} <span className="text-xs font-normal">pts</span></p>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-[#DDE4EC]">
            <p className="text-[10px] font-bold text-gray-500 uppercase">R24 Tips Progress</p>
            <p className={`text-xl font-black font-mono ${isAllTipped ? 'text-emerald-700' : 'text-amber-600'}`}>
              {submittedCount} / {fixtures.length}
            </p>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-[#DDE4EC]">
            <p className="text-[10px] font-bold text-gray-500 uppercase">Perfect Tips (0 Pts)</p>
            <p className="text-xl font-black font-mono text-emerald-600">{user.perfectTipsCount ?? 0}</p>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-[#DDE4EC]">
            <p className="text-[10px] font-bold text-gray-500 uppercase">Avg Margin Error</p>
            <p className="text-xl font-black font-mono text-gray-700">±{user.averageMarginError ?? 0} pts</p>
          </div>
        </div>

        {/* Main Content Area - Submitted Picks */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          <div className="flex items-center justify-between border-b border-[#DDE4EC] pb-3">
            <div>
              <h3 className="text-base font-black uppercase text-[#031128] flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#FFBF00]" /> Official Match Predictions
              </h3>
              <p className="text-xs text-gray-500">
                Submitted match winner selections and margin predictions.
              </p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 ${
              isAllTipped ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isAllTipped ? 'All 8 Tips Submitted' : `${submittedCount} / ${fixtures.length} Tipped`}
            </span>
          </div>

          {fixtures.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-6">No fixtures available.</p>
          ) : (
            <div className="space-y-3">
              {fixtures.map((fixture, idx) => {
                const home = getTeamById(fixture.homeTeamId);
                const away = getTeamById(fixture.awayTeamId);
                const tip = userTips.find((t) => t.fixtureId === fixture.id);
                const teamId = tip ? (tip.predictedWinnerTeamId || (tip as any).selectedTeamId || (tip as any).winnerId) : '';
                const predictedTeam = teamId ? getTeamById(teamId) : null;
                const margin = tip ? (tip.predictedMargin ?? (tip as any).margin ?? 0) : 0;

                const isCompleted = fixture.status === 'COMPLETED';
                const isLive = fixture.status === 'LIVE';

                return (
                  <div
                    key={fixture.id}
                    className="p-3.5 bg-[#EEF2F6] rounded-xl border border-[#DDE4EC] hover:border-gray-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    {/* Fixture Info */}
                    <div className="space-y-1 min-w-[200px]">
                      <div className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                        <span>Match #{idx + 1}</span>
                        <span>•</span>
                        <span>{fixture.venue}</span>
                      </div>
                      <div className="font-extrabold text-sm text-[#031128] flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: home?.primaryColor }} />
                          {home?.shortName}
                        </span>
                        <span className="text-xs text-gray-400 font-normal">vs</span>
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: away?.primaryColor }} />
                          {away?.shortName}
                        </span>
                      </div>
                    </div>

                    {/* Score / Status if completed or live */}
                    {isCompleted && (
                      <div className="text-center sm:text-left bg-white px-3 py-1.5 rounded-lg border border-[#DDE4EC] text-xs">
                        <span className="font-mono font-bold text-gray-800">
                          {fixture.homeScore} - {fixture.awayScore}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-bold block uppercase">Final Score</span>
                      </div>
                    )}

                    {isLive && (
                      <div className="bg-amber-100 text-amber-900 px-2.5 py-1 rounded-lg text-xs font-bold font-mono">
                        LIVE: {fixture.homeScore ?? 0} - {fixture.awayScore ?? 0}
                      </div>
                    )}

                    {/* Submitted Pick */}
                    <div className="sm:text-right shrink-0">
                      {tip ? (
                        <div className="bg-white p-2 rounded-xl border border-[#DDE4EC] inline-flex items-center gap-2">
                          <span className="text-xs font-bold text-[#031128]">
                            Predicted Pick:
                          </span>
                          <span className="bg-[#031128] text-[#FFBF00] px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                            <span>{predictedTeam?.shortName || tip.predictedWinnerTeamId}</span>
                            <span className="text-white font-mono text-[11px] font-normal">by {tip.predictedMargin} pts</span>
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs italic text-gray-400 bg-gray-100 px-3 py-1 rounded-lg border border-gray-200 inline-block">
                          No Tip Submitted
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#EEF2F6] border-t border-[#DDE4EC] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="bg-[#031128] hover:bg-[#0A2D55] text-white font-extrabold px-6 py-2 rounded-xl text-xs uppercase tracking-wider transition-all"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
