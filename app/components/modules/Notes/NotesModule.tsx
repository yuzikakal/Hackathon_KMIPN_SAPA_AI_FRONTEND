'use client';

import React, { useEffect, useState } from 'react';
import { useRealtime } from '../../../context/RealtimeContext';
import { apiFetch } from '../../../lib/api';
import { Note } from '../../../types';

export const NotesModule: React.FC = () => {
  const { subscribeEntity } = useRealtime();
  const [notes, setNotes] = useState<Note[]>([
    {
      id: 1,
      content: 'Client requested custom SLA addendum for WhatsApp gateway integration.',
      contact_id: 10,
      deal_id: 5,
      company_id: 1,
      created_at: '2026-07-20T10:00:00Z',
    },
  ]);
  const [newContent, setNewContent] = useState('');

  const fetchNotes = async () => {
    try {
      const data = await apiFetch<Note[]>('/api/v1/notes');
      if (Array.isArray(data)) setNotes(data);
    } catch (err) {
      console.warn('API error, using initial mock notes:', err);
    }
  };

  useEffect(() => {
    fetchNotes();
    const unsubscribe = subscribeEntity('note', () => fetchNotes());
    return () => unsubscribe();
  }, []);

  const handlePostNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    try {
      await apiFetch('/api/v1/notes', {
        method: 'POST',
        body: JSON.stringify({
          content: newContent,
          contact_id: 10,
          deal_id: 5,
          company_id: 1,
        }),
      });
      fetchNotes();
      setNewContent('');
    } catch (err) {
      const created: Note = {
        id: Date.now(),
        content: newContent,
        contact_id: 10,
        deal_id: 5,
        company_id: 1,
        created_at: new Date().toISOString(),
      };
      setNotes((prev) => [created, ...prev]);
      setNewContent('');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-xl font-bold text-white">CRM Notes Stream</h1>
        <p className="text-xs text-slate-400">Collaborative notes linked to accounts and deals</p>
      </div>

      {/* Note Input */}
      <div className="astryx-card p-4 bg-[#111827]">
        <form onSubmit={handlePostNote} className="space-y-3">
          <textarea
            rows={3}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Write a new internal CRM note..."
            className="w-full p-3 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none font-sans"
          />
          <div className="flex justify-end">
            <button type="submit" className="astryx-btn-primary text-xs px-4 py-2">
              Post Note
            </button>
          </div>
        </form>
      </div>

      {/* Stream */}
      <div className="space-y-3">
        {notes.map((n) => (
          <div key={n.id} className="astryx-card p-4 bg-[#111827] space-y-2">
            <p className="text-xs text-slate-200">{n.content}</p>
            <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-2">
              <span>Account #1 • Contact #10</span>
              <span>{new Date(n.created_at || Date.now()).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
