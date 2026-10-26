import { Product, ProductVariant, ParsedVoiceItem, VoiceBillingParseResult } from '../types';

// Telugu Numbers Mapping
const TELUGU_NUMBERS: Record<string, number> = {
  'ఒక': 1,
  'ఒకటి': 1,
  'రెండు': 2,
  'మూడు': 3,
  'నాలుగు': 4,
  'ఐదు': 5,
  'ఆరు': 6,
  'ఏడు': 7,
  'ఎనిమిది': 8,
  'తొమ్మిది': 9,
  'పది': 10,
  'అర': 0.5,
  'పావు': 0.25,
  'ముప్పావు': 0.75,
  'ఒకటిన్నర': 1.5,
  'రెండున్నర': 2.5,
};

// Hindi Numbers Mapping
const HINDI_NUMBERS: Record<string, number> = {
  'एक': 1,
  'दो': 2,
  'तीन': 3,
  'चार': 4,
  'पांच': 5,
  'पाँच': 5,
  'छह': 6,
  'सात': 7,
  'आठ': 8,
  'नौ': 9,
  'दस': 10,
  'आधा': 0.5,
  'डेढ़': 1.5,
  'ढाई': 2.5,
};

// English Numbers Mapping
const ENGLISH_NUMBERS: Record<string, number> = {
  'one': 1,
  'two': 2,
  'three': 3,
  'four': 4,
  'five': 5,
  'six': 6,
  'seven': 7,
  'eight': 8,
  'nine': 9,
  'ten': 10,
  'half': 0.5,
  'quarter': 0.25,
};

// Product Search Alias Dictionary
const PRODUCT_ALIASES: { keywords: string[]; skuMatches: string[] }[] = [
  {
    keywords: ['ఫ్రీడమ్', 'సన్‌ఫ్లవర్', 'నూనె', 'ఆయిల్', 'freedom', 'sunflower', 'oil', 'tel', 'meetha tel'],
    skuMatches: ['FREE-OIL-1L', 'OIL-FREEDOM-1L'],
  },
  {
    keywords: ['టాటా', 'ఉప్పు', 'సాల్ట్', 'tata', 'salt', 'namak', 'tata salt'],
    skuMatches: ['TATA-SALT-1KG', 'SALT-TATA-1KG'],
  },
  {
    keywords: ['ఆశీర్వాద్', 'ఆటా', 'పిండి', 'గోధుమ', 'aashirvaad', 'atta', 'flour', 'wheat', 'gehu ka aata'],
    skuMatches: ['AASH-ATTA-10KG', 'AASH-ATTA-5KG', 'ATTA-AASH-10KG', 'ATTA-AASH-5KG'],
  },
  {
    keywords: ['లైఫ్‌బాయ్', 'సబ్బు', 'సోప్', 'lifebuoy', 'soap', 'sabun'],
    skuMatches: ['LIFE-SOAP-125G', 'SOAP-LIFE-125G'],
  },
  {
    keywords: ['చక్కెర', 'పంచదార', 'చక్కర', 'sugar', 'cheeni', 'shakkar'],
    skuMatches: ['SUGAR-LOOSE-1KG', 'LOOSE-SUGAR-1KG', 'SUGAR-1KG'],
  },
  {
    keywords: ['కందిపప్పు', 'పప్పు', 'toor dal', 'arhar dal', 'dal', 'kandipappu'],
    skuMatches: ['DAL-TOOR-1KG', 'LOOSE-TOOR-DAL-1KG', 'TOOR-DAL-1KG'],
  },
  {
    keywords: ['బియ్యం', 'సోనా మసూరి', 'రైస్', 'rice', 'chawal', 'sona masoori'],
    skuMatches: ['RICE-SONA-25KG', 'RICE-SONA-LOOSE', 'LOOSE-RICE-1KG', 'var-loose-rice'],
  },
  {
    keywords: ['ఉల్లిపాయలు', 'ఉల్లిగడ్డలు', 'ఉల్లి', 'onion', 'onions', 'pyaz', 'kanda'],
    skuMatches: ['ONION-LOOSE-1KG', 'LOOSE-ONION-1KG', 'ONION-1KG'],
  },
  {
    keywords: ['మ్యాగీ', 'నూడుల్స్', 'maggi', 'noodles'],
    skuMatches: ['MAGGI-70G', 'MAGGI-NOODLES-70G'],
  },
  {
    keywords: ['కోల్గేట్', 'పేస్ట్', 'టూత్‌పేస్ట్', 'colgate', 'paste', 'toothpaste'],
    skuMatches: ['COLG-PASTE-150G'],
  },
  {
    keywords: ['టీ', 'టీ పొడి', 'టీపొడి', 'చాయ్', 'tea', 'chai', 'red label'],
    skuMatches: ['RED-TEA-250G', 'TEA-RED-250G'],
  },
  {
    keywords: ['పాలు', 'మిల్క్', 'milk', 'doodh', 'amul'],
    skuMatches: ['AMUL-MILK-500ML'],
  },
  {
    keywords: ['కారం', 'మిరపపొడి', 'కారం పొడి', 'chilli powder', 'mirchi powder'],
    skuMatches: ['CHILLI-POWDER-200G'],
  },
  {
    keywords: ['పసుపు', 'turmeric', 'haldi'],
    skuMatches: ['TURMERIC-100G'],
  },
];

export const VOICE_PRESETS = [
  {
    lang: 'te',
    text: 'ఒక లీటర్ ఫ్రీడమ్ నూనె, ఒక కేజీ టాటా ఉప్పు',
    labelTe: '1L నూనె + 1kg ఉప్పు',
    labelEn: '1L Oil + 1kg Salt',
    labelHi: '1L तेल + 1kg नमक',
  },
  {
    lang: 'te',
    text: 'పది కేజీల ఆశీర్వాద్ గోధుమ పిండి, రెండు లైఫ్‌బాయ్ సబ్బులు',
    labelTe: '10kg ఆటా + 2 సబ్బులు',
    labelEn: '10kg Atta + 2 Soaps',
    labelHi: '10kg आटा + 2 साबुन',
  },
  {
    lang: 'te',
    text: 'రెండు కిలోల విడి చక్కెర, ఒక కిలో విడి కందిపప్పు',
    labelTe: '2kg చక్కెర + 1kg కందిపప్పు',
    labelEn: '2kg Sugar + 1kg Toor Dal',
    labelHi: '2kg चीनी + 1kg अरहर दाल',
  },
  {
    lang: 'en',
    text: '2 packets Freedom Oil, 1 kg Tata Salt',
    labelTe: '2 ప్యాకెట్లు నూనె + 1kg ఉప్పు (ఇంగ్లీష్)',
    labelEn: '2x Oil + 1x Salt (English)',
    labelHi: '2 पैकेट तेल + 1kg नमक (अंग्रेजी)',
  },
  {
    lang: 'hi',
    text: 'दो पैकेट तेल और एक पैकेट नमक बिल करो',
    labelTe: '2 నూనె + 1 ఉప్పు (హిందీ)',
    labelEn: '2x Oil + 1x Salt (Hindi)',
    labelHi: '2 पैकेट तेल + 1 नमक (हिंदी)',
  },
];

/**
 * Parses spoken retail transcript into structured cart items and intents
 */
export function parseVoiceQuery(
  transcript: string,
  products: Product[],
  variants: ProductVariant[],
  appLang: 'te' | 'en' | 'hi' = 'te'
): VoiceBillingParseResult {
  const clean = transcript.trim().toLowerCase();
  
  // 1. Detect Commands / Intents
  if (/(క్లియర్|ఖాలీ|క్లీన్|clear cart|empty cart|हटाओ|खाली)/i.test(clean)) {
    return {
      transcript,
      detectedLanguage: appLang === 'te' ? 'te-IN' : (appLang === 'hi' ? 'hi-IN' : 'en-IN'),
      items: [],
      intent: 'CLEAR_CART',
      unmatchedPhrases: [],
    };
  }

  if (/(నగదు బిల్లు|క్యాష్ చెల్లింపు|pay cash|cash checkout|नकद बिल)/i.test(clean)) {
    return {
      transcript,
      detectedLanguage: appLang === 'te' ? 'te-IN' : (appLang === 'hi' ? 'hi-IN' : 'en-IN'),
      items: [],
      intent: 'CHECKOUT_CASH',
      unmatchedPhrases: [],
    };
  }

  if (/(యూపీఐ చెల్లింపు|క్యూఆర్ కోడ్|pay upi|qr pay|यूपीआई भुगतान)/i.test(clean)) {
    return {
      transcript,
      detectedLanguage: appLang === 'te' ? 'te-IN' : (appLang === 'hi' ? 'hi-IN' : 'en-IN'),
      items: [],
      intent: 'CHECKOUT_UPI',
      unmatchedPhrases: [],
    };
  }

  // 2. Split into item clauses
  // Separators: comma, 'మరియు', 'మరి', 'ఇంకా', 'and', 'aur', 'plus', '+'
  const clauses = clean
    .split(/,| మరియు | ఇంకా | మరి | and | aur | plus |\+/)
    .map(c => c.trim())
    .filter(c => c.length > 0);

  const parsedItems: ParsedVoiceItem[] = [];
  const unmatchedPhrases: string[] = [];

  for (const clause of clauses) {
    let quantity = 1;
    let detectedUnit = 'PCS';

    // A. Parse Numbers
    // Check digits first: e.g. "2 kg", "10 kg", "1.5"
    const digitMatch = clause.match(/(\d+(\.\d+)?)/);
    if (digitMatch) {
      quantity = parseFloat(digitMatch[1]);
    } else {
      // Check Telugu words
      for (const [word, val] of Object.entries(TELUGU_NUMBERS)) {
        if (clause.includes(word)) {
          quantity = val;
          break;
        }
      }
      // Check Hindi words
      for (const [word, val] of Object.entries(HINDI_NUMBERS)) {
        if (clause.includes(word)) {
          quantity = val;
          break;
        }
      }
      // Check English words
      for (const [word, val] of Object.entries(ENGLISH_NUMBERS)) {
        if (clause.includes(word)) {
          quantity = val;
          break;
        }
      }
    }

    // B. Parse Units
    if (/(కేజీ|కిలో|kg|kilo|kilos)/i.test(clause)) detectedUnit = 'KG';
    else if (/(లీటర్|liter|litre|lt|l)/i.test(clause)) detectedUnit = 'L';
    else if (/(గ్రాములు|గ్రాం|grams|gm|g)/i.test(clause)) detectedUnit = 'G';
    else if (/(ప్యాకెట్|packet|pack|డబ్బా|pcs)/i.test(clause)) detectedUnit = 'PACK';

    // C. Match Product in Inventory
    let matchedVariant: ProductVariant | null = null;
    let matchedProduct: Product | null = null;
    let confidence = 0.5;

    // Search via Product Alias Dictionary first
    for (const entry of PRODUCT_ALIASES) {
      const hasKeyword = entry.keywords.some(kw => clause.includes(kw));
      if (hasKeyword) {
        // Find variant matching sku
        const candidateVar = variants.find(v => entry.skuMatches.includes(v.sku));
        if (candidateVar) {
          matchedVariant = candidateVar;
          matchedProduct = products.find(p => p.id === candidateVar.productId) || null;
          confidence = 0.95;
          break;
        }
      }
    }

    // Fallback: Direct text matching against product names
    if (!matchedVariant) {
      for (const prod of products) {
        const nameEn = prod.nameEn.toLowerCase();
        const nameTe = prod.nameTe.toLowerCase();
        
        const words = clause.split(/\s+/);
        const matchesSome = words.some(w => w.length > 2 && (nameEn.includes(w) || nameTe.includes(w)));
        if (matchesSome) {
          const prodVars = variants.filter(v => v.productId === prod.id);
          if (prodVars.length > 0) {
            matchedVariant = prodVars[0];
            matchedProduct = prod;
            confidence = 0.75;
            break;
          }
        }
      }
    }

    if (matchedVariant && matchedProduct) {
      parsedItems.push({
        rawText: clause,
        matchedVariantId: matchedVariant.id,
        matchedProductId: matchedProduct.id,
        matchedProductNameEn: matchedProduct.nameEn,
        matchedProductNameTe: matchedProduct.nameTe,
        quantity,
        unit: detectedUnit,
        sellingPricePaise: matchedVariant.sellingPricePaise,
        confidence,
      });
    } else {
      unmatchedPhrases.push(clause);
    }
  }

  return {
    transcript,
    detectedLanguage: appLang === 'te' ? 'te-IN' : (appLang === 'hi' ? 'hi-IN' : 'en-IN'),
    items: parsedItems,
    intent: 'ADD_TO_CART',
    unmatchedPhrases,
  };
}

/**
 * Synthesize offline chime when voice command succeeds
 */
export function playVoiceRecognitionChime(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, ctx.currentTime);         // A5
    osc1.frequency.setValueAtTime(1320, ctx.currentTime + 0.08); // E6

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(440, ctx.currentTime);
    osc2.frequency.setValueAtTime(660, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.25);
    osc2.stop(ctx.currentTime + 0.25);
  } catch (err) {
    // Non-blocking Web Audio fallback
  }
}
