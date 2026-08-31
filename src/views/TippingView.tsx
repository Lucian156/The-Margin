/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Trophy,
  CheckCircle2,
  Lock,
  Clock,
  Sparkles,
  ChevronRight,
  Zap,
  Swords,
  Award,
  Users,
  Activity,
  PlusCircle,
  LogIn,
  AlertCircle,
  BarChart3,
  Flame,
} from 'lucide-react';
import { Fixture, Tip, User } from '../types';
import {
  getFixturesForRound,
  getRounds,
  getUserTips,
  saveTip,
  getH2HMatchups,
  getUsers,
} from '../services/storageService';
import { saveRoundPicksToFirestore } from '../services/firestoreService';
import { submitUserPredictions } from '../services/predictionService';
import { getTeamById } from '../data/nrlTeams';
import { TeamBadge } from '../components/TeamBadge';
import { calculateGameScore } from '../utils/scoring';
import { GameScoreModal } from '../components/GameScoreModal';
import { InviteQuickActions } from '../components/InviteQuickActions';
import { getEffectiveFixtureStatus } from '../utils/matchStatus';

interface TippingViewProps {
  currentUser: User;
  setActiveTab?: (tab: string) => void;
}

export const TippingView: React.FC<TippingViewProps> = ({ currentUser, setActiveTab }) => {
  const rounds = getRounds();
  const round25 = rounds.find((r) => r.number === 25 || r.id === 'nrl-2026-round-25') || rounds.find((r) => r.isCurrent) || rounds[0];

  const [selectedRoundId, setSelectedRoundId] = useState<string>('nrl-2026-round-25');
  const [selectedFixtureForModal, setSelectedFixtureForModal] = useState<Fixture | null>(null);
  const [showSaveToast, setShowSaveToast] = useState(false);

  // Dynamic Countdown State
  const [timeLeft, setTimeLeft] = useState({ days: 2, hours: 14, minutes: 35, seconds: 12 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fixtures = getFixturesForRound(selectedRoundId);
  const userTips = getUserTips(currentUser.id);

  // Map of fixtureId -> Tip
  const tipMap = new Map<string, Tip>();
  userTips.forEach((t) => tipMap.set(t.fixtureId, t));

  // State for draft tips
  const [draftTips, setDraftTips] = useState<Record<string, { winnerId: string; margin: number }>>(() => {
    const initial: Record<string, { winnerId: string; margin: number }> = {};
    userTips.forEach((t) => {
      initial[t.fixtureId] = {
        winnerId: t.predictedWinnerTeamId,
        margin: t.predictedMargin,
      };
    });
    return initial;
  });

  const handleSelectWinner = (fixtureId: string, teamId: string) => {
    setDraftTips((prev) => ({
      ...prev,
      [fixtureId]: {
        winnerId: teamId,
        margin: prev[fixtureId]?.margin || 6,
      },
    }));
  };

  const handleMarginChange = (fixtureId: string, margin: number) => {
    setDraftTips((prev) => ({
      ...prev,
      [fixtureId]: {
        winnerId: prev[fixtureId]?.winnerId || '',
        margin,
      },
    }));
  };

  const [submissionMessage, setSubmissionMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSaveAllTips = async () => {
    setIsSubmitting(true);
    const selections: Array<{ fixtureId: string; predictedWinnerTeamId: string; predictedMargin: number }> = [];

    Object.entries(draftTips).forEach(([fixtureId, tip]) => {
      const { winnerId, margin } = tip as { winnerId: string; margin: number };
      if (winnerId && margin > 0) {
        saveTip(currentUser.id, fixtureId, winnerId, margin);
        selections.push({
          fixtureId,
          predictedWinnerTeamId: winnerId,
          predictedMargin: margin,
        });
      }
    });

    if (selections.length > 0) {
      try {
        console.log('[TippingView] Submitting predictions to predictions/{uid_fixtureId}...', selections);
        const result = await submitUserPredictions(currentUser.uid || currentUser.id, selections, {
          username: currentUser.username,
          email: currentUser.email,
          displayName: currentUser.displayName || currentUser.name,
        });
        setSubmissionMessage(result.message);
        console.log('[TippingView] Submission result:', result);
      } catch (err: any) {
        console.error('[TippingView] Failed to save predictions:', err);
        setSubmissionMessage(`Submission notice: ${err?.message || 'Local tips saved.'}`);
      }
    } else {
      setSubmissionMessage('Please select a winning team and margin for at least one fixture.');
    }

    setIsSubmitting(false);
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 4000);
  };

  // Quick auto-tip helpers
  const handleAutoTipHome = () => {
    const updated = { ...draftTips };
    fixtures.forEach((f) => {
      if (!updated[f.id]?.winnerId) {
        updated[f.id] = { winnerId: f.homeTeamId, margin: 6 };
      }
    });
    setDraftTips(updated);
  };

  const handleAutoTipFavorites = () => {
    const updated = { ...draftTips };
    fixtures.forEach((f) => {
      // Pick team with primary color preference or home team
      updated[f.id] = { winnerId: f.homeTeamId, margin: 8 };
    });
    setDraftTips(updated);
  };

  const activeRound = rounds.find((r) => r.id === selectedRoundId);

  // Count filled tips
  const filledTipsCount = fixtures.filter((f) => draftTips[f.id]?.winnerId).length;

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      {/* Toast Notification */}
      {showSaveToast && (
        <div className="fixed top-16 right-4 z-50 bg-[#159B5D] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce border border-white/20">
          <CheckCircle2 className="w-6 h-6 shrink-0" />
          <div>
            <p className="font-extrabold text-sm uppercase tracking-wide">Submission Update</p>
            <p className="text-xs text-white/90">{submissionMessage || 'Your Round 25 margin predictions are saved.'}</p>
          </div>
        </div>
      )}

      {/* TIPPING BANNER: FOCUS ON TIPS */}
      <div className="bg-gradient-to-br from-[#031128] via-[#0A2D55] to-[#020812] text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#0A2D55] shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="bg-[#FFBF00] text-[#031128] font-black text-[10px] px-2.5 py-0.5 rounded-lg uppercase tracking-wider shadow">
                SUBMIT TIPS
              </span>
              <span className="bg-[#159B5D] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                ROUND 25 ACTIVE
              </span>
            </div>

            <h1 className="text-xl sm:text-3xl font-black uppercase tracking-tight text-white font-sans leading-none">
              ENTER YOUR ROUND 25 TIPS
            </h1>

            <p className="text-gray-300 text-xs sm:text-sm">
              Pick the winning team and predict the margin difference for each match. Lower margin error score wins!
            </p>
          </div>

          {/* Dynamic Countdown Timer */}
          <div className="bg-[#020812]/90 border border-[#FFBF00]/40 p-3 rounded-xl sm:rounded-2xl text-center flex flex-row md:flex-col items-center justify-between sm:justify-center shrink-0 shadow-lg gap-2">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#FFBF00]" />
              Tips Close In
            </span>
            <div className="flex items-center gap-1 text-[#FFBF00] font-black font-mono text-base sm:text-xl">
              <span className="bg-[#0A2D55] px-1.5 py-0.5 rounded-lg">{String(timeLeft.days).padStart(2, '0')}d</span>
              <span>:</span>
              <span className="bg-[#0A2D55] px-1.5 py-0.5 rounded-lg">{String(timeLeft.hours).padStart(2, '0')}h</span>
              <span>:</span>
              <span className="bg-[#0A2D55] px-1.5 py-0.5 rounded-lg">{String(timeLeft.minutes).padStart(2, '0')}m</span>
              <span>:</span>
              <span className="bg-[#0A2D55] px-1.5 py-0.5 rounded-lg text-white">{String(timeLeft.seconds).padStart(2, '0')}s</span>
            </div>
          </div>
        </div>

        {/* Round Selector Tabs */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-t border-[#0A2D55]/80 pt-3">
          {rounds.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRoundId(r.id)}
              className={`px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                selectedRoundId === r.id
                  ? 'bg-[#FFBF00] text-[#031128] shadow-md scale-105'
                  : 'bg-[#020812] text-gray-300 hover:text-white hover:bg-[#0A2D55]'
              }`}
            >
              Round {r.number} {r.number === 24 ? '(Beta Active)' : r.isCompleted ? '(Done)' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* FIXTURES TIPPING SECTION */}
      <div id="round-fixtures-section" className="space-y-4 pt-2">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#DDE4EC] shadow-sm">
          <div>
            <h2 className="font-black text-lg text-[#031128] uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#FFBF00]" />
              {activeRound?.name || 'Round 24 Fixtures'}
            </h2>
            <p className="text-xs text-gray-500">
              Select predicted winner & margin difference. (Lowest Total Margin Error Wins!)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoTipHome}
              className="bg-[#EEF2F6] hover:bg-gray-200 text-[#031128] font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-[#FFBF00]" />
              Auto-Tip Home
            </button>
            <button
              onClick={handleSaveAllTips}
              className="bg-[#FFBF00] hover:bg-[#FFE179] text-[#031128] font-black px-4 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow transition-transform hover:scale-105"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Lock In Tips
            </button>
          </div>
        </div>

        {/* Fixture Cards */}
        {fixtures.map((fixture) => {
          const homeTeam = getTeamById(fixture.homeTeamId);
          const awayTeam = getTeamById(fixture.awayTeamId);

          const savedTip = tipMap.get(fixture.id);
          const currentDraft = draftTips[fixture.id] || {
            winnerId: savedTip?.predictedWinnerTeamId || '',
            margin: savedTip?.predictedMargin || 6,
          };

          const effectiveStatus = getEffectiveFixtureStatus(fixture);
          const isLocked = effectiveStatus === 'COMPLETED' || effectiveStatus === 'LIVE';

          const scoreRes =
            savedTip && effectiveStatus === 'COMPLETED'
              ? calculateGameScore(
                  savedTip.predictedWinnerTeamId,
                  savedTip.predictedMargin,
                  fixture.winnerTeamId,
                  fixture.winningMargin
                )
              : null;

          return (
            <div
              key={fixture.id}
              className={`bg-white rounded-2xl border transition-all shadow-sm hover:shadow-md overflow-hidden ${
                scoreRes?.isPerfectPrediction
                  ? 'border-[#FFBF00] ring-2 ring-[#FFBF00]/30'
                  : currentDraft.winnerId
                  ? 'border-[#0A2D55]/30'
                  : 'border-[#DDE4EC]'
              }`}
            >
              {/* Fixture Header Bar */}
              <div className="bg-[#EEF2F6] px-4 py-2 border-b border-[#DDE4EC] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-gray-600 font-medium">
                  <Clock className="w-3.5 h-3.5 text-[#0A2D55]" />
                  <span>
                    {new Date(fixture.startTime).toLocaleDateString('en-AU', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                  <span>•</span>
                  <span>{fixture.venue}</span>
                </div>

                <div className="flex items-center gap-2">
                  {effectiveStatus === 'LIVE' ? (
                    <span className="bg-[#DF4351] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      LIVE ({fixture.matchClock || 'In Progress'})
                    </span>
                  ) : effectiveStatus === 'COMPLETED' ? (
                    <span className="bg-gray-200 text-gray-700 font-bold text-[10px] px-2 py-0.5 rounded">
                      FULL TIME
                    </span>
                  ) : (
                    <span className="text-gray-500 font-semibold text-[11px] flex items-center gap-1">
                      <Lock className="w-3 h-3 text-[#0A2D55]" /> Locks at kickoff ({new Date(fixture.startTime).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })})
                    </span>
                  )}
                </div>
              </div>

              {/* Tipping Matchup Interface */}
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {/* Home Team Selection */}
                  <button
                    disabled={isLocked}
                    onClick={() => handleSelectWinner(fixture.id, fixture.homeTeamId)}
                    className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 relative ${
                      currentDraft.winnerId === fixture.homeTeamId
                        ? 'border-[#FFBF00] bg-[#FFBF00]/10 shadow-md scale-[1.02]'
                        : 'border-[#DDE4EC] hover:border-gray-300 bg-white'
                    }`}
                  >
                    {currentDraft.winnerId === fixture.homeTeamId && (
                      <span className="absolute top-2 right-2 bg-[#FFBF00] text-[#031128] rounded-full p-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    )}
                    <TeamBadge teamId={fixture.homeTeamId} size="lg" />
                    <span className="font-extrabold text-xs sm:text-sm text-[#031128] text-center">
                      {homeTeam?.name}
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Home
                    </span>
                  </button>

                  {/* Away Team Selection */}
                  <button
                    disabled={isLocked}
                    onClick={() => handleSelectWinner(fixture.id, fixture.awayTeamId)}
                    className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 relative ${
                      currentDraft.winnerId === fixture.awayTeamId
                        ? 'border-[#FFBF00] bg-[#FFBF00]/10 shadow-md scale-[1.02]'
                        : 'border-[#DDE4EC] hover:border-gray-300 bg-white'
                    }`}
                  >
                    {currentDraft.winnerId === fixture.awayTeamId && (
                      <span className="absolute top-2 right-2 bg-[#FFBF00] text-[#031128] rounded-full p-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    )}
                    <TeamBadge teamId={fixture.awayTeamId} size="lg" />
                    <span className="font-extrabold text-xs sm:text-sm text-[#031128] text-center">
                      {awayTeam?.name}
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Away
                    </span>
                  </button>
                </div>

                {/* Margin Selector Bar */}
                {currentDraft.winnerId ? (
                  <div className="bg-[#EEF2F6] p-3 rounded-xl border border-[#DDE4EC] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#031128] uppercase tracking-wider">
                        Predicted Margin:
                      </span>
                      <span className="font-black text-sm text-[#031128] font-mono bg-[#FFBF00] px-2.5 py-0.5 rounded-lg shadow-sm">
                        +{currentDraft.margin} Points
                      </span>
                    </div>

                    {/* Quick Preset Margin Buttons & Custom Margin Input Box */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none flex-1">
                        {[2, 4, 6, 8, 10, 12, 14, 18, 24].map((m) => (
                          <button
                            key={m}
                            disabled={isLocked}
                            onClick={() => handleMarginChange(fixture.id, m)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black shrink-0 transition-all ${
                              currentDraft.margin === m
                                ? 'bg-[#031128] text-[#FFBF00] shadow'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-[#DDE4EC]'
                            }`}
                          >
                            +{m}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 bg-white px-2.5 py-1.5 rounded-lg border border-[#DDE4EC] shadow-sm">
                        <span className="text-[11px] font-black uppercase text-[#031128] whitespace-nowrap">
                          Custom:
                        </span>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          disabled={isLocked}
                          value={currentDraft.margin || ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            handleMarginChange(fixture.id, isNaN(val) ? 0 : val);
                          }}
                          placeholder="e.g. 15"
                          className="w-16 bg-[#EEF2F6] border border-[#DDE4EC] rounded-md px-2 py-1 text-xs font-mono font-black text-[#031128] outline-none focus:border-[#FFBF00] focus:ring-2 focus:ring-[#FFBF00]/30 transition-all"
                        />
                        <span className="text-[10px] font-bold text-gray-500 uppercase">pts</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#EEF2F6]/60 p-2.5 rounded-xl border border-dashed border-[#DDE4EC] text-center text-xs text-gray-500 font-medium">
                    Tap a team above to select your winner & margin
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* STICKY BOTTOM SUBMIT BAR FOR MOBILE (<60s completion) */}
      <div className="fixed bottom-14 left-0 right-0 z-30 bg-[#031128] border-t border-[#0A2D55] p-3 shadow-2xl lg:hidden">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div className="text-white">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">Round 24 Progress</span>
            <span className="font-black text-xs text-[#FFBF00]">
              {filledTipsCount} of {fixtures.length} Tips Selected
            </span>
          </div>

          <button
            onClick={handleSaveAllTips}
            className="bg-[#FFBF00] hover:bg-[#FFE179] text-[#031128] font-black text-xs px-5 py-2.5 rounded-xl uppercase tracking-wider flex items-center gap-1.5 shadow-lg active:scale-95 transition-transform"
          >
            <CheckCircle2 className="w-4 h-4" />
            Submit All Tips
          </button>
        </div>
      </div>

      {/* Game Score Breakdown Modal */}
      {selectedFixtureForModal && (
        <GameScoreModal
          fixture={selectedFixtureForModal}
          tip={tipMap.get(selectedFixtureForModal.id)}
          onClose={() => setSelectedFixtureForModal(null)}
        />
      )}
    </div>
  );
};
