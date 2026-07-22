export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface User {
  id: number;
  username: string;
  full_name: string;
  role: 'admin' | 'sales' | 'manager' | string;
  email: string;
  phone: string;
  photo_url: string | null;
  is_active: boolean;
}

export interface Company {
  id: number;
  name: string;
  industry: string;
  website: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  description: string;
  assigned_to: number;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
}

export interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  job_title: string;
  company_id: number;
  source: string;
  status: 'Lead' | 'Customer' | 'Prospect' | string;
  assigned_to: number;
  description: string;
  tags?: Tag[];
}

export interface DealStage {
  id: number;
  name: string;
  position: number;
  probability: number;
  color: string;
  is_active?: boolean;
}

export interface Deal {
  id: number;
  title: string;
  contact_id: number;
  company_id: number;
  stage_id: number;
  owner_id: number;
  value: number;
  currency: string;
  expected_close_date: string;
  actual_close_date?: string | null;
  status: 'Open' | 'In Progress' | 'Won' | 'Lost' | string;
  description: string;
}

export interface Activity {
  id: number;
  activity_type: 'Call' | 'Meeting' | 'Task' | 'Email' | string;
  subject: string;
  description: string;
  contact_id?: number;
  deal_id?: number;
  company_id?: number;
  assigned_to: number;
  due_date: string;
  status?: 'Pending' | 'Done' | string;
  completed_at?: string | null;
}

export interface Note {
  id: number;
  content: string;
  contact_id?: number;
  deal_id?: number;
  company_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  description: string;
  category: string;
  unit_price: number;
  currency: string;
  is_active?: boolean;
}

export interface QuoteItem {
  id?: number;
  product_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  discount: number;
}

export interface Quote {
  id: number;
  deal_id: number;
  quote_number: string;
  issue_date: string;
  expiry_date: string;
  tax_rate: number;
  currency: string;
  notes: string;
  status?: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | string;
  items?: QuoteItem[];
}

export interface Ticket {
  id: number;
  ticket_number: string;
  subject: string;
  description: string;
  contact_id: number;
  company_id: number;
  assigned_to: number;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent' | string;
  status?: 'Open' | 'In Progress' | 'Closed' | string;
  source: string;
}

export interface Campaign {
  id: number;
  name: string;
  campaign_type: 'WhatsApp' | 'Email' | 'Social' | string;
  start_date: string;
  end_date: string;
  budget: number;
  currency: string;
  target_audience: string;
  message_template: string;
  status?: 'Draft' | 'Active' | 'Completed' | string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  body: string;
  category: string;
  entity_type: string;
  entity_id: number;
  is_read?: boolean;
  created_at?: string;
}

export interface WhatsAppSession {
  id?: number;
  name?: string;
  sender_number?: string | null;
  wa_status?: string;
  wa_qr?: string | null;
  wa_paired_at?: string | null;
  updated_at?: string | null;
  // Convenience aliases used by some UI components
  status?: 'CONNECTED' | 'DISCONNECTED' | 'PAIRING' | string;
  phone?: string | null;
}

export interface WhatsAppMessage {
  id: number;
  phone: string;
  message: string;
  status: 'sent' | 'failed' | string;
  sent_at: string;
  wa_message_id?: string | null;
  error_message?: string | null;
  created_at?: string;
}

export interface RealtimeEvent {
  event: 'change';
  entity:
    | 'user'
    | 'company'
    | 'contact'
    | 'deal_stage'
    | 'deal'
    | 'activity'
    | 'note'
    | 'product'
    | 'quote'
    | 'ticket'
    | 'campaign'
    | 'tag'
    | 'notification'
    | 'whatsapp_session'
    | 'whatsapp_message';
  action: 'created' | 'updated' | 'deleted';
  id: number;
  timestamp: string;
}
