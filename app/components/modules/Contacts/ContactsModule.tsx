'use client';

import React, { useEffect, useState } from 'react';
import { useRealtime } from '../../../context/RealtimeContext';
import { apiFetch } from '../../../lib/api';
import { Contact } from '../../../types';
import { FiPlus } from 'react-icons/fi';

export const ContactsModule: React.FC = () => {
  const { subscribeEntity } = useRealtime();
  const [contacts, setContacts] = useState<Contact[]>([
    {
      id: 10,
      first_name: 'Budi',
      last_name: 'Santoso',
      email: 'budi@acme.com',
      phone: '+62812345678',
      job_title: 'CTO',
      company_id: 1,
      source: 'Website',
      status: 'Lead',
      assigned_to: 1,
      description: 'Key decision maker',
      tags: [{ id: 1, name: 'VIP', color: '#FF0000' }],
    },
    {
      id: 11,
      first_name: 'Siti',
      last_name: 'Rahma',
      email: 'siti@nusantaratech.id',
      phone: '+62812987654',
      job_title: 'VP of Product',
      company_id: 2,
      source: 'Referral',
      status: 'Customer',
      assigned_to: 1,
      description: 'Enterprise account lead',
      tags: [{ id: 2, name: 'High Value', color: '#2563EB' }],
    },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Partial<Contact>>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    job_title: '',
    status: 'Lead',
  });

  const fetchContacts = async () => {
    try {
      const data = await apiFetch<Contact[]>('/api/v1/contacts');
      if (Array.isArray(data)) setContacts(data);
    } catch (err) {
      console.warn('API error, using initial mock contact data:', err);
    }
  };

  useEffect(() => {
    fetchContacts();

    const unsubscribe = subscribeEntity('contact', () => {
      fetchContacts();
    });

    return () => unsubscribe();
  }, [subscribeEntity]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingContact.id) {
        await apiFetch(`/api/v1/contacts/${editingContact.id}`, {
          method: 'PUT',
          body: JSON.stringify(editingContact),
        });
      } else {
        await apiFetch('/api/v1/contacts', {
          method: 'POST',
          body: JSON.stringify(editingContact),
        });
      }
      fetchContacts();
      setShowModal(false);
    } catch {
      if (editingContact.id) {
        setContacts((prev) =>
          prev.map((c) => (c.id === editingContact.id ? ({ ...c, ...editingContact } as Contact) : c))
        );
      } else {
        const newC: Contact = {
          id: Date.now(),
          first_name: editingContact.first_name || 'New',
          last_name: editingContact.last_name || 'Contact',
          email: editingContact.email || '',
          phone: editingContact.phone || '',
          job_title: editingContact.job_title || '',
          company_id: 1,
          source: 'Direct',
          status: editingContact.status || 'Lead',
          assigned_to: 1,
          description: '',
          tags: [],
        };
        setContacts((prev) => [newC, ...prev]);
      }
      setShowModal(false);
    }
  };

  const filtered = contacts.filter((c) => {
    const matchesSearch =
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Contacts & Leads</h1>
          <p className="text-xs text-slate-400">Track client profiles, job titles, tags, and communication history</p>
        </div>
        <button
          onClick={() => {
            setEditingContact({ first_name: '', last_name: '', email: '', phone: '', job_title: '', status: 'Lead' });
            setShowModal(true);
          }}
          className="astryx-btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
        >
          <FiPlus /> Add Contact
        </button>
      </div>

      {/* Filters */}
      <div className="astryx-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#111827]">
        <input
          type="text"
          placeholder="Search contacts by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md px-3.5 py-1.5 text-sm bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none font-sans"
        />

        <div className="flex items-center gap-2">
          {['ALL', 'Lead', 'Customer', 'Prospect'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
                statusFilter === st
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="astryx-card overflow-hidden bg-[#111827]">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/90 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-5 py-3">Full Name</th>
              <th className="px-5 py-3">Job Title & Company</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Contact Information</th>
              <th className="px-5 py-3">Tags</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="px-5 py-3.5 font-semibold text-white">
                  {c.first_name} {c.last_name}
                </td>
                <td className="px-5 py-3.5 text-xs">
                  <div className="font-semibold text-slate-200">{c.job_title}</div>
                  <div className="text-slate-400">Company #{c.company_id}</div>
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      c.status === 'Customer'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                        : c.status === 'Lead'
                        ? 'bg-blue-950 text-blue-400 border border-blue-800/60'
                        : 'bg-amber-950 text-amber-400 border border-amber-800/60'
                    }`}
                  >
                    {c.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-xs">
                  <div>{c.phone}</div>
                  <div className="text-slate-400">{c.email}</div>
                </td>
                <td className="px-5 py-3.5 text-xs">
                  <div className="flex flex-wrap gap-1">
                    {c.tags?.map((t) => (
                      <span
                        key={t.id}
                        className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-xs"
                        style={{ backgroundColor: t.color || '#2563EB' }}
                      >
                        {t.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-right space-x-2">
                  <button
                    onClick={() => {
                      setEditingContact(c);
                      setShowModal(true);
                    }}
                    className="text-xs font-semibold text-blue-400 hover:underline"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 font-sans">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingContact.id ? 'Edit Contact' : 'Add New Contact'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={editingContact.first_name || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, first_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-sans"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={editingContact.last_name || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, last_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-sans"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={editingContact.email || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-sans"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editingContact.phone || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-sans"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Job Title</label>
                  <input
                    type="text"
                    value={editingContact.job_title || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, job_title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-sans"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Status</label>
                  <select
                    value={editingContact.status || 'Lead'}
                    onChange={(e) => setEditingContact({ ...editingContact, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-sans"
                  >
                    <option value="Lead">Lead</option>
                    <option value="Prospect">Prospect</option>
                    <option value="Customer">Customer</option>
                  </select>
                </div>
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
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
