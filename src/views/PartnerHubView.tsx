/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Gift, Building2, LineChart, Trophy, ExternalLink, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

export const PartnerHubView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ccr' | 'prizes' | 'investor'>('ccr');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-white">
      {/* Header */}
      <div className="border-b border-[#0A2D55] pb-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#FFBF00] text-xs font-bold uppercase tracking-wider mb-1">
            <Gift className="w-4 h-4" />
            PARTNERS, SPONSORS & PRIZES
          </div>
          <h1 className="text-3xl font-black text-white">Cross Country Rentals Partner Hub</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Discover our major sponsor Cross Country Rentals (CCR), explore the $10,000 Prize Pool structure, and review platform competition metrics.
          </p>
        </div>

        <span className="bg-[#0A2D55] text-[#FFBF00] border border-[#FFBF00]/40 px-3 py-1 rounded-full text-xs font-extrabold uppercase shadow">
          MAJOR SPONSOR: CCR
        </span>
      </div>

      {/* Tabs */}
      <div className="bg-[#031128] border border-[#0A2D55] rounded-xl p-1.5 flex flex-wrap gap-1 shadow">
        {[
          { id: 'ccr', label: 'Cross Country Rentals Hub', icon: Building2 },
          { id: 'prizes', label: 'Prize Pool & Rewards', icon: Gift },
          { id: 'investor', label: 'Competition Metrics', icon: LineChart },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
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

      {/* TAB 1: CCR HUB */}
      {activeTab === 'ccr' && (
        <div className="space-y-6">
          <div className="relative rounded-2xl bg-gradient-to-br from-[#0A2D55] via-[#031128] to-[#020812] border border-[#FFBF00]/40 p-8 shadow-2xl text-white space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <span className="px-3 py-1 rounded-full bg-[#FFBF00] text-[#031128] font-black text-[10px] uppercase tracking-wider">
                  OFFICIAL PLATFORM PARTNER
                </span>
                <h2 className="text-3xl font-black text-white">Cross Country Rentals (CCR)</h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Cross Country Rentals is New Zealand’s leading vehicle rental and corporate fleet transport provider. Proud major sponsor of The Margin NRL Tipping Competition.
                </p>
              </div>

              <div className="w-44 h-24 rounded-2xl bg-white/10 border border-white/20 flex flex-col items-center justify-center p-4 text-center">
                <span className="font-black text-2xl tracking-widest text-[#FFBF00]">CCR</span>
                <span className="text-[9px] text-slate-300 uppercase font-bold tracking-wider">Cross Country Rentals</span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#0A2D55] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-[#020812] rounded-xl border border-[#0A2D55]">
                <div className="font-bold text-[#FFBF00]">Corporate Workplace League</div>
                <div className="text-slate-300 mt-0.5">Custom private leagues for corporate teams with CCR brand styling</div>
              </div>
              <div className="p-3 bg-[#020812] rounded-xl border border-[#0A2D55]">
                <div className="font-bold text-[#FFBF00]">Exclusive Fleet Discounts</div>
                <div className="text-slate-300 mt-0.5">Special vehicle rental voucher codes for The Margin+ & Pro tippers</div>
              </div>
              <div className="p-3 bg-[#020812] rounded-xl border border-[#0A2D55]">
                <div className="font-bold text-[#FFBF00]">Major Sponsor Shield</div>
                <div className="text-slate-300 mt-0.5">CCR Work League trophy awarded to top workplace tipper each season</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRIZE POOL */}
      {activeTab === 'prizes' && (
        <div className="bg-[#031128] border border-[#0A2D55] rounded-2xl p-6 shadow-xl space-y-6">
          <div className="border-b border-[#0A2D55] pb-4">
            <h2 className="text-xl font-extrabold text-white">The Margin $10,000 Prize Pool Concept</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Illustrative prize structure for competitive season end and weekly round winners
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-[#020812] border border-[#FFBF00] rounded-2xl space-y-2 text-center shadow-lg">
              <Trophy className="w-8 h-8 text-[#FFBF00] mx-auto" />
              <div className="text-xs font-bold uppercase text-slate-400">Overall Champion</div>
              <div className="text-3xl font-black text-[#FFBF00]">$5,000 Cash</div>
              <div className="text-[10px] text-slate-400">+ Official CCR Champion Trophy</div>
            </div>

            <div className="p-5 bg-[#020812] border border-[#0A2D55] rounded-2xl space-y-2 text-center shadow">
              <Trophy className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="text-xs font-bold uppercase text-slate-400">2nd & 3rd Place</div>
              <div className="text-2xl font-black text-white">$2,000 / $1,000</div>
              <div className="text-[10px] text-slate-400">Runner-Up Cash Awards</div>
            </div>

            <div className="p-5 bg-[#020812] border border-[#0A2D55] rounded-2xl space-y-2 text-center shadow">
              <Gift className="w-8 h-8 text-[#FFE179] mx-auto" />
              <div className="text-xs font-bold uppercase text-slate-400">Weekly Round Winners</div>
              <div className="text-2xl font-black text-[#FFE179]">$100 Voucher / Rd</div>
              <div className="text-[10px] text-slate-400">Lowest round margin score award</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INVESTOR OVERVIEW */}
      {activeTab === 'investor' && (
        <div className="bg-[#031128] border border-[#0A2D55] rounded-2xl p-6 shadow-xl space-y-6">
          <div className="border-b border-[#0A2D55] pb-4">
            <h2 className="text-xl font-extrabold text-white">Platform Growth & Investor Highlights</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              The Margin commercial engine and subscription monetization roadmap
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-4 bg-[#020812] rounded-xl border border-[#0A2D55]">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Active Tippers</div>
              <div className="text-2xl font-black text-[#FFBF00]">12,450</div>
            </div>
            <div className="p-4 bg-[#020812] rounded-xl border border-[#0A2D55]">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Paid Conversion</div>
              <div className="text-2xl font-black text-[#159B5D]">18.4%</div>
            </div>
            <div className="p-4 bg-[#020812] rounded-xl border border-[#0A2D55]">
              <div className="text-[10px] text-slate-400 uppercase font-bold">ARPU (Annual)</div>
              <div className="text-2xl font-black text-white">$38.50</div>
            </div>
            <div className="p-4 bg-[#020812] rounded-xl border border-[#0A2D55]">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Private Leagues</div>
              <div className="text-2xl font-black text-[#FFE179]">1,840</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
