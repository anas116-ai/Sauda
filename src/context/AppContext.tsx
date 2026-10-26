import React, { createContext, useContext, useState, useEffect } from 'react';
import { type User, type Shop } from '../types';
import { db, seedInitialData } from '../db';

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
  isLuxuryStudioOpen: boolean;
  setIsLuxuryStudioOpen: (open: boolean) => void;
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

  const [isLuxuryStudioOpen, setIsLuxuryStudioOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentShop, setCurrentShop] = useState<Shop | null>(null);
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
        activeTheme,
        setActiveTheme,
        activeLogoConcept,
        setActiveLogoConcept,
        isLuxuryStudioOpen,
        setIsLuxuryStudioOpen,
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
