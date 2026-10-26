import { CounterTerminalConfig, ActiveCounterStatus, LiveCartLock, MultiCounterConsolidation, Bill } from '../types';

const STORAGE_KEY_CONFIG = 'sauda_counter_config';
const STORAGE_KEY_PEERS = 'sauda_active_counters';
const STORAGE_KEY_LOCKS = 'sauda_cart_locks';

export const DEFAULT_COUNTER_CONFIG: CounterTerminalConfig = {
  terminalId: 'TRM-C01',
  counterNumber: 1,
  counterName: 'కౌంటర్ 1 - మెయిన్ ఎక్స్‌ప్రెస్ (Main Express)',
  counterPrefix: 'BL-C1',
  role: 'PRIMARY_SERVER',
  serverHostIp: '192.168.1.10:5173',
  currentCashierName: 'రమేష్ (Ramesh)',
  isActive: true,
  nextBillSeq: 1,
  allowOfflineAutonomousBilling: true,
  autoSyncBillsOnFinalize: true,
  cartLockEnabled: true,
};

export const PRESET_COUNTERS = [
  {
    counterNumber: 1,
    counterName: 'కౌంటర్ 1 - మెయిన్ ఎక్స్‌ప్రెస్ (Main Express)',
    counterPrefix: 'BL-C1',
    role: 'PRIMARY_SERVER' as const,
    cashierName: 'రమేష్ (Ramesh) - Head Cashier',
  },
  {
    counterNumber: 2,
    counterName: 'కౌంటర్ 2 - కిరాణా & స్టేపుల్స్ (Grocery Staples)',
    counterPrefix: 'BL-C2',
    role: 'SATELLITE_TERMINAL' as const,
    cashierName: 'సురేష్ (Suresh) - Cashier',
  },
  {
    counterNumber: 3,
    counterName: 'కౌంటర్ 3 - డెయిరీ & క్విక్ చెకౌట్ (Dairy & Quick)',
    counterPrefix: 'BL-C3',
    role: 'SATELLITE_TERMINAL' as const,
    cashierName: 'ప్రియా (Priya) - Cashier',
  },
  {
    counterNumber: 4,
    counterName: 'గోడౌన్ మొబైల్ టెర్మినల్ (Godown Mobile Helper)',
    counterPrefix: 'BL-G1',
    role: 'SATELLITE_TERMINAL' as const,
    cashierName: 'వెంకట్ (Venkat) - Stock Incharge',
  },
];

/**
 * Get current counter terminal configuration
 */
export function getCounterTerminalConfig(): CounterTerminalConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) {
      return { ...DEFAULT_COUNTER_CONFIG, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('Failed to read counter terminal config', err);
  }
  saveCounterTerminalConfig(DEFAULT_COUNTER_CONFIG);
  return DEFAULT_COUNTER_CONFIG;
}

/**
 * Save updated counter terminal configuration
 */
export function saveCounterTerminalConfig(config: CounterTerminalConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel('sauda_multi_counter_bus');
      bc.postMessage({ type: 'CONFIG_UPDATED', config });
      bc.close();
    }
  } catch (err) {
    console.error('Failed to save counter terminal config', err);
  }
}

/**
 * Generate next non-colliding counter bill number
 */
export function generateNextCounterBillNumber(currentConfig?: CounterTerminalConfig): string {
  const cfg = currentConfig || getCounterTerminalConfig();
  const seq = cfg.nextBillSeq || 1;
  const billNumber = `${cfg.counterPrefix}-${seq.toString().padStart(5, '0')}`;
  
  // Increment sequence
  cfg.nextBillSeq = seq + 1;
  saveCounterTerminalConfig(cfg);
  
  return billNumber;
}

/**
 * Get list of active counters in the store network
 */
export function getActiveCountersList(): ActiveCounterStatus[] {
  const currentConfig = getCounterTerminalConfig();
  const now = Date.now();
  
  let peerCounters: ActiveCounterStatus[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PEERS);
    if (raw) {
      peerCounters = JSON.parse(raw);
    }
  } catch (e) {
    // fallback
  }

  // Ensure default simulated counters exist for realistic shop multi-lane demonstration
  if (peerCounters.length === 0) {
    peerCounters = [
      {
        terminalId: 'TRM-C02',
        counterNumber: 2,
        counterName: 'కౌంటర్ 2 - కిరాణా & స్టేపుల్స్ (Grocery Staples)',
        role: 'SATELLITE_TERMINAL',
        ipAddress: '192.168.1.15:5173',
        cashierName: 'సురేష్ (Suresh)',
        status: 'ONLINE_BILLING',
        lastHeartbeat: now - 3500,
        activeCartItemsCount: 3,
        todayBillsCount: 28,
        todayTurnoverPaise: 2485000,
        lastBillNumber: 'BL-C2-00028',
        lastBillTime: now - 120000,
      },
      {
        terminalId: 'TRM-C03',
        counterNumber: 3,
        counterName: 'కౌంటర్ 3 - డెయిరీ & క్విక్ చెకౌట్ (Dairy & Quick)',
        role: 'SATELLITE_TERMINAL',
        ipAddress: '192.168.1.22:5173',
        cashierName: 'ప్రియా (Priya)',
        status: 'CART_IN_PROGRESS',
        lastHeartbeat: now - 1200,
        activeCartItemsCount: 5,
        todayBillsCount: 36,
        todayTurnoverPaise: 1842000,
        lastBillNumber: 'BL-C3-00036',
        lastBillTime: now - 60000,
      },
      {
        terminalId: 'TRM-G01',
        counterNumber: 4,
        counterName: 'గోడౌన్ మొబైల్ టెర్మినల్ (Godown Mobile Helper)',
        role: 'SATELLITE_TERMINAL',
        ipAddress: '192.168.1.48:5173',
        cashierName: 'వెంకట్ (Venkat)',
        status: 'IDLE',
        lastHeartbeat: now - 14000,
        activeCartItemsCount: 0,
        todayBillsCount: 8,
        todayTurnoverPaise: 640000,
        lastBillNumber: 'BL-G1-00008',
        lastBillTime: now - 450000,
      },
    ];
    localStorage.setItem(STORAGE_KEY_PEERS, JSON.stringify(peerCounters));
  }

  // Current counter status
  const currentTerminalStatus: ActiveCounterStatus = {
    terminalId: currentConfig.terminalId,
    counterNumber: currentConfig.counterNumber,
    counterName: currentConfig.counterName,
    role: currentConfig.role,
    ipAddress: currentConfig.serverHostIp || '192.168.1.10:5173',
    cashierName: currentConfig.currentCashierName,
    status: 'ONLINE_BILLING',
    lastHeartbeat: now,
    activeCartItemsCount: 0,
    todayBillsCount: Math.max(0, currentConfig.nextBillSeq - 1),
    todayTurnoverPaise: (Math.max(0, currentConfig.nextBillSeq - 1)) * 48500, // estimated
    lastBillNumber: currentConfig.nextBillSeq > 1 ? `${currentConfig.counterPrefix}-${(currentConfig.nextBillSeq - 1).toString().padStart(5, '0')}` : undefined,
    lastBillTime: now - 180000,
  };

  // Filter out duplicate of current terminal
  const otherPeers = peerCounters.filter(p => p.terminalId !== currentConfig.terminalId && p.counterNumber !== currentConfig.counterNumber);
  
  return [currentTerminalStatus, ...otherPeers];
}

/**
 * Live Cart Locks (Stock collision protection across concurrent cashier lanes)
 */
export function getLiveCartLocks(): LiveCartLock[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOCKS);
    if (!raw) return [];
    const locks: LiveCartLock[] = JSON.parse(raw);
    const now = Date.now();
    // Filter out expired locks (TTL exceeded)
    const validLocks = locks.filter(l => l.expiresAt > now);
    if (validLocks.length !== locks.length) {
      localStorage.setItem(STORAGE_KEY_LOCKS, JSON.stringify(validLocks));
    }
    return validLocks;
  } catch (err) {
    return [];
  }
}

/**
 * Acquire stock reservation lock when adding item to cart
 */
export function acquireCartLock(
  variantId: string,
  productId: string,
  productName: string,
  quantityHeld: number,
  unit: string
): LiveCartLock {
  const currentConfig = getCounterTerminalConfig();
  const locks = getLiveCartLocks();
  const now = Date.now();
  const ttlMs = 5 * 60 * 1000; // 5 minutes TTL

  // Check if existing lock for this variant by this terminal
  const existingIdx = locks.findIndex(l => l.variantId === variantId && l.terminalId === currentConfig.terminalId);
  
  const lock: LiveCartLock = {
    id: `lock-${currentConfig.terminalId}-${variantId}-${now}`,
    terminalId: currentConfig.terminalId,
    counterNumber: currentConfig.counterNumber,
    counterName: currentConfig.counterName,
    variantId,
    productId,
    productName,
    quantityHeld,
    unit,
    lockedAt: now,
    expiresAt: now + ttlMs,
  };

  if (existingIdx >= 0) {
    locks[existingIdx] = lock;
  } else {
    locks.push(lock);
  }

  localStorage.setItem(STORAGE_KEY_LOCKS, JSON.stringify(locks));

  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    const bc = new BroadcastChannel('sauda_multi_counter_bus');
    bc.postMessage({ type: 'CART_LOCK_ACQUIRED', lock });
    bc.close();
  }

  return lock;
}

/**
 * Release stock lock for a variant
 */
export function releaseCartLock(variantId: string): void {
  const currentConfig = getCounterTerminalConfig();
  const locks = getLiveCartLocks();
  const filtered = locks.filter(l => !(l.variantId === variantId && l.terminalId === currentConfig.terminalId));
  localStorage.setItem(STORAGE_KEY_LOCKS, JSON.stringify(filtered));

  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    const bc = new BroadcastChannel('sauda_multi_counter_bus');
    bc.postMessage({ type: 'CART_LOCK_RELEASED', variantId, terminalId: currentConfig.terminalId });
    bc.close();
  }
}

/**
 * Release all locks held by current terminal (on checkout finalize or cart clear)
 */
export function releaseAllTerminalLocks(): void {
  const currentConfig = getCounterTerminalConfig();
  const locks = getLiveCartLocks();
  const filtered = locks.filter(l => l.terminalId !== currentConfig.terminalId);
  localStorage.setItem(STORAGE_KEY_LOCKS, JSON.stringify(filtered));

  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    const bc = new BroadcastChannel('sauda_multi_counter_bus');
    bc.postMessage({ type: 'ALL_TERMINAL_LOCKS_RELEASED', terminalId: currentConfig.terminalId });
    bc.close();
  }
}

/**
 * Check if an item is locked by any OTHER counter
 */
export function checkStockLockCollision(variantId: string): { isLockedByOther: boolean; totalLockedQty: number; holdingCounters: string[] } {
  const currentConfig = getCounterTerminalConfig();
  const locks = getLiveCartLocks();
  const otherLocks = locks.filter(l => l.variantId === variantId && l.terminalId !== currentConfig.terminalId);

  if (otherLocks.length === 0) {
    return { isLockedByOther: false, totalLockedQty: 0, holdingCounters: [] };
  }

  const totalLockedQty = otherLocks.reduce((acc, l) => acc + l.quantityHeld, 0);
  const holdingCounters = Array.from(new Set(otherLocks.map(l => l.counterName)));

  return { isLockedByOther: true, totalLockedQty, holdingCounters };
}

/**
 * Consolidate Multi-Counter Sales Turnover from Bills
 */
export function calculateMultiCounterConsolidation(bills: Bill[]): MultiCounterConsolidation {
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Counter tallies mapping
  const counterMap: Record<number, {
    counterNumber: number;
    counterName: string;
    terminalId: string;
    billsCount: number;
    cashSalesPaise: number;
    upiSalesPaise: number;
    khataSalesPaise: number;
    totalTurnoverPaise: number;
  }> = {
    1: { counterNumber: 1, counterName: 'కౌంటర్ 1 - మెయిన్ ఎక్స్‌ప్రెస్ (Main Express)', terminalId: 'TRM-C01', billsCount: 0, cashSalesPaise: 0, upiSalesPaise: 0, khataSalesPaise: 0, totalTurnoverPaise: 0 },
    2: { counterNumber: 2, counterName: 'కౌంటర్ 2 - కిరాణా & స్టేపుల్స్ (Grocery Staples)', terminalId: 'TRM-C02', billsCount: 0, cashSalesPaise: 0, upiSalesPaise: 0, khataSalesPaise: 0, totalTurnoverPaise: 0 },
    3: { counterNumber: 3, counterName: 'కౌంటర్ 3 - డెయిరీ & క్విక్ చెకౌట్ (Dairy & Quick)', terminalId: 'TRM-C03', billsCount: 0, cashSalesPaise: 0, upiSalesPaise: 0, khataSalesPaise: 0, totalTurnoverPaise: 0 },
    4: { counterNumber: 4, counterName: 'గోడౌన్ మొబైల్ టెర్మినల్ (Godown Mobile Helper)', terminalId: 'TRM-G01', billsCount: 0, cashSalesPaise: 0, upiSalesPaise: 0, khataSalesPaise: 0, totalTurnoverPaise: 0 },
  };

  let totalStoreTurnoverPaise = 0;
  let totalStoreBillsCount = 0;

  for (const bill of bills) {
    totalStoreBillsCount++;
    totalStoreTurnoverPaise += (bill.totalPaise || 0);

    // Determine counter from billNumber prefix
    let cNum = 1;
    if (bill.billNumber.includes('BL-C2') || bill.billNumber.includes('-C2-')) cNum = 2;
    else if (bill.billNumber.includes('BL-C3') || bill.billNumber.includes('-C3-')) cNum = 3;
    else if (bill.billNumber.includes('BL-G1') || bill.billNumber.includes('-G1-')) cNum = 4;
    else {
      // If legacy bill e.g. BL-00001, assign round robin or Counter 1
      cNum = 1;
    }

    const target = counterMap[cNum] || counterMap[1];
    target.billsCount++;
    target.totalTurnoverPaise += (bill.totalPaise || 0);

    if (bill.paymentMethod === 'CASH') {
      target.cashSalesPaise += (bill.totalPaise || 0);
    } else if (bill.paymentMethod === 'UPI') {
      target.upiSalesPaise += (bill.totalPaise || 0);
    } else if (bill.paymentMethod === 'KHATA') {
      target.khataSalesPaise += (bill.totalPaise || 0);
    } else {
      target.cashSalesPaise += (bill.totalPaise || 0);
    }
  }

  // If there are few or zero bills in DB for other counters, supplement with realistic store data for demo
  if (counterMap[2].billsCount === 0) {
    counterMap[2].billsCount = 14;
    counterMap[2].cashSalesPaise = 840000;
    counterMap[2].upiSalesPaise = 420000;
    counterMap[2].totalTurnoverPaise = 1260000;
  }
  if (counterMap[3].billsCount === 0) {
    counterMap[3].billsCount = 18;
    counterMap[3].cashSalesPaise = 620000;
    counterMap[3].upiSalesPaise = 530000;
    counterMap[3].totalTurnoverPaise = 1150000;
  }

  const countersArray = Object.values(counterMap);
  const consolidatedTotal = countersArray.reduce((acc, c) => acc + c.totalTurnoverPaise, 0);
  const consolidatedBills = countersArray.reduce((acc, c) => acc + c.billsCount, 0);

  return {
    reportDate: todayStr,
    counters: countersArray,
    totalStoreTurnoverPaise: consolidatedTotal,
    totalStoreBillsCount: consolidatedBills,
  };
}
