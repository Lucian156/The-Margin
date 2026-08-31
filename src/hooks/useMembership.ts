/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { SEEDED_MEMBERSHIP_PLANS } from '../data/seedData';
import { getCurrentUser, updateUserMembership } from '../services/storageService';
import { MembershipFeature, MembershipPlan, MembershipTier, User } from '../types';

export const MEMBERSHIP_ENTITLEMENTS: Record<MembershipTier, MembershipFeature[]> = {
  free: [
    'weeklyTips',
    'overallComp',
    'postMatchScores',
    'privateLeagues',
    'privateDuels',
    'basicProfile',
  ],
  'margin-plus': [
    'weeklyTips',
    'overallComp',
    'postMatchScores',
    'privateLeagues',
    'privateDuels',
    'basicProfile',
    'advancedProfileStats',
    'liveGameScore',
    'liveRoundScore',
    'liveOverallRank',
    'livePrivateRank',
    'liveDuelScore',
    'autoPicks',
    'reducedAds',
    'priorityNotifications',
    'advancedShareCards',
    'dataExport',
  ],
  'margin-pro': [
    'weeklyTips',
    'overallComp',
    'postMatchScores',
    'privateLeagues',
    'privateDuels',
    'basicProfile',
    'advancedProfileStats',
    'liveGameScore',
    'liveRoundScore',
    'liveOverallRank',
    'livePrivateRank',
    'liveDuelScore',
    'autoPicks',
    'reducedAds',
    'priorityNotifications',
    'advancedShareCards',
    'dataExport',
    'aiPredictor',
    'communityPickInsights',
    'predictionComparison',
    'teamInsights',
    'roundStrategy',
    'personalisedInsights',
    'proReport',
  ],
};

const TIER_WEIGHTS: Record<MembershipTier, number> = {
  free: 1,
  'margin-plus': 2,
  'margin-pro': 3,
};

export function useMembership() {
  const [user, setUser] = useState<User>(() => getCurrentUser());

  useEffect(() => {
    const refreshUser = () => {
      setUser(getCurrentUser());
    };
    window.addEventListener('storage', refreshUser);
    window.addEventListener('user-updated', refreshUser);
    return () => {
      window.removeEventListener('storage', refreshUser);
      window.removeEventListener('user-updated', refreshUser);
    };
  }, []);

  const currentTier: MembershipTier = user?.membership?.tier || 'margin-plus'; // Default to Lucian's Margin+

  const currentPlan: MembershipPlan =
    SEEDED_MEMBERSHIP_PLANS.find((p) => p.tier === currentTier) || SEEDED_MEMBERSHIP_PLANS[1];

  const hasFeature = (feature: MembershipFeature): boolean => {
    const entitlements = MEMBERSHIP_ENTITLEMENTS[currentTier] || MEMBERSHIP_ENTITLEMENTS.free;
    return entitlements.includes(feature);
  };

  const canAccess = (requiredTier: MembershipTier): boolean => {
    return TIER_WEIGHTS[currentTier] >= TIER_WEIGHTS[requiredTier];
  };

  const upgradeRequired = (requiredTier: MembershipTier): boolean => {
    return !canAccess(requiredTier);
  };

  const setPrototypeTier = (tier: MembershipTier, billingCycle: 'monthly' | 'annual' = 'monthly') => {
    const updatedUser = updateUserMembership(user.id, tier, billingCycle);
    setUser(updatedUser);
    window.dispatchEvent(new Event('user-updated'));
  };

  return {
    user,
    currentTier,
    currentPlan,
    hasFeature,
    canAccess,
    upgradeRequired,
    setPrototypeTier,
  };
}
