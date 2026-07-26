import {
  PriceBook,
  PriceBookItem,
  Product,
  Quote,
  QuoteItem,
  QuoteTemplate,
} from '../../../types';

export interface ProductFormValues {
  name: string;
  sku: string;
  description: string;
  category: string;
  unitPrice: string;
  currency: string;
  files: Array<{
    fileUrl: string;
    fileName: string;
  }>;
  isActive: boolean;
}

export interface PriceBookFormValues {
  name: string;
  currency: string;
  description: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface PriceBookItemFormValues {
  productId: string;
  minQuantity: string;
  unitPrice: string;
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
  files: [],
  isActive: true,
});

export const productToForm = (product: Product): ProductFormValues => {
  const files = product.files?.length
    ? product.files.map((file) => ({
      fileUrl: file.file_url,
      fileName: file.file_name,
    }))
    : product.file_url
      ? [{
        fileUrl: product.file_url,
        fileName: product.file_name || 'Product attachment',
      }]
      : [];
  return {
    name: product.name,
    sku: product.sku || '',
    description: product.description || '',
    category: product.category || '',
    unitPrice: String(product.unit_price),
    currency: product.currency,
    files,
    isActive: product.is_active,
  };
};

export const buildProductPayload = (
  values: ProductFormValues,
  includeStatus: boolean
) => {
  const files = values.files.map((file) => ({
    file_url: file.fileUrl,
    file_name: file.fileName,
  }));
  return {
    name: values.name.trim(),
    sku: includeStatus ? values.sku.trim() : optionalText(values.sku),
    description: includeStatus
      ? values.description.trim()
      : optionalText(values.description),
    category: includeStatus ? values.category.trim() : optionalText(values.category),
    unit_price: Number(values.unitPrice),
    currency: values.currency.trim().toUpperCase(),
    files,
    file_url: files[0]?.file_url || null,
    file_name: files[0]?.file_name || null,
    ...(includeStatus ? { is_active: values.isActive } : {}),
  };
};

export const emptyPriceBookForm = (): PriceBookFormValues => ({
  name: '',
  currency: 'IDR',
  description: '',
  isDefault: false,
  isActive: true,
});

export const priceBookToForm = (priceBook: PriceBook): PriceBookFormValues => ({
  name: priceBook.name,
  currency: priceBook.currency,
  description: priceBook.description || '',
  isDefault: priceBook.is_default,
  isActive: priceBook.is_active,
});

export const buildPriceBookPayload = (
  values: PriceBookFormValues,
  includeStatus: boolean
) => ({
  name: values.name.trim(),
  currency: values.currency.trim().toUpperCase(),
  description: includeStatus
    ? values.description.trim()
    : optionalText(values.description),
  is_default: values.isDefault,
  ...(includeStatus ? { is_active: values.isActive } : {}),
});

export const upsertPriceBook = (
  priceBooks: PriceBook[],
  incoming: PriceBook
): PriceBook[] => {
  const normalized = incoming.is_default
    ? priceBooks.map((priceBook) => (
      priceBook.id === incoming.id
        ? priceBook
        : { ...priceBook, is_default: false }
    ))
    : priceBooks;
  const exists = normalized.some((priceBook) => priceBook.id === incoming.id);
  const next = exists
    ? normalized.map((priceBook) => priceBook.id === incoming.id ? incoming : priceBook)
    : [incoming, ...normalized];
  return next.sort((left, right) => (
    Number(right.is_default) - Number(left.is_default)
    || left.name.localeCompare(right.name)
  ));
};

export const emptyPriceBookItemForm = (): PriceBookItemFormValues => ({
  productId: '',
  minQuantity: '1',
  unitPrice: '0',
});

export const priceBookItemToForm = (
  item: PriceBookItem
): PriceBookItemFormValues => ({
  productId: String(item.product_id),
  minQuantity: String(item.min_quantity),
  unitPrice: String(item.unit_price),
});

export const buildPriceBookItemPayload = (
  values: PriceBookItemFormValues,
  includeProduct: boolean
) => ({
  ...(includeProduct ? { product_id: Number(values.productId) } : {}),
  min_quantity: Number(values.minQuantity),
  unit_price: Number(values.unitPrice),
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
