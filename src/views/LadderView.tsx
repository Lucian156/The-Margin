/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Award, Trophy, Sparkles, Filter, CheckCircle2, Eye, Users } from 'lucide-react';
import { User } from '../types';
import { getUsers, getRounds, getFixtures, getTips, getUserTips } from '../services/storageService';
import { getTeamById } from '../data/nrlTeams';
import { PlayerProfileModal } from '../components/PlayerProfileModal';

interface LadderViewProps {
  currentUser: User;
}

export const LadderView: React.FC<LadderViewProps> = ({ currentUser }) => {
  const users = getUsers(); // Already sorted by totalScore ASC (Lowest score = #1)
  const rounds = getRounds();
  const fixtures = getFixtures();
  const allTips = getTips();
  const completedFixtures = fixtures.filter((f) => f.status === 'COMPLETED');
  const hasCompletedGames = completedFixtures.length > 0;

  const [selectedRoundFilter, setSelectedRoundFilter] = useState<string>('SEASON');
  const [selectedUserForModal, setSelectedUserForModal] = useState<User | null>(null);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Modal for viewing player profile & picks */}
      {selectedUserForModal && (
        <PlayerProfileModal
          user={selectedUserForModal}
          onClose={() => setSelectedUserForModal(null)}
          isAdmin={currentUser.isAdmin}
        />
      )}

      {/* Leaderboard Banner */}
      <div className="bg-[#031128] text-white p-4 sm:p-8 rounded-2xl border border-[#0A2D55] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
            <span className="bg-[#FFBF00] text-[#031128] font-black text-[10px] px-2.5 py-0.5 rounded uppercase tracking-wider">
              Official Leaderboard
            </span>
            <span className="text-xs text-gray-300 font-medium">Ranked by Lowest Score</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black uppercase text-white font-sans">
            Overall Season Ladder & Registered Players
          </h1>
          <p className="text-gray-300 text-xs sm:text-sm mt-1 max-w-xl">
            In The Margin, lower is better! Click any registered player below to inspect their profile and submitted Round 25 picks.
          </p>
        </div>

        <div className="bg-[#020812] p-3 sm:p-4 rounded-xl border border-[#0A2D55] text-left sm:text-center shrink-0 flex sm:flex-col items-center justify-between sm:justify-center">
          <p className="text-[10px] text-gray-400 font-bold uppercase">Your Season Rank</p>
          <div className="flex items-baseline gap-2 sm:block">
            <p className="text-xl sm:text-2xl font-black text-[#FFBF00] font-mono sm:mt-0.5">
              #{users.findIndex((u) => u.id === currentUser.id) + 1}{' '}
              <span className="text-xs text-gray-300 font-normal">of {users.length}</span>
            </p>
            <p className="text-xs text-gray-400 sm:mt-1">({currentUser.totalScore} pts)</p>
          </div>
        </div>
      </div>

      {/* Filter Options */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-[#DDE4EC] shadow-sm flex items-center justify-between flex-wrap gap-2 sm:gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[#0A2D55]">
          <Filter className="w-4 h-4 text-[#FFBF00]" /> Filter View:
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedRoundFilter('SEASON')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              selectedRoundFilter === 'SEASON'
                ? 'bg-[#031128] text-[#FFBF00]'
                : 'bg-[#EEF2F6] text-gray-700 hover:bg-gray-200'
            }`}
          >
            Full Season Overall ({users.length} Players)
          </button>
          {rounds.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRoundFilter(r.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                selectedRoundFilter === r.id
                  ? 'bg-[#031128] text-[#FFBF00]'
                  : 'bg-[#EEF2F6] text-gray-700 hover:bg-gray-200'
              }`}
            >
              Round {r.number}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard & Registered Players Table */}
      <div className="bg-white rounded-2xl border border-[#DDE4EC] shadow-sm overflow-hidden">
        {users.length === 0 ? (
          <div className="p-12 text-center text-[#031128]">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-black uppercase text-[#031128]">No registered players found.</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              As soon as users register, they will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#031128] text-white text-[11px] uppercase tracking-wider font-extrabold border-b border-[#0A2D55]">
                  <th className="py-3.5 px-4 text-center w-16">Rank</th>
                  <th className="py-3.5 px-4">Registered Player</th>
                  <th className="py-3.5 px-4 text-center">R24 Tips Status</th>
                  <th className="py-3.5 px-4 text-center">Perfect (0 Pts)</th>
                  <th className="py-3.5 px-4 text-center">Avg Margin Error</th>
                  <th className="py-3.5 px-4 text-center">Total Score</th>
                  <th className="py-3.5 px-4 text-right pr-6">Profile & Picks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE4EC] text-xs font-medium text-[#111D31]">
                {users.map((user, idx) => {
                  const rank = idx + 1;
                  const isCurrentUser = user.id === currentUser.id;
                  const favTeam = user.favoriteTeamId ? getTeamById(user.favoriteTeamId) : null;
                  const userTips = getUserTips(user.id || user.uid || user.username);

                  return (
                    <tr
                      key={user.id}
                      onClick={() => setSelectedUserForModal(user)}
                      className={`transition-colors hover:bg-amber-50/60 cursor-pointer ${
                        isCurrentUser ? 'bg-[#FFBF00]/10 font-bold border-l-4 border-l-[#FFBF00]' : ''
                      }`}
                    >
                      {/* Rank Badge */}
                      <td className="py-4 px-4 text-center font-mono font-black text-sm">
                        {rank === 1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#FFBF00] text-[#031128] shadow">
                            👑
                          </span>
                        ) : rank === 2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-300 text-gray-800">
                            🥈
                          </span>
                        ) : rank === 3 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-white">
                            🥉
                          </span>
                        ) : (
                          `#${rank}`
                        )}
                      </td>

                      {/* Tipper Info */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                            alt={user.name}
                            className="w-9 h-9 rounded-xl object-cover border border-[#DDE4EC]"
                          />
                          <div>
                            <div className="font-extrabold text-sm text-[#111D31] flex items-center gap-1.5">
                              {user.name}
                              {isCurrentUser && (
                                <span className="bg-[#031128] text-[#FFBF00] text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                                  YOU
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500">
                              @{user.username} {favTeam && `• ${favTeam.shortName} Fan`}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Tips Submitted Badge */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold inline-flex items-center gap-1 ${
                            userTips.length === fixtures.length && fixtures.length > 0
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : userTips.length > 0
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                          {userTips.length} / {fixtures.length} Tipped
                        </span>
                      </td>

                      {/* Stats */}
                      <td className="py-4 px-4 text-center font-mono font-bold text-[#159B5D]">
                        {user.perfectTipsCount > 0 ? (
                          <span className="bg-[#159B5D]/10 text-[#159B5D] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> {user.perfectTipsCount}
                          </span>
                        ) : (
                          '0'
                        )}
                      </td>

                      <td className="py-4 px-4 text-center font-mono font-bold text-gray-700">
                        ±{user.averageMarginError} pts
                      </td>

                      {/* Total Score */}
                      <td className="py-4 px-4 text-center font-mono font-black text-[#031128]">
                        <span className="text-base font-black font-mono text-[#031128] bg-[#EEF2F6] px-3 py-1 rounded-xl border border-[#DDE4EC]">
                          {user.totalScore} <span className="text-xs font-normal text-gray-500">pts</span>
                        </span>
                      </td>

                      {/* View Picks Action */}
                      <td className="py-4 px-4 text-right pr-6">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUserForModal(user);
                          }}
                          className="bg-[#031128] hover:bg-[#0A2D55] text-white px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow transition-all active:scale-95"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#FFBF00]" />
                          <span>View Picks</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

