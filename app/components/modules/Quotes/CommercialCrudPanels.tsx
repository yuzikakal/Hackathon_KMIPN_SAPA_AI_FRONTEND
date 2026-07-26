'use client';

import React, { useState } from 'react';
import {
  FiEdit2,
  FiFile,
  FiPaperclip,
  FiPlus,
  FiSave,
  FiTrash2,
} from 'react-icons/fi';
import {
  apiFetch,
  apiUpload,
  resolveApiAssetUrl,
} from '../../../lib/api';
import {
  Product,
  QuoteTemplate,
  QuoteTemplateItem,
} from '../../../types';
import {
  buildProductPayload,
  buildQuoteTemplatePayload,
  emptyProductForm,
  emptyQuoteTemplateForm,
  emptyTemplateLine,
  ProductFormValues,
  productToForm,
  QuoteTemplateFormValues,
  templateToForm,
} from './commercial';
import { ConfirmDeleteModal, CrudModal } from './CrudModal';

type Feedback = (message: string, failed?: boolean) => void;

const fieldClass =
  'w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-blue-600 focus:outline-none';

const getProductFiles = (product: Product) => (
  product.files?.length
    ? product.files
    : product.file_url
      ? [{
        id: -product.id,
        product_id: product.id,
        file_url: product.file_url,
        file_name: product.file_name || 'Product attachment',
        created_at: null,
      }]
      : []
);

interface ProductManagerProps {
  products: Product[];
  loading: boolean;
  onSaved: (product: Product) => void;
  onDeleted: (productId: number) => void;
  onFeedback: Feedback;
}

export const ProductCatalogManager: React.FC<ProductManagerProps> = ({
  products,
  loading,
  onSaved,
  onDeleted,
  onFeedback,
}) => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductFormValues>(emptyProductForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyProductForm());
    setPendingFiles([]);
    setFormOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingId(product.id);
    setForm(productToForm(product));
    setPendingFiles([]);
    setFormOpen(true);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      let values = form;
      if (form.files.length + pendingFiles.length > 20) {
        throw new Error('Satu product maksimal memiliki 20 lampiran.');
      }
      if (pendingFiles.some((file) => file.size > 10 * 1024 * 1024)) {
          throw new Error('Ukuran lampiran product maksimal 10 MB.');
      }
      if (pendingFiles.length > 0) {
        const uploadedFiles = await Promise.all(
          pendingFiles.map(async (file) => {
            const uploaded = await apiUpload(file, { silentError: true });
            return {
              fileUrl: uploaded.url,
              fileName: uploaded.filename || file.name,
            };
          })
        );
        values = {
          ...form,
          files: [...form.files, ...uploadedFiles],
        };
        setForm(values);
        setPendingFiles([]);
      }
      const endpoint = editingId
        ? `/api/v1/products/${editingId}`
        : '/api/v1/products';
      const savedProduct = await apiFetch<Product>(endpoint, {
        method: editingId ? 'PUT' : 'POST',
        silentError: true,
        body: JSON.stringify(buildProductPayload(values, editingId !== null)),
      });
      onSaved(savedProduct);
      onFeedback(editingId ? 'Product berhasil diperbarui.' : 'Product berhasil ditambahkan.');
      setFormOpen(false);
      setEditingId(null);
      setPendingFiles([]);
    } catch (error) {
      onFeedback(
        error instanceof Error ? error.message : 'Product tidak dapat disimpan.',
        true
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    setDeletingId(product.id);
    try {
      await apiFetch<void>(`/api/v1/products/${product.id}`, {
        method: 'DELETE',
        silentError: true,
      });
      onDeleted(product.id);
      onFeedback('Product berhasil dihapus.');
      setDeleteTarget(null);
    } catch (error) {
      onFeedback(
        error instanceof Error ? error.message : 'Product tidak dapat dihapus.',
        true
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="astryx-card space-y-4 p-5 xl:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white">Products</h2>
          <p className="mt-0.5 text-[11px] text-slate-500">{products.length} records</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="astryx-btn-primary flex items-center gap-1.5 px-3 py-2 text-xs"
        >
          <FiPlus /> Tambah Product
        </button>
      </div>

      {formOpen && (
        <CrudModal
          open={formOpen}
          title={editingId ? 'Edit Product' : 'Product baru'}
          onClose={() => setFormOpen(false)}
          closeDisabled={saving}
          maxWidth="2xl"
        >
          <form onSubmit={handleSave} className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="Nama product"
            className={fieldClass}
            required
          />
          <input
            value={form.sku}
            onChange={(event) =>
              setForm((current) => ({ ...current, sku: event.target.value }))
            }
            placeholder="SKU (opsional)"
            className={fieldClass}
          />
          <input
            value={form.category}
            onChange={(event) =>
              setForm((current) => ({ ...current, category: event.target.value }))
            }
            placeholder="Kategori"
            className={fieldClass}
          />
          <div className="grid grid-cols-[1fr_90px] gap-2">
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.unitPrice}
              onChange={(event) =>
                setForm((current) => ({ ...current, unitPrice: event.target.value }))
              }
              placeholder="Harga satuan"
              aria-label="Harga satuan"
              className={fieldClass}
              required
            />
            <input
              value={form.currency}
              onChange={(event) =>
                setForm((current) => ({ ...current, currency: event.target.value }))
              }
              maxLength={3}
              pattern="[A-Za-z]{3}"
              aria-label="Mata uang"
              className={fieldClass}
              required
            />
          </div>
          <textarea
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
            placeholder="Deskripsi product"
            rows={2}
            className={`${fieldClass} md:col-span-2`}
          />
          <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/60 p-3 md:col-span-2">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-700 px-3 py-4 text-xs text-slate-300 hover:border-blue-600 hover:text-blue-300">
              <FiPaperclip />
              <span>
                Tambah lampiran ({form.files.length + pendingFiles.length}/20, maks. 10 MB/file)
              </span>
              <input
                type="file"
                multiple
                className="sr-only"
                onChange={(event) => {
                  const selected = Array.from(event.target.files || []);
                  setPendingFiles((current) => [...current, ...selected]);
                  event.currentTarget.value = '';
                }}
              />
            </label>
            <div className="max-h-36 space-y-1.5 overflow-y-auto">
              {form.files.map((file, index) => (
                <div
                  key={`${file.fileUrl}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-lg bg-slate-900 px-3 py-2 text-[11px]"
                >
                  <span className="min-w-0 truncate text-slate-300">{file.fileName}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        files: current.files.filter((_, fileIndex) => fileIndex !== index),
                      }))
                    }
                    className="shrink-0 text-rose-300 hover:text-rose-200"
                  >
                    Hapus
                  </button>
                </div>
              ))}
              {pendingFiles.map((file, index) => (
                <div
                  key={`${file.name}-${file.size}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-blue-900/50 bg-blue-950/20 px-3 py-2 text-[11px]"
                >
                  <span className="min-w-0 truncate text-blue-200">
                    {file.name} · menunggu upload
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPendingFiles((current) =>
                        current.filter((_, fileIndex) => fileIndex !== index)
                      )
                    }
                    className="shrink-0 text-rose-300 hover:text-rose-200"
                  >
                    Batal
                  </button>
                </div>
              ))}
            </div>
          </div>
          {editingId && (
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setForm((current) => ({ ...current, isActive: event.target.checked }))
                }
              />
              Product aktif
            </label>
          )}
          <button
            type="submit"
            disabled={saving}
            className="astryx-btn-primary flex items-center justify-center gap-2 py-2 text-xs md:col-span-2"
          >
            <FiSave /> {saving ? 'Menyimpan...' : 'Simpan Product'}
          </button>
          </form>
        </CrudModal>
      )}

      <div className="grid max-h-[430px] grid-cols-1 gap-3 overflow-y-auto pr-1 md:grid-cols-2">
        {products.map((product) => (
          <article
            key={product.id}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-semibold text-white">{product.name}</h3>
                  {!product.is_active && (
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-400">
                      nonaktif
                    </span>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                  {product.description || 'Tidak ada deskripsi product'}
                </p>
              </div>
              <span className="rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                {product.sku || `#${product.id}`}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-3">
              <span className="text-[10px] text-slate-500">
                {product.category || 'Tanpa kategori'}
              </span>
              <span className="text-sm font-bold text-blue-400">
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: product.currency,
                  maximumFractionDigits: 0,
                }).format(product.unit_price)}
              </span>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => openEdit(product)}
                className="flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1.5 text-[10px] text-slate-300 hover:border-blue-600 hover:text-blue-300"
              >
                <FiEdit2 /> Edit
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(product)}
                disabled={deletingId === product.id}
                className="flex items-center gap-1 rounded-lg border border-rose-900/70 px-2.5 py-1.5 text-[10px] text-rose-300 disabled:opacity-50"
              >
                <FiTrash2 /> {deletingId === product.id ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
            {getProductFiles(product).length > 0 && (
              <div className="mt-3 max-h-28 space-y-1.5 overflow-y-auto">
                {getProductFiles(product).map((file) => (
                  <a
                    key={file.id}
                    href={resolveApiAssetUrl(file.file_url) || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-[10px] text-blue-300 hover:border-blue-700"
                  >
                    <FiFile className="shrink-0" />
                    <span className="truncate">{file.file_name}</span>
                  </a>
                ))}
              </div>
            )}
          </article>
        ))}
        {!loading && products.length === 0 && (
          <p className="py-8 text-center text-xs text-slate-500 md:col-span-2">
            Belum ada product. Tambahkan product pertama.
          </p>
        )}
      </div>
      <ConfirmDeleteModal
        open={deleteTarget !== null}
        subject={deleteTarget ? `product "${deleteTarget.name}"` : 'product'}
        deleting={deletingId !== null}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) void handleDelete(deleteTarget);
        }}
      />
    </section>
  );
};

interface QuoteTemplateManagerProps {
  templates: QuoteTemplate[];
  products: Product[];
  onSaved: (template: QuoteTemplate) => void;
  onDeleted: (templateId: number) => void;
  onFeedback: Feedback;
}

export const QuoteTemplateManager: React.FC<QuoteTemplateManagerProps> = ({
  templates,
  products,
  onSaved,
  onDeleted,
  onFeedback,
}) => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<QuoteTemplateFormValues>(emptyQuoteTemplateForm);
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QuoteTemplate | null>(null);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyQuoteTemplateForm());
    setFormOpen(true);
  };

  const openEdit = async (template: QuoteTemplate) => {
    setLoadingEdit(true);
    try {
      const items = await apiFetch<QuoteTemplateItem[]>(
        `/api/v1/quote-templates/${template.id}/items`,
        { silentError: true }
      );
      setEditingId(template.id);
      setForm(templateToForm(template, items));
      setFormOpen(true);
    } catch (error) {
      onFeedback(
        error instanceof Error ? error.message : 'Line item template tidak dapat dimuat.',
        true
      );
    } finally {
      setLoadingEdit(false);
    }
  };

  const updateItem = (
    index: number,
    patch: Partial<QuoteTemplateFormValues['items'][number]>
  ) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      ),
    }));
  };

  const handleProductSelection = (index: number, productId: string) => {
    const product = products.find((item) => item.id === Number(productId));
    updateItem(index, {
      productId,
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
      const endpoint = editingId
        ? `/api/v1/quote-templates/${editingId}`
        : '/api/v1/quote-templates';
      const savedTemplate = await apiFetch<QuoteTemplate>(endpoint, {
        method: editingId ? 'PUT' : 'POST',
        silentError: true,
        body: JSON.stringify(buildQuoteTemplatePayload(form, editingId !== null)),
      });
      onSaved(savedTemplate);
      onFeedback(
        editingId
          ? 'Quote Template berhasil diperbarui.'
          : 'Quote Template berhasil ditambahkan.'
      );
      setFormOpen(false);
      setEditingId(null);
    } catch (error) {
      onFeedback(
        error instanceof Error ? error.message : 'Quote Template tidak dapat disimpan.',
        true
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (template: QuoteTemplate) => {
    setDeletingId(template.id);
    try {
      await apiFetch<void>(`/api/v1/quote-templates/${template.id}`, {
        method: 'DELETE',
        silentError: true,
      });
      onDeleted(template.id);
      onFeedback('Quote Template berhasil dihapus.');
      setDeleteTarget(null);
    } catch (error) {
      onFeedback(
        error instanceof Error ? error.message : 'Quote Template tidak dapat dihapus.',
        true
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white">Quote templates</h2>
          <p className="mt-0.5 text-[11px] text-slate-500">{templates.length} templates</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="astryx-btn-primary flex items-center gap-1.5 px-3 py-2 text-xs"
        >
          <FiPlus /> Tambah Template
        </button>
      </div>

      {formOpen && (
        <CrudModal
          open={formOpen}
          title={editingId ? 'Edit Quote Template' : 'Quote Template baru'}
          onClose={() => setFormOpen(false)}
          closeDisabled={saving}
          maxWidth="4xl"
        >
          <form onSubmit={handleSave} className="space-y-3">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <input
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Nama template"
              className={fieldClass}
              required
            />
            <div className="grid grid-cols-[1fr_100px] gap-2">
              <input
                value={form.currency}
                onChange={(event) =>
                  setForm((current) => ({ ...current, currency: event.target.value }))
                }
                maxLength={3}
                pattern="[A-Za-z]{3}"
                aria-label="Mata uang template"
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
                aria-label="Pajak persen"
                className={fieldClass}
                required
              />
            </div>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="Deskripsi template"
              rows={2}
              className={`${fieldClass} md:col-span-2`}
            />
            <textarea
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({ ...current, notes: event.target.value }))
              }
              placeholder="Catatan quote"
              rows={2}
              className={fieldClass}
            />
            <textarea
              value={form.terms}
              onChange={(event) =>
                setForm((current) => ({ ...current, terms: event.target.value }))
              }
              placeholder="Syarat dan ketentuan"
              rows={2}
              className={fieldClass}
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
                className="flex items-center gap-1 text-[10px] font-semibold text-indigo-300"
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
                  onChange={(event) => handleProductSelection(index, event.target.value)}
                  className={`${fieldClass} md:col-span-3`}
                >
                  <option value="">Custom item</option>
                  {products.filter((product) => product.is_active).map((product) => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
                <input
                  value={item.description}
                  onChange={(event) =>
                    updateItem(index, { description: event.target.value })
                  }
                  placeholder="Deskripsi item"
                  className={`${fieldClass} md:col-span-4`}
                  required
                />
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={item.quantity}
                  onChange={(event) => updateItem(index, { quantity: event.target.value })}
                  aria-label={`Jumlah item ${index + 1}`}
                  className={`${fieldClass} md:col-span-1`}
                  required
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(event) => updateItem(index, { unitPrice: event.target.value })}
                  aria-label={`Harga item ${index + 1}`}
                  className={`${fieldClass} md:col-span-2`}
                  required
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.discount}
                  onChange={(event) => updateItem(index, { discount: event.target.value })}
                  aria-label={`Diskon item ${index + 1}`}
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
                  aria-label={`Hapus item ${index + 1}`}
                  className="flex items-center justify-center rounded-lg text-rose-300 disabled:opacity-30 md:col-span-1"
                >
                  <FiTrash2 />
                </button>
              </div>
            ))}
          </div>

          {editingId && (
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setForm((current) => ({ ...current, isActive: event.target.checked }))
                }
              />
              Template aktif
            </label>
          )}
          <button
            type="submit"
            disabled={saving}
            className="astryx-btn-primary flex w-full items-center justify-center gap-2 py-2 text-xs"
          >
            <FiSave /> {saving ? 'Menyimpan...' : 'Simpan Quote Template'}
          </button>
          </form>
        </CrudModal>
      )}

      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
        {templates.map((template) => (
          <article
            key={template.id}
            className="rounded-lg border border-slate-800 bg-slate-900/60 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-xs font-semibold text-white">{template.name}</p>
                  {!template.is_active && (
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-400">
                      nonaktif
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {template.description || 'Reusable quote blueprint'}
                </p>
                <p className="mt-1 text-[10px] text-indigo-300">
                  {template.tax_rate}% tax · {template.currency}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => void openEdit(template)}
                  disabled={loadingEdit}
                  aria-label={`Edit ${template.name}`}
                  className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-indigo-300"
                >
                  <FiEdit2 />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(template)}
                  disabled={deletingId === template.id}
                  aria-label={`Hapus ${template.name}`}
                  className="rounded p-1.5 text-rose-400 hover:bg-rose-950"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          </article>
        ))}
        {templates.length === 0 && (
          <p className="py-6 text-center text-xs text-slate-500">
            Belum ada Quote Template.
          </p>
        )}
      </div>
      <ConfirmDeleteModal
        open={deleteTarget !== null}
        subject={deleteTarget ? `Quote Template "${deleteTarget.name}"` : 'Quote Template'}
        deleting={deletingId !== null}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) void handleDelete(deleteTarget);
        }}
      />
    </>
  );
};
