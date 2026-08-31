/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { registerUser } from '../services/storageService';
import { User } from '../types';
import { NRL_TEAMS } from '../data/nrlTeams';

interface RegisterModalProps {
  onClose: () => void;
  onRegistered: (user: User) => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({ onClose, onRegistered }) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [favoriteTeamId, setFavoriteTeamId] = useState('WARRIORS');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !email.trim()) return;

    const user = registerUser(name, email, username, favoriteTeamId);
    onRegistered(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#DDE4EC] space-y-4">
        <div className="flex items-center justify-between border-b border-[#DDE4EC] pb-3">
          <h3 className="text-lg font-black text-[#031128] uppercase flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#FFBF00]" /> Register Tipper Profile
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Cameron Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#DDE4EC] text-sm font-medium focus:ring-2 focus:ring-[#FFBF00] outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Username</label>
            <input
              type="text"
              required
              placeholder="e.g. cam_smith"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#DDE4EC] text-sm font-medium focus:ring-2 focus:ring-[#FFBF00] outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="e.g. cameron@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#DDE4EC] text-sm font-medium focus:ring-2 focus:ring-[#FFBF00] outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Favorite NRL Club</label>
            <select
              value={favoriteTeamId}
              onChange={(e) => setFavoriteTeamId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#DDE4EC] text-sm font-medium focus:ring-2 focus:ring-[#FFBF00] outline-none"
            >
              {NRL_TEAMS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#FFBF00] hover:bg-[#FFE179] text-[#031128] font-bold px-4 py-2 rounded-xl text-xs shadow"
            >
              Start Tipping
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
