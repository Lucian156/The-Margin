/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  Users,
  LineChart,
  BrainCircuit,
  FileText,
  Download,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  Zap,
  ShieldAlert,
  BarChart3,
  Lightbulb,
} from 'lucide-react';
import { PremiumFeatureGate } from '../components/PremiumFeatureGate';
import { SEEDED_AI_PREDICTIONS, SEEDED_COMMUNITY_INSIGHTS } from '../data/seedData';
import { NRL_TEAMS } from '../data/nrlTeams';
import { saveTip } from '../services/storageService';
import { useMembership } from '../hooks/useMembership';

export const AiCentreView: React.FC = () => {
  const { user } = useMembership();
  const [activeTab, setActiveTab] = useState<'predictor' | 'community' | 'comparison' | 'strategy'>('predictor');
  const [appliedToast, setAppliedToast] = useState<string | null>(null);
  const [reportToast, setReportToast] = useState<string | null>(null);

  const nrlTeams = NRL_TEAMS;
  const predictionsList = Object.values(SEEDED_AI_PREDICTIONS);
  const communityInsightsList = Object.values(SEEDED_COMMUNITY_INSIGHTS);

  const handleApplyAiTip = (fixtureId: string, teamId: string, margin: number) => {
    saveTip(user.id, fixtureId, teamId, margin);
    setAppliedToast(`Applied AI Tip: ${teamId} by ${margin} pts`);
    setTimeout(() => setAppliedToast(null), 3000);
  };

  const handleDownloadProReport = () => {
    setReportToast('Comprehensive Pro Strategy Report Round 23 downloaded as PDF (Simulated).');
    setTimeout(() => setReportToast(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-white">
      {/* Toast Notifications */}
      {appliedToast && (
        <div className="fixed top-20 right-4 z-50 bg-[#159B5D] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-white/20 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-xs font-bold">{appliedToast}</span>
        </div>
      )}

      {reportToast && (
        <div className="fixed top-20 right-4 z-50 bg-[#FFBF00] text-[#031128] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 font-bold text-xs border border-white/20 animate-in slide-in-from-top-2">
          <Download className="w-5 h-5" />
          <span>{reportToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-[#0A2D55] pb-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#FFE179] text-xs font-bold uppercase tracking-wider mb-1">
            <Bot className="w-4 h-4" />
            THE MARGIN PRO EXCLUSIVE
          </div>
          <h1 className="text-3xl font-black text-white">AI & Community Intelligence Centre</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Harness machine-learning NRL prediction models, community crowd distributions, and automated round strategy reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadProReport}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FFBF00] to-[#FFE179] text-[#031128] font-extrabold text-xs shadow flex items-center gap-2 hover:brightness-105"
          >
            <Download className="w-4 h-4" />
            Download Pro Strategy Report (PDF)
          </button>
        </div>
      </div>

      {/* Mandatory Prototype Disclaimer */}
      <div className="p-3 bg-[#020812] border border-[#0A2D55] rounded-xl text-xs text-slate-400 flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-[#FFBF00] shrink-0" />
        <span>
          <strong>Prototype Disclaimer:</strong> Prototype AI insight and community distribution model data only. Not betting advice or financial recommendations.
        </span>
      </div>

      <PremiumFeatureGate
        requiredTier="margin-pro"
        featureName="AI Predictor & Community Insights"
        upgradeMessage="Unlock machine-learning prediction models, crowd distributions, and downloadable strategy reports with The Margin Pro."
      >
        <div className="space-y-6">
          {/* Sub Navigation */}
          <div className="bg-[#031128] border border-[#0A2D55] rounded-xl p-1.5 flex flex-wrap gap-1 shadow">
            {[
              { id: 'predictor', label: 'AI Predictor Model', icon: BrainCircuit },
              { id: 'community', label: 'Community Pick Insights', icon: Users },
              { id: 'comparison', label: 'AI vs Community Comparison', icon: BarChart3 },
              { id: 'strategy', label: 'Round Strategy & Personalised', icon: Lightbulb },
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

          {/* TAB 1: AI PREDICTOR */}
          {activeTab === 'predictor' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {predictionsList.map((p) => {
                const winnerTeam = nrlTeams.find((t) => t.id === p.predictedWinnerTeamId) || {
                  name: p.predictedWinnerTeamId,
                  primaryColor: '#0A2D55',
                };
                return (
                  <div
                    key={p.fixtureId}
                    className="bg-[#031128] border border-[#0A2D55] rounded-2xl p-5 shadow-xl space-y-4 hover:border-[#FFBF00]/40 transition-colors"
                  >
                    <div className="flex items-center justify-between border-b border-[#0A2D55] pb-3">
                      <span className="text-xs font-bold text-white uppercase">Fixture ID: {p.fixtureId}</span>
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-[#FFBF00]/20 text-[#FFBF00] border border-[#FFBF00]/40">
                        {p.confidenceScore}% CONFIDENCE
                      </span>
                    </div>

                    <div className="p-3 bg-[#020812] rounded-xl border border-[#0A2D55] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">AI Model Prediction:</span>
                        <span className="font-extrabold text-[#FFBF00]">
                          {winnerTeam.name} by {p.predictedMargin} pts
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Win Probability:</span>
                        <span className="font-mono font-bold text-white">{p.confidenceScore}%</span>
                      </div>

                      <div className="text-[11px] text-slate-300 pt-1 border-t border-[#0A2D55]/60">
                        <span className="text-[#FFBF00] font-bold">Key Insight: </span>
                        {p.reasoningSummary}
                      </div>
                    </div>

                    <button
                      onClick={() => handleApplyAiTip(p.fixtureId, p.predictedWinnerTeamId, p.predictedMargin)}
                      className="w-full py-2.5 rounded-xl bg-[#0A2D55] hover:bg-[#FFBF00] hover:text-[#031128] text-white font-bold text-xs transition-all flex items-center justify-center gap-2 border border-slate-700 shadow"
                    >
                      <Zap className="w-3.5 h-3.5 text-[#FFBF00]" />
                      Apply AI Tip To My Round Tips
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: COMMUNITY INSIGHTS */}
          {activeTab === 'community' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {communityInsightsList.map((c) => (
                <div key={c.fixtureId} className="bg-[#031128] border border-[#0A2D55] rounded-2xl p-5 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-[#0A2D55] pb-3">
                    <span className="text-xs font-bold text-white uppercase">Fixture ID: {c.fixtureId}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Community Pick</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-white">
                      <span>Home Pick: {c.homeTeamPercentage}%</span>
                      <span>Away Pick: {c.awayTeamPercentage}%</span>
                    </div>

                    <div className="w-full bg-[#020812] h-3 rounded-full overflow-hidden flex border border-[#0A2D55]">
                      <div
                        className="bg-[#FFBF00] h-full"
                        style={{ width: `${c.homeTeamPercentage}%` }}
                      />
                      <div
                        className="bg-slate-600 h-full"
                        style={{ width: `${c.awayTeamPercentage}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-300 pt-2">
                      <span>Range: <strong className="text-[#FFBF00]">{c.mostCommonMarginRange}</strong></span>
                      <span>Avg Margin: <strong className="text-white">{c.communityAverageMargin} pts</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: COMPARISON */}
          {activeTab === 'comparison' && (
            <div className="bg-[#031128] border border-[#0A2D55] rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white">AI Model vs Community Consensus Matrix</h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-[#0A2D55] text-xs font-bold uppercase text-slate-400">
                      <th className="py-2.5 px-3">Fixture</th>
                      <th className="py-2.5 px-3 text-center text-[#FFBF00]">AI Prediction</th>
                      <th className="py-2.5 px-3 text-center text-slate-300">Community Avg Margin</th>
                      <th className="py-2.5 px-3 text-center">Variance Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0A2D55] text-xs">
                    {predictionsList.map((p) => {
                      const comm = communityInsightsList.find((c) => c.fixtureId === p.fixtureId);
                      const isMatch = comm ? Math.abs(p.predictedMargin - comm.communityAverageMargin) < 3 : true;
                      return (
                        <tr key={p.fixtureId} className="hover:bg-[#0A2D55]/30">
                          <td className="py-3 px-3 font-bold text-white">{p.fixtureId}</td>
                          <td className="py-3 px-3 text-center font-bold text-[#FFBF00]">
                            {p.predictedWinnerTeamId} by {p.predictedMargin}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-slate-200">
                            Avg {comm?.communityAverageMargin ?? '-'} pts
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isMatch ? 'bg-[#159B5D]/20 text-[#159B5D]' : 'bg-rose-500/20 text-rose-400'
                              }`}
                            >
                              {isMatch ? 'ALIGNED' : 'HIGH VARIANCE'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: STRATEGY & PERSONALISED */}
          {activeTab === 'strategy' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#031128] border border-[#0A2D55] rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-[#FFBF00]" />
                  Round 23 Pro Strategy Guidance
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Focus on lowering margin errors rather than risky upset calls this round. The 3 high-confidence fixtures offer safe 6-8 point margin windows.
                </p>
              </div>

              <div className="bg-[#031128] border border-[#0A2D55] rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-[#FFE179]" />
                  Personalised Tipper Feedback for @{user.username}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Analysis indicates you overpredict Warriors margin by an average of +5.2 points when playing at home. Consider adjusting to a 6-10 margin range for better scoring accuracy.
                </p>
              </div>
            </div>
          )}
        </div>
      </PremiumFeatureGate>
    </div>
  );
};
