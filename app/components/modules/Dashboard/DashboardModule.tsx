'use client';

import React, { useEffect, useState } from 'react';
import { useRealtime } from '../../../context/RealtimeContext';
import { RealtimeEvent } from '../../../types';
import { FiDollarSign, FiBriefcase, FiUsers, FiMessageSquare, FiZap, FiArrowRight } from 'react-icons/fi';

export const DashboardModule: React.FC = () => {
  const { subscribe } = useRealtime();
  const [liveEvents, setLiveEvents] = useState<RealtimeEvent[]>([]);

  useEffect(() => {
    const unsubscribe = subscribe((event) => {
      setLiveEvents((prev) => [event, ...prev.slice(0, 19)]);
    });

    return () => unsubscribe();
  }, [subscribe]);

  const stats = [
    { label: 'Total Revenue', value: 'IDR 150.000.000', change: '+12.5%', icon: <FiDollarSign />, color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50' },
    { label: 'Active Deals', value: '18 Deals', change: '5 Closed Won', icon: <FiBriefcase />, color: 'text-blue-400 bg-blue-950/40 border-blue-800/50' },
    { label: 'Key Contacts', value: '248 Leads', change: '+24 this week', icon: <FiUsers />, color: 'text-indigo-400 bg-indigo-950/40 border-indigo-800/50' },
    { label: 'WhatsApp Status', value: 'Connected', change: '+628123456789', icon: <FiMessageSquare />, color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50' },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner */}
      <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-white shadow-lg shadow-blue-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome back to SAPA AI CRM</h1>
          <p className="text-blue-100 text-sm mt-1">
            Real-time multi-channel sales pipeline and WebSocket entity sync active.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1.5 bg-white/15 backdrop-blur-md rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-white/20">
            <FiZap className="text-amber-300" /> WebSocket WS /api/v1/ws Active
          </span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="astryx-card p-5 flex items-center justify-between bg-[#111827]">
            <div>
              <p className="text-xs font-semibold text-slate-400">{stat.label}</p>
              <h3 className="text-xl font-bold text-white mt-1">{stat.value}</h3>
              <span className="text-[11px] font-medium text-emerald-400 mt-0.5 inline-block">
                {stat.change}
              </span>
            </div>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl border ${stat.color}`}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Grid Section: Pipeline Overview & Real-Time Event Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Summary Card */}
        <div className="lg:col-span-2 astryx-card p-6 bg-[#111827]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-white">Pipeline Overview</h3>
            <span className="text-xs text-blue-400 font-semibold flex items-center gap-1 cursor-pointer hover:underline">
              View All Deals <FiArrowRight />
            </span>
          </div>

          <div className="space-y-4">
            {[
              { stage: 'Qualification & Discovery', count: 4, value: 'IDR 45.000.000', color: 'bg-blue-500' },
              { stage: 'Proposal & Quote Sent', count: 6, value: 'IDR 85.000.000', color: 'bg-indigo-500' },
              { stage: 'Negotiation', count: 3, value: 'IDR 60.000.000', color: 'bg-amber-500' },
              { stage: 'Closed Won', count: 5, value: 'IDR 150.000.000', color: 'bg-emerald-500' },
            ].map((p, idx) => (
              <div key={idx} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-200 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${p.color}`} />
                    <span>{p.stage}</span>
                  </div>
                  <span>{p.value} ({p.count})</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className={`h-full ${p.color}`} style={{ width: `${(p.count / 18) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time WebSocket Event Stream */}
        <div className="astryx-card p-6 bg-[#111827] flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <FiZap className="text-amber-400" />
              <span>Live WS Stream</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </h3>
            <span className="text-xs text-slate-400">{liveEvents.length} events</span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-72 space-y-2.5 pr-1">
            {liveEvents.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Waiting for real-time WebSocket change events...
              </div>
            ) : (
              liveEvents.map((evt, index) => (
                <div
                  key={index}
                  className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 text-xs flex items-center justify-between animate-fadeIn"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        evt.action === 'created'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                          : evt.action === 'updated'
                          ? 'bg-blue-950 text-blue-400 border border-blue-800/60'
                          : 'bg-red-950 text-red-400 border border-red-800/60'
                      }`}
                    >
                      {evt.action}
                    </span>
                    <span className="font-semibold text-slate-200 capitalize">
                      {evt.entity.replace('_', ' ')} #{evt.id}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(evt.timestamp || Date.now()).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
