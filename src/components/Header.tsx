/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Home as HomeIcon,
  Trophy,
  Activity,
  Award,
  Users,
  Swords,
  BookOpen,
  Settings,
  ChevronDown,
  UserCheck,
  UserPlus,
  Crown,
  User as UserIcon,
  Bot,
  Zap,
  Gift,
  LogOut,
} from 'lucide-react';
import { User } from '../types';
import { getUsers, setCurrentUser } from '../services/storageService';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User;
  onUserSwitch: (user: User) => void;
  onOpenRegisterModal: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onUserSwitch,
  onOpenRegisterModal,
  onLogout,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const allUsers = getUsers();

  const handleSelectUser = (u: User) => {
    setCurrentUser(u);
    onUserSwitch(u);
    setShowUserDropdown(false);
  };

  const tierBadge = currentUser.membership?.tier || 'margin-plus';

  const navItems = [
    { id: 'home', label: 'Home', icon: HomeIcon },
    { id: 'tips', label: 'Tips', icon: Trophy },
    { id: 'live', label: 'Live', icon: Activity },
    { id: 'ladder', label: 'Ladder', icon: Award },
    { id: 'leagues', label: 'Leagues', icon: Users },
    { id: 'duels', label: 'Duels', icon: Swords },
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'memberships', label: 'Plans', icon: Crown, highlight: true },
    { id: 'ai-centre', label: 'AI Centre', icon: Bot },
    { id: 'auto-picks', label: 'Auto Picks', icon: Zap },
    { id: 'rules', label: 'Rules', icon: BookOpen },
    ...(currentUser.isAdmin ? [{ id: 'admin', label: 'Admin', icon: Settings }] : []),
  ];

  return (
    <header className="bg-[#031128] text-white border-b border-[#0A2D55] sticky top-0 z-40 shadow-lg">
      {/* Top Banner Tagline & Major Sponsor */}
      <div className="bg-[#020812] border-b border-[#0A2D55]/60 text-xs py-1 px-4 hidden sm:flex justify-between items-center text-gray-300">
        <div className="flex items-center gap-2">
          <span className="bg-[#FFBF00] text-[#031128] font-bold px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider">
            Round 27 Active
          </span>
          <span className="font-medium text-gray-300">
            Pick the winner. Predict the margin. Lowest score wins.
          </span>
          <span className="text-[#FFBF00] font-semibold text-[11px] hidden lg:inline ml-2 border-l border-[#0A2D55] pl-2">
            Major Sponsor: Cross Country Rentals (CCR)
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-xs">
            Logged in: <strong className="text-white font-semibold">{currentUser?.name || 'Tipper'}</strong>
          </span>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FFBF00] to-[#FFE179] flex items-center justify-center text-[#031128] font-black text-xl shadow-md group-hover:scale-105 transition-transform">
            M
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-wider text-white uppercase font-sans">
                THE <span className="text-[#FFBF00]">MARGIN</span>
              </span>
              <span className="bg-[#159B5D]/20 text-[#159B5D] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#159B5D]/30 hidden md:inline-block">
                Lowest Score Wins
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#020812]/70 p-1 rounded-xl border border-[#0A2D55]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#FFBF00] text-[#031128] shadow-sm'
                    : item.highlight
                    ? 'text-[#FFBF00] hover:bg-[#FFBF00]/10'
                    : 'text-gray-300 hover:text-white hover:bg-[#0A2D55]/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#031128]' : 'text-gray-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User Profile Dropdown */}
        <div className="relative flex items-center gap-2">
          {/* Active Membership Badge */}
          <button
            onClick={() => setActiveTab('memberships')}
            className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shadow-sm ${
              tierBadge === 'margin-pro'
                ? 'bg-gradient-to-r from-[#031128] to-[#0A2D55] text-[#FFBF00] border-[#FFBF00]'
                : tierBadge === 'margin-plus'
                ? 'bg-[#FFBF00] text-[#031128] border-[#FFE179]'
                : 'bg-slate-700 text-slate-300 border-slate-600'
            }`}
          >
            <Crown className="w-3 h-3" />
            {tierBadge === 'margin-pro'
              ? 'THE MARGIN PRO'
              : tierBadge === 'margin-plus'
              ? 'THE MARGIN+'
              : 'FREE PLAN'}
          </button>

          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 bg-[#0A2D55] hover:bg-[#0A2D55]/80 p-1.5 pr-2.5 rounded-xl border border-[#DDE4EC]/10 transition-all"
          >
            <img
              src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
              alt={currentUser?.name || 'User Avatar'}
              className="w-8 h-8 rounded-lg object-cover border border-[#FFBF00]/50"
            />
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-white leading-tight flex items-center gap-1">
                {currentUser?.name || 'Tipper'}
              </div>
              <div className="text-[10px] text-[#FFBF00] font-mono">
                {currentUser?.totalScore ?? 0} pts
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {/* Profile Menu Dropdown */}
          {showUserDropdown && (
            <div className="absolute right-0 top-12 w-64 bg-[#031128] border border-[#0A2D55] rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-[#0A2D55]">
              <div className="p-3 bg-[#020812]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Signed In Tipper
                </p>
                <div className="flex items-center justify-between mt-1">
                  <div>
                    <span className="text-xs text-white font-bold block">{currentUser?.name || 'Tipper'}</span>
                    <span className="text-[10px] text-gray-400">@{currentUser?.username || 'tipper'}</span>
                  </div>
                </div>
              </div>

              <div className="p-2 space-y-1 bg-[#031128]">
                <button
                  onClick={() => {
                    setActiveTab('profile');
                    setShowUserDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-white hover:bg-[#0A2D55] flex items-center gap-2 transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-[#FFBF00]" />
                  My Profile & Stats
                </button>

                <button
                  onClick={() => {
                    setActiveTab('leagues');
                    setShowUserDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-white hover:bg-[#0A2D55] flex items-center gap-2 transition-colors"
                >
                  <Users className="w-4 h-4 text-[#159B5D]" />
                  My Leagues & Competitions
                </button>
              </div>

              <div className="p-2 bg-[#020812] space-y-1">
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    onOpenRegisterModal();
                  }}
                  className="w-full bg-[#FFBF00] hover:bg-[#FFE179] text-[#031128] font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
                >
                  <UserPlus className="w-4 h-4" />
                  Register New Tipper
                </button>
                {onLogout && (
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onLogout();
                    }}
                    className="w-full bg-red-950/60 hover:bg-red-900 text-red-300 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-red-800/60 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-red-400" />
                    Log Out
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
