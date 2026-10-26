import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { PinLoginModal } from './components/PinLoginModal';
import { PosScreen } from './features/pos/PosScreen';
import { ProductCatalog } from './features/products/ProductCatalog';
import { KhataScreen } from './features/khata/KhataScreen';
import { DashboardScreen } from './features/dashboard/DashboardScreen';
import { SettingsScreen } from './features/settings/SettingsScreen';
import { DayBookScreen } from './features/daybook/DayBookScreen';
import { CashBankScreen } from './features/cashbank/CashBankScreen';
import { BalanceSheetScreen } from './features/balancesheet/BalanceSheetScreen';
import { EstimatesScreen } from './features/estimates/EstimatesScreen';
import { PurchaseOrdersScreen } from './features/purchaseorders/PurchaseOrdersScreen';
import { DeliveryChallansScreen } from './features/challans/DeliveryChallansScreen';
import { GstReportsScreen } from './features/gst/GstReportsScreen';
import { LoyaltyRewardsScreen } from './features/loyalty/LoyaltyRewardsScreen';
import { ActivityLogScreen } from './features/audit/ActivityLogScreen';
import { ExportCenterScreen } from './features/export/ExportCenterScreen';
import { LuxuryStudioModal } from './components/LuxuryStudioModal';
import { Sparkles } from 'lucide-react';

const MainLayout: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [toolModalTrigger, setToolModalTrigger] = useState<string | null>(null);
  const { isLocked, activeTheme, setActiveTheme, setIsLuxuryStudioOpen, t } = useApp();

  const handleOpenTool = (toolId: string) => {
    setCurrentTab('dashboard');
    setToolModalTrigger(toolId);
  };

  // Intercept Global Function Keys (F1-F12) to prevent default browser behavior
  // (F1: Windows Help, F3: Browser Find, F5: Page Reload, F6: Address bar, F7: Caret browsing, F11: Fullscreen, F12: DevTools)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Global navigation hotkeys when NOT inside an active typing text input (unless specific hotkey)
      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if (e.key === 'F5') {
        // Prevent accidental page reload during busy Kirana store operations!
        e.preventDefault();
        if (currentTab !== 'pos') {
          setCurrentTab('settings');
        }
        return;
      }

      if (e.key === 'F1' && !isInput) {
        // If outside POS or if alt/shift, navigate. Inside POS, F1 handles Cash Sale.
        // We allow custom POS handler to run if tab is POS.
      } else if (e.key === 'F11') {
        // Allow fullscreen or toggle kiosk mode
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <div className="relative min-h-screen bg-paper text-ink flex selection:bg-copper-600 selection:text-paper overflow-hidden font-sans">
      {/* Left navigation */}
      <div className="relative z-10">
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          onOpenToolModal={handleOpenTool}
        />
      </div>

      {/* Main viewport */}
      <main className="relative z-10 flex-1 min-w-0 h-screen overflow-y-auto bg-paper flex flex-col">
        {/* Sticky Luxury Brand & Theme Control Bar */}
        <div className="sticky top-0 z-20 px-6 py-2 bg-paper/90 backdrop-blur-md border-b border-line/60 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2.5 text-xs text-ink-soft">
            <span className="w-2 h-2 rounded-full bg-copper" />
            <span className="font-semibold text-ink text-xs tracking-tight">
              {activeTheme === 'organic-forest' 
                ? t('ఆర్గానిక్ ఫారెస్ట్ పాలెట్', 'Organic Forest Palette')
                : activeTheme === 'obsidian-chic'
                ? t('మయామి నైట్స్ పాలెట్ (Miami Nights)', 'Miami Nights Palette')
                : t('రాయల్ గోల్డ్ పాలెట్', 'Royal Gold Palette')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* 3 Live Theme Pills */}
            <div className="flex items-center bg-paper-raised border border-line rounded-lg p-0.5 shadow-xs">
              <button
                onClick={() => setActiveTheme('obsidian-chic')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeTheme === 'obsidian-chic'
                    ? 'bg-copper text-white shadow-xs'
                    : 'text-ink-soft hover:text-ink hover:bg-paper-deep/50'
                }`}
                title="Miami Nights (60-30-10 Reference Palette)"
                data-testid="theme-btn-obsidian-chic"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#0F4953] border border-[#F98E6E]" />
                <span className="font-semibold">{t('మయామి నైట్స్', 'Miami Nights')}</span>
              </button>

              <button
                onClick={() => setActiveTheme('organic-forest')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeTheme === 'organic-forest'
                    ? 'bg-copper text-white shadow-xs'
                    : 'text-ink-soft hover:text-ink hover:bg-paper-deep/50'
                }`}
                title="Organic Forest & Earth Ochre"
                data-testid="theme-btn-organic-forest"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#1B3629] border border-white/40" />
                <span className="hidden sm:inline">{t('ఆర్గానిక్', 'Organic')}</span>
              </button>

              <button
                onClick={() => setActiveTheme('sovereign-gold')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeTheme === 'sovereign-gold'
                    ? 'bg-copper text-white shadow-xs'
                    : 'text-ink-soft hover:text-ink hover:bg-paper-deep/50'
                }`}
                title="Royal Emerald & Sovereign Gold"
                data-testid="theme-btn-sovereign-gold"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] border border-white/40" />
                <span className="hidden sm:inline">{t('రాయల్ గోల్డ్', 'Royal')}</span>
              </button>
            </div>

            {/* Studio Trigger Button */}
            <button
              onClick={() => setIsLuxuryStudioOpen(true)}
              className="px-3 py-1 rounded-lg bg-copper/10 hover:bg-copper/20 border border-copper/30 text-xs font-medium text-copper flex items-center gap-1.5 shadow-xs active:scale-[0.98] transition-all"
              title="Open Luxury Brand & Palette Studio"
              data-testid="top-btn-luxury-studio"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('లగ్జరీ స్టూడియో', 'Studio')}</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-h-0">
          {currentTab === 'dashboard' && (
            <DashboardScreen 
              onNavigate={setCurrentTab} 
              externalToolModal={toolModalTrigger}
              onCloseExternalTool={() => setToolModalTrigger(null)}
            />
          )}
          {currentTab === 'pos' && <PosScreen />}
          {currentTab === 'products' && <ProductCatalog />}
          {currentTab === 'khata' && <KhataScreen />}
          {currentTab === 'daybook' && <DayBookScreen />}
          {currentTab === 'cashbank' && <CashBankScreen />}
          {currentTab === 'balancesheet' && <BalanceSheetScreen />}
          {currentTab === 'estimates' && <EstimatesScreen />}
          {currentTab === 'purchaseorders' && <PurchaseOrdersScreen />}
          {currentTab === 'challans' && <DeliveryChallansScreen />}
          {currentTab === 'gst' && <GstReportsScreen />}
          {currentTab === 'loyalty' && <LoyaltyRewardsScreen />}
          {currentTab === 'audit' && <ActivityLogScreen />}
          {currentTab === 'export' && <ExportCenterScreen />}
          {currentTab === 'settings' && <SettingsScreen />}
        </div>
      </main>

      {/* Luxury Brand & Palette Studio Modal */}
      <LuxuryStudioModal />

      {/* Lock Screen PIN Modal */}
      {isLocked && <PinLoginModal />}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
};

export default App;
