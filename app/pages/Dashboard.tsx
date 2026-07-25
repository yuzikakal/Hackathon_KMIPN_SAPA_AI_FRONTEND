'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { ModuleType, Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { DashboardModule } from '../components/modules/Dashboard/DashboardModule';
import { UsersModule } from '../components/modules/Users/UsersModule';
import { CompaniesModule } from '../components/modules/Companies/CompaniesModule';
import { ContactsModule } from '../components/modules/Contacts/ContactsModule';
import { DealsModule } from '../components/modules/Deals/DealsModule';
import { ActivitiesModule } from '../components/modules/Activities/ActivitiesModule';
import { NotesModule } from '../components/modules/Notes/NotesModule';
import { ProductsQuotesModule } from '../components/modules/Quotes/ProductsQuotesModule';
import { TicketsModule } from '../components/modules/Tickets/TicketsModule';
import { CampaignsModule } from '../components/modules/Campaigns/CampaignsModule';
import { TagsModule } from '../components/modules/Tags/TagsModule';
import { WhatsAppModule } from '../components/modules/WhatsApp/WhatsAppModule';

const MODULE_STORAGE_KEY = 'sapaai_active_module';

const isValidModule = (v: string | null): v is ModuleType =>
    v !== null && ['dashboard', 'users', 'companies', 'contacts', 'deals', 'activities', 'notes', 'products', 'quotes', 'tickets', 'campaigns', 'tags', 'whatsapp'].includes(v);

export default function DashboardPage() {
    const { user, token, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const [activeModule, setActiveModule] = useState<ModuleType>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(MODULE_STORAGE_KEY);
            if (isValidModule(saved)) return saved;
        }
        return 'dashboard';
    });

    const handleSetModule = (mod: ModuleType) => {
        setActiveModule(mod);
        localStorage.setItem(MODULE_STORAGE_KEY, mod);
    };

    useEffect(() => {
        if (!isLoading && (!isAuthenticated || !token)) {
            router.replace('/login');
        }
    }, [isLoading, isAuthenticated, token, router]);

    if (isLoading || !isAuthenticated || !token) {
        return (
            <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center space-y-4 font-sans text-slate-200">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium text-slate-400">Verifying authentication...</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#090d16] text-slate-100 overflow-hidden font-sans">
            {/* Sidebar */}
            <Sidebar activeModule={activeModule} setActiveModule={handleSetModule} />

            {/* Main Workspace */}
            <div
                className={`flex min-w-0 flex-1 flex-col bg-[#090d16] ${activeModule === 'deals'
                    ? 'overflow-y-auto lg:overflow-hidden'
                    : 'overflow-y-auto'
                    }`}
            >
                <Header title={activeModule.replace('_', ' ')} />

                <main
                    data-testid="dashboard-main"
                    className={`mx-auto w-full flex-1 bg-[#090d16] ${activeModule === 'deals'
                        ? 'min-h-0 max-w-[1600px] p-3 md:p-4 lg:overflow-hidden'
                        : 'max-w-7xl p-6 md:p-8'
                        }`}
                >
                    <div className={activeModule === 'dashboard' ? 'block' : 'hidden'}>
                        <DashboardModule />
                    </div>
                    {user?.role === 'admin' && (
                        <div className={activeModule === 'users' ? 'block' : 'hidden'}>
                            <UsersModule />
                        </div>
                    )}
                    <div className={activeModule === 'companies' ? 'block' : 'hidden'}>
                        <CompaniesModule />
                    </div>
                    <div className={activeModule === 'contacts' ? 'block' : 'hidden'}>
                        <ContactsModule />
                    </div>
                    <div className={activeModule === 'deals' ? 'h-full min-h-0' : 'hidden'}>
                        <DealsModule />
                    </div>
                    <div className={activeModule === 'activities' ? 'block' : 'hidden'}>
                        <ActivitiesModule />
                    </div>
                    <div className={activeModule === 'notes' ? 'block' : 'hidden'}>
                        <NotesModule />
                    </div>
                    <div className={activeModule === 'products' || activeModule === 'quotes' ? 'block' : 'hidden'}>
                        <ProductsQuotesModule />
                    </div>
                    <div className={activeModule === 'tickets' ? 'block' : 'hidden'}>
                        <TicketsModule />
                    </div>
                    <div className={activeModule === 'campaigns' ? 'block' : 'hidden'}>
                        <CampaignsModule />
                    </div>
                    <div className={activeModule === 'tags' ? 'block' : 'hidden'}>
                        <TagsModule />
                    </div>
                    <div className={activeModule === 'whatsapp' ? 'block' : 'hidden'}>
                        <WhatsAppModule />
                    </div>
                </main>
            </div>
        </div>
    );
}
