/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  Swords,
  UserPlus,
  Copy,
  Share2,
  Check,
  Sparkles,
  PlusCircle,
  LogIn,
} from 'lucide-react';

interface InviteQuickActionsProps {
  onOpenCreateLeague?: (type: 'overall' | 'h2h') => void;
  onOpenJoinLeague?: () => void;
  defaultInviteCode?: string;
}

export const InviteQuickActions: React.FC<InviteQuickActionsProps> = ({
  onOpenCreateLeague,
  onOpenJoinLeague,
  defaultInviteCode = 'Lucian2026',
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showInviteToast, setShowInviteToast] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(defaultInviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleShareLink = () => {
    const url = `${window.location.origin}?invite=${defaultInviteCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setShowInviteToast(true);
    setTimeout(() => {
      setCopiedLink(false);
      setShowInviteToast(false);
    }, 2500);
  };

  return (
    <div className="bg-[#031128] text-white rounded-2xl p-5 border border-[#0A2D55] shadow-lg space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#0A2D55] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#FFBF00] text-[#031128] flex items-center justify-center font-black">
            <UserPlus className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-white uppercase tracking-wider">
              Quick League & Friend Invites
            </h3>
            <p className="text-gray-400 text-xs">
              Challenge mates in Head-to-Head or private Overall leagues!
            </p>
          </div>
        </div>

        <div className="bg-[#020812] px-3 py-1 rounded-lg border border-[#0A2D55] text-xs flex items-center gap-2">
          <span className="text-gray-400 font-mono">Default Code:</span>
          <span className="font-extrabold text-[#FFBF00] font-mono tracking-wider">{defaultInviteCode}</span>
        </div>
      </div>

      {/* Buttons Grid */}
      <div className="flex sm:grid overflow-x-auto scrollbar-none gap-2 pb-1 sm:grid-cols-4 lg:grid-cols-7">
        {/* CREATE OVERALL LEAGUE */}
        <button
          onClick={() => onOpenCreateLeague && onOpenCreateLeague('overall')}
          className="shrink-0 min-w-[105px] sm:min-w-0 bg-[#0A2D55] hover:bg-[#103B6B] text-white p-2.5 rounded-xl border border-[#0A2D55] hover:border-[#FFBF00]/40 flex flex-col items-center justify-center text-center gap-1 transition-all group"
        >
          <PlusCircle className="w-4 h-4 text-[#FFBF00] group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-tight">Create Overall</span>
        </button>

        {/* JOIN OVERALL LEAGUE */}
        <button
          onClick={onOpenJoinLeague}
          className="shrink-0 min-w-[105px] sm:min-w-0 bg-[#0A2D55] hover:bg-[#103B6B] text-white p-2.5 rounded-xl border border-[#0A2D55] hover:border-[#FFBF00]/40 flex flex-col items-center justify-center text-center gap-1 transition-all group"
        >
          <LogIn className="w-4 h-4 text-[#159B5D] group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-tight">Join Overall</span>
        </button>

        {/* CREATE HEAD-TO-HEAD LEAGUE */}
        <button
          onClick={() => onOpenCreateLeague && onOpenCreateLeague('h2h')}
          className="shrink-0 min-w-[105px] sm:min-w-0 bg-[#0A2D55] hover:bg-[#103B6B] text-white p-2.5 rounded-xl border border-[#0A2D55] hover:border-[#FFBF00]/40 flex flex-col items-center justify-center text-center gap-1 transition-all group"
        >
          <Swords className="w-4 h-4 text-[#DF4351] group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-tight">Create H2H</span>
        </button>

        {/* JOIN HEAD-TO-HEAD LEAGUE */}
        <button
          onClick={onOpenJoinLeague}
          className="shrink-0 min-w-[105px] sm:min-w-0 bg-[#0A2D55] hover:bg-[#103B6B] text-white p-2.5 rounded-xl border border-[#0A2D55] hover:border-[#FFBF00]/40 flex flex-col items-center justify-center text-center gap-1 transition-all group"
        >
          <Users className="w-4 h-4 text-[#FFBF00] group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-tight">Join H2H</span>
        </button>

        {/* INVITE FRIENDS */}
        <button
          onClick={handleShareLink}
          className="shrink-0 min-w-[105px] sm:min-w-0 bg-[#0A2D55] hover:bg-[#103B6B] text-white p-2.5 rounded-xl border border-[#0A2D55] hover:border-[#FFBF00]/40 flex flex-col items-center justify-center text-center gap-1 transition-all group"
        >
          <UserPlus className="w-4 h-4 text-[#FFE179] group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-tight">Invite Friends</span>
        </button>

        {/* COPY INVITE CODE */}
        <button
          onClick={handleCopyCode}
          className="shrink-0 min-w-[105px] sm:min-w-0 bg-[#0A2D55] hover:bg-[#103B6B] text-white p-2.5 rounded-xl border border-[#0A2D55] hover:border-[#FFBF00]/40 flex flex-col items-center justify-center text-center gap-1 transition-all group"
        >
          {copiedCode ? (
            <Check className="w-4 h-4 text-[#159B5D]" />
          ) : (
            <Copy className="w-4 h-4 text-gray-300 group-hover:text-white" />
          )}
          <span className="text-[10px] font-black uppercase tracking-tight">
            {copiedCode ? 'Code Copied!' : 'Copy Code'}
          </span>
        </button>

        {/* SHARE LEAGUE LINK */}
        <button
          onClick={handleShareLink}
          className="shrink-0 min-w-[105px] sm:min-w-0 bg-[#FFBF00] hover:bg-[#FFE179] text-[#031128] p-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider flex flex-col items-center justify-center text-center gap-1 transition-transform hover:scale-105 shadow"
        >
          <Share2 className="w-4 h-4" />
          <span>{copiedLink ? 'Link Copied!' : 'Share Link'}</span>
        </button>
      </div>

      {showInviteToast && (
        <div className="bg-[#159B5D] text-white text-xs px-3 py-2 rounded-xl flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 shrink-0" />
          <span>Invite link copied to clipboard! Send to your mates to compete.</span>
        </div>
      )}
    </div>
  );
};
