import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { PinLoginModal } from './components/PinLoginModal';
import { FullLandingPage } from './components/FullLandingPage';
import { StoreOnboardingModal } from './components/StoreOnboardingModal';
import { GuidedDemoTourModal } from './components/GuidedDemoTourModal';
import { GraduationCap } from 'lucide-react';

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

const MainLayout: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [toolModalTrigger, setToolModalTrigger] = useState<string | null>(null);
  const [showGuidedTour, setShowGuidedTour] = useState<boolean>(false);
  const { 
    isLocked, 
    showOnboardingModal, 
    setShowOnboardingModal,
    showGatewayModal,
    setShowGatewayModal,
    t
  } = useApp();

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
    <div className="relative min-h-screen bg-white text-slate-900 flex selection:bg-[#2563EB] selection:text-white overflow-hidden font-sans">
      {/* Left navigation */}
      <div className="relative z-10">
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          onOpenToolModal={handleOpenTool}
        />
      </div>

      {/* Main viewport */}
      <main className="relative z-10 flex-1 min-w-0 h-screen overflow-y-auto bg-white flex flex-col">
        {/* Floating Top Tour Pill */}
        <div className="absolute top-3 right-4 z-20 hidden md:flex items-center gap-2">
          <button
            type="button"
            data-testid="header-open-tour-btn"
            onClick={() => setShowGuidedTour(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-950 text-white text-[11px] font-bold shadow-md backdrop-blur-sm border border-slate-700/60 transition active:scale-95"
          >
            <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('🎓 డెమో టూర్ / ఎలా ఉపయోగించాలి?', '🎓 Guided Tour / How to Use')}</span>
          </button>
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

      {/* Full-Screen Landing Page & Multi-Store Terminal Gateway */}
      {showGatewayModal && !showOnboardingModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
          <FullLandingPage onClose={() => setShowGatewayModal(false)} />
        </div>
      )}

      {/* Store Onboarding Wizard Modal */}
      {showOnboardingModal && (
        <StoreOnboardingModal onClose={() => setShowOnboardingModal(false)} />
      )}



      {/* Lock Screen PIN Modal */}
      {isLocked && <PinLoginModal />}

      {/* Guided Interactive Demo Tour Modal */}
      <GuidedDemoTourModal
        isOpen={showGuidedTour}
        onClose={() => setShowGuidedTour(false)}
        onNavigateTab={(tab) => {
          setCurrentTab(tab);
          setShowGuidedTour(false);
        }}
      />
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
