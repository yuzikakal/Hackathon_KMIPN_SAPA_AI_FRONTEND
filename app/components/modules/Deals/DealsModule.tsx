'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRealtime } from '../../../context/RealtimeContext';
import { apiFetch } from '../../../lib/api';
import { Deal, DealStage, WhatsAppMessage } from '../../../types';
import {
  FiPlus,
  FiSearch,
  FiSend,
  FiZap,
  FiGrid,
  FiMessageSquare,
  FiCheck,
  FiX,
  FiMoreHorizontal,
  FiImage,
  FiBell
} from 'react-icons/fi';

const SparklesIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
  </svg>
);

interface ExtendedDeal extends Deal {
  badge?: string;
  lead_number?: string;
  avatar_url?: string;
  messages?: WhatsAppMessage[];
}

// Initial Mock Deals matching screenshot context & APIDOCS fallback
const INITIAL_DEALS: ExtendedDeal[] = [
  {
    id: 104,
    title: 'Sarah zen',
    badge: 'A104',
    lead_number: 'Lead #11684304',
    contact_id: 10,
    company_id: 1,
    stage_id: 1,
    owner_id: 1,
    value: 150000000,
    currency: 'IDR',
    expected_close_date: '2026-08-30',
    status: 'Open',
    description: 'Enterprise SAPA AI Subscription',
    has_new_message: true,
    unread_count: 2,
    last_message: 'Salesbot: Oh',
    last_message_at: 'Kemarin 19:11',
    messages: [
      {
        id: 1001,
        phone: '628123456789',
        direction: 'incoming',
        message: 'Enggak',
        sender_name: 'Sarah zen',
        status: 'delivered',
        sent_at: 'Kemarin 19:10',
      },
      {
        id: 1002,
        phone: '628123456789',
        direction: 'incoming',
        message: 'Memang segitu harganya',
        sender_name: 'Sarah zen',
        status: 'delivered',
        sent_at: 'Kemarin 19:10',
      },
      {
        id: 1003,
        phone: '628123456789',
        direction: 'outgoing',
        message: 'Jir rapi kali timpanya',
        sender_name: 'Salesbot',
        status: 'sent',
        sent_at: 'Kemarin 19:10',
      },
      {
        id: 1004,
        phone: '628123456789',
        direction: 'outgoing',
        message: 'Oh',
        sender_name: 'Salesbot',
        status: 'sent',
        sent_at: 'Kemarin 19:11',
      },
    ],
  },
  {
    id: 109,
    title: 'Wafer',
    badge: 'A109',
    lead_number: 'Lead #12344418',
    contact_id: 11,
    company_id: 2,
    stage_id: 1,
    owner_id: 1,
    value: 45000000,
    currency: 'IDR',
    expected_close_date: '2026-08-15',
    status: 'Open',
    description: 'WhatsApp Gateway Integration',
    has_new_message: true,
    unread_count: 1,
    last_message: "'messageContextInfo' is not...",
    last_message_at: 'Hari ini 14:35',
    messages: [
      {
        id: 2001,
        phone: '6281999888777',
        direction: 'incoming',
        message: "'messageContextInfo' is not working properly on webhook",
        sender_name: 'Wafer',
        status: 'delivered',
        sent_at: 'Hari ini 14:35',
      },
    ],
  },
  {
    id: 106,
    title: 'Cahyo',
    badge: 'A106',
    lead_number: 'Lead #11768606',
    contact_id: 12,
    company_id: 3,
    stage_id: 2,
    owner_id: 1,
    value: 75000000,
    currency: 'IDR',
    expected_close_date: '2026-09-10',
    status: 'In Progress',
    description: 'Custom AI Agent setup',
    has_new_message: false,
    unread_count: 0,
    last_message: 'Salesbot: Iya yah',
    last_message_at: 'Kemarin 17:24',
    messages: [
      {
        id: 3001,
        phone: '6281344556677',
        direction: 'outgoing',
        message: 'Salesbot: Iya yah',
        sender_name: 'Salesbot',
        status: 'sent',
        sent_at: 'Kemarin 17:24',
      },
    ],
  },
  {
    id: 108,
    title: 'chandra sitepu || AUT...',
    badge: 'A108',
    lead_number: 'Lead #12198608',
    contact_id: 13,
    company_id: 4,
    stage_id: 2,
    owner_id: 1,
    value: 120000000,
    currency: 'IDR',
    expected_close_date: '2026-08-28',
    status: 'In Progress',
    description: 'Automation pipeline setup',
    has_new_message: false,
    unread_count: 0,
    last_message: 'Oke gpp mi',
    last_message_at: 'Kemarin 10:44',
    messages: [
      {
        id: 4001,
        phone: '6285211223344',
        direction: 'incoming',
        message: 'Oke gpp mi',
        sender_name: 'chandra sitepu',
        status: 'delivered',
        sent_at: 'Kemarin 10:44',
      },
    ],
  },
  {
    id: 107,
    title: 'Aji Sasongko',
    badge: 'A107',
    lead_number: 'Lead #12118220',
    contact_id: 14,
    company_id: 5,
    stage_id: 3,
    owner_id: 1,
    value: 90000000,
    currency: 'IDR',
    expected_close_date: '2026-09-01',
    status: 'In Progress',
    description: 'CRM Cloud Renewal',
    has_new_message: false,
    unread_count: 0,
    last_message: 'Salesbot: Ok udh ku bilang ...',
    last_message_at: 'Kemarin 08:15',
    messages: [
      {
        id: 5001,
        phone: '6287712345678',
        direction: 'outgoing',
        message: 'Salesbot: Ok udh ku bilang ke team dev',
        sender_name: 'Salesbot',
        status: 'sent',
        sent_at: 'Kemarin 08:15',
      },
    ],
  },
  {
    id: 105,
    title: 'Raihan?',
    badge: 'A105',
    lead_number: 'Lead #11760484',
    contact_id: 15,
    company_id: 6,
    stage_id: 3,
    owner_id: 1,
    value: 60000000,
    currency: 'IDR',
    expected_close_date: '2026-08-20',
    status: 'In Progress',
    description: 'Voice bot expansion',
    has_new_message: false,
    unread_count: 0,
    last_message: 'Salesbot: We were unable t...',
    last_message_at: '22/07/2026 22:08',
    messages: [
      {
        id: 6001,
        phone: '6289988776655',
        direction: 'outgoing',
        message: 'Salesbot: We were unable to reach your server',
        sender_name: 'Salesbot',
        status: 'sent',
        sent_at: '22/07/2026 22:08',
      },
    ],
  },
];

const DndDealCard: React.FC<{
  deal: ExtendedDeal;
  stages: DealStage[];
  onDragStart: (dealId: number) => void;
  onDragEnd: () => void;
  onDrop: (dealId: number, targetStageId: number) => void;
  onOpenChat: (deal: ExtendedDeal) => void;
  draggingDealId: number | null;
}> = ({ deal, stages, onDragStart, onDragEnd, onDrop, onOpenChat, draggingDealId }) => {
  const isDragging = draggingDealId === deal.id;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', String(deal.id));
        e.dataTransfer.effectAllowed = 'move';
        onDragStart(deal.id);
      }}
      onDragEnd={onDragEnd}
      onClick={() => onOpenChat(deal)}
      className={`astryx-card p-4 bg-[#111827] border shadow-xs hover:border-blue-500/50 transition-all cursor-pointer relative group ${isDragging ? 'opacity-40 border-blue-500 scale-95' : 'border-slate-800'
        }`}
    >
      {deal.has_new_message && (
        <div className="absolute -top-2 -right-2 bg-emerald-500 text-slate-950 font-bold text-[9px] px-2 py-0.5 rounded-full shadow-lg border border-emerald-300 animate-pulse flex items-center gap-1 z-10">
          <FiBell className="text-[10px]" /> Deal masuk
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="inline-block bg-slate-800 text-emerald-400 font-mono text-[9px] px-1.5 py-0.5 rounded font-bold mb-1">
            {deal.badge || `A${deal.id}`}
          </span>
          <h4 className="font-semibold text-xs text-white leading-tight flex items-center gap-1.5">
            {deal.title}
          </h4>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenChat(deal);
          }}
          className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
          title="Open WhatsApp Chat"
        >
          <FiMessageSquare className="text-xs" />
        </button>
      </div>

      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{deal.description}</p>

      {deal.last_message && (
        <div className="mt-2 text-[10px] text-slate-400 bg-slate-950/60 p-1.5 rounded border border-slate-800/80 truncate flex items-center gap-1">
          <FiMessageSquare className="shrink-0 text-emerald-400 text-[10px]" />
          <span className="truncate">{deal.last_message}</span>
        </div>
      )}

      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
        <span className="font-bold text-xs text-blue-400">
          {deal.currency || 'IDR'} {deal.value?.toLocaleString()}
        </span>
        <span className="text-[10px] text-slate-400">{deal.expected_close_date}</span>
      </div>

      <div className="mt-2.5 flex items-center gap-1">
        <span className="text-[10px] text-slate-400">Move:</span>
        {stages.map((st) => (
          <button
            key={st.id}
            disabled={st.id === deal.stage_id}
            onClick={(e) => {
              e.stopPropagation();
              onDrop(deal.id, st.id);
            }}
            className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center transition-all ${st.id === deal.stage_id ? 'opacity-40 ring-1 ring-slate-500' : 'hover:scale-125'
              }`}
            style={{ backgroundColor: st.color, color: '#fff' }}
            title={`Move to ${st.name}`}
          >
            {st.position}
          </button>
        ))}
      </div>
    </div>
  );
};

const DndColumn: React.FC<{
  stage: DealStage;
  deals: ExtendedDeal[];
  allStages: DealStage[];
  draggingDealId: number | null;
  onDragStart: (dealId: number) => void;
  onDragEnd: () => void;
  onDrop: (dealId: number, targetStageId: number) => void;
  onDragOver: (stageId: number) => void;
  onOpenChat: (deal: ExtendedDeal) => void;
  dragOverStageId: number | null;
}> = ({
  stage,
  deals,
  allStages,
  draggingDealId,
  onDragStart,
  onDragEnd,
  onDrop,
  onDragOver,
  onOpenChat,
  dragOverStageId,
}) => {
    const totalVal = deals.reduce((acc, curr) => acc + (curr.value || 0), 0);
    const isDragOver = dragOverStageId === stage.id;

    return (
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          onDragOver(stage.id);
        }}
        onDrop={(e) => {
          e.preventDefault();
          const dealId = Number(e.dataTransfer.getData('text/plain'));
          if (dealId) onDrop(dealId, stage.id);
        }}
        className={`bg-[#0d1322] border rounded-xl p-3 flex flex-col min-h-[500px] transition-all ${isDragOver ? 'border-blue-500 ring-1 ring-blue-500/30' : 'border-slate-800'
          }`}
      >
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
            <span className="font-bold text-xs text-slate-200">{stage.name}</span>
          </div>
          <span className="text-xs font-semibold text-slate-400">({deals.length})</span>
        </div>

        <div className="text-[11px] font-medium text-slate-400 mb-3 px-1">
          Total: <span className="font-semibold text-white">IDR {totalVal.toLocaleString()}</span>
        </div>

        <div className="space-y-3 flex-1 overflow-y-auto">
          {deals.map((deal) => (
            <DndDealCard
              key={deal.id}
              deal={deal}
              stages={allStages}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDrop={onDrop}
              onOpenChat={onOpenChat}
              draggingDealId={draggingDealId}
            />
          ))}
          {deals.length === 0 && (
            <div className="flex items-center justify-center h-24 text-[11px] text-slate-600 border border-dashed border-slate-800 rounded-lg">
              Drop deals here
            </div>
          )}
        </div>
      </div>
    );
  };

export const DealsModule: React.FC = () => {
  const { subscribeEntity } = useRealtime();

  const [viewMode, setViewMode] = useState<'kanban' | 'chat'>('chat');
  const [stages, setStages] = useState<DealStage[]>([
    { id: 1, name: 'Qualification', position: 1, probability: 20, color: '#3b82f6' },
    { id: 2, name: 'Proposal Sent', position: 2, probability: 50, color: '#6366f1' },
    { id: 3, name: 'Negotiation', position: 3, probability: 80, color: '#f59e0b' },
    { id: 4, name: 'Closed Won', position: 4, probability: 100, color: '#10b981' },
  ]);

  const [deals, setDeals] = useState<ExtendedDeal[]>(INITIAL_DEALS);
  const [selectedDealId, setSelectedDealId] = useState<number>(104);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatInputText, setChatInputText] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [newDeal, setNewDeal] = useState<Partial<Deal>>({
    title: '',
    value: 50000000,
    currency: 'IDR',
    stage_id: 1,
    expected_close_date: '2026-09-01',
    description: '',
  });

  const [draggingDealId, setDraggingDealId] = useState<number | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeDeal = deals.find((d) => d.id === selectedDealId) || deals[0];

  const fetchDeals = useCallback(async () => {
    try {
      const dData = await apiFetch<Deal[]>('/api/v1/deals');
      if (Array.isArray(dData) && dData.length > 0) {
        setDeals((prev) => {
          return dData.map((apiDeal) => {
            const existing = prev.find((p) => p.id === apiDeal.id);
            return {
              ...apiDeal,
              badge: existing?.badge || `A${apiDeal.id}`,
              lead_number: existing?.lead_number || `Lead #${11000000 + apiDeal.id}`,
              has_new_message: existing?.has_new_message ?? false,
              unread_count: existing?.unread_count ?? 0,
              last_message: existing?.last_message || apiDeal.description,
              last_message_at: existing?.last_message_at || 'Hari ini',
              messages: existing?.messages || [],
            };
          });
        });
        // If current selectedDealId is not in real backend deals list, select first real deal
        if (!dData.some((d) => d.id === selectedDealId)) {
          setSelectedDealId(dData[0].id);
        }
      }

      const sData = await apiFetch<DealStage[]>('/api/v1/deal-stages');
      if (Array.isArray(sData)) setStages(sData);
    } catch (err) {
      console.warn('API error, keeping current deals state:', err);
    }
  }, [selectedDealId]);

  const fetchDealMessages = useCallback(async (dealId: number) => {
    try {
      const msgs = await apiFetch<WhatsAppMessage[]>(`/api/v1/deals/${dealId}/whatsapp-messages`);
      if (Array.isArray(msgs)) {
        setDeals((prev) =>
          prev.map((d) =>
            d.id === dealId
              ? {
                ...d,
                messages: msgs,
                last_message: msgs[msgs.length - 1]?.message || d.last_message,
              }
              : d
          )
        );
      }
    } catch {
      // 404 or connection error for mock/non-existent deals, fallback smoothly to local messages state
    }
  }, []);

  useEffect(() => {
    fetchDeals();

    const unsubDeal = subscribeEntity('deal', () => fetchDeals());
    const unsubMsg = subscribeEntity('whatsapp_message', () => {
      fetchDeals();
      if (selectedDealId) fetchDealMessages(selectedDealId);
    });

    return () => {
      unsubDeal();
      unsubMsg();
    };
  }, [fetchDeals, fetchDealMessages, selectedDealId, subscribeEntity]);

  useEffect(() => {
    if (selectedDealId) {
      fetchDealMessages(selectedDealId);
      setDeals((prev) =>
        prev.map((d) => (d.id === selectedDealId ? { ...d, has_new_message: false, unread_count: 0 } : d))
      );
    }
  }, [selectedDealId, fetchDealMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeDeal?.messages]);

  const moveDealStage = useCallback(
    async (dealId: number, targetStageId: number) => {
      const prevDeals = deals;
      setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage_id: targetStageId } : d)));
      try {
        await apiFetch(`/api/v1/deals/${dealId}/move-stage`, {
          method: 'PUT',
          body: JSON.stringify({ stage_id: targetStageId }),
        });
        fetchDeals();
      } catch {
        setDeals(prevDeals);
      }
    },
    [deals, fetchDeals]
  );

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInputText.trim() || !activeDeal) return;

    const newMsgText = chatInputText.trim();
    setChatInputText('');

    const newMsgObj: WhatsAppMessage = {
      id: Date.now(),
      phone: activeDeal.contact?.phone || '628123456789',
      direction: 'outgoing',
      message: newMsgText,
      sender_name: 'Salesbot',
      status: 'sent',
      sent_at: 'Kemarin ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setDeals((prev) =>
      prev.map((d) => {
        if (d.id === activeDeal.id) {
          const updatedMsgs = [...(d.messages || []), newMsgObj];
          return {
            ...d,
            messages: updatedMsgs,
            last_message: `Salesbot: ${newMsgText}`,
            last_message_at: 'Hari ini ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
        }
        return d;
      })
    );

    try {
      await apiFetch(`/api/v1/deals/${activeDeal.id}/whatsapp-messages`, {
        method: 'POST',
        body: JSON.stringify({
          phone: activeDeal.contact?.phone || '628123456789',
          message: newMsgText,
        }),
      });
      fetchDealMessages(activeDeal.id);
    } catch {
      // Optimistic state update applied above
    }
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch<Deal>('/api/v1/deals', {
        method: 'POST',
        body: JSON.stringify({
          ...newDeal,
          contact_id: 10,
          company_id: 1,
          owner_id: 1,
          status: 'Open',
        }),
      });
      fetchDeals();
      setShowModal(false);
    } catch {
      const created: ExtendedDeal = {
        id: Math.floor(Math.random() * 900) + 100,
        title: newDeal.title || 'New Deal Client',
        badge: `A${Math.floor(Math.random() * 900) + 100}`,
        lead_number: `Lead #${Math.floor(Math.random() * 8000000) + 10000000}`,
        contact_id: 10,
        company_id: 1,
        stage_id: Number(newDeal.stage_id) || 1,
        owner_id: 1,
        value: Number(newDeal.value) || 50000000,
        currency: 'IDR',
        expected_close_date: newDeal.expected_close_date || '2026-09-01',
        status: 'Open',
        description: newDeal.description || 'Incoming lead via WhatsApp',
        has_new_message: true,
        unread_count: 1,
        last_message: 'Halo, saya tertarik dengan SAPA AI',
        last_message_at: 'Hari ini ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        messages: [
          {
            id: Date.now(),
            phone: '628123456789',
            direction: 'incoming',
            message: 'Halo, saya tertarik dengan SAPA AI',
            sender_name: newDeal.title || 'New Deal Client',
            status: 'delivered',
            sent_at: 'Hari ini ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ],
      };
      setDeals((prev) => [created, ...prev]);
      setSelectedDealId(created.id);
      setShowModal(false);
    }
  };

  const filteredDeals = deals.filter(
    (d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.lead_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* Header bar with View Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0d1322] p-4 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">Deals & Chat Center</h1>
            <span className="bg-blue-600/30 text-blue-400 border border-blue-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <FiZap className="text-xs" /> Realtime Chat UI
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Manage sales pipeline, view incoming deal chats, and automate response flows
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === 'chat' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
            >
              <FiMessageSquare /> Chat Inbox
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === 'kanban' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
            >
              <FiGrid /> Pipeline Board
            </button>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="astryx-btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5 shadow-sm"
          >
            <FiPlus /> Create Deal
          </button>
        </div>
      </div>

      {/* Mode 1: Dual-Pane Chat Inbox */}
      {viewMode === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 bg-[#090d16] border border-slate-800 rounded-2xl overflow-hidden min-h-[680px] shadow-2xl">
          {/* Left Panel: Deal & Chat List */}
          <div className="lg:col-span-4 border-r border-slate-800/90 flex flex-col bg-[#0b101d]">
            {/* Search and stats bar */}
            <div className="p-3 border-b border-slate-800/80 space-y-3">
              <div className="relative">
                <FiSearch className="absolute left-3 top-2.5 text-slate-400 text-xs" />
                <input
                  type="text"
                  placeholder="Cari..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-between text-xs px-1">
                <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
                  Percakapan terbuka
                </span>
                <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                  <span>Total: <strong className="text-white">{filteredDeals.length}</strong></span>
                  <FiMoreHorizontal className="text-slate-400 hover:text-white cursor-pointer ml-1" />
                </div>
              </div>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
              {filteredDeals.map((d) => {
                const isSelected = d.id === selectedDealId;
                return (
                  <div
                    key={d.id}
                    onClick={() => {
                      setSelectedDealId(d.id);
                      setDeals((prev) =>
                        prev.map((item) => (item.id === d.id ? { ...item, has_new_message: false } : item))
                      );
                    }}
                    className={`p-3.5 cursor-pointer transition-all flex items-start gap-3 relative ${isSelected
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'hover:bg-slate-900/60 text-slate-200'
                      }`}
                  >
                    {/* Avatar with WA overlay badge */}
                    <div className="relative shrink-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
                          }`}
                      >
                        {d.title.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 text-slate-950 p-0.5 rounded-full border border-slate-900 text-[9px]">
                        <FiMessageSquare />
                      </span>
                    </div>

                    {/* Content info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className={`font-semibold text-xs truncate ${isSelected ? 'text-white' : 'text-slate-100'}`}>
                            {d.title}
                          </span>
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                              }`}
                          >
                            {d.badge || `A${d.id}`}
                          </span>
                        </div>
                        <span className={`text-[10px] shrink-0 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                          {d.last_message_at}
                        </span>
                      </div>

                      <div className={`text-[11px] mt-0.5 font-medium ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                        {d.lead_number || `Lead #${d.id}`}
                      </div>

                      <div className={`text-[11px] mt-1 truncate ${isSelected ? 'text-blue-50' : 'text-slate-300'}`}>
                        {d.last_message || d.description}
                      </div>

                      {/* "Deal masuk" badge */}
                      {d.has_new_message && !isSelected && (
                        <div className="mt-1.5 inline-flex items-center gap-1 bg-emerald-500 text-slate-950 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-300 animate-pulse">
                          <FiBell className="text-[10px]" /> Deal masuk
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Active WhatsApp Chat View */}
          <div className="lg:col-span-8 flex flex-col bg-[#080c14] relative">
            {activeDeal ? (
              <>
                {/* Chat Top Header */}
                <div className="p-3 px-4 bg-[#0d1322] border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-slate-800 text-slate-200 font-bold flex items-center justify-center text-xs border border-slate-700">
                        {activeDeal.title.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 text-slate-950 p-0.5 rounded-full border border-slate-900 text-[8px]">
                        <FiMessageSquare />
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-white">{activeDeal.title}</h3>
                        <span className="bg-emerald-950 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-800/60">
                          {activeDeal.badge || `A${activeDeal.id}`}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {activeDeal.lead_number || `Lead #${activeDeal.id}`} &bull; {activeDeal.currency || 'IDR'} {activeDeal.value?.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="bg-blue-950 text-blue-400 border border-blue-800/60 px-2.5 py-1 rounded-full font-semibold">
                      WhatsApp Connected
                    </span>
                  </div>
                </div>

                {/* Messages Timeline */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-radial from-slate-900/20 to-slate-950/80">
                  {/* Timeline centered date pill */}
                  <div className="flex justify-center my-2">
                    <span className="bg-slate-900/90 text-slate-400 text-[10px] font-semibold px-3 py-1 rounded-full border border-slate-800/80 shadow-xs">
                      Kemarin
                    </span>
                  </div>

                  {activeDeal.messages && activeDeal.messages.length > 0 ? (
                    activeDeal.messages.map((msg) => {
                      const isOutgoing = msg.direction === 'outgoing';
                      return (
                        <div
                          key={msg.id}
                          className={`flex items-start gap-2 max-w-[85%] ${isOutgoing ? 'ml-auto flex-row-reverse' : 'mr-auto'
                            }`}
                        >
                          {/* Avatar */}
                          <div className="relative shrink-0 mt-1">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border ${isOutgoing
                                ? 'bg-blue-600 text-white border-blue-500'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                                }`}
                            >
                              {isOutgoing ? 'SB' : activeDeal.title.slice(0, 1)}
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 text-slate-950 p-[1px] rounded-full text-[7px]">
                              <FiMessageSquare />
                            </span>
                          </div>

                          {/* Message Box */}
                          <div
                            className={`rounded-2xl p-3 shadow-md border text-xs text-slate-100 ${isOutgoing
                              ? 'bg-blue-600 border-blue-500/80 rounded-tr-xs text-white'
                              : 'bg-[#182030] border-slate-700/80 rounded-tl-xs'
                              }`}
                          >
                            {/* Top Meta header inside bubble matching picture */}
                            <div className="flex items-center justify-between text-[10px] text-blue-200/80 mb-1.5 pb-1 border-b border-white/10 gap-3">
                              <span>
                                {msg.sent_at || '19:10'} WhatsApp Lite
                              </span>
                              {isOutgoing && (
                                <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-300">
                                  <FiCheck /> Tersampaikan
                                </span>
                              )}
                            </div>

                            {/* Optional attachment thumbnail preview */}
                            {msg.message.toLowerCase().includes('gambar') && (
                              <div className="bg-black/30 p-2 rounded-lg mb-2 flex items-center gap-2 border border-white/10">
                                <FiImage className="text-base text-blue-300" />
                                <div>
                                  <div className="text-[10px] font-semibold text-white">Gambar</div>
                                  <div className="text-[9px] text-slate-300">Attachment preview</div>
                                </div>
                              </div>
                            )}

                            <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 text-xs text-slate-500">
                      No message history with {activeDeal.title}. Type below to send a message.
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* AI & Quick Action Bar */}
                <div className="p-2 px-4 bg-[#0a0f1c] border-t border-slate-800/80 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <button className="bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors">
                        <SparklesIcon className="text-blue-400 w-3.5 h-3.5" /> Alat chat AI
                      </button>
                      <button className="bg-slate-800/90 hover:bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1 rounded-lg transition-colors">
                        Percakapan berakhir
                      </button>
                      <button className="bg-slate-800/90 text-slate-400 border border-slate-700 px-2.5 py-1 rounded-lg">
                        Percakapan № {activeDeal.badge || `A${activeDeal.id}`}
                      </button>
                    </div>
                  </div>

                  {/* AI Instant reply prompt box */}
                  <div className="bg-blue-950/40 border border-blue-800/50 p-2 px-3 rounded-lg flex items-center justify-between text-xs text-blue-300">
                    <div className="flex items-center gap-2">
                      <SparklesIcon className="text-blue-400 animate-pulse shrink-0 w-3.5 h-3.5" />
                      <span>Balas klien secara instan dengan agen AI</span>
                    </div>
                    <button className="text-slate-400 hover:text-white">
                      <FiX />
                    </button>
                  </div>

                  {/* Input Form */}
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-1">
                    <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 flex items-center gap-2 focus-within:border-blue-500 transition-colors">
                      <span className="text-xs font-semibold text-blue-400 shrink-0">
                        Chat dengan <span className="underline">{activeDeal.title}</span>:
                      </span>
                      <input
                        type="text"
                        value={chatInputText}
                        onChange={(e) => setChatInputText(e.target.value)}
                        placeholder="⚡ Tulis pesan atau ketik '/' untuk daftar Salesbot kamu"
                        className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!chatInputText.trim()}
                      className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shrink-0"
                    >
                      <FiSend /> Kirim
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                Select a deal to open WhatsApp chat
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 2: Drag & Drop Pipeline Kanban View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {stages.map((stage) => {
            const stageDeals = deals.filter((d) => d.stage_id === stage.id);
            return (
              <DndColumn
                key={stage.id}
                stage={stage}
                deals={stageDeals}
                allStages={stages}
                draggingDealId={draggingDealId}
                onDragStart={(id) => setDraggingDealId(id)}
                onDragEnd={() => {
                  setDraggingDealId(null);
                  setDragOverStageId(null);
                }}
                onDrop={(dealId, targetStageId) => moveDealStage(dealId, targetStageId)}
                onDragOver={(id) => setDragOverStageId(id)}
                onOpenChat={(deal) => {
                  setSelectedDealId(deal.id);
                  setViewMode('chat');
                }}
                dragOverStageId={dragOverStageId}
              />
            );
          })}
        </div>
      )}

      {/* Create New Deal Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 font-sans">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FiPlus className="text-blue-400" /> Create New Deal
            </h3>
            <form onSubmit={handleCreateDeal} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Deal / Contact Name</label>
                <input
                  type="text"
                  required
                  value={newDeal.title || ''}
                  onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-sans focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Sarah zen"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Estimated Value (IDR)</label>
                <input
                  type="number"
                  required
                  value={newDeal.value || 0}
                  onChange={(e) => setNewDeal({ ...newDeal, value: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-sans focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Pipeline Stage</label>
                <select
                  value={newDeal.stage_id || 1}
                  onChange={(e) => setNewDeal({ ...newDeal, stage_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-sans focus:outline-none focus:border-blue-500"
                >
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={newDeal.description || ''}
                  onChange={(e) => setNewDeal({ ...newDeal, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-sans focus:outline-none focus:border-blue-500"
                  placeholder="Notes about client requirements..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="astryx-btn-secondary text-xs px-3.5 py-1.5"
                >
                  Cancel
                </button>
                <button type="submit" className="astryx-btn-primary text-xs px-4 py-1.5">
                  Save Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
