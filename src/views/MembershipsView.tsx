/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Crown,
  Sparkles,
  CheckCircle2,
  XCircle,
  Zap,
  Bot,
  ShieldCheck,
  ArrowRight,
  Download,
  CreditCard,
  Calendar,
  Check,
  X,
  ChevronRight,
  HelpCircle,
  FileText,
  Lock,
} from 'lucide-react';
import { useMembership } from '../hooks/useMembership';
import { SEEDED_MEMBERSHIP_PLANS, SEEDED_BILLING_HISTORY } from '../data/seedData';
import { MembershipTier } from '../types';
import { getBillingHistory } from '../services/storageService';

interface MembershipsViewProps {
  setActiveTab: (tab: string) => void;
}

export const MembershipsView: React.FC<MembershipsViewProps> = ({ setActiveTab }) => {
  const { user, currentTier, currentPlan, setPrototypeTier } = useMembership();

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [showUpgradeWizard, setShowUpgradeWizard] = useState(false);
  const [selectedUpgradeTier, setSelectedUpgradeTier] = useState<MembershipTier>('margin-plus');
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [billingHistory, setBillingHistory] = useState(() => getBillingHistory(user.id));
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);

  const plans = SEEDED_MEMBERSHIP_PLANS;

  const openUpgrade = (tier: MembershipTier) => {
    setSelectedUpgradeTier(tier);
    setWizardStep(1);
    setShowUpgradeWizard(true);
  };

  const handleConfirmUpgrade = () => {
    setPrototypeTier(selectedUpgradeTier, billingCycle);
    setBillingHistory(getBillingHistory(user.id));
    setWizardStep(4); // Success step
  };

  const handleSimulateInvoiceDownload = (billId: string) => {
    setDownloadSuccessToast(`Invoice ${billId} downloaded as PDF (Simulated).`);
    setTimeout(() => setDownloadSuccessToast(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 text-white">
      {/* Toast Notification */}
      {downloadSuccessToast && (
        <div className="fixed top-20 right-4 z-50 bg-[#159B5D] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-white/20 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-xs font-bold">{downloadSuccessToast}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FFBF00] text-[#031128]">
          <Crown className="w-4 h-4" />
          THE MARGIN MEMBERSHIP EXPERIENCE
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          Level Up Your NRL Tipping Precision
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          From live in-play rank updates and automated fallback picks to AI predictor models — choose the tier that matches your tipping ambition.
        </p>

        {/* Billing Cycle Toggle */}
        <div className="pt-4 flex items-center justify-center gap-3">
          <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-[#FFBF00]' : 'text-slate-400'}`}>
            Monthly Billing
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
            className="relative w-14 h-8 bg-[#0A2D55] border border-[#FFBF00]/40 rounded-full p-1 transition-colors"
          >
            <div
              className={`w-6 h-6 rounded-full bg-[#FFBF00] shadow-md transform transition-transform ${
                billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-xs font-bold ${billingCycle === 'annual' ? 'text-[#FFBF00]' : 'text-slate-400'}`}>
            Annual Billing <span className="text-[#159B5D] font-extrabold">(SAVE ~20%)</span>
          </span>
        </div>
      </div>

      {/* 3 Pricing Cards Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = currentTier === plan.tier;
          const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
          const pricePeriod = billingCycle === 'annual' ? '/ year' : '/ month';

          return (
            <div
              key={plan.tier}
              className={`relative rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 ${
                plan.highlight
                  ? 'bg-gradient-to-b from-[#0A2D55] via-[#031128] to-[#020812] border-2 border-[#FFBF00] shadow-2xl scale-102'
                  : 'bg-[#031128] border border-[#0A2D55] shadow-xl hover:border-slate-500'
              }`}
            >
              {/* Highlight Badge */}
              {plan.badgeText && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#FFBF00] text-[#031128] font-black text-[10px] uppercase tracking-wider shadow">
                  {plan.badgeText}
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-white uppercase">{plan.name}</h3>
                  {isCurrent && (
                    <span className="px-2.5 py-0.5 rounded-md bg-[#159B5D]/20 text-[#159B5D] border border-[#159B5D]/40 text-[10px] font-extrabold uppercase">
                      Current Active Plan
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 min-h-[32px]">{plan.description}</p>

                <div className="pt-2 border-t border-[#0A2D55]">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-[#FFBF00]">${price.toFixed(2)}</span>
                    <span className="text-xs text-slate-400">{pricePeriod}</span>
                  </div>
                  {billingCycle === 'annual' && plan.monthlyPrice > 0 && (
                    <div className="text-[10px] text-[#159B5D] font-bold mt-1">
                      Equivalent to ${(plan.annualPrice / 12).toFixed(2)} / month
                    </div>
                  )}
                </div>

                {/* Key Features Bullet List */}
                <div className="space-y-2 pt-2 text-xs">
                  <div className="font-bold text-slate-300 uppercase text-[10px] tracking-wider">Includes:</div>
                  {plan.highlightsList.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-[#FFBF00] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-3 rounded-xl bg-[#0A2D55] text-slate-400 font-bold text-xs border border-slate-700 cursor-not-allowed"
                  >
                    Current Active Tier
                  </button>
                ) : (
                  <button
                    onClick={() => openUpgrade(plan.tier)}
                    className={`w-full py-3 rounded-xl font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 ${
                      plan.highlight
                        ? 'bg-gradient-to-r from-[#FFBF00] to-[#FFE179] text-[#031128] hover:brightness-105'
                        : 'bg-[#0A2D55] hover:bg-[#0A2D55]/80 text-white border border-slate-600'
                    }`}
                  >
                    {plan.tier === 'free' ? 'Switch to Free Tier' : `Upgrade to ${plan.name}`}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Plan Feature Comparison Table */}
      <div className="bg-[#031128] border border-[#0A2D55] rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#0A2D55] pb-4">
          <div>
            <h2 className="text-xl font-extrabold text-white">Full Feature Comparison Matrix</h2>
            <p className="text-xs text-slate-400">Detailed entitlement comparison across all plan tiers</p>
          </div>
          <span className="text-xs text-[#FFBF00] font-bold">The Margin Beta: Instant Tier Management</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[#0A2D55] text-xs font-black uppercase text-slate-300">
                <th className="py-3 px-4">Feature / Capabilities</th>
                <th className="py-3 px-4 text-center">Free Plan</th>
                <th className="py-3 px-4 text-center text-[#FFBF00]">The Margin+</th>
                <th className="py-3 px-4 text-center text-[#FFE179]">The Margin Pro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0A2D55] text-xs">
              {[
                { name: 'Weekly NRL Tipping & Margin Predictions', free: true, plus: true, pro: true },
                { name: 'Overall Competition Leaderboard', free: true, plus: true, pro: true },
                { name: 'Post-Match Official Scores & Round Penalties', free: true, plus: true, pro: true },
                { name: 'Private Leagues Access', free: '1 League', plus: 'Unlimited', pro: 'Unlimited' },
                { name: 'Head-to-Head Duels Access', free: '1 Duel', plus: 'Unlimited', pro: 'Unlimited' },
                { name: 'Live In-Play Game Scores & Round Ranks', free: false, plus: true, pro: true },
                { name: 'Live In-Play Private League & Duel Scores', free: false, plus: true, pro: true },
                { name: 'Auto Picks Automated Fallback Engine', free: false, plus: true, pro: true },
                { name: 'Advanced Profile Analytics & Team Stats', free: false, plus: true, pro: true },
                { name: 'Reduced Advertisement Banner Mode', free: false, plus: true, pro: true },
                { name: 'AI Predictor Model & Match Suggestions', free: false, plus: false, pro: true },
                { name: 'Community Pick Distribution & Insights', free: false, plus: false, pro: true },
                { name: 'AI vs Community Prediction Comparison', free: false, plus: false, pro: true },
                { name: 'Comprehensive Pro Strategy Reports (PDF)', free: false, plus: false, pro: true },
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-[#0A2D55]/30 transition-colors">
                  <td className="py-3 px-4 font-bold text-white">{row.name}</td>
                  <td className="py-3 px-4 text-center">
                    {typeof row.free === 'boolean' ? (
                      row.free ? (
                        <Check className="w-5 h-5 text-[#159B5D] mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-slate-600 mx-auto" />
                      )
                    ) : (
                      <span className="text-slate-300 font-bold">{row.free}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {typeof row.plus === 'boolean' ? (
                      row.plus ? (
                        <Check className="w-5 h-5 text-[#159B5D] mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-slate-600 mx-auto" />
                      )
                    ) : (
                      <span className="text-[#FFBF00] font-bold">{row.plus}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {typeof row.pro === 'boolean' ? (
                      row.pro ? (
                        <Check className="w-5 h-5 text-[#159B5D] mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-slate-600 mx-auto" />
                      )
                    ) : (
                      <span className="text-[#FFE179] font-bold">{row.pro}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Current Plan Manager & Billing History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Plan Manager */}
        <div className="bg-[#031128] border border-[#0A2D55] rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#FFBF00]" />
            Your Current Subscription Management
          </h3>

          <div className="p-4 bg-[#020812] rounded-xl border border-[#0A2D55] space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Active Tier:</span>
              <span className="font-extrabold text-[#FFBF00] uppercase">{currentPlan.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Billing Cycle:</span>
              <span className="font-bold text-white uppercase">{user.membership?.billingCycle || 'monthly'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Next Billing Date:</span>
              <span className="font-mono text-slate-300">{user.membership?.nextBillingDate || '2026-09-01'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Status:</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#159B5D]/20 text-[#159B5D] uppercase">
                Active (Prototype)
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={() => openUpgrade('margin-pro')}
              className="flex-1 px-4 py-2 bg-[#FFBF00] hover:bg-[#FFE179] text-[#031128] font-bold text-xs rounded-lg shadow"
            >
              Switch / Upgrade Tier
            </button>
            <button
              onClick={() => setPrototypeTier('free')}
              className="px-4 py-2 bg-[#0A2D55] hover:bg-[#0A2D55]/80 text-slate-300 font-bold text-xs rounded-lg border border-slate-700"
            >
              Downgrade to Free
            </button>
          </div>
        </div>

        {/* Billing History Log */}
        <div className="bg-[#031128] border border-[#0A2D55] rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#FFBF00]" />
            Billing History & Receipts
          </h3>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {billingHistory.map((bill) => (
              <div
                key={bill.id}
                className="p-3 bg-[#020812] rounded-xl border border-[#0A2D55] flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-white">{bill.description}</div>
                  <div className="text-[10px] text-slate-400">{bill.date} • Paid</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-[#FFBF00]">${bill.amount.toFixed(2)}</span>
                  <button
                    onClick={() => handleSimulateInvoiceDownload(bill.id)}
                    className="p-1.5 rounded-lg bg-[#0A2D55] hover:bg-[#0A2D55]/80 text-slate-300 hover:text-white"
                    title="Download Receipt PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5-STEP UPGRADE / CHECKOUT DEMO WIZARD MODAL */}
      {showUpgradeWizard && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#031128] border border-[#0A2D55] rounded-2xl p-6 max-w-lg w-full text-white shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            {/* Header & Close */}
            <div className="flex items-center justify-between border-b border-[#0A2D55] pb-3">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-[#FFBF00]" />
                <h3 className="text-lg font-black text-white uppercase">
                  {wizardStep < 4 ? 'Checkout & Plan Upgrade' : 'Plan Successfully Activated!'}
                </h3>
              </div>
              <button
                onClick={() => setShowUpgradeWizard(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Progress Bar */}
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Step 1: Plan</span>
              <span>Step 2: Billing</span>
              <span>Step 3: Details</span>
              <span>Step 4: Active!</span>
            </div>
            <div className="w-full bg-[#020812] h-1.5 rounded-full overflow-hidden border border-[#0A2D55]">
              <div
                className="bg-[#FFBF00] h-full transition-all duration-300"
                style={{ width: `${(wizardStep / 4) * 100}%` }}
              />
            </div>

            {/* STEP 1: CONFIRMATION */}
            {wizardStep === 1 && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-[#020812] rounded-xl border border-[#0A2D55] space-y-2">
                  <div className="text-slate-400">Selected Upgrade:</div>
                  <div className="text-base font-black text-[#FFBF00] uppercase">
                    {selectedUpgradeTier === 'margin-pro' ? 'THE MARGIN PRO' : 'THE MARGIN+'}
                  </div>
                  <div className="text-slate-300">
                    Cycle: <strong className="text-white uppercase">{billingCycle}</strong>
                  </div>
                  <div className="text-slate-300">
                    Price:{' '}
                    <strong className="text-[#FFBF00]">
                      ${(selectedUpgradeTier === 'margin-pro'
                        ? billingCycle === 'annual'
                          ? 99.99
                          : 9.99
                        : billingCycle === 'annual'
                        ? 49.99
                        : 4.99
                      ).toFixed(2)}{' '}
                      / {billingCycle}
                    </strong>
                  </div>
                </div>

                <button
                  onClick={() => setWizardStep(2)}
                  className="w-full py-3 rounded-xl bg-[#FFBF00] text-[#031128] font-black text-xs shadow hover:brightness-105 flex items-center justify-center gap-2"
                >
                  Continue to Billing Details
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 2: BILLING CYCLE CONFIRM */}
            {wizardStep === 2 && (
              <div className="space-y-4 text-xs">
                <p className="text-slate-300">Choose preferred billing period:</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`p-3 rounded-xl border text-left ${
                      billingCycle === 'monthly' ? 'bg-[#0A2D55] border-[#FFBF00]' : 'bg-[#020812] border-[#0A2D55]'
                    }`}
                  >
                    <div className="font-bold text-white">Monthly</div>
                    <div className="text-[#FFBF00] font-mono mt-1">
                      ${selectedUpgradeTier === 'margin-pro' ? '9.99' : '4.99'} / mo
                    </div>
                  </button>

                  <button
                    onClick={() => setBillingCycle('annual')}
                    className={`p-3 rounded-xl border text-left ${
                      billingCycle === 'annual' ? 'bg-[#0A2D55] border-[#FFBF00]' : 'bg-[#020812] border-[#0A2D55]'
                    }`}
                  >
                    <div className="font-bold text-white">Annual (Save ~20%)</div>
                    <div className="text-[#FFBF00] font-mono mt-1">
                      ${selectedUpgradeTier === 'margin-pro' ? '99.99' : '49.99'} / yr
                    </div>
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setWizardStep(1)}
                    className="w-1/2 py-2.5 rounded-xl bg-[#0A2D55] text-slate-300 font-bold"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setWizardStep(3)}
                    className="w-1/2 py-2.5 rounded-xl bg-[#FFBF00] text-[#031128] font-bold"
                  >
                    Next Step
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: SIMULATED PAYMENT */}
            {wizardStep === 3 && (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-[#020812] rounded-xl border border-[#0A2D55] text-slate-300 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#FFBF00]" />
                  <span>The Margin Beta instant plan activation. No payment card required.</span>
                </div>

                <div className="space-y-2">
                  <label className="block text-slate-300 font-bold">Account Confirmation Email</label>
                  <input
                    type="email"
                    readOnly
                    value={user.email}
                    className="w-full bg-[#020812] border border-[#0A2D55] rounded-lg p-2.5 text-white font-mono"
                  />
                </div>

                <button
                  onClick={handleConfirmUpgrade}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FFBF00] to-[#FFE179] text-[#031128] font-black text-xs shadow hover:brightness-105 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Confirm & Activate Tier
                </button>
              </div>
            )}

            {/* STEP 4: SUCCESS ONBOARDING */}
            {wizardStep === 4 && (
              <div className="space-y-4 text-center text-xs">
                <div className="w-12 h-12 rounded-full bg-[#159B5D]/20 border border-[#159B5D] text-[#159B5D] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <h4 className="text-xl font-black text-white">
                  Welcome to {selectedUpgradeTier === 'margin-pro' ? 'THE MARGIN PRO' : 'THE MARGIN+'}!
                </h4>

                <p className="text-slate-300 leading-relaxed">
                  Your account has been successfully upgraded! All premium features and benefits are now active.
                </p>

                <div className="p-3 bg-[#020812] rounded-xl border border-[#0A2D55] text-left space-y-1.5">
                  <div className="font-bold text-[#FFBF00]">What to explore next:</div>
                  <div className="text-slate-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#159B5D]" /> Test Live Centre in-play ranks
                  </div>
                  <div className="text-slate-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#159B5D]" /> Configure Auto Picks strategy
                  </div>
                  {selectedUpgradeTier === 'margin-pro' && (
                    <div className="text-slate-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#159B5D]" /> Check AI Centre prediction models
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowUpgradeWizard(false)}
                  className="w-full py-3 rounded-xl bg-[#FFBF00] text-[#031128] font-black text-xs shadow"
                >
                  Start Using New Features Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
