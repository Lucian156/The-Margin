/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Lock, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useMembership } from '../hooks/useMembership';
import { MembershipTier } from '../types';

interface PremiumFeatureGateProps {
  requiredTier: MembershipTier;
  featureName: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  upgradeMessage?: string;
  onNavigateToUpgrade?: () => void;
  showBlurPreview?: boolean;
}

export const PremiumFeatureGate: React.FC<PremiumFeatureGateProps> = ({
  requiredTier,
  featureName,
  children,
  fallback,
  upgradeMessage,
  onNavigateToUpgrade,
  showBlurPreview = false,
}) => {
  const { canAccess } = useMembership();

  if (canAccess(requiredTier)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const tierBadgeLabel = requiredTier === 'margin-pro' ? 'THE MARGIN PRO' : 'THE MARGIN+';
  const defaultMsg =
    upgradeMessage ||
    (requiredTier === 'margin-pro'
      ? `Unlock ${featureName} with The Margin Pro.`
      : `Unlock ${featureName} with The Margin+.`);

  const handleUpgradeClick = () => {
    if (onNavigateToUpgrade) {
      onNavigateToUpgrade();
    } else {
      window.location.hash = '#/memberships';
      window.dispatchEvent(new Event('hashchange'));
    }
  };

  return (
    <div className="relative rounded-xl border border-amber-300/40 bg-gradient-to-br from-[#0A2D55]/90 to-[#031128] text-white p-6 shadow-xl overflow-hidden my-4">
      {/* Background Decorative Element */}
      <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-[#FFBF00]/10 rounded-full blur-2xl pointer-events-none" />

      {showBlurPreview && (
        <div className="absolute inset-0 opacity-20 filter blur-sm pointer-events-none select-none overflow-hidden p-4">
          {children}
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center text-center max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 rounded-full bg-[#FFBF00]/20 border border-[#FFBF00]/40 flex items-center justify-center text-[#FFBF00] shadow-inner">
          <Lock className="w-6 h-6" />
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-[#FFBF00] text-[#031128] mb-2 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            {tierBadgeLabel} FEATURE
          </span>
          <h3 className="text-xl font-bold text-white mt-1">{featureName}</h3>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">{defaultMsg}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full pt-2">
          <button
            onClick={handleUpgradeClick}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-bold text-sm bg-gradient-to-r from-[#FFBF00] to-[#FFE179] text-[#031128] hover:brightness-105 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2"
          >
            Upgrade Plan Now
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleUpgradeClick}
            className="text-xs text-slate-300 hover:text-white underline font-medium py-1"
          >
            Compare All Plans
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-2">
          <ShieldCheck className="w-3.5 h-3.5 text-[#FFBF00]" />
          <span>Instant unlock in prototype mode. No payment card required.</span>
        </div>
      </div>
    </div>
  );
};
