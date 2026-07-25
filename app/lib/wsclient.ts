import { RealtimeEvent } from '../types';
import { getApiBaseUrl } from './api';

type EventListener = (event: RealtimeEvent) => void;
type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export function getWebSocketUrl(token: string): string {
    const configuredUrl = process.env.NEXT_PUBLIC_WS_URL;
    const endpoint = configuredUrl || `${getApiBaseUrl()}/api/v1/ws`;
    const url = new URL(endpoint);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.searchParams.set('token', token);
    return url.toString();
}

function isRealtimeEvent(payload: unknown): payload is RealtimeEvent {
    if (!payload || typeof payload !== 'object') return false;
    const event = payload as Partial<RealtimeEvent>;
    return event.event === 'change'
        && typeof event.entity === 'string'
        && ['created', 'updated', 'deleted'].includes(event.action || '');
}

class RealtimeWSClient {
    private socket: WebSocket | null = null;
    private listeners: Set<EventListener> = new Set();
    private isConnecting = false;
    private reconnectTimer: NodeJS.Timeout | null = null;
    private token: string | null = null;
    private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
    public currentStatus: ConnectionStatus = 'disconnected';

    public connect(token: string) {
        if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
            return;
        }

        this.token = token;
        this.setStatus('connecting');

        try {
            this.socket = new WebSocket(getWebSocketUrl(token));

            this.socket.onopen = () => {
                console.log('[WebSocket] Real-time CRUD connected');
                this.setStatus('connected');
                if (this.reconnectTimer) {
                    clearTimeout(this.reconnectTimer);
                    this.reconnectTimer = null;
                }
            };

            this.socket.onmessage = (event) => {
                try {
                    const payload: unknown = JSON.parse(event.data);
                    if (isRealtimeEvent(payload)) {
                        this.notifyListeners(payload);
                    }
                } catch {
                    console.warn('[WebSocket] Invalid message JSON:', event.data);
                }
            };

            this.socket.onclose = () => {
                console.log('[WebSocket] Connection closed. Attempting reconnect...');
                this.setStatus('disconnected');
                this.socket = null;
                this.scheduleReconnect();
            };

            this.socket.onerror = (error) => {
                console.error('[WebSocket] Error encountered:', error);
                this.setStatus('disconnected');
            };
        } catch (e) {
            console.error('[WebSocket] Failed to instantiate WebSocket:', e);
            this.setStatus('disconnected');
            this.scheduleReconnect();
        }
    }

    public disconnect() {
        this.token = null;
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.setStatus('disconnected');
    }

    public subscribe(listener: EventListener): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    public onStatusChange(listener: (status: ConnectionStatus) => void): () => void {
        this.statusListeners.add(listener);
        listener(this.currentStatus);
        return () => {
            this.statusListeners.delete(listener);
        };
    }

    private setStatus(status: ConnectionStatus) {
        this.currentStatus = status;
        this.statusListeners.forEach((fn) => fn(status));
    }

    private notifyListeners(event: RealtimeEvent) {
        this.listeners.forEach((fn) => fn(event));
    }

    private scheduleReconnect() {
        if (!this.token || this.reconnectTimer) return;
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            if (this.token) {
                this.connect(this.token);
            }
        }, 5000);
    }
}

export const wsClient = new RealtimeWSClient();
