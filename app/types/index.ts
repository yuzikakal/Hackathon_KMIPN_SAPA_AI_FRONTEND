export type ApiResponse<T> =
  | { success: true; data?: T; message?: string }
  | { success: false; message: string; data?: never };

export interface Timestamped {
  created_at?: string | null;
  updated_at?: string | null;
}

export interface User extends Timestamped {
  id: number;
  username: string;
  full_name: string;
  role: 'admin' | 'sales' | 'manager' | string;
  email: string;
  phone: string | null;
  photo_url: string | null;
  is_active: boolean;
}

export interface Company extends Timestamped {
  id: number;
  name: string;
  industry: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  description: string | null;
  assigned_to: number | null;
}

export interface Tag {
  id: number;
  name: string;
  color: string | null;
  created_at?: string | null;
}

export interface Contact extends Timestamped {
  id: number;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  company_id: number | null;
  company_name?: string | null;
  source: string | null;
  status: 'Lead' | 'Customer' | 'Prospect' | string;
  assigned_to: number | null;
  description: string | null;
  tags?: Tag[];
}

export interface DealStage {
  id: number;
  name: string;
  position: number;
  probability: number;
  color: string | null;
  is_active?: boolean;
  created_at?: string | null;
}

export interface Deal extends Timestamped {
  id: number;
  title: string;
  contact_id: number | null;
  contact_name?: string | null;
  company_id: number | null;
  company_name?: string | null;
  stage_id: number;
  stage_name?: string | null;
  owner_id: number | null;
  owner_name?: string | null;
  value: number;
  currency: string;
  expected_close_date: string | null;
  actual_close_date?: string | null;
  status: 'Open' | 'In Progress' | 'Won' | 'Lost' | string;
  description: string | null;
  contact?: Contact | null;
  company?: Company | null;
  has_new_message?: boolean;
  unread_count?: number;
  last_message?: string;
  last_message_at?: string;
}

export interface DealDetail extends Omit<Deal, 'contact_id' | 'company_id'> {
  contact?: Contact | null;
  company?: Company | null;
}

export interface DiscussionFile {
  id: number;
  discussion_id: number;
  file_name: string;
  file_url: string;
  mime_type: string | null;
  file_size: number;
  created_at: string | null;
}

export interface DealDiscussion {
  id: number;
  deal_id: number;
  user_id: number | null;
  author_name: string | null;
  content: string;
  files: DiscussionFile[];
  created_at: string | null;
}

export interface Activity extends Timestamped {
  id: number;
  activity_type: 'Call' | 'Meeting' | 'Task' | 'Email' | string;
  subject: string;
  description: string | null;
  contact_id: number | null;
  contact_name?: string | null;
  deal_id: number | null;
  deal_title?: string | null;
  company_id: number | null;
  company_name?: string | null;
  assigned_to: number | null;
  assigned_name?: string | null;
  due_date: string | null;
  status: 'Pending' | 'Done' | string;
  completed_at: string | null;
  created_by?: number | null;
}

export interface Note extends Timestamped {
  id: number;
  content: string;
  contact_id: number | null;
  deal_id: number | null;
  company_id: number | null;
  created_by?: number | null;
}

export interface AiNoteDraftContent {
  content?: string;
  summary?: string;
  suggested_tags?: string[];
  warnings?: string[];
  raw?: string;
  [key: string]: unknown;
}

export interface AiNoteDraft {
  provider: 'opencode' | string;
  model: string | null;
  review_required: true;
  draft: AiNoteDraftContent;
}

export interface AiDealSummaryContent {
  summary?: string;
  customer_needs?: string[];
  actions_completed?: string[];
  open_questions?: string[];
  recommended_next_steps?: string[];
  sentiment?: string;
  warnings?: string[];
  raw?: string;
  [key: string]: unknown;
}

export interface AiDealSummary {
  provider: 'opencode' | string;
  model: string | null;
  review_required: true;
  draft: AiDealSummaryContent;
}

export interface Product extends Timestamped {
  id: number;
  name: string;
  sku: string | null;
  description: string | null;
  category: string | null;
  unit_price: number;
  currency: string;
  file_url: string | null;
  file_name: string | null;
  files: ProductFile[];
  is_active: boolean;
}

export interface ProductFile {
  id: number;
  product_id: number;
  file_url: string;
  file_name: string;
  created_at: string | null;
}

export interface QuoteItem {
  id: number;
  quote_id: number;
  product_id: number | null;
  description: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
}

export interface CreateQuoteItem {
  product_id?: number | null;
  description: string;
  quantity: number;
  unit_price: number;
  discount?: number;
}

export interface Quote extends Timestamped {
  id: number;
  deal_id: number;
  template_id: number | null;
  quote_number: string;
  issue_date: string;
  expiry_date: string | null;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | string;
  notes: string | null;
  created_by: number | null;
  items?: QuoteItem[];
}

export interface PriceBook extends Timestamped {
  id: number;
  name: string;
  currency: string;
  description: string | null;
  is_default: boolean;
  is_active: boolean;
}

export interface PriceBookItem extends Timestamped {
  id: number;
  price_book_id: number;
  product_id: number;
  min_quantity: number;
  unit_price: number;
}

export interface ResolvedPrice {
  price_book_id: number;
  product_id: number;
  quantity: number;
  min_quantity: number;
  unit_price: number;
}

export interface QuoteTemplate extends Timestamped {
  id: number;
  name: string;
  description: string | null;
  currency: string;
  tax_rate: number;
  notes: string | null;
  terms: string | null;
  is_active: boolean;
}

export interface QuoteTemplateItem {
  id: number;
  template_id: number;
  product_id: number | null;
  description: string;
  quantity: number;
  unit_price: number;
  discount: number;
  position: number;
}

export interface InstantiateQuoteTemplate {
  deal_id: number;
  quote_number?: string;
  issue_date?: string;
  expiry_date?: string;
  notes?: string;
}

export interface AiQuoteDraftContent {
  subject?: string;
  intro?: string;
  notes?: string;
  recommended_next_step?: string;
  warnings?: string[];
  raw?: string;
  [key: string]: unknown;
}

export interface AiQuoteDraft {
  provider: 'opencode' | string;
  model: string | null;
  review_required: true;
  draft: AiQuoteDraftContent;
}

export interface Ticket extends Timestamped {
  id: number;
  ticket_number: string;
  subject: string;
  description: string;
  contact_id: number | null;
  contact_name?: string | null;
  company_id: number | null;
  company_name?: string | null;
  assigned_to: number | null;
  assigned_name?: string | null;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent' | string;
  status: 'Open' | 'In Progress' | 'Closed' | string;
  source: string | null;
  resolved_at?: string | null;
  closed_at?: string | null;
}

export interface Campaign extends Timestamped {
  id: number;
  name: string;
  campaign_type: 'WhatsApp' | 'Email' | 'Social' | string;
  status: 'Draft' | 'Active' | 'Completed' | string;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  currency: string;
  target_audience: string | null;
  message_template: string | null;
  sent_count?: number;
  delivered_count?: number;
  responded_count?: number;
  created_by?: number | null;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  body: string;
  category: string;
  entity_type: string | null;
  entity_id: number | null;
  is_read: boolean;
  created_at?: string | null;
}

export interface WhatsAppSession {
  id?: number;
  name?: string;
  sender_number?: string | null;
  wa_status?: string;
  wa_qr?: string | null;
  wa_paired_at?: string | null;
  updated_at?: string | null;
  status?: 'CONNECTED' | 'DISCONNECTED' | 'PAIRING' | string;
  phone?: string | null;
}

export interface WhatsAppMessage {
  id: number;
  session_id?: number | null;
  deal_id?: number | null;
  contact_id?: number | null;
  phone: string;
  direction: 'incoming' | 'outgoing' | 'inbound' | 'outbound' | string;
  message: string;
  media_url?: string | null;
  wa_message_id?: string | null;
  sender_name?: string | null;
  status: 'sent' | 'failed' | 'delivered' | 'pending' | 'read' | string;
  error_message?: string | null;
  sent_at?: string | null;
  created_at?: string | null;
}

export type RealtimeEntity =
  | 'user'
  | 'company'
  | 'contact'
  | 'deal_stage'
  | 'deal'
  | 'deal_discussion'
  | 'activity'
  | 'note'
  | 'product'
  | 'price_book'
  | 'quote'
  | 'quote_template'
  | 'ticket'
  | 'campaign'
  | 'tag'
  | 'notification'
  | 'whatsapp_session'
  | 'whatsapp_message';

export interface RealtimeEvent {
  event: 'change';
  entity: RealtimeEntity;
  action: 'created' | 'updated' | 'deleted';
  id?: number;
  payload?: unknown;
  timestamp?: string;
}
