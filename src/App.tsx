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

const MainLayout: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [toolModalTrigger, setToolModalTrigger] = useState<string | null>(null);
  const { isLocked } = useApp();

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
      <main className="relative z-10 flex-1 min-w-0 h-screen overflow-y-auto bg-paper">
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
        {currentTab === 'settings' && <SettingsScreen />}
      </main>

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
