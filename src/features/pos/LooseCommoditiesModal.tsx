import React, { useState, useMemo } from 'react';
import { 
  LOOSE_COMMODITIES, 
  LOOSE_CATEGORIES, 
  type LooseCommodity 
} from '../../data/looseCommoditiesCatalog';
import { Search, X, Scale, TrendingUp, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface LooseCommoditiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCommodity: (commodity: LooseCommodity, weightKg?: number) => void;
  onDirectAddToCart: (commodity: LooseCommodity, weightKg: number) => void;
}

export const LooseCommoditiesModal: React.FC<LooseCommoditiesModalProps> = ({
  isOpen,
  onClose,
  onSelectCommodity,
  onDirectAddToCart,
}) => {
  const { lang, formatPaise, t } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [justAddedSku, setJustAddedSku] = useState<string | null>(null);

  // Filter items
  const filteredCommodities = useMemo(() => {
    let list = LOOSE_COMMODITIES;
    if (selectedCategory !== 'ALL') {
      list = list.filter((c) => c.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.nameTe.toLowerCase().includes(q) ||
          c.nameEn.toLowerCase().includes(q) ||
          c.sku.toLowerCase().includes(q) ||
          c.categoryTe.toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectedCategory, searchQuery]);

  if (!isOpen) return null;

  const handleQuickAdd = (commodity: LooseCommodity, weightKg: number) => {
    onDirectAddToCart(commodity, weightKg);
    setJustAddedSku(`${commodity.sku}-${weightKg}`);
    setTimeout(() => setJustAddedSku(null), 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-6xl h-[90vh] flex flex-col bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200/80 bg-gradient-to-r from-slate-50 via-white to-amber-50/40 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-700 flex items-center justify-center font-bold shadow-sm">
              <Scale className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  {t('విడి సరుకుల మార్కెట్ & బజార్ (F8)', 'Loose Commodities Matrix Hub (F8)')}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300/50">
                  50+ నిత్యావసరాలు
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {t(
                  'ధాన్యాలు, పప్పులు, మసాలాలు, పిండిలు, నూనెలు — తూకం & బడ్జెట్ ప్రకారం క్షణాల్లో కార్ట్‌లోకి చేర్చండి',
                  'Select any loose commodity to weigh, type grams, or budget rupees'
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition active:scale-95"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls: Search & Categories Bar */}
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50 space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t(
                'సరుకు పేరు టైప్ చేయండి (ఉదా: కందిపప్పు, జీలకర్ర, బియ్యం, Toor Dal, Jeera)...',
                'Type commodity name (e.g. Toor Dal, Jeera, Rice, Sugar)...'
              )}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 shadow-sm transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            {LOOSE_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition active:scale-95 ${
                    isSelected
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 ring-2 ring-amber-400/40'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {lang === 'te' ? cat.nameTe : cat.nameEn}
                </button>
              );
            })}
          </div>
        </div>

        {/* Commodity Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-slate-50/30 to-slate-100/50">
          {filteredCommodities.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <Scale className="w-12 h-12 stroke-1 mb-2 text-slate-300" />
              <p className="text-sm font-medium">సరుకు కనుగొనబడలేదు (No commodities match your query)</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCommodities.map((item) => {
                const ratePaise = item.defaultRatePerKg * 100;
                return (
                  <div
                    key={item.id}
                    className="group relative bg-white/90 hover:bg-white rounded-2xl p-4 border border-slate-200/90 hover:border-amber-400/60 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
                  >
                    {/* Top Row: Category tag & Daily rate badge */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {item.categoryTe}
                      </span>
                      {item.isMandiRateVolatile && (
                        <span className="inline-flex items-center text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/50" title="Mandi Live Rate">
                          <TrendingUp className="w-3 h-3 mr-0.5" />
                          రోజువారీ రేటు
                        </span>
                      )}
                    </div>

                    {/* Commodity Title */}
                    <div className="mb-3">
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-800 transition">
                        {item.nameTe}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {item.nameEn}
                      </p>
                    </div>

                    {/* Price & Primary Selection Button */}
                    <div className="flex items-center justify-between py-2 border-y border-slate-100 mb-3">
                      <div>
                        <div className="text-[11px] text-slate-400 font-medium">కిలో / లీటర్ రేటు</div>
                        <div className="text-lg font-black text-slate-900 font-mono">
                          ₹{item.defaultRatePerKg}
                          <span className="text-xs font-normal text-slate-500 ml-0.5">/{item.unit === 'L' ? 'లీ' : 'కేజీ'}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectCommodity(item);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm shadow-amber-500/20 flex items-center space-x-1 transition active:scale-95"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>తూకం వేయి</span>
                      </button>
                    </div>

                    {/* Quick Portion Chips (1-Click instant add) */}
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium mb-1.5 flex items-center justify-between">
                        <span>త్వరిత పరిమాణం (1-క్లిక్ చేర్చు):</span>
                        <span className="text-slate-400 text-[10px]">లేదా బడ్జెట్ ₹</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {item.popularWeightsGrams.slice(0, 4).map((grams) => {
                          const kg = grams / 1000;
                          const costPaise = Math.round(kg * ratePaise);
                          const isJustAdded = justAddedSku === `${item.sku}-${kg}`;

                          return (
                            <button
                              key={grams}
                              type="button"
                              onClick={() => handleQuickAdd(item, kg)}
                              className={`py-1 px-1 rounded-lg text-center font-mono text-[11px] font-semibold border transition active:scale-95 ${
                                isJustAdded
                                  ? 'bg-emerald-500 text-white border-emerald-500'
                                  : 'bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-900 border-slate-200 hover:border-amber-300'
                              }`}
                              title={`Add ${grams >= 1000 ? `${kg}kg` : `${grams}g`} for ${formatPaise(costPaise)}`}
                            >
                              {isJustAdded ? (
                                <Check className="w-3.5 h-3.5 mx-auto" />
                              ) : (
                                <>
                                  <div className="leading-tight">{grams >= 1000 ? `${kg}kg` : `${grams}g`}</div>
                                  <div className="text-[9px] text-slate-500 font-normal">{formatPaise(costPaise)}</div>
                                </>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-6 py-3 border-t border-slate-200/80 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-4">
            <span>
              మొత్తం: <strong>{filteredCommodities.length}</strong> విడి సరుకులు
            </span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="hidden sm:inline">
              షార్ట్‌కట్: <strong>F8</strong> లేదా <strong>Alt+L</strong>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold transition"
            >
              ముగించు (Close)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
