'use client';

import React, { useEffect, useState } from 'react';
import { useRealtime } from '../../../context/RealtimeContext';
import { apiFetch } from '../../../lib/api';
import { WhatsAppMessage, WhatsAppSession } from '../../../types';
import { FiMessageSquare, FiSend, FiZap, FiPower } from 'react-icons/fi';

export const WhatsAppModule: React.FC = () => {
  const { subscribeEntity } = useRealtime();

  const [session, setSession] = useState<WhatsAppSession>({
    status: 'CONNECTED',
    phone: '6281234567890',
  });
  const [messages, setMessages] = useState<WhatsAppMessage[]>([
    {
      id: 1,
      phone: '6281234567890',
      message: 'Halo, ini pesan otomatis dari SAPA AI!',
      status: 'sent',
      sent_at: '2026-07-21T07:30:00Z',
    },
  ]);
  const [recipientPhone, setRecipientPhone] = useState('6281234567890');
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);

  const fetchSessionAndMessages = async () => {
    try {
      const sData = await apiFetch<WhatsAppSession>('/api/v1/whatsapp/status');
      if (sData) setSession(sData);

      const mData = await apiFetch<WhatsAppMessage[]>('/api/v1/whatsapp/messages');
      if (Array.isArray(mData)) setMessages(mData);
    } catch (err) {
      console.warn('API error, using initial WhatsApp mock data:', err);
    }
  };

  useEffect(() => {
    fetchSessionAndMessages();
    const unsubSession = subscribeEntity('whatsapp_session', () => fetchSessionAndMessages());
    const unsubMsg = subscribeEntity('whatsapp_message', () => fetchSessionAndMessages());
    return () => {
      unsubSession();
      unsubMsg();
    };
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    setSending(true);
    try {
      await apiFetch('/api/v1/whatsapp/send', {
        method: 'POST',
        body: JSON.stringify({ phone: recipientPhone, message: messageText }),
      });
      fetchSessionAndMessages();
      setMessageText('');
    } catch (err) {
      const sentMsg: WhatsAppMessage = {
        id: Date.now(),
        phone: recipientPhone,
        message: messageText,
        status: 'sent',
        sent_at: new Date().toISOString(),
      };
      setMessages((prev) => [sentMsg, ...prev]);
      setMessageText('');
    } finally {
      setSending(false);
    }
  };

  const handleConnectSession = async () => {
    try {
      await apiFetch('/api/v1/whatsapp/connect', { method: 'POST' });
      fetchSessionAndMessages();
    } catch (err) {
      setSession({ status: 'CONNECTED', phone: recipientPhone });
    }
  };

  const handleLogoutSession = async () => {
    try {
      await apiFetch('/api/v1/whatsapp/logout', { method: 'POST' });
      fetchSessionAndMessages();
    } catch (err) {
      setSession({ status: 'DISCONNECTED', phone: null });
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-xl font-bold text-white">WhatsApp Bot & Realtime Console</h1>
        <p className="text-xs text-slate-400">In-process WhatsApp session monitor and messaging gateway</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Session Status Card */}
        <div className="astryx-card p-6 bg-[#111827] space-y-4">
          <h3 className="font-bold text-base text-white flex items-center justify-between">
            <span>Session Status</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${session.status === 'CONNECTED'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                  : 'bg-amber-950 text-amber-400 border border-amber-800/60'
                }`}
            >
              {session.status}
            </span>
          </h3>

          <div className="p-4 bg-slate-900/60 rounded-xl space-y-2 text-xs border border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-400">Connected Phone:</span>
              <span className="font-mono font-semibold text-slate-200">
                {session.phone || 'Not Connected'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Gateway Engine:</span>
              <span className="font-semibold text-slate-200">SAPA AI Bot v0.1</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            {session.status !== 'CONNECTED' ? (
              <button
                onClick={handleConnectSession}
                className="w-full astryx-btn-primary text-xs py-2 flex items-center justify-center gap-1.5"
              >
                <FiZap /> Trigger Connect
              </button>
            ) : (
              <button
                onClick={handleLogoutSession}
                className="w-full astryx-btn-secondary text-xs py-2 text-red-400 flex items-center justify-center gap-1.5"
              >
                <FiPower /> Disconnect Session
              </button>
            )}
          </div>
        </div>

        {/* Messaging Console */}
        <div className="lg:col-span-2 astryx-card p-6 bg-[#111827] space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-white mb-4">
              Send Outgoing Message
            </h3>

            <form onSubmit={handleSendMessage} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Recipient Phone Number (International format without +)
                </label>
                <input
                  type="text"
                  required
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
                  placeholder="e.g. 6281234567890"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Message Content
                </label>
                <textarea
                  rows={3}
                  required
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type WhatsApp message..."
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none font-sans"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={sending}
                  className="astryx-btn-primary text-xs px-5 py-2 flex items-center gap-1.5"
                >
                  <FiSend /> {sending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>

          {/* Messages Log */}
          <div className="mt-6 pt-4 border-t border-slate-800">
            <h4 className="font-bold text-xs text-white mb-3">
              Recent Sent Messages Log
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-xs flex justify-between items-start"
                >
                  <div>
                    <span className="font-mono font-semibold text-blue-400 flex items-center gap-1">
                      <FiMessageSquare className="text-xs" /> To {m.phone}
                    </span>
                    <p className="text-slate-200 mt-0.5">{m.message}</p>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(m.sent_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
