'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FiAlertCircle,
  FiCheckCircle,
  FiCpu,
  FiRefreshCw,
  FiSearch,
} from 'react-icons/fi';
import { useRealtime } from '../../../context/RealtimeContext';
import { apiFetch } from '../../../lib/api';
import { applyRealtimeChange } from '../../../lib/realtime';
import {
  AiQuoteDraft,
  Deal,
  PriceBook,
  Product,
  Quote,
  QuoteTemplate,
  ResolvedPrice,
} from '../../../types';
import {
  ProductCatalogManager,
  QuoteTemplateManager,
} from './CommercialCrudPanels';
import { upsertPriceBook } from './commercial';
import { PriceBookManager } from './PriceBookManager';
import { SalesQuoteManager } from './SalesQuoteManager';

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const today = () => new Date().toISOString().slice(0, 10);

const formatMoney = (amount: number, currency = 'IDR') =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

export const ProductsQuotesModule: React.FC = () => {
  const { subscribeEntity } = useRealtime();
  const [products, setProducts] = useState<Product[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [priceBooks, setPriceBooks] = useState<PriceBook[]>([]);
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [priceBookId, setPriceBookId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [resolvedPrice, setResolvedPrice] = useState<ResolvedPrice | null>(null);
  const [resolvingPrice, setResolvingPrice] = useState(false);
  const [priceBookRefreshKey, setPriceBookRefreshKey] = useState(0);

  const [templateId, setTemplateId] = useState('');
  const [templateDealId, setTemplateDealId] = useState('');
  const [instantiating, setInstantiating] = useState(false);

  const [aiDealId, setAiDealId] = useState('');
  const [aiQuoteId, setAiQuoteId] = useState('');
  const [aiTemplateId, setAiTemplateId] = useState('');
  const [aiInstruction, setAiInstruction] = useState(
    'Draft a concise introduction and recommended next step for this quote.'
  );
  const [aiDraft, setAiDraft] = useState<AiQuoteDraft | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionFailed, setActionFailed] = useState(false);
  const initialLoadStartedRef = useRef(false);

  const fetchWorkspace = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    const results = await Promise.allSettled([
      apiFetch<Product[]>('/api/v1/products', { silentError: true }),
      apiFetch<Quote[]>('/api/v1/quotes', { silentError: true }),
      apiFetch<PriceBook[]>('/api/v1/price-books', { silentError: true }),
      apiFetch<QuoteTemplate[]>('/api/v1/quote-templates', { silentError: true }),
      apiFetch<Deal[]>('/api/v1/deals', { silentError: true }),
    ]);

    const [productResult, quoteResult, priceBookResult, templateResult, dealResult] = results;
    if (productResult.status === 'fulfilled') setProducts(productResult.value);
    if (quoteResult.status === 'fulfilled') setQuotes(quoteResult.value);
    if (priceBookResult.status === 'fulfilled') setPriceBooks(priceBookResult.value);
    if (templateResult.status === 'fulfilled') setTemplates(templateResult.value);
    if (dealResult.status === 'fulfilled') setDeals(dealResult.value);

    const failure = results.find((result) => result.status === 'rejected');
    setError(
      failure?.status === 'rejected'
        ? getErrorMessage(failure.reason, 'Some commercial API resources could not be loaded.')
        : null
    );
    setLoading(false);
  }, []);

  const showFeedback = useCallback((message: string, failed = false) => {
    setActionMessage(message);
    setActionFailed(failed);
  }, []);

  useEffect(() => {
    if (!initialLoadStartedRef.current) {
      initialLoadStartedRef.current = true;
      void fetchWorkspace(true);
    }
    const unsubscribers = [
      subscribeEntity('product', (event) => {
        setProducts((current) => applyRealtimeChange(current, event));
      }),
      subscribeEntity('price_book', (event) => {
        setPriceBookRefreshKey((current) => current + 1);
        if (event.action === 'deleted' && typeof event.id === 'number') {
          setPriceBooks((current) => current.filter((book) => book.id !== event.id));
          return;
        }
        const incoming = event.payload as PriceBook | undefined;
        if (incoming && typeof incoming.id === 'number') {
          setPriceBooks((current) => upsertPriceBook(current, incoming));
        }
      }),
      subscribeEntity('quote', (event) => {
        setQuotes((current) => applyRealtimeChange(current, event));
      }),
      subscribeEntity('quote_template', (event) => {
        setTemplates((current) => applyRealtimeChange(current, event));
      }),
    ];
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [fetchWorkspace, subscribeEntity]);

  useEffect(() => {
    const selectedBookExists = priceBooks.some(
      (book) => book.id === Number(priceBookId) && book.is_active
    );
    if (!selectedBookExists) {
      const preferredBook =
        priceBooks.find((book) => book.is_default && book.is_active)
        || priceBooks.find((book) => book.is_active);
      setPriceBookId(preferredBook ? String(preferredBook.id) : '');
      setResolvedPrice(null);
    }
    if (!productId && products[0]) setProductId(String(products[0].id));
  }, [priceBooks, priceBookId, productId, products]);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === Number(productId)),
    [productId, products]
  );

  const handleResolvePrice = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!priceBookId || !productId || quantity <= 0) return;
    setResolvingPrice(true);
    setResolvedPrice(null);
    setActionMessage(null);
    setActionFailed(false);
    try {
      const result = await apiFetch<ResolvedPrice>(
        `/api/v1/price-books/${priceBookId}/resolve/${productId}?quantity=${encodeURIComponent(quantity)}`
      );
      setResolvedPrice(result);
    } catch (requestError) {
      showFeedback(
        getErrorMessage(requestError, 'No eligible price tier was found.'),
        true
      );
    } finally {
      setResolvingPrice(false);
    }
  };

  const handleInstantiate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!templateId || !templateDealId) return;
    setInstantiating(true);
    setActionMessage(null);
    setActionFailed(false);
    try {
      const quote = await apiFetch<Quote>(`/api/v1/quote-templates/${templateId}/instantiate`, {
        method: 'POST',
        body: JSON.stringify({
          deal_id: Number(templateDealId),
          issue_date: today(),
        }),
      });
      setQuotes((current) => applyRealtimeChange(current, {
        event: 'change',
        entity: 'quote',
        action: 'created',
        id: quote.id,
        payload: quote,
      }));
      showFeedback(`Created draft ${quote.quote_number}. Template values were copied into a new quote.`);
    } catch (requestError) {
      showFeedback(
        getErrorMessage(requestError, 'Could not instantiate the quote template.'),
        true
      );
    } finally {
      setInstantiating(false);
    }
  };

  const handleDraft = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!aiDealId || !aiInstruction.trim()) return;
    setDrafting(true);
    setAiDraft(null);
    setActionMessage(null);
    setActionFailed(false);
    try {
      const draft = await apiFetch<AiQuoteDraft>('/api/v1/ai/quotes/draft', {
        method: 'POST',
        body: JSON.stringify({
          deal_id: Number(aiDealId),
          quote_id: aiQuoteId ? Number(aiQuoteId) : undefined,
          template_id: aiTemplateId ? Number(aiTemplateId) : undefined,
          language: 'Indonesian',
          instruction: aiInstruction.trim(),
        }),
      });
      setAiDraft(draft);
    } catch (requestError) {
      showFeedback(
        getErrorMessage(requestError, 'Could not generate the review draft.'),
        true
      );
    } finally {
      setDrafting(false);
    }
  };

  const quoteOptions = quotes.filter(
    (quote) => !aiDealId || quote.deal_id === Number(aiDealId)
  );

  return (
    <div className="space-y-6 font-sans text-slate-100">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Commercial Workspace</h1>
          <p className="text-xs text-slate-400">
            Live catalog, tiered pricing, reusable quote templates, totals, and reviewed AI drafting
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchWorkspace(true)}
          disabled={loading}
          className="astryx-btn-secondary flex items-center justify-center gap-2 px-3 py-2 text-xs"
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-800/50 bg-amber-950/40 p-3 text-xs text-amber-300">
          <FiAlertCircle className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {actionMessage && (
        <div
          role={actionFailed ? 'alert' : 'status'}
          className={`flex items-start gap-2 rounded-lg border p-3 text-xs ${actionFailed
            ? 'border-rose-800/50 bg-rose-950/40 text-rose-300'
            : 'border-blue-800/50 bg-blue-950/40 text-blue-300'
            }`}
        >
          {actionFailed
            ? <FiAlertCircle className="mt-0.5 shrink-0" />
            : <FiCheckCircle className="mt-0.5 shrink-0" />}
          <span>{actionMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ProductCatalogManager
          products={products}
          loading={loading}
          onSaved={(product) => {
            setProducts((current) => applyRealtimeChange(current, {
              event: 'change',
              entity: 'product',
              action: current.some((item) => item.id === product.id) ? 'updated' : 'created',
              id: product.id,
              payload: product,
            }));
          }}
          onDeleted={(productId) => {
            setProducts((current) => applyRealtimeChange(current, {
              event: 'change',
              entity: 'product',
              action: 'deleted',
              id: productId,
            }));
          }}
          onFeedback={showFeedback}
        />

        <section className="astryx-card space-y-4 p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-white">
            <FiSearch className="text-emerald-400" /> Resolve tier price
          </h2>
          <form onSubmit={handleResolvePrice} className="space-y-3 text-xs">
            <select
              value={priceBookId}
              onChange={(event) => {
                setPriceBookId(event.target.value);
                setResolvedPrice(null);
              }}
              aria-label="Price Book"
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2"
              required
            >
              <option value="">Select price book</option>
              {priceBooks.filter((book) => book.is_active).map((book) => (
                <option key={book.id} value={book.id}>
                  {book.name}{book.is_default ? ' (default)' : ''}
                </option>
              ))}
            </select>
            <select
              value={productId}
              onChange={(event) => {
                setProductId(event.target.value);
                setResolvedPrice(null);
              }}
              aria-label="Product"
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2"
              required
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2"
              aria-label="Quantity"
              required
            />
            <button
              type="submit"
              disabled={resolvingPrice}
              className="astryx-btn-primary w-full py-2 text-xs"
            >
              {resolvingPrice ? 'Resolving...' : 'Resolve price'}
            </button>
          </form>
          {resolvedPrice && (
            <div className="rounded-xl border border-emerald-800/50 bg-emerald-950/30 p-4">
              <p className="text-[10px] uppercase tracking-wide text-emerald-400">
                Eligible tier from {resolvedPrice.min_quantity} units
              </p>
              <p className="mt-1 text-lg font-bold text-white">
                {formatMoney(resolvedPrice.unit_price, selectedProduct?.currency)}
                <span className="ml-1 text-xs font-normal text-slate-400">/ unit</span>
              </p>
            </div>
          )}
        </section>
      </div>

      <PriceBookManager
        priceBooks={priceBooks}
        products={products}
        loading={loading}
        refreshKey={priceBookRefreshKey}
        onSaved={(priceBook) => {
          setPriceBooks((current) => upsertPriceBook(current, priceBook));
          if (priceBook.is_default && priceBook.is_active) {
            setPriceBookId(String(priceBook.id));
            setResolvedPrice(null);
          }
        }}
        onDeleted={(deletedPriceBookId) => {
          setPriceBooks((current) =>
            current.filter((priceBook) => priceBook.id !== deletedPriceBookId)
          );
          if (priceBookId === String(deletedPriceBookId)) {
            setPriceBookId('');
            setResolvedPrice(null);
          }
        }}
        onFeedback={showFeedback}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="astryx-card space-y-4 p-5">
          <QuoteTemplateManager
            templates={templates}
            products={products}
            onSaved={(template) => {
              setTemplates((current) => applyRealtimeChange(current, {
                event: 'change',
                entity: 'quote_template',
                action: current.some((item) => item.id === template.id) ? 'updated' : 'created',
                id: template.id,
                payload: template,
              }));
            }}
            onDeleted={(templateId) => {
              setTemplates((current) => applyRealtimeChange(current, {
                event: 'change',
                entity: 'quote_template',
                action: 'deleted',
                id: templateId,
              }));
            }}
            onFeedback={showFeedback}
          />
          <form onSubmit={handleInstantiate} className="grid grid-cols-1 gap-2 border-t border-slate-800 pt-4 sm:grid-cols-2">
            <select
              value={templateId}
              onChange={(event) => setTemplateId(event.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs"
              required
            >
              <option value="">Choose template</option>
              {templates.filter((template) => template.is_active).map((template) => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
            <select
              value={templateDealId}
              onChange={(event) => setTemplateDealId(event.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs"
              required
            >
              <option value="">Choose deal</option>
              {deals.map((deal) => <option key={deal.id} value={deal.id}>{deal.title}</option>)}
            </select>
            <button
              type="submit"
              disabled={instantiating}
              className="astryx-btn-primary py-2 text-xs sm:col-span-2"
            >
              {instantiating ? 'Creating quote snapshot...' : 'Create draft from template'}
            </button>
          </form>
        </section>

        <SalesQuoteManager
          quotes={quotes}
          deals={deals}
          products={products}
          loading={loading}
          onSaved={(quote) => {
            setQuotes((current) => applyRealtimeChange(current, {
              event: 'change',
              entity: 'quote',
              action: current.some((item) => item.id === quote.id) ? 'updated' : 'created',
              id: quote.id,
              payload: quote,
            }));
          }}
          onDeleted={(quoteId) => {
            setQuotes((current) => applyRealtimeChange(current, {
              event: 'change',
              entity: 'quote',
              action: 'deleted',
              id: quoteId,
            }));
          }}
          onFeedback={showFeedback}
        />
      </div>

      <section className="astryx-card space-y-4 border border-violet-800/40 p-5">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold text-white">
            <FiCpu className="text-violet-400" /> OpenCode quote drafting
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Generates text only. It never changes or sends a quote, and every result requires human review.
          </p>
        </div>
        <form onSubmit={handleDraft} className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <select
            value={aiDealId}
            onChange={(event) => {
              setAiDealId(event.target.value);
              setAiQuoteId('');
            }}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs"
            required
          >
            <option value="">Deal context (required)</option>
            {deals.map((deal) => <option key={deal.id} value={deal.id}>{deal.title}</option>)}
          </select>
          <select
            value={aiQuoteId}
            onChange={(event) => setAiQuoteId(event.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs"
          >
            <option value="">Optional existing quote</option>
            {quoteOptions.map((quote) => <option key={quote.id} value={quote.id}>{quote.quote_number}</option>)}
          </select>
          <select
            value={aiTemplateId}
            onChange={(event) => setAiTemplateId(event.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs"
          >
            <option value="">Optional quote template</option>
            {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
          </select>
          <textarea
            value={aiInstruction}
            onChange={(event) => setAiInstruction(event.target.value)}
            maxLength={2000}
            rows={3}
            className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs lg:col-span-3"
            required
          />
          <button
            type="submit"
            disabled={drafting}
            className="astryx-btn-primary py-2 text-xs lg:col-span-3"
          >
            {drafting ? 'Drafting for review...' : 'Generate review draft'}
          </button>
        </form>
        {aiDraft && (
          <div className="rounded-xl border border-violet-800/50 bg-violet-950/20 p-4 text-xs">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-semibold text-violet-300">
                {aiDraft.provider}{aiDraft.model ? ` · ${aiDraft.model}` : ''}
              </span>
              <span className="rounded-full bg-amber-950 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                HUMAN REVIEW REQUIRED
              </span>
            </div>
            <h3 className="font-bold text-white">{aiDraft.draft.subject || 'Draft response'}</h3>
            <p className="mt-2 whitespace-pre-wrap leading-relaxed text-slate-300">
              {aiDraft.draft.intro || aiDraft.draft.raw || 'No introduction returned.'}
            </p>
            {aiDraft.draft.notes && <p className="mt-2 text-slate-400">{aiDraft.draft.notes}</p>}
            {aiDraft.draft.recommended_next_step && (
              <p className="mt-3 border-t border-violet-900/50 pt-3 text-violet-200">
                Next step: {aiDraft.draft.recommended_next_step}
              </p>
            )}
            {!!aiDraft.draft.warnings?.length && (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-amber-300">
                {aiDraft.draft.warnings.map((warning) => <li key={warning}>{warning}</li>)}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
