'use client';

import React, { useEffect, useState } from 'react';
import { useRealtime } from '../../../context/RealtimeContext';
import { apiFetch } from '../../../lib/api';
import { Campaign } from '../../../types';
import { FiMessageSquare } from 'react-icons/fi';

export const CampaignsModule: React.FC = () => {
  const { subscribeEntity } = useRealtime();
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: 1,
      name: 'Q3 WhatsApp Broadcast',
      campaign_type: 'WhatsApp',
      start_date: '2026-08-01',
      end_date: '2026-08-07',
      budget: 5000000,
      currency: 'IDR',
      target_audience: 'Leads in Jakarta',
      message_template: 'Halo {{name}}, dapatkan diskon 20% SAPA AI minggu ini!',
      status: 'Active',
    },
  ]);

  const fetchCampaigns = async () => {
    try {
      const data = await apiFetch<Campaign[]>('/api/v1/campaigns');
      if (Array.isArray(data)) setCampaigns(data);
    } catch (err) {
      console.warn('API error, using initial mock campaigns:', err);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    const unsubscribe = subscribeEntity('campaign', () => fetchCampaigns());
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-xl font-bold text-white">Marketing Campaigns</h1>
        <p className="text-xs text-slate-400">Plan and broadcast multi-channel marketing campaigns</p>
      </div>

      <div className="space-y-3">
        {campaigns.map((c) => (
          <div key={c.id} className="astryx-card p-5 bg-[#111827] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiMessageSquare className="text-base text-blue-400" />
                <h4 className="font-bold text-sm text-white">{c.name}</h4>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                {c.status}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-400 text-[10px] block">Type</span>
                <span className="font-semibold text-slate-200">{c.campaign_type}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Budget</span>
                <span className="font-semibold text-slate-200">IDR {c.budget?.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Start Date</span>
                <span className="font-semibold text-slate-200">{c.start_date}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Target Audience</span>
                <span className="font-semibold text-slate-200">{c.target_audience}</span>
              </div>
            </div>

            <div className="text-xs text-slate-300 bg-slate-900/80 p-3 rounded-lg font-mono border border-slate-800">
              Template: &ldquo;{c.message_template}&rdquo;
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
