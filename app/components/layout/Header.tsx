'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { FiSearch, FiLogOut, FiUser, FiZap } from 'react-icons/fi';

interface HeaderProps {
  onOpenLogin: () => void;
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ onOpenLogin, title }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { wsStatus } = useRealtime();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="h-16 bg-[#0d1322] border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-10 font-sans">
      {/* Title & Section */}
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold text-white capitalize">
          {title}
        </h2>
      </div>

      {/* Center Search */}
      <div className="hidden md:flex items-center w-80 relative">
        <FiSearch className="absolute left-3 text-slate-400 text-sm" />
        <input
          type="text"
          placeholder="Search CRM records (Ctrl + K)..."
          className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-900/80 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-sans"
        />
      </div>

      {/* Right User & Status Tools */}
      <div className="flex items-center gap-4">
        {/* WebSocket Real-time Status Badge */}
        <div
          className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border ${
            wsStatus === 'connected'
              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
              : wsStatus === 'connecting'
              ? 'bg-amber-950/40 text-amber-400 border-amber-800/60'
              : 'bg-slate-800/60 text-slate-400 border-slate-700'
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              wsStatus === 'connected'
                ? 'bg-emerald-500 animate-pulse'
                : wsStatus === 'connecting'
                ? 'bg-amber-500 animate-bounce'
                : 'bg-slate-400'
            }`}
          />
          <span className="capitalize">{wsStatus === 'connected' ? 'WS Live' : wsStatus}</span>
        </div>

        {/* User Account / Login Button */}
        {isAuthenticated && user ? (
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 text-sm focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                {user.full_name?.charAt(0) || user.username?.charAt(0) || 'U'}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-white leading-tight">
                  {user.full_name}
                </span>
                <span className="text-[10px] text-slate-400 capitalize">{user.role}</span>
              </div>
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-900 rounded-xl shadow-xl border border-slate-800 py-1 text-sm z-30">
                <div className="px-4 py-2 border-b border-slate-800">
                  <p className="font-semibold text-slate-200">{user.full_name}</p>
                  <p className="text-xs text-slate-400 truncate">{user.email}</p>
                </div>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-950/40 font-medium transition-colors flex items-center gap-2"
                >
                  <FiLogOut className="text-sm" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenLogin}
            className="astryx-btn-primary text-xs px-3.5 py-1.5"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};
