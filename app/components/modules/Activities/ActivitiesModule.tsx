'use client';

import React, { useEffect, useState } from 'react';
import { useRealtime } from '../../../context/RealtimeContext';
import { apiFetch } from '../../../lib/api';
import { Activity } from '../../../types';
import { FiCalendar, FiPhone, FiCheckCircle, FiPlus } from 'react-icons/fi';

export const ActivitiesModule: React.FC = () => {
  const { subscribeEntity } = useRealtime();

  const [activities, setActivities] = useState<Activity[]>([
    {
      id: 1,
      activity_type: 'Meeting',
      subject: 'Product Demo Walkthrough',
      description: 'Demonstrate CRM features to technical team',
      contact_id: 10,
      deal_id: 5,
      company_id: 1,
      assigned_to: 1,
      due_date: '2026-07-25T14:00:00Z',
      status: 'Pending',
    },
    {
      id: 2,
      activity_type: 'Call',
      subject: 'Followup on SLA Quote',
      description: 'Review contract terms with procurement manager',
      contact_id: 11,
      deal_id: 6,
      company_id: 2,
      assigned_to: 1,
      due_date: '2026-07-22T10:00:00Z',
      status: 'Done',
      completed_at: '2026-07-21T08:00:00Z',
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [newAct, setNewAct] = useState<Partial<Activity>>({
    activity_type: 'Meeting',
    subject: '',
    description: '',
    due_date: '2026-07-26T10:00:00Z',
  });

  const fetchActivities = async () => {
    try {
      const data = await apiFetch<Activity[]>('/api/v1/activities');
      if (Array.isArray(data)) setActivities(data);
    } catch (err) {
      console.warn('API error, using initial mock activities:', err);
    }
  };

  useEffect(() => {
    fetchActivities();
    const unsubscribe = subscribeEntity('activity', () => fetchActivities());
    return () => unsubscribe();
  }, []);

  const markDone = async (id: number) => {
    try {
      await apiFetch(`/api/v1/activities/${id}/done`, { method: 'PUT' });
      fetchActivities();
    } catch (err) {
      setActivities((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'Done', completed_at: new Date().toISOString() } : a))
      );
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/activities', {
        method: 'POST',
        body: JSON.stringify({
          ...newAct,
          contact_id: 10,
          assigned_to: 1,
        }),
      });
      fetchActivities();
      setShowModal(false);
    } catch (err) {
      const created: Activity = {
        id: Date.now(),
        activity_type: newAct.activity_type || 'Meeting',
        subject: newAct.subject || 'New Activity',
        description: newAct.description || '',
        assigned_to: 1,
        due_date: newAct.due_date || new Date().toISOString(),
        status: 'Pending',
      };
      setActivities((prev) => [created, ...prev]);
      setShowModal(false);
    }
  };

  return (
    <div className="space-y-6 font-sans bg-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Activities & Tasks</h1>
          <p className="text-xs text-slate-500">Schedule meetings, calls, and tasks with real-time updates</p>
        </div>
        <button onClick={() => setShowModal(true)} className="astryx-btn-primary text-xs px-4 py-2 flex items-center gap-1.5">
          <FiPlus /> Schedule Activity
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {activities.map((act) => (
          <div
            key={act.id}
            className="astryx-card p-4 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-base ${
                  act.activity_type === 'Meeting'
                    ? 'bg-purple-100 text-purple-700'
                    : act.activity_type === 'Call'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {act.activity_type === 'Meeting' ? <FiCalendar /> : act.activity_type === 'Call' ? <FiPhone /> : <FiCheckCircle />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-900">{act.subject}</h4>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      act.status === 'Done'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {act.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{act.description}</p>
                <div className="text-[11px] text-slate-400 mt-1">
                  Due: {new Date(act.due_date).toLocaleString()}
                </div>
              </div>
            </div>

            {act.status !== 'Done' && (
              <button
                onClick={() => markDone(act.id)}
                className="astryx-btn-secondary text-xs px-3 py-1.5 self-end sm:self-center flex items-center gap-1"
              >
                <FiCheckCircle /> Mark Done
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-xs p-4 font-sans">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Schedule New Activity</h3>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Activity Type</label>
                <select
                  value={newAct.activity_type || 'Meeting'}
                  onChange={(e) => setNewAct({ ...newAct, activity_type: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-sans"
                >
                  <option value="Meeting">Meeting</option>
                  <option value="Call">Call</option>
                  <option value="Task">Task</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={newAct.subject || ''}
                  onChange={(e) => setNewAct({ ...newAct, subject: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-sans"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newAct.description || ''}
                  onChange={(e) => setNewAct({ ...newAct, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-sans"
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
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
