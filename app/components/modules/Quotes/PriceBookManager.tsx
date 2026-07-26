'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiBookOpen,
  FiEdit2,
  FiLayers,
  FiPlus,
  FiSave,
  FiStar,
  FiTrash2,
} from 'react-icons/fi';
import { apiFetch } from '../../../lib/api';
import { PriceBook, PriceBookItem, Product } from '../../../types';
import {
  buildPriceBookItemPayload,
  buildPriceBookPayload,
  emptyPriceBookForm,
  emptyPriceBookItemForm,
  PriceBookFormValues,
  PriceBookItemFormValues,
  priceBookItemToForm,
  priceBookToForm,
} from './commercial';
import { ConfirmDeleteModal, CrudModal } from './CrudModal';

type Feedback = (message: string, failed?: boolean) => void;

interface PriceBookManagerProps {
  priceBooks: PriceBook[];
  products: Product[];
  loading: boolean;
  refreshKey: number;
  onSaved: (priceBook: PriceBook) => void;
  onDeleted: (priceBookId: number) => void;
  onFeedback: Feedback;
}

const fieldClass =
  'w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-blue-600 focus:outline-none';

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

export const PriceBookManager: React.FC<PriceBookManagerProps> = ({
  priceBooks,
  products,
  loading,
  refreshKey,
  onSaved,
  onDeleted,
  onFeedback,
}) => {
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [items, setItems] = useState<PriceBookItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const [bookFormOpen, setBookFormOpen] = useState(false);
  const [editingBookId, setEditingBookId] = useState<number | null>(null);
  const [bookForm, setBookForm] = useState<PriceBookFormValues>(emptyPriceBookForm);
  const [savingBook, setSavingBook] = useState(false);
  const [bookFormError, setBookFormError] = useState<string | null>(null);
  const [bookDeleteTarget, setBookDeleteTarget] = useState<PriceBook | null>(null);
  const [deletingBookId, setDeletingBookId] = useState<number | null>(null);

  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [itemForm, setItemForm] =
    useState<PriceBookItemFormValues>(emptyPriceBookItemForm);
  const [savingItem, setSavingItem] = useState(false);
  const [itemFormError, setItemFormError] = useState<string | null>(null);
  const [itemDeleteTarget, setItemDeleteTarget] = useState<PriceBookItem | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);

  const selectedBook = useMemo(
    () => priceBooks.find((book) => book.id === selectedBookId) || null,
    [priceBooks, selectedBookId]
  );
  const productNames = useMemo(
    () => new Map(products.map((product) => [product.id, product.name])),
    [products]
  );

  const loadItems = useCallback(async (priceBookId: number) => {
    setLoadingItems(true);
    try {
      const loaded = await apiFetch<PriceBookItem[]>(
        `/api/v1/price-books/${priceBookId}/items`,
        { silentError: true }
      );
      setItems(loaded);
    } catch (error) {
      setItems([]);
      onFeedback(
        error instanceof Error ? error.message : 'Tier harga tidak dapat dimuat.',
        true
      );
    } finally {
      setLoadingItems(false);
    }
  }, [onFeedback]);

  useEffect(() => {
    if (selectedBookId && priceBooks.some((book) => book.id === selectedBookId)) {
      return;
    }
    const preferred =
      priceBooks.find((book) => book.is_default)
      || priceBooks[0]
      || null;
    setSelectedBookId(preferred?.id || null);
  }, [priceBooks, selectedBookId]);

  useEffect(() => {
    if (!selectedBookId) {
      setItems([]);
      return;
    }
    void loadItems(selectedBookId);
  }, [loadItems, refreshKey, selectedBookId]);

  const openCreateBook = () => {
    setEditingBookId(null);
    setBookForm(emptyPriceBookForm());
    setBookFormError(null);
    setBookFormOpen(true);
  };

  const openEditBook = (priceBook: PriceBook) => {
    setEditingBookId(priceBook.id);
    setBookForm(priceBookToForm(priceBook));
    setBookFormError(null);
    setBookFormOpen(true);
  };

  const handleSaveBook = async (event: React.FormEvent) => {
    event.preventDefault();
    if (savingBook) return;
    setSavingBook(true);
    setBookFormError(null);
    try {
      const endpoint = editingBookId
        ? `/api/v1/price-books/${editingBookId}`
        : '/api/v1/price-books';
      const saved = await apiFetch<PriceBook>(endpoint, {
        method: editingBookId ? 'PUT' : 'POST',
        silentError: true,
        body: JSON.stringify(buildPriceBookPayload(bookForm, editingBookId !== null)),
      });
      onSaved(saved);
      setSelectedBookId(saved.id);
      onFeedback(
        editingBookId
          ? 'Price Book berhasil diperbarui.'
          : 'Price Book berhasil ditambahkan.'
      );
      setBookFormOpen(false);
      setEditingBookId(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Price Book tidak dapat disimpan.';
      setBookFormError(message);
      onFeedback(message, true);
    } finally {
      setSavingBook(false);
    }
  };

  const handleDeleteBook = async (priceBook: PriceBook) => {
    setDeletingBookId(priceBook.id);
    try {
      await apiFetch<void>(`/api/v1/price-books/${priceBook.id}`, {
        method: 'DELETE',
        silentError: true,
      });
      onDeleted(priceBook.id);
      if (selectedBookId === priceBook.id) {
        setSelectedBookId(null);
        setItems([]);
      }
      setBookDeleteTarget(null);
      onFeedback('Price Book berhasil dihapus.');
    } catch (error) {
      onFeedback(
        error instanceof Error ? error.message : 'Price Book tidak dapat dihapus.',
        true
      );
    } finally {
      setDeletingBookId(null);
    }
  };

  const openCreateItem = () => {
    setEditingItemId(null);
    setItemForm(emptyPriceBookItemForm());
    setItemFormError(null);
    setItemFormOpen(true);
  };

  const openEditItem = (item: PriceBookItem) => {
    setEditingItemId(item.id);
    setItemForm(priceBookItemToForm(item));
    setItemFormError(null);
    setItemFormOpen(true);
  };

  const handleSaveItem = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedBook || savingItem) return;
    setSavingItem(true);
    setItemFormError(null);
    try {
      const endpoint = editingItemId
        ? `/api/v1/price-books/${selectedBook.id}/items/${editingItemId}`
        : `/api/v1/price-books/${selectedBook.id}/items`;
      const saved = await apiFetch<PriceBookItem>(endpoint, {
        method: editingItemId ? 'PUT' : 'POST',
        silentError: true,
        body: JSON.stringify(buildPriceBookItemPayload(itemForm, editingItemId === null)),
      });
      setItems((current) => {
        const exists = current.some((item) => item.id === saved.id);
        const next = exists
          ? current.map((item) => item.id === saved.id ? saved : item)
          : [...current, saved];
        return next.sort((left, right) =>
          left.product_id - right.product_id
          || left.min_quantity - right.min_quantity
        );
      });
      onFeedback(
        editingItemId ? 'Tier harga berhasil diperbarui.' : 'Tier harga berhasil ditambahkan.'
      );
      setItemFormOpen(false);
      setEditingItemId(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Tier harga tidak dapat disimpan.';
      setItemFormError(message);
      onFeedback(message, true);
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = async (item: PriceBookItem) => {
    if (!selectedBook) return;
    setDeletingItemId(item.id);
    try {
      await apiFetch<void>(
        `/api/v1/price-books/${selectedBook.id}/items/${item.id}`,
        { method: 'DELETE', silentError: true }
      );
      setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
      setItemDeleteTarget(null);
      onFeedback('Tier harga berhasil dihapus.');
    } catch (error) {
      onFeedback(
        error instanceof Error ? error.message : 'Tier harga tidak dapat dihapus.',
        true
      );
    } finally {
      setDeletingItemId(null);
    }
  };

  return (
    <section className="astryx-card space-y-4 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold text-white">
            <FiBookOpen className="text-blue-400" /> Price Books
          </h2>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {priceBooks.length} price book · {items.length} tier pada pilihan aktif
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateBook}
          className="astryx-btn-primary flex items-center justify-center gap-1.5 px-3 py-2 text-xs"
        >
          <FiPlus /> Tambah Price Book
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(240px,0.8fr)_minmax(0,2fr)]">
        <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {priceBooks.map((priceBook) => (
            <article
              key={priceBook.id}
              className={`rounded-xl border p-3 ${selectedBookId === priceBook.id
                  ? 'border-blue-700 bg-blue-950/25'
                  : 'border-slate-800 bg-slate-900/60'
                }`}
            >
              <div className="flex items-start gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedBookId(priceBook.id)}
                  className="min-w-0 flex-1 text-left"
                  aria-pressed={selectedBookId === priceBook.id}
                >
                  <span className="flex items-center gap-2">
                    <span className="truncate text-xs font-semibold text-white">
                      {priceBook.name}
                    </span>
                    {priceBook.is_default && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-950 px-2 py-0.5 text-[9px] text-amber-300">
                        <FiStar /> default
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block text-[10px] text-slate-500">
                    {priceBook.currency} · {priceBook.is_active ? 'aktif' : 'nonaktif'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => openEditBook(priceBook)}
                  aria-label={`Edit ${priceBook.name}`}
                  className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-blue-300"
                >
                  <FiEdit2 />
                </button>
                <button
                  type="button"
                  onClick={() => setBookDeleteTarget(priceBook)}
                  aria-label={`Hapus ${priceBook.name}`}
                  className="rounded p-1.5 text-rose-400 hover:bg-rose-950"
                >
                  <FiTrash2 />
                </button>
              </div>
              {priceBook.description && (
                <p className="mt-2 line-clamp-2 text-[10px] text-slate-400">
                  {priceBook.description}
                </p>
              )}
            </article>
          ))}
          {!loading && priceBooks.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-800 px-3 py-8 text-center text-xs text-slate-500">
              Belum ada Price Book.
            </p>
          )}
        </div>

        <div className="min-w-0 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          {selectedBook ? (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="flex items-center gap-2 text-xs font-semibold text-white">
                    <FiLayers className="text-emerald-400" />
                    Tier harga · {selectedBook.name}
                  </h3>
                  <p className="mt-1 text-[10px] text-slate-500">
                    Tier dengan quantity terbesar yang memenuhi pesanan akan digunakan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openCreateItem}
                  disabled={products.length === 0}
                  className="astryx-btn-secondary flex items-center justify-center gap-1.5 px-3 py-2 text-xs disabled:opacity-40"
                >
                  <FiPlus /> Tambah Tier
                </button>
              </div>

              <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
                {items.map((item) => (
                  <article
                    key={item.id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-white">
                        {productNames.get(item.product_id) || `Product #${item.product_id}`}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-500">
                        Mulai {item.min_quantity} unit
                      </p>
                    </div>
                    <p className="text-sm font-bold text-emerald-400">
                      {formatMoney(item.unit_price, selectedBook.currency)}
                      <span className="ml-1 text-[10px] font-normal text-slate-500">/unit</span>
                    </p>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => openEditItem(item)}
                        aria-label={`Edit tier ${productNames.get(item.product_id) || item.product_id}`}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-blue-300"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        type="button"
                        onClick={() => setItemDeleteTarget(item)}
                        aria-label={`Hapus tier ${productNames.get(item.product_id) || item.product_id}`}
                        className="rounded p-1.5 text-rose-400 hover:bg-rose-950"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </article>
                ))}
                {!loadingItems && items.length === 0 && (
                  <p className="rounded-xl border border-dashed border-slate-800 px-3 py-8 text-center text-xs text-slate-500">
                    Belum ada tier harga pada Price Book ini.
                  </p>
                )}
                {loadingItems && (
                  <p className="py-8 text-center text-xs text-slate-500">Memuat tier harga...</p>
                )}
              </div>
            </>
          ) : (
            <p className="py-12 text-center text-xs text-slate-500">
              Pilih atau buat Price Book untuk mengelola tier harga.
            </p>
          )}
        </div>
      </div>

      <CrudModal
        open={bookFormOpen}
        title={editingBookId ? 'Edit Price Book' : 'Price Book baru'}
        onClose={() => setBookFormOpen(false)}
        closeDisabled={savingBook}
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveBook} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {bookFormError && (
            <p role="alert" className="rounded-lg border border-rose-900 bg-rose-950/30 p-3 text-xs text-rose-300 sm:col-span-2">
              {bookFormError}
            </p>
          )}
          <input
            value={bookForm.name}
            onChange={(event) =>
              setBookForm((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="Nama Price Book"
            aria-label="Nama Price Book"
            className={fieldClass}
            required
          />
          <input
            value={bookForm.currency}
            onChange={(event) =>
              setBookForm((current) => ({ ...current, currency: event.target.value }))
            }
            placeholder="IDR"
            aria-label="Mata uang Price Book"
            maxLength={3}
            pattern="[A-Za-z]{3}"
            className={fieldClass}
            required
          />
          <textarea
            value={bookForm.description}
            onChange={(event) =>
              setBookForm((current) => ({ ...current, description: event.target.value }))
            }
            placeholder="Deskripsi Price Book"
            aria-label="Deskripsi Price Book"
            rows={3}
            className={`${fieldClass} sm:col-span-2`}
          />
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={bookForm.isDefault}
              onChange={(event) =>
                setBookForm((current) => ({ ...current, isDefault: event.target.checked }))
              }
            />
            Jadikan Price Book default
          </label>
          {editingBookId && (
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={bookForm.isActive}
                onChange={(event) =>
                  setBookForm((current) => ({ ...current, isActive: event.target.checked }))
                }
              />
              Price Book aktif
            </label>
          )}
          <button
            type="submit"
            disabled={savingBook}
            className="astryx-btn-primary flex items-center justify-center gap-2 py-2 text-xs sm:col-span-2"
          >
            <FiSave /> {savingBook ? 'Menyimpan...' : 'Simpan Price Book'}
          </button>
        </form>
      </CrudModal>

      <CrudModal
        open={itemFormOpen}
        title={editingItemId ? 'Edit tier harga' : 'Tier harga baru'}
        onClose={() => setItemFormOpen(false)}
        closeDisabled={savingItem}
        maxWidth="md"
      >
        <form onSubmit={handleSaveItem} className="space-y-3">
          {itemFormError && (
            <p role="alert" className="rounded-lg border border-rose-900 bg-rose-950/30 p-3 text-xs text-rose-300">
              {itemFormError}
            </p>
          )}
          <select
            value={itemForm.productId}
            onChange={(event) =>
              setItemForm((current) => ({ ...current, productId: event.target.value }))
            }
            disabled={editingItemId !== null}
            aria-label="Product tier harga"
            className={fieldClass}
            required
          >
            <option value="">Pilih product</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>{product.name}</option>
            ))}
          </select>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={itemForm.minQuantity}
            onChange={(event) =>
              setItemForm((current) => ({ ...current, minQuantity: event.target.value }))
            }
            placeholder="Quantity minimum"
            aria-label="Quantity minimum"
            className={fieldClass}
            required
          />
          <input
            type="number"
            min="0"
            step="0.01"
            value={itemForm.unitPrice}
            onChange={(event) =>
              setItemForm((current) => ({ ...current, unitPrice: event.target.value }))
            }
            placeholder="Harga per unit"
            aria-label="Harga per unit"
            className={fieldClass}
            required
          />
          <button
            type="submit"
            disabled={savingItem}
            className="astryx-btn-primary flex w-full items-center justify-center gap-2 py-2 text-xs"
          >
            <FiSave /> {savingItem ? 'Menyimpan...' : 'Simpan Tier'}
          </button>
        </form>
      </CrudModal>

      <ConfirmDeleteModal
        open={bookDeleteTarget !== null}
        subject={bookDeleteTarget ? `Price Book "${bookDeleteTarget.name}"` : 'Price Book'}
        deleting={deletingBookId !== null}
        onCancel={() => setBookDeleteTarget(null)}
        onConfirm={() => {
          if (bookDeleteTarget) void handleDeleteBook(bookDeleteTarget);
        }}
      />
      <ConfirmDeleteModal
        open={itemDeleteTarget !== null}
        subject={
          itemDeleteTarget
            ? `tier ${productNames.get(itemDeleteTarget.product_id) || `Product #${itemDeleteTarget.product_id}`} mulai ${itemDeleteTarget.min_quantity} unit`
            : 'tier harga'
        }
        deleting={deletingItemId !== null}
        onCancel={() => setItemDeleteTarget(null)}
        onConfirm={() => {
          if (itemDeleteTarget) void handleDeleteItem(itemDeleteTarget);
        }}
      />
    </section>
  );
};
