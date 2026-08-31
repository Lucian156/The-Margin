/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Trophy, CheckCircle2, AlertTriangle, Sparkles, ArrowRight, ShieldCheck, X } from 'lucide-react';

interface RulesSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

export const RulesSummaryModal: React.FC<RulesSummaryModalProps> = ({ isOpen, onClose, userName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020812]/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#031128] text-white border border-[#0A2D55] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#FFBF00]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white bg-[#0A2D55] p-2 rounded-xl transition-colors"
          aria-label="Close rules modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="border-b border-[#0A2D55] pb-4 mb-5 pr-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#FFBF00] text-[#031128] font-black text-[10px] px-2.5 py-0.5 rounded uppercase tracking-wider">
              Quick Start Guide
            </span>
            <span className="text-xs text-[#FFE179] font-semibold">Lowest Score Wins</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-[#FFBF00]" />
            {userName ? `Welcome, ${userName}!` : 'How The Margin Works'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 mt-1">
            Here are the 3 golden rules you need to know before locking in your picks.
          </p>
        </div>

        {/* Content Body - Scrollable */}
        <div className="space-y-3.5 overflow-y-auto pr-1 flex-1 text-xs sm:text-sm">
          {/* Rule 1: Perfect Prediction */}
          <div className="bg-[#0A2D55]/60 border border-[#FFBF00]/30 p-3.5 sm:p-4 rounded-2xl flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#FFBF00] text-[#031128] font-black flex items-center justify-center shrink-0 text-sm shadow">
              0
            </div>
            <div>
              <h3 className="font-extrabold text-[#FFBF00] uppercase text-xs sm:text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Perfect Prediction = 0 Points
              </h3>
              <p className="text-gray-200 text-xs mt-0.5 leading-relaxed">
                Pick both the correct winner and the exact winning margin to score <strong>0 points</strong>. Remember, the lowest total score wins!
              </p>
            </div>
          </div>

          {/* Rule 2: Correct Winner */}
          <div className="bg-[#020812] border border-[#0A2D55] p-3.5 sm:p-4 rounded-2xl flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#159B5D] text-white font-black flex items-center justify-center shrink-0 text-sm shadow">
              ✓
            </div>
            <div>
              <h3 className="font-extrabold text-white uppercase text-xs sm:text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#159B5D]" /> Correct Winner
              </h3>
              <p className="text-gray-300 text-xs mt-0.5 leading-relaxed">
                If your chosen team wins, your game score is simply how far off your margin guess was from the actual winning margin. Zero penalty is added!
              </p>
            </div>
          </div>

          {/* Rule 3: Wrong Winner */}
          <div className="bg-[#020812] border border-[#0A2D55] p-3.5 sm:p-4 rounded-2xl flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#DF4351] text-white font-black flex items-center justify-center shrink-0 text-sm shadow">
              +5
            </div>
            <div>
              <h3 className="font-extrabold text-white uppercase text-xs sm:text-sm flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-[#DF4351]" /> Wrong Winner Penalty
              </h3>
              <p className="text-gray-300 text-xs mt-0.5 leading-relaxed">
                If your chosen team loses, your game score is your margin difference PLUS a <strong>5-point wrong winner penalty</strong>.
              </p>
            </div>
          </div>

          {/* Auto Leagues Note */}
          <div className="bg-[#020812] border border-[#0A2D55] p-3 rounded-xl flex items-center gap-2.5 text-xs text-gray-400">
            <ShieldCheck className="w-5 h-5 text-[#FFBF00] shrink-0" />
            <span>
              You've automatically joined <strong>R24 BETA Overall</strong> & <strong>R24 BETA Head to Head</strong> with invite code <strong className="text-[#FFBF00] font-mono">Lucian2026</strong>.
            </span>
          </div>
        </div>

        {/* Footer Button */}
        <div className="pt-4 mt-3 border-t border-[#0A2D55]">
          <button
            onClick={onClose}
            className="w-full bg-[#FFBF00] hover:bg-[#FFE179] text-[#031128] font-black text-sm uppercase tracking-wider py-3.5 rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <span>Got It! Let's Tip</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
