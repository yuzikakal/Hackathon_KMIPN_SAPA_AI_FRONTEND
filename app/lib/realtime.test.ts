import { describe, expect, test } from 'bun:test';
import { Deal, WhatsAppMessage } from '../types';
import {
  applyRealtimeChange,
  applyWhatsAppMessageChange,
  DealInboxItem,
  getDealContactName,
  getInitials,
  hydrateDealInbox,
} from './realtime';

describe('applyRealtimeChange', () => {
  test('upserts full WebSocket payloads without a follow-up GET', () => {
    const initial = [{ id: 1, name: 'Old' }];
    const updated = applyRealtimeChange(initial, {
      event: 'change',
      entity: 'product',
      action: 'updated',
      id: 1,
      payload: { id: 1, name: 'New' },
    });
    const created = applyRealtimeChange(updated, {
      event: 'change',
      entity: 'product',
      action: 'created',
      id: 2,
      payload: { id: 2, name: 'Second' },
    });

    expect(updated).toEqual([{ id: 1, name: 'New' }]);
    expect(created).toEqual([
      { id: 2, name: 'Second' },
      { id: 1, name: 'New' },
    ]);
  });

  test('deletes by event id and ignores invalidation-only events', () => {
    const initial = [{ id: 1, name: 'One' }, { id: 2, name: 'Two' }];
    const ignored = applyRealtimeChange(initial, {
      event: 'change',
      entity: 'product',
      action: 'updated',
      id: 1,
    });
    const deleted = applyRealtimeChange(initial, {
      event: 'change',
      entity: 'product',
      action: 'deleted',
      id: 1,
    });

    expect(ignored).toBe(initial);
    expect(deleted).toEqual([{ id: 2, name: 'Two' }]);
  });
});

describe('applyWhatsAppMessageChange', () => {
  test('adds a full inbound media payload to the matching deal', () => {
    const result = applyWhatsAppMessageChange(
      [{ ...deal(1, 7), messages: [] }],
      {
        event: 'change',
        entity: 'whatsapp_message',
        action: 'created',
        id: 12,
        payload: {
          ...message(12, 1, 'inbound'),
          contact_id: 7,
          media_url: '/uploads/inbound.webp',
          message: '[Stiker]',
        },
      },
      null
    );

    expect(result[0].messages?.[0].media_url).toBe('/uploads/inbound.webp');
    expect(result[0].has_new_message).toBe(true);
  });
});

const deal = (id: number, contactId: number): Deal => ({
  id,
  title: `Deal ${id}`,
  contact_id: contactId,
  company_id: null,
  stage_id: 1,
  owner_id: 1,
  value: 0,
  currency: 'IDR',
  expected_close_date: null,
  status: 'Open',
  description: null,
});

const message = (
  id: number,
  dealId: number,
  direction: 'inbound' | 'outbound'
): WhatsAppMessage => ({
  id,
  session_id: 1,
  deal_id: dealId,
  contact_id: dealId,
  phone: '6281',
  direction,
  message: `message ${id}`,
  status: direction === 'inbound' ? 'delivered' : 'sent',
});

describe('hydrateDealInbox', () => {
  test('sorts messages and updates the latest conversation preview', () => {
    const result = hydrateDealInbox(
      [deal(1, 1)],
      [message(3, 1, 'inbound'), message(2, 1, 'outbound')],
      [],
      1,
      false
    );

    expect(result[0].messages?.map((item) => item.id)).toEqual([2, 3]);
    expect(result[0].last_message).toBe('message 3');
    expect(result[0].unread_count).toBe(0);
  });

  test('marks a new inbound message unread only for an unselected deal', () => {
    const previous: DealInboxItem[] = [
      { ...deal(1, 1), messages: [message(1, 1, 'inbound')] },
      { ...deal(2, 2), messages: [] },
    ];
    const result = hydrateDealInbox(
      [deal(1, 1), deal(2, 2)],
      [message(2, 2, 'inbound'), message(1, 1, 'inbound')],
      previous,
      1,
      true
    );

    expect(result.find((item) => item.id === 1)?.has_new_message).toBeFalsy();
    expect(result.find((item) => item.id === 2)?.has_new_message).toBe(true);
    expect(result.find((item) => item.id === 2)?.unread_count).toBe(1);
  });

  test('uses contact linkage when a legacy message has no deal id', () => {
    const legacy = { ...message(4, 1, 'inbound'), deal_id: null, contact_id: 7 };
    const result = hydrateDealInbox([deal(9, 7)], [legacy], [], null, false);

    expect(result[0].messages?.[0].id).toBe(4);
  });

  test('moves the conversation with the latest message to the top', () => {
    const result = hydrateDealInbox(
      [deal(1, 1), deal(2, 2)],
      [message(10, 1, 'inbound'), message(20, 2, 'inbound')],
      [],
      null,
      false
    );

    expect(result.map((item) => item.id)).toEqual([2, 1]);
  });
});

describe('deal chat identity', () => {
  test('uses the linked contact name before the deal title', () => {
    expect(getDealContactName({
      ...deal(1, 7),
      title: 'Deal - fallback',
      contact_name: 'Hylmi Mahdi ',
    })).toBe('Hylmi Mahdi');
  });

  test('falls back safely and creates compact initials', () => {
    expect(getDealContactName(deal(2, 8))).toBe('Deal 2');
    expect(getInitials('Hylmi Mahdi')).toBe('HM');
    expect(getInitials('')).toBe('?');
  });
});
