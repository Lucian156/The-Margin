/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { ensureUserProfile } from './services/authService';
import { getCurrentUser, getUsers, getTips, initializeStorage, syncFirestoreDataToStorage, setCurrentUser as saveCurrentUserStorage } from './services/storageService';
import { subscribeAllUsersFromFirestore, subscribeAllTipsFromFirestore } from './services/firestoreService';
import { User, Tip } from './types';
import { SEEDED_USERS } from './data/seedData';
import { Header } from './components/Header';
import { MobileNav } from './components/MobileNav';
import { RegisterModal } from './components/RegisterModal';
import { RegisterScreen } from './components/RegisterScreen';
import { RulesSummaryModal } from './components/RulesSummaryModal';
import { FeedbackModal } from './components/FeedbackModal';
import { MessageSquare } from 'lucide-react';
import { HomeView } from './views/HomeView';
import { AdminView } from './views/AdminView';
import { AiCentreView } from './views/AiCentreView';
import { AutoPicksView } from './views/AutoPicksView';
import { DuelsView } from './views/DuelsView';
import { LadderView } from './views/LadderView';
import { LeaguesView } from './views/LeaguesView';
import { LiveCentreView } from './views/LiveCentreView';
import { MembershipsView } from './views/MembershipsView';
import { PartnerHubView } from './views/PartnerHubView';
import { ProfileView } from './views/ProfileView';
import { RulesView } from './views/RulesView';
import { TippingView } from './views/TippingView';

export default function App() {
  initializeStorage();

  const [activeTab, setActiveTab] = useState<string>('home');
  const [currentUser, setCurrentUser] = useState<User>(() => getCurrentUser());
  const [showRegisterScreen, setShowRegisterScreen] = useState<boolean>(() => {
    // Show register screen by default if user hasn't completed onboarding yet or if requested
    return !localStorage.getItem('the_margin_registered_v1');
  });
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showRulesSummaryModal, setShowRulesSummaryModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // 1. Listen for Firebase Auth changes and ensure profile safety
    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const profile = await ensureUserProfile(fbUser);
          setCurrentUser(profile);
          saveCurrentUserStorage(profile);
          setShowRegisterScreen(false);
          localStorage.setItem('the_margin_registered_v1', 'true');
        } catch (err) {
          console.warn('[App] ensureUserProfile error:', err);
        }
      }
    });

    // 2. Initial fetch sync
    syncFirestoreDataToStorage().then(() => {
      setCurrentUser(getCurrentUser());
      setRefreshTrigger((prev) => prev + 1);
    });

    // 3. Real-time Firestore users listener
    const unsubUsers = subscribeAllUsersFromFirestore((remoteUsers) => {
      if (remoteUsers && remoteUsers.length > 0) {
        const localUsers = getUsers();
        const userMap = new Map<string, User>();
        SEEDED_USERS.forEach((su) => userMap.set(su.id, su));
        localUsers.forEach((u) => { if (u && u.id) userMap.set(u.id, u); });
        remoteUsers.forEach((u) => { if (u && u.id) userMap.set(u.id, u); });
        localStorage.setItem('the_margin_users', JSON.stringify(Array.from(userMap.values())));
        setRefreshTrigger((prev) => prev + 1);
      }
    });

    // 4. Real-time Firestore tips listener
    const unsubTips = subscribeAllTipsFromFirestore((remoteTips) => {
      if (remoteTips && remoteTips.length > 0) {
        const localTips = getTips();
        const tipMap = new Map<string, Tip>();
        localTips.forEach((t) => {
          if (t && (t.userId || (t as any).uid) && t.fixtureId) {
            const uid = t.userId || (t as any).uid;
            tipMap.set(`${uid}_${t.fixtureId}`, { ...t, userId: uid });
          }
        });
        remoteTips.forEach((t) => {
          if (t && (t.userId || (t as any).uid) && t.fixtureId) {
            const uid = t.userId || (t as any).uid;
            tipMap.set(`${uid}_${t.fixtureId}`, { ...t, userId: uid });
          }
        });
        localStorage.setItem('the_margin_tips', JSON.stringify(Array.from(tipMap.values())));
        setRefreshTrigger((prev) => prev + 1);
      }
    });

    return () => {
      unsubAuth();
      unsubUsers();
      unsubTips();
    };
  }, []);

  const handleUserRegistered = (user: User) => {
    localStorage.setItem('the_margin_registered_v1', 'true');
    setCurrentUser(user);
    setShowRegisterScreen(false);
    setShowRegisterModal(false);
    setShowRulesSummaryModal(true);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleUserSwitch = (user: User) => {
    setCurrentUser(user);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleRefreshData = () => {
    setCurrentUser(getCurrentUser());
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleLogout = () => {
    localStorage.removeItem('the_margin_registered_v1');
    localStorage.removeItem('the_margin_current_user');
    setShowRegisterScreen(true);
  };

  if (showRegisterScreen) {
    return (
      <RegisterScreen
        onRegistered={handleUserRegistered}
        onSkipToGuest={() => {
          localStorage.setItem('the_margin_registered_v1', 'true');
          setShowRegisterScreen(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#EEF2F6] text-[#111D31] font-sans flex flex-col antialiased selection:bg-[#FFBF00] selection:text-[#031128]">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onUserSwitch={handleUserSwitch}
        onOpenRegisterModal={() => setShowRegisterScreen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
        {activeTab === 'home' && (
          <HomeView
            key={refreshTrigger}
            currentUser={currentUser}
            setActiveTab={setActiveTab}
          />
        )}
        {activeTab === 'tips' && (
          <TippingView
            key={refreshTrigger}
            currentUser={currentUser}
            setActiveTab={setActiveTab}
          />
        )}
        {activeTab === 'live' && <LiveCentreView key={refreshTrigger} currentUser={currentUser} />}
        {activeTab === 'ladder' && <LadderView key={refreshTrigger} currentUser={currentUser} />}
        {activeTab === 'leagues' && <LeaguesView key={refreshTrigger} currentUser={currentUser} />}
        {activeTab === 'duels' && (
          <DuelsView
            key={refreshTrigger}
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        )}
        {activeTab === 'profile' && (
          <ProfileView
            key={refreshTrigger}
            currentUser={currentUser}
            onUserUpdate={(u) => handleUserSwitch(u)}
            setActiveTab={setActiveTab}
            onLogout={handleLogout}
          />
        )}
        {activeTab === 'memberships' && <MembershipsView setActiveTab={setActiveTab} />}
        {activeTab === 'auto-picks' && <AutoPicksView />}
        {activeTab === 'ai-centre' && <AiCentreView />}
        {activeTab === 'partner-hub' && <PartnerHubView />}
        {activeTab === 'rules' && <RulesView key={refreshTrigger} />}
        {activeTab === 'admin' && (
          <AdminView
            key={refreshTrigger}
            currentUser={currentUser}
            onRefreshData={handleRefreshData}
          />
        )}
      </main>

      {/* Sticky Mobile Bottom Navigation */}
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} />

      {/* Footer */}
      <footer className="bg-[#031128] text-gray-400 border-t border-[#0A2D55] py-8 mb-14 lg:mb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-white text-base tracking-wider">THE MARGIN</span>
              <span className="bg-[#FFBF00] text-[#031128] text-[9px] font-black px-1.5 py-0.5 rounded">
                NRL TIPPING
              </span>
            </div>
            <p className="text-gray-400 text-[11px] mt-1">
              Pick the winner. Predict the margin. Lowest score wins.
            </p>
          </div>

          <div className="flex items-center gap-4 text-gray-300 font-medium">
            <button onClick={() => setActiveTab('rules')} className="hover:text-[#FFBF00]">
              Official Rules
            </button>
            <span>•</span>
            <button onClick={() => setActiveTab('ladder')} className="hover:text-[#FFBF00]">
              Leaderboard
            </button>
            {currentUser?.isAdmin && (
              <>
                <span>•</span>
                <button onClick={() => setActiveTab('admin')} className="hover:text-[#FFBF00]">
                  Simulation Panel
                </button>
              </>
            )}
          </div>

          <div className="text-right text-[11px] text-gray-400">
            © {new Date().getFullYear()} The Margin. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Floating Give Feedback Button */}
      <button
        onClick={() => setShowFeedbackModal(true)}
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 transition-all hover:scale-105 border border-white/20"
      >
        <MessageSquare className="w-4 h-4" />
        <span>Give Feedback</span>
      </button>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        currentPage={activeTab}
      />

      {/* Register Profile Modal */}
      {showRegisterModal && (
        <RegisterModal
          onClose={() => setShowRegisterModal(false)}
          onRegistered={(u) => {
            handleUserRegistered(u);
          }}
        />
      )}

      {/* Rules Summary Post-Registration Modal */}
      <RulesSummaryModal
        isOpen={showRulesSummaryModal}
        onClose={() => setShowRulesSummaryModal(false)}
        userName={currentUser?.name}
      />
    </div>
  );
}
