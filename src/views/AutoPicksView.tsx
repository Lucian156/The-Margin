/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Zap, ShieldCheck, Settings, History, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useMembership } from '../hooks/useMembership';
import { PremiumFeatureGate } from '../components/PremiumFeatureGate';
import { SEEDED_AUTO_PICK_RECORDS } from '../data/seedData';
import { AutoPickSettings } from '../types';

export const AutoPicksView: React.FC = () => {
  const { user } = useMembership();

  const [settings, setSettings] = useState<AutoPickSettings>(() => ({
    enabled: user.autoPickSettings?.enabled ?? true,
    strategy: user.autoPickSettings?.strategy ?? 'favourite',
    defaultMargin: user.autoPickSettings?.defaultMargin ?? 6,
    notifyOnAutoPick: user.autoPickSettings?.notifyOnAutoPick ?? true,
  }));

  const [records] = useState(SEEDED_AUTO_PICK_RECORDS);
  const [saveToast, setSaveToast] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-white">
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed top-20 right-4 z-50 bg-[#159B5D] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-white/20 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-xs font-bold">Auto Picks strategy updated successfully!</span>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-[#0A2D55] pb-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#FFBF00] text-xs font-bold uppercase tracking-wider mb-1">
            <Zap className="w-4 h-4" />
            AUTOMATED TIPPING PROTECTION
          </div>
          <h1 className="text-3xl font-black text-white">Auto Picks Fallback System</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Never miss a match lockout again. If you forget to submit your tips before kickoff, Auto Picks automatically submits fallback tips based on your preferred strategy.
          </p>
        </div>

        <span className="px-3 py-1 rounded-full bg-[#FFBF00] text-[#031128] font-black text-xs uppercase shadow">
          THE MARGIN+ & PRO FEATURE
        </span>
      </div>

      <PremiumFeatureGate
        requiredTier="margin-plus"
        featureName="Auto Picks Protection"
        upgradeMessage="Never miss a round lockout. Unlock automated fallback tipping with The Margin+."
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Settings Form */}
          <div className="lg:col-span-2 bg-[#031128] border border-[#0A2D55] rounded-2xl p-6 shadow-xl space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-[#0A2D55] pb-3">
              <Settings className="w-5 h-5 text-[#FFBF00]" />
              Auto Picks Configuration
            </h2>

            <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
              {/* Main Toggle */}
              <div className="p-4 bg-[#020812] rounded-xl border border-[#0A2D55] flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-sm">Enable Auto Picks System</div>
                  <div className="text-slate-400 text-xs">
                    Automatically submit fallback predictions 15 minutes before fixture lockout if unsubmitted
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                  className="w-5 h-5 accent-[#FFBF00] cursor-pointer"
                />
              </div>

              {/* Strategy Selector */}
              <div className="space-y-2">
                <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                  Preferred Tipping Strategy
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      id: 'favourite',
                      title: 'Always Pick Home / Favourite',
                      desc: 'Selects the home favourite team with your default margin',
                    },
                    {
                      id: 'home',
                      title: 'Strict Home Team Bias',
                      desc: 'Always selects the hosting venue team',
                    },
                    {
                      id: 'ai-predicted',
                      title: 'AI Predictor Model (Pro)',
                      desc: 'Uses AI model predicted winner and margin',
                    },
                    {
                      id: 'favourite-team-bias',
                      title: 'Warriors Loyalty Bias',
                      desc: 'Always tips Warriors when playing, favourite otherwise',
                    },
                  ].map((strat) => (
                    <button
                      key={strat.id}
                      type="button"
                      onClick={() => setSettings({ ...settings, strategy: strat.id as any })}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        settings.strategy === strat.id
                          ? 'bg-[#0A2D55] border-[#FFBF00] shadow-md'
                          : 'bg-[#020812] border-[#0A2D55] hover:border-slate-600'
                      }`}
                    >
                      <div className="font-bold text-white">{strat.title}</div>
                      <div className="text-[11px] text-slate-400 mt-1">{strat.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Default Margin Selector */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center">
                  <label className="text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                    Default Fallback Margin: <strong className="text-[#FFBF00]">{settings.defaultMargin} pts</strong>
                  </label>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={settings.defaultMargin}
                  onChange={(e) => setSettings({ ...settings, defaultMargin: parseInt(e.target.value) })}
                  className="w-full accent-[#FFBF00]"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>1 pt (Tight match)</span>
                  <span>12 pts (Standard 1-12)</span>
                  <span>30 pts (Blowout)</span>
                </div>
              </div>

              {/* Notification Checkbox */}
              <div className="p-3 bg-[#020812] rounded-xl border border-[#0A2D55] flex items-center justify-between">
                <span className="text-slate-300">Send notification alert whenever Auto Pick triggers</span>
                <input
                  type="checkbox"
                  checked={settings.notifyOnAutoPick}
                  onChange={(e) => setSettings({ ...settings, notifyOnAutoPick: e.target.checked })}
                  className="w-4 h-4 accent-[#FFBF00]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#FFBF00] text-[#031128] font-black text-xs shadow hover:brightness-105"
              >
                Save Auto Pick Preferences
              </button>
            </form>
          </div>

          {/* Sidebar History Log */}
          <div className="bg-[#031128] border border-[#0A2D55] rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-[#0A2D55] pb-3">
              <History className="w-5 h-5 text-[#FFBF00]" />
              Recent Auto-Submitted Log
            </h3>

            <div className="space-y-3">
              {records.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3.5 bg-[#020812] rounded-xl border border-[#0A2D55] text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-bold text-white">
                    <span>{rec.fixtureSummary}</span>
                    <span className="text-[10px] text-[#FFBF00] uppercase">{rec.roundLabel}</span>
                  </div>
                  <div className="text-slate-300">
                    Auto-tipped: <strong className="text-white">{rec.submittedTip}</strong>
                  </div>
                  <div className="text-[10px] text-slate-400 flex justify-between pt-1 border-t border-[#0A2D55]">
                    <span>Strategy: {rec.strategyUsed}</span>
                    <span className="text-[#159B5D] font-bold">Applied: {rec.appliedAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PremiumFeatureGate>
    </div>
  );
};
