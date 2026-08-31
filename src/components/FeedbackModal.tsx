/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MessageSquare, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { submitFeedbackToFirestore } from '../services/firestoreService';
import { getCurrentUser } from '../services/storageService';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage?: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, currentPage = 'App' }) => {
  const [category, setCategory] = useState<'bug' | 'feature' | 'general'>('bug');
  const [whatHappened, setWhatHappened] = useState('');
  const [whatExpected, setWhatExpected] = useState('');
  const [contactPermission, setContactPermission] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatHappened.trim()) {
      setError('Please describe what happened or your feedback.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const currentUser = getCurrentUser();

    try {
      await submitFeedbackToFirestore({
        userId: currentUser?.id || 'anonymous',
        category,
        whatHappened,
        whatExpected,
        page: currentPage,
        contactPermission,
      });

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setWhatHappened('');
        setWhatExpected('');
        setIsSubmitting(false);
        onClose();
      }, 2000);
    } catch (err) {
      console.error(err);
      setError('Failed to submit feedback. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold">The Margin Tipper Feedback</h2>
            <p className="text-xs text-slate-400">Help us polish The Margin experience</p>
          </div>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-lg font-bold text-white">Thank You for Your Feedback!</h3>
            <p className="text-sm text-slate-400">Your report has been logged in Firestore for our development team.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Category</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'bug', label: 'Bug Report' },
                  { id: 'feature', label: 'Feature Idea' },
                  { id: 'general', label: 'General' },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id as any)}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                      category === c.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {category === 'bug' ? 'What happened or failed?' : 'Your feedback / suggestion'}
              </label>
              <textarea
                value={whatHappened}
                onChange={(e) => setWhatHappened(e.target.value)}
                rows={3}
                placeholder={
                  category === 'bug'
                    ? 'e.g. When I clicked save tip, it did not update immediately...'
                    : 'Share your thoughts or ideas...'
                }
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {category === 'bug' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  What did you expect to happen? (Optional)
                </label>
                <textarea
                  value={whatExpected}
                  onChange={(e) => setWhatExpected(e.target.value)}
                  rows={2}
                  placeholder="e.g. Expected score to update after fixture result was entered."
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={contactPermission}
                onChange={(e) => setContactPermission(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500/20"
              />
              <span className="text-xs text-slate-400">May we contact you via email about this feedback?</span>
            </label>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-amber-500/20"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
