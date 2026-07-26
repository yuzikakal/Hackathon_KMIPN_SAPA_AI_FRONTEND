import { describe, expect, test } from 'bun:test';
import {
  buildPriceBookItemPayload,
  buildPriceBookPayload,
  buildSalesQuotePayload,
  buildProductPayload,
  buildQuoteTemplatePayload,
  calculateSalesQuoteTotals,
  emptySalesQuoteForm,
  emptyQuoteTemplateForm,
  upsertPriceBook,
} from './commercial';

describe('commercial CRUD payloads', () => {
  test('normalizes a product form for the API contract', () => {
    expect(buildProductPayload({
      name: '  SAPA Pro  ',
      sku: ' PRO-1 ',
      description: '',
      category: ' Software ',
      unitPrice: '250000',
      currency: 'idr',
      files: [
        { fileUrl: '/uploads/spec.pdf', fileName: 'spec.pdf' },
        { fileUrl: '/uploads/photo.jpg', fileName: 'photo.jpg' },
      ],
      isActive: false,
    }, true)).toEqual({
      name: 'SAPA Pro',
      sku: 'PRO-1',
      description: '',
      category: 'Software',
      unit_price: 250000,
      currency: 'IDR',
      file_url: '/uploads/spec.pdf',
      file_name: 'spec.pdf',
      files: [
        { file_url: '/uploads/spec.pdf', file_name: 'spec.pdf' },
        { file_url: '/uploads/photo.jpg', file_name: 'photo.jpg' },
      ],
      is_active: false,
    });
  });

  test('serializes required quote-template line items as numbers', () => {
    const form = emptyQuoteTemplateForm();
    form.name = 'Starter';
    form.items[0] = {
      productId: '7',
      description: '  Ten seats  ',
      quantity: '10',
      unitPrice: '250000',
      discount: '50000',
    };

    expect(buildQuoteTemplatePayload(form, false)).toMatchObject({
      name: 'Starter',
      currency: 'IDR',
      tax_rate: 11,
      items: [{
        product_id: 7,
        description: 'Ten seats',
        quantity: 10,
        unit_price: 250000,
        discount: 50000,
      }],
    });
  });

  test('normalizes Price Book and tier payloads', () => {
    expect(buildPriceBookPayload({
      name: '  Enterprise 2026 ',
      currency: 'idr',
      description: '  Volume pricing ',
      isDefault: true,
      isActive: false,
    }, true)).toEqual({
      name: 'Enterprise 2026',
      currency: 'IDR',
      description: 'Volume pricing',
      is_default: true,
      is_active: false,
    });

    expect(buildPriceBookItemPayload({
      productId: '7',
      minQuantity: '10',
      unitPrice: '225000',
    }, true)).toEqual({
      product_id: 7,
      min_quantity: 10,
      unit_price: 225000,
    });

    expect(buildPriceBookPayload({
      name: ' Retail ',
      currency: 'idr',
      description: '   ',
      isDefault: false,
      isActive: true,
    }, false)).toEqual({
      name: 'Retail',
      currency: 'IDR',
      description: null,
      is_default: false,
    });

    expect(buildPriceBookItemPayload({
      productId: '7',
      minQuantity: '25',
      unitPrice: '200000',
    }, false)).toEqual({
      min_quantity: 25,
      unit_price: 200000,
    });
  });

  test('keeps only one default Price Book when upserting', () => {
    const current = [{
      id: 1,
      name: 'Retail',
      currency: 'IDR',
      description: null,
      is_default: true,
      is_active: true,
    }, {
      id: 2,
      name: 'Enterprise',
      currency: 'IDR',
      description: null,
      is_default: false,
      is_active: true,
    }];

    const updated = upsertPriceBook(current, {
      ...current[1],
      is_default: true,
    });

    expect(updated.map((book) => [book.id, book.is_default])).toEqual([
      [2, true],
      [1, false],
    ]);
  });

  test('serializes a sales quote update with replaceable line items', () => {
    const form = emptySalesQuoteForm('2026-07-26', ' QUO-26-001 ');
    form.dealId = '8';
    form.expiryDate = '';
    form.status = 'sent';
    form.notes = '';
    form.items[0] = {
      productId: '3',
      description: '  Hydraulic unit  ',
      quantity: '2',
      unitPrice: '100000',
      discount: '25000',
    };

    expect(buildSalesQuotePayload(form, true)).toEqual({
      quote_number: 'QUO-26-001',
      issue_date: '2026-07-26',
      expiry_date: null,
      tax_rate: 11,
      currency: 'IDR',
      status: 'sent',
      notes: null,
      items: [{
        product_id: 3,
        description: 'Hydraulic unit',
        quantity: 2,
        unit_price: 100000,
        discount: 25000,
      }],
    });
  });

  test('calculates quote totals after absolute discounts', () => {
    const form = emptySalesQuoteForm('2026-07-26');
    form.taxRate = '10';
    form.items = [
      {
        productId: '',
        description: 'Service',
        quantity: '2',
        unitPrice: '100000',
        discount: '50000',
      },
      {
        productId: '',
        description: 'Free item',
        quantity: '1',
        unitPrice: '10000',
        discount: '20000',
      },
    ];

    expect(calculateSalesQuoteTotals(form)).toEqual({
      subtotal: 150000,
      taxAmount: 15000,
      totalAmount: 165000,
    });
  });
});
