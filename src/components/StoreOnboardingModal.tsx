import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Store, 
  MapPin, 
  Phone, 
  User, 
  KeyRound, 
  CheckCircle2, 
  X, 
  ArrowRight, 
  ArrowLeft
} from 'lucide-react';

interface StoreOnboardingModalProps {
  onClose: () => void;
  onSuccess?: (shopId: string) => void;
}

export const StoreOnboardingModal: React.FC<StoreOnboardingModalProps> = ({ onClose, onSuccess }) => {
  const { createNewShop, t } = useApp();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [storeName, setStoreName] = useState('');
  const [storeLegalName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [cityVillage, setCityVillage] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [pincode, setPincode] = useState('500001');
  const [gstin, setGstin] = useState('');
  const [storeCategory, setStoreCategory] = useState<'KIRANA' | 'WHOLESALE' | 'SUPERMARKET' | 'GENERAL'>('KIRANA');
  const [preloadCatalog, setPreloadCatalog] = useState(true);
  const [ownerPin, setOwnerPin] = useState('1234');

  const handleStep1Next = () => {
    if (!storeName.trim()) {
      setErrorMsg('దయచేసి దుకాణం పేరును నమోదు చేయండి (Please enter store name)');
      return;
    }
    if (!ownerPhone.trim() || ownerPhone.trim().length < 10) {
      setErrorMsg('దయచేసి 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి (Please enter 10-digit phone)');
      return;
    }
    if (!cityVillage.trim()) {
      setErrorMsg('దయచేసి ఊరు లేదా నగరం పేరు నమోదు చేయండి (Please enter city/village)');
      return;
    }
    setErrorMsg(null);
    setStep(2);
  };

  const handleStep2Next = () => {
    setErrorMsg(null);
    setStep(3);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ownerPin.length !== 4) {
      setErrorMsg('సెక్యూరిటీ పిన్ 4 అంకెలు ఉండాలి (PIN must be 4 digits)');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const createdShop = await createNewShop({
        name: storeName.trim(),
        legalName: storeLegalName.trim() || storeName.trim(),
        phone: ownerPhone.trim(),
        city: cityVillage.trim(),
        addressLine1: addressLine.trim() || 'Main Bazaar',
        pincode: pincode.trim() || '500001',
        gstin: gstin.trim() || undefined,
        storeCategory,
        preloadCatalog,
        ownerName: ownerName.trim() || 'Store Owner',
        ownerPin: ownerPin.trim() || '1234',
      });

      if (onSuccess) {
        onSuccess(createdShop.id);
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to create store:', err);
      setErrorMsg(err.message || 'దుకాణం నమోదు విఫలమైంది. మళ్ళీ ప్రయత్నించండి.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-fade-in font-sans"
      data-testid="store-onboarding-modal"
    >
      <div className="relative w-full max-w-xl bg-paper text-ink rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-ink-950 text-paper px-6 py-5 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-copper-600/20 border border-copper-500/40 flex items-center justify-center text-copper-400">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-paper font-serif tracking-tight">
                {t('కొత్త దుకాణాన్ని నమోదు చేయండి', 'Register New Store Profile')}
              </h2>
              <p className="text-xs text-stone-300 font-mono">
                {t('దశ ' + step + ' / 3', 'Step ' + step + ' of 3')}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-300 hover:text-paper hover:bg-white/10 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="w-full bg-stone-100 h-1.5 flex">
          <div className={`h-full transition-all duration-300 bg-copper-600 ${step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'}`} />
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 min-h-[320px]">
          
          {/* STEP 1: Basic Store Details */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-copper-50/50 border border-copper-200/60 p-3.5 rounded-xl text-xs text-copper-900 leading-relaxed">
                🌾 {t('మీ గ్రామం లేదా నగరంలో మీ స్వతంత్ర దుకాణాన్ని సెటప్ చేసుకోండి. మీ డేటా మీ కంప్యూటర్‌లో 100% ప్రైవేట్‌గా భద్రంగా ఉంటుంది.', 'Set up your independent store in your village or city. All data remains 100% private on your device.')}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  {t('దుకాణం పేరు *', 'Store Name *')}
                </label>
                <div className="relative">
                  <Store className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    required
                    placeholder={t('ఉదా: శ్రీ బాలాజీ కిరాణా & జనరల్ స్టోర్స్', 'e.g., Sri Balaji Kirana & General Store')}
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 focus:border-copper-600 focus:ring-2 focus:ring-copper-600/20 text-sm font-medium bg-white"
                    autoFocus
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                    {t('యజమాని పేరు', 'Owner / Manager Name')}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                    <input
                      type="text"
                      placeholder={t('ఉదా: రమేష్ గారు', 'e.g., Ramesh')}
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 focus:border-copper-600 focus:ring-2 focus:ring-copper-600/20 text-sm font-medium bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                    {t('మొబైల్ నంబర్ *', 'Mobile Number *')}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="9848012345"
                      value={ownerPhone}
                      onChange={(e) => setOwnerPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 focus:border-copper-600 focus:ring-2 focus:ring-copper-600/20 text-sm font-medium font-mono bg-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  {t('గ్రామం / పట్టణం / నగరం *', 'Village / Town / City *')}
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    required
                    placeholder={t('ఉదా: విలేజ్ X / హైదరాబాద్ / వరంగల్', 'e.g., Village X / Hyderabad / Warangal')}
                    value={cityVillage}
                    onChange={(e) => setCityVillage(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 focus:border-copper-600 focus:ring-2 focus:ring-copper-600/20 text-sm font-medium bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Category & Address */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                  {t('వ్యాపార రకం', 'Store Business Model')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'KIRANA', labelTe: 'కిరాణా & జనరల్ స్టోర్స్', labelEn: 'Kirana & Grocery' },
                    { id: 'WHOLESALE', labelTe: 'హోల్‌సేల్ & ట్రేడింగ్', labelEn: 'Wholesale Depot' },
                    { id: 'SUPERMARKET', labelTe: 'సూపర్ బజార్ / మార్ట్', labelEn: 'Supermarket / Mart' },
                    { id: 'GENERAL', labelTe: 'ఇతర రిటైల్ వ్యాపారం', labelEn: 'Other Retail Store' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setStoreCategory(cat.id as any)}
                      className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
                        storeCategory === cat.id
                          ? 'border-copper-600 bg-copper-50/60 text-copper-900 ring-2 ring-copper-600/20 font-bold'
                          : 'border-stone-200 hover:border-stone-300 bg-white text-stone-700'
                      }`}
                    >
                      <span className="text-xs font-semibold">{t(cat.labelTe, cat.labelEn)}</span>
                      <span className="text-[10px] text-stone-500 font-mono">{cat.id}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  {t('చిరునామా / లొకేషన్', 'Shop Address / Street')}
                </label>
                <input
                  type="text"
                  placeholder={t('ఉదా: గాంధీ బొమ్మ దగ్గర, మెయిన్ రోడ్డు', 'e.g., Near Gandhi Statue, Main Road')}
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:border-copper-600 focus:ring-2 focus:ring-copper-600/20 text-sm font-medium bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                    {t('పిన్‌కోడ్ (Pincode)', 'Pincode')}
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:border-copper-600 focus:ring-2 focus:ring-copper-600/20 text-sm font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                    {t('GSTIN నంబర్ (ఐచ్ఛికం)', 'GSTIN (Optional)')}
                  </label>
                  <input
                    type="text"
                    placeholder="36AAAAA0000A1Z5"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:border-copper-600 focus:ring-2 focus:ring-copper-600/20 text-sm font-mono bg-white uppercase"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Catalog Preload & Security PIN */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                  {t('ప్రారంభ సరుకుల కేటలాగ్', 'Starter Inventory Catalog')}
                </label>

                <div className="space-y-2.5">
                  <div
                    onClick={() => setPreloadCatalog(true)}
                    className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-3.5 ${
                      preloadCatalog
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 ring-2 ring-emerald-600/20'
                        : 'border-stone-200 hover:border-stone-300 bg-white text-stone-700'
                    }`}
                  >
                    <div className="mt-0.5 w-5 h-5 rounded-full border-2 border-emerald-600 flex items-center justify-center shrink-0">
                      {preloadCatalog && <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />}
                    </div>
                    <div>
                      <div className="text-sm font-bold flex items-center gap-2">
                        <span>🌾 {t('70+ కిరాణా సరుకులను ఆటోమేటిక్‌గా లోడ్ చేయండి', 'Preload 70+ Essential Kirana Items')}</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {t('సిఫార్సు చేయబడింది', 'Recommended')}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                        {t('బియ్యం, కందిపప్పు, సన్‌ఫ్లవర్ నూనె, చక్కెర, సబ్బులు, మసాలాలు వంటి ప్రాథమిక సరుకులు వెంటనే బిల్లింగ్ కోసం సిద్ధంగా ఉంటాయి.', 'Common grains, pulses, oils, spices, soaps preloaded with MRP, cost, and Telugu names ready for instant billing.')}
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => setPreloadCatalog(false)}
                    className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-3.5 ${
                      !preloadCatalog
                        ? 'border-copper-600 bg-copper-50/50 text-copper-950 ring-2 ring-copper-600/20'
                        : 'border-stone-200 hover:border-stone-300 bg-white text-stone-700'
                    }`}
                  >
                    <div className="mt-0.5 w-5 h-5 rounded-full border-2 border-copper-600 flex items-center justify-center shrink-0">
                      {!preloadCatalog && <span className="w-2.5 h-2.5 rounded-full bg-copper-600" />}
                    </div>
                    <div>
                      <div className="text-sm font-bold">
                        📦 {t('పూర్తిగా ఖాళీగా ప్రారంభించండి', 'Start with Empty Catalog')}
                      </div>
                      <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                        {t('ఎలాంటి డీఫాల్ట్ సరుకులు లేకుండా మీ షాపులో ఉన్న వస్తువులను మీరే స్వయంగా యాడ్ చేసుకుంటారు.', 'Zero pre-seeded items. You will manually add or import your specific products via CSV.')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-200">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  {t('ఓనర్ లాగిన్ సెక్యూరిటీ పిన్ (4 అంకెలు)', 'Owner Security PIN (4 Digits)')}
                </label>
                <div className="relative max-w-xs">
                  <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                  <input
                    type="password"
                    maxLength={4}
                    value={ownerPin}
                    onChange={(e) => setOwnerPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 focus:border-copper-600 focus:ring-2 focus:ring-copper-600/20 text-base font-mono tracking-widest text-center bg-white"
                  />
                </div>
                <p className="text-[11px] text-stone-500 mt-1">
                  {t('ఈ పిన్ ద్వారా టెర్మినల్ లాక్ చేసి షాపు లెక్కలను రక్షించుకోవచ్చు (డీఫాల్ట్: 1234)', 'Used to lock/unlock your terminal and authorize owner actions (default: 1234).')}
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation Buttons */}
        <div className="bg-stone-50 px-6 py-4 border-t border-stone-200 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((step - 1) as any)}
              className="px-4 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('వెనుకకు', 'Back')}
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-stone-500 hover:text-stone-800 text-xs font-bold transition"
            >
              {t('రద్దు చేయండి', 'Cancel')}
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={step === 1 ? handleStep1Next : handleStep2Next}
              className="px-5 py-2.5 rounded-xl bg-copper-600 hover:bg-copper-700 text-paper text-xs font-bold flex items-center gap-2 shadow-sm transition"
            >
              <span>{t('తదుపరి', 'Next Step')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinalSubmit}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-paper text-xs font-bold flex items-center gap-2 shadow-sm transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>{t('నమోదు అవుతోంది...', 'Setting up store...')}</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('దుకాణాన్ని ప్రారంభించండి', 'Launch Store')}</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
