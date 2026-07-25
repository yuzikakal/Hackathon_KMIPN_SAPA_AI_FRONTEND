'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiAlertCircle,
  FiCheckCircle,
  FiCpu,
  FiFileText,
  FiRefreshCw,
} from 'react-icons/fi';
import { useRealtime } from '../../../context/RealtimeContext';
import { apiFetch } from '../../../lib/api';
import {
  AiNoteDraft,
  Company,
  Contact,
  Deal,
  Note,
} from '../../../types';
import { buildNotePayload, optionalId } from './notes';

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export const NotesModule: React.FC = () => {
  const { subscribeEntity } = useRealtime();
  const [notes, setNotes] = useState<Note[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [newContent, setNewContent] = useState('');
  const [contactId, setContactId] = useState('');
  const [dealId, setDealId] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [aiInstruction, setAiInstruction] = useState(
    'Rapikan menjadi catatan CRM internal yang ringkas dan berorientasi tindak lanjut.'
  );
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [aiDraft, setAiDraft] = useState<AiNoteDraft | null>(null);

  const fetchNotes = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const data = await apiFetch<Note[]>('/api/v1/notes', {
        silentError: true,
      });
      setNotes(data);
      setError(null);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Catatan tidak dapat dimuat.'));
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  const fetchRelations = useCallback(async () => {
    const results = await Promise.allSettled([
      apiFetch<Contact[]>('/api/v1/contacts', { silentError: true }),
      apiFetch<Deal[]>('/api/v1/deals', { silentError: true }),
      apiFetch<Company[]>('/api/v1/companies', { silentError: true }),
    ]);
    const [contactResult, dealResult, companyResult] = results;
    if (contactResult.status === 'fulfilled') setContacts(contactResult.value);
    if (dealResult.status === 'fulfilled') setDeals(dealResult.value);
    if (companyResult.status === 'fulfilled') setCompanies(companyResult.value);
  }, []);

  useEffect(() => {
    void Promise.all([fetchNotes(true), fetchRelations()]);
    const unsubscribeNote = subscribeEntity('note', () => void fetchNotes());
    const unsubscribeContact = subscribeEntity(
      'contact',
      () => void fetchRelations()
    );
    const unsubscribeDeal = subscribeEntity('deal', () => void fetchRelations());
    const unsubscribeCompany = subscribeEntity('company', () => void fetchRelations());
    return () => {
      unsubscribeNote();
      unsubscribeContact();
      unsubscribeDeal();
      unsubscribeCompany();
    };
  }, [fetchNotes, fetchRelations, subscribeEntity]);

  const contactNames = useMemo(
    () =>
      new Map(
        contacts.map((contact) => [
          contact.id,
          `${contact.first_name} ${contact.last_name || ''}`.trim(),
        ])
      ),
    [contacts]
  );
  const dealNames = useMemo(
    () => new Map(deals.map((deal) => [deal.id, deal.title])),
    [deals]
  );
  const companyNames = useMemo(
    () => new Map(companies.map((company) => [company.id, company.name])),
    [companies]
  );

  const handleDealChange = (value: string) => {
    setDealId(value);
    const deal = deals.find((item) => item.id === Number(value));
    if (!deal) return;
    if (deal.contact_id) setContactId(String(deal.contact_id));
    if (deal.company_id) setCompanyId(String(deal.company_id));
  };

  const handlePostNote = async (event: React.FormEvent) => {
    event.preventDefault();
    const content = newContent.trim();
    if (!content || posting) return;

    setPosting(true);
    setError(null);
    setMessage(null);
    try {
      const created = await apiFetch<Note>('/api/v1/notes', {
        method: 'POST',
        silentError: true,
        body: JSON.stringify(
          buildNotePayload(content, {
            contactId,
            dealId,
            companyId,
          })
        ),
      });
      setNotes((current) => [
        created,
        ...current.filter((note) => note.id !== created.id),
      ]);
      setNewContent('');
      setAiDraft(null);
      setMessage('Catatan berhasil disimpan dan akan tersinkron secara realtime.');
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Catatan tidak dapat disimpan.'));
    } finally {
      setPosting(false);
    }
  };

  const handleAiDraft = async () => {
    if (!aiInstruction.trim() || drafting) return;

    setDrafting(true);
    setError(null);
    setMessage(null);
    setAiDraft(null);
    try {
      const draft = await apiFetch<AiNoteDraft>('/api/v1/ai/notes/draft', {
        method: 'POST',
        silentError: true,
        body: JSON.stringify({
          instruction: aiInstruction.trim(),
          existing_content: newContent.trim() || null,
          contact_id: optionalId(contactId),
          deal_id: optionalId(dealId),
          company_id: optionalId(companyId),
          language: 'Indonesian',
        }),
      });
      const generatedContent =
        draft.draft.content || draft.draft.raw || draft.draft.summary;
      if (!generatedContent?.trim()) {
        throw new Error('AI tidak mengembalikan isi catatan.');
      }
      setAiDraft(draft);
      setNewContent(generatedContent.trim());
      setMessage('Draft AI dimasukkan ke editor. Periksa sebelum menyimpan.');
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Draft AI tidak dapat dibuat.'));
    } finally {
      setDrafting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-100">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">CRM Notes Stream</h1>
          <p className="text-xs text-slate-400">
            Catatan internal realtime dengan relasi CRM opsional dan draft AI terkontrol
          </p>
        </div>
        <button
          type="button"
          onClick={() => void Promise.all([fetchNotes(true), fetchRelations()])}
          disabled={loading}
          className="astryx-btn-secondary flex items-center justify-center gap-2 px-3 py-2 text-xs"
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-800/50 bg-red-950/40 p-3 text-xs text-red-300"
        >
          <FiAlertCircle className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {message && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-lg border border-emerald-800/50 bg-emerald-950/40 p-3 text-xs text-emerald-300"
        >
          <FiCheckCircle className="mt-0.5 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <div className="astryx-card space-y-4 border border-slate-800 bg-[#111827] p-4">
        <form onSubmit={handlePostNote} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="space-y-1 text-[11px] text-slate-400">
              <span>Deal (opsional)</span>
              <select
                value={dealId}
                onChange={(event) => handleDealChange(event.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-100"
              >
                <option value="">Tanpa deal</option>
                {deals.map((deal) => (
                  <option key={deal.id} value={deal.id}>{deal.title}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-[11px] text-slate-400">
              <span>Kontak (opsional)</span>
              <select
                value={contactId}
                onChange={(event) => setContactId(event.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-100"
              >
                <option value="">Tanpa kontak</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contactNames.get(contact.id)}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-[11px] text-slate-400">
              <span>Perusahaan (opsional)</span>
              <select
                value={companyId}
                onChange={(event) => setCompanyId(event.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-100"
              >
                <option value="">Tanpa perusahaan</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-1 text-[11px] text-slate-400">
            <span>Isi catatan</span>
            <textarea
              rows={5}
              value={newContent}
              onChange={(event) => {
                setNewContent(event.target.value);
                setAiDraft(null);
              }}
              placeholder="Tulis catatan internal CRM..."
              maxLength={10_000}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs text-slate-100 focus:border-blue-600 focus:outline-none"
              required
            />
          </label>

          <div className="rounded-xl border border-violet-800/40 bg-violet-950/15 p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-xs font-semibold text-violet-300">
                  <FiCpu /> Asisten draft AI
                </p>
                <p className="mt-1 text-[10px] text-slate-500">
                  AI hanya mengisi editor; tidak pernah menyimpan catatan otomatis.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-amber-950 px-2 py-1 text-[9px] font-bold text-amber-300">
                REVIEW WAJIB
              </span>
            </div>
            <textarea
              value={aiInstruction}
              onChange={(event) => setAiInstruction(event.target.value)}
              rows={2}
              maxLength={2000}
              aria-label="Instruksi draft AI"
              className="w-full rounded-lg border border-violet-900/60 bg-slate-950 p-3 text-xs text-slate-200 focus:border-violet-600 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => void handleAiDraft()}
              disabled={drafting || !aiInstruction.trim()}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-violet-700 bg-violet-900/40 px-4 py-2 text-xs font-semibold text-violet-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiCpu />
              {drafting ? 'Membuat draft...' : 'Buat draft untuk direview'}
            </button>
            {!!aiDraft?.draft.warnings?.length && (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-[11px] text-amber-300">
                {aiDraft.draft.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={posting || !newContent.trim()}
              className="astryx-btn-primary px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
            >
              {posting ? 'Menyimpan...' : 'Post Note'}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-3">
        {!loading && notes.length === 0 && (
          <div className="astryx-card flex flex-col items-center gap-2 border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
            <FiFileText className="text-2xl" />
            Belum ada catatan CRM.
          </div>
        )}
        {notes.map((note) => {
          const relations = [
            note.deal_id ? `Deal: ${dealNames.get(note.deal_id) || `#${note.deal_id}`}` : null,
            note.contact_id ? `Kontak: ${contactNames.get(note.contact_id) || `#${note.contact_id}`}` : null,
            note.company_id ? `Perusahaan: ${companyNames.get(note.company_id) || `#${note.company_id}`}` : null,
          ].filter(Boolean);
          return (
            <article key={note.id} className="astryx-card space-y-2 border border-slate-800 bg-[#111827] p-4">
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-200">
                {note.content}
              </p>
              <div className="flex flex-col gap-1 border-t border-slate-800 pt-2 text-[11px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                <span>{relations.length ? relations.join(' · ') : 'Catatan umum'}</span>
                <time dateTime={note.created_at || undefined}>
                  {note.created_at
                    ? new Date(note.created_at.replace(' ', 'T')).toLocaleString('id-ID')
                    : 'Baru saja'}
                </time>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
