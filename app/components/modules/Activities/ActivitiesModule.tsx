'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRealtime } from '../../../context/RealtimeContext';
import { apiFetch } from '../../../lib/api';
import { Activity } from '../../../types';
import { FiCalendar, FiPhone, FiCheckCircle, FiPlus, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

const getErrorMessage = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

export const ActivitiesModule: React.FC = () => {
  const { subscribeEntity } = useRealtime();
  const { user } = useAuth();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newAct, setNewAct] = useState<Partial<Activity>>({
    activity_type: 'Meeting',
    subject: '',
    description: '',
    due_date: '',
  });

  const fetchActivities = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Activity[]>('/api/v1/activities');
      if (Array.isArray(data)) {
        setActivities(data);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load activities. Please make sure the API backend server is running.'));
      console.error('Activities fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    const unsubscribe = subscribeEntity('activity', () => fetchActivities());
    return () => unsubscribe();
  }, [subscribeEntity]);

  const markDone = async (id: number) => {
    try {
      await apiFetch(`/api/v1/activities/${id}/done`, { method: 'PUT' });
      await fetchActivities();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to mark activity as done.'));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAct.subject?.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await apiFetch('/api/v1/activities', {
        method: 'POST',
        body: JSON.stringify({
          ...newAct,
          assigned_to: user?.id,
        }),
      });
      await fetchActivities();
      setShowModal(false);
      setNewAct({
        activity_type: 'Meeting',
        subject: '',
        description: '',
        due_date: '',
      });
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to create activity. Please check the backend server.'));
    } finally {
      setLoading(false);
    }
  };

  const isCompleted = (status?: string) =>
    status?.toLowerCase() === 'completed' || status?.toLowerCase() === 'done';

  return (
    <div className="space-y-6 font-sans text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Activities & Tasks</h1>
          <p className="text-xs text-slate-400">Schedule meetings, calls, and tasks with real-time updates</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="astryx-btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
        >
          <FiPlus /> Schedule Activity
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-950/40 text-red-400 text-xs rounded-lg border border-red-900/50">
          <FiAlertCircle className="mt-0.5 shrink-0" />
          <div className="flex-1">{error}</div>
          <button
            onClick={() => fetchActivities()}
            className="flex items-center gap-1 hover:text-red-300 shrink-0"
          >
            <FiRefreshCw /> Retry
          </button>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {loading && activities.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-500">
            Loading activities from server...
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-500">
            No activities found. Create one to get started.
          </div>
        ) : (
          activities.map((act) => (
            <div
              key={act.id}
              className="astryx-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-base ${
                    act.activity_type === 'Meeting'
                      ? 'bg-purple-950/60 text-purple-400'
                      : act.activity_type === 'Call'
                        ? 'bg-blue-950/60 text-blue-400'
                        : 'bg-emerald-950/60 text-emerald-400'
                  }`}
                >
                  {act.activity_type === 'Meeting' ? <FiCalendar /> : act.activity_type === 'Call' ? <FiPhone /> : <FiCheckCircle />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-white">{act.subject}</h4>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isCompleted(act.status)
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                          : 'bg-amber-950 text-amber-400 border border-amber-800/60'
                      }`}
                    >
                      {act.status || 'Pending'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{act.description}</p>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {act.due_date
                      ? `Due: ${new Date(act.due_date).toLocaleString()}`
                      : 'No due date'}
                  </div>
                </div>
              </div>

              {!isCompleted(act.status) && (
                <button
                  onClick={() => markDone(act.id)}
                  className="astryx-btn-secondary text-xs px-3 py-1.5 self-end sm:self-center flex items-center gap-1"
                >
                  <FiCheckCircle /> Mark Done
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 font-sans">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-white mb-4">Schedule New Activity</h3>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Activity Type</label>
                <select
                  value={newAct.activity_type || 'Meeting'}
                  onChange={(e) => setNewAct({ ...newAct, activity_type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-sans"
                >
                  <option value="Meeting">Meeting</option>
                  <option value="Call">Call</option>
                  <option value="Task">Task</option>
                  <option value="Email">Email</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={newAct.subject || ''}
                  onChange={(e) => setNewAct({ ...newAct, subject: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-sans"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newAct.description || ''}
                  onChange={(e) => setNewAct({ ...newAct, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-sans"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Due Date</label>
                <input
                  type="datetime-local"
                  value={newAct.due_date || ''}
                  onChange={(e) => setNewAct({ ...newAct, due_date: e.target.value })}
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
                <button type="submit" disabled={loading} className="astryx-btn-primary text-xs px-4 py-1.5">
                  {loading ? 'Saving...' : 'Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
