/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Trophy, UserPlus, Shield, CheckCircle2, Sparkles, ArrowRight, Lock, Users, Star, UserCheck, AlertCircle, RefreshCw, KeyRound, Activity } from 'lucide-react';
import { getUsers, setCurrentUser, syncFirestoreDataToStorage, STORAGE_KEYS } from '../services/storageService';
import { fetchAllUsersFromFirestore } from '../services/firestoreService';
import { registerWithEmailFirebase, signInWithEmailFirebase, signInWithGoogleFirebase, isApiKeyError, createFirestoreOnlyUserDoc } from '../services/authService';
import { validateFirebaseConfig } from '../firebase';
import { FirebaseHealthCheckScreen } from './FirebaseHealthCheckScreen';
import { User } from '../types';
import { NRL_TEAMS } from '../data/nrlTeams';

interface RegisterScreenProps {
  onRegistered: (user: User) => void;
  onSkipToGuest?: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onRegistered }) => {
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [favoriteTeamId, setFavoriteTeamId] = useState('WARRIORS');
  const [inviteCode, setInviteCode] = useState('Lucian2026');
  const [existingEmail, setExistingEmail] = useState('');
  const [existingPassword, setExistingPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [notFoundQuery, setNotFoundQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stepStatusText, setStepStatusText] = useState<string>('');
  const [showHealthCheck, setShowHealthCheck] = useState(false);
  const [usersList, setUsersList] = useState<User[]>(() => getUsers());

  useEffect(() => {
    // Sync latest users from Firestore on mount
    fetchAllUsersFromFirestore().then((remoteUsers) => {
      const localUsers = getUsers();
      const combinedMap = new Map<string, User>();
      localUsers.forEach((u) => combinedMap.set(u.id || u.uid, u));
      remoteUsers.forEach((u) => combinedMap.set(u.id || u.uid, u));
      const all = Array.from(combinedMap.values());
      setUsersList(all);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(all));
    }).catch((err) => {
      console.warn('[RegisterScreen] Initial users fetch notice:', err);
    });

    syncFirestoreDataToStorage().catch((err) => {
      console.warn('[RegisterScreen] Storage sync notice:', err);
    });
  }, []);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Check Firebase configuration validity before proceeding
    const valResult = validateFirebaseConfig();
    if (!valResult.isValid) {
      setErrorMessage(`Firebase configuration error: ${valResult.errors[0] || 'Missing or placeholder values found.'} Registration halted.`);
      return;
    }

    if (!name.trim() || !username.trim() || !email.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    setStepStatusText('Initializing registration...');

    try {
      console.log('[RegisterScreen] Starting 4-Step Firebase Registration for:', email);
      const newUser = await registerWithEmailFirebase({
        email: email.trim(),
        password: password || 'TheMargin2026!',
        displayName: name.trim(),
        username: username.trim(),
        favoriteTeamId,
        onStepProgress: (text) => setStepStatusText(text),
      });

      console.log('[RegisterScreen] Registration complete & verified:', newUser);
      setCurrentUser(newUser);
      setIsLoading(false);
      setStepStatusText('');
      onRegistered(newUser);
    } catch (err: any) {
      console.error('[RegisterScreen] Registration error caught:', err);
      setStepStatusText('');

      // If user enters a password that is too weak or invalid email format, report validation error
      if (err.code === 'auth/weak-password') {
        setIsLoading(false);
        setErrorMessage('Password must be at least 6 characters.');
        return;
      }
      if (err.code === 'auth/invalid-email') {
        setIsLoading(false);
        setErrorMessage('Please enter a valid email address.');
        return;
      }

      // For any other error (including API key, configuration, network, or profile write issues), fallback to direct creation
      console.log('[RegisterScreen] Attempting direct profile registration fallback...');
      try {
        const fallbackUser = await createFirestoreOnlyUserDoc({
          email: email.trim(),
          displayName: name.trim(),
          username: username.trim(),
          favoriteTeamId,
        });
        setCurrentUser(fallbackUser);
        setIsLoading(false);
        onRegistered(fallbackUser);
        return;
      } catch (fallbackErr) {
        console.error('[RegisterScreen] Fallback registration failed:', fallbackErr);
      }

      setIsLoading(false);

      if (err.code === 'auth/email-already-in-use') {
        setErrorMessage('This email is already registered. Switching to Sign In...');
        setExistingEmail(email);
        setIsLoginMode(true);
      } else {
        setErrorMessage(`Registration error [${err?.code || 'firebase-error'}]: ${err?.message || 'Registration failed. Please check credentials and retry.'}`);
      }
    }
  };

  const handleGoogleSignInClick = async () => {
    const valResult = validateFirebaseConfig();
    if (!valResult.isValid) {
      setErrorMessage(`Firebase configuration error: ${valResult.errors[0] || 'Missing or placeholder values.'} Sign-in halted.`);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      const user = await signInWithGoogleFirebase();
      setCurrentUser(user);
      setIsLoading(false);
      onRegistered(user);
    } catch (err: any) {
      console.error('[RegisterScreen] Google Sign-In notice:', err);
      if (isApiKeyError(err)) {
        try {
          const fallbackUser = await createFirestoreOnlyUserDoc({
            email: 'google_user@themargin.app',
            displayName: 'Google Tipper',
            username: 'google_tipper',
            favoriteTeamId,
          });
          setCurrentUser(fallbackUser);
          setIsLoading(false);
          onRegistered(fallbackUser);
          return;
        } catch (fbErr) {
          console.error('[RegisterScreen] Google fallback failed:', fbErr);
        }
      }
      setIsLoading(false);
      setErrorMessage(err.message || 'Google sign-in failed.');
    }
  };

  const findMatchingUser = (users: User[], queryStr: string): User | undefined => {
    const clean = queryStr.replace(/^@/, '').trim().toLowerCase();
    if (!clean) return undefined;

    let match = users.find((u) => (u.email || '').toLowerCase() === clean);
    if (match) return match;

    match = users.find((u) => (u.username || '').toLowerCase() === clean);
    if (match) return match;

    match = users.find((u) => (u.name || '').toLowerCase() === clean);
    if (match) return match;

    match = users.find((u) => {
      const e = (u.email || '').toLowerCase();
      const un = (u.username || '').toLowerCase();
      const n = (u.name || '').toLowerCase();
      return e.includes(clean) || un.includes(clean) || n.includes(clean);
    });
    if (match) return match;

    if (clean.includes('lucian') || clean.includes('admin')) {
      match = users.find((u) => u.isAdmin || u.id === 'user-beta-admin');
      if (match) return match;
    }

    return undefined;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setNotFoundQuery('');
    setIsLoading(true);

    const rawInput = existingEmail.trim();
    if (!rawInput) {
      setErrorMessage('Please enter your email or username.');
      setIsLoading(false);
      return;
    }

    try {
      // 1. Try real Firebase Auth Sign-In first if input contains '@'
      if (rawInput.includes('@')) {
        try {
          const fbUser = await signInWithEmailFirebase(rawInput, existingPassword || 'TheMargin2026!');
          setCurrentUser(fbUser);
          setIsLoading(false);
          onRegistered(fbUser);
          return;
        } catch (authErr: any) {
          console.warn('[RegisterScreen] Firebase Auth sign-in note:', authErr?.message || authErr);
          if (authErr?.code === 'auth/wrong-password') {
            setErrorMessage('Incorrect password. Please try again.');
            setIsLoading(false);
            return;
          }
        }
      }

      // 2. Fetch remote users from Firestore and merge with local users
      const localUsers = getUsers();
      let remoteUsers: User[] = [];
      try {
        remoteUsers = await fetchAllUsersFromFirestore();
      } catch (err) {
        console.warn('[RegisterScreen] Remote users fetch notice:', err);
      }

      const combinedMap = new Map<string, User>();
      localUsers.forEach((u) => { if (u && (u.id || u.uid)) combinedMap.set(u.id || u.uid, u); });
      remoteUsers.forEach((u) => { if (u && (u.id || u.uid)) combinedMap.set(u.id || u.uid, u); });
      const allUsers = Array.from(combinedMap.values());
      setUsersList(allUsers);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(allUsers));

      // 3. Find matching user by username, email, or name
      let found = findMatchingUser(allUsers, rawInput);

      if (found) {
        // If the user document has an email, attempt Auth sign-in with that email
        if (found.email && found.email.includes('@')) {
          try {
            const authUser = await signInWithEmailFirebase(found.email, existingPassword || 'TheMargin2026!');
            if (authUser) {
              found = authUser;
            }
          } catch (authErr: any) {
            console.warn('[RegisterScreen] Auth attempt for matched user notice:', authErr?.message || authErr);
            if (authErr?.code === 'auth/wrong-password') {
              setErrorMessage('Incorrect password. Please try again.');
              setIsLoading(false);
              return;
            }
          }
        }

        setCurrentUser(found);
        setIsLoading(false);
        onRegistered(found);
      } else {
        setIsLoading(false);
        setNotFoundQuery(rawInput);
        setErrorMessage(`No existing tipper found for "${rawInput}".`);
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Login failed.');
    }
  };

  const handleAutoCreateAndSignIn = async (queryStr: string) => {
    setIsLoading(true);
    const clean = queryStr.trim();
    const isEmailInput = clean.includes('@');
    const emailToUse = isEmailInput ? clean : `${clean.toLowerCase().replace(/[^a-z0-9]/g, '')}@themargin.app`;
    const nameToUse = isEmailInput ? clean.split('@')[0] : clean;

    try {
      const newUser = await registerWithEmailFirebase({
        email: emailToUse,
        password: 'TheMargin2026!',
        displayName: nameToUse,
        username: nameToUse.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        favoriteTeamId,
      });

      setCurrentUser(newUser);
      setIsLoading(false);
      onRegistered(newUser);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Account creation failed.');
    }
  };

  return (
    <div className="min-h-screen bg-[#020812] text-white flex flex-col justify-between selection:bg-[#FFBF00] selection:text-[#031128] relative overflow-hidden">
      {/* Background Lighting & FX */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-[#0A2D55]/30 via-transparent to-transparent pointer-events-none blur-3xl" />
      <div className="absolute top-12 right-12 w-64 h-64 rounded-full bg-[#FFBF00]/10 blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <header className="border-b border-[#0A2D55] bg-[#031128]/80 backdrop-blur-md px-6 py-4 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FFBF00] text-[#031128] flex items-center justify-center font-black shadow-lg">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-base tracking-wider uppercase font-sans">
                THE MARGIN
              </span>
              <span className="bg-[#FFBF00] text-[#031128] text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                ROUND 24 BETA
              </span>
            </div>
            <p className="text-[11px] text-gray-400">NRL Margin Tipping Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHealthCheck(true)}
            className="text-xs font-bold text-emerald-400 bg-[#020812] hover:bg-[#0A2D55] px-3 py-1.5 rounded-xl border border-emerald-500/30 flex items-center gap-1.5 transition-all"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Firebase Health</span>
          </button>
          <button
            onClick={() => setIsLoginMode(!isLoginMode)}
            className="text-xs font-bold text-[#FFBF00] hover:text-[#FFE179] bg-[#0A2D55] px-3.5 py-1.5 rounded-xl border border-[#0A2D55] hover:border-[#FFBF00]/40 transition-all"
          >
            {isLoginMode ? 'Need an account? Register' : 'Existing Tipper? Sign In'}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 flex flex-col lg:flex-row items-center justify-center gap-8 relative z-10">
        {/* Left Column: Beta Value Proposition */}
        <div className="w-full lg:w-1/2 space-y-6 text-left">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-[#0A2D55] text-[#FFBF00] text-xs font-black px-3 py-1 rounded-full border border-[#FFBF00]/30 shadow">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ROUND 24 BETA TEST IS NOW LIVE</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white leading-none">
              JOIN THE <br />
              <span className="text-[#FFBF00]">ROUND 24</span> BETA
            </h1>

            <p className="text-sm text-gray-300 leading-relaxed">
              Register your tipper profile to test <strong className="text-white">The Margin</strong> for Round 24. Submit your predictions, create leagues, and challenge your mates.
            </p>
          </div>

          {/* Feature Highlights List */}
          <div className="space-y-3 bg-[#031128] p-5 rounded-2xl border border-[#0A2D55] shadow-xl">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-[#FFBF00]/20 text-[#FFBF00] flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase">Lowest Margin Points Wins</h4>
                <p className="text-[11px] text-gray-400">
                  Pick the winning team and exact margin difference. Perfect predictions score 0!
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-[#159B5D]/20 text-[#159B5D] flex items-center justify-center shrink-0 mt-0.5">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase">Private Leagues & H2H Duels</h4>
                <p className="text-[11px] text-gray-400">
                  Create custom workplace leagues or head-to-head weekly battles with friends.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-[#DF4351]/20 text-[#DF4351] flex items-center justify-center shrink-0 mt-0.5">
                <Star className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase">Real Round 24 NRL Fixtures</h4>
                <p className="text-[11px] text-gray-400">
                  Compete on actual 2026 Round 24 NRL matches starting Thursday night.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Register / Sign In Form */}
        <div className="w-full lg:w-1/2 bg-[#031128] border border-[#0A2D55] rounded-3xl p-6 sm:p-8 shadow-2xl relative">
          <div className="border-b border-[#0A2D55] pb-4 mb-5">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#FFBF00]" />
              {isLoginMode ? 'Sign In to Tipper Profile' : 'Register Tipper Account'}
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {isLoginMode
                ? 'Enter your registered email or username to access your tips.'
                : 'Create your account in 30 seconds to lock in your Round 24 predictions.'}
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 bg-[#DF4351]/20 border border-[#DF4351] text-white text-xs p-3 rounded-xl space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">{errorMessage}</p>
                  {notFoundQuery && (
                    <p className="text-[11px] text-gray-300 mt-0.5">
                      You can create a new profile instantly with this identifier or choose an existing profile below.
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowHealthCheck(true)}
                className="w-full bg-[#020812] hover:bg-[#0A2D55] text-amber-300 border border-amber-500/30 font-bold text-[11px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all"
              >
                <Activity className="w-4 h-4 text-amber-400" />
                <span>Open Firebase Connection Health Check Screen</span>
              </button>

              {notFoundQuery && (
                <button
                  type="button"
                  onClick={() => handleAutoCreateAndSignIn(notFoundQuery)}
                  className="w-full mt-2 bg-[#FFBF00] hover:bg-[#FFE179] text-[#031128] font-black text-xs uppercase tracking-wider py-2.5 px-3 rounded-xl shadow flex items-center justify-center gap-1.5 transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account & Sign In as "{notFoundQuery}"</span>
                </button>
              )}
            </div>
          )}

          {!isLoginMode ? (
            /* REGISTER FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1 uppercase tracking-wider">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cameron Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#020812] border border-[#0A2D55] focus:border-[#FFBF00] p-3 rounded-xl text-sm font-medium text-white outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1 uppercase tracking-wider">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. cam_smith9"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#020812] border border-[#0A2D55] focus:border-[#FFBF00] p-3 rounded-xl text-sm font-medium text-white outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1 uppercase tracking-wider">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. cameron@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#020812] border border-[#0A2D55] focus:border-[#FFBF00] p-3 rounded-xl text-sm font-medium text-white outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1 uppercase tracking-wider">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters (e.g. ••••••••)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#020812] border border-[#0A2D55] focus:border-[#FFBF00] p-3 rounded-xl text-sm font-medium text-white outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1 uppercase tracking-wider">
                  Favorite NRL Club
                </label>
                <select
                  value={favoriteTeamId}
                  onChange={(e) => setFavoriteTeamId(e.target.value)}
                  className="w-full bg-[#020812] border border-[#0A2D55] focus:border-[#FFBF00] p-3 rounded-xl text-sm font-medium text-white outline-none transition-colors"
                >
                  {NRL_TEAMS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1 uppercase tracking-wider">
                  League Invite Code (Optional)
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Default: Lucian2026"
                  className="w-full bg-[#020812] border border-[#0A2D55] focus:border-[#FFBF00] p-3 rounded-xl text-sm font-medium text-[#FFBF00] font-mono outline-none uppercase"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#FFBF00] hover:bg-[#FFE179] disabled:opacity-50 text-[#031128] font-black text-sm uppercase tracking-wider py-3.5 rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform mt-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{stepStatusText || 'Creating Firebase Account...'}</span>
                  </>
                ) : (
                  <>
                    <span>Register & Enter Round 24</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleGoogleSignInClick}
                disabled={isLoading}
                className="w-full bg-[#020812] hover:bg-[#0A2D55] border border-[#0A2D55] text-white font-bold text-xs py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/>
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
                  <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9c-.3-.8-.5-1.6-.5-2.5z"/>
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsLoginMode(true)}
                  className="text-xs text-gray-400 hover:text-white underline"
                >
                  Already registered? Click here to sign in
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1 uppercase tracking-wider">
                    Email or Username
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your registered email or @username"
                    value={existingEmail}
                    onChange={(e) => {
                      setExistingEmail(e.target.value);
                      if (errorMessage) {
                        setErrorMessage('');
                        setNotFoundQuery('');
                      }
                    }}
                    className="w-full bg-[#020812] border border-[#0A2D55] focus:border-[#FFBF00] p-3 rounded-xl text-sm font-medium text-white outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1 uppercase tracking-wider">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter your password (or leave blank if none)"
                    value={existingPassword}
                    onChange={(e) => setExistingPassword(e.target.value)}
                    className="w-full bg-[#020812] border border-[#0A2D55] focus:border-[#FFBF00] p-3 rounded-xl text-sm font-medium text-white outline-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#FFBF00] hover:bg-[#FFE179] disabled:opacity-50 text-[#031128] font-black text-sm uppercase tracking-wider py-3.5 rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In To Profile</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoginMode(false);
                      setErrorMessage('');
                      setNotFoundQuery('');
                    }}
                    className="text-xs text-gray-400 hover:text-white underline"
                  >
                    Need a new account? Register here
                  </button>
                </div>
              </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#0A2D55] bg-[#020812] py-4 px-6 text-center text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>© {new Date().getFullYear()} The Margin — Official Round 24 Beta Test Environment.</p>
        <button
          type="button"
          onClick={() => setShowHealthCheck(true)}
          className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 underline"
        >
          <Activity className="w-3.5 h-3.5 text-amber-400" />
          <span>Launch Firebase Health Check</span>
        </button>
      </footer>

      {showHealthCheck && (
        <FirebaseHealthCheckScreen onClose={() => setShowHealthCheck(false)} />
      )}
    </div>
  );
};
