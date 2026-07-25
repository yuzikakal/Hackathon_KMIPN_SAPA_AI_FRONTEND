import { describe, expect, test } from 'bun:test';
import { buildNotePayload } from './notes';

describe('buildNotePayload', () => {
  test('creates an unlinked note without fixture relationship IDs', () => {
    expect(buildNotePayload('  Catatan umum  ', {
      contactId: '',
      dealId: '',
      companyId: '',
    })).toEqual({
      content: 'Catatan umum',
      contact_id: null,
      deal_id: null,
      company_id: null,
    });
  });

  test('converts selected live relationship IDs to numbers', () => {
    expect(buildNotePayload('Follow up', {
      contactId: '4',
      dealId: '3',
      companyId: '2',
    })).toEqual({
      content: 'Follow up',
      contact_id: 4,
      deal_id: 3,
      company_id: 2,
    });
  });
});
