import React, { createContext, useContext, useState, useEffect } from 'react';
import { type User, type Shop } from '../types';
import { db, seedInitialData } from '../db';

export type Language = 'en' | 'te' | 'hi';

interface AppContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  currentUser: User | null;
  currentShop: Shop | null;
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentShop, setCurrentShop] = useState<Shop | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('sauda_lang', newLang);
  };

  useEffect(() => {
    async function init() {
      await seedInitialData();
      const shop = await db.shops.toCollection().first();
      const user = await db.users.where('role').equals('OWNER').first();
      if (shop) setCurrentShop(shop);
      if (user) setCurrentUser(user);
    }
    init();
  }, []);

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
        currentUser,
        currentShop,
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
