import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Search, 
  ShoppingCart, 
  Package, 
  BookOpen, 
  LayoutDashboard, 
  Settings, 
  Lock, 
  Languages, 
  ArrowRight, 
  X,
  User
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate }) => {
  const { lang, setLang, lockApp, t, formatPaise } = useApp();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const products = useLiveQuery(() => db.products.toArray()) || [];
  const variants = useLiveQuery(() => db.variants.toArray()) || [];
  const customers = useLiveQuery(() => db.customers.toArray()) || [];

  const productMap = new Map(products.map((p) => [p.id, p]));

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global key listener for Ctrl+K / Cmd+K and Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter products
  const matchedVariants = query.trim()
    ? variants.filter((v) => {
        const p = productMap.get(v.productId);
        const q = query.toLowerCase();
        return (
          p?.nameEn.toLowerCase().includes(q) ||
          p?.nameTe.toLowerCase().includes(q) ||
          v.sku.toLowerCase().includes(q) ||
          v.barcodes.some((b) => b.includes(q))
        );
      }).slice(0, 4)
    : [];

  // Filter customers
  const matchedCustomers = query.trim()
    ? customers.filter((c) => {
        const q = query.toLowerCase();
        return (
          c.fullName.toLowerCase().includes(q) ||
          c.customerCode.toLowerCase().includes(q) ||
          (c.phone && c.phone.includes(q))
        );
      }).slice(0, 3)
    : [];

  // Navigation shortcuts
  const navigationActions = [
    { id: 'dashboard', label: t('డాష్‌బోర్డ్ వెళ్ళు', 'Go to Dashboard'), icon: LayoutDashboard, key: 'F1' },
    { id: 'pos', label: t('POS బిల్లింగ్ ప్రారంభించు', 'Open POS Billing Counter'), icon: ShoppingCart, key: 'F2' },
    { id: 'products', label: t('ఇన్వెంటరీ కేటలాగ్ చూడు', 'Manage Inventory & Products'), icon: Package, key: 'F3' },
    { id: 'khata', label: t('ఖాతా లెడ్జర్ డైరెక్టరీ', 'Open Customer Khata Ledger'), icon: BookOpen, key: 'F4' },
    { id: 'settings', label: t('షాప్ సెట్టింగ్స్', 'Open Store Settings & Backup'), icon: Settings, key: 'F5' },
  ].filter((a) => !query.trim() || a.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 bg-slateBase-900/60 backdrop-blur-sm flex items-start justify-center pt-20 p-4 animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl max-w-xl w-full border border-slateBase-200 shadow-dropdown overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-slateBase-200 flex items-center space-x-3 bg-slateBase-50/50">
          <Search className="w-5 h-5 text-slateBase-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(
              'కమాండ్, వస్తువు, లేదా కస్టమర్ పేరు వెతకండి... (Esc to close)',
              'Type a command, product, or customer name... (Esc to close)'
            )}
            className="flex-1 bg-transparent text-sm font-semibold text-slateBase-900 placeholder-slateBase-400 focus:outline-none"
          />
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slateBase-200 text-slateBase-600">
            ESC
          </span>
          <button onClick={onClose} className="text-slateBase-400 hover:text-slateBase-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-3">
          
          {/* Matched Products */}
          {matchedVariants.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slateBase-400 font-mono">
                {t('వస్తువులు (Products)', 'Products')}
              </div>
              <div className="space-y-1 mt-1">
                {matchedVariants.map((v) => {
                  const p = productMap.get(v.productId);
                  return (
                    <button
                      key={v.id}
                      onClick={() => {
                        onNavigate('pos');
                        onClose();
                      }}
                      className="w-full p-2.5 rounded-xl hover:bg-saudaBlue-50 text-left flex items-center justify-between text-xs transition group"
                    >
                      <div className="flex items-center space-x-2.5">
                        <Package className="w-4 h-4 text-saudaBlue-600" />
                        <div>
                          <span className="font-bold text-slateBase-900">{lang === 'te' ? p?.nameTe : p?.nameEn}</span>
                          <span className="text-[11px] text-slateBase-500 font-medium ml-2">{v.variantName} • SKU: {v.sku}</span>
                        </div>
                      </div>
                      <span className="font-bold text-slateBase-900 tnum">{formatPaise(v.sellingPricePaise)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Matched Customers */}
          {matchedCustomers.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slateBase-400 font-mono">
                {t('కస్టమర్లు (Khata Customers)', 'Customers')}
              </div>
              <div className="space-y-1 mt-1">
                {matchedCustomers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onNavigate('khata');
                      onClose();
                    }}
                    className="w-full p-2.5 rounded-xl hover:bg-saudaBlue-50 text-left flex items-center justify-between text-xs transition group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <User className="w-4 h-4 text-saudaBlue-600" />
                      <div>
                        <span className="font-bold text-slateBase-900">{c.fullName}</span>
                        <span className="text-[11px] text-slateBase-500 font-medium ml-2">ID: {c.customerCode} • {c.villageCity}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slateBase-400 group-hover:text-saudaBlue-600" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Navigation Commands */}
          <div>
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slateBase-400 font-mono">
              {t('త్వరిత నావిగేషన్ (Navigation Shortcuts)', 'Navigation Shortcuts')}
            </div>
            <div className="space-y-1 mt-1">
              {navigationActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => {
                      onNavigate(action.id);
                      onClose();
                    }}
                    className="w-full p-2.5 rounded-xl hover:bg-slateBase-100 text-left flex items-center justify-between text-xs transition"
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className="w-4 h-4 text-slateBase-600" />
                      <span className="font-semibold text-slateBase-800">{action.label}</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slateBase-200 text-slateBase-600 font-bold">
                      {action.key}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick System Actions */}
          <div className="pt-2 border-t border-slateBase-100 flex items-center justify-between px-2 text-xs">
            <button
              onClick={() => {
                setLang(lang === 'te' ? 'en' : 'te');
                onClose();
              }}
              className="flex items-center space-x-1.5 text-slateBase-600 hover:text-saudaBlue-700 font-semibold"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>{lang === 'te' ? 'Switch to English' : 'తెలుగులోకి మార్చు'}</span>
            </button>

            <button
              onClick={() => {
                lockApp();
                onClose();
              }}
              className="flex items-center space-x-1.5 text-classicCrimson-600 hover:text-classicCrimson-700 font-semibold"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{t('కౌంటర్ లాక్ చేయి', 'Lock POS')}</span>
            </button>
          </div>

        </div>

        {/* Footer info bar */}
        <div className="p-2.5 bg-slateBase-50 border-t border-slateBase-200 text-[11px] text-slateBase-500 font-medium flex justify-between items-center px-4">
          <span>{t('శోధించడానికి టైప్ చేయండి', 'Tip: Type to search anything')}</span>
          <span className="font-mono text-[10px]">Sauda OS v2.0</span>
        </div>
      </div>
    </div>
  );
};
