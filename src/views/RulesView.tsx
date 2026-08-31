/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Trophy, CheckCircle2, Play, ShieldCheck, AlertTriangle, Sparkles, Clock, HelpCircle } from 'lucide-react';
import { LiveMarginCalculator } from '../components/LiveMarginCalculator';
import { runScoringUnitTests } from '../utils/scoring';
import { UnitTestResult } from '../types';

export const RulesView: React.FC = () => {
  const [testResults, setTestResults] = useState<UnitTestResult[]>(() => runScoringUnitTests());

  const handleRunTests = () => {
    setTestResults(runScoringUnitTests());
  };

  const allPassed = testResults.every((t) => t.passed);

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-fadeIn max-w-5xl mx-auto">
      {/* Banner */}
      <div className="bg-[#031128] text-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-[#0A2D55] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="bg-[#FFBF00] text-[#031128] font-black text-[10px] px-2.5 py-0.5 rounded uppercase tracking-wider">
              Official Scoring Rules
            </span>
            <span className="text-xs text-[#FFE179] font-semibold">Lowest Total Score Wins</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase text-white font-sans">
            How The Margin Works
          </h1>
          <p className="text-gray-300 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
            Unlike standard tipping, The Margin rewards accuracy. Predict the winning team and exact margin difference to keep your score as low as possible.
          </p>
        </div>

        <button
          onClick={handleRunTests}
          className="bg-[#159B5D] hover:bg-[#159B5D]/90 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shrink-0 self-start sm:self-auto w-full sm:w-auto"
        >
          <Play className="w-4 h-4" /> Verify Scoring System
        </button>
      </div>

      {/* 3 Core Rules Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Rule 1 */}
        <div className="bg-white p-5 rounded-2xl border border-[#DDE4EC] shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFBF00] text-[#031128] font-black text-lg flex items-center justify-center shadow">
                0
              </div>
              <span className="bg-[#FFBF00]/10 text-[#031128] text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                Best Score
              </span>
            </div>
            <h3 className="font-black text-[#111D31] text-base uppercase flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#FFBF00]" /> Perfect Prediction
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed mt-1.5">
              Predict both the winning team and the exact margin difference. You score <strong>0 points</strong> for a perfect pick!
            </p>
          </div>
          <div className="bg-[#FEF9E7] p-2.5 rounded-xl border border-[#FFBF00]/30 text-[11px] font-medium text-[#7A5B00]">
            Example: You tip Warriors by 10, Warriors win by 10 → <strong>0 pts</strong>
          </div>
        </div>

        {/* Rule 2 */}
        <div className="bg-white p-5 rounded-2xl border border-[#DDE4EC] shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#0A2D55] text-white font-black text-lg flex items-center justify-center shadow">
                ✓
              </div>
              <span className="bg-[#0A2D55]/10 text-[#0A2D55] text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                0 Penalty
              </span>
            </div>
            <h3 className="font-black text-[#111D31] text-base uppercase flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#159B5D]" /> Correct Winner
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed mt-1.5">
              Your score is simply how many points off your margin guess was from the actual game margin. No penalty added!
            </p>
          </div>
          <div className="bg-[#EEF2F6] p-2.5 rounded-xl border border-[#DDE4EC] text-[11px] font-medium text-[#0A2D55]">
            Example: You tip Warriors by 12, Warriors win by 8 → <strong>4 pts</strong>
          </div>
        </div>

        {/* Rule 3 */}
        <div className="bg-white p-5 rounded-2xl border border-[#DDE4EC] shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#DF4351] text-white font-black text-lg flex items-center justify-center shadow">
                +5
              </div>
              <span className="bg-[#DF4351]/10 text-[#DF4351] text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                Penalty
              </span>
            </div>
            <h3 className="font-black text-[#111D31] text-base uppercase flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-[#DF4351]" /> Wrong Winner Penalty
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed mt-1.5">
              If your chosen team loses, your score is the margin difference plus a <strong>5-point penalty</strong>.
            </p>
          </div>
          <div className="bg-red-50 p-2.5 rounded-xl border border-red-200 text-[11px] font-medium text-red-800">
            Example: You tip Warriors by 6, Panthers win by 4 → 10 diff + 5 penalty = <strong>15 pts</strong>
          </div>
        </div>
      </div>

      {/* Additional Rules & Policy Mobile Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-[#DDE4EC] shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-[#031128]">
            <Clock className="w-5 h-5 text-[#FFBF00]" />
            <h3 className="font-extrabold text-sm uppercase">Lockout & Auto-Picks</h3>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Tips lock individually at kickoff time for each match. If you forget to submit a tip before lockout, our system automatically assigns you the <strong>Home Team with a default 6-point margin</strong>.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#DDE4EC] shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-[#031128]">
            <Trophy className="w-5 h-5 text-[#159B5D]" />
            <h3 className="font-extrabold text-sm uppercase">Leaderboards & Competitions</h3>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Compete in the <strong>Overall League</strong> or launch custom <strong>Head-to-Head Duels</strong> with mates. Lower round totals move you up the ladder!
          </p>
        </div>
      </div>

      {/* Interactive Live Sandbox */}
      <LiveMarginCalculator />

      {/* Automated Unit Tests Verification Box */}
      <div className="bg-white rounded-2xl border border-[#DDE4EC] p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#DDE4EC] pb-4 gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#031128] uppercase flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#159B5D]" /> Automated Scoring Verification
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Live checks verifying accuracy across all prediction scenarios.
            </p>
          </div>

          <span
            className={`text-xs font-bold px-3 py-1 rounded-full self-start sm:self-auto ${
              allPassed ? 'bg-[#159B5D]/10 text-[#159B5D] border border-[#159B5D]/30' : 'bg-red-50 text-red-600'
            }`}
          >
            {allPassed ? '✓ ALL TESTS PASSED' : 'TESTS FAILING'}
          </span>
        </div>

        <div className="space-y-2.5">
          {testResults.map((test) => (
            <div
              key={test.id}
              className="p-3.5 rounded-xl border border-[#DDE4EC] bg-[#EEF2F6] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#159B5D] shrink-0" />
                  <span className="font-black text-[#111D31] uppercase">{test.testName}</span>
                </div>
                <p className="text-gray-600 text-[11px] mt-0.5">{test.description}</p>
              </div>

              <div className="text-left sm:text-right shrink-0 bg-white px-3 py-1.5 rounded-lg border border-[#DDE4EC] self-start sm:self-auto">
                <p className="text-[10px] text-gray-500 font-medium">Expected: {test.expectedScore} pts</p>
                <p className="text-xs font-black font-mono text-[#159B5D]">
                  Calculated: {test.actualScore} pts ✓
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

