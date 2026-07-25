import { describe, expect, test } from 'bun:test';
import {
  buildProductPayload,
  buildQuoteTemplatePayload,
  emptyQuoteTemplateForm,
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
      isActive: false,
    }, true)).toEqual({
      name: 'SAPA Pro',
      sku: 'PRO-1',
      description: '',
      category: 'Software',
      unit_price: 250000,
      currency: 'IDR',
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
});
