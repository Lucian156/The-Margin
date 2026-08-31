/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Users, Plus, Key, Lock, Trophy, Award, Send, CheckCircle2, Eye } from 'lucide-react';
import { League, User } from '../types';
import { createLeague, getLeagues, getUsers, joinLeagueByCode } from '../services/storageService';
import { InviteQuickActions } from '../components/InviteQuickActions';
import { PlayerProfileModal } from '../components/PlayerProfileModal';

interface LeaguesViewProps {
  currentUser: User;
}

export const LeaguesView: React.FC<LeaguesViewProps> = ({ currentUser }) => {
  const [leagues, setLeagues] = useState<League[]>(getLeagues());
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>(leagues[0]?.id || '');

  // Form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const [newLeagueName, setNewLeagueName] = useState('');
  const [newLeagueDesc, setNewLeagueDesc] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedUserForModal, setSelectedUserForModal] = useState<User | null>(null);

  const allUsers = getUsers();
  const selectedLeague = leagues.find((l) => l.id === selectedLeagueId);

  // Filter members of selected league
  const leagueMembers = selectedLeague
    ? allUsers
        .filter((u) => selectedLeague.memberUserIds.includes(u.id))
        .sort((a, b) => a.totalScore - b.totalScore)
    : [];

  const handleCreateLeague = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeagueName.trim()) return;

    const created = createLeague(newLeagueName, newLeagueDesc, true, currentUser.id);
    setLeagues(getLeagues());
    setSelectedLeagueId(created.id);
    setShowCreateModal(false);
    setNewLeagueName('');
    setNewLeagueDesc('');
  };

  const handleJoinLeague = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const joined = joinLeagueByCode(joinCodeInput, currentUser.id);
    if (!joined) {
      setErrorMessage('Invalid League PIN / Code. Please check and try again.');
      return;
    }
    setLeagues(getLeagues());
    setSelectedLeagueId(joined.id);
    setShowJoinModal(false);
    setJoinCodeInput('');
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Player Profile & Picks Modal */}
      {selectedUserForModal && (
        <PlayerProfileModal
          user={selectedUserForModal}
          onClose={() => setSelectedUserForModal(null)}
          isAdmin={currentUser.isAdmin}
        />
      )}
      {/* Header Banner */}
      <div className="bg-[#031128] text-white p-4 sm:p-8 rounded-2xl border border-[#0A2D55] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
            <span className="bg-[#FFBF00] text-[#031128] font-black text-[10px] px-2.5 py-0.5 rounded uppercase tracking-wider">
              Leagues & Competitions
            </span>
            <span className="text-xs text-gray-300 font-medium">Workplace & Mate Showdowns</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black uppercase text-white font-sans">
            Private & Public Competition Leagues
          </h1>
          <p className="text-gray-300 text-xs sm:text-sm mt-1 max-w-xl">
            Create custom private or public leagues with custom codes. Compete against workmates, family, and friends!
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowJoinModal(true)}
            className="flex-1 sm:flex-none justify-center bg-[#0A2D55] hover:bg-[#0A2D55]/80 text-white font-bold py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl text-xs flex items-center gap-1.5 border border-[#DDE4EC]/10 transition-colors"
          >
            <Key className="w-4 h-4 text-[#FFBF00]" /> Join with PIN Code
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex-1 sm:flex-none justify-center bg-[#FFBF00] hover:bg-[#FFE179] text-[#031128] font-extrabold py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-lg transition-transform hover:scale-105"
          >
            <Plus className="w-4 h-4" /> Create New League
          </button>
        </div>
      </div>

      {/* Quick Invite Actions Bar */}
      <InviteQuickActions
        onOpenCreateLeague={() => setShowCreateModal(true)}
        onOpenJoinLeague={() => setShowJoinModal(true)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Leagues Sidebar Selection */}
        <div className="lg:col-span-4 space-y-3">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
            Your Active Leagues
          </h2>

          <div className="space-y-2">
            {leagues.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl border border-[#DDE4EC] text-center">
                <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-gray-500 uppercase">No leagues created yet.</p>
              </div>
            ) : (
              leagues.map((league) => {
                const isSelected = league.id === selectedLeagueId;
                const isMember = league.memberUserIds.includes(currentUser.id);

                return (
                  <button
                    key={league.id}
                    onClick={() => setSelectedLeagueId(league.id)}
                    className={`w-full p-4 rounded-2xl text-left transition-all border shadow-sm ${
                      isSelected
                        ? 'bg-[#031128] text-white border-[#FFBF00] ring-2 ring-[#FFBF00]/30'
                        : 'bg-white hover:bg-gray-50 text-[#111D31] border-[#DDE4EC]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-sm flex items-center gap-1.5">
                        {league.name}
                        {league.isPrivate && <Lock className="w-3 h-3 text-[#FFBF00]" />}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          isSelected ? 'bg-[#FFBF00] text-[#031128]' : 'bg-[#EEF2F6] text-gray-700'
                        }`}
                      >
                        Code: {league.code}
                      </span>
                    </div>

                    <p className={`text-xs ${isSelected ? 'text-gray-300' : 'text-gray-500'} line-clamp-1`}>
                      {league.description}
                    </p>

                    <div className="mt-3 flex items-center justify-between text-[11px] pt-2 border-t border-gray-200/20">
                      <span className="flex items-center gap-1 text-gray-400">
                        <Users className="w-3.5 h-3.5" /> {league.memberUserIds.length} Members
                      </span>
                      {isMember && (
                        <span className="text-[#159B5D] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Joined
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Selected League Detail Standings */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#DDE4EC] p-6 shadow-sm space-y-6">
          {selectedLeague ? (
            <>
              <div className="flex items-center justify-between border-b border-[#DDE4EC] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-[#111D31] uppercase">
                      {selectedLeague.name}
                    </h2>
                    <span className="bg-[#031128] text-[#FFBF00] text-xs font-mono font-bold px-2.5 py-0.5 rounded">
                      PIN: {selectedLeague.code}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{selectedLeague.description}</p>
                </div>
              </div>

              {/* Members Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#EEF2F6] text-gray-600 text-[10px] font-bold uppercase tracking-wider border-b border-[#DDE4EC]">
                      <th className="py-2.5 px-3">Rank</th>
                      <th className="py-2.5 px-3">Member</th>
                      <th className="py-2.5 px-3 text-center">Correct Winners</th>
                      <th className="py-2.5 px-3 text-center">Total Score</th>
                      <th className="py-2.5 px-3 text-right">Profile & Picks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DDE4EC] text-xs font-medium">
                    {leagueMembers.map((member, idx) => {
                      const rank = idx + 1;
                      const isCurrentUser = member.id === currentUser.id;

                      return (
                        <tr
                          key={member.id}
                          onClick={() => setSelectedUserForModal(member)}
                          className={`cursor-pointer transition-colors ${
                            isCurrentUser ? 'bg-[#FFBF00]/10 font-bold' : 'hover:bg-amber-50/60'
                          }`}
                        >
                          <td className="py-3 px-3 font-mono font-bold text-gray-700">#{rank}</td>
                          <td className="py-3 px-3 flex items-center gap-2.5">
                            <img
                              src={member.avatarUrl}
                              alt={member.name}
                              className="w-7 h-7 rounded-lg object-cover"
                            />
                            <div>
                              <p className="font-extrabold text-[#111D31]">{member.name}</p>
                              <p className="text-[10px] text-gray-400">@{member.username}</p>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-[#0A2D55] font-bold">
                            {member.correctWinnersCount}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-black text-sm text-[#031128]">
                            {member.totalScore} pts
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUserForModal(member);
                              }}
                              className="bg-[#031128] hover:bg-[#0A2D55] text-white px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 shadow transition-all"
                            >
                              <Eye className="w-3 h-3 text-[#FFBF00]" />
                              <span>View Picks</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Select a league from the left panel to inspect standings.
            </div>
          )}
        </div>
      </div>

      {/* Create League Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#DDE4EC] space-y-4">
            <h3 className="text-lg font-black text-[#031128] uppercase">Create Private League</h3>
            <form onSubmit={handleCreateLeague} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">League Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sydney Tradies Showdown"
                  value={newLeagueName}
                  onChange={(e) => setNewLeagueName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#DDE4EC] text-sm font-medium focus:ring-2 focus:ring-[#FFBF00] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Description / Rules</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Weekly bragging rights for the Sydney crew."
                  value={newLeagueDesc}
                  onChange={(e) => setNewLeagueDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#DDE4EC] text-sm font-medium focus:ring-2 focus:ring-[#FFBF00] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#FFBF00] hover:bg-[#FFE179] text-[#031128] font-bold px-4 py-2 rounded-xl text-xs shadow"
                >
                  Create & Get Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join League Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#DDE4EC] space-y-4">
            <h3 className="text-lg font-black text-[#031128] uppercase">Join Private League</h3>
            <form onSubmit={handleJoinLeague} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">League PIN / Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TRADIE2026"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#DDE4EC] text-sm font-mono font-bold uppercase focus:ring-2 focus:ring-[#FFBF00] outline-none"
                />
              </div>

              {errorMessage && (
                <p className="text-xs font-bold text-red-500 bg-red-50 p-2 rounded-lg">{errorMessage}</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#031128] hover:bg-[#0A2D55] text-white font-bold px-4 py-2 rounded-xl text-xs shadow"
                >
                  Join Competition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
