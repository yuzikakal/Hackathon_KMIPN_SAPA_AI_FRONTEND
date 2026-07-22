'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from './context/AuthContext';
import {
  FiMessageSquare,
  FiTrendingUp,
  FiUsers,
  FiZap,
  FiCheckCircle,
  FiArrowRight,
} from 'react-icons/fi';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const features = [
    {
      icon: <FiTrendingUp className="text-xl" />,
      title: 'Sales Pipeline',
      description: 'Track deals from qualification to closed won with real-time stage updates.',
    },
    {
      icon: <FiUsers className="text-xl" />,
      title: 'Contact & Company Hub',
      description: 'Centralize leads, customers, and organizations with smart tagging.',
    },
    {
      icon: <FiMessageSquare className="text-xl" />,
      title: 'WhatsApp Integration',
      description: 'Pair your WhatsApp account by scanning a QR code and send messages directly.',
    },
    {
      icon: <FiZap className="text-xl" />,
      title: 'Real-Time Sync',
      description: 'Live WebSocket updates keep every module in sync across your team.',
    },
    {
      icon: <FiCheckCircle className="text-xl" />,
      title: 'Activities & Tasks',
      description: 'Schedule calls, meetings, and tasks with due dates and completion tracking.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 font-sans">
      {/* Navigation */}
      <nav className="border-b border-slate-800/80 bg-[#090d16]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/20">
              S
            </div>
            <span className="font-bold text-lg text-white">SAPA AI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="astryx-btn-secondary text-xs px-4 py-2"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-transparent to-indigo-900/10 pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/40 text-blue-400 text-xs font-semibold border border-blue-900/30 mb-6">
              <FiZap className="text-amber-300" /> Real-Time CRM Engine v0.1.0
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight tracking-tight mb-6">
              Intelligent Sales &<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                Customer Management
              </span>
            </h1>
            <p className="text-slate-400 text-base md:text-lg mb-8 max-w-2xl leading-relaxed">
              SAPA AI CRM unifies your pipeline, contacts, support tickets, and WhatsApp
              communication in one modern dashboard — with live WebSocket sync and a clean,
              responsive interface.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/login"
                className="astryx-btn-primary text-sm px-6 py-3 inline-flex items-center justify-center gap-2"
              >
                Get Started <FiArrowRight />
              </Link>
              <Link
                href="/dashboard"
                className="astryx-btn-secondary text-sm px-6 py-3 inline-flex items-center justify-center gap-2"
              >
                Open Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-slate-800/80 bg-[#0d1322]/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Everything you need to close more deals</h2>
            <p className="text-slate-400 text-sm max-w-2xl mx-auto">
              Built for Indonesian sales teams who need a fast, integrated CRM with WhatsApp automation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="astryx-card p-6 flex flex-col gap-4"
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl bg-blue-950/40 text-blue-400 border border-blue-800/50">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-bold text-base text-white mb-1">{feature.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="astryx-card p-8 md:p-12 text-center bg-gradient-to-br from-[#111827] to-slate-900">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Ready to power up your sales workflow?</h2>
            <p className="text-slate-400 text-sm mb-8 max-w-xl mx-auto">
              Sign in with the default seeded account or connect your own backend to start managing customers in real time.
            </p>
            <Link
              href="/login"
              className="astryx-btn-primary text-sm px-8 py-3 inline-flex items-center justify-center gap-2"
            >
              Sign In to SAPA AI <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} SAPA AI CRM. All rights reserved.</p>
          <div className="flex items-center gap-2">
          </div>
        </div>
      </footer>
    </div>
  );
}
