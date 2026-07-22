'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import { User } from '../types';
import { FiAlertCircle } from 'react-icons/fi';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const data = await apiFetch<{ token: string; user: User }>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      if (data && data.token && data.user) {
        login(data.token, data.user);
        router.push('/dashboard');
      } else {
        setErrorMsg('Unexpected response from authentication server.');
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Authentication failed. Please check the backend server and your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-[#111827] border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold flex items-center justify-center text-xl shadow-md shadow-blue-500/20">
            S
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Sign In to SAPA AI</h1>
            <p className="text-xs text-slate-400">Real-time CRM & WhatsApp automation</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-start gap-2 p-3 bg-red-950/40 text-red-400 text-xs rounded-lg border border-red-900/50">
            <FiAlertCircle className="mt-0.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3.5 py-2 text-sm bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-sans"
              placeholder="e.g. admin"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2 text-sm bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-sans"
              placeholder="••••••••"
            />
          </div>

          <div className="text-xs text-slate-400 bg-blue-950/20 p-2.5 rounded-lg border border-blue-900/30">
            Default credentials:{' '}
            <span className="font-mono text-[11px] text-blue-400 font-bold">admin / admin123</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full astryx-btn-primary py-2.5 text-sm font-semibold shadow-sm"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          <Link href="/" className="text-blue-400 hover:underline">
            ← Back to landing page
          </Link>
        </div>
      </div>
    </div>
  );
}
