/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, CheckCircle2, AlertTriangle, Sparkles, HelpCircle } from 'lucide-react';
import { Fixture, Tip } from '../types';
import { calculateGameScore } from '../utils/scoring';
import { getTeamById } from '../data/nrlTeams';
import { TeamBadge } from './TeamBadge';

interface GameScoreModalProps {
  fixture: Fixture;
  tip?: Tip;
  userName: string;
  onClose: () => void;
}

export const GameScoreModal: React.FC<GameScoreModalProps> = ({
  fixture,
  tip,
  userName,
  onClose,
}) => {
  const homeTeam = getTeamById(fixture.homeTeamId);
  const awayTeam = getTeamById(fixture.awayTeamId);

  const predictedTeam = tip ? getTeamById(tip.predictedWinnerTeamId) : null;
  const actualWinnerTeam = fixture.winnerTeamId ? getTeamById(fixture.winnerTeamId) : null;

  const scoreRes = tip && fixture.status === 'COMPLETED'
    ? calculateGameScore(
        tip.predictedWinnerTeamId,
        tip.predictedMargin,
        fixture.winnerTeamId,
        fixture.winningMargin
      )
    : null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-[#EEF2F6] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#DDE4EC] animate-scaleUp">
        {/* Modal Header */}
        <div className="bg-[#031128] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#0A2D55]">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#FFBF00] text-[#031128] font-black text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">
                Scoring Inspector
              </span>
              <span className="text-xs text-gray-300 font-medium">{fixture.venue}</span>
            </div>
            <h3 className="text-lg font-black mt-1 text-white uppercase font-sans">
              Match Calculation Breakdown
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#0A2D55] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Match Score Board */}
          <div className="bg-white p-4 rounded-xl border border-[#DDE4EC] shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3 w-5/12">
              <TeamBadge teamId={fixture.homeTeamId} size="lg" />
              <div>
                <p className="font-extrabold text-sm text-[#111D31]">{homeTeam?.shortName}</p>
                <p className="text-xs text-gray-500">{fixture.homeScore ?? '-'}</p>
              </div>
            </div>

            <div className="text-center px-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">
                VS
              </span>
              <span className="text-[10px] bg-gray-100 font-semibold px-2 py-0.5 rounded text-gray-600 mt-1 inline-block">
                {fixture.status}
              </span>
            </div>

            <div className="flex items-center gap-3 w-5/12 justify-end text-right">
              <div>
                <p className="font-extrabold text-sm text-[#111D31]">{awayTeam?.shortName}</p>
                <p className="text-xs text-gray-500">{fixture.awayScore ?? '-'}</p>
              </div>
              <TeamBadge teamId={fixture.awayTeamId} size="lg" />
            </div>
          </div>

          {/* Actual Result vs Prediction comparison */}
          {fixture.status === 'COMPLETED' && actualWinnerTeam ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-[#DDE4EC]">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Actual Outcome
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <TeamBadge teamId={actualWinnerTeam.id} size="sm" />
                  <div>
                    <p className="text-xs font-black text-[#111D31]">{actualWinnerTeam.shortName}</p>
                    <p className="text-xs text-[#159B5D] font-bold">Won by {fixture.winningMargin} pts</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-[#DDE4EC]">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {userName}&apos;s Tip
                </p>
                {tip && predictedTeam ? (
                  <div className="flex items-center gap-2 mt-2">
                    <TeamBadge teamId={predictedTeam.id} size="sm" />
                    <div>
                      <p className="text-xs font-black text-[#111D31]">{predictedTeam.shortName}</p>
                      <p className="text-xs text-[#0A2D55] font-bold">
                        Predicted by {tip.predictedMargin} pts
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-red-500 font-bold mt-2">No tip submitted</p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl text-xs flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
              Game score will be calculated once match is completed.
            </div>
          )}

          {/* Step-by-Step Scoring Formula Inspection */}
          {scoreRes && (
            <div className="bg-[#031128] text-white p-4 sm:p-5 rounded-2xl shadow-md border border-[#0A2D55] space-y-4">
              <div className="flex items-center justify-between border-b border-[#0A2D55] pb-3">
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Official Calculation Breakdown
                </span>
                {scoreRes.isPerfectPrediction ? (
                  <span className="bg-[#FFBF00] text-[#031128] text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
                    <Sparkles className="w-3.5 h-3.5" /> PERFECT PREDICTION (0 PTS)
                  </span>
                ) : scoreRes.isCorrectWinner ? (
                  <span className="bg-[#159B5D]/20 text-[#159B5D] border border-[#159B5D]/40 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Correct Winner
                  </span>
                ) : (
                  <span className="bg-[#DF4351]/20 text-[#DF4351] border border-[#DF4351]/40 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Wrong Winner (+5 Penalty)
                  </span>
                )}
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center bg-[#020812] p-2.5 rounded-lg border border-[#0A2D55]/60">
                  <span className="text-gray-400">1. Predicted Margin:</span>
                  <span className="text-white font-bold">{scoreRes.predictedMargin} pts</span>
                </div>

                <div className="flex justify-between items-center bg-[#020812] p-2.5 rounded-lg border border-[#0A2D55]/60">
                  <span className="text-gray-400">2. Actual Margin:</span>
                  <span className="text-white font-bold">{scoreRes.actualMargin} pts</span>
                </div>

                <div className="flex justify-between items-center bg-[#020812] p-2.5 rounded-lg border border-[#0A2D55]/60">
                  <span className="text-gray-300">3. Absolute Margin Difference:</span>
                  <span className="text-[#FFE179] font-bold">
                    |{scoreRes.predictedMargin} - {scoreRes.actualMargin}| = {scoreRes.marginDifference} pts
                  </span>
                </div>

                <div className="flex justify-between items-center bg-[#020812] p-2.5 rounded-lg border border-[#0A2D55]/60">
                  <span className="text-gray-300">4. Wrong Winner Penalty:</span>
                  <span className={scoreRes.penaltyApplied > 0 ? 'text-[#DF4351] font-bold' : 'text-[#159B5D] font-bold'}>
                    +{scoreRes.penaltyApplied} pts
                  </span>
                </div>
              </div>

              {/* Formula Display */}
              <div className="pt-2 border-t border-[#0A2D55]">
                <div className="bg-[#0A2D55]/50 p-3 rounded-xl border border-[#FFBF00]/30 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-gray-400 font-sans uppercase font-bold">Formula Applied</p>
                    <p className="text-xs text-white font-mono mt-0.5">
                      {scoreRes.isCorrectWinner
                        ? `Math.abs(${scoreRes.predictedMargin} - ${scoreRes.actualMargin})`
                        : `Math.abs(${scoreRes.predictedMargin} - ${scoreRes.actualMargin}) + 5`}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 font-sans uppercase font-bold">Game Score</p>
                    <p className="text-2xl font-black text-[#FFBF00] font-mono leading-none">
                      {scoreRes.gameScore} <span className="text-xs font-normal">pts</span>
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 text-center mt-2 italic font-sans">
                  * Remember: Lower score wins in The Margin.
                </p>
              </div>
            </div>
          )}

          <div className="pt-1">
            <button
              onClick={onClose}
              className="w-full bg-[#0A2D55] hover:bg-[#031128] text-white font-bold py-2.5 rounded-xl text-sm transition-colors shadow"
            >
              Close Inspector
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
