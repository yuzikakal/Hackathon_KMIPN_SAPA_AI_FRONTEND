'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  FiGrid,
  FiBriefcase,
  FiUsers,
  FiTrendingUp,
  FiCalendar,
  FiFileText,
  FiPackage,
  FiCheckSquare,
  FiLifeBuoy,
  FiSend,
  FiTag,
  FiMessageSquare,
  FiShield,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';

export type ModuleType =
  | 'dashboard'
  | 'users'
  | 'companies'
  | 'contacts'
  | 'deals'
  | 'activities'
  | 'notes'
  | 'products'
  | 'quotes'
  | 'tickets'
  | 'campaigns'
  | 'tags'
  | 'whatsapp';

interface SidebarProps {
  activeModule: ModuleType;
  setActiveModule: (module: ModuleType) => void;
  unreadCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  setActiveModule,
  unreadCount = 0,
}) => {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isAdmin = user?.role === 'admin';

  const menuItems: { id: ModuleType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <FiGrid className="text-lg" /> },
    ...(isAdmin
      ? [
        {
          id: 'users' as ModuleType,
          label: 'User Management',
          icon: <FiShield className="text-lg" />,
        },
      ]
      : []),
    { id: 'companies', label: 'Companies', icon: <FiBriefcase className="text-lg" /> },
    { id: 'contacts', label: 'Contacts', icon: <FiUsers className="text-lg" /> },
    { id: 'deals', label: 'Deals & Pipeline', icon: <FiTrendingUp className="text-lg" /> },
    { id: 'activities', label: 'Activities', icon: <FiCalendar className="text-lg" /> },
    { id: 'notes', label: 'CRM Notes', icon: <FiFileText className="text-lg" /> },
    { id: 'products', label: 'Products & Pricing', icon: <FiPackage className="text-lg" /> },
    { id: 'quotes', label: 'Sales Quotes', icon: <FiCheckSquare className="text-lg" /> },
    { id: 'tickets', label: 'Support Tickets', icon: <FiLifeBuoy className="text-lg" /> },
    { id: 'campaigns', label: 'Campaigns', icon: <FiSend className="text-lg" /> },
    { id: 'tags', label: 'Tags Taxonomy', icon: <FiTag className="text-lg" /> },
    { id: 'whatsapp', label: 'WhatsApp Bot', icon: <FiMessageSquare className="text-lg" /> },
  ];

  return (
    <aside
      className={`relative bg-[#0d1322] border-r border-slate-800/80 flex flex-col h-screen sticky top-0 z-20 font-sans transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'
        }`}
    >
      {/* Floating Toggle Button on Border */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3.5 top-5 w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg border border-slate-700 flex items-center justify-center text-xs z-30 transition-transform duration-200 active:scale-95 focus:outline-none"
        title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      >
        {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
      </button>

      {/* Brand Header */}
      <div className={`p-4 border-b border-slate-800/80 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 min-w-[36px] rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/20">
            S
          </div>
          {!isCollapsed && (
            <div className="transition-opacity duration-200">
              <h1 className="font-bold text-lg leading-tight tracking-tight text-white">
                SAPA AI
              </h1>
              <span className="text-[11px] font-medium text-slate-400 block">
                Real-Time CRM Engine
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
        {menuItems.map((item) => {
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2 py-3' : 'justify-between px-3 py-2.5'
                } rounded-xl text-sm font-medium transition-all ${isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold shadow-xs'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
            >
              <div className="flex items-center gap-3.5">
                <span className={isActive ? 'text-blue-400' : 'text-slate-400'}>
                  {item.icon}
                </span>
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </div>
              {!isCollapsed && item.badge && item.badge > 0 ? (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-600 text-white">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 bg-[#0d1322] text-xs text-slate-400 flex flex-col gap-1">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && <span className="font-medium text-slate-300">SAPA AI v0.1.0</span>}
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>
        {!isCollapsed && (
          <p className="text-[11px] text-slate-500">WebSocket Realtime Sync Active</p>
        )}
      </div>
    </aside>
  );
};
