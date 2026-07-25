'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRealtime } from '../../../context/RealtimeContext';
import { apiFetch } from '../../../lib/api';
import { Deal, DealStage, Contact, Company } from '../../../types';
import { FiDollarSign, FiBriefcase, FiUsers, FiMessageSquare, FiArrowRight } from 'react-icons/fi';

const MOCK_DEALS: Deal[] = [
  { id: 5, title: 'SAPA AI Enterprise License', contact_id: 10, company_id: 1, stage_id: 1, owner_id: 1, value: 150000000, currency: 'IDR', expected_close_date: '2026-08-30', status: 'Open', description: '500 seats license deal' },
  { id: 6, title: 'WhatsApp Bot Addon', contact_id: 11, company_id: 2, stage_id: 2, owner_id: 1, value: 35000000, currency: 'IDR', expected_close_date: '2026-08-15', status: 'In Progress', description: 'Unlimited broadcast addon' },
];

const MOCK_STAGES: DealStage[] = [
  { id: 1, name: 'Qualification', position: 1, probability: 20, color: '#3b82f6' },
  { id: 2, name: 'Proposal Sent', position: 2, probability: 50, color: '#6366f1' },
  { id: 3, name: 'Negotiation', position: 3, probability: 80, color: '#f59e0b' },
  { id: 4, name: 'Closed Won', position: 4, probability: 100, color: '#10b981' },
];

const MOCK_CONTACTS: Contact[] = [
  { id: 10, first_name: 'Budi', last_name: 'Santoso', email: 'budi@acme.com', phone: '+62812345678', job_title: 'CTO', company_id: 1, source: 'Website', status: 'Lead', assigned_to: 1, description: 'Key decision maker' },
];

const MOCK_COMPANIES: Company[] = [
  { id: 1, name: 'Acme Corp', industry: 'Technology', website: '', phone: '', email: '', address: '', city: '', country: '', description: '', assigned_to: 1 },
];

function SkeletonCard() {
  return (
    <div className="astryx-card p-5 bg-[#111827] animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2.5 flex-1">
          <div className="h-3 bg-slate-800 rounded w-20" />
          <div className="h-5 bg-slate-800 rounded w-32" />
          <div className="h-3 bg-slate-800 rounded w-24" />
        </div>
        <div className="w-11 h-11 rounded-xl bg-slate-800" />
      </div>
    </div>
  );
}

function SkeletonPipeline() {
  return (
    <div className="astryx-card p-6 bg-[#111827] animate-pulse">
      <div className="h-4 bg-slate-800 rounded w-40 mb-6" />
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <div className="h-3 bg-slate-800 rounded w-40" />
              <div className="h-3 bg-slate-800 rounded w-24" />
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export const DashboardModule: React.FC = () => {
  const { subscribeEntity } = useRealtime();
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState<Deal[]>(MOCK_DEALS);
  const [stages, setStages] = useState<DealStage[]>(MOCK_STAGES);
  const [contacts, setContacts] = useState<Contact[]>(MOCK_CONTACTS);
  const [companies, setCompanies] = useState<Company[]>(MOCK_COMPANIES);
  const [usingFallback, setUsingFallback] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [d, s, c, co] = await Promise.allSettled([
        apiFetch<Deal[]>('/api/v1/deals'),
        apiFetch<DealStage[]>('/api/v1/deal-stages'),
        apiFetch<Contact[]>('/api/v1/contacts'),
        apiFetch<Company[]>('/api/v1/companies'),
      ]);

      if (d.status === 'fulfilled' && Array.isArray(d.value)) setDeals(d.value);
      if (s.status === 'fulfilled' && Array.isArray(s.value)) setStages(s.value);
      if (c.status === 'fulfilled' && Array.isArray(c.value)) setContacts(c.value);
      if (co.status === 'fulfilled' && Array.isArray(co.value)) setCompanies(co.value);

      const anyFailed = [d, s, c, co].some((result) => result.status === 'rejected');
      setUsingFallback(anyFailed);
    } catch {
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const unsubscribers = [
      subscribeEntity('deal', fetchAll),
      subscribeEntity('deal_stage', fetchAll),
      subscribeEntity('contact', fetchAll),
      subscribeEntity('company', fetchAll),
    ];
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [fetchAll, subscribeEntity]);

  const totalRevenue = deals.reduce((acc, d) => acc + (d.value || 0), 0);
  const openDeals = deals.filter((d) => d.status === 'Open' || d.status === 'In Progress');
  const closedDeals = deals.filter((d) => d.status === 'Won');
  const leads = contacts.filter((c) => c.status === 'Lead');

  const pipelineData = stages
    .filter((s) => s.id !== 4)
    .map((s) => {
      const stageDeals = deals.filter((d) => d.stage_id === s.id);
      return {
        stage: s.name,
        count: stageDeals.length,
        value: stageDeals.reduce((acc, d) => acc + (d.value || 0), 0),
        color: `bg-[${s.color}]`,
        colorHex: s.color,
      };
    });

  const wonDeals = deals.filter((d) => d.stage_id === 4);
  const wonValue = wonDeals.reduce((acc, d) => acc + (d.value || 0), 0);
  pipelineData.push({
    stage: 'Closed Won',
    count: wonDeals.length,
    value: wonValue,
    color: 'bg-emerald-500',
    colorHex: '#10b981',
  });

  const maxPipelineCount = Math.max(...pipelineData.map((p) => p.count), 1);

  if (loading) {
    return (
      <div className="space-y-6 font-sans">
        <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl animate-pulse h-24" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SkeletonPipeline />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {usingFallback && (
        <div className="px-4 py-2 bg-amber-950/40 border border-amber-800/50 rounded-lg text-xs text-amber-300 font-medium">
          Using offline data — some API endpoints are unavailable.
        </div>
      )}

      <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-white shadow-lg shadow-blue-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome back to SAPA AI CRM</h1>
          <p className="text-blue-100 text-sm mt-1">
            Real-time multi-channel sales pipeline and WebSocket entity sync active.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `IDR ${totalRevenue.toLocaleString()}`, change: `${openDeals.length} open deals`, icon: <FiDollarSign />, color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50' },
          { label: 'Active Deals', value: `${openDeals.length} Deals`, change: `${closedDeals.length} Closed Won`, icon: <FiBriefcase />, color: 'text-blue-400 bg-blue-950/40 border-blue-800/50' },
          { label: 'Key Contacts', value: `${contacts.length} Contacts`, change: `${leads.length} leads`, icon: <FiUsers />, color: 'text-indigo-400 bg-indigo-950/40 border-indigo-800/50' },
          { label: 'Companies', value: `${companies.length} Companies`, change: `${deals.length} total deals`, icon: <FiMessageSquare />, color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50' },
        ].map((stat, i) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 astryx-card p-6 bg-[#111827]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-white">Pipeline Overview</h3>
            <span className="text-xs text-blue-400 font-semibold flex items-center gap-1 cursor-pointer hover:underline">
              View All Deals <FiArrowRight />
            </span>
          </div>

          <div className="space-y-4">
            {pipelineData.map((p, idx) => (
              <div key={idx} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-200 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.colorHex || '#64748b' }} />
                    <span>{p.stage}</span>
                  </div>
                  <span>IDR {p.value.toLocaleString()} ({p.count})</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(p.count / maxPipelineCount) * 100}%`,
                      backgroundColor: p.colorHex || '#64748b',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
