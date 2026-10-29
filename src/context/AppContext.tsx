import React, { createContext, useContext, useState, useEffect } from 'react';
import { type User, type Shop } from '../types';
import { db, seedInitialData } from '../db';
import { createStoreWithSetup, type NewStoreInput } from '../utils/multiShopService';

export type Language = 'en' | 'te' | 'hi';
export type LuxuryTheme = 'organic-forest' | 'obsidian-chic' | 'sovereign-gold';
export type LogoConcept = 'knot' | 'prism' | 'portal';

interface AppContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  activeTheme: LuxuryTheme;
  setActiveTheme: (theme: LuxuryTheme) => void;
  activeLogoConcept: LogoConcept;
  setActiveLogoConcept: (concept: LogoConcept) => void;
  currentUser: User | null;
  currentShop: Shop | null;
  shops: Shop[];
  switchShop: (shopId: string) => Promise<boolean>;
  createNewShop: (data: NewStoreInput) => Promise<Shop>;
  showOnboardingModal: boolean;
  setShowOnboardingModal: (show: boolean) => void;
  showGatewayModal: boolean;
  setShowGatewayModal: (show: boolean) => void;
  refreshShops: () => Promise<void>;
  isLocked: boolean;
  lockApp: () => void;
  unlockWithPin: (pin: string) => Promise<boolean>;
  formatPaise: (paise: number) => string;
  t: (te: string, en: string, hi?: string) => string;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('sauda_lang');
    return (saved === 'te' || saved === 'en' || saved === 'hi') ? saved : 'en';
  });

  const [activeTheme, setActiveThemeState] = useState<LuxuryTheme>(() => {
    const saved = localStorage.getItem('sauda_theme');
    return (saved === 'organic-forest' || saved === 'obsidian-chic' || saved === 'sovereign-gold')
      ? saved
      : 'obsidian-chic';
  });

  const [activeLogoConcept, setActiveLogoConceptState] = useState<LogoConcept>(() => {
    const saved = localStorage.getItem('sauda_logo_concept');
    return (saved === 'knot' || saved === 'prism' || saved === 'portal') ? saved : 'knot';
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentShop, setCurrentShop] = useState<Shop | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [showOnboardingModal, setShowOnboardingModal] = useState<boolean>(false);
  const [showGatewayModal, setShowGatewayModal] = useState<boolean>(() => {
    // Show gateway if user has never dismissed it or if explicitly requested
    return localStorage.getItem('sauda_gateway_dismissed') !== 'true';
  });
  const [isLocked, setIsLocked] = useState<boolean>(false);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('sauda_lang', newLang);
  };

  const setActiveTheme = (theme: LuxuryTheme) => {
    setActiveThemeState(theme);
    localStorage.setItem('sauda_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  };

  const setActiveLogoConcept = (concept: LogoConcept) => {
    setActiveLogoConceptState(concept);
    localStorage.setItem('sauda_logo_concept', concept);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', activeTheme);
  }, [activeTheme]);

  const refreshShops = async () => {
    const allShops = await db.shops.toArray();
    setShops(allShops);
    return;
  };

  useEffect(() => {
    async function init() {
      await seedInitialData();
      const allShops = await db.shops.toArray();
      setShops(allShops);

      const savedShopId = localStorage.getItem('sauda_active_shop_id');
      let targetShop: Shop | undefined;
      if (savedShopId) {
        targetShop = allShops.find((s) => s.id === savedShopId);
      }
      if (!targetShop && allShops.length > 0) {
        targetShop = allShops[0];
      }

      if (targetShop) {
        setCurrentShop(targetShop);
        localStorage.setItem('sauda_active_shop_id', targetShop.id);
        const user = await db.users.where('shopId').equals(targetShop.id).first();
        if (user) {
          setCurrentUser(user);
        } else {
          const ownerUser = await db.users.where('role').equals('OWNER').first();
          if (ownerUser) setCurrentUser(ownerUser);
        }
      }
    }
    init();
  }, []);

  const switchShop = async (shopId: string): Promise<boolean> => {
    const targetShop = await db.shops.get(shopId);
    if (!targetShop) return false;

    setCurrentShop(targetShop);
    localStorage.setItem('sauda_active_shop_id', targetShop.id);

    const targetUser = await db.users.where('shopId').equals(targetShop.id).first();
    if (targetUser) {
      setCurrentUser(targetUser);
    }

    const allShops = await db.shops.toArray();
    setShops(allShops);
    return true;
  };

  const createNewShop = async (input: NewStoreInput): Promise<Shop> => {
    const newStore = await createStoreWithSetup(input);
    const allShops = await db.shops.toArray();
    setShops(allShops);
    setCurrentShop(newStore);
    localStorage.setItem('sauda_active_shop_id', newStore.id);

    const ownerUser = await db.users.where('shopId').equals(newStore.id).first();
    if (ownerUser) {
      setCurrentUser(ownerUser);
    }

    return newStore;
  };

  const lockApp = () => setIsLocked(true);

  const unlockWithPin = async (pin: string): Promise<boolean> => {
    const user = await db.users.where('pinHash').equals(pin).first();
    if (user && user.isActive) {
      setCurrentUser(user);
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const formatPaise = (paise: number): string => {
    const rupees = paise / 100;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(rupees);
  };

  const t = (te: string, en: string, hi?: string): string => {
    if (lang === 'te') return te;
    if (lang === 'hi') return hi || en;
    return en;
  };

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        activeTheme,
        setActiveTheme,
        activeLogoConcept,
        setActiveLogoConcept,
        currentUser,
        currentShop,
        shops,
        switchShop,
        createNewShop,
        showOnboardingModal,
        setShowOnboardingModal,
        showGatewayModal,
        setShowGatewayModal,
        refreshShops,
        isLocked,
        lockApp,
        unlockWithPin,
        formatPaise,
        t,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
