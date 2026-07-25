'use client';

import React, { useEffect, useState } from 'react';
import { useRealtime } from '../../../context/RealtimeContext';
import { apiFetch } from '../../../lib/api';
import { Company } from '../../../types';
import { FiPlus } from 'react-icons/fi';

export const CompaniesModule: React.FC = () => {
  const { subscribeEntity } = useRealtime();
  const [companies, setCompanies] = useState<Company[]>([
    {
      id: 1,
      name: 'Acme Corp',
      industry: 'Technology',
      website: 'https://acme.com',
      phone: '+62215551234',
      email: 'info@acme.com',
      address: 'Jl. Sudirman No. 12',
      city: 'Jakarta',
      country: 'Indonesia',
      description: 'Enterprise client',
      assigned_to: 1,
    },
    {
      id: 2,
      name: 'Nusantara Tech',
      industry: 'Software',
      website: 'https://nusantaratech.id',
      phone: '+62215559876',
      email: 'contact@nusantaratech.id',
      address: 'Jl. H.R. Rasuna Said',
      city: 'Jakarta',
      country: 'Indonesia',
      description: 'Cloud software partner',
      assigned_to: 1,
    },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Partial<Company>>({
    name: '',
    industry: 'Technology',
    website: '',
    phone: '',
    email: '',
    city: 'Jakarta',
    description: '',
  });

  const fetchCompanies = async () => {
    try {
      const data = await apiFetch<Company[]>('/api/v1/companies');
      if (Array.isArray(data)) {
        setCompanies(data);
      }
    } catch (err) {
      console.warn('API error, using initial mock data:', err);
    }
  };

  useEffect(() => {
    fetchCompanies();
    const unsubscribe = subscribeEntity('company', () => fetchCompanies());
    return () => unsubscribe();
  }, [subscribeEntity]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCompany.id) {
        await apiFetch(`/api/v1/companies/${editingCompany.id}`, {
          method: 'PUT',
          body: JSON.stringify(editingCompany),
        });
      } else {
        await apiFetch('/api/v1/companies', {
          method: 'POST',
          body: JSON.stringify(editingCompany),
        });
      }
      fetchCompanies();
      setShowModal(false);
    } catch {
      if (editingCompany.id) {
        setCompanies((prev) =>
          prev.map((c) => (c.id === editingCompany.id ? ({ ...c, ...editingCompany } as Company) : c))
        );
      } else {
        const newC: Company = {
          id: Date.now(),
          name: editingCompany.name || 'New Company',
          industry: editingCompany.industry || 'Technology',
          website: editingCompany.website || '',
          phone: editingCompany.phone || '',
          email: editingCompany.email || '',
          address: editingCompany.address || '',
          city: editingCompany.city || 'Jakarta',
          country: 'Indonesia',
          description: editingCompany.description || '',
          assigned_to: 1,
        };
        setCompanies((prev) => [newC, ...prev]);
      }
      setShowModal(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this company?')) return;
    try {
      await apiFetch(`/api/v1/companies/${id}`, { method: 'DELETE' });
      fetchCompanies();
    } catch {
      setCompanies((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const filteredCompanies = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.industry || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Companies Directory</h1>
          <p className="text-xs text-slate-400">Manage corporate CRM profiles and real-time updates</p>
        </div>
        <button
          onClick={() => {
            setEditingCompany({ name: '', industry: 'Technology', website: '', phone: '', email: '', city: 'Jakarta' });
            setShowModal(true);
          }}
          className="astryx-btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
        >
          <FiPlus /> Add Company
        </button>
      </div>

      {/* Filter & Search */}
      <div className="astryx-card p-4 flex items-center justify-between gap-4 bg-[#111827]">
        <input
          type="text"
          placeholder="Filter by company name or industry..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md px-3.5 py-1.5 text-sm bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-sans"
        />
        <span className="text-xs font-semibold text-slate-400">{filteredCompanies.length} records</span>
      </div>

      {/* Directory Table */}
      <div className="astryx-card overflow-hidden bg-[#111827]">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/90 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-5 py-3">Company</th>
              <th className="px-5 py-3">Industry</th>
              <th className="px-5 py-3">Phone & Email</th>
              <th className="px-5 py-3">Location</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredCompanies.map((comp) => (
              <tr key={comp.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="px-5 py-3.5 font-semibold text-white">
                  <div>{comp.name}</div>
                  {comp.website && (
                    <a href={comp.website} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">
                      {comp.website}
                    </a>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-950 text-blue-400 border border-blue-800/60">
                    {comp.industry}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-xs">
                  <div>{comp.phone}</div>
                  <div className="text-slate-400">{comp.email}</div>
                </td>
                <td className="px-5 py-3.5 text-xs">
                  {comp.city}, {comp.country}
                </td>
                <td className="px-5 py-3.5 text-right space-x-2">
                  <button
                    onClick={() => {
                      setEditingCompany(comp);
                      setShowModal(true);
                    }}
                    className="text-xs font-semibold text-blue-400 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(comp.id)}
                    className="text-xs font-semibold text-red-400 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 font-sans">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingCompany.id ? 'Edit Company' : 'Add New Company'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={editingCompany.name || ''}
                  onChange={(e) => setEditingCompany({ ...editingCompany, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-sans"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Industry</label>
                  <input
                    type="text"
                    value={editingCompany.industry || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, industry: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-sans"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Website</label>
                  <input
                    type="text"
                    value={editingCompany.website || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, website: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-sans"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editingCompany.phone || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-sans"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingCompany.email || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-sans"
                  />
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
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
