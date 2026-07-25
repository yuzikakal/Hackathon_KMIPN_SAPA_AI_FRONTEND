'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { wsClient } from '../lib/wsclient';
import { RealtimeEntity, RealtimeEvent } from '../types';
import { useAuth } from './AuthContext';

interface RealtimeContextType {
  wsStatus: 'connected' | 'connecting' | 'disconnected';
  subscribe: (listener: (event: RealtimeEvent) => void) => () => void;
  subscribeEntity: (
    entity: RealtimeEvent['entity'],
    callback: (event: RealtimeEvent) => void
  ) => () => void;
}

const RealtimeContext = createContext<RealtimeContextType>({
  wsStatus: 'disconnected',
  subscribe: () => () => { },
  subscribeEntity: () => () => { },
});

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [wsStatus, setWsStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const entityListenersRef = useRef(
    new Map<RealtimeEntity, Set<(event: RealtimeEvent) => void>>()
  );
  const previousStatusRef = useRef(wsStatus);
  const resyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isAuthenticated && token) {
      wsClient.connect(token);
    } else {
      wsClient.disconnect();
    }

    const unsubscribeStatus = wsClient.onStatusChange((status) => {
      setWsStatus(status);
    });

    return () => {
      unsubscribeStatus();
    };
  }, [isAuthenticated, token]);

  const subscribe = useCallback((listener: (event: RealtimeEvent) => void) => {
    return wsClient.subscribe(listener);
  }, []);

  const subscribeEntity = useCallback((
    entity: RealtimeEvent['entity'],
    callback: (event: RealtimeEvent) => void
  ) => {
    const listeners = entityListenersRef.current.get(entity) || new Set();
    listeners.add(callback);
    entityListenersRef.current.set(entity, listeners);

    const unsubscribeSocket = wsClient.subscribe((event) => {
      if (event.entity === entity) {
        callback(event);
      }
    });

    return () => {
      unsubscribeSocket();
      const currentListeners = entityListenersRef.current.get(entity);
      currentListeners?.delete(callback);
      if (currentListeners?.size === 0) {
        entityListenersRef.current.delete(entity);
      }
    };
  }, []);

  const resyncSubscribedEntities = useCallback(() => {
    const callbacks = new Map<(event: RealtimeEvent) => void, RealtimeEntity>();
    entityListenersRef.current.forEach((listeners, entity) => {
      listeners.forEach((listener) => {
        if (!callbacks.has(listener)) callbacks.set(listener, entity);
      });
    });

    callbacks.forEach((listenerEntity, listener) => {
      const event: RealtimeEvent = {
        event: 'change',
        entity: listenerEntity,
        action: 'updated',
        timestamp: new Date().toISOString(),
      };
      listener(event);
    });
  }, []);

  const scheduleResync = useCallback(() => {
    if (resyncTimerRef.current) clearTimeout(resyncTimerRef.current);
    resyncTimerRef.current = setTimeout(() => {
      resyncTimerRef.current = null;
      resyncSubscribedEntities();
    }, 100);
  }, [resyncSubscribedEntities]);

  useEffect(() => {
    const justConnected =
      wsStatus === 'connected' && previousStatusRef.current !== 'connected';
    previousStatusRef.current = wsStatus;
    if (justConnected) {
      scheduleResync();
    }
  }, [scheduleResync, wsStatus]);

  useEffect(() => {
    const resyncWhenActive = () => {
      if (document.visibilityState === 'visible' && wsClient.currentStatus === 'connected') {
        scheduleResync();
      }
    };
    window.addEventListener('focus', resyncWhenActive);
    document.addEventListener('visibilitychange', resyncWhenActive);
    return () => {
      window.removeEventListener('focus', resyncWhenActive);
      document.removeEventListener('visibilitychange', resyncWhenActive);
      if (resyncTimerRef.current) {
        clearTimeout(resyncTimerRef.current);
        resyncTimerRef.current = null;
      }
    };
  }, [scheduleResync]);

  return (
    <RealtimeContext.Provider value={{ wsStatus, subscribe, subscribeEntity }}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => useContext(RealtimeContext);
