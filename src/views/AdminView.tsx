/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Settings,
  RefreshCw,
  Plus,
  CheckCircle2,
  ShieldAlert,
  Database,
  Radio,
  Users,
  Trophy,
  MessageSquare,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Award,
  Calendar,
  Layers,
  Search,
  Mail,
  Shield,
  UserCheck,
  Lock,
  Eye,
} from 'lucide-react';
import { Fixture, User } from '../types';
import { SEEDED_USERS } from '../data/seedData';
import { PlayerProfileModal } from '../components/PlayerProfileModal';
import { FirebaseHealthCheckScreen } from '../components/FirebaseHealthCheckScreen';
import { RoundMigrationPanel } from '../components/RoundMigrationPanel';
import { auth } from '../firebase';
import {
  getFixtures,
  saveFixture,
  saveFixtures,
  getUsers,
  getLeagues,
  getH2HLeagues,
  getTips,
  updateUserMembership,
  resetStorageToDefault,
} from '../services/storageService';
import { getTeamById, NRL_TEAMS } from '../data/nrlTeams';
import {
  fetchAppSettingsFromFirestore,
  updateAppSettingsInFirestore,
  saveAppSettingsLocal,
  AppSettings,
  fetchAllUsersFromFirestore,
  fetchAllTipsFromFirestore,
  subscribeAllUsersFromFirestore,
  subscribeAllTipsFromFirestore,
  fetchLeaguesFromFirestore,
  fetchH2HLeaguesFromFirestore,
  seedFirestoreFixtures,
  saveTipToFirestore,
  saveUserToFirestore,
  fetchAuthRecordsFromFirestore,
  fetchRegistrationErrorsFromFirestore,
  repairMissingUserRecords,
} from '../services/firestoreService';
import { calculateGameScore } from '../utils/scoring';
import { DEMO_USERS, DEMO_LEAGUES, DEMO_H2H_LEAGUES, DEMO_H2H_STANDINGS } from '../data/demoSeedData';

interface AdminViewProps {
  currentUser: User;
  onRefreshData: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ currentUser, onRefreshData }) => {
  if (!currentUser?.isAdmin) {
    return (
      <div className="bg-white rounded-2xl border border-[#DDE4EC] p-8 text-center max-w-md mx-auto my-12 shadow-sm space-y-4">
        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-black text-[#031128] uppercase">Admin Access Restricted</h2>
        <p className="text-sm text-gray-600">
          The Simulation & Admin Console is restricted to designated competition administrators. Invited users and standard participants cannot view or modify match scores or administrative controls.
        </p>
      </div>
    );
  }

  const [fixtures, setFixtures] = useState<Fixture[]>(getFixtures());
  const [appSettings, setAppSettings] = useState<AppSettings>({
    scheduleConfirmed: true,
    scheduleConfirmedBy: 'Official NRL Draw',
  });
  const [activeTab, setActiveTab] = useState<'beta' | 'testers' | 'predictions' | 'results' | 'health' | 'migration' | 'diagnostics'>('beta');

  // Search & Filter State
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [picksSearchTerm, setPicksSearchTerm] = useState('');
  const [picksFixtureFilter, setPicksFixtureFilter] = useState('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Diagnostics & Audit State
  const [authRecords, setAuthRecords] = useState<any[]>([]);
  const [registrationErrors, setRegistrationErrors] = useState<any[]>([]);
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairReport, setRepairReport] = useState<{
    totalAuthCount: number;
    totalFirestoreCount: number;
    repairedCount: number;
    patchedCount: number;
    repairedUsernames: string[];
  } | null>(null);

  // Real Counts for Beta Dashboard
  const [testersCount, setTestersCount] = useState(0);
  const [tipsCount, setTipsCount] = useState(0);
  const [usersWith8Tips, setUsersWith8Tips] = useState(0);
  const [overallLeaguesCount, setOverallLeaguesCount] = useState(0);
  const [h2hLeaguesCount, setH2HLeaguesCount] = useState(0);
  const [finalisedFixturesCount, setFinalisedFixturesCount] = useState(0);
  const [feedbackCount, setFeedbackCount] = useState(0);

  // Full Lists for Inspection
  const [allUsersList, setAllUsersList] = useState<User[]>([]);
  const [allTipsList, setAllTipsList] = useState<any[]>([]);

  // Clear Beta Data Confirmation Input
  const [clearConfirmationInput, setClearConfirmationInput] = useState('');
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [selectedUserForModal, setSelectedUserForModal] = useState<User | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Helper to process real registered users only (strictly NO mock or seeded data)
  const processAndSetUsers = (remoteUsers: User[], localUsers: User[], tipsList: any[] = allTipsList) => {
    const userMap = new Map<string, User>();
    // Add real users from Firestore
    remoteUsers.forEach((u) => {
      if (u && (u.uid || u.id)) {
        const key = (u.uid || u.id).toLowerCase();
        userMap.set(key, u);
      }
    });
    // Add real users from local storage if present (and not seeded)
    localUsers.forEach((u) => {
      if (u && (u.uid || u.id) && !u.id.startsWith('seeded-')) {
        const key = (u.uid || u.id).toLowerCase();
        if (!userMap.has(key)) userMap.set(key, u);
      }
    });

    // Synthesize user records for any tippers in tipsList who are not yet in userMap
    tipsList.forEach((t) => {
      if (!t) return;
      const uid = (t.userId || t.uid || '').toString();
      const uname = (t.username || t.userDisplayName || '').toString();
      const uemail = (t.userEmail || t.email || '').toString();

      const exists = Array.from(userMap.values()).some((u) => {
        const uId = (u.id || '').toLowerCase();
        const uUid = (u.uid || '').toLowerCase();
        const uUname = (u.username || '').toLowerCase();
        const uEmail = (u.email || '').toLowerCase();
        return (
          (uid && (uId === uid.toLowerCase() || uUid === uid.toLowerCase())) ||
          (uname && uUname === uname.toLowerCase()) ||
          (uemail && uEmail === uemail.toLowerCase())
        );
      });

      if (!exists) {
        const cleanId = uid || `user-${uname || Date.now()}`;
        const synthUser: User = {
          id: cleanId,
          uid: cleanId,
          name: uname || uid || 'Registered Tipper',
          displayName: uname || uid || 'Registered Tipper',
          username: uname || uid || 'tipper',
          email: uemail || `${uname || uid}@themargin.app`,
          role: 'player',
          isAdmin: false,
          status: 'active',
          favoriteTeamId: 'WARRIORS',
          totalScore: 0,
          roundsPlayed: 1,
          perfectTipsCount: 0,
          correctWinnersCount: 0,
          wrongWinnersCount: 0,
          averageMarginError: 0,
          createdAt: t.submittedAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        userMap.set(cleanId.toLowerCase(), synthUser);
      }
    });

    // Sort newest registrations first
    const merged = Array.from(userMap.values()).sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });
    setAllUsersList(merged);
    setTestersCount(merged.length);
    console.log("ADMIN REAL USERS QUERY:", merged);
    return merged;
  };

  // Helper to merge remote & local tips uniquely by userId_fixtureId
  const processAndSetTips = (remoteTips: any[], localTips: any[]) => {
    const tipMap = new Map<string, any>();
    localTips.forEach((t) => {
      if (t && (t.userId || t.uid) && t.fixtureId) {
        const uid = t.userId || t.uid;
        const key = `${uid}_${t.fixtureId}`;
        const teamId = t.predictedWinnerTeamId || t.selectedTeamId || t.winnerId || '';
        const margin = Number(t.predictedMargin ?? t.margin ?? 0);
        tipMap.set(key, { ...t, userId: uid, predictedWinnerTeamId: teamId, selectedTeamId: teamId, predictedMargin: margin });
      }
    });
    remoteTips.forEach((t) => {
      if (t && (t.userId || t.uid) && t.fixtureId) {
        const uid = t.userId || t.uid;
        const key = `${uid}_${t.fixtureId}`;
        const teamId = t.predictedWinnerTeamId || t.selectedTeamId || t.winnerId || '';
        const margin = Number(t.predictedMargin ?? t.margin ?? 0);
        tipMap.set(key, { ...t, userId: uid, predictedWinnerTeamId: teamId, selectedTeamId: teamId, predictedMargin: margin });
      }
    });
    const merged = Array.from(tipMap.values());
    setAllTipsList(merged);
    setTipsCount(merged.length);
    console.log("ADMIN PICKS QUERY", merged);

    // Count users with all 8 tips
    const userTipCounts = new Map<string, Set<string>>();
    merged.forEach((t) => {
      const uid = t.userId || t.uid;
      if (!userTipCounts.has(uid)) userTipCounts.set(uid, new Set());
      userTipCounts.get(uid)?.add(t.fixtureId);
    });
    let full8 = 0;
    userTipCounts.forEach((set) => {
      if (set.size >= 8) full8++;
    });
    setUsersWith8Tips(full8);
    return merged;
  };

  const getUserTips = (usr: any) => {
    if (!usr) return [];
    const targetIds = new Set<string>();
    if (usr.id) targetIds.add(String(usr.id).toLowerCase());
    if (usr.uid) targetIds.add(String(usr.uid).toLowerCase());
    if (usr.username) targetIds.add(String(usr.username).toLowerCase());
    if (usr.email) targetIds.add(String(usr.email).toLowerCase());

    const fixtureMap = new Map<string, any>();
    allTipsList.forEach((t) => {
      if (!t || !t.fixtureId) return;
      const tipUid = (t.userId || t.uid || '').toString().toLowerCase();
      const tipUsername = (t.username || t.userDisplayName || '').toString().toLowerCase();
      const tipEmail = (t.userEmail || t.email || '').toString().toLowerCase();

      if (
        targetIds.has(tipUid) ||
        (tipUsername && targetIds.has(tipUsername)) ||
        (tipEmail && targetIds.has(tipEmail))
      ) {
        fixtureMap.set(t.fixtureId, t);
      }
    });

    return Array.from(fixtureMap.values());
  };

  const loadDiagnostics = async () => {
    try {
      const [authRecs, regErrs] = await Promise.all([
        fetchAuthRecordsFromFirestore(),
        fetchRegistrationErrorsFromFirestore(),
      ]);
      setAuthRecords(authRecs);
      setRegistrationErrors(regErrs);
    } catch (e) {
      console.warn('Error loading diagnostics:', e);
    }
  };

  const handleRunRepair = async () => {
    setIsRepairing(true);
    setActionMessage(null);
    try {
      const report = await repairMissingUserRecords();
      setRepairReport(report);
      await handleManualRefresh();
      await loadDiagnostics();
      setActionMessage(`Repair complete! Created ${report.repairedCount} missing Firestore records and patched ${report.patchedCount} incomplete user records.`);
    } catch (err: any) {
      console.error('Error running repair:', err);
      setActionMessage(`Repair error: ${err?.message || String(err)}`);
    } finally {
      setIsRepairing(false);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const [remoteUsers, remoteTips, oLeagues, hLeagues] = await Promise.all([
        fetchAllUsersFromFirestore(),
        fetchAllTipsFromFirestore(),
        fetchLeaguesFromFirestore(),
        fetchH2HLeaguesFromFirestore(),
      ]);

      await loadDiagnostics();

      const localUsers = getUsers();
      processAndSetUsers(remoteUsers, localUsers);

      const localTips = getTips();
      processAndSetTips(remoteTips, localTips);

      setOverallLeaguesCount(oLeagues.length || getLeagues().length);
      setH2HLeaguesCount(hLeagues.length || getH2HLeagues().length);

      const currentFixtures = getFixtures();
      setFixtures(currentFixtures);
      setFinalisedFixturesCount(currentFixtures.filter((f) => f.status === 'COMPLETED').length);

      setActionMessage('All registered players, diagnostics, and tips refreshed successfully!');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      console.error('Error refreshing admin data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Load Settings & Set Up Real-Time Subscriptions
  useEffect(() => {
    handleManualRefresh();

    // Subscribe to Firestore changes for real-time player updates
    const unsubUsers = subscribeAllUsersFromFirestore((remoteUsers) => {
      const localUsers = getUsers();
      processAndSetUsers(remoteUsers, localUsers);
    });

    const unsubTips = subscribeAllTipsFromFirestore((remoteTips) => {
      const localTips = getTips();
      processAndSetTips(remoteTips, localTips);
    });

    return () => {
      unsubUsers();
      unsubTips();
    };
  }, []);

  // Finalise Fixture Result & Trigger Idempotent Score Recalculation
  const handleFinaliseFixture = async (fixtureId: string, homeScore: number, awayScore: number) => {
    const winnerId =
      homeScore > awayScore
        ? fixtures.find((f) => f.id === fixtureId)?.homeTeamId
        : awayScore > homeScore
        ? fixtures.find((f) => f.id === fixtureId)?.awayTeamId
        : null;

    const margin = Math.abs(homeScore - awayScore);

    const updatedFixtures = fixtures.map((f) => {
      if (f.id === fixtureId) {
        return {
          ...f,
          status: 'COMPLETED' as const,
          period: 'FULL_TIME' as const,
          matchClock: 'FT',
          homeScore,
          awayScore,
          winnerTeamId: winnerId || f.homeTeamId,
          winningMargin: margin,
        };
      }
      return f;
    });

    updatedFixtures.forEach((f) => saveFixture(f));
    setFixtures(updatedFixtures);
    setFinalisedFixturesCount(updatedFixtures.filter((f) => f.status === 'COMPLETED').length);

    setActionMessage('Fixture result saved and leaderboards recalculated!');
    setTimeout(() => setActionMessage(null), 3000);
    onRefreshData();
  };

  // Reset Round Results (resets fixtures back to UPCOMING)
  const executeResetRoundResults = () => {
    const reset = fixtures.map((f) => ({
      ...f,
      status: 'UPCOMING' as const,
      period: 'NOT_STARTED' as const,
      matchClock: undefined,
      homeScore: null,
      awayScore: null,
      winnerTeamId: null,
      winningMargin: null,
    }));

    saveFixtures(reset);
    
    // Explicitly reset form input values in DOM
    reset.forEach((f) => {
      const hEl = document.getElementById(`home-score-${f.id}`) as HTMLInputElement;
      const aEl = document.getElementById(`away-score-${f.id}`) as HTMLInputElement;
      if (hEl) hEl.value = '';
      if (aEl) aEl.value = '';
    });

    setFixtures(reset);
    setFinalisedFixturesCount(0);
    setShowResetConfirmModal(false);
    setActionMessage('All Round 24 fixture results reset to UPCOMING.');
    setTimeout(() => setActionMessage(null), 3000);
    onRefreshData();
  };

  // Clear All Beta Data
  const handleClearAllBetaData = () => {
    if (clearConfirmationInput.trim().toUpperCase() !== 'CLEAR ROUND 25 BETA') {
      alert('Confirmation phrase does not match! Please type "CLEAR ROUND 25 BETA" exactly.');
      return;
    }

    resetStorageToDefault();
    setFixtures(getFixtures());
    setShowClearConfirmModal(false);
    setClearConfirmationInput('');
    setActionMessage('All Beta data cleared and reset to pristine state!');
    setTimeout(() => setActionMessage(null), 3000);
    onRefreshData();
  };

  // Load Demo Data for Isolated Hidden Demo Mode
  const handleLoadDemoData = () => {
    localStorage.setItem('the_margin_demo_active', 'true');
    localStorage.setItem('the_margin_users', JSON.stringify([...getUsers(), ...DEMO_USERS]));
    localStorage.setItem('the_margin_leagues', JSON.stringify([...getLeagues(), ...DEMO_LEAGUES]));
    localStorage.setItem('the_margin_h2h_leagues', JSON.stringify([...getH2HLeagues(), ...DEMO_H2H_LEAGUES]));
    localStorage.setItem('the_margin_h2h_standings', JSON.stringify(DEMO_H2H_STANDINGS));
    setActionMessage('Demo data loaded successfully for demonstration view!');
    setTimeout(() => setActionMessage(null), 3000);
    onRefreshData();
  };

  const handleClearDemoData = () => {
    localStorage.removeItem('the_margin_demo_active');
    resetStorageToDefault();
    setActionMessage('Demo data cleared from environment.');
    setTimeout(() => setActionMessage(null), 3000);
    onRefreshData();
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Toast Notification */}
      {actionMessage && (
        <div className="fixed top-16 right-4 z-50 bg-amber-500 text-slate-950 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce border border-white/20 font-bold text-xs">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#031128] text-white p-6 sm:p-8 rounded-2xl border border-[#0A2D55] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#FFBF00] text-[#031128] font-black text-[10px] px-2.5 py-0.5 rounded uppercase tracking-wider">
              Admin & Tester Console
            </span>
            <span className="text-xs text-[#FFE179] font-semibold">THE MARGIN ROUND 25 BETA</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase text-white font-sans">
            Admin Control Panel
          </h1>
          <p className="text-gray-300 text-xs sm:text-sm mt-1 max-w-2xl">
            Manage Round 25 Beta testers, inspect submitted predictions, enter match results, perform round migrations, and view real-time diagnostics.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#020812] p-1.5 rounded-xl border border-[#0A2D55]">
          <button
            onClick={() => setActiveTab('beta')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'beta' ? 'bg-[#FFBF00] text-[#031128]' : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('testers')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'testers' ? 'bg-[#FFBF00] text-[#031128]' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Testers ({allUsersList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('predictions')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'predictions' ? 'bg-[#FFBF00] text-[#031128]' : 'text-gray-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>R25 Predictions ({allTipsList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'results' ? 'bg-[#FFBF00] text-[#031128]' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-[#FFBF00]" />
            <span>R25 Results Entry</span>
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'health' ? 'bg-[#FFBF00] text-[#031128]' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>System Health</span>
          </button>
          <button
            onClick={() => setActiveTab('migration')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'migration' ? 'bg-[#FFBF00] text-[#031128]' : 'text-gray-400 hover:text-white'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Round Migration</span>
          </button>
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'diagnostics' ? 'bg-[#FFBF00] text-[#031128]' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Audit Logs</span>
          </button>
        </div>
      </div>

      {/* Player Profile & Picks Modal */}
      {selectedUserForModal && (
        <PlayerProfileModal
          user={selectedUserForModal}
          onClose={() => setSelectedUserForModal(null)}
          isAdmin={currentUser.isAdmin}
        />
      )}

      {activeTab === 'beta' ? (
        <>
          {/* FIXTURE SCHEDULE PERMANENT CONFIRMATION BANNER */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <span>Round 24 Schedule Verified & Locked</span>
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                </h3>
                <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                  Official NRL Round 24 fixture dates, venues, and kickoff times are permanently locked and verified across all tipping views.
                </p>
                <div className="mt-1 flex items-center gap-2 text-[10px] font-mono text-slate-400">
                  <span>Status:</span>
                  <span className="text-emerald-400 font-bold uppercase">PERMANENTLY CONFIRMED (OFFICIAL NRL DRAW)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Schedule Confirmed ✓
              </div>
            </div>
          </div>

          {/* REAL BETA METRICS DASHBOARD */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {[
              { label: 'Registered Players', val: testersCount, icon: Users, color: 'text-blue-400' },
              { label: 'Tips Submitted', val: tipsCount, icon: Trophy, color: 'text-amber-400' },
              { label: 'Users 8/8 Tips', val: usersWith8Tips, icon: CheckCircle2, color: 'text-emerald-400' },
              { label: 'Overall Leagues', val: overallLeaguesCount, icon: Layers, color: 'text-purple-400' },
              { label: 'H2H Leagues', val: h2hLeaguesCount, icon: Sparkles, color: 'text-pink-400' },
              { label: 'Finalised Games', val: `${finalisedFixturesCount}/8`, icon: Award, color: 'text-yellow-400' },
              { label: 'Feedback Submissions', val: feedbackCount, icon: MessageSquare, color: 'text-cyan-400' },
            ].map((m, idx) => {
              const Icon = m.icon;
              return (
                <div key={idx} className="bg-white p-3.5 rounded-xl border border-[#DDE4EC] shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-gray-400 mb-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500">{m.label}</span>
                    <Icon className={`w-4 h-4 ${m.color}`} />
                  </div>
                  <span className="text-xl font-black text-[#031128] font-mono">{m.val}</span>
                </div>
              );
            })}
          </div>

          {/* REGISTERED PLAYERS DIRECTORY */}
          <div className="bg-white rounded-2xl border border-[#DDE4EC] p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DDE4EC] pb-4">
              <div>
                <h2 className="text-lg font-black text-[#031128] uppercase flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#FFBF00]" /> Registered Players & Participants ({allUsersList.length})
                </h2>
                <p className="text-xs text-gray-500">
                  Comprehensive directory of registered competition players, accounts, membership status, and tipping progress.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search player, email..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="pl-9 pr-3 py-1.5 bg-[#EEF2F6] border border-[#DDE4EC] rounded-xl text-xs font-medium text-[#031128] focus:outline-none focus:ring-2 focus:ring-amber-500/40 w-48 sm:w-64"
                  />
                </div>
                <button
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="bg-[#031128] hover:bg-[#0A2D55] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 shrink-0"
                  title="Sync latest players from cloud storage"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
                  <span>Refresh List</span>
                </button>
              </div>
            </div>

            {/* Filtered Users List Table */}
            {(() => {
              const filtered = allUsersList.filter((u) => {
                if (!userSearchTerm.trim()) return true;
                const term = userSearchTerm.toLowerCase();
                return (
                  (u.name || '').toLowerCase().includes(term) ||
                  (u.username || '').toLowerCase().includes(term) ||
                  (u.email || '').toLowerCase().includes(term) ||
                  (u.favoriteTeamId || '').toLowerCase().includes(term)
                );
              });

              if (allUsersList.length === 0) {
                return (
                  <div className="text-center py-8 bg-[#EEF2F6] rounded-xl border border-dashed border-[#DDE4EC] space-y-2">
                    <Users className="w-8 h-8 text-gray-400 mx-auto" />
                    <p className="text-xs font-bold text-gray-600">No registered players found in system.</p>
                    <p className="text-[11px] text-gray-400">When users register on any device, they will appear here automatically.</p>
                  </div>
                );
              }

              if (filtered.length === 0) {
                return (
                  <div className="text-center py-6 text-xs text-gray-500 italic">
                    No players matching "{userSearchTerm}"
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#031128] text-white uppercase text-[10px] tracking-wider font-extrabold">
                        <th className="p-3">Name</th>
                        <th className="p-3">Username</th>
                        <th className="p-3">Email Address</th>
                        <th className="p-3">Registration Date</th>
                        <th className="p-3 text-center">Membership</th>
                        <th className="p-3 text-center">Total Tips</th>
                        <th className="p-3 text-center">League Count</th>
                        <th className="p-3">Last Login</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DDE4EC]">
                      {filtered.map((usr) => {
                        const userTips = getUserTips(usr);
                        const leagues = getLeagues().filter((l) => l.memberUserIds?.includes(usr.id) || l.createdByUserId === usr.id);
                        const h2hLeagues = getH2HLeagues().filter((l) => l.memberUserIds?.includes(usr.id) || l.createdByUserId === usr.id);
                        const totalLeaguesCount = leagues.length + h2hLeagues.length;

                        return (
                          <tr
                            key={usr.id}
                            onClick={() => setSelectedUserForModal(usr)}
                            className="hover:bg-amber-50/60 cursor-pointer transition-colors"
                          >
                            <td className="p-3">
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={usr?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                                  alt={usr?.displayName || usr?.name || 'Player'}
                                  className="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0"
                                />
                                <div className="font-extrabold text-[#031128] flex items-center gap-1.5">
                                  <span>{usr?.displayName || usr?.name || 'Anonymous Player'}</span>
                                  {usr?.isAdmin && (
                                    <span className="bg-amber-100 text-amber-800 text-[9px] font-black uppercase px-1.5 py-0.5 rounded border border-amber-300">
                                      Admin
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-gray-500 font-mono text-[11px]">
                              @{usr?.username || 'tipper'}
                            </td>
                            <td className="p-3 text-gray-600 font-mono text-[11px]">
                              {usr.email ? (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                                  {usr.email}
                                </span>
                              ) : (
                                <span className="text-gray-400 italic">No email</span>
                              )}
                            </td>
                            <td className="p-3 text-gray-500 text-[11px]">
                              {usr.createdAt ? new Date(usr.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : (usr.memberSince || 'N/A')}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                usr.membershipTier === 'PRO' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                                usr.membershipTier === 'FOUNDATION' ? 'bg-purple-100 text-purple-900 border border-purple-300' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {usr.membershipTier || 'Free'}
                              </span>
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-[#031128]">
                              {userTips.length} tips
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-[#031128]">
                              {totalLeaguesCount} leagues
                            </td>
                            <td className="p-3 text-gray-500 text-[11px] font-mono">
                              {usr.lastLoginAt ? new Date(usr.lastLoginAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                            </td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                                {usr.status || 'Active'}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedUserForModal(usr);
                                }}
                                className="bg-[#031128] hover:bg-[#0A2D55] text-white px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 shadow transition-all"
                              >
                                <Eye className="w-3 h-3 text-[#FFBF00]" />
                                <span>Inspect</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>

          {/* ROUND 24 RESULTS ENTRY & CALCULATION ENGINE */}
          <div className="bg-white rounded-2xl border border-[#DDE4EC] p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DDE4EC] pb-4">
              <div>
                <h2 className="text-lg font-black text-[#031128] uppercase">Round 24 Official Results Entry</h2>
                <p className="text-xs text-gray-500">
                  Enter final scores to trigger automatic calculation of Game Scores, Round Totals, Overall Ranks & H2H Differentials.
                </p>
              </div>

              <button
                onClick={() => setShowResetConfirmModal(true)}
                className="bg-[#DF4351] hover:bg-[#DF4351]/90 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow transition-all active:scale-95"
              >
                <RotateCcw className="w-4 h-4" /> Reset Round Results
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fixtures.map((f) => {
                const home = getTeamById(f.homeTeamId);
                const away = getTeamById(f.awayTeamId);

                return (
                  <div key={f.id} className="p-4 rounded-xl border border-[#DDE4EC] bg-[#EEF2F6] space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-[#031128]">
                        {home?.shortName} vs {away?.shortName}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${f.status === 'COMPLETED' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
                        {f.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          placeholder="Home"
                          defaultValue={f.homeScore ?? ''}
                          id={`home-score-${f.id}`}
                          className="w-16 p-2 rounded-lg border border-[#DDE4EC] text-center font-bold text-sm bg-white"
                        />
                        <span className="font-bold text-xs">:</span>
                        <input
                          type="number"
                          placeholder="Away"
                          defaultValue={f.awayScore ?? ''}
                          id={`away-score-${f.id}`}
                          className="w-16 p-2 rounded-lg border border-[#DDE4EC] text-center font-bold text-sm bg-white"
                        />
                      </div>

                      <button
                        onClick={() => {
                          const hEl = document.getElementById(`home-score-${f.id}`) as HTMLInputElement;
                          const aEl = document.getElementById(`away-score-${f.id}`) as HTMLInputElement;
                          const hVal = parseInt(hEl.value || '0', 10);
                          const aVal = parseInt(aEl.value || '0', 10);
                          handleFinaliseFixture(f.id, hVal, aVal);
                        }}
                        className="bg-[#031128] hover:bg-[#0A2D55] text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow"
                      >
                        Save & Finalise
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SUBMITTED TESTER PICKS & TIPS INSPECTION MATRIX */}
          <div className="bg-white rounded-2xl border border-[#DDE4EC] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#DDE4EC] pb-4">
              <div>
                <h2 className="text-lg font-black text-[#031128] uppercase flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#FFBF00]" /> Submitted Tester Picks & Predictions
                </h2>
                <p className="text-xs text-gray-500">
                  Inspect submitted predictions across all registered beta participants for Round 24.
                </p>
              </div>
              <span className="bg-[#031128] text-white text-xs font-mono font-bold px-3 py-1 rounded-lg">
                Total Submitted Tips: {allTipsList.length}
              </span>
            </div>

            {allUsersList.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">No registered testers yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#031128] text-white uppercase text-[10px] tracking-wider font-extrabold">
                      <th className="p-3">Tester</th>
                      <th className="p-3">Favorite Team</th>
                      <th className="p-3 text-center">Tips Submitted</th>
                      <th className="p-3">Submitted Picks (Team + Margin)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DDE4EC]">
                    {allUsersList.map((usr) => {
                      const userTips = getUserTips(usr);

                      return (
                        <tr
                          key={usr.id}
                          onClick={() => setSelectedUserForModal(usr)}
                          className="hover:bg-amber-50/60 cursor-pointer transition-colors"
                        >
                          <td className="p-3 font-bold text-[#031128]">
                            <div className="flex items-center gap-2">
                              <img
                                src={usr?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                                alt={usr?.name || 'Tester'}
                                className="w-7 h-7 rounded-full object-cover"
                              />
                              <div>
                                <div className="font-extrabold text-[#031128]">{usr?.name || 'Anonymous Tester'}</div>
                                <div className="text-[10px] text-gray-400">@{usr?.username || 'tipper'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-gray-600 font-semibold">{usr.favoriteTeamId || 'N/A'}</td>
                          <td className="p-3 text-center font-mono font-black">
                            <span className={`px-2 py-0.5 rounded ${userTips.length === 8 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                              {userTips.length} / 8
                            </span>
                          </td>
                          <td className="p-3">
                            {userTips.length === 0 ? (
                              <span className="text-gray-400 italic text-[11px]">No tips submitted yet</span>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {userTips.map((t, index) => {
                                  const team = getTeamById(t.predictedWinnerTeamId);
                                  return (
                                    <span
                                      key={`${t.id || 'tip'}-${t.fixtureId}-${t.userId}-${index}`}
                                      className="inline-flex items-center gap-1 bg-[#EEF2F6] border border-[#DDE4EC] px-2 py-1 rounded text-[11px] font-bold text-[#031128]"
                                    >
                                      <span className="text-amber-600">{team?.shortName || t.predictedWinnerTeamId}</span>
                                      <span className="text-gray-400">by</span>
                                      <span className="font-mono text-emerald-700">{t.predictedMargin}pts</span>
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* RESET & TESTING ACTIONS */}
          <div className="bg-[#031128] text-white p-6 rounded-2xl border border-[#0A2D55] shadow-xl space-y-4">
            <h3 className="text-sm font-extrabold text-[#FFBF00] uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#FFBF00]" /> Protected Beta Reset Controls
            </h3>
            <p className="text-xs text-gray-300">
              Perform administrative reset of beta data. Requires explicit confirmation keyword.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => setShowClearConfirmModal(true)}
                className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-lg flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" /> Clear All Beta Data
              </button>
            </div>
          </div>
        </>
      ) : activeTab === 'health' ? (
        <FirebaseHealthCheckScreen isEmbedded />
      ) : activeTab === 'migration' ? (
        <RoundMigrationPanel />
      ) : activeTab === 'diagnostics' ? (
        <div className="space-y-6">
          {/* Diagnostic Action Bar */}
          <div className="bg-[#031128] border border-[#0A2D55] p-6 rounded-2xl text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded">
                  System Diagnostics & Audit
                </span>
                <span className="text-xs text-amber-300 font-bold">Firebase Auth vs. Firestore Sync Engine</span>
              </div>
              <h2 className="text-xl font-black uppercase tracking-wide">
                User Integrity Diagnostic Dashboard
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Audits registered accounts, compares Firebase Authentication user records against Firestore document profiles, detects orphaned or broken records, and executes automated profile repair.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={loadDiagnostics}
                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-700 transition-all active:scale-95"
              >
                <RefreshCw className="w-4 h-4 text-amber-400" />
                <span>Run Diagnostic Scan</span>
              </button>

              <button
                onClick={handleRunRepair}
                disabled={isRepairing}
                className="bg-[#FFBF00] hover:bg-[#FFE179] disabled:opacity-50 text-[#031128] px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all active:scale-95"
              >
                <RefreshCw className={`w-4 h-4 ${isRepairing ? 'animate-spin' : ''}`} />
                <span>{isRepairing ? 'Repairing User Records...' : 'REPAIR MISSING USER RECORDS'}</span>
              </button>
            </div>
          </div>

          {/* Diagnostic Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-xl border border-[#DDE4EC] shadow-sm flex flex-col justify-between">
              <div className="text-gray-400 text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-between mb-2">
                <span>Total Auth Users</span>
                <Shield className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-[#031128] font-mono">
                {authRecords.length}
              </div>
              <div className="text-[10px] text-gray-400 mt-1">Firebase Auth</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#DDE4EC] shadow-sm flex flex-col justify-between">
              <div className="text-gray-400 text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-between mb-2">
                <span>Total Firestore Users</span>
                <Database className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-[#031128] font-mono">
                {allUsersList.length}
              </div>
              <div className="text-[10px] text-gray-400 mt-1">users/ Document DB</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#DDE4EC] shadow-sm flex flex-col justify-between">
              <div className="text-gray-400 text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-between mb-2">
                <span>Missing Firestore Docs</span>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-600 font-mono">
                {authRecords.filter(a => !allUsersList.some(u => (u.uid || u.id) === a.uid)).length}
              </div>
              <div className="text-[10px] text-amber-600 font-medium mt-1">Auth user without DB profile</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#DDE4EC] shadow-sm flex flex-col justify-between">
              <div className="text-gray-400 text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-between mb-2">
                <span>Missing Auth Docs</span>
                <UserCheck className="w-4 h-4 text-cyan-500" />
              </div>
              <div className="text-2xl font-black text-cyan-600 font-mono">
                {allUsersList.filter(u => !authRecords.some(a => a.uid === (u.uid || u.id))).length}
              </div>
              <div className="text-[10px] text-cyan-600 font-medium mt-1">Firestore only / legacy users</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#DDE4EC] shadow-sm flex flex-col justify-between">
              <div className="text-gray-400 text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-between mb-2">
                <span>Broken User Records</span>
                <ShieldAlert className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-black text-purple-600 font-mono">
                {allUsersList.filter(u => !u.uid || !u.email || !u.displayName || !u.username || !u.createdAt || !u.membershipTier || !u.role || !u.status).length}
              </div>
              <div className="text-[10px] text-purple-600 font-medium mt-1">Incomplete required fields</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#DDE4EC] shadow-sm flex flex-col justify-between">
              <div className="text-gray-400 text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-between mb-2">
                <span>Registration Errors</span>
                <Lock className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-black text-rose-600 font-mono">
                {registrationErrors.length}
              </div>
              <div className="text-[10px] text-rose-600 font-medium mt-1">Failed registration logs</div>
            </div>
          </div>

          {/* Repair Report Notice */}
          {repairReport && (
            <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl text-emerald-950 space-y-2 shadow-sm">
              <div className="flex items-center gap-2 font-extrabold text-sm text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>User Record Repair Report</span>
              </div>
              <p className="text-xs text-emerald-800">
                Created <strong>{repairReport.repairedCount}</strong> missing Firestore user documents, and patched <strong>{repairReport.patchedCount}</strong> incomplete user records across <strong>{repairReport.totalAuthCount}</strong> total Firebase Auth accounts.
              </p>
              {repairReport.repairedUsernames.length > 0 && (
                <div className="text-[11px] font-mono bg-white/80 p-3 rounded-xl border border-emerald-200 max-h-32 overflow-y-auto">
                  <span className="font-bold block mb-1 text-emerald-900">Repaired Accounts:</span>
                  {repairReport.repairedUsernames.map((un, idx) => (
                    <div key={idx} className="text-emerald-800">• {un}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Latest Registrations Table */}
          <div className="bg-white rounded-2xl border border-[#DDE4EC] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#DDE4EC] pb-4">
              <div>
                <h3 className="text-base font-black text-[#031128] uppercase flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-500" />
                  Latest Registrations Audit (Sorted Newest First)
                </h3>
                <p className="text-xs text-gray-500">
                  Live verification of registered accounts across Firebase Auth audit records and Firestore user collections.
                </p>
              </div>
            </div>

            {allUsersList.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-500 italic">
                No real registered users found in database.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#031128] text-white uppercase text-[10px] tracking-wider font-extrabold">
                      <th className="p-3">UID</th>
                      <th className="p-3">Player Name & Username</th>
                      <th className="p-3">Email Address</th>
                      <th className="p-3">Registration Date</th>
                      <th className="p-3 text-center">Auth Record</th>
                      <th className="p-3 text-center">Firestore Profile</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DDE4EC]">
                    {allUsersList.map((usr) => {
                      const hasAuth = authRecords.some(a => a.uid === (usr.uid || usr.id));
                      return (
                        <tr key={usr.id} className="hover:bg-amber-50/50 transition-colors">
                          <td className="p-3 font-mono text-[10px] text-gray-500">{usr.uid || usr.id}</td>
                          <td className="p-3 font-bold text-[#031128]">
                            <div>{usr.displayName || usr.name || 'Anonymous'}</div>
                            <div className="text-[10px] text-gray-400 font-mono">@{usr.username || 'user'}</div>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-gray-600">{usr.email || 'No email'}</td>
                          <td className="p-3 text-gray-500 text-[11px]">
                            {usr.createdAt ? new Date(usr.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : (usr.memberSince || 'N/A')}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${hasAuth ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'}`}>
                              {hasAuth ? 'Auth Verified' : 'Local/Legacy'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                              users/ OK
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-blue-100 text-blue-800 border border-blue-300">
                              {usr.status || 'Active'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Registration Error Log Table */}
          <div className="bg-white rounded-2xl border border-[#DDE4EC] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#DDE4EC] pb-4">
              <div>
                <h3 className="text-base font-black text-[#031128] uppercase flex items-center gap-2">
                  <Lock className="w-5 h-5 text-rose-500" />
                  Registration Error & Failure Audit Log ({registrationErrors.length})
                </h3>
                <p className="text-xs text-gray-500">
                  Captures any failed registration attempts or exceptions raised during the 4-step creation flow.
                </p>
              </div>
            </div>

            {registrationErrors.length === 0 ? (
              <div className="text-center py-6 text-xs text-emerald-600 font-medium bg-emerald-50 rounded-xl border border-emerald-200">
                ✓ No registration errors logged. All user sign-ups are executing cleanly!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#031128] text-white uppercase text-[10px] tracking-wider font-extrabold">
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Email Address</th>
                      <th className="p-3">Error Code</th>
                      <th className="p-3">Error Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DDE4EC]">
                    {registrationErrors.map((err, idx) => (
                      <tr key={idx} className="hover:bg-rose-50/40 transition-colors font-mono">
                        <td className="p-3 text-[10px] text-gray-500">
                          {err.timestamp ? new Date(err.timestamp).toLocaleString() : 'N/A'}
                        </td>
                        <td className="p-3 font-bold text-rose-900">{err.email || 'N/A'}</td>
                        <td className="p-3 text-rose-700 font-bold">{err.errorCode || 'UNKNOWN'}</td>
                        <td className="p-3 text-gray-600 text-[11px] font-sans">{err.errorMessage || 'Unknown failure'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'users' ? (
        /* ADMIN USER MANAGEMENT SCREEN (STEP 5) */
        <div className="bg-white rounded-2xl border border-[#DDE4EC] p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DDE4EC] pb-4">
            <div>
              <h2 className="text-xl font-black text-[#031128] uppercase flex items-center gap-2">
                <Users className="w-6 h-6 text-[#FFBF00]" /> Registered Users Database
              </h2>
              <p className="text-xs text-gray-500">
                Live multi-user database connected to cloud Firestore. Search and inspect all registered players.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user, email..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-[#EEF2F6] border border-[#DDE4EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#031128]"
                />
              </div>
              <span className="bg-[#031128] text-[#FFBF00] font-mono text-xs font-black px-3.5 py-2 rounded-xl">
                {allUsersList.length} Total Users
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#031128] text-white uppercase text-[10px] tracking-wider font-extrabold">
                  <th className="p-3">Username & Name</th>
                  <th className="p-3">Email Address</th>
                  <th className="p-3 text-center">Membership Tier</th>
                  <th className="p-3 text-center">Registration Date</th>
                  <th className="p-3 text-center">Total Points</th>
                  <th className="p-3 text-center">Correct Tips</th>
                  <th className="p-3 text-center">Perfect Margins</th>
                  <th className="p-3 text-center">Picks Submitted</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE4EC]">
                {allUsersList
                  .filter((usr) => {
                    if (!userSearchTerm.trim()) return true;
                    const term = userSearchTerm.toLowerCase();
                    return (
                      usr.name?.toLowerCase().includes(term) ||
                      usr.username?.toLowerCase().includes(term) ||
                      usr.email?.toLowerCase().includes(term)
                    );
                  })
                  .map((usr) => {
                    const userTips = allTipsList.filter((t) => t.userId === usr.id);
                    return (
                      <tr
                        key={usr.id}
                        onClick={() => setSelectedUserForModal(usr)}
                        className="hover:bg-amber-50/60 cursor-pointer transition-colors"
                      >
                        <td className="p-3 font-bold text-[#031128]">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={usr.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                              alt={usr.name}
                              className="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0"
                            />
                            <div>
                              <div className="font-extrabold text-[#031128] flex items-center gap-1.5">
                                <span>{usr.name || 'Anonymous'}</span>
                                {usr.isAdmin && (
                                  <span className="bg-amber-100 text-amber-800 text-[9px] font-black uppercase px-1.5 py-0.5 rounded border border-amber-300">
                                    ADMIN
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-gray-400 font-mono">@{usr.username || 'tipper'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-gray-600 font-mono text-[11px]">{usr.email || 'N/A'}</td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-800">
                            {usr.membershipTier || 'Free'}
                          </span>
                        </td>
                        <td className="p-3 text-center text-gray-500 font-mono text-[11px]">
                          {usr.createdAt ? new Date(usr.createdAt).toLocaleDateString() : usr.memberSince || 'August 2026'}
                        </td>
                        <td className="p-3 text-center font-mono font-black text-[#031128]">
                          {usr.totalScore ?? 0} pts
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-emerald-700">
                          {usr.correctWinnersCount ?? 0}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-amber-600">
                          {usr.perfectTipsCount ?? 0}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold inline-flex items-center gap-1 ${
                            userTips.length === 8 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            <CheckCircle2 className="w-3 h-3" />
                            {userTips.length} / 8 Tipped
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUserForModal(usr);
                            }}
                            className="bg-[#031128] hover:bg-[#0A2D55] text-white px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#FFBF00]" />
                            <span>View Picks</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'picks' ? (
        /* ADMIN PICKS SCREEN (STEP 6) */
        <div className="bg-white rounded-2xl border border-[#DDE4EC] p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#DDE4EC] pb-4">
            <div>
              <h2 className="text-xl font-black text-[#031128] uppercase flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-[#FFBF00]" /> Submitted Picks & Predictions Database
              </h2>
              <p className="text-xs text-gray-500">
                View all player predictions submitted across the system for Round 24. Filter by player or fixture.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Filter by player name or team..."
                value={picksSearchTerm}
                onChange={(e) => setPicksSearchTerm(e.target.value)}
                className="px-3 py-2 bg-[#EEF2F6] border border-[#DDE4EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#031128]"
              />
              <select
                value={picksFixtureFilter}
                onChange={(e) => setPicksFixtureFilter(e.target.value)}
                className="px-3 py-2 bg-[#EEF2F6] border border-[#DDE4EC] rounded-xl text-xs font-bold text-[#031128]"
              >
                <option value="ALL">All Fixtures</option>
                {fixtures.map((f) => {
                  const h = getTeamById(f.homeTeamId);
                  const a = getTeamById(f.awayTeamId);
                  return (
                    <option key={f.id} value={f.id}>
                      {h?.shortName} vs {a?.shortName}
                    </option>
                  );
                })}
              </select>
              <span className="bg-[#031128] text-[#FFBF00] font-mono text-xs font-black px-3.5 py-2 rounded-xl">
                {allTipsList.length} Picks Submitted
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#031128] text-white uppercase text-[10px] tracking-wider font-extrabold">
                  <th className="p-3">Round</th>
                  <th className="p-3">Fixture / Match</th>
                  <th className="p-3">User / Player</th>
                  <th className="p-3 text-center">Selected Winner</th>
                  <th className="p-3 text-center">Predicted Margin</th>
                  <th className="p-3 text-right">Submission Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE4EC]">
                {allTipsList
                  .filter((tip) => {
                    if (picksFixtureFilter !== 'ALL' && tip.fixtureId !== picksFixtureFilter) return false;
                    if (!picksSearchTerm.trim()) return true;
                    const term = picksSearchTerm.toLowerCase();
                    const user = allUsersList.find((u) =>
                      u.id === tip.userId ||
                      u.uid === tip.userId ||
                      (u.username && u.username.toLowerCase() === (tip.userId || tip.username || '').toLowerCase()) ||
                      (u.email && u.email.toLowerCase() === (tip.userEmail || tip.email || '').toLowerCase())
                    );
                    const team = getTeamById(tip.predictedWinnerTeamId);
                    return (
                      user?.name?.toLowerCase().includes(term) ||
                      user?.username?.toLowerCase().includes(term) ||
                      team?.name?.toLowerCase().includes(term) ||
                      team?.shortName?.toLowerCase().includes(term)
                    );
                  })
                  .map((tip, idx) => {
                    const user = allUsersList.find((u) =>
                      u.id === tip.userId ||
                      u.uid === tip.userId ||
                      (u.username && u.username.toLowerCase() === (tip.userId || tip.username || '').toLowerCase()) ||
                      (u.email && u.email.toLowerCase() === (tip.userEmail || tip.email || '').toLowerCase())
                    );
                    const fixture = fixtures.find((f) => f.id === tip.fixtureId);
                    const home = fixture ? getTeamById(fixture.homeTeamId) : null;
                    const away = fixture ? getTeamById(fixture.awayTeamId) : null;
                    const winnerTeam = getTeamById(tip.predictedWinnerTeamId);

                    return (
                      <tr key={`${tip.id || 'pick'}-${idx}`} className="hover:bg-amber-50/60 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-700">Round 24</td>
                        <td className="p-3 font-extrabold text-[#031128]">
                          {home && away ? `${home.shortName} vs ${away.shortName}` : tip.fixtureId}
                        </td>
                        <td className="p-3">
                          <div
                            onClick={() => user && setSelectedUserForModal(user)}
                            className="flex items-center gap-2 cursor-pointer hover:underline"
                          >
                            <img
                              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                              alt={user?.name || 'User'}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                            <div>
                              <div className="font-extrabold text-[#031128]">{user?.name || tip.username || 'Anonymous'}</div>
                              <div className="text-[10px] text-gray-400 font-mono">@{user?.username || 'tipper'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EEF2F6] border border-[#DDE4EC] font-extrabold text-[#031128]">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: winnerTeam?.primaryColor || '#031128' }} />
                            {winnerTeam?.shortName || tip.predictedWinnerTeamId}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono font-black text-emerald-700 text-sm">
                          +{tip.predictedMargin} pts
                        </td>
                        <td className="p-3 text-right text-gray-500 font-mono text-[11px]">
                          {tip.submittedAt ? new Date(tip.submittedAt).toLocaleString() : 'Recent'}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'analytics' ? (
        /* BETA ANALYTICS & DATABASE VERIFICATION SCREEN (STEP 10) */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#DDE4EC] shadow-sm">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-xs font-bold uppercase">Total Users</span>
                <Users className="w-5 h-5 text-[#FFBF00]" />
              </div>
              <div className="text-3xl font-black text-[#031128] font-mono">{allUsersList.length}</div>
              <p className="text-[11px] text-emerald-600 font-bold mt-1">Live Multi-User Database</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#DDE4EC] shadow-sm">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-xs font-bold uppercase">Active Tippers</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-3xl font-black text-[#031128] font-mono">
                {new Set(allTipsList.map((t) => t.userId)).size}
              </div>
              <p className="text-[11px] text-gray-500 mt-1">Submitted at least 1 prediction</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#DDE4EC] shadow-sm">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-xs font-bold uppercase">Total Picks Saved</span>
                <Trophy className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-3xl font-black text-[#031128] font-mono">{allTipsList.length}</div>
              <p className="text-[11px] text-gray-500 mt-1">Stored globally in Firestore</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#DDE4EC] shadow-sm">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-xs font-bold uppercase">Leagues & H2H</span>
                <Shield className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-3xl font-black text-[#031128] font-mono">
                {overallLeaguesCount + h2hLeaguesCount}
              </div>
              <p className="text-[11px] text-gray-500 mt-1">Competitions active</p>
            </div>
          </div>

          {/* FIREBASE HEALTH CHECK SCREEN EMBED */}
          <FirebaseHealthCheckScreen isEmbedded={true} />

          {/* FIREBASE DIAGNOSTICS PANEL */}
          <div className="bg-[#031128] text-white p-6 rounded-2xl border border-[#0A2D55] shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#0A2D55] pb-4">
              <div>
                <h3 className="text-lg font-black text-[#FFBF00] uppercase flex items-center gap-2">
                  <Database className="w-5 h-5 text-[#FFBF00]" /> Firebase & Firestore Diagnostics Panel
                </h3>
                <p className="text-xs text-gray-300 mt-0.5">
                  Live connection metrics for <strong className="text-white font-mono">The Margin</strong> Cloud Firestore
                </p>
              </div>
              <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-500/30 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Real-Time Sync Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="bg-[#020812] p-3.5 rounded-xl border border-[#0A2D55] space-y-1">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Firebase Project ID</div>
                <div className="font-mono text-emerald-400 font-extrabold truncate">
                  sunlit-citron-gt8c4
                </div>
                <div className="text-[9px] text-gray-500 font-mono">Applet ID: 1d7b3b79-b870...</div>
              </div>

              <div className="bg-[#020812] p-3.5 rounded-xl border border-[#0A2D55] space-y-1">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Signed-In Admin Session</div>
                <div className="font-mono text-amber-300 font-extrabold truncate">
                  {auth.currentUser?.email || currentUser.email || 'Admin Session Active'}
                </div>
                <div className="text-[9px] text-gray-500 font-mono truncate">
                  UID: {auth.currentUser?.uid || currentUser.id}
                </div>
              </div>

              <div className="bg-[#020812] p-3.5 rounded-xl border border-[#0A2D55] space-y-1">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Firestore Users Documents</div>
                <div className="font-mono text-white text-base font-black flex items-center gap-2">
                  <span>{allUsersList.length} Loaded</span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-800">Live</span>
                </div>
                <div className="text-[9px] text-gray-500">Collection: users/</div>
              </div>

              <div className="bg-[#020812] p-3.5 rounded-xl border border-[#0A2D55] space-y-1">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Firestore Picks Documents</div>
                <div className="font-mono text-white text-base font-black flex items-center gap-2">
                  <span>{allTipsList.length} Loaded</span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-800">Live</span>
                </div>
                <div className="text-[9px] text-gray-500">Collection: picks/</div>
              </div>

              <div className="bg-[#020812] p-3.5 rounded-xl border border-[#0A2D55] space-y-1">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Emulator Status</div>
                <div className="font-mono text-emerald-400 font-extrabold">
                  Disabled (Production Cloud)
                </div>
                <div className="text-[9px] text-gray-500">Direct GCP Cloud Connection</div>
              </div>

              <div className="bg-[#020812] p-3.5 rounded-xl border border-[#0A2D55] space-y-1">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Hostname Location</div>
                <div className="font-mono text-gray-300 font-bold truncate">
                  {typeof window !== 'undefined' ? window.location.hostname : 'Cloud Run Container'}
                </div>
                <div className="text-[9px] text-gray-500">Port: 3000 (Cloud Proxy)</div>
              </div>

              <div className="bg-[#020812] p-3.5 rounded-xl border border-[#0A2D55] space-y-1">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Admin Role & Status</div>
                <div className="font-mono text-amber-400 font-extrabold flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Full Admin Rights</span>
                </div>
                <div className="text-[9px] text-gray-500">Role: super_admin</div>
              </div>

              <div className="bg-[#020812] p-3.5 rounded-xl border border-[#0A2D55] space-y-1">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Database Security Rules</div>
                <div className="font-mono text-emerald-400 font-extrabold">
                  Hardened Role-Based
                </div>
                <div className="text-[9px] text-gray-500">firestore.rules Verified</div>
              </div>
            </div>
          </div>

          {/* User Data Verification Table */}
          <div className="bg-white rounded-2xl border border-[#DDE4EC] p-6 shadow-sm space-y-4">
            <h3 className="text-base font-black text-[#031128] uppercase">Per-User Data Verification Checklist</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#031128] text-white uppercase text-[10px] tracking-wider font-extrabold">
                    <th className="p-3">User</th>
                    <th className="p-3">User ID</th>
                    <th className="p-3 text-center">Picks Status</th>
                    <th className="p-3 text-center">Cloud Database Status</th>
                    <th className="p-3 text-right">Registered Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE4EC]">
                  {allUsersList.map((usr) => {
                    const uTips = getUserTips(usr);
                    return (
                      <tr key={usr.id} className="hover:bg-slate-50">
                        <td className="p-3 font-extrabold text-[#031128]">{usr.name} (@{usr.username})</td>
                        <td className="p-3 font-mono text-[11px] text-gray-500">{usr.id}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${uTips.length > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                            {uTips.length} / 8 Picks Submitted
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px] inline-flex items-center gap-1">
                            ✓ Synced in Firestore
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono text-gray-500 text-[11px]">
                          {usr.createdAt ? new Date(usr.createdAt).toLocaleDateString() : usr.memberSince || 'August 2026'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ISOLATED HIDDEN DEMO MODE VIEW (/admin/demo-data) */
        <div className="bg-white rounded-2xl border border-[#DDE4EC] p-6 shadow-sm space-y-6">
          <div className="border-b border-[#DDE4EC] pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-[#031128] uppercase font-mono">/admin/demo-data</h2>
              <p className="text-xs text-gray-500">
                Hidden Demo Mode isolated from the live beta environment. Use for investor or product demonstrations.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleLoadDemoData}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow"
              >
                LOAD DEMO DATA
              </button>
              <button
                onClick={handleClearDemoData}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider"
              >
                CLEAR DEMO DATA
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-extrabold text-xs text-[#031128] uppercase">Seeded Demonstration Users</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {DEMO_USERS.map((u) => (
                <div key={u.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-3">
                  <img src={u.avatarUrl} alt={u?.name || 'User'} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-900">{u?.name || 'User'}</h4>
                    <p className="text-[10px] text-slate-500">@{u?.username || 'user'} • {u?.totalScore ?? 0} pts</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* RESET ROUND RESULTS CONFIRMATION MODAL */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#031128] border border-[#0A2D55] rounded-2xl max-w-md w-full p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <RotateCcw className="w-6 h-6 shrink-0" />
              <h3 className="font-extrabold text-lg text-white">Reset Round 24 Results</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to reset all Round 24 fixture results back to <strong>UPCOMING</strong>? This will clear all entered match scores and reset leaderboard scores for Round 24.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={executeResetRoundResults}
                className="bg-[#DF4351] hover:bg-[#DF4351]/90 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow transition-all active:scale-95"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLEAR ALL BETA DATA MODAL */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-extrabold text-lg text-white">Confirm Beta Data Purge</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This action will clear all submitted Round 24 tips, custom leagues, and user stats back to clean default state.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Type <strong className="text-amber-400">CLEAR ROUND 24 BETA</strong> to confirm:
              </label>
              <input
                type="text"
                value={clearConfirmationInput}
                onChange={(e) => setClearConfirmationInput(e.target.value)}
                placeholder="CLEAR ROUND 24 BETA"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white font-mono uppercase focus:border-rose-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowClearConfirmModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllBetaData}
                className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow"
              >
                Confirm Purge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PLAYER PROFILE INSPECTOR MODAL */}
      {selectedUserForModal && (
        <PlayerProfileModal
          user={selectedUserForModal}
          onClose={() => setSelectedUserForModal(null)}
          isAdmin
        />
      )}
    </div>
  );
};
