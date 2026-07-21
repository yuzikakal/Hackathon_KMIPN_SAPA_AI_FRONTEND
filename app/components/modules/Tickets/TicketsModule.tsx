'use client';

import React, { useEffect, useState } from 'react';
import { useRealtime } from '../../../context/RealtimeContext';
import { apiFetch } from '../../../lib/api';
import { Ticket } from '../../../types';

export const TicketsModule: React.FC = () => {
  const { subscribeEntity } = useRealtime();
  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: 1,
      ticket_number: 'TCK-001',
      subject: 'Integration Error with Webhook',
      description: 'Receiving HTTP 500 when syncing WhatsApp contacts.',
      contact_id: 10,
      company_id: 1,
      assigned_to: 1,
      priority: 'High',
      status: 'Open',
      source: 'Email',
    },
  ]);

  const fetchTickets = async () => {
    try {
      const data = await apiFetch<Ticket[]>('/api/v1/tickets');
      if (Array.isArray(data)) setTickets(data);
    } catch (err) {
      console.warn('API error, using initial mock tickets:', err);
    }
  };

  useEffect(() => {
    fetchTickets();
    const unsubscribe = subscribeEntity('ticket', () => fetchTickets());
    return () => unsubscribe();
  }, []);

  const closeTicket = async (id: number) => {
    try {
      await apiFetch(`/api/v1/tickets/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'Closed' }),
      });
      fetchTickets();
    } catch (err) {
      setTickets((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: 'Closed' } : t))
      );
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-xl font-bold text-white">Customer Support Tickets</h1>
        <p className="text-xs text-slate-400">Track client requests and resolve support inquiries</p>
      </div>

      <div className="space-y-3">
        {tickets.map((t) => (
          <div key={t.id} className="astryx-card p-4 bg-[#111827] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-400">
                  {t.ticket_number}
                </span>
                <h4 className="font-bold text-sm text-white">{t.subject}</h4>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.priority === 'High'
                      ? 'bg-red-950 text-red-400 border border-red-800/60'
                      : 'bg-blue-950 text-blue-400 border border-blue-800/60'
                    }`}
                >
                  {t.priority} Priority
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{t.description}</p>
              <div className="text-[11px] text-slate-500 mt-1">
                Source: {t.source} • Status: <span className="font-semibold text-slate-300">{t.status}</span>
              </div>
            </div>

            {t.status !== 'Closed' && (
              <button
                onClick={() => closeTicket(t.id)}
                className="astryx-btn-secondary text-xs px-3 py-1.5"
              >
                Close Ticket
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
