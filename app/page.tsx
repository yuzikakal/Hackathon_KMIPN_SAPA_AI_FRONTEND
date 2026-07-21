'use client';

import React, { useState } from 'react';
import { ModuleType, Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { LoginModal } from './components/modules/Auth/LoginModal';
import { DashboardModule } from './components/modules/Dashboard/DashboardModule';
import { CompaniesModule } from './components/modules/Companies/CompaniesModule';
import { ContactsModule } from './components/modules/Contacts/ContactsModule';
import { DealsModule } from './components/modules/Deals/DealsModule';
import { ActivitiesModule } from './components/modules/Activities/ActivitiesModule';
import { NotesModule } from './components/modules/Notes/NotesModule';
import { ProductsQuotesModule } from './components/modules/Quotes/ProductsQuotesModule';
import { TicketsModule } from './components/modules/Tickets/TicketsModule';
import { CampaignsModule } from './components/modules/Campaigns/CampaignsModule';
import { TagsModule } from './components/modules/Tags/TagsModule';
import { WhatsAppModule } from './components/modules/WhatsApp/WhatsAppModule';

export default function Home() {
  const [activeModule, setActiveModule] = useState<ModuleType>('dashboard');
  const [showLoginModal, setShowLoginModal] = useState(false);

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <DashboardModule />;
      case 'companies':
        return <CompaniesModule />;
      case 'contacts':
        return <ContactsModule />;
      case 'deals':
        return <DealsModule />;
      case 'activities':
        return <ActivitiesModule />;
      case 'notes':
        return <NotesModule />;
      case 'products':
      case 'quotes':
        return <ProductsQuotesModule />;
      case 'tickets':
        return <TicketsModule />;
      case 'campaigns':
        return <CampaignsModule />;
      case 'tags':
        return <TagsModule />;
      case 'whatsapp':
        return <WhatsAppModule />;
      default:
        return <DashboardModule />;
    }
  };

  return (
    <div className="flex h-screen bg-[#090d16] text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar activeModule={activeModule} setActiveModule={setActiveModule} />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#090d16]">
        <Header
          onOpenLogin={() => setShowLoginModal(true)}
          title={activeModule.replace('_', ' ')}
        />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto bg-[#090d16]">
          {renderModule()}
        </main>
      </div>

      {/* Authentication Modal */}
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
}
