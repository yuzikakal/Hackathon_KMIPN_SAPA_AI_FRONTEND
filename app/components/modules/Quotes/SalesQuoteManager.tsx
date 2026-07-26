'use client';

import React, { useMemo, useState } from 'react';
import {
  FiEdit2,
  FiFileText,
  FiPlus,
  FiSave,
  FiTrash2,
} from 'react-icons/fi';
import { apiFetch } from '../../../lib/api';
import { Deal, Product, Quote, QuoteItem } from '../../../types';
import {
  buildSalesQuotePayload,
  calculateSalesQuoteTotals,
  emptySalesQuoteForm,
  emptyTemplateLine,
  quoteToForm,
  SalesQuoteFormValues,
} from './commercial';
import { ConfirmDeleteModal, CrudModal } from './CrudModal';

type Feedback = (message: string, failed?: boolean) => void;

interface SalesQuoteManagerProps {
  quotes: Quote[];
  deals: Deal[];
  products: Product[];
  loading: boolean;
  onSaved: (quote: Quote) => void;
  onDeleted: (quoteId: number) => void;
  onFeedback: Feedback;
}

const fieldClass =
  'w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-blue-600 focus:outline-none';

const currentDate = () => new Date().toISOString().slice(0, 10);

const generateQuoteNumber = () => {
  const date = currentDate().replaceAll('-', '');
  const suffix = crypto.randomUUID().slice(0, 6).toUpperCase();
  return `QUO-${date}-${suffix}`;
};

const formatMoney = (amount: number, currency: string) => {
  const safeCurrency = /^[A-Za-z]{3}$/.test(currency) ? currency.toUpperCase() : 'IDR';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: safeCurrency,
    maximumFractionDigits: 0,
  }).format(amount);
};

const statusClass = (status: string) => {
  switch (status.toLowerCase()) {
    case 'accepted':
      return 'border-emerald-800/60 bg-emerald-950 text-emerald-300';
    case 'rejected':
      return 'border-rose-800/60 bg-rose-950 text-rose-300';
    case 'sent':
      return 'border-amber-800/60 bg-amber-950 text-amber-300';
    default:
      return 'border-blue-800/60 bg-blue-950 text-blue-300';
  }
};

export const SalesQuoteManager: React.FC<SalesQuoteManagerProps> = ({
  quotes,
  deals,
  products,
  loading,
  onSaved,
  onDeleted,
  onFeedback,
}) => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<SalesQuoteFormValues>(() =>
    emptySalesQuoteForm(currentDate())
  );
  const [saving, setSaving] = useState(false);
  const [loadingEditId, setLoadingEditId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Quote | null>(null);

  const totals = useMemo(() => calculateSalesQuoteTotals(form), [form]);
  const dealNames = useMemo(
    () => new Map(deals.map((deal) => [deal.id, deal.title])),
    [deals]
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptySalesQuoteForm(currentDate(), generateQuoteNumber()));
    setFormOpen(true);
  };

  const openEdit = async (quote: Quote) => {
    setLoadingEditId(quote.id);
    try {
      const items = await apiFetch<QuoteItem[]>(`/api/v1/quotes/${quote.id}/items`, {
        silentError: true,
      });
      setEditingId(quote.id);
      setForm(quoteToForm(quote, items));
      setFormOpen(true);
    } catch (error) {
      onFeedback(
        error instanceof Error ? error.message : 'Line item quote tidak dapat dimuat.',
        true
      );
    } finally {
      setLoadingEditId(null);
    }
  };

  const updateItem = (
    index: number,
    patch: Partial<SalesQuoteFormValues['items'][number]>
  ) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => (
        itemIndex === index ? { ...item, ...patch } : item
      )),
    }));
  };

  const selectProduct = (index: number, selectedProductId: string) => {
    const product = products.find((item) => item.id === Number(selectedProductId));
    updateItem(index, {
      productId: selectedProductId,
      ...(product
        ? {
          description: product.name,
          unitPrice: String(product.unit_price),
        }
        : {}),
    });
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving || form.items.length === 0) return;
    setSaving(true);
    try {
      const endpoint = editingId ? `/api/v1/quotes/${editingId}` : '/api/v1/quotes';
      const quote = await apiFetch<Quote>(endpoint, {
        method: editingId ? 'PUT' : 'POST',
        silentError: true,
        body: JSON.stringify(buildSalesQuotePayload(form, editingId !== null)),
      });
      onSaved(quote);
      onFeedback(
        editingId
          ? `Sales quote ${quote.quote_number} berhasil diperbarui.`
          : `Sales quote ${quote.quote_number} berhasil dibuat.`
      );
      setFormOpen(false);
      setEditingId(null);
    } catch (error) {
      onFeedback(
        error instanceof Error ? error.message : 'Sales quote tidak dapat disimpan.',
        true
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (quote: Quote) => {
    setDeletingId(quote.id);
    try {
      await apiFetch<void>(`/api/v1/quotes/${quote.id}`, {
        method: 'DELETE',
        silentError: true,
      });
      onDeleted(quote.id);
      onFeedback(`Sales quote ${quote.quote_number} berhasil dihapus.`);
      setDeleteTarget(null);
      if (editingId === quote.id) {
        setEditingId(null);
        setFormOpen(false);
      }
    } catch (error) {
      onFeedback(
        error instanceof Error ? error.message : 'Sales quote tidak dapat dihapus.',
        true
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="astryx-card space-y-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold text-white">
            <FiFileText className="text-blue-400" /> Sales quotes
          </h2>
          <p className="mt-0.5 text-[11px] text-slate-500">{quotes.length} quotes</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          disabled={deals.length === 0}
          className="astryx-btn-primary flex items-center gap-1.5 px-3 py-2 text-xs disabled:opacity-50"
        >
          <FiPlus /> Tambah Quote
        </button>
      </div>

      {formOpen && (
        <CrudModal
          open={formOpen}
          title={editingId ? 'Edit Sales Quote' : 'Sales Quote baru'}
          onClose={() => setFormOpen(false)}
          closeDisabled={saving}
          maxWidth="4xl"
        >
          <form onSubmit={handleSave} className="space-y-3">

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <select
              value={form.dealId}
              onChange={(event) =>
                setForm((current) => ({ ...current, dealId: event.target.value }))
              }
              disabled={editingId !== null}
              aria-label="Deal Sales Quote"
              className={fieldClass}
              required
            >
              <option value="">Pilih deal</option>
              {deals.map((deal) => (
                <option key={deal.id} value={deal.id}>{deal.title}</option>
              ))}
            </select>
            <input
              value={form.quoteNumber}
              onChange={(event) =>
                setForm((current) => ({ ...current, quoteNumber: event.target.value }))
              }
              placeholder="Nomor quote"
              className={fieldClass}
              required
            />
            <input
              type="date"
              value={form.issueDate}
              onChange={(event) =>
                setForm((current) => ({ ...current, issueDate: event.target.value }))
              }
              aria-label="Tanggal terbit"
              className={fieldClass}
              required
            />
            <input
              type="date"
              min={form.issueDate}
              value={form.expiryDate}
              onChange={(event) =>
                setForm((current) => ({ ...current, expiryDate: event.target.value }))
              }
              aria-label="Tanggal kedaluwarsa"
              className={fieldClass}
            />
            <div className="grid grid-cols-[1fr_100px] gap-2">
              <input
                value={form.currency}
                onChange={(event) =>
                  setForm((current) => ({ ...current, currency: event.target.value }))
                }
                maxLength={3}
                pattern="[A-Za-z]{3}"
                aria-label="Mata uang quote"
                className={fieldClass}
                required
              />
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.taxRate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, taxRate: event.target.value }))
                }
                aria-label="Pajak quote persen"
                className={fieldClass}
                required
              />
            </div>
            <select
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({ ...current, status: event.target.value }))
              }
              disabled={editingId === null}
              aria-label="Status quote"
              className={fieldClass}
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
            <textarea
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({ ...current, notes: event.target.value }))
              }
              placeholder="Catatan quote"
              rows={2}
              className={`${fieldClass} sm:col-span-2`}
            />
          </div>

          <div className="space-y-2 border-t border-slate-800 pt-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-slate-300">Line items</p>
              <button
                type="button"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    items: [...current.items, emptyTemplateLine()],
                  }))
                }
                className="flex items-center gap-1 text-[10px] font-semibold text-blue-300"
              >
                <FiPlus /> Tambah item
              </button>
            </div>
            {form.items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-1 gap-2 rounded-lg border border-slate-800 bg-slate-950/70 p-3 md:grid-cols-12"
              >
                <select
                  value={item.productId}
                  onChange={(event) => selectProduct(index, event.target.value)}
                  className={`${fieldClass} md:col-span-3`}
                >
                  <option value="">Item custom</option>
                  {products.filter((product) => product.is_active).map((product) => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
                <input
                  value={item.description}
                  onChange={(event) => updateItem(index, { description: event.target.value })}
                  placeholder="Deskripsi"
                  className={`${fieldClass} md:col-span-4`}
                  required
                />
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={item.quantity}
                  onChange={(event) => updateItem(index, { quantity: event.target.value })}
                  aria-label={`Jumlah quote item ${index + 1}`}
                  className={`${fieldClass} md:col-span-1`}
                  required
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(event) => updateItem(index, { unitPrice: event.target.value })}
                  aria-label={`Harga quote item ${index + 1}`}
                  className={`${fieldClass} md:col-span-2`}
                  required
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.discount}
                  onChange={(event) => updateItem(index, { discount: event.target.value })}
                  aria-label={`Diskon quote item ${index + 1}`}
                  className={`${fieldClass} md:col-span-1`}
                />
                <button
                  type="button"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      items: current.items.filter((_, itemIndex) => itemIndex !== index),
                    }))
                  }
                  disabled={form.items.length === 1}
                  aria-label={`Hapus quote item ${index + 1}`}
                  className="flex items-center justify-center rounded-lg text-rose-300 disabled:opacity-30 md:col-span-1"
                >
                  <FiTrash2 />
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-right">
            <div>
              <p className="text-[9px] uppercase text-slate-500">Subtotal</p>
              <p className="text-[11px] text-slate-300">
                {formatMoney(totals.subtotal, form.currency || 'IDR')}
              </p>
            </div>
            <div>
              <p className="text-[9px] uppercase text-slate-500">Tax</p>
              <p className="text-[11px] text-slate-300">
                {formatMoney(totals.taxAmount, form.currency || 'IDR')}
              </p>
            </div>
            <div>
              <p className="text-[9px] uppercase text-slate-500">Total</p>
              <p className="text-xs font-bold text-emerald-400">
                {formatMoney(totals.totalAmount, form.currency || 'IDR')}
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="astryx-btn-primary flex w-full items-center justify-center gap-2 py-2 text-xs"
          >
            <FiSave /> {saving ? 'Menyimpan...' : 'Simpan Sales Quote'}
          </button>
          </form>
        </CrudModal>
      )}

      <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
        {quotes.map((quote) => (
          <article
            key={quote.id}
            className="rounded-lg border border-slate-800 bg-slate-900/60 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white">
                  {quote.quote_number}
                </p>
                <p className="truncate text-[10px] text-slate-500">
                  {dealNames.get(quote.deal_id) || `Deal #${quote.deal_id}`}
                  {quote.template_id ? ` · Template #${quote.template_id}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <span
                  className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase ${statusClass(quote.status)}`}
                >
                  {quote.status}
                </span>
                <button
                  type="button"
                  onClick={() => void openEdit(quote)}
                  disabled={loadingEditId !== null}
                  aria-label={`Edit ${quote.quote_number}`}
                  className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-blue-300 disabled:opacity-40"
                >
                  <FiEdit2 />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(quote)}
                  disabled={deletingId === quote.id}
                  aria-label={`Hapus ${quote.quote_number}`}
                  className="rounded p-1.5 text-rose-400 hover:bg-rose-950 disabled:opacity-40"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-800 pt-3 text-right">
              <div>
                <p className="text-[9px] uppercase text-slate-500">Subtotal</p>
                <p className="text-[11px] text-slate-300">
                  {formatMoney(quote.subtotal, quote.currency)}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase text-slate-500">Tax</p>
                <p className="text-[11px] text-slate-300">
                  {formatMoney(quote.tax_amount, quote.currency)}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase text-slate-500">Total</p>
                <p className="text-xs font-bold text-emerald-400">
                  {formatMoney(quote.total_amount, quote.currency)}
                </p>
              </div>
            </div>
          </article>
        ))}
        {!loading && quotes.length === 0 && (
          <p className="py-8 text-center text-xs text-slate-500">
            Belum ada Sales Quote. Tambahkan quote pertama.
          </p>
        )}
      </div>
      <ConfirmDeleteModal
        open={deleteTarget !== null}
        subject={deleteTarget ? `Sales Quote "${deleteTarget.quote_number}"` : 'Sales Quote'}
        deleting={deletingId !== null}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) void handleDelete(deleteTarget);
        }}
      />
    </section>
  );
};
