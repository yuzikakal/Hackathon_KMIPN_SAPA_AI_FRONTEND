import { Product, Quote, QuoteItem, QuoteTemplate } from '../../../types';

export interface ProductFormValues {
  name: string;
  sku: string;
  description: string;
  category: string;
  unitPrice: string;
  currency: string;
  isActive: boolean;
}

export interface TemplateLineFormValues {
  productId: string;
  description: string;
  quantity: string;
  unitPrice: string;
  discount: string;
}

export interface QuoteTemplateFormValues {
  name: string;
  description: string;
  currency: string;
  taxRate: string;
  notes: string;
  terms: string;
  isActive: boolean;
  items: TemplateLineFormValues[];
}

export interface SalesQuoteFormValues {
  dealId: string;
  quoteNumber: string;
  issueDate: string;
  expiryDate: string;
  taxRate: string;
  currency: string;
  status: string;
  notes: string;
  items: TemplateLineFormValues[];
}

const optionalText = (value: string): string | null => value.trim() || null;

export const emptyProductForm = (): ProductFormValues => ({
  name: '',
  sku: '',
  description: '',
  category: '',
  unitPrice: '0',
  currency: 'IDR',
  isActive: true,
});

export const productToForm = (product: Product): ProductFormValues => ({
  name: product.name,
  sku: product.sku || '',
  description: product.description || '',
  category: product.category || '',
  unitPrice: String(product.unit_price),
  currency: product.currency,
  isActive: product.is_active,
});

export const buildProductPayload = (
  values: ProductFormValues,
  includeStatus: boolean
) => ({
  name: values.name.trim(),
  sku: includeStatus ? values.sku.trim() : optionalText(values.sku),
  description: includeStatus
    ? values.description.trim()
    : optionalText(values.description),
  category: includeStatus ? values.category.trim() : optionalText(values.category),
  unit_price: Number(values.unitPrice),
  currency: values.currency.trim().toUpperCase(),
  ...(includeStatus ? { is_active: values.isActive } : {}),
});

export const emptyTemplateLine = (): TemplateLineFormValues => ({
  productId: '',
  description: '',
  quantity: '1',
  unitPrice: '0',
  discount: '0',
});

export const emptyQuoteTemplateForm = (): QuoteTemplateFormValues => ({
  name: '',
  description: '',
  currency: 'IDR',
  taxRate: '11',
  notes: '',
  terms: '',
  isActive: true,
  items: [emptyTemplateLine()],
});

export const templateToForm = (
  template: QuoteTemplate,
  items: Array<{
    product_id: number | null;
    description: string;
    quantity: number;
    unit_price: number;
    discount: number;
  }>
): QuoteTemplateFormValues => ({
  name: template.name,
  description: template.description || '',
  currency: template.currency,
  taxRate: String(template.tax_rate),
  notes: template.notes || '',
  terms: template.terms || '',
  isActive: template.is_active,
  items: items.map((item) => ({
    productId: item.product_id ? String(item.product_id) : '',
    description: item.description,
    quantity: String(item.quantity),
    unitPrice: String(item.unit_price),
    discount: String(item.discount),
  })),
});

export const buildQuoteTemplatePayload = (
  values: QuoteTemplateFormValues,
  includeStatus: boolean
) => ({
  name: values.name.trim(),
  description: includeStatus
    ? values.description.trim()
    : optionalText(values.description),
  currency: values.currency.trim().toUpperCase(),
  tax_rate: Number(values.taxRate),
  notes: includeStatus ? values.notes.trim() : optionalText(values.notes),
  terms: includeStatus ? values.terms.trim() : optionalText(values.terms),
  items: values.items.map((item) => ({
    product_id: item.productId ? Number(item.productId) : null,
    description: item.description.trim(),
    quantity: Number(item.quantity),
    unit_price: Number(item.unitPrice),
    discount: Number(item.discount || 0),
  })),
  ...(includeStatus ? { is_active: values.isActive } : {}),
});

export const emptySalesQuoteForm = (
  issueDate: string,
  quoteNumber = ''
): SalesQuoteFormValues => ({
  dealId: '',
  quoteNumber,
  issueDate,
  expiryDate: '',
  taxRate: '11',
  currency: 'IDR',
  status: 'draft',
  notes: '',
  items: [emptyTemplateLine()],
});

export const quoteToForm = (
  quote: Quote,
  items: QuoteItem[]
): SalesQuoteFormValues => ({
  dealId: String(quote.deal_id),
  quoteNumber: quote.quote_number,
  issueDate: quote.issue_date.slice(0, 10),
  expiryDate: quote.expiry_date?.slice(0, 10) || '',
  taxRate: String(quote.tax_rate),
  currency: quote.currency,
  status: quote.status,
  notes: quote.notes || '',
  items: items.map((item) => ({
    productId: item.product_id ? String(item.product_id) : '',
    description: item.description,
    quantity: String(item.quantity),
    unitPrice: String(item.unit_price),
    discount: String(item.discount),
  })),
});

export const buildSalesQuotePayload = (
  values: SalesQuoteFormValues,
  includeStatus: boolean
) => ({
  ...(includeStatus ? {} : { deal_id: Number(values.dealId) }),
  quote_number: values.quoteNumber.trim(),
  issue_date: values.issueDate,
  expiry_date: optionalText(values.expiryDate),
  tax_rate: Number(values.taxRate),
  currency: values.currency.trim().toUpperCase(),
  notes: optionalText(values.notes),
  items: values.items.map((item) => ({
    product_id: item.productId ? Number(item.productId) : null,
    description: item.description.trim(),
    quantity: Number(item.quantity),
    unit_price: Number(item.unitPrice),
    discount: Number(item.discount || 0),
  })),
  ...(includeStatus ? { status: values.status } : {}),
});

export const calculateSalesQuoteTotals = (values: SalesQuoteFormValues) => {
  const subtotal = values.items.reduce((sum, item) => (
    sum + Math.max(
      Number(item.quantity || 0) * Number(item.unitPrice || 0)
      - Number(item.discount || 0),
      0
    )
  ), 0);
  const taxAmount = subtotal * Number(values.taxRate || 0) / 100;
  return {
    subtotal,
    taxAmount,
    totalAmount: subtotal + taxAmount,
  };
};
