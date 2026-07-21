# Implementation Plan: SAPA AI CRM Full Frontend Realtime Module

## Overview
Implement the complete modular SAPA AI CRM frontend application based on `APIDOCS.md`, utilizing real-time WebSocket entity sync, Astryx design theme styling with default white background, and modular component architecture across 15+ CRM modules.

## Architecture & Modules
1. **API Client & Envelope Parser** (`app/lib/api.ts`): Unified REST handler with bearer auth.
2. **WebSocket Client Manager** (`app/lib/ws.ts`): Client manager connecting to `/api/v1/ws?token=...`.
3. **Global Contexts**:
   - `AuthContext`: Login/logout state, user profile, and bearer token.
   - `RealtimeContext`: Event subscriber and triggers invalidation on `change` events.
4. **UI Components** (`app/components/`):
   - Sidebar navigation, Top Header with notifications & user menu.
   - Modular components for Dashboard, Companies, Contacts, Deals (Kanban), Activities, Notes, Products, Quotes, Support Tickets, Campaigns, Tags, Notifications, and WhatsApp Console.

## Verification
- Run `bun run build` and `bun run lint` to verify zero type or build errors.
