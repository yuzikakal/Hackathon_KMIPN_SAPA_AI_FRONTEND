'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { wsClient } from '../lib/wsclient';
import { RealtimeEvent } from '../types';
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

  const subscribe = (listener: (event: RealtimeEvent) => void) => {
    return wsClient.subscribe(listener);
  };

  const subscribeEntity = (
    entity: RealtimeEvent['entity'],
    callback: (event: RealtimeEvent) => void
  ) => {
    return wsClient.subscribe((event) => {
      if (event.entity === entity) {
        callback(event);
      }
    });
  };

  return (
    <RealtimeContext.Provider value={{ wsStatus, subscribe, subscribeEntity }}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => useContext(RealtimeContext);
