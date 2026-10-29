import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  GraduationCap, 
  ShoppingCart, 
  Scale, 
  BookOpen, 
  Package, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  X, 
  Sparkles, 
  Calendar 
} from 'lucide-react';

interface GuidedDemoTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const GuidedDemoTourModal: React.FC<GuidedDemoTourModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const { t } = useApp();
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      titleTe: '1. 0ms బార్‌కోడ్ & వాయిస్ బిల్లింగ్ (Fast POS Billing)',
      titleEn: '1. 0ms Barcode & Telugu Voice Billing',
      icon: ShoppingCart,
      badgeTe: 'బిల్లింగ్ కౌంటర్ (F2)',
      badgeEn: 'POS Billing Counter (F2)',
      targetTab: 'pos',
      descriptionTe:
        'బార్‌కోడ్ గన్‌తో స్కాన్ చేయగానే 0ms వేగంతో సరుకు కార్ట్‌లోకి చేరుతుంది. వాయిస్ బటన్ లేదా F2 నొక్కి "రెండు కేజీల చక్కెర" అని తెలుగులో మాట్లాడినా ఆటోమేటిక్‌గా బిల్లు తయారవుతుంది.',
      descriptionEn:
        'Scan barcodes with instant zero latency. Speak naturally in Telugu or English (e.g. "2 kg Sugar") to automatically add items to the cart.',
      tipsTe: [
        'బార్‌కోడ్ గన్ స్కాన్ చేసిన వెంటనే ఆటో-ఫోకస్ అవుతుంది.',
        'క్యాష్ లేదా UPI QR కోడ్ ద్వారా 1 సెకనులో బిల్ పూర్తి చేయవచ్చు.',
        'కస్టమర్ వాట్సాప్ నంబర్ ఎంటర్ చేస్తే తక్షణమే డిజిటల్ రసీదు వెళ్తుంది.',
      ],
      tipsEn: [
        'Instant barcode scanner auto-focus without manual clicking.',
        '1-click checkout with Cash Drawer pulse & UPI QR display.',
        'Auto-send tamper-proof WhatsApp bills directly to customer.',
      ],
    },
    {
      titleTe: '2. విడి సరుకుల తూకం & క్విక్ వెయిట్ మోడల్ (Loose Item Weighing)',
      titleEn: '2. Loose Item Weighing & Scale Sync',
      icon: Scale,
      badgeTe: 'కాటా మిషన్ & తూకం',
      badgeEn: 'Weighing Scale Integration',
      targetTab: 'pos',
      descriptionTe:
        'చక్కెర, పప్పులు, బియ్యం వంటి విడి సరుకులను తూచేటప్పుడు క్విక్ వెయిట్ మోడల్ ఉపయోగించండి. గ్రాములు మరియు కిలోల మధ్య ఒక్క క్లిక్‌తో మారవచ్చు.',
      descriptionEn:
        'Seamless loose item weighing with RS-232 weighing scale support. Switch between Grams and Kilograms with quick preset chips (100g, 250g, 500g, 1kg).',
      tipsTe: [
        '100g, 250g, 500g, 1kg చిప్స్ పై క్లిక్ చేసి తక్షణ ధరను చూడవచ్చు.',
        'డిజిటల్ కాటా మిషన్ కనెక్ట్ చేస్తే లైవ్ బరువు ఆటోమేటిక్‌గా వస్తుంది.',
        'గ్రాములలో ఉన్నా పర్ఫెక్ట్ పైసాలతో బిల్లు లెక్కించబడుతుంది.',
      ],
      tipsEn: [
        'Quick preset chips for instant portion calculation.',
        'Direct live RS-232 serial feed from Phoenix, Essae, Eagle scales.',
        'Paisa-level arithmetic accuracy for loose commodities.',
      ],
    },
    {
      titleTe: '3. కస్టమర్ ఉధార్ ఖాతా & వాట్సాప్ రిమైండర్లు (Customer Khata)',
      titleEn: '3. Customer Credit Ledger & WhatsApp Reminders',
      icon: BookOpen,
      badgeTe: 'ఉధార్ ఖాతా లెడ్జర్ (F4)',
      badgeEn: 'Credit Khata Book (F4)',
      targetTab: 'khata',
      descriptionTe:
        'కస్టమర్లకు ఇచ్చిన అప్పులు, వారు చెల్లించిన వాయిదాలను ఖచ్చితమైన టైమ్‌స్టాంప్‌లతో నమోదు చేయండి. వివాద రహిత ఖాతా రసీదులను వాట్సాప్‌లో పంపవచ్చు.',
      descriptionEn:
        'Track credit given (DEBIT) and repayments (CREDIT) with exact transaction timestamps. Send dispute-proof PDF statements on WhatsApp.',
      tipsTe: [
        'క్రెడిట్ పరిమితి (Credit Limit) దాటితే సిస్టమ్ ఆటోమేటిక్‌గా హెచ్చరిస్తుంది.',
        'బాకీ వసూలు చేసేటప్పుడు ఒక్క క్లిక్‌తో వాట్సాప్ రిమైండర్ పంపవచ్చు.',
        'ప్రతి పైసాకు ఆడిట్ ప్రూఫ్ రికార్డ్ భద్రపరచబడుతుంది.',
      ],
      tipsEn: [
        'Automatic credit limit alerts before issuing more debt.',
        '1-click friendly payment reminders on WhatsApp.',
        '100% offline balance reconciliation with zero data loss.',
      ],
    },
    {
      titleTe: '4. సరుకుల నిల్వ, ర్యాక్ లొకేషన్ & బార్‌కోడ్ స్టిక్కర్లు (Inventory)',
      titleEn: '4. Inventory Stock, Shelf Locator & Barcode Stickers',
      icon: Package,
      badgeTe: 'ఇన్వెంటరీ & స్టాక్ (F3)',
      badgeEn: 'Product Catalog & Batches (F3)',
      targetTab: 'products',
      descriptionTe:
        'కొత్త సరుకులను 7-సెక్షన్ల సమగ్ర ఫారమ్‌తో నమోదు చేయండి. దుకాణంలో ఏ అరలో (Rack Locator) ఉందో సెట్ చేయండి, 50x25mm బార్‌కోడ్ స్టిక్కర్లు ప్రింట్ చేయండి.',
      descriptionEn:
        'Complete 7-section retail catalog. Assign shelf and rack locations (e.g. Rack A-1), generate 13-digit EAN barcodes, and print 50x25mm labels.',
      tipsTe: [
        'కొనుగోలు ధర నమోదు చేయగానే లాభం శాతం (Margin %) ఆటోమేటిక్‌గా వస్తుంది.',
        'తక్కువ స్టాక్ ఉన్న వస్తువులకు కనీస పరిమితి (Min Alert) సెట్ చేసుకోవచ్చు.',
        'ఎక్స్‌పైరీ రాడార్ ద్వారా గడువు ముగిసే సరుకులను ముందే గుర్తించవచ్చు.',
      ],
      tipsEn: [
        'Real-time profit margin and markup % auto-calculated as you type.',
        'Customizable low-stock threshold per item or category.',
        'Expiry radar alerts you 30/60 days before products expire.',
      ],
    },
    {
      titleTe: '5. సాయంత్రం క్యాష్ క్లోజింగ్ & Z-రిపోర్ట్ (Day-End Closing)',
      titleEn: '5. Day-End Cash Balancing & Z-Report',
      icon: Calendar,
      badgeTe: 'డే-ఎండ్ క్లోజింగ్ & లెక్కలు',
      badgeEn: 'Day-End Audit & Z-Report',
      targetTab: 'dashboard',
      descriptionTe:
        'రాత్రి దుకాణం మూసివేసే ముందు గల్లా పెట్టెలోని నగదును సిస్టమ్ అమ్మకాలతో సరిచూసి Z-రిపోర్ట్ ప్రింట్ చేయండి. చిల్లర దొంగతనాలు పూర్తిగా నిరోధించబడతాయి.',
      descriptionEn:
        'Reconcile physical cash in the drawer against system sales. Record safe cash drops and print official end-of-day Z-reports.',
      tipsTe: [
        'క్యాష్ డ్రాయర్ ఆడిట్ లాగ్ ద్వారా అనధికారిక ఓపెనింగ్స్ తెలుస్తాయి.',
        'నేటి మొత్తం నగదు, UPI మరియు ఉధార్ విడివిడిగా ధృవీకరించబడుతుంది.',
        'డేటా మొత్తం ఎన్‌క్రిప్ట్ చేయబడి లోకల్ డివైస్‌లో సురక్షితంగా ఉంటుంది.',
      ],
      tipsEn: [
        'Audit logs prevent unauthorized drawer kicks without billing.',
        'Instant split between Cash in Hand, Bank UPI, and Credit debt.',
        '1-click export of day summary for accountant or owner.',
      ],
    },
  ];

  const current = steps[currentStep];
  const StepIcon = current.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGoToFeature = () => {
    if (onNavigateTab && current.targetTab) {
      onNavigateTab(current.targetTab);
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-auto flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400 border border-white/10">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">
                {t('ఇంటరాక్టివ్ గైడెడ్ డెమో టూర్', 'Interactive Guided Demo Tour')}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {t(`దశ ${currentStep + 1} / ${steps.length}`, `Step ${currentStep + 1} of ${steps.length}`)}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5 flex">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-full flex-1 transition-all duration-300 ${
                idx <= currentStep ? 'bg-emerald-600' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-7 space-y-5">
          
          {/* Feature Badge & Title */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-900 flex items-center justify-center shrink-0 border border-slate-200">
              <StepIcon className="w-6 h-6 text-slate-800" strokeWidth={1.75} />
            </div>
            <div className="space-y-1">
              <span className="inline-block text-[10px] font-bold font-mono uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {t(current.badgeTe, current.badgeEn)}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {t(current.titleTe, current.titleEn)}
              </h2>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
            {t(current.descriptionTe, current.descriptionEn)}
          </p>

          {/* Tips & Key Benefits */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-mono uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t('ముఖ్యమైన చిట్కాలు (Pro-Tips)', 'Key Features & Pro-Tips')}</span>
            </h4>
            <div className="space-y-1.5">
              {(t(current.tipsTe.join('|||'), current.tipsEn.join('|||')).split('|||')).map((tip, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white transition disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('వెనుకకు', 'Previous')}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGoToFeature}
              className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-800 text-xs font-bold transition shadow-xs"
            >
              {t('ఈ ఫీచర్‌ను ప్రత్యక్షంగా చూడండి', 'Try Feature Now')}
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
            >
              <span>{currentStep === steps.length - 1 ? t('ముగించు (Finish)', 'Finish Tour') : t('తదుపరి దశ', 'Next Step')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
