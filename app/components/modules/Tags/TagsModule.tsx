'use client';

import React, { useEffect, useState } from 'react';
import { useRealtime } from '../../../context/RealtimeContext';
import { apiFetch } from '../../../lib/api';
import { Tag } from '../../../types';
import { FiPlus } from 'react-icons/fi';

export const TagsModule: React.FC = () => {
  const { subscribeEntity } = useRealtime();
  const [tags, setTags] = useState<Tag[]>([
    { id: 1, name: 'VIP', color: '#E74C3C' },
    { id: 2, name: 'High Value', color: '#2563EB' },
    { id: 3, name: 'Urgent', color: '#F59E0B' },
  ]);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState('#2563EB');

  const fetchTags = async () => {
    try {
      const data = await apiFetch<Tag[]>('/api/v1/tags');
      if (Array.isArray(data)) setTags(data);
    } catch (err) {
      console.warn('API error, using initial mock tags:', err);
    }
  };

  useEffect(() => {
    fetchTags();
    const unsubscribe = subscribeEntity('tag', () => fetchTags());
    return () => unsubscribe();
  }, []);

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim()) return;

    try {
      await apiFetch('/api/v1/tags', {
        method: 'POST',
        body: JSON.stringify({ name: tagName, color: tagColor }),
      });
      fetchTags();
      setTagName('');
    } catch (err) {
      const created: Tag = { id: Date.now(), name: tagName, color: tagColor };
      setTags((prev) => [...prev, created]);
      setTagName('');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-xl font-bold text-white">Tags Taxonomy</h1>
        <p className="text-xs text-slate-400">Categorize contacts and companies with custom tag labels</p>
      </div>

      {/* Form */}
      <div className="astryx-card p-4 bg-[#111827]">
        <form onSubmit={handleCreateTag} className="flex flex-col sm:flex-row items-end gap-3 text-xs">
          <div className="flex-1">
            <label className="block font-semibold text-slate-300 mb-1">Tag Name</label>
            <input
              type="text"
              required
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-sans"
              placeholder="e.g. Enterprise Client"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Badge Color</label>
            <input
              type="color"
              value={tagColor}
              onChange={(e) => setTagColor(e.target.value)}
              className="h-9 w-16 p-0.5 bg-slate-900 border border-slate-800 rounded-lg cursor-pointer"
            />
          </div>
          <button type="submit" className="astryx-btn-primary text-xs px-4 py-2 flex items-center gap-1">
            <FiPlus /> Add Tag
          </button>
        </form>
      </div>

      {/* Tag Pills Grid */}
      <div className="astryx-card p-6 bg-[#111827]">
        <div className="flex flex-wrap gap-2.5">
          {tags.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-xs"
              style={{ backgroundColor: t.color || '#2563EB' }}
            >
              <span>{t.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
