"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  FiGrid,
  FiBriefcase,
  FiUsers,
  FiTrendingUp,
  FiCalendar,
  FiFileText,
  FiPackage,
  FiTag,
  FiMessageSquare,
  FiShield,
  FiMenu,
} from "react-icons/fi";

export type ModuleType =
  | "dashboard"
  | "users"
  | "companies"
  | "contacts"
  | "deals"
  | "activities"
  | "notes"
  | "products"
  | "quotes"
  | "tickets"
  | "campaigns"
  | "tags"
  | "whatsapp";

interface SidebarProps {
  activeModule: ModuleType;
  setActiveModule: (module: ModuleType) => void;
  unreadCount?: number;
}

const SIDEBAR_STORAGE_KEY = "sapaai_sidebar_collapsed";

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  setActiveModule,
  unreadCount = 0,
}) => {
  const { user } = useAuth();

  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
    setIsCollapsed(saved);
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  };

  const isAdmin = user?.role === "admin";

  const menuItems: {
    id: ModuleType;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }[] = [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: <FiGrid size={18} />,
      },
      ...(isAdmin
        ? [
          {
            id: "users" as ModuleType,
            label: "User Management",
            icon: <FiShield size={18} />,
          },
        ]
        : []),
      {
        id: "companies",
        label: "Companies",
        icon: <FiBriefcase size={18} />,
      },
      {
        id: "contacts",
        label: "Contacts",
        icon: <FiUsers size={18} />,
      },
      {
        id: "deals",
        label: "Deals & Pipeline",
        icon: <FiTrendingUp size={18} />,
      },
      {
        id: "activities",
        label: "Activities",
        icon: <FiCalendar size={18} />,
      },
      {
        id: "notes",
        label: "CRM Notes",
        icon: <FiFileText size={18} />,
      },
      {
        id: "products",
        label: "Products, Pricing, & Quotes",
        icon: <FiPackage size={18} />,
      },
      // {
      //   id: "quotes",
      //   label: "Sales Quotes",
      //   icon: <FiCheckSquare size={18} />,
      // },
      // {
      //   id: "tickets",
      //   label: "Support Tickets",
      //   icon: <FiLifeBuoy size={18} />,
      // },
      // {
      //   id: "campaigns",
      //   label: "Campaigns",
      //   icon: <FiSend size={18} />,
      // },
      {
        id: "tags",
        label: "Tags Taxonomy",
        icon: <FiTag size={18} />,
      },
      {
        id: "whatsapp",
        label: "WhatsApp Bot",
        icon: <FiMessageSquare size={18} />,
        badge: unreadCount,
      },
    ];

  return (
    <aside
      className={`relative h-screen sticky top-0 bg-[#0d1322] border-r border-slate-800/80 flex flex-col z-20 overflow-hidden transition-[width] duration-300 ease-in-out ${isCollapsed ? "w-20" : "w-full lg:w-64"}`}
    >
      {/* Header */}
      <div className="h-16 border-b border-slate-800 flex items-center px-3">
        <button
          onClick={toggleCollapse}
          className="w-14 h-9 rounded-lg flex items-center justify-center text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-200 shrink-0"
        >
          <FiMenu size={20} />
        </button>
        <div
          className={`ml-3 overflow-hidden whitespace-nowrap transition-all duration-200 ${isCollapsed ? "opacity-0 w-0 -translate-x-2" : "opacity-100 w-40 translate-x-0 delay-75"}`}
        >
          <h1 className="font-bold text-white">SAPA AI</h1>
          <p className="text-xs text-slate-400">Real-Time CRM Engine</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = activeModule === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`group relative w-full h-11 rounded-xl flex items-center transition-all duration-200 overflow-hidden 
            ${isActive ? "bg-blue-600/15 border border-blue-500/30 text-blue-400" : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-100"}`}
            >
              {/* Icon */}
              <div
                className={`flex items-center justify-center shrink-0 transition-all duration-300 ${isCollapsed ? "w-full" : "w-14"}`}
              >
                {item.icon}
              </div>

              {/* Label */}
              <div
                className={`flex items-center justify-between flex-1 overflow-hidden whitespace-nowrap transition-all duration-200 ${isCollapsed ? "opacity-0 w-0 -translate-x-3" : "opacity-100 w-full translate-x-0 delay-75"}`}
              >
                <span
                  className={`text-sm ${isActive ? "font-semibold" : "font-medium"}`}
                >
                  {item.label}
                </span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="mr-3 min-w-[20px] h-5 px-1.5 rounded-full bg-blue-600 text-white text-[11px] flex items-center justify-center font-semibold">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Active Indicator */}
              <div
                className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 rounded-r-full bg-blue-500 transition-all duration-300 ${isActive ? "w-1 opacity-100" : "w-0 opacity-0"}`}
              />
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-800/80 p-4">
        <div
          className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}
        >
          <div
            className={`overflow-hidden whitespace-nowrap transition-all duration-200 ${isCollapsed ? "opacity-0 w-0 -translate-x-2" : "opacity-100 w-auto translate-x-0 delay-75"}`}
          >
            <p className="text-xs font-medium text-slate-300">SAPA AI v0.1.0</p>
            <p className="text-[11px] text-slate-500 mt-1">
              WebSocket Realtime Sync Active
            </p>
          </div>
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
