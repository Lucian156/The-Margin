/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Calculator, Sparkles, CheckCircle, AlertOctagon } from 'lucide-react';
import { calculateGameScore } from '../utils/scoring';

export const LiveMarginCalculator: React.FC = () => {
  const [predictedTeam, setPredictedTeam] = useState<'WARRIORS' | 'PANTHERS'>('WARRIORS');
  const [predictedMargin, setPredictedMargin] = useState<number>(10);

  const [actualTeam, setActualTeam] = useState<'WARRIORS' | 'PANTHERS'>('PANTHERS');
  const [actualMargin, setActualMargin] = useState<number>(6);

  const res = calculateGameScore(predictedTeam, predictedMargin, actualTeam, actualMargin);

  return (
    <div className="bg-white rounded-2xl border border-[#DDE4EC] p-5 sm:p-6 shadow-md space-y-6">
      <div className="flex items-center gap-3 border-b border-[#DDE4EC] pb-4">
        <div className="w-10 h-10 rounded-xl bg-[#031128] text-[#FFBF00] flex items-center justify-center shadow">
          <Calculator className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-black text-[#111D31] uppercase tracking-wide">
            Interactive Margin Calculator
          </h3>
          <p className="text-xs text-[#718095]">
            Test any prediction scenario to see how Game Scores are computed.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Prediction Sandbox Controls */}
        <div className="bg-[#EEF2F6] p-4 rounded-xl border border-[#DDE4EC] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0A2D55] uppercase tracking-wider">
              1. Your Tip Prediction
            </span>
            <span className="text-xs bg-[#0A2D55] text-white font-bold px-2 py-0.5 rounded">
              {predictedTeam === 'WARRIORS' ? 'Warriors' : 'Panthers'} by {predictedMargin}
            </span>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-600 block mb-1">Select Predicted Winner</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPredictedTeam('WARRIORS')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                  predictedTeam === 'WARRIORS'
                    ? 'bg-[#031128] text-[#FFBF00] border-[#031128] shadow'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                NZ Warriors
              </button>
              <button
                type="button"
                onClick={() => setPredictedTeam('PANTHERS')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                  predictedTeam === 'PANTHERS'
                    ? 'bg-[#031128] text-[#FFBF00] border-[#031128] shadow'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Penrith Panthers
              </button>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-bold text-gray-600">Predicted Winning Margin</label>
              <span className="text-xs font-mono font-bold text-[#031128]">{predictedMargin} points</span>
            </div>
            <input
              type="range"
              min={1}
              max={40}
              value={predictedMargin}
              onChange={(e) => setPredictedMargin(Number(e.target.value))}
              className="w-full accent-[#FFBF00] cursor-pointer"
            />
          </div>
        </div>

        {/* Actual Outcome Sandbox Controls */}
        <div className="bg-[#EEF2F6] p-4 rounded-xl border border-[#DDE4EC] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0A2D55] uppercase tracking-wider">
              2. Actual Match Result
            </span>
            <span className="text-xs bg-[#159B5D] text-white font-bold px-2 py-0.5 rounded">
              {actualTeam === 'WARRIORS' ? 'Warriors' : 'Panthers'} by {actualMargin}
            </span>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-600 block mb-1">Select Actual Winner</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActualTeam('WARRIORS')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                  actualTeam === 'WARRIORS'
                    ? 'bg-[#031128] text-[#FFBF00] border-[#031128] shadow'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                NZ Warriors
              </button>
              <button
                type="button"
                onClick={() => setActualTeam('PANTHERS')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                  actualTeam === 'PANTHERS'
                    ? 'bg-[#031128] text-[#FFBF00] border-[#031128] shadow'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Penrith Panthers
              </button>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-bold text-gray-600">Actual Winning Margin</label>
              <span className="text-xs font-mono font-bold text-[#031128]">{actualMargin} points</span>
            </div>
            <input
              type="range"
              min={1}
              max={40}
              value={actualMargin}
              onChange={(e) => setActualMargin(Number(e.target.value))}
              className="w-full accent-[#159B5D] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Dynamic Results Display */}
      <div className="bg-[#031128] text-white p-5 rounded-2xl border border-[#0A2D55] space-y-3">
        <div className="flex items-center justify-between border-b border-[#0A2D55] pb-3">
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
            Calculation Result
          </span>
          {res.isPerfectPrediction ? (
            <span className="bg-[#FFBF00] text-[#031128] text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Perfect Prediction (0 Pts)
            </span>
          ) : res.isCorrectWinner ? (
            <span className="bg-[#159B5D]/20 text-[#159B5D] border border-[#159B5D]/40 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Correct Winner (0 Penalty)
            </span>
          ) : (
            <span className="bg-[#DF4351]/20 text-[#DF4351] border border-[#DF4351]/40 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <AlertOctagon className="w-3.5 h-3.5" /> Wrong Winner (+5 Penalty)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          <div className="bg-[#020812] p-3 rounded-xl border border-[#0A2D55]">
            <p className="text-[10px] text-gray-400 font-bold uppercase">Margin Difference</p>
            <p className="text-lg font-black text-white font-mono mt-0.5">
              {res.marginDifference} {res.marginDifference === 1 ? 'pt' : 'pts'}
            </p>
          </div>

          <div className="bg-[#020812] p-3 rounded-xl border border-[#0A2D55]">
            <p className="text-[10px] text-gray-400 font-bold uppercase">Wrong-Winner Penalty</p>
            <p className={`text-lg font-black font-mono mt-0.5 ${res.penaltyApplied > 0 ? 'text-[#DF4351]' : 'text-[#159B5D]'}`}>
              +{res.penaltyApplied} {res.penaltyApplied === 1 ? 'pt' : 'pts'}
            </p>
          </div>

          <div className="bg-[#0A2D55] p-3 rounded-xl border border-[#FFBF00]/40">
            <p className="text-[10px] text-[#FFBF00] font-bold uppercase">Final Game Score</p>
            <p className="text-2xl font-black text-[#FFBF00] font-mono mt-0.5">
              {res.gameScore} <span className="text-xs">pts</span>
            </p>
          </div>
        </div>

        <div className="bg-[#020812] p-2.5 rounded-xl border border-[#0A2D55] text-xs text-center font-medium text-gray-300">
          Score Breakdown: {res.marginDifference} pts margin difference + {res.penaltyApplied} pts penalty = <strong className="text-[#FFBF00] font-mono">{res.gameScore} Points</strong>
        </div>
      </div>
    </div>
  );
};
