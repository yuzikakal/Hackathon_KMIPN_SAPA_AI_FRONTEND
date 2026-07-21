import { RealtimeEvent } from '../types';

type EventListener = (event: RealtimeEvent) => void;

class RealtimeWSClient {
    private socket: WebSocket | null = null;
    private listeners: Set<EventListener> = new Set();
    private isConnecting = false;
    private reconnectTimer: NodeJS.Timeout | null = null;
    private token: string | null = null;
    private statusListeners: Set<(status: 'connected' | 'connecting' | 'disconnected') => void> = new Set();
    public currentStatus: 'connected' | 'connecting' | 'disconnected' = 'disconnected';

    public connect(token: string) {
        if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
            return;
        }

        this.token = token;
        this.setStatus('connecting');

        const host = typeof window !== 'undefined'
            ? (process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5790/api/v1/ws')
            : 'ws://localhost:5790/api/v1/ws';

        const wsUrl = `${host}?token=${encodeURIComponent(token)}`;

        try {
            this.socket = new WebSocket(wsUrl);

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
                    const payload: RealtimeEvent = JSON.parse(event.data);
                    if (payload && payload.event === 'change') {
                        this.notifyListeners(payload);
                    }
                } catch (err) {
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

    public onStatusChange(listener: (status: 'connected' | 'connecting' | 'disconnected') => void): () => void {
        this.statusListeners.add(listener);
        listener(this.currentStatus);
        return () => {
            this.statusListeners.delete(listener);
        };
    }

    private setStatus(status: 'connected' | 'connecting' | 'disconnected') {
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
