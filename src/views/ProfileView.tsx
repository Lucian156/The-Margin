/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  User as UserIcon,
  Crown,
  Settings as SettingsIcon,
  Edit3,
  Share2,
  Trophy,
  Award,
  Target,
  Zap,
  TrendingUp,
  BarChart3,
  Calendar,
  History,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Plus,
  Users as UsersIcon,
  Swords,
  ShieldAlert,
  Download,
  Bell,
  Eye,
  Camera,
  Check,
  X,
  Sparkles,
  ChevronRight,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import {
  SEEDED_ACHIEVEMENTS,
  SEEDED_ROUND_HISTORIES,
  SEEDED_TEAM_STATS,
  SEEDED_BILLING_HISTORY,
} from '../data/seedData';
import { NRL_TEAMS } from '../data/nrlTeams';
import { getCurrentUser, updateUser, getLeagues, getDuels, getFixtures, getH2HStandings, getRounds } from '../services/storageService';
import { User, MembershipTier } from '../types';
import { PremiumFeatureGate } from '../components/PremiumFeatureGate';
import { InviteQuickActions } from '../components/InviteQuickActions';

interface ProfileViewProps {
  currentUser: User;
  onUserUpdate: (updatedUser: User) => void;
  activeSubTab?: string;
  setActiveTab: (tab: string) => void;
  onLogout?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  onUserUpdate,
  activeSubTab = 'overview',
  setActiveTab,
  onLogout,
}) => {
  const [activeTab, setActiveProfileTab] = useState<string>(activeSubTab || 'overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [selectedHistoryRound, setSelectedHistoryRound] = useState<number | null>(23);
  const [statFilter, setStatFilter] = useState<'all' | 'last5' | 'last10'>('all');

  // Form State for Edit Profile
  const [editName, setEditName] = useState(currentUser.name);
  const [editUsername, setEditUsername] = useState(currentUser.username);
  const [editEmail, setEditEmail] = useState(currentUser.email);
  const [editTeamId, setEditTeamId] = useState(currentUser.favoriteTeamId || 'WARRIORS');
  const [editBio, setEditBio] = useState(currentUser.bio || 'Passionate NRL margin predictor.');
  const [editRegion, setEditRegion] = useState(currentUser.homeRegion || 'Auckland, NZ');
  const [editAvatarUrl, setEditAvatarUrl] = useState(currentUser.avatarUrl || '');

  const nrlTeams = NRL_TEAMS;
  const favTeam = nrlTeams.find((t) => t.id === (currentUser.favoriteTeamId || 'WARRIORS')) || nrlTeams[0];
  const activeRoundObj = getRounds().find((r) => r.isCurrent) || getRounds()[0];
  const userLeagues = getLeagues().filter((l) => l.memberUserIds.includes(currentUser.id));
  const userDuels = getDuels().filter(
    (d) => d.challengerUserId === currentUser.id || d.opponentUserId === currentUser.id
  );

  const currentTier: MembershipTier = currentUser.membership?.tier || 'margin-plus';

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: User = {
      ...currentUser,
      name: editName,
      username: editUsername,
      email: editEmail,
      favoriteTeamId: editTeamId,
      bio: editBio,
      homeRegion: editRegion,
      avatarUrl: editAvatarUrl || currentUser.avatarUrl,
    };
    updateUser(updated);
    onUserUpdate(updated);
    setShowEditModal(false);
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 3000);
  };

  const handleShareProfile = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 3000);
  };

  const tierBadgeStyle = (tier: MembershipTier) => {
    switch (tier) {
      case 'margin-pro':
        return 'bg-gradient-to-r from-[#031128] to-[#0A2D55] text-[#FFBF00] border-[#FFBF00] shadow-md';
      case 'margin-plus':
        return 'bg-[#FFBF00] text-[#031128] border-[#FFE179] font-black shadow-md';
      default:
        return 'bg-slate-700 text-slate-200 border-slate-600 font-bold';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast Notification */}
      {showShareToast && (
        <div className="fixed top-20 right-4 z-50 bg-[#159B5D] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-white/20 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-xs font-bold">Profile updated & link copied to clipboard!</span>
        </div>
      )}

      {/* Profile Header Banner */}
      <div className="relative rounded-2xl bg-gradient-to-br from-[#0A2D55] via-[#031128] to-[#020812] border border-[#0A2D55] p-6 shadow-xl text-white overflow-hidden">
        {/* Background Accent Gradient */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FFBF00]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          {/* Avatar & User Details */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <div className="relative group">
              <img
                src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                alt={currentUser.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-[#FFBF00] shadow-2xl bg-[#031128]"
              />
              <button
                onClick={() => setShowEditModal(true)}
                className="absolute bottom-0 right-0 bg-[#FFBF00] text-[#031128] p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
                title="Edit Photo"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white">{currentUser.name}</h1>
                <span
                  className={`px-3 py-0.5 rounded-full text-[10px] uppercase font-extrabold border ${tierBadgeStyle(
                    currentTier
                  )}`}
                >
                  <Crown className="w-3 h-3 inline mr-1" />
                  {currentTier === 'margin-pro'
                    ? 'THE MARGIN PRO'
                    : currentTier === 'margin-plus'
                    ? 'THE MARGIN+'
                    : 'FREE MEMBER'}
                </span>
              </div>

              <div className="text-xs text-slate-300 font-medium flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <span className="text-[#FFBF00] font-bold">@{currentUser.username}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span
                    className="w-3 h-3 rounded-full inline-block"
                    style={{ backgroundColor: favTeam.primaryColor }}
                  />
                  {favTeam.name}
                </span>
                <span>•</span>
                <span className="text-slate-400">Member since {currentUser.memberSince || 'March 2026'}</span>
              </div>

              <p className="text-xs text-slate-300 max-w-lg leading-relaxed pt-1">
                {currentUser.bio || 'NRL margin predictor competing in overall and private leagues.'}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                <span className="text-xs bg-[#020812] px-3 py-1 rounded-lg border border-[#0A2D55] text-slate-300">
                  Overall Rank: <strong className="text-[#FFBF00]">#148</strong>
                </span>
                <span className="text-xs bg-[#020812] px-3 py-1 rounded-lg border border-[#0A2D55] text-slate-300">
                  CCR Work League: <strong className="text-[#FFBF00]">#3</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="px-4 py-2 rounded-xl bg-[#0A2D55] hover:bg-[#0A2D55]/80 text-white font-bold text-xs flex items-center gap-2 border border-slate-600 shadow"
            >
              <Edit3 className="w-4 h-4 text-[#FFBF00]" />
              Edit Profile
            </button>
            <button
              onClick={handleShareProfile}
              className="px-4 py-2 rounded-xl bg-[#FFBF00] hover:bg-[#FFE179] text-[#031128] font-extrabold text-xs flex items-center gap-2 shadow"
            >
              <Share2 className="w-4 h-4" />
              Share Profile
            </button>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2 rounded-xl bg-[#0A2D55] hover:bg-[#0A2D55]/80 text-gray-300 hover:text-white border border-slate-600 shadow"
              title="Profile Settings"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                className="px-4 py-2 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-300 font-extrabold text-xs flex items-center gap-2 border border-red-800/80 shadow transition-all active:scale-95"
                title="Log Out Account"
              >
                <LogOut className="w-4 h-4 text-red-400" />
                <span>Log Out</span>
              </button>
            )}
          </div>
        </div>

        {/* Competition Banner */}
        <div className="mt-4 pt-3 border-t border-[#0A2D55]/80 text-[10px] text-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-[#FFBF00]" />
            <span className="font-semibold text-white">The Margin Beta — Round 25 Official Player Record</span>
          </div>
          <span className="text-gray-400">Lowest Total Margin Error Wins</span>
        </div>
      </div>

      {/* Quick Invite Actions Section */}
      <InviteQuickActions
        onOpenCreateLeague={() => setActiveTab('leagues')}
        onOpenJoinLeague={() => setActiveTab('leagues')}
      />

      {/* Headline Statistics Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#031128] border border-[#0A2D55] rounded-xl p-3.5 text-center text-white shadow">
          <div className="text-[10px] uppercase font-bold text-slate-400">Overall Rank</div>
          <div className="text-2xl font-black text-[#FFBF00] mt-0.5">
            {currentUser.roundsPlayed > 0 ? '#148' : 'Unranked'}
          </div>
          <div className="text-[10px] text-[#159B5D] font-bold mt-0.5">
            {currentUser.roundsPlayed > 0 ? '▲ Active Player' : 'Join Round 25'}
          </div>
        </div>

        <div className="bg-[#031128] border border-[#0A2D55] rounded-xl p-3.5 text-center text-white shadow">
          <div className="text-[10px] uppercase font-bold text-slate-400">Rounds Played</div>
          <div className="text-2xl font-black text-white mt-0.5">{currentUser.roundsPlayed || 0}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Round 25 Active</div>
        </div>

        <div className="bg-[#031128] border border-[#0A2D55] rounded-xl p-3.5 text-center text-white shadow">
          <div className="text-[10px] uppercase font-bold text-slate-400">Total Margin Score</div>
          <div className="text-2xl font-black text-[#FFE179] mt-0.5">{currentUser.totalScore || 0}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Lowest is best</div>
        </div>

        <div className="bg-[#031128] border border-[#0A2D55] rounded-xl p-3.5 text-center text-white shadow">
          <div className="text-[10px] uppercase font-bold text-slate-400">Correct Winners</div>
          <div className="text-2xl font-black text-[#159B5D] mt-0.5">{currentUser.correctWinnersCount || 0}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Matches Tipped</div>
        </div>

        <div className="bg-[#031128] border border-[#0A2D55] rounded-xl p-3.5 text-center text-white shadow">
          <div className="text-[10px] uppercase font-bold text-slate-400">Avg Margin Error</div>
          <div className="text-2xl font-black text-white mt-0.5">{currentUser.averageMarginError || '0.0'}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Pts per match</div>
        </div>

        <div className="bg-[#031128] border border-[#0A2D55] rounded-xl p-3.5 text-center text-white shadow">
          <div className="text-[10px] uppercase font-bold text-slate-400">H2H Duels Record</div>
          <div className="text-xl font-black text-[#FFBF00] mt-0.5">9W - 1D - 2L</div>
          <div className="text-[10px] text-slate-400 mt-0.5">19 Pts (+42 diff)</div>
        </div>
      </div>

      {/* Profile Tab Navigation */}
      <div className="bg-[#031128] border border-[#0A2D55] rounded-xl p-1.5 flex flex-wrap items-center gap-1 shadow">
        {[
          { id: 'overview', label: 'Overview', icon: Trophy },
          { id: 'statistics', label: 'Advanced Statistics', icon: BarChart3 },
          { id: 'history', label: 'Round History', icon: History },
          { id: 'achievements', label: 'Achievements', icon: Award },
          { id: 'leagues', label: 'Leagues', icon: UsersIcon },
          { id: 'duels', label: 'Duels', icon: Swords },
          { id: 'membership', label: 'Membership', icon: Crown },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveProfileTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                isActive
                  ? 'bg-[#FFBF00] text-[#031128] shadow'
                  : 'text-slate-300 hover:text-white hover:bg-[#0A2D55]/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* 2026 Form Summary Chart */}
            <div className="bg-[#031128] border border-[#0A2D55] rounded-xl p-5 text-white shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#FFBF00]" />
                  Recent Form (Last 5 Rounds)
                </h3>
                <button
                  onClick={() => setActiveProfileTab('history')}
                  className="text-xs font-bold text-[#FFBF00] hover:underline flex items-center gap-1"
                >
                  View Full History &rarr;
                </button>
              </div>

              {currentUser.roundsPlayed === 0 ? (
                <div className="p-8 text-center bg-[#020812] rounded-xl border border-[#0A2D55] my-4">
                  <History className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-300">You have not completed any rounds yet.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Your round history and margin stats will display here as soon as official match results are finalized.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-5 gap-2 text-center my-4">
                    {[
                      { round: activeRoundObj?.name || 'Round 27', score: currentUser.totalScore, label: `${currentUser.totalScore} pts` },
                    ].map((r, i) => (
                      <div key={i} className="bg-[#020812] border border-[#0A2D55] rounded-xl p-3">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">{r.round}</span>
                        <span
                          className={`text-xl font-black block my-1 ${
                            r.score <= 10 ? 'text-[#159B5D]' : r.score <= 25 ? 'text-[#FFBF00]' : 'text-slate-200'
                          }`}
                        >
                          {r.score}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">{r.label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-[#020812] rounded-lg p-3 text-xs text-slate-300 flex justify-between items-center border border-[#0A2D55]">
                    <div>
                      <span className="text-slate-400">Current Round: </span>
                      <strong className="text-[#FFBF00]">{activeRoundObj?.name || 'Round 27'}</strong>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Current Competitions Position */}
            <div className="bg-[#031128] border border-[#0A2D55] rounded-xl p-5 text-white shadow space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#FFBF00]" />
                Current Competition Standings
              </h3>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-[#020812] border border-[#0A2D55] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#FFBF00]/20 border border-[#FFBF00] flex items-center justify-center text-[#FFBF00] font-bold text-base">
                      #148
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Overall NRL Tipping Competition</div>
                      <div className="text-xs text-slate-400">12,450 active tippers</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('ladder')}
                    className="text-xs font-bold bg-[#0A2D55] hover:bg-[#0A2D55]/80 text-white px-3 py-1.5 rounded-lg border border-slate-600"
                  >
                    View Ladder
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-[#020812] border border-[#0A2D55] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#159B5D]/20 border border-[#159B5D] flex items-center justify-center text-[#159B5D] font-bold text-base">
                      #3
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">CCR Work League (Major Sponsor)</div>
                      <div className="text-xs text-slate-400">Cross Country Rentals workplace comp</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('leagues')}
                    className="text-xs font-bold bg-[#0A2D55] hover:bg-[#0A2D55]/80 text-white px-3 py-1.5 rounded-lg border border-slate-600"
                  >
                    Open League
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Cards */}
          <div className="space-y-6">
            {/* Membership Summary Card */}
            <div className="bg-gradient-to-br from-[#0A2D55] to-[#031128] border border-[#FFBF00]/30 rounded-xl p-5 text-white shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold text-[#FFBF00] uppercase tracking-wider flex items-center gap-1">
                  <Crown className="w-4 h-4" /> Active Plan
                </span>
                <span className="text-xs bg-[#FFBF00] text-[#031128] font-black px-2 py-0.5 rounded uppercase">
                  THE MARGIN+
                </span>
              </div>
              <p className="text-xs text-slate-200 mb-4">
                Enjoying live game scores, live round ranks, Auto Picks, and unlimited private leagues.
              </p>
              <button
                onClick={() => setActiveTab('memberships')}
                className="w-full bg-[#FFBF00] hover:bg-[#FFE179] text-[#031128] font-extrabold py-2 rounded-lg text-xs shadow text-center block"
              >
                Upgrade to The Margin Pro &rarr;
              </button>
            </div>

            {/* Favorite Team Focus */}
            <div className="bg-[#031128] border border-[#0A2D55] rounded-xl p-5 text-white shadow">
              <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">
                Favourite Team Performance
              </h4>
              <div className="flex items-center gap-3 p-3 bg-[#020812] rounded-xl border border-[#0A2D55]">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-lg shadow"
                  style={{ backgroundColor: favTeam.primaryColor }}
                >
                  {favTeam.code}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{favTeam.name}</div>
                  <div className="text-xs text-slate-400">20 / 23 correct tips (87% accuracy)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ADVANCED STATISTICS */}
      {activeTab === 'statistics' && (
        <PremiumFeatureGate
          requiredTier="margin-plus"
          featureName="Advanced Profile Statistics"
          upgradeMessage="Unlock team-by-team accuracy breakdown, error trends, and day-of-week analytics with The Margin+."
        >
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between bg-[#031128] border border-[#0A2D55] rounded-xl p-3 text-white shadow">
              <span className="text-xs font-bold text-slate-300">Statistics Filter Range:</span>
              <div className="flex items-center gap-2">
                {[
                  { id: 'all', label: 'All Season' },
                  { id: 'last5', label: 'Last 5 Rounds' },
                  { id: 'last10', label: 'Last 10 Rounds' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setStatFilter(f.id as any)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      statFilter === f.id ? 'bg-[#FFBF00] text-[#031128]' : 'bg-[#0A2D55] text-slate-300'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Team Accuracy Table */}
            <div className="bg-[#031128] border border-[#0A2D55] rounded-xl p-5 text-white shadow overflow-x-auto">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#FFBF00]" />
                Team-by-Team Accuracy Breakdown
              </h3>

              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-[#0A2D55] text-slate-400 text-[11px] uppercase font-bold">
                    <th className="py-2.5 px-3">Team</th>
                    <th className="py-2.5 px-3 text-center">Tips</th>
                    <th className="py-2.5 px-3 text-center">Correct</th>
                    <th className="py-2.5 px-3 text-center">Wrong</th>
                    <th className="py-2.5 px-3 text-center">Accuracy %</th>
                    <th className="py-2.5 px-3 text-center">Avg Margin Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0A2D55] text-xs">
                  {SEEDED_TEAM_STATS.map((st) => {
                    const tm = nrlTeams.find((t) => t.id === st.teamId) || {
                      name: st.teamId,
                      primaryColor: '#0A2D55',
                    };
                    return (
                      <tr key={st.teamId} className="hover:bg-[#0A2D55]/40 transition-colors">
                        <td className="py-2.5 px-3 flex items-center gap-2.5 font-bold text-white">
                          <span
                            className="w-3 h-3 rounded-full inline-block"
                            style={{ backgroundColor: tm.primaryColor }}
                          />
                          {tm.name}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold">{st.tips}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-[#159B5D] font-bold">
                          {st.correctWinners}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-rose-400 font-bold">
                          {st.wrongWinners}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-[#FFBF00]">
                          {st.correctWinnerPercentage}%
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-300">
                          {st.averageMarginError} pts
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Account Log Out Section on Statistics Page */}
          {onLogout && (
            <div className="bg-white p-5 rounded-2xl border border-[#DDE4EC] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm mt-6">
              <div>
                <h4 className="font-extrabold text-[#031128] text-sm uppercase flex items-center gap-2">
                  <LogOut className="w-4 h-4 text-red-500" /> Account Session & Log Out
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Logged in as <strong className="text-[#031128]">{currentUser.name}</strong> (@{currentUser.username}). Log out of your session on this device.
                </p>
              </div>
              <button
                onClick={onLogout}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out Account</span>
              </button>
            </div>
          )}
        </PremiumFeatureGate>
      )}

      {/* TAB 3: ROUND HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-[#031128] border border-[#0A2D55] rounded-xl p-5 text-white shadow">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-[#FFBF00]" />
              Completed Round Summaries
            </h3>

            {SEEDED_ROUND_HISTORIES.length === 0 ? (
              <div className="p-8 text-center bg-[#020812] rounded-xl border border-[#0A2D55]">
                <History className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-300">You have not completed any rounds yet.</p>
                <p className="text-xs text-slate-400 mt-1">
                  Once active round matches finish and official results are submitted, your round-by-round margin breakdown will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {SEEDED_ROUND_HISTORIES.map((rh) => {
                  const isSelected = selectedHistoryRound === rh.roundNumber;
                  return (
                    <button
                      key={rh.roundId}
                      onClick={() => setSelectedHistoryRound(rh.roundNumber)}
                      className={`p-4 rounded-xl text-left border transition-all ${
                        isSelected
                          ? 'bg-[#0A2D55] border-[#FFBF00] shadow-lg'
                          : 'bg-[#020812] border-[#0A2D55] hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-white">Round {rh.roundNumber}</span>
                        <span className="text-xs font-mono font-bold text-[#FFBF00]">{rh.roundScore} pts</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                        <div>Rank: #{rh.roundRank}</div>
                        <div>Avg Error: {rh.averageMarginError}</div>
                        <div>Correct: {rh.correctWinners} / 8</div>
                        <div>Perfect: {rh.perfectPredictions}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Game-by-Game Breakdown for Selected Round */}
          {selectedHistoryRound && (
            <div className="bg-[#031128] border border-[#0A2D55] rounded-xl p-5 text-white shadow space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center justify-between">
                <span>Round {selectedHistoryRound} Game-by-Game Summary</span>
                <span className="text-xs text-[#FFBF00] font-mono">Official 5-point wrong penalty applied</span>
              </h4>

              <div className="space-y-2">
                {[
                  {
                    fixture: 'Warriors vs Panthers',
                    actual: 'Warriors by 6',
                    tip: 'Warriors by 10',
                    correct: true,
                    diff: 4,
                    penalty: 0,
                    final: 4,
                  },
                  {
                    fixture: 'Roosters vs Rabbitohs',
                    actual: 'Roosters by 6',
                    tip: 'Roosters by 8',
                    correct: true,
                    diff: 2,
                    penalty: 0,
                    final: 2,
                  },
                  {
                    fixture: 'Storm vs Broncos',
                    actual: 'Storm by 12',
                    tip: 'Broncos by 4',
                    correct: false,
                    diff: 16,
                    penalty: 5,
                    final: 21,
                  },
                ].map((g, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#020812] rounded-xl border border-[#0A2D55] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">{g.fixture}</div>
                      <div className="text-slate-400">
                        Result: {g.actual} | Your Tip: <strong className="text-white">{g.tip}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          g.correct ? 'bg-[#159B5D]/20 text-[#159B5D]' : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {g.correct ? 'CORRECT' : 'WRONG (+5 PENALTY)'}
                      </span>
                      <span className="font-mono font-black text-sm text-[#FFBF00]">{g.final} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ACHIEVEMENTS */}
      {activeTab === 'achievements' && (
        <div className="bg-[#031128] border border-[#0A2D55] rounded-xl p-5 text-white shadow space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-[#FFBF00]" />
            Player Achievement Badges
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SEEDED_ACHIEVEMENTS.map((ach) => (
              <div
                key={ach.id}
                className={`p-4 rounded-xl border relative overflow-hidden transition-all ${
                  ach.unlocked
                    ? 'bg-gradient-to-br from-[#0A2D55] to-[#031128] border-[#FFBF00]/50 shadow-md'
                    : 'bg-[#020812] border-[#0A2D55] opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${
                      ach.unlocked
                        ? 'bg-[#FFBF00] text-[#031128] shadow-md'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {ach.unlocked ? <Trophy className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-white">{ach.title}</h4>
                    <p className="text-xs text-slate-300 leading-tight">{ach.description}</p>

                    <div className="pt-2 text-[10px] text-[#FFBF00] font-bold">
                      {ach.unlocked ? `Unlocked: ${ach.unlockedDate}` : 'Locked'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: LEAGUES */}
      {activeTab === 'leagues' && (
        <div className="bg-[#031128] border border-[#0A2D55] rounded-xl p-5 text-white shadow space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UsersIcon className="w-5 h-5 text-[#FFBF00]" />
              Joined Private Leagues
            </h3>
            <button
              onClick={() => setActiveTab('leagues')}
              className="px-3 py-1.5 rounded-lg bg-[#FFBF00] text-[#031128] font-bold text-xs"
            >
              + Create or Join League
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {userLeagues.map((lg) => (
              <div
                key={lg.id}
                className="p-4 rounded-xl bg-[#020812] border border-[#0A2D55] space-y-3 hover:border-[#FFBF00]/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#FFBF00] uppercase tracking-wider">{lg.code}</span>
                  <span className="text-[10px] bg-[#0A2D55] text-slate-300 px-2 py-0.5 rounded">
                    {lg.memberUserIds.length} Members
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white">{lg.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{lg.description}</p>
                </div>

                <div className="pt-2 border-t border-[#0A2D55] flex items-center justify-between text-xs">
                  <span className="text-slate-400">Your Rank: <strong className="text-white">#3</strong></span>
                  <button
                    onClick={() => setActiveTab('leagues')}
                    className="text-[#FFBF00] font-bold hover:underline"
                  >
                    Open Standings &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: DUELS */}
      {activeTab === 'duels' && (() => {
        const userH2HStanding = getH2HStandings().find((s) => s.userId === currentUser.id);
        const wins = userH2HStanding?.wins ?? 0;
        const draws = userH2HStanding?.draws ?? 0;
        const losses = userH2HStanding?.losses ?? 0;
        const points = userH2HStanding?.competitionPoints ?? 0;
        const diff = userH2HStanding?.differential ?? 0;
        const streak = userH2HStanding?.winningStreak ?? 0;

        return (
          <div className="bg-[#031128] border border-[#0A2D55] rounded-xl p-5 text-white shadow space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Swords className="w-5 h-5 text-[#FFBF00]" />
                Head-to-Head Duel Records
              </h3>
              <button
                onClick={() => setActiveTab('duels')}
                className="px-3 py-1.5 rounded-lg bg-[#FFBF00] text-[#031128] font-bold text-xs"
              >
                Issue New Challenge
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center my-2">
              <div className="p-3 bg-[#020812] rounded-xl border border-[#0A2D55]">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Record</div>
                <div className="text-lg font-black text-[#FFBF00]">{wins}W - {draws}D - {losses}L</div>
              </div>
              <div className="p-3 bg-[#020812] rounded-xl border border-[#0A2D55]">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Competition Points</div>
                <div className="text-lg font-black text-[#159B5D]">{points} Pts</div>
              </div>
              <div className="p-3 bg-[#020812] rounded-xl border border-[#0A2D55]">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Duel Differential</div>
                <div className="text-lg font-black text-white">{diff >= 0 ? `+${diff}` : diff} pts</div>
              </div>
              <div className="p-3 bg-[#020812] rounded-xl border border-[#0A2D55]">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Best Winning Streak</div>
                <div className="text-lg font-black text-[#FFE179]">{streak} Rounds</div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* TAB 7: MEMBERSHIP */}
      {activeTab === 'membership' && (
        <div className="bg-[#031128] border border-[#0A2D55] rounded-xl p-6 text-white shadow space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#0A2D55] pb-6">
            <div>
              <span className="text-xs font-bold text-[#FFBF00] uppercase tracking-wider">Current Active Plan</span>
              <h2 className="text-2xl font-black text-white mt-1">THE MARGIN+ MEMBERSHIP</h2>
              <p className="text-xs text-slate-300 mt-1">
                Started March 2026 • Monthly Billing • Next illustrative billing date: Sept 1, 2026
              </p>
            </div>

            <button
              onClick={() => setActiveTab('memberships')}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FFBF00] to-[#FFE179] text-[#031128] font-extrabold text-sm shadow hover:brightness-105"
            >
              Upgrade to The Margin Pro
            </button>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white">Your Unlocked Margin+ Benefits:</h4>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#159B5D]" /> Live game scores & round ranks
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#159B5D]" /> Unlimited private leagues & duel challenges
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#159B5D]" /> Auto Picks fallback strategy engine
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#159B5D]" /> Advanced team-by-team accuracy analytics
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#031128] border border-[#0A2D55] rounded-2xl p-6 max-w-md w-full text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#0A2D55] pb-3">
              <h3 className="text-lg font-bold text-white">Edit Profile Details</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#020812] border border-[#0A2D55] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#FFBF00]"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Username</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full bg-[#020812] border border-[#0A2D55] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#FFBF00]"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Favourite NRL Team</label>
                <select
                  value={editTeamId}
                  onChange={(e) => setEditTeamId(e.target.value)}
                  className="w-full bg-[#020812] border border-[#0A2D55] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#FFBF00]"
                >
                  {nrlTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Bio / Slogan</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={2}
                  className="w-full bg-[#020812] border border-[#0A2D55] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#FFBF00]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#0A2D55] text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#FFBF00] text-[#031128] font-bold shadow"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#031128] border border-[#0A2D55] rounded-2xl p-6 max-w-md w-full text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#0A2D55] pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-[#FFBF00]" />
                Profile Settings
              </h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#020812] rounded-xl border border-[#0A2D55] flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Public Profile Visibility</div>
                  <div className="text-slate-400 text-[10px]">Allow other players to view your statistics</div>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#FFBF00]" />
              </div>

              <div className="p-3 bg-[#020812] rounded-xl border border-[#0A2D55] flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Lockout Reminders</div>
                  <div className="text-slate-400 text-[10px]">1-hour notification before game lockout</div>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#FFBF00]" />
              </div>

              <div className="p-3 bg-[#020812] rounded-xl border border-[#0A2D55] flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Auto Picks Fallback</div>
                  <div className="text-slate-400 text-[10px]">Automatically apply tips if missed before lockout</div>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#FFBF00]" />
              </div>

              {onLogout && (
                <div className="p-3 bg-red-950/40 rounded-xl border border-red-800/60 flex items-center justify-between mt-2">
                  <div>
                    <div className="font-bold text-red-300">Account Log Out</div>
                    <div className="text-red-400/80 text-[10px]">End current tipper session</div>
                  </div>
                  <button
                    onClick={() => {
                      setShowSettingsModal(false);
                      onLogout();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Log Out
                  </button>
                </div>
              )}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 rounded-lg bg-[#FFBF00] text-[#031128] font-bold"
              >
                Close Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
