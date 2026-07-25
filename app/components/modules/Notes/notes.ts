export interface NoteRelationSelection {
  contactId: string;
  dealId: string;
  companyId: string;
}

export const optionalId = (value: string): number | null =>
  value ? Number(value) : null;

export const buildNotePayload = (
  content: string,
  selection: NoteRelationSelection
) => ({
  content: content.trim(),
  contact_id: optionalId(selection.contactId),
  deal_id: optionalId(selection.dealId),
  company_id: optionalId(selection.companyId),
});
