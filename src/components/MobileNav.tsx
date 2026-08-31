/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Home as HomeIcon,
  Trophy,
  Activity,
  Swords,
  User as UserIcon,
  MoreHorizontal,
  Crown,
  Sparkles,
  Bot,
  Zap,
  Gift,
  Building2,
  Bell,
  BookOpen,
  LineChart,
  Settings,
  X,
  ChevronRight,
} from 'lucide-react';

import type { User as UserType } from '../types';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser?: UserType;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab, currentUser }) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const mainItems = [
    { id: 'home', label: 'Home', icon: HomeIcon },
    { id: 'tips', label: 'Tips', icon: Trophy },
    { id: 'live', label: 'Live', icon: Activity },
    { id: 'duels', label: 'Duels', icon: Swords },
    { id: 'more', label: 'More', icon: MoreHorizontal },
  ];

  const moreItems = [
    { id: 'memberships', label: 'Memberships', icon: Crown, badge: 'Plans' },
    { id: 'memberships-compare', label: 'Compare Plans', icon: Sparkles },
    { id: 'ai-centre', label: 'AI Centre', icon: Bot, badge: 'PRO' },
    { id: 'auto-picks', label: 'Auto Picks', icon: Zap, badge: 'PLUS' },
    { id: 'partner-hub', label: 'Prizes & Major Sponsor', icon: Gift, badge: 'CCR' },
    { id: 'leagues', label: 'Leagues & Duels', icon: Building2 },
    { id: 'rules', label: 'Official Rules', icon: BookOpen },
    ...(currentUser?.isAdmin ? [{ id: 'admin', label: 'Simulation Console', icon: Settings }] : []),
  ];

  const handleTabClick = (id: string) => {
    if (id === 'more') {
      setShowMoreMenu(true);
    } else {
      setActiveTab(id);
      setShowMoreMenu(false);
    }
  };

  const handleMoreItemClick = (id: string) => {
    if (id === 'memberships-compare') {
      setActiveTab('memberships');
    } else {
      setActiveTab(id);
    }
    setShowMoreMenu(false);
  };

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#031128] border-t border-[#0A2D55] z-40 px-2 py-1.5 shadow-2xl">
        <div className="grid grid-cols-5 gap-1">
          {mainItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || (item.id === 'more' && showMoreMenu);
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`flex flex-col items-center justify-center py-1 rounded-lg transition-colors ${
                  isActive ? 'bg-[#0A2D55] text-[#FFBF00]' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* More Drawer Modal */}
      {showMoreMenu && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col justify-end">
          <div
            className="bg-[#031128] border-t border-[#0A2D55] rounded-t-2xl p-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#0A2D55] mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#FFBF00] text-[#031128] font-black flex items-center justify-center text-sm">
                  M
                </div>
                <span className="font-extrabold text-white text-base uppercase tracking-wider">
                  THE <span className="text-[#FFBF00]">MARGIN</span> MENU
                </span>
              </div>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-1 rounded-lg bg-[#0A2D55] text-gray-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {moreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMoreItemClick(item.id)}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#020812]/80 border border-[#0A2D55] hover:border-[#FFBF00]/50 text-left transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#0A2D55] flex items-center justify-center text-[#FFBF00]">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-white">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#FFBF00] text-[#031128]">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
