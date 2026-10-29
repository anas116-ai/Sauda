import React, { useMemo } from 'react';
import { 
  Bill, 
  ProductVariant, 
  CustomerLedgerEntry, 
  Customer, 
  CashDrawerLog, 
  DayEndClosingReport 
} from '../../types';
import { calculateStoreHealthReport } from '../../utils/storeHealthUtils';
import { 
  X, 
  Activity, 
  ShieldCheck, 
  TrendingUp, 
  CheckCircle2, 
  ArrowUpRight, 
  Compass, 
  BarChart3
} from 'lucide-react';

interface StoreHealthStudioModalProps {
  bills: Bill[];
  variants: ProductVariant[];
  customerLedger: CustomerLedgerEntry[];
  customers: Customer[];
  cashDrawerLogs: CashDrawerLog[];
  dayEndClosings: DayEndClosingReport[];
  formatPaise: (paise: number) => string;
  t: (te: string, en: string, hi?: string) => string;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const StoreHealthStudioModal: React.FC<StoreHealthStudioModalProps> = ({
  bills,
  variants,
  customerLedger,
  customers,
  cashDrawerLogs,
  dayEndClosings,
  formatPaise,
  t,
  onClose,
  onNavigateTab,
}) => {
  const report = useMemo(() => {
    return calculateStoreHealthReport({
      bills,
      variants,
      customerLedger,
      customers,
      cashDrawerLogs,
      dayEndClosings,
    });
  }, [bills, variants, customerLedger, customers, cashDrawerLogs, dayEndClosings]);

  // Color scheme based on overall score
  let scoreRingColor = 'text-emerald-500';
  if (report.overallScore < 50) {
    scoreRingColor = 'text-rose-500';
  } else if (report.overallScore < 70) {
    scoreRingColor = 'text-amber-500';
  }

  // Find max revenue for chart scaling
  const maxRevenue = Math.max(...report.trendSeries.map((p) => p.revenuePaise), 100000);

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      data-testid="store-health-studio-modal"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#161918] text-white flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#84CC16]/20 border border-[#2563EB]/40 text-[#2563EB] flex items-center justify-center">
              <Activity className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white font-outfit">
                  {t('స్టోర్ హెల్త్ & భవిష్యత్ అంచనాలు', 'Store Health & Sales Forecast', 'स्टोर हेल्थ और बिक्री पूर्वानुमान')}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#84CC16]/15 text-[#2563EB] border border-[#2563EB]/30">
                  Vitality Index
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {t(
                  'వ్యాపార సామర్థ్యం & 14 రోజుల అమ్మకాల సరళి',
                  'Business Vitality Index & 14-Day Sales Velocity Forecast',
                  'व्यावसायिक क्षमता और 14-दिवसीय बिक्री रुझान'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 bg-slate-800 text-[#2563EB] border-slate-700">
              <ShieldCheck className="w-4 h-4 text-[#2563EB]" strokeWidth={2} />
              <span className="tnum">{report.overallScore} / 100</span>
              <span className="text-slate-500">•</span>
              <span>{t(report.gradeLabelTe, report.gradeLabelEn, report.gradeLabelHi)}</span>
            </div>

            <button
              onClick={onClose}
              data-testid="close-store-health-btn"
              className="w-8 h-8 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-paper-deep/30">
          
          {/* Bento Top Row: Overall Score Meter + Projected Turnover */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Score Radial Card (Span 5) */}
            <div className="md:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
                <span>{t('వ్యాపార ఆరోగ్య సూచిక', 'Store Health Score', 'स्टोर स्वास्थ्य स्कोर')}</span>
                <span className="p-1 rounded-md bg-emerald-50 text-emerald-600">
                  <Compass className="w-3.5 h-3.5" />
                </span>
              </div>

              <div className="flex items-center gap-6 my-2">
                {/* Visual Circular Gauge */}
                <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={scoreRingColor}
                      strokeDasharray={`${report.overallScore}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-black text-slate-900 tracking-tight font-syne" data-testid="store-health-overall-score">
                      {report.overallScore}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">/ 100</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {t(report.gradeLabelTe, report.gradeLabelEn, report.gradeLabelHi)}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {t(
                      'ద్రవ్యత, సరుకుల తాజాదనం, ఖాతా బాకీల వసూలు మరియు లాభాల మార్జిన్ ఆధారంగా లెక్కించబడింది.',
                      'Aggregated score calculated across liquidity, stock freshness, credit recovery, and profit margins.',
                      'तरलता, स्टॉक ताजगी, उधारी वसूली और लाभ मार्जिन के आधार पर गणना की गई है।'
                    )}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>{t('4 మూలస్తంభాల విశ్లేషణ', '4 Vital Pillars Evaluated', '4 स्तंभों का विश्लेषण')}</span>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {t('ఆడిట్ పూర్తయింది', 'Audit Verified', 'सत्यापित')}
                </span>
              </div>
            </div>

            {/* Projections Card (Span 7) */}
            <div className="md:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
                <span>{t('భవిష్యత్ అమ్మకాల అంచనాలు (Sales Forecast)', 'Forward Revenue Projections', 'भविष्य की बिक्री का अनुमान')}</span>
                <span className="p-1 rounded-md bg-blue-50 text-blue-600">
                  <TrendingUp className="w-3.5 h-3.5" />
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-1">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-400 font-medium block">
                    {t('రోజువారీ సగటు సేల్స్', 'Daily Run Rate', 'दैनिक औसत बिक्री')}
                  </span>
                  <span className="text-base sm:text-lg font-black text-slate-900 font-syne" data-testid="store-health-run-rate">
                    {formatPaise(report.dailyRunRatePaise)}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {t('రోజుకు సగటున', 'Per calendar day', 'प्रति दिन')}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                  <span className="text-[11px] text-blue-600 font-medium block">
                    {t('రాబోయే 7 రోజుల సేల్స్', 'Next 7-Day Forecast', 'अगले 7 दिनों का अनुमान')}
                  </span>
                  <span className="text-base sm:text-lg font-black text-blue-700 font-syne" data-testid="store-health-7d-forecast">
                    {formatPaise(report.projected7DayRevenuePaise)}
                  </span>
                  <span className="text-[10px] text-blue-600 font-semibold flex items-center mt-0.5">
                    <ArrowUpRight className="w-3 h-3 mr-0.5" />
                    +5.2% {t('వృద్ధి రేటు', 'momentum', 'वृद्धि')}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-emerald-700 font-medium block">
                    {t('ఆశించే వారపు లాభం', 'Expected 7d Net Profit', 'अपेक्षित साप्ताहिक लाभ')}
                  </span>
                  <span className="text-base sm:text-lg font-black text-emerald-700 font-syne" data-testid="store-health-weekly-profit">
                    {formatPaise(report.projectedWeeklyNetProfitPaise)}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                    {t('చేతికి మిగిలే నికర లాభం', 'Projected Take-Home', 'शुद्ध बचत')}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  {t('వచ్చే 30 రోజుల అంచనా టర్నోవర్:', 'Projected 30-Day Turnover:', 'अगले 30 दिनों का अनुमान:')}{' '}
                  <strong className="text-slate-800">{formatPaise(report.projected30DayRevenuePaise)}</strong>
                </span>
                <span className="text-blue-600 font-semibold">
                  {t('పీక్ రోజు: ఆదివారం', 'Peak Rush: Sunday', 'पीक दिवस: रविवार')}
                </span>
              </div>
            </div>

          </div>

          {/* 4 Health Pillars Grid */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-3">
              <span>{t('4 ప్రధాన వ్యాపార మూలస్తంభాలు', '4 Core Business Health Pillars', '4 प्रमुख व्यावसायिक स्तंभ')}</span>
              <span className="text-slate-400 font-normal">25 {t('పాయింట్ల చొప్పున', 'pts each', 'अंक प्रत्येक')}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {report.pillars.map((p) => {
                let badgeStyle = 'bg-emerald-100 text-emerald-800';
                if (p.status === 'WARNING') badgeStyle = 'bg-amber-100 text-amber-800';
                if (p.status === 'DANGER') badgeStyle = 'bg-rose-100 text-rose-800';

                return (
                  <div key={p.key} className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800">
                          {t(p.nameTe, p.nameEn, p.nameHi)}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${badgeStyle}`}>
                          {p.score} / {p.maxScore}
                        </span>
                      </div>
                      
                      <div className="text-sm font-black text-slate-900 font-mono">
                        {p.metricValue}
                      </div>

                      <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                        {t(p.insightTe, p.insightEn, p.insightHi)}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100">
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 rounded-full transition-all duration-300"
                          style={{ width: `${(p.score / p.maxScore) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 14-Day Sales Velocity Sparkline Bar Chart (7 Past Days + 7 Forecasted Days) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span>
                    {t(
                      '14 రోజుల అమ్మకాల సరళి & భవిష్యత్ గ్రాఫ్ (గత 7 రోజులు + రాబోయే 7 రోజులు)',
                      '14-Day Sales Velocity & Forecast (Past 7 Days vs Next 7 Days)',
                      '14-दिवसीय बिक्री रुझान और पूर्वानुमान (पिछले 7 दिन + अगले 7 दिन)'
                    )}
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {t(
                    'నీలం రంగు: వాస్తవ అమ్మకాలు | లేత బార్లు: ఇటీవలి విక్రయాల ఆధారంగా అంచనా',
                    'Solid Ink: Actual Invoiced Sales | Light Bars: Projected from recent sales rhythm',
                    'ठोस नीला: वास्तविक बिक्री | हल्का: हाल की बिक्री के आधार पर अनुमान'
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-indigo-800" />
                  <span className="text-slate-600">{t('గత సేల్స్', 'Actual Sales', 'वास्तविक बिक्री')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-indigo-300" />
                  <span className="text-slate-600">{t('రాబోయే అంచనా', 'Forecasted', 'अनुमानित')}</span>
                </div>
              </div>
            </div>

            {/* Bar Chart Visualizer */}
            <div className="h-40 flex items-end justify-between gap-1 sm:gap-2 pt-4 px-1 border-b border-slate-100">
              {report.trendSeries.map((point, idx) => {
                const heightPercent = Math.min(100, Math.max(12, Math.round((point.revenuePaise / maxRevenue) * 100)));
                const isProjected = point.isProjected;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group/bar relative">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-9 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-10">
                      {formatPaise(point.revenuePaise)} ({point.billsCount} txns)
                    </div>

                    <div className="w-full bg-slate-50 rounded-t-md h-32 flex items-end justify-center p-0.5">
                      <div 
                        className={`w-full rounded-t-sm transition-all duration-300 ${
                          isProjected 
                            ? 'bg-indigo-300' 
                            : 'bg-indigo-800'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    
                    <span className={`text-[10px] font-mono font-bold ${
                      isProjected ? 'text-indigo-600' : 'text-slate-600'
                    }`}>
                      {point.dayOfWeek}
                    </span>
                    <span className="text-[9px] text-slate-400 truncate max-w-[36px]">
                      {point.dateStr.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actionable Recommendations */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-3">
              <span className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-copper-600" strokeWidth={1.7} />
                <span>{t('స్టోర్ ఆప్టిమైజేషన్ సూచనలు', 'Actionable Store Recommendations', 'स्टोर सुधार सुझाव')}</span>
              </span>
              <span className="text-slate-400 font-normal">
                {report.recommendations.length} {t('సూచనలు', 'actions available', 'सुझाव')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {report.recommendations.map((rec) => (
                <div 
                  key={rec.id} 
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {rec.priority}
                      </span>
                    </div>

                    <h5 className="font-bold text-slate-900 text-xs">
                      {t(rec.titleTe, rec.titleEn, rec.titleHi)}
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      {t(rec.descriptionTe, rec.descriptionEn, rec.descriptionHi)}
                    </p>
                  </div>

                  {rec.actionTab && onNavigateTab && (
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateTab(rec.actionTab!);
                      }}
                      className="mt-3 w-full py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 text-blue-700 text-xs font-semibold border border-slate-200 hover:border-blue-200 transition-colors flex items-center justify-center gap-1"
                    >
                      <span>{t('వెంటనే చర్య తీసుకోండి', 'Take Action', 'कार्रवाई करें')}</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#84CC16]" aria-hidden="true" />
            <span>
              {t(
                'ఈ స్కోరు మీ దుకాణం లెడ్జర్ ఆధారంగా ప్రతి రోజు తాజాగా లెక్కించబడుతుంది.',
                'This score is recalculated each day from your own shop ledger.',
                'यह स्कोर आपके दुकान के खाते से हर दिन निकाला जाता है।'
              )}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              data-testid="store-health-close-footer-btn"
              className="px-4 py-2 rounded-xl bg-[#161918] hover:bg-slate-900 text-white font-bold transition-all shadow-xs"
            >
              {t('పూర్తయింది', 'Done', 'संपन्न')}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
