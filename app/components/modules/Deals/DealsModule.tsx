'use client';

import React, { useEffect, useState } from 'react';
import { useRealtime } from '../../../context/RealtimeContext';
import { apiFetch } from '../../../lib/api';
import { Deal, DealStage } from '../../../types';
import { FiPlus } from 'react-icons/fi';

export const DealsModule: React.FC = () => {
  const { subscribeEntity } = useRealtime();

  const [stages, setStages] = useState<DealStage[]>([
    { id: 1, name: 'Qualification', position: 1, probability: 20, color: '#3b82f6' },
    { id: 2, name: 'Proposal Sent', position: 2, probability: 50, color: '#6366f1' },
    { id: 3, name: 'Negotiation', position: 3, probability: 80, color: '#f59e0b' },
    { id: 4, name: 'Closed Won', position: 4, probability: 100, color: '#10b981' },
  ]);

  const [deals, setDeals] = useState<Deal[]>([
    {
      id: 5,
      title: 'SAPA AI Enterprise License',
      contact_id: 10,
      company_id: 1,
      stage_id: 1,
      owner_id: 1,
      value: 150000000,
      currency: 'IDR',
      expected_close_date: '2026-08-30',
      status: 'Open',
      description: '500 seats license deal',
    },
    {
      id: 6,
      title: 'WhatsApp Bot Addon',
      contact_id: 11,
      company_id: 2,
      stage_id: 2,
      owner_id: 1,
      value: 35000000,
      currency: 'IDR',
      expected_close_date: '2026-08-15',
      status: 'In Progress',
      description: 'Unlimited broadcast addon',
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [newDeal, setNewDeal] = useState<Partial<Deal>>({
    title: '',
    value: 50000000,
    currency: 'IDR',
    stage_id: 1,
    expected_close_date: '2026-09-01',
    description: '',
  });

  const fetchDeals = async () => {
    try {
      const dData = await apiFetch<Deal[]>('/api/v1/deals');
      if (Array.isArray(dData)) setDeals(dData);

      const sData = await apiFetch<DealStage[]>('/api/v1/deal-stages');
      if (Array.isArray(sData)) setStages(sData);
    } catch (err) {
      console.warn('API error, using initial mock deals:', err);
    }
  };

  useEffect(() => {
    fetchDeals();

    const unsubDeal = subscribeEntity('deal', () => fetchDeals());
    const unsubStage = subscribeEntity('deal_stage', () => fetchDeals());

    return () => {
      unsubDeal();
      unsubStage();
    };
  }, []);

  const moveDealStage = async (dealId: number, targetStageId: number) => {
    try {
      await apiFetch(`/api/v1/deals/${dealId}/move-stage`, {
        method: 'PUT',
        body: JSON.stringify({ stage_id: targetStageId }),
      });
      fetchDeals();
    } catch (err) {
      setDeals((prev) =>
        prev.map((d) => (d.id === dealId ? { ...d, stage_id: targetStageId } : d))
      );
    }
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/deals', {
        method: 'POST',
        body: JSON.stringify({
          ...newDeal,
          contact_id: 10,
          company_id: 1,
          owner_id: 1,
          status: 'Open',
        }),
      });
      fetchDeals();
      setShowModal(false);
    } catch (err) {
      const created: Deal = {
        id: Date.now(),
        title: newDeal.title || 'New Deal',
        contact_id: 10,
        company_id: 1,
        stage_id: Number(newDeal.stage_id) || 1,
        owner_id: 1,
        value: Number(newDeal.value) || 10000000,
        currency: 'IDR',
        expected_close_date: newDeal.expected_close_date || '2026-09-01',
        status: 'Open',
        description: newDeal.description || '',
      };
      setDeals((prev) => [...prev, created]);
      setShowModal(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Deals & Sales Pipeline</h1>
          <p className="text-xs text-slate-400">Kanban stage pipeline board with real-time stage shifts</p>
        </div>
        <button onClick={() => setShowModal(true)} className="astryx-btn-primary text-xs px-4 py-2 flex items-center gap-1.5">
          <FiPlus /> Create Deal
        </button>
      </div>

      {/* Pipeline Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {stages.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage_id === stage.id);
          const totalVal = stageDeals.reduce((acc, curr) => acc + (curr.value || 0), 0);

          return (
            <div
              key={stage.id}
              className="bg-[#0d1322] border border-slate-800 rounded-xl p-3 flex flex-col min-h-[500px]"
            >
              {/* Column Title */}
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="font-bold text-xs text-slate-200">{stage.name}</span>
                </div>
                <span className="text-xs font-semibold text-slate-400">({stageDeals.length})</span>
              </div>

              {/* Total Value */}
              <div className="text-[11px] font-medium text-slate-400 mb-3 px-1">
                Total: <span className="font-semibold text-white">IDR {totalVal.toLocaleString()}</span>
              </div>

              {/* Cards List */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="astryx-card p-4 bg-[#111827] border border-slate-800 shadow-xs hover:border-slate-700 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-xs text-white leading-tight">
                        {deal.title}
                      </h4>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{deal.description}</p>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="font-bold text-xs text-blue-400">
                        IDR {deal.value?.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400">{deal.expected_close_date}</span>
                    </div>

                    {/* Move Stage Quick Action */}
                    <div className="mt-2.5 flex items-center gap-1">
                      <span className="text-[10px] text-slate-400">Move:</span>
                      {stages.map((st) => (
                        <button
                          key={st.id}
                          disabled={st.id === deal.stage_id}
                          onClick={() => moveDealStage(deal.id, st.id)}
                          className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center transition-all ${st.id === deal.stage_id
                              ? 'opacity-40 ring-1 ring-slate-500'
                              : 'hover:scale-125'
                            }`}
                          style={{ backgroundColor: st.color, color: '#fff' }}
                          title={`Move to ${st.name}`}
                        >
                          {st.position}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 font-sans">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-white mb-4">Create New Deal</h3>
            <form onSubmit={handleCreateDeal} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Deal Title</label>
                <input
                  type="text"
                  required
                  value={newDeal.title || ''}
                  onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-sans"
                  placeholder="e.g. Enterprise SLA Agreement"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Value (IDR)</label>
                <input
                  type="number"
                  required
                  value={newDeal.value || 0}
                  onChange={(e) => setNewDeal({ ...newDeal, value: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-sans"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Pipeline Stage</label>
                <select
                  value={newDeal.stage_id || 1}
                  onChange={(e) => setNewDeal({ ...newDeal, stage_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-sans"
                >
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newDeal.description || ''}
                  onChange={(e) => setNewDeal({ ...newDeal, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="astryx-btn-secondary text-xs px-3.5 py-1.5"
                >
                  Cancel
                </button>
                <button type="submit" className="astryx-btn-primary text-xs px-4 py-1.5">
                  Save Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
