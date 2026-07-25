import { Deal, RealtimeEvent, WhatsAppMessage } from '../types';

interface RealtimeRecord {
  id: number;
}

const isRealtimeRecord = (value: unknown): value is RealtimeRecord => {
  if (!value || typeof value !== 'object') return false;
  return typeof (value as Partial<RealtimeRecord>).id === 'number';
};

/**
 * Applies a full-record WebSocket change without issuing another GET request.
 * Events without a usable payload are intentionally ignored; callers can use
 * an explicit refresh as a recovery action when desired.
 */
export function applyRealtimeChange<T extends RealtimeRecord>(
  records: T[],
  event: RealtimeEvent
): T[] {
  if (event.action === 'deleted') {
    return typeof event.id === 'number'
      ? records.filter((record) => record.id !== event.id)
      : records;
  }

  if (!isRealtimeRecord(event.payload)) return records;
  if (typeof event.id === 'number' && event.payload.id !== event.id) return records;

  const incoming = event.payload as T;
  const existingIndex = records.findIndex((record) => record.id === incoming.id);
  if (existingIndex === -1) return [incoming, ...records];

  return records.map((record, index) => (
    index === existingIndex ? incoming : record
  ));
}

export function applyWhatsAppMessageChange(
  deals: DealInboxItem[],
  event: RealtimeEvent,
  selectedDealId: number | null
): DealInboxItem[] {
  if (event.entity !== 'whatsapp_message') return deals;

  if (event.action === 'deleted' && typeof event.id === 'number') {
    return deals.map((deal) => ({
      ...deal,
      messages: deal.messages?.filter((message) => message.id !== event.id),
    }));
  }
  if (!isRealtimeRecord(event.payload)) return deals;
  const message = event.payload as WhatsAppMessage;
  const targetDealId = message.deal_id
    || deals.find((deal) => deal.contact_id === message.contact_id)?.id;
  if (!targetDealId) return deals;

  return deals.map((deal) => {
    if (deal.id !== targetDealId) return deal;
    const withoutMatchingOptimistic = (deal.messages || []).filter((current) => !(
      current.id > 1_000_000_000_000
      && current.status === 'pending'
      && current.direction !== 'incoming'
      && current.direction !== 'inbound'
      && current.message === message.message
      && current.media_url === message.media_url
    ));
    const messages = applyRealtimeChange(withoutMatchingOptimistic, event)
      .sort((left, right) => left.id - right.id);
    const incoming = isIncoming(message);
    const isSelected = deal.id === selectedDealId;
    return {
      ...deal,
      messages,
      last_message: message.message,
      last_message_at: message.sent_at || message.created_at || deal.last_message_at,
      has_new_message: incoming && !isSelected,
      unread_count: incoming && !isSelected ? (deal.unread_count || 0) + 1 : 0,
    };
  });
}

export interface DealInboxItem extends Deal {
  badge?: string;
  lead_number?: string;
  avatar_url?: string;
  messages?: WhatsAppMessage[];
  has_new_message?: boolean;
  unread_count?: number;
  last_message?: string;
  last_message_at?: string;
}

const isIncoming = (message: WhatsAppMessage) =>
  message.direction === 'incoming' || message.direction === 'inbound';

export const getDealContactName = (deal: Deal): string => {
  const directName = deal.contact_name?.trim();
  if (directName) return directName;

  const nestedName = deal.contact
    ? `${deal.contact.first_name} ${deal.contact.last_name || ''}`.trim()
    : '';
  return nestedName || deal.title;
};

export const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  return words.slice(0, 2).map((word) => word[0]).join('').toUpperCase();
};

const mergeMessages = (
  previous: WhatsAppMessage[] = [],
  current: WhatsAppMessage[] = []
) => {
  const byId = new Map<number, WhatsAppMessage>();
  previous.forEach((message) => byId.set(message.id, message));
  current.forEach((message) => byId.set(message.id, message));
  return [...byId.values()].sort((left, right) => left.id - right.id);
};

export function hydrateDealInbox(
  deals: Deal[],
  recentMessages: WhatsAppMessage[],
  previousDeals: DealInboxItem[],
  selectedDealId: number | null,
  markNewMessages: boolean
): DealInboxItem[] {
  const previousById = new Map(previousDeals.map((deal) => [deal.id, deal]));
  const knownMessageIds = new Set(
    previousDeals.flatMap((deal) => deal.messages?.map((message) => message.id) || [])
  );
  const dealIds = new Set(deals.map((deal) => deal.id));
  const latestDealByContact = new Map<number, number>();

  deals.forEach((deal) => {
    if (deal.contact_id && !latestDealByContact.has(deal.contact_id)) {
      latestDealByContact.set(deal.contact_id, deal.id);
    }
  });

  const messagesByDeal = new Map<number, WhatsAppMessage[]>();
  recentMessages.forEach((message) => {
    const dealId =
      (message.deal_id && dealIds.has(message.deal_id) ? message.deal_id : null)
      || (message.contact_id ? latestDealByContact.get(message.contact_id) : undefined);
    if (!dealId) return;
    const messages = messagesByDeal.get(dealId) || [];
    messages.push(message);
    messagesByDeal.set(dealId, messages);
  });

  return deals.map((deal) => {
    const previous = previousById.get(deal.id);
    const currentMessages = messagesByDeal.get(deal.id) || [];
    const messages = mergeMessages(previous?.messages, currentMessages);
    const lastMessage = messages.at(-1);
    const newIncomingCount = markNewMessages
      ? currentMessages.filter(
        (message) => !knownMessageIds.has(message.id) && isIncoming(message)
      ).length
      : 0;
    const isSelected = deal.id === selectedDealId;
    const unreadCount = isSelected
      ? 0
      : (previous?.unread_count || 0) + newIncomingCount;

    return {
      ...previous,
      ...deal,
      badge: previous?.badge || `A${deal.id}`,
      lead_number: previous?.lead_number || `Lead #${11_000_000 + deal.id}`,
      messages,
      last_message: lastMessage?.message || previous?.last_message || deal.description || undefined,
      last_message_at:
        lastMessage?.sent_at
        || lastMessage?.created_at
        || previous?.last_message_at
        || deal.updated_at
        || 'Belum ada pesan',
      unread_count: unreadCount,
      has_new_message: !isSelected && (previous?.has_new_message || newIncomingCount > 0),
    };
  }).sort((left, right) => {
    const leftMessageId = left.messages?.at(-1)?.id || 0;
    const rightMessageId = right.messages?.at(-1)?.id || 0;
    return rightMessageId - leftMessageId || right.id - left.id;
  });
}
