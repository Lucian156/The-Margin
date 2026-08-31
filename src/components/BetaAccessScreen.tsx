/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Trophy, Shield, ArrowRight, AlertCircle, RefreshCw, CheckSquare, Square, Sparkles } from 'lucide-react';
import { createRound25BetaTester } from '../services/betaAccessService';
import { NRL_TEAMS } from '../data/nrlTeams';
import { User } from '../types';

interface BetaAccessScreenProps {
  onSuccess: (user: User) => void;
}

export const BetaAccessScreen: React.FC<BetaAccessScreenProps> = ({ onSuccess }) => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [favouriteTeamId, setFavouriteTeamId] = useState<string>('');
  const [consentChecked, setConsentChecked] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!displayName.trim() || displayName.trim().length < 2) {
      setError('Enter your name.');
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }

    if (!consentChecked) {
      setError('Please acknowledge that this is a closed beta.');
      return;
    }

    setLoading(true);
    setLoadingText('Creating your beta profile...');

    try {
      const result = await createRound25BetaTester({
        displayName: displayName.trim(),
        email: email.trim(),
        favouriteTeamId: favouriteTeamId || null,
      });

      const userProfile: User = {
        id: result.uid,
        uid: result.uid,
        username: displayName.trim().toLowerCase().replace(/\s+/g, '_'),
        displayName: result.profile.displayName || displayName.trim(),
        email: result.profile.email || email.trim(),
        favoriteTeamId: result.profile.favouriteTeamId || favouriteTeamId || 'warriors',
        favouriteTeamId: result.profile.favouriteTeamId || favouriteTeamId || 'warriors',
        isAdmin: false,
        role: 'tester',
        membershipTier: 'free',
        accessMode: 'round-25-beta',
        activeRoundId: 'nrl-2026-round-25',
        totalScore: 0,
        roundsPlayed: 0,
        perfectTipsCount: 0,
        correctWinnersCount: 0,
        wrongWinnersCount: 0,
        averageMarginError: 0,
      };

      onSuccess(userProfile);
    } catch (err: any) {
      console.error('Beta Access Error:', err);
      if (err?.message?.includes('operation-not-allowed') || err?.message?.includes('auth/operation-not-allowed')) {
        setError('Beta access is not enabled. Please contact the administrator.');
      } else {
        setError(err?.message || 'Failed to enter beta. Please try again.');
      }
    } finally {
      setLoading(false);
      setLoadingText('');
    }
  };

  return (
    <div className="min-h-screen bg-[#EEF2F6] flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#031128] text-[#FFBF00] shadow-lg mb-3">
            <Trophy className="w-9 h-9" />
          </div>
          <h1 className="text-3xl font-extrabold text-[#031128] tracking-tight">THE MARGIN</h1>
          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#FFBF00] text-[#031128] tracking-wider uppercase shadow-sm">
            NRL MARGIN TIPPING
          </div>
          <p className="mt-3 text-sm font-semibold text-[#0A2D55]">
            Pick the winner. Predict the margin. Lowest score wins.
          </p>
          <p className="mt-1 text-xs text-[#718095]">
            Anyone can pick a winner. The Margin rewards the people who can predict the game.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-[#DDE4EC]">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-[#DF4351]/10 border border-[#DF4351]/30 text-[#DF4351] text-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Beta Access Error</p>
                  <p className="mt-1 text-xs leading-relaxed">{error}</p>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="mt-2 inline-flex items-center text-xs font-bold underline hover:no-underline"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" /> TRY AGAIN
                  </button>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="displayName" className="block text-xs font-bold uppercase tracking-wider text-[#111D31] mb-1.5">
                YOUR NAME
              </label>
              <input
                id="displayName"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alex Smith"
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border border-[#DDE4EC] bg-[#EEF2F6]/50 text-[#111D31] placeholder-[#718095] focus:outline-none focus:ring-2 focus:ring-[#0A2D55] focus:bg-white text-sm transition-all"
              />
            </div>

            <div>
              <label htmlFor="betaEmail" className="block text-xs font-bold uppercase tracking-wider text-[#111D31] mb-1.5">
                EMAIL ADDRESS
              </label>
              <input
                id="betaEmail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border border-[#DDE4EC] bg-[#EEF2F6]/50 text-[#111D31] placeholder-[#718095] focus:outline-none focus:ring-2 focus:ring-[#0A2D55] focus:bg-white text-sm transition-all"
              />
            </div>

            <div>
              <label htmlFor="favouriteTeam" className="block text-xs font-bold uppercase tracking-wider text-[#111D31] mb-1.5">
                FAVOURITE TEAM
              </label>
              <select
                id="favouriteTeam"
                value={favouriteTeamId}
                onChange={(e) => setFavouriteTeamId(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border border-[#DDE4EC] bg-[#EEF2F6]/50 text-[#111D31] focus:outline-none focus:ring-2 focus:ring-[#0A2D55] focus:bg-white text-sm transition-all"
              >
                <option value="">Select your NRL Team (Optional)</option>
                {NRL_TEAMS.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.shortName})
                  </option>
                ))}
              </select>
            </div>

            {/* Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <button
                  type="button"
                  onClick={() => setConsentChecked(!consentChecked)}
                  className="mt-0.5 text-[#0A2D55] focus:outline-none"
                >
                  {consentChecked ? (
                    <CheckSquare className="w-5 h-5 text-[#0A2D55] fill-[#0A2D55]/10" />
                  ) : (
                    <Square className="w-5 h-5 text-[#718095]" />
                  )}
                </button>
                <span className="text-xs text-[#718095] leading-snug">
                  I understand this is a closed beta and the administrator can view my submitted tips.
                </span>
              </label>
            </div>

            {/* Microcopy info */}
            <div className="bg-[#EEF2F6] rounded-xl p-3 border border-[#DDE4EC] text-xs text-[#718095] space-y-1">
              <p className="flex items-center font-semibold text-[#0A2D55]">
                <Shield className="w-3.5 h-3.5 mr-1 text-[#FFBF00]" />
                No password required for this closed beta.
              </p>
              <p>Use the same browser and device when returning to retain your session.</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !consentChecked}
              className="w-full py-3.5 px-6 rounded-xl bg-[#031128] text-[#FFBF00] font-extrabold text-sm hover:bg-[#0A2D55] focus:outline-none focus:ring-2 focus:ring-[#FFBF00] focus:ring-offset-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#FFBF00]" />
                  <span>{loadingText || 'Creating your profile...'}</span>
                </>
              ) : (
                <>
                  <span>ENTER THE MARGIN</span>
                  <ArrowRight className="w-4 h-4 text-[#FFBF00]" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Sponsor Banner */}
        <div className="mt-8 text-center bg-white p-4 rounded-xl border border-[#DDE4EC] shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#718095] mb-1">
            CROSS COUNTRY RENTALS • MAJOR SPONSOR
          </p>
          <p className="text-xs font-semibold text-[#031128]">
            Proudly supporting The Margin NRL Tipping Competition
          </p>
        </div>
      </div>
    </div>
  );
};
