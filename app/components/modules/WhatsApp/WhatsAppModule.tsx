'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { QRCode } from 'react-qr-code';
import { useRealtime } from '../../../context/RealtimeContext';
import { apiFetch, apiUpload, resolveApiAssetUrl } from '../../../lib/api';
import { WhatsAppMessage, WhatsAppSession } from '../../../types';
import {
  FiAlertCircle,
  FiMessageSquare,
  FiPaperclip,
  FiPower,
  FiRefreshCw,
  FiSend,
  FiX,
  FiZap,
} from 'react-icons/fi';

interface WhatsAppStatusResponse extends WhatsAppSession {
  wa_status?: string;
  sender_number?: string | null;
  wa_qr?: string | null;
}

const getErrorMessage = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

const normalizeStatus = (status?: string) => status?.toLowerCase();
const isConnected = (status?: string) => normalizeStatus(status) === 'connected';
const isPairing = (status?: string) => normalizeStatus(status) === 'pairing';

export const WhatsAppModule: React.FC = () => {
  const { subscribeEntity } = useRealtime();

  const [session, setSession] = useState<WhatsAppSession | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [recipientPhone, setRecipientPhone] = useState('');
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaName, setMediaName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchSession = useCallback(async () => {
    try {
      const data = await apiFetch<WhatsAppStatusResponse>('/api/v1/whatsapp/status');
      setSession({
        status: (data.wa_status || 'disconnected').toUpperCase(),
        phone: data.sender_number || null,
      });
      setError(null);
    } catch (err) {
      // No session row means the device is disconnected — do not treat it as a fatal error.
      const message = getErrorMessage(err, '');
      if (message.toLowerCase().includes('not found')) {
        setSession({ status: 'DISCONNECTED', phone: null });
        setError(null);
      } else {
        setError(message || 'Unable to reach the WhatsApp service. Please make sure the API backend is running.');
      }
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const data = await apiFetch<WhatsAppMessage[]>('/api/v1/whatsapp/messages');
      if (Array.isArray(data)) setMessages(data);
    } catch (err) {
      console.error('WhatsApp messages fetch error:', err);
    }
  }, []);

  const fetchQr = useCallback(async () => {
    if (isConnected(session?.status)) return;
    try {
      const data = await apiFetch<string | null>('/api/v1/whatsapp/qr');
      setQr(data);
    } catch (err) {
      console.error('WhatsApp QR fetch error:', err);
    }
  }, [session?.status]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchSession(), fetchMessages()]);
    setLoading(false);
  }, [fetchSession, fetchMessages]);

  useEffect(() => {
    loadAll();
    fetchQr();
    const unsubSession = subscribeEntity('whatsapp_session', () => {
      fetchSession();
      fetchQr();
    });
    const unsubMsg = subscribeEntity('whatsapp_message', () => fetchMessages());
    return () => {
      unsubSession();
      unsubMsg();
    };
  }, [loadAll, fetchSession, fetchMessages, fetchQr, subscribeEntity]);

  const handleConnectSession = async () => {
    setConnecting(true);
    setError(null);
    try {
      await apiFetch('/api/v1/whatsapp/connect', { method: 'POST' });
      await fetchSession();
      await fetchQr();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to start WhatsApp pairing. Please make sure the API backend is running.'));
    } finally {
      setConnecting(false);
    }
  };

  const handleLogoutSession = async () => {
    setConnecting(true);
    setError(null);
    try {
      await apiFetch('/api/v1/whatsapp/logout', { method: 'POST' });
      setQr(null);
      await fetchSession();
      await fetchMessages();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to disconnect WhatsApp session.'));
    } finally {
      setConnecting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !recipientPhone.trim()) return;

    if (!isConnected(session?.status)) {
      setError('WhatsApp is not connected. Please scan the QR code first.');
      return;
    }

    setSending(true);
    setError(null);
    try {
      await apiFetch('/api/v1/whatsapp/send', {
        method: 'POST',
        body: JSON.stringify({
          phone: recipientPhone,
          message: messageText,
          media_url: mediaUrl,
        }),
      });
      await fetchMessages();
      setMessageText('');
      setMediaUrl(null);
      setMediaName(null);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to send message. Please check the backend server.'));
    } finally {
      setSending(false);
    }
  };

  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const upload = await apiUpload(file);
      setMediaUrl(upload.url);
      setMediaName(upload.filename || file.name);
    } catch (uploadError) {
      setError(getErrorMessage(uploadError, 'Could not upload the attachment.'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-100">
      <div>
        <h1 className="text-xl font-bold text-white">WhatsApp Bot & Realtime Console</h1>
        <p className="text-xs text-slate-400">In-process WhatsApp session monitor and messaging gateway</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-950/40 text-red-400 text-xs rounded-lg border border-red-900/50">
          <FiAlertCircle className="mt-0.5 shrink-0" />
          <div className="flex-1">{error}</div>
          <button
            onClick={() => loadAll()}
            className="flex items-center gap-1 hover:text-red-300 shrink-0"
          >
            <FiRefreshCw /> Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Session Status Card */}
        <div className="astryx-card p-6 space-y-4">
          <h3 className="font-bold text-base text-white flex items-center justify-between">
            <span>Session Status</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${isConnected(session?.status)
                ? 'bg-emerald-950 text-emerald-400 border-emerald-800/60'
                : isPairing(session?.status)
                  ? 'bg-amber-950 text-amber-400 border-amber-800/60'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
            >
              {session?.status || 'DISCONNECTED'}
            </span>
          </h3>

          <div className="p-4 bg-slate-900/60 rounded-xl space-y-2 text-xs border border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-400">Connected Phone:</span>
              <span className="font-mono font-semibold text-slate-200">
                {session?.phone || 'Not Connected'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Gateway Engine:</span>
              <span className="font-semibold text-slate-200">SAPA AI Bot v0.1</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            {!isConnected(session?.status) ? (
              <button
                onClick={handleConnectSession}
                disabled={connecting}
                className="w-full astryx-btn-primary text-xs py-2 flex items-center justify-center gap-1.5"
              >
                <FiZap /> {connecting ? 'Connecting...' : 'Trigger Connect'}
              </button>
            ) : (
              <button
                onClick={handleLogoutSession}
                disabled={connecting}
                className="w-full astryx-btn-secondary text-xs py-2 text-red-400 flex items-center justify-center gap-1.5"
              >
                <FiPower /> {connecting ? 'Disconnecting...' : 'Disconnect Session'}
              </button>
            )}
          </div>
        </div>

        {/* Messaging Console */}
        <div style={{ display: "none" }} className="lg:col-span-2 astryx-card p-6 space-y-4 flex flex-col justify-between">
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
                  disabled={!isConnected(session?.status)}
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
                  placeholder={isConnected(session?.status) ? 'Type WhatsApp message...' : 'Connect WhatsApp first to send messages'}
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none font-sans"
                  disabled={!isConnected(session?.status)}
                />
              </div>

              <div className="space-y-2">
                <label className="block font-semibold text-slate-300">
                  Optional attachment reference
                </label>
                {mediaUrl ? (
                  <div className="flex items-center justify-between rounded-lg border border-blue-800/50 bg-blue-950/30 px-3 py-2 text-blue-300">
                    <span className="truncate">{mediaName || mediaUrl}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setMediaUrl(null);
                        setMediaName(null);
                      }}
                      className="ml-2 p-1 text-slate-400 hover:text-red-400"
                      aria-label="Remove attachment"
                    >
                      <FiX />
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-700 bg-slate-900/50 px-3 py-2 text-slate-400 hover:border-blue-600 hover:text-blue-300">
                    <FiPaperclip />
                    {uploading ? 'Uploading...' : 'Upload image or document'}
                    <input
                      type="file"
                      onChange={handleMediaUpload}
                      disabled={uploading || !isConnected(session?.status)}
                      className="hidden"
                    />
                  </label>
                )}
                <p className="text-[10px] text-amber-400/80">
                  The current backend logs this URL with the message; its WhatsApp transport still sends text only.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={sending || !isConnected(session?.status)}
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
              {loading && messages.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-500">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-500">No outgoing messages yet.</div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-xs flex justify-between items-start"
                  >
                    <div>
                      <span className="font-mono font-semibold text-blue-400 flex items-center gap-1">
                        <FiMessageSquare className="text-xs" /> To {m.phone}
                      </span>
                      <p className="text-slate-200 mt-0.5">{m.message}</p>
                      {m.media_url && (
                        <a
                          href={resolveApiAssetUrl(m.media_url) || undefined}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-[10px] text-blue-400 hover:underline"
                        >
                          <FiPaperclip /> Open attachment
                        </a>
                      )}
                      {m.error_message && (
                        <p className="text-red-400 mt-0.5">Error: {m.error_message}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {m.sent_at ? new Date(m.sent_at).toLocaleTimeString() : 'Pending'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QR Pairing Panel */}
      {!isConnected(session?.status) && (
        <div className="astryx-card p-6">
          <h3 className="font-bold text-base text-white mb-3 flex items-center gap-2">
            <FiZap className="text-amber-400" /> Pair WhatsApp via QR
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Click <strong>Trigger Connect</strong>, then scan the QR code below with WhatsApp on your phone
            (Settings &gt; Linked Devices &gt; Link a Device). The phone number is no longer pre-filled.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="bg-white p-3 rounded-xl">
              {qr ? (
                <QRCode value={qr} size={192} bgColor="#ffffff" fgColor="#000000" level="M" />
              ) : (
                <div className="w-48 h-48 bg-slate-200 rounded-lg flex items-center justify-center text-slate-500 text-xs text-center p-4">
                  {connecting || isPairing(session?.status)
                    ? 'Waiting for QR code from server...'
                    : 'Click Trigger Connect to generate a QR code'}
                </div>
              )}
            </div>
            <div className="space-y-2 text-xs text-slate-400 max-w-sm">
              <p>1. Make sure the API backend is running.</p>
              <p>2. Press <strong>Trigger Connect</strong> to start a pairing session.</p>
              <p>3. Open WhatsApp on your phone and scan the displayed QR code.</p>
              <p>4. The status will update automatically once connected.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
