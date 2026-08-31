import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, RefreshCw, CheckCircle2, XCircle, Database, Lock, HardDrive, Key, Check, X, Info } from 'lucide-react';
import { runFirebaseHealthCheck, validateFirebaseConfig, FirebaseHealthStatus, firebaseConfig, databaseId } from '../firebase';

interface Props {
  onClose?: () => void;
  isEmbedded?: boolean;
}

export const FirebaseHealthCheckScreen: React.FC<Props> = ({ onClose, isEmbedded = false }) => {
  const [health, setHealth] = useState<FirebaseHealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const status = await runFirebaseHealthCheck();
      setHealth(status);
    } catch (e) {
      console.error('Failed running health check:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const valResult = validateFirebaseConfig();

  const renderStatusBadge = (status: 'green' | 'red') => {
    if (status === 'green') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Connected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
        <XCircle className="w-3.5 h-3.5 text-rose-400" /> Disconnected / Error
      </span>
    );
  };

  const content = (
    <div className="space-y-6 text-white max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#031128] border border-[#0A2D55] p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#FFBF00]/10 border border-[#FFBF00]/20 rounded-2xl">
            <ShieldCheck className="w-7 h-7 text-[#FFBF00]" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#FFBF00] uppercase tracking-wide">
              Firebase Connection Health Check
            </h2>
            <p className="text-xs text-gray-300">
              Live service status & env configuration validator for <strong className="text-white">The Margin</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="bg-[#0A2D55] hover:bg-[#103E73] text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors border border-[#1A4C84]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Re-test Connection</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="bg-[#020812] hover:bg-[#0A2D55] text-gray-400 hover:text-white px-3 py-2 rounded-xl text-xs font-bold border border-[#0A2D55]"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* 4 CORE SERVICES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. FIREBASE APP */}
        <div className="bg-[#031128] border border-[#0A2D55] p-5 rounded-2xl shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                <Info className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Firebase App Connected
              </h3>
            </div>
            {health && renderStatusBadge(health.appConnected.status)}
          </div>
          <p className="text-xs text-gray-300 font-medium">
            {health?.appConnected.message || 'Testing SDK initialization...'}
          </p>
          {health?.appConnected.details && (
            <div className="text-[11px] font-mono text-gray-400 bg-[#020812] p-2.5 rounded-xl border border-[#0A2D55]">
              {health.appConnected.details}
            </div>
          )}
        </div>

        {/* 2. AUTHENTICATION */}
        <div className="bg-[#031128] border border-[#0A2D55] p-5 rounded-2xl shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Authentication Connected
              </h3>
            </div>
            {health && renderStatusBadge(health.authConnected.status)}
          </div>
          <p className="text-xs text-gray-300 font-medium">
            {health?.authConnected.message || 'Testing Authentication service...'}
          </p>
          {health?.authConnected.details && (
            <div className="text-[11px] font-mono text-gray-400 bg-[#020812] p-2.5 rounded-xl border border-[#0A2D55]">
              {health.authConnected.details}
            </div>
          )}
        </div>

        {/* 3. FIRESTORE */}
        <div className="bg-[#031128] border border-[#0A2D55] p-5 rounded-2xl shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Firestore Connected
              </h3>
            </div>
            {health && renderStatusBadge(health.firestoreConnected.status)}
          </div>
          <p className="text-xs text-gray-300 font-medium">
            {health?.firestoreConnected.message || 'Testing Firestore live read/write...'}
          </p>
          {health?.firestoreConnected.details && (
            <div className="text-[11px] font-mono text-gray-400 bg-[#020812] p-2.5 rounded-xl border border-[#0A2D55]">
              {health.firestoreConnected.details}
            </div>
          )}
        </div>

        {/* 4. STORAGE */}
        <div className="bg-[#031128] border border-[#0A2D55] p-5 rounded-2xl shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
                <HardDrive className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Storage Connected
              </h3>
            </div>
            {health && renderStatusBadge(health.storageConnected.status)}
          </div>
          <p className="text-xs text-gray-300 font-medium">
            {health?.storageConnected.message || 'Testing Cloud Storage bucket...'}
          </p>
          {health?.storageConnected.details && (
            <div className="text-[11px] font-mono text-gray-400 bg-[#020812] p-2.5 rounded-xl border border-[#0A2D55]">
              {health.storageConnected.details}
            </div>
          )}
        </div>
      </div>

      {/* CONFIGURATION PARAMETERS VERIFICATION TABLE */}
      <div className="bg-[#031128] border border-[#0A2D55] p-5 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#0A2D55] pb-3">
          <div>
            <h3 className="text-sm font-black text-[#FFBF00] uppercase tracking-wider flex items-center gap-2">
              <Key className="w-4 h-4 text-[#FFBF00]" /> Environment & Manifest Config Parameters
            </h3>
            <p className="text-xs text-gray-300">
              Verifying all 6 required keys (VITE_FIREBASE_* & firebase-applet-config.json)
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-xl text-xs font-black uppercase ${
              valResult.isValid
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}
          >
            {valResult.isValid ? 'All Keys Valid' : 'Missing / Placeholder Keys Detected'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* API KEY */}
          <div className="bg-[#020812] p-3 rounded-xl border border-[#0A2D55] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase">VITE_FIREBASE_API_KEY</span>
              {valResult.configDetails.apiKey.isOk ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <X className="w-3.5 h-3.5 text-rose-400" />
              )}
            </div>
            <div className="font-mono text-xs text-gray-200 truncate">
              {valResult.configDetails.apiKey.value ? '••••••••' + valResult.configDetails.apiKey.value.slice(-6) : 'None'}
            </div>
          </div>

          {/* AUTH DOMAIN */}
          <div className="bg-[#020812] p-3 rounded-xl border border-[#0A2D55] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase">VITE_FIREBASE_AUTH_DOMAIN</span>
              {valResult.configDetails.authDomain.isOk ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <X className="w-3.5 h-3.5 text-rose-400" />
              )}
            </div>
            <div className="font-mono text-xs text-gray-200 truncate">
              {valResult.configDetails.authDomain.value || 'None'}
            </div>
          </div>

          {/* PROJECT ID */}
          <div className="bg-[#020812] p-3 rounded-xl border border-[#0A2D55] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase">VITE_FIREBASE_PROJECT_ID</span>
              {valResult.configDetails.projectId.isOk ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <X className="w-3.5 h-3.5 text-rose-400" />
              )}
            </div>
            <div className="font-mono text-xs text-gray-200 truncate">
              {valResult.configDetails.projectId.value || 'None'}
            </div>
          </div>

          {/* STORAGE BUCKET */}
          <div className="bg-[#020812] p-3 rounded-xl border border-[#0A2D55] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase">VITE_FIREBASE_STORAGE_BUCKET</span>
              {valResult.configDetails.storageBucket.isOk ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <X className="w-3.5 h-3.5 text-rose-400" />
              )}
            </div>
            <div className="font-mono text-xs text-gray-200 truncate">
              {valResult.configDetails.storageBucket.value || 'None'}
            </div>
          </div>

          {/* MESSAGING SENDER ID */}
          <div className="bg-[#020812] p-3 rounded-xl border border-[#0A2D55] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase">VITE_FIREBASE_MESSAGING_SENDER_ID</span>
              {valResult.configDetails.messagingSenderId.isOk ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <X className="w-3.5 h-3.5 text-rose-400" />
              )}
            </div>
            <div className="font-mono text-xs text-gray-200 truncate">
              {valResult.configDetails.messagingSenderId.value || 'None'}
            </div>
          </div>

          {/* APP ID */}
          <div className="bg-[#020812] p-3 rounded-xl border border-[#0A2D55] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase">VITE_FIREBASE_APP_ID</span>
              {valResult.configDetails.appId.isOk ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <X className="w-3.5 h-3.5 text-rose-400" />
              )}
            </div>
            <div className="font-mono text-xs text-gray-200 truncate">
              {valResult.configDetails.appId.value || 'None'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md p-4 overflow-y-auto flex items-center justify-center">
      <div className="w-full max-w-4xl p-2">{content}</div>
    </div>
  );
};
