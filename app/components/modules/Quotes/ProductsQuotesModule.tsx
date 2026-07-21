'use client';

import React, { useEffect, useState } from 'react';
import { useRealtime } from '../../../context/RealtimeContext';
import { apiFetch } from '../../../lib/api';
import { Product, Quote } from '../../../types';

export const ProductsQuotesModule: React.FC = () => {
  const { subscribeEntity } = useRealtime();

  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      name: 'SAPA AI Pro Monthly',
      sku: 'SKU-PRO-001',
      description: 'Monthly subscription per user',
      category: 'Software',
      unit_price: 250000,
      currency: 'IDR',
    },
    {
      id: 2,
      name: 'WhatsApp Automation Gateway',
      sku: 'SKU-WA-002',
      description: 'Dedicated WhatsApp bot channel',
      category: 'Addon',
      unit_price: 1500000,
      currency: 'IDR',
    },
  ]);

  const [quotes, setQuotes] = useState<Quote[]>([
    {
      id: 1,
      deal_id: 5,
      quote_number: 'QUO-2026-001',
      issue_date: '2026-07-20',
      expiry_date: '2026-08-20',
      tax_rate: 11,
      currency: 'IDR',
      notes: 'Valid for 30 days',
      status: 'Sent',
    },
  ]);

  const fetchCatalog = async () => {
    try {
      const pData = await apiFetch<Product[]>('/api/v1/products');
      if (Array.isArray(pData)) setProducts(pData);

      const qData = await apiFetch<Quote[]>('/api/v1/quotes');
      if (Array.isArray(qData)) setQuotes(qData);
    } catch (err) {
      console.warn('API error, using initial catalog mock:', err);
    }
  };

  useEffect(() => {
    fetchCatalog();
    const unsubP = subscribeEntity('product', () => fetchCatalog());
    const unsubQ = subscribeEntity('quote', () => fetchCatalog());
    return () => {
      unsubP();
      unsubQ();
    };
  }, []);

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-xl font-bold text-white">Products Catalog & Sales Quotes</h1>
        <p className="text-xs text-slate-400">Manage catalog pricing and generate formal quotes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products */}
        <div className="space-y-4">
          <h3 className="font-bold text-base text-white">Products Catalog</h3>
          <div className="space-y-3">
            {products.map((p) => (
              <div key={p.id} className="astryx-card p-4 bg-[#111827] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-white">{p.name}</h4>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-900 text-slate-300 rounded border border-slate-800">
                      {p.sku}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{p.description}</p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-blue-400">
                    IDR {p.unit_price.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-500">{p.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quotes */}
        <div className="space-y-4">
          <h3 className="font-bold text-base text-white">Generated Quotes</h3>
          <div className="space-y-3">
            {quotes.map((q) => (
              <div key={q.id} className="astryx-card p-4 bg-[#111827] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white">{q.quote_number}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-400 border border-blue-800/60">
                    {q.status}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Issued: {q.issue_date}</span>
                  <span>Expires: {q.expiry_date}</span>
                </div>
                <p className="text-xs text-slate-400 border-t border-slate-800 pt-2">
                  Tax Rate: {q.tax_rate}% • Notes: {q.notes}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
