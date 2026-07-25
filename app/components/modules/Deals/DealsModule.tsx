'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRealtime } from '../../../context/RealtimeContext';
import { apiFetch, apiUpload, resolveApiAssetUrl } from '../../../lib/api';
import {
  DealInboxItem,
  applyWhatsAppMessageChange,
  getDealContactName,
  getInitials,
  hydrateDealInbox,
} from '../../../lib/realtime';
import { AiDealSummary, Deal, DealStage, WhatsAppMessage } from '../../../types';
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
  FiBell,
  FiPaperclip,
  FiSmile,
  FiEdit2
} from 'react-icons/fi';

const SparklesIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
  </svg>
);

type ExtendedDeal = DealInboxItem;

const DndDealCard: React.FC<{
  deal: ExtendedDeal;
  stages: DealStage[];
  onDragStart: (dealId: number) => void;
  onDragEnd: () => void;
  onDrop: (dealId: number, targetStageId: number) => void;
  onOpenChat: (deal: ExtendedDeal) => void;
  onEditDeal: (deal: ExtendedDeal) => void;
  draggingDealId: number | null;
}> = ({ deal, stages, onDragStart, onDragEnd, onDrop, onOpenChat, onEditDeal, draggingDealId }) => {
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
      className={`astryx-card p-3.5 bg-[#111827] border shadow-md hover:border-blue-500/60 transition-all cursor-pointer relative group rounded-xl ${isDragging ? 'opacity-40 border-blue-500 scale-95' : 'border-slate-800/80'
        }`}
    >
      {deal.has_new_message && (
        <div className="absolute -top-2 -right-2 bg-emerald-500 text-slate-950 font-bold text-[9px] px-2 py-0.5 rounded-full shadow-lg border border-emerald-300 animate-pulse flex items-center gap-1 z-10">
          <FiBell className="text-[10px]" /> Deal masuk
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span className="inline-block bg-slate-800 text-emerald-400 font-mono text-[9px] px-1.5 py-0.5 rounded font-bold mb-1">
            {deal.badge || `A${deal.id}`}
          </span>
          <h4 className="font-semibold text-xs text-white leading-tight truncate">
            {deal.title}
          </h4>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditDeal(deal);
            }}
            className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
            title="Edit Deal Data & Nilai (Rp.)"
          >
            <FiEdit2 className="text-xs" />
          </button>
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
      </div>

      {deal.description && (
        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{deal.description}</p>
      )}

      {deal.last_message && (
        <div className="mt-2 text-[10px] text-slate-400 bg-slate-950/60 p-1.5 rounded border border-slate-800/80 truncate flex items-center gap-1">
          <FiMessageSquare className="shrink-0 text-emerald-400 text-[10px]" />
          <span className="truncate">{deal.last_message}</span>
        </div>
      )}

      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
        <span className="font-bold text-xs text-blue-400">
          Rp. {deal.value?.toLocaleString()}
        </span>
        <span className="text-[10px] text-slate-400">{deal.expected_close_date}</span>
      </div>

      <div className="mt-2.5 flex items-center gap-1 overflow-x-auto pt-0.5">
        <span className="text-[10px] text-slate-400 shrink-0">Move:</span>
        {stages.map((st) => (
          <button
            key={st.id}
            disabled={st.id === deal.stage_id}
            onClick={(e) => {
              e.stopPropagation();
              onDrop(deal.id, st.id);
            }}
            className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 transition-all ${st.id === deal.stage_id ? 'opacity-40 ring-1 ring-slate-500' : 'hover:scale-125'
              }`}
            style={{ backgroundColor: st.color || '#64748b', color: '#fff' }}
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
  onEditDeal: (deal: ExtendedDeal) => void;
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
  onEditDeal,
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
        className={`w-72 sm:w-80 shrink-0 flex flex-col max-h-full bg-[#0b101d] border rounded-2xl p-4 transition-colors shadow-lg ${isDragOver ? 'border-blue-500 bg-blue-950/20 shadow-blue-500/10' : 'border-slate-800'
          }`}
      >
        <div className="flex items-center justify-between pb-2 mb-1 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color || '#64748b' }} />
            <span className="font-bold text-xs text-slate-200">{stage.name}</span>
          </div>
          <span className="text-xs font-semibold text-slate-400">({deals.length})</span>
        </div>

        <div className="text-[11px] font-medium text-slate-400 my-2 px-1 flex items-center justify-between">
          <span>Total Pipeline:</span>
          <span className="font-bold text-emerald-400">Rp. {totalVal.toLocaleString()}</span>
        </div>

        <div className="space-y-3 flex-1 overflow-y-auto min-h-0 pr-1 text-xs">
          {deals.map((deal) => (
            <DndDealCard
              key={deal.id}
              deal={deal}
              stages={allStages}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDrop={onDrop}
              onOpenChat={onOpenChat}
              onEditDeal={onEditDeal}
              draggingDealId={draggingDealId}
            />
          ))}
          {deals.length === 0 && (
            <div className="flex items-center justify-center h-28 text-[11px] text-slate-600 border border-dashed border-slate-800/80 rounded-xl">
              Tarik deal ke sini
            </div>
          )}
        </div>
      </div>
    );
  };

const EMOJI_CATEGORIES = [
  {
    name: 'Smileys',
    icon: '😀',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥲', '🥹', '😊', '😇',
      '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛',
      '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🥳', '😏', '😒', '😞',
      '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭',
      '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥',
      '😓', '🤗', '🤔', '🫣', '🤭', '🫢', '🫡', '🤫', '🫠', '🤥', '😶', '🫥',
      '😐', '🫤', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴',
      '🤤', '😪', '😵', '😵‍💫', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕'
    ],
  },
  {
    name: 'Gestures',
    icon: '👍',
    emojis: [
      '👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘', '👌', '🤌',
      '🤏', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤙',
      '💪', '🖕', '🙏', '👏', '🤝', '🫶', '👐', '🤲', '✍️', '💅', '🤳'
    ],
  },
  {
    name: 'Hearts & Symbols',
    icon: '❤️',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💔', '❣️', '💕',
      '💞', '💓', '💗', '💖', '💘', '💝', '🔥', '✨', '⭐', '🌟', '💫', '🎯',
      '💯', '🚀', '🎉', '🎊', '💬', '💭', '⚡', '💡', '✅', '❌', '⚠️', '🔔'
    ],
  },
  {
    name: 'Animals & Nature',
    icon: '🐶',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁',
      '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅',
      '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪲', '🐛', '🦋', '🐌', '🌸'
    ],
  },
  {
    name: 'Food & Objects',
    icon: '🍔',
    emojis: [
      '🍎', '🍊', '🍋', '🍌', '🍍', '🥭', '🍇', '🍉', '🍓', '🫐', '🍈', '🍒',
      '🍑', '🍐', '🍏', '🥐', '🍞', '🥖', '🥯', '🍕', '🍔', '🍟', '🌭', '🍿',
      '🥞', '🧇', '🥓', '🥩', '☕', '🍵', '🧃', '🥤', '🍺', '🍻', '🥂', '🍾'
    ],
  },
  {
    name: 'People & Roles',
    icon: '🧑',
    emojis: [
      '👶', '🧒', '👦', '👧', '🧑', '👨', '👩', '🧔', '👱', '🧓', '👴', '👵',
      '👮', '👷', '💂', '🕵️', '👩‍⚕️', '👨‍🌾', '👩‍🍳', '👨‍🎓', '👩‍🏫', '👨‍⚖️',
      '👩‍💻', '👨‍💼', '👩‍🔧', '👨‍🔬', '👩‍🎨', '👨‍🚒', '👩‍✈️', '🧑‍🚀', '👰', '🤵'
    ],
  },
  {
    name: 'Travel & Activities',
    icon: '⚽',
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥅', '⛳',
      '🎣', '🤿', '🎿', '🛷', '🥌', '🎮', '🎲', '🧩', '🎨', '🎭', '🎤', '🎧',
      '🚗', '🚕', '🚌', '🏍️', '🚲', '✈️', '🚀', '🚁', '🚢', '🏠', '🏢', '🏖️'
    ],
  },
  {
    name: 'Work & Flags',
    icon: '💼',
    emojis: [
      '💼', '📁', '📌', '📎', '📝', '📊', '📈', '📉', '📅', '⏰', '☎️', '📱',
      '💻', '⌨️', '🖨️', '🔒', '🔑', '🛒', '💳', '💰', '🧾', '📦', '🛠️', '⚙️',
      '🏳️', '🏁', '🚩', '🇮🇩', '🇸🇬', '🇲🇾', '🇺🇸', '🇬🇧', '🇯🇵', '🇰🇷', '🇨🇳', '🇦🇺'
    ],
  },
];

export const DealsModule: React.FC = () => {
  const { subscribeEntity, wsStatus } = useRealtime();

  const [viewMode, setViewMode] = useState<'kanban' | 'chat'>('chat');
  const [stages, setStages] = useState<DealStage[]>([
    { id: 1, name: 'Qualification', position: 1, probability: 20, color: '#3b82f6' },
    { id: 2, name: 'Proposal Sent', position: 2, probability: 50, color: '#6366f1' },
    { id: 3, name: 'Negotiation', position: 3, probability: 80, color: '#f59e0b' },
    { id: 4, name: 'Closed Won', position: 4, probability: 100, color: '#10b981' },
  ]);

  const [deals, setDeals] = useState<ExtendedDeal[]>([]);
  const [selectedDealId, setSelectedDealId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatInputText, setChatInputText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [sendMessageError, setSendMessageError] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<AiDealSummary | null>(null);
  const [aiSummaryError, setAiSummaryError] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState(0);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const insertEmoji = (emoji: string) => {
    setChatInputText((prev) => prev + emoji);
    if (sendMessageError) setSendMessageError(null);
    chatInputRef.current?.focus();
  };

  const [showModal, setShowModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<ExtendedDeal | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleOpenEditModal = (deal: ExtendedDeal) => {
    setEditingDeal({ ...deal });
    setShowEditModal(true);
  };

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
  const selectedDealIdRef = useRef<number | null>(null);
  const inboxInitializedRef = useRef(false);
  const fetchGenerationRef = useRef(0);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeDeal = deals.find((d) => d.id === selectedDealId) || deals[0];
  const activeContactName = activeDeal ? getDealContactName(activeDeal) : '';
  const activeContactInitials = getInitials(activeContactName);

  const fetchDeals = useCallback(async () => {
    const generation = ++fetchGenerationRef.current;
    try {
      const [dData, sData, messageData] = await Promise.all([
        apiFetch<Deal[]>('/api/v1/deals', { silentError: true }),
        apiFetch<DealStage[]>('/api/v1/deal-stages', { silentError: true }),
        apiFetch<WhatsAppMessage[]>('/api/v1/whatsapp/messages', { silentError: true }),
      ]);
      if (generation !== fetchGenerationRef.current) return;

      if (Array.isArray(dData)) {
        setDeals((previous) =>
          hydrateDealInbox(
            dData,
            Array.isArray(messageData) ? messageData : [],
            previous,
            selectedDealIdRef.current,
            inboxInitializedRef.current
          )
        );
        inboxInitializedRef.current = true;

        if (dData.length === 0) {
          setSelectedDealId(null);
          selectedDealIdRef.current = null;
        } else {
          setSelectedDealId((prevId) => {
            if (!prevId || !dData.some((d) => d.id === prevId)) {
              selectedDealIdRef.current = dData[0].id;
              return dData[0].id;
            }
            return prevId;
          });
        }
      }

      if (Array.isArray(sData)) setStages(sData);
    } catch (err) {
      console.warn('API error, keeping current deals state:', err);
    }
  }, []);

  const fetchDealMessages = useCallback(async (dealId: number) => {
    if (!dealId) return;
    try {
      const msgs = await apiFetch<WhatsAppMessage[]>(
        `/api/v1/deals/${dealId}/whatsapp-messages`,
        { silentError: true }
      );
      if (Array.isArray(msgs)) {
        setDeals((prev) =>
          prev.map((d) =>
            d.id === dealId
              ? {
                ...d,
                messages: msgs,
                last_message: msgs.length > 0 ? msgs[msgs.length - 1].message : d.last_message,
              }
              : d
          )
        );
      }
    } catch {
      // 404 or connection error for mock/non-existent deals, fallback smoothly to local messages state
    }
  }, []);

  const scheduleInboxRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => {
      refreshTimerRef.current = null;
      fetchDeals();
    }, 75);
  }, [fetchDeals]);

  useEffect(() => {
    fetchDeals();

    const unsubDeal = subscribeEntity('deal', scheduleInboxRefresh);
    const unsubStage = subscribeEntity('deal_stage', scheduleInboxRefresh);
    const unsubMsg = subscribeEntity('whatsapp_message', (event) => {
      setDeals((current) =>
        applyWhatsAppMessageChange(current, event, selectedDealIdRef.current)
      );
    });

    return () => {
      unsubDeal();
      unsubStage();
      unsubMsg();
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [fetchDeals, scheduleInboxRefresh, subscribeEntity]);

  useEffect(() => {
    selectedDealIdRef.current = selectedDealId;
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

  const [attachedMediaUrl, setAttachedMediaUrl] = useState<string | null>(null);
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const upload = await apiUpload(file);
      setAttachedMediaUrl(upload.url);
      setAttachedFileName(upload.filename || file.name);
    } catch (err) {
      console.error('Failed to upload file:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSummarizeDeal = async () => {
    if (!activeDeal || isSummarizing) return;
    setIsSummarizing(true);
    setAiSummary(null);
    setAiSummaryError(null);
    try {
      const summary = await apiFetch<AiDealSummary>('/api/v1/ai/deals/summary', {
        method: 'POST',
        silentError: true,
        body: JSON.stringify({
          deal_id: activeDeal.id,
          language: 'Indonesian',
        }),
      });
      setAiSummary(summary);
    } catch (error) {
      setAiSummaryError(
        error instanceof Error ? error.message : 'Ringkasan AI tidak dapat dibuat.'
      );
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (
      isSendingMessage
      || (!chatInputText.trim() && !attachedMediaUrl)
      || !activeDeal
    ) return;

    const newMsgText = chatInputText.trim() || (attachedFileName ? `[Lampiran: ${attachedFileName}]` : '[Media]');
    const mediaUrlToSend = attachedMediaUrl;
    const fileNameToSend = attachedFileName;
    const optimisticMessageId = Date.now();

    setIsSendingMessage(true);
    setSendMessageError(null);
    setChatInputText('');
    setAttachedMediaUrl(null);
    setAttachedFileName(null);

    const newMsgObj: WhatsAppMessage = {
      id: optimisticMessageId,
      phone: activeDeal.contact?.phone || '',
      direction: 'outgoing',
      message: newMsgText,
      media_url: mediaUrlToSend,
      sender_name: 'Salesbot',
      status: 'pending',
      sent_at: 'Hari ini ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
          phone: activeDeal.contact?.phone || undefined,
          message: newMsgText,
          media_url: mediaUrlToSend,
          media_filename: fileNameToSend,
        }),
        silentError: true,
      });
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Pesan gagal dikirim ke WhatsApp.';
      setSendMessageError(message);
      setChatInputText((current) => current || newMsgText);
      setAttachedMediaUrl((current) => current || mediaUrlToSend);
      setAttachedFileName((current) => current || fileNameToSend);
      setDeals((previous) =>
        previous.map((deal) => ({
          ...deal,
          messages: deal.messages?.map((item) =>
            item.id === optimisticMessageId
              ? { ...item, status: 'failed', error_message: message }
              : item
          ),
        }))
      );
    } finally {
      setIsSendingMessage(false);
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

  const handleSaveEditDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDeal) return;

    const dealId = editingDeal.id;
    const updatePayload = {
      title: editingDeal.title,
      value: Number(editingDeal.value) || 0,
      stage_id: Number(editingDeal.stage_id),
      description: editingDeal.description || '',
      expected_close_date: editingDeal.expected_close_date || '2026-09-01',
    };

    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, ...updatePayload } : d))
    );

    try {
      await apiFetch(`/api/v1/deals/${dealId}`, {
        method: 'PUT',
        body: JSON.stringify(updatePayload),
      });
      fetchDeals();
      setShowEditModal(false);
      setEditingDeal(null);
    } catch (err) {
      console.error('Failed to update deal:', err);
      fetchDeals();
    }
  };

  const filteredDeals = deals.filter(
    (d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getDealContactName(d).toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.lead_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      data-testid="deals-workspace"
      className="flex flex-col gap-4 font-sans text-slate-100 lg:h-full lg:min-h-0"
    >
      {/* Header bar with View Switcher */}
      <div className="flex shrink-0 flex-col items-start justify-between gap-4 rounded-xl border border-slate-800 bg-[#0d1322] p-4 sm:flex-row sm:items-center">
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
        <div
          data-testid="deals-chat-card"
          className="grid min-h-[620px] grid-cols-1 overflow-hidden rounded-2xl border border-slate-800 bg-[#090d16] shadow-2xl lg:min-h-0 lg:flex-1 lg:grid-cols-12"
        >
          {/* Left Panel: Deal & Chat List */}
          <div className="flex min-h-0 flex-col border-r border-slate-800/90 bg-[#0b101d] lg:col-span-4">
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
            <div
              data-testid="conversation-list"
              className="min-h-0 flex-1 divide-y divide-slate-800/40 overflow-y-auto overscroll-contain"
            >
              {filteredDeals.map((d) => {
                const isSelected = d.id === selectedDealId;
                const contactName = getDealContactName(d);
                return (
                  <div
                    key={d.id}
                    onClick={() => {
                      selectedDealIdRef.current = d.id;
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
                        {getInitials(contactName)}
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
                            {contactName}
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
          <div className="relative flex min-h-0 flex-col bg-[#080c14] lg:col-span-8">
            {activeDeal ? (
              <>
                {/* Chat Top Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-slate-800 bg-[#0d1322] p-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-slate-800 text-slate-200 font-bold flex items-center justify-center text-xs border border-slate-700">
                        {activeContactInitials}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 text-slate-950 p-0.5 rounded-full border border-slate-900 text-[8px]">
                        <FiMessageSquare />
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">{activeContactName}</h3>
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
                    <span
                      className={`border px-2.5 py-1 rounded-full font-semibold ${wsStatus === 'connected'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800/60'
                        : wsStatus === 'connecting'
                          ? 'bg-amber-950 text-amber-400 border-amber-800/60'
                          : 'bg-rose-950 text-rose-400 border-rose-800/60'
                        }`}
                    >
                      {wsStatus === 'connected'
                        ? 'Realtime aktif'
                        : wsStatus === 'connecting'
                          ? 'Menghubungkan realtime…'
                          : 'Realtime terputus'}
                    </span>
                  </div>
                </div>

                {/* Messages Timeline */}
                <div
                  data-testid="message-timeline"
                  className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain bg-radial from-slate-900/20 to-slate-950/80 p-4"
                >
                  {/* Timeline centered date pill */}
                  <div className="flex justify-center my-2">
                    <span className="bg-slate-900/90 text-slate-400 text-[10px] font-semibold px-3 py-1 rounded-full border border-slate-800/80 shadow-xs">
                      Kemarin
                    </span>
                  </div>

                  {activeDeal.messages && activeDeal.messages.length > 0 ? (
                    activeDeal.messages.map((msg) => {
                      const isOutgoing = msg.direction === 'outgoing' || msg.direction === 'outbound';
                      const isFailed = msg.status === 'failed';
                      const isPending = msg.status === 'pending';
                      const isSticker = !isOutgoing
                        && Boolean(msg.media_url)
                        && (
                          msg.message === '[Stiker]'
                          || msg.message.toLowerCase().includes('stiker')
                        );

                      if (isSticker) {
                        return (
                          <div
                            key={msg.id}
                            className={`flex items-start gap-2 max-w-[85%] ${isOutgoing ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                          >
                            <div className="relative shrink-0 mt-1">
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border ${isOutgoing
                                  ? 'bg-blue-600 text-white border-blue-500'
                                  : 'bg-slate-800 text-slate-300 border-slate-700'
                                  }`}
                              >
                                {isOutgoing ? 'SB' : activeContactInitials}
                              </div>
                            </div>

                            <div className="flex flex-col items-start gap-1">
                              {msg.media_url ? (
                                // Backend media URLs are runtime user uploads with unknown dimensions.
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={resolveApiAssetUrl(msg.media_url) || undefined}
                                  alt="sticker"
                                  className="max-w-[140px] max-h-[140px] object-contain drop-shadow-lg cursor-pointer hover:scale-105 transition-transform"
                                  onClick={() => setModalImageUrl(msg.media_url!)}
                                />
                              ) : null}
                              <span className="text-[9px] text-slate-400 px-1">
                                {msg.sent_at || 'Hari ini'}
                              </span>
                            </div>
                          </div>
                        );
                      }

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
                              {isOutgoing ? 'SB' : activeContactInitials}
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
                                {msg.sent_at || '19:10'}
                              </span>
                              {isOutgoing && (
                                <span
                                  className={`flex items-center gap-1 text-[10px] font-medium ${isFailed
                                    ? 'text-rose-300'
                                    : isPending
                                      ? 'text-amber-300'
                                      : 'text-emerald-300'
                                    }`}
                                >
                                  {isFailed ? <FiX /> : isPending ? <FiSend /> : <FiCheck />}
                                  {isFailed
                                    ? 'Gagal dikirim'
                                    : isPending
                                      ? 'Mengirim…'
                                      : msg.status === 'delivered' || msg.status === 'read'
                                        ? 'Tersampaikan'
                                        : 'Terkirim'}
                                </span>
                              )}
                            </div>

                            {/* Media attachment */}
                            {msg.media_url ? (
                              <div className="mb-2 rounded-lg overflow-hidden border border-white/10 max-w-xs">
                                {/* Backend media URLs are runtime user uploads with unknown dimensions. */}
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={resolveApiAssetUrl(msg.media_url) || undefined}
                                  alt="attachment"
                                  className="max-w-full max-h-56 object-contain bg-black/40 cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => setModalImageUrl(msg.media_url!)}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            ) : msg.message.toLowerCase().includes('gambar') ? (
                              <div className="bg-black/30 p-2 rounded-lg mb-2 flex items-center gap-2 border border-white/10">
                                <FiImage className="text-base text-blue-300" />
                                <div>
                                  <div className="text-[10px] font-semibold text-white">Gambar</div>
                                  <div className="text-[9px] text-slate-300">Attachment preview</div>
                                </div>
                              </div>
                            ) : null}

                            <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                            {isFailed && msg.error_message && (
                              <p className="mt-2 border-t border-rose-300/20 pt-1.5 text-[10px] text-rose-200">
                                {msg.error_message}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 text-xs text-slate-500">
                      No message history with {activeContactName}. Type below to send a message.
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* AI & Quick Action Bar */}
                <div className="shrink-0 space-y-2 border-t border-slate-800/80 bg-[#0a0f1c] p-2 px-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void handleSummarizeDeal()}
                        disabled={isSummarizing}
                        className="bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-60"
                      >
                        <SparklesIcon className="text-blue-400 w-3.5 h-3.5" />
                        {isSummarizing ? 'Merangkum…' : 'Ringkas aktivitas AI'}
                      </button>
                      <button className="bg-slate-800/90 text-slate-400 border border-slate-700 px-2.5 py-1 rounded-lg">
                        Percakapan № {activeDeal.badge || `A${activeDeal.id}`}
                      </button>
                    </div>
                  </div>

                  {(aiSummary || aiSummaryError) && (
                    <div className={`max-h-44 overflow-y-auto rounded-xl border p-3 text-xs ${aiSummaryError
                        ? 'border-rose-800/60 bg-rose-950/40 text-rose-200'
                        : 'border-violet-800/60 bg-violet-950/30 text-slate-200'
                      }`}>
                      {aiSummaryError ? (
                        <p>{aiSummaryError}</p>
                      ) : aiSummary && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <strong className="text-violet-300">Ringkasan percakapan & aktivitas</strong>
                            <span className="text-[9px] font-bold text-amber-300">REVIEW REQUIRED</span>
                          </div>
                          <p className="whitespace-pre-wrap leading-relaxed">
                            {aiSummary.draft.summary || aiSummary.draft.raw}
                          </p>
                          {[
                            ['Kebutuhan pelanggan', aiSummary.draft.customer_needs],
                            ['Sudah dilakukan', aiSummary.draft.actions_completed],
                            ['Belum terjawab', aiSummary.draft.open_questions],
                            ['Langkah berikutnya', aiSummary.draft.recommended_next_steps],
                          ].map(([label, values]) => Array.isArray(values) && values.length > 0 && (
                            <div key={String(label)}>
                              <p className="font-semibold text-violet-200">{String(label)}</p>
                              <ul className="list-disc pl-4 text-slate-300">
                                {values.map((value) => <li key={value}>{value}</li>)}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pending Media Attachment Badge */}
                  {attachedMediaUrl && (
                    <div className="bg-slate-800/90 border border-blue-500/50 p-2 px-3 rounded-lg flex items-center justify-between text-xs text-blue-300">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FiImage className="text-blue-400 shrink-0" />
                        <span className="truncate max-w-xs">{attachedFileName || 'File Siap Dikirim'}</span>
                      </div>
                      <button
                        onClick={() => {
                          setAttachedMediaUrl(null);
                          setAttachedFileName(null);
                        }}
                        className="text-slate-400 hover:text-red-400 transition-colors p-1"
                      >
                        <FiX />
                      </button>
                    </div>
                  )}

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

                  {/* Hidden File Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelected}
                    className="hidden"
                    accept="image/*,video/*,application/pdf,.doc,.docx"
                  />

                  {/* Emoji Picker Popover */}
                  {showEmojiPicker && (
                    <div
                      ref={emojiPickerRef}
                      className="absolute bottom-16 left-4 z-50 w-72 h-64 bg-[#0d1322] border border-slate-700/80 rounded-2xl p-3 shadow-2xl flex flex-col backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-150"
                    >
                      {/* Category Tabs */}
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                        <div className="flex items-center gap-1 overflow-x-auto">
                          {EMOJI_CATEGORIES.map((cat, idx) => (
                            <button
                              key={cat.name}
                              type="button"
                              onClick={() => setActiveEmojiCategory(idx)}
                              className={`p-1.5 rounded-lg text-sm transition-all ${activeEmojiCategory === idx
                                ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40 font-bold scale-105'
                                : 'hover:bg-slate-800 text-slate-400'
                                }`}
                              title={cat.name}
                            >
                              {cat.icon}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowEmojiPicker(false)}
                          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                        >
                          <FiX className="text-xs" />
                        </button>
                      </div>

                      {/* Emoji Grid */}
                      <div className="flex-1 overflow-y-auto grid grid-cols-7 gap-1 p-1">
                        {EMOJI_CATEGORIES[activeEmojiCategory].emojis.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => insertEmoji(emoji)}
                            className="w-8 h-8 flex items-center justify-center text-lg rounded-lg hover:bg-slate-800 hover:scale-125 transition-all"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input Form */}
                  {sendMessageError && (
                    <div
                      role="alert"
                      className="rounded-lg border border-rose-800/70 bg-rose-950/60 px-3 py-2 text-xs text-rose-200"
                    >
                      Pesan belum terkirim: {sendMessageError}
                    </div>
                  )}
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-1 relative">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker((prev) => !prev)}
                      className={`p-2.5 rounded-xl border transition-colors shrink-0 ${showEmojiPicker
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                        }`}
                      title="Pilih emoji"
                    >
                      <FiSmile />
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading || isSendingMessage}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2.5 rounded-xl border border-slate-700 transition-colors disabled:opacity-50 shrink-0"
                      title="Upload file / media"
                    >
                      <FiPaperclip className={isUploading ? 'animate-spin' : ''} />
                    </button>

                    <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 flex items-center gap-2 focus-within:border-blue-500 transition-colors">
                      <span className="text-xs font-semibold text-blue-400 shrink-0">
                        Chat dengan <span className="underline">{activeContactName}</span>:
                      </span>
                      <input
                        ref={chatInputRef}
                        type="text"
                        value={chatInputText}
                        onChange={(e) => {
                          setChatInputText(e.target.value);
                          if (sendMessageError) setSendMessageError(null);
                        }}
                        placeholder="⚡ Tulis pesan atau ketik '/' untuk daftar Salesbot kamu"
                        className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={
                        (!chatInputText.trim() && !attachedMediaUrl)
                        || isUploading
                        || isSendingMessage
                      }
                      className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shrink-0"
                    >
                      <FiSend className={isSendingMessage ? 'animate-pulse' : ''} />
                      {isSendingMessage ? 'Mengirim…' : 'Kirim'}
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
        <div className="flex flex-1 min-h-0 w-full gap-4 overflow-x-auto overflow-y-hidden pb-4 pt-1 items-stretch">
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
                  selectedDealIdRef.current = deal.id;
                  setSelectedDealId(deal.id);
                  setViewMode('chat');
                }}
                onEditDeal={handleOpenEditModal}
                dragOverStageId={dragOverStageId}
              />
            );
          })}
        </div>
      )}

      {/* Edit Deal Modal */}
      {showEditModal && editingDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 font-sans">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FiEdit2 className="text-amber-400" /> Edit Data & Nilai Deal
            </h3>
            <form onSubmit={handleSaveEditDeal} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Judul / Nama Deal</label>
                <input
                  type="text"
                  required
                  value={editingDeal.title || ''}
                  onChange={(e) => setEditingDeal({ ...editingDeal, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-sans focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nilai Deal (Rp.)</label>
                <input
                  type="number"
                  required
                  value={editingDeal.value || 0}
                  onChange={(e) => setEditingDeal({ ...editingDeal, value: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-sans focus:outline-none focus:border-blue-500 font-mono text-amber-400 font-bold"
                  placeholder="e.g. 50000000"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Tahap Pipeline (Stage)</label>
                <select
                  value={editingDeal.stage_id || 1}
                  onChange={(e) => setEditingDeal({ ...editingDeal, stage_id: Number(e.target.value) })}
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
                <label className="block font-semibold text-slate-300 mb-1">Deskripsi / Catatan Deal</label>
                <textarea
                  rows={3}
                  value={editingDeal.description || ''}
                  onChange={(e) => setEditingDeal({ ...editingDeal, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-sans focus:outline-none focus:border-blue-500"
                  placeholder="Catatan kebutuhan klien..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingDeal(null);
                  }}
                  className="astryx-btn-secondary text-xs px-3.5 py-1.5"
                >
                  Batal
                </button>
                <button type="submit" className="astryx-btn-primary bg-amber-600 hover:bg-amber-500 text-xs px-4 py-1.5 font-bold">
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
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
                <label className="block font-semibold text-slate-300 mb-1">Estimated Value (Rp.)</label>
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

      {modalImageUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Attachment preview"
          onClick={() => setModalImageUrl(null)}
        >
          <button
            type="button"
            onClick={() => setModalImageUrl(null)}
            className="absolute right-6 top-6 rounded-full border border-slate-700 bg-slate-900 p-2 text-slate-300 hover:text-white"
            aria-label="Close attachment preview"
          >
            <FiX />
          </button>
          {/* Backend media URLs are runtime user uploads with unknown dimensions. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveApiAssetUrl(modalImageUrl) || undefined}
            alt="Full-size message attachment"
            className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
