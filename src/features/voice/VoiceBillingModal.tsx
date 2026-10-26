import React, { useState, useEffect, useRef } from 'react';
import { 
  parseVoiceQuery, 
  playVoiceRecognitionChime, 
  VOICE_PRESETS 
} from '../../utils/voiceBillingUtils';
import { VoiceBillingParseResult } from '../../types';
import { db } from '../../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Mic, MicOff, AudioLines, ArrowRight, X, ShoppingCart, ChevronRight, AlertTriangle } from 'lucide-react';

interface VoiceBillingModalProps {
  t: (te: string, en: string, hi?: string) => string;
  formatPaise: (paise: number) => string;
  onClose: () => void;
  onAddItemsToCart: (items: { variantId: string; quantity: number }[]) => void;
  onClearCart?: () => void;
  initialTranscript?: string;
}

export const VoiceBillingModal: React.FC<VoiceBillingModalProps> = ({
  t,
  formatPaise,
  onClose,
  onAddItemsToCart,
  onClearCart,
  initialTranscript = '',
}) => {
  const [transcript, setTranscript] = useState(initialTranscript || 'ఒక లీటర్ ఫ్రీడమ్ నూనె, ఒక కేజీ టాటా ఉప్పు');
  const [isListening, setIsListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState<'te-IN' | 'en-IN'>('te-IN');
  const [parseResult, setParseResult] = useState<VoiceBillingParseResult | null>(null);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const recognitionRef = useRef<any>(null);

  const products = useLiveQuery(() => db.products.toArray()) || [];
  const variants = useLiveQuery(() => db.variants.toArray()) || [];

  // Parse transcript on load or change
  useEffect(() => {
    if (products.length > 0 && variants.length > 0 && transcript.trim()) {
      const langCode = voiceLang === 'te-IN' ? 'te' : 'en';
      const res = parseVoiceQuery(transcript, products, variants, langCode);
      setParseResult(res);
    }
  }, [transcript, products, variants, voiceLang]);

  // Initialize Speech Recognition if supported by browser
  useEffect(() => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setSpeechSupported(false);
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }

      const recog = new SpeechRecognitionClass();
      recog.continuous = true;
      recog.interimResults = true;
      recog.lang = voiceLang;

      recog.onresult = (event: any) => {
        let currentText = '';
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript + ' ';
        }
        setTranscript(currentText.trim());
      };

      recog.onerror = (err: any) => {
        console.warn('Speech recognition warning/error:', err);
        setIsListening(false);
      };

      recog.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recog;
      setSpeechSupported(true);
    } catch (e) {
      console.warn('Speech recognition setup error:', e);
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [voiceLang]);

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
    } else {
      setIsListening(true);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // If already running or permission issue
        }
      }
    }
  };

  const handleApplyPreset = (text: string) => {
    setTranscript(text);
    playVoiceRecognitionChime();
  };

  const handleCommitToCart = () => {
    if (!parseResult) return;

    if (parseResult.intent === 'CLEAR_CART' && onClearCart) {
      onClearCart();
      playVoiceRecognitionChime();
      onClose();
      return;
    }

    if (parseResult.items.length > 0) {
      const payload = parseResult.items.map((it) => ({
        variantId: it.matchedVariantId,
        quantity: it.quantity,
      }));
      onAddItemsToCart(payload);
      playVoiceRecognitionChime();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in font-sans">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800"
        data-testid="voice-billing-modal"
      >
        {/* Header Strip */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-white/10 bg-white/5">
              <Mic className="h-4 w-4 text-copper-400" strokeWidth={1.75} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight">
                  {t('తెలుగు వాయిస్ బిల్లింగ్ అసిస్టెంట్', 'Telugu Voice Billing Assistant', 'तेलुगु वॉइस बिलिंग सहायक')}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {t('ఆఫ్‌లైన్ స్పీచ్ కోర్', 'OFFLINE NLP CORE', 'ऑफ़लाइन एनएलपी')}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {t(
                  'సరుకుల పేర్లు మాట్లాడండి — నేరుగా బిల్లులో చేరుతుంది',
                  'Speak Telugu / English grocery items — straight into the cart',
                  'किराना सामान बोलें — सीधे कार्ट में जुड़ जाएगा'
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            data-testid="voice-modal-close-btn"
            aria-label={t('మూసివేయి', 'Close', 'बंद करें')}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-white/10 text-stone-300 transition-colors hover:border-copper-500/40 hover:text-copper-400 active:scale-95"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 bg-slate-50/50">
          
          {/* Audio Visualizer & Mic Control Strip */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center space-y-4">
            
            {/* Language Switcher Pill */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setVoiceLang('te-IN')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  voiceLang === 'te-IN'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🇮🇳</span>
                <span>తెలుగు (Telugu)</span>
              </button>
              <button
                type="button"
                onClick={() => setVoiceLang('en-IN')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  voiceLang === 'en-IN'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🇬🇧</span>
                <span>English (India)</span>
              </button>
            </div>

            {!speechSupported && (
              <div className="w-full p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs text-center font-medium">
                <span className="inline-flex items-center justify-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" strokeWidth={1.75} />
                  <span>
                    {t('ఈ బ్రౌజర్‌లో మైక్రోఫోన్ వాయిస్ రికగ్నిషన్ అందుబాటులో లేదు. కింద ఉన్న ప్రీసెట్‌లను వాడండి లేదా టెక్స్ట్ టైప్ చేయండి.', 'Web Speech API not supported in this browser. Use presets or type text.')}
                  </span>
                </span>
              </div>
            )}

            {/* Pulsing Mic Button */}
            <div className="relative">
              {isListening && (
                <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-60" />
              )}
              <button
                onClick={toggleListening}
                data-testid="btn-toggle-mic"
                className={`relative w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl shadow-lg transition-all active:scale-95 ${
                  isListening
                    ? 'bg-red-600 hover:bg-red-700 ring-4 ring-red-200'
                    : 'bg-blue-600 hover:bg-blue-700 ring-4 ring-blue-100'
                }`}
                title={isListening ? 'Stop Listening' : 'Start Listening'}
              >
                {isListening ? <Mic className="w-7 h-7" /> : <MicOff className="w-7 h-7" />}
              </button>
            </div>

            {/* Listening Status & Waveform Simulation */}
            <div className="text-center space-y-1">
              <div className="text-xs font-bold flex items-center justify-center space-x-1.5">
                <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-ping' : 'bg-slate-400'}`} />
                <span className={isListening ? 'text-red-700' : 'text-slate-600'}>
                  {isListening
                    ? t('మైక్ ఆన్‌లో ఉంది... సరుకుల పేర్లు మాట్లాడండి', 'Listening... Speak grocery items now', 'माइक चालू है... सामान बोलें')
                    : t('మైక్ ఆపబడింది — మాట్లాడటానికి మైక్ క్లిక్ చేయండి', 'Mic Idle — Click mic to start speaking', 'माइक बंद है — बोलने के लिए क्लिक करें')}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {t(
                  'ఉదాహరణ: "ఒక లీటర్ ఫ్రీడమ్ నూనె, రెండు కేజీల చక్కెర బిల్లు చెయ్యి"',
                  'Example: "1L Freedom Oil, 2kg Sugar, 1 Tata Salt"',
                  'उदाहरण: "एक पैकेट तेल और एक पैकेट नमक बिल करो"'
                )}
              </p>
            </div>

            {/* Oscillating Audio Wave Simulation */}
            <div className="flex items-center justify-center space-x-1 h-6">
              {[4, 12, 18, 24, 16, 8, 20, 26, 14, 6].map((h, idx) => (
                <div
                  key={idx}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isListening ? 'bg-blue-600 animate-pulse' : 'bg-slate-200'
                  }`}
                  style={{
                    height: isListening ? `${Math.max(4, (h * (idx % 2 === 0 ? 1 : 1.2)))}px` : '4px',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Quick Voice Spoken Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center space-x-1">
                <AudioLines className="w-3.5 h-3.5 text-blue-600" />
                <span>{t('తక్షణ వాయిస్ ప్రీసెట్‌లు', 'Instant Speech Presets', 'त्वरित वॉइस प्रीसेट')}</span>
              </span>
              <span className="text-[10px] text-slate-400">
                {t('పరీక్ష కోసం క్లిక్ చేయండి', 'Click to simulate spoken command', 'अनुकरण के लिए क्लिक करें')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {VOICE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplyPreset(preset.text)}
                  data-testid={`btn-voice-preset-${idx}`}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-blue-50/70 hover:border-blue-300 text-left transition flex items-center justify-between group active:scale-95 shadow-xs"
                >
                  <div className="flex items-center space-x-2">
                    <Mic className="h-3.5 w-3.5 shrink-0 text-stone-500" strokeWidth={1.5} />
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-700">
                      {preset.labelTe}
                    </span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-stone-300 transition-colors group-hover:text-copper-700" strokeWidth={1.75} />
                </button>
              ))}
            </div>
          </div>

          {/* Editable Live Speech Transcript Box */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>{t('లైవ్ స్పీచ్ ట్రాన్స్‌క్రిప్ట్ (Spoken Text)', 'Live Spoken Transcript', 'लाइव टेक्स्ट')}</span>
              <button
                onClick={() => setTranscript('')}
                className="text-[11px] text-slate-400 hover:text-slate-700"
              >
                {t('తుడిపివేయి', 'Clear', 'मिटाएं')}
              </button>
            </div>
            
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              data-testid="voice-transcript-input"
              rows={2}
              placeholder={t(
                'సరుకుల వివరాలను మాట్లాడండి లేదా ఇక్కడ టైప్ చేయండి...',
                'Speak or type grocery items here in Telugu or English...',
                'सामान का विवरण बोलें या यहाँ टाइप करें...'
              )}
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-medium text-slate-900 resize-none outline-none transition"
            />
          </div>

          {/* Extracted Items Preview Box */}
          {parseResult && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                  <ShoppingCart className="h-3.5 w-3.5" strokeWidth={1.75} />
                  <span>{t('గుర్తించిన వస్తువులు (Extracted Cart Items)', 'Detected Cart Items', 'पहचाने गए सामान')}</span>
                  <span className="px-2 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-700 font-bold">
                    {parseResult.items.length}
                  </span>
                </h4>

                {parseResult.items.length > 0 && (
                  <span className="text-xs font-bold text-emerald-600">
                    {t('మొత్తం:', 'Total:', 'योग:')}{' '}
                    {formatPaise(
                      parseResult.items.reduce((sum, it) => sum + Math.round(it.quantity * it.sellingPricePaise), 0)
                    )}
                  </span>
                )}
              </div>

              {parseResult.items.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  {t(
                    'ఇంకా వస్తువులు గుర్తించబడలేదు. దయచేసి స్పష్టంగా మాట్లాడండి.',
                    'No matching inventory items detected yet. Please speak clearly.',
                    'सामान पहचाना नहीं गया। कृपया स्पष्ट बोलें।'
                  )}
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50">
                  {parseResult.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 flex items-center justify-between text-xs bg-white hover:bg-blue-50/40 transition"
                      data-testid={`extracted-voice-item-${idx}`}
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                          <span>{item.matchedProductNameTe}</span>
                          <span className="text-[10px] font-normal text-slate-400">
                            ({item.matchedProductNameEn})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {t('గుర్తించిన పదాలు:', 'Heard:', 'सुना:')} "{item.rawText}" •{' '}
                          <span className="text-emerald-600 font-bold">
                            {(item.confidence * 100).toFixed(0)}% Match
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-slate-800">
                          {item.quantity} {item.unit} × {formatPaise(item.sellingPricePaise)}
                        </div>
                        <div className="text-xs font-bold text-blue-700">
                          {formatPaise(Math.round(item.quantity * item.sellingPricePaise))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition active:scale-95"
          >
            {t('రద్దు చేయి', 'Cancel', 'रद्द करें')}
          </button>

          <button
            onClick={handleCommitToCart}
            disabled={!parseResult || parseResult.items.length === 0}
            data-testid="btn-commit-voice-cart"
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-bold transition flex items-center space-x-2 shadow-sm active:scale-95"
          >
            <ShoppingCart className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span>{t('బిల్లు కార్ట్‌లోకి జోడించు', 'Add Items to Cart', 'कार्ट में जोड़ें')}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
