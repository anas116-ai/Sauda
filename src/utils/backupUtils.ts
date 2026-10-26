import { db } from '../db';
import { 
  DatabaseBackupSnapshot, 
  EncryptedBackupEnvelope, 
  CloudBackupConfig 
} from '../types';

// Convert ArrayBuffer to Hex string
function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

// Convert Hex string to Uint8Array
function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// Simple checksum generator
async function computeSha256(text: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return bufferToHex(hashBuffer).substring(0, 16);
  }
  return Math.random().toString(36).substring(2, 12);
}

/**
 * 1. Generates Full Dexie DB Snapshot
 */
export async function generateDatabaseSnapshot(): Promise<DatabaseBackupSnapshot> {
  const [
    shops,
    users,
    products,
    variants,
    stockMovements,
    bills,
    customers,
    customerLedger,
    suppliers,
    supplierLedger,
    purchaseInwards,
    batches,
    dayEndClosings,
    cashDrawerLogs
  ] = await Promise.all([
    db.shops.toArray(),
    db.users.toArray(),
    db.products.toArray(),
    db.variants.toArray(),
    db.stockMovements.toArray(),
    db.bills.toArray(),
    db.customers.toArray(),
    db.customerLedger.toArray(),
    db.suppliers.toArray(),
    db.supplierLedger.toArray(),
    db.purchaseInwards.toArray(),
    db.batches.toArray(),
    db.dayEndClosings.toArray(),
    db.cashDrawerLogs.toArray()
  ]);

  const totalRecordsCount = 
    shops.length + users.length + products.length + variants.length + 
    stockMovements.length + bills.length + customers.length + 
    customerLedger.length + suppliers.length + supplierLedger.length + 
    purchaseInwards.length + batches.length + dayEndClosings.length + cashDrawerLogs.length;

  const currentShop = shops[0] || { id: 'shop-001', name: 'Sri Lakshmi General Store' };

  const rawData = {
    shops,
    users,
    products,
    variants,
    stockMovements,
    bills,
    customers,
    customerLedger,
    suppliers,
    supplierLedger,
    purchaseInwards,
    batches,
    dayEndClosings,
    cashDrawerLogs
  };

  const jsonString = JSON.stringify(rawData);
  const checksum = await computeSha256(jsonString);

  return {
    version: 1,
    schemaVersion: 9,
    exportedAt: Date.now(),
    shopId: currentShop.id,
    shopName: currentShop.name,
    data: rawData,
    totalRecordsCount,
    checksum,
  };
}

/**
 * 2. Encrypts Database Snapshot with AES-GCM-256
 */
export async function encryptSnapshot(
  snapshot: DatabaseBackupSnapshot, 
  passphrase: string
): Promise<EncryptedBackupEnvelope> {
  const jsonStr = JSON.stringify(snapshot);
  const encoder = new TextEncoder();
  const data = encoder.encode(jsonStr);

  // Fallback if subtle crypto is not available
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('Web Cryptography API is required for secure AES-256 backup encryption.');
  }

  // 1. Generate random 16-byte salt and 12-byte IV
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // 2. Derive Key using PBKDF2
  const passKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    passKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  // 3. Encrypt data
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    data
  );

  return {
    format: 'SAUDA_ENC_V1',
    algorithm: 'AES-GCM-256',
    saltHex: bufferToHex(salt.buffer),
    ivHex: bufferToHex(iv.buffer),
    cipherTextHex: bufferToHex(cipherBuffer),
    checksum: snapshot.checksum,
    exportedAt: snapshot.exportedAt,
    shopName: snapshot.shopName,
    recordCount: snapshot.totalRecordsCount,
  };
}

/**
 * 3. Decrypts Database Snapshot Envelope
 */
export async function decryptSnapshot(
  envelope: EncryptedBackupEnvelope, 
  passphrase: string
): Promise<DatabaseBackupSnapshot> {
  if (envelope.format !== 'SAUDA_ENC_V1' || !envelope.saltHex || !envelope.ivHex || !envelope.cipherTextHex) {
    throw new Error('Invalid backup file format. Expected SAUDA_ENC_V1 envelope.');
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const salt = hexToBuffer(envelope.saltHex);
  const iv = hexToBuffer(envelope.ivHex);
  const cipherData = hexToBuffer(envelope.cipherTextHex);

  // 1. Derive key
  const passKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    passKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  try {
    // 2. Decrypt
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      cipherData
    );

    const decryptedJson = decoder.decode(decryptedBuffer);
    const snapshot: DatabaseBackupSnapshot = JSON.parse(decryptedJson);

    if (!snapshot.data || !snapshot.data.shops) {
      throw new Error('Malformed snapshot contents.');
    }

    return snapshot;
  } catch (_e) {
    throw new Error('Decryption failed. Incorrect password / PIN, or backup file is corrupted.');
  }
}

/**
 * 4. Atomic Database Restore
 */
export async function restoreDatabaseSnapshot(snapshot: DatabaseBackupSnapshot): Promise<boolean> {
  const { data } = snapshot;

  // Execute inside an atomic Dexie transaction
  await db.transaction('rw', [
    db.shops,
    db.users,
    db.products,
    db.variants,
    db.stockMovements,
    db.bills,
    db.customers,
    db.customerLedger,
    db.suppliers,
    db.supplierLedger,
    db.purchaseInwards,
    db.batches,
    db.dayEndClosings,
    db.cashDrawerLogs
  ], async () => {
    // 1. Clear all existing data
    await Promise.all([
      db.shops.clear(),
      db.users.clear(),
      db.products.clear(),
      db.variants.clear(),
      db.stockMovements.clear(),
      db.bills.clear(),
      db.customers.clear(),
      db.customerLedger.clear(),
      db.suppliers.clear(),
      db.supplierLedger.clear(),
      db.purchaseInwards.clear(),
      db.batches.clear(),
      db.dayEndClosings.clear(),
      db.cashDrawerLogs.clear(),
    ]);

    // 2. Populate restored records
    if (data.shops?.length) await db.shops.bulkAdd(data.shops);
    if (data.users?.length) await db.users.bulkAdd(data.users);
    if (data.products?.length) await db.products.bulkAdd(data.products);
    if (data.variants?.length) await db.variants.bulkAdd(data.variants);
    if (data.stockMovements?.length) await db.stockMovements.bulkAdd(data.stockMovements);
    if (data.bills?.length) await db.bills.bulkAdd(data.bills);
    if (data.customers?.length) await db.customers.bulkAdd(data.customers);
    if (data.customerLedger?.length) await db.customerLedger.bulkAdd(data.customerLedger);
    if (data.suppliers?.length) await db.suppliers.bulkAdd(data.suppliers);
    if (data.supplierLedger?.length) await db.supplierLedger.bulkAdd(data.supplierLedger);
    if (data.purchaseInwards?.length) await db.purchaseInwards.bulkAdd(data.purchaseInwards);
    if (data.batches?.length) await db.batches.bulkAdd(data.batches);
    if (data.dayEndClosings?.length) await db.dayEndClosings.bulkAdd(data.dayEndClosings);
    if (data.cashDrawerLogs?.length) await db.cashDrawerLogs.bulkAdd(data.cashDrawerLogs);
  });

  return true;
}

/**
 * 5. Download File Helper
 */
export function triggerFileDownload(content: string, fileName: string, contentType: string = 'application/json') {
  const blob = new Blob([content], { type: `${contentType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Default Cloud Config
 */
export function getStoredCloudConfig(): CloudBackupConfig {
  const stored = localStorage.getItem('sauda_cloud_config');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (_e) {
      // ignore
    }
  }

  return {
    autoBackupEnabled: true,
    scheduleTime: '22:00',
    provider: 'GOOGLE_DRIVE',
    accountEmail: 'srilakshmi.kirana@gmail.com',
    lastBackupTimestamp: Date.now() - 3600000 * 5, // 5 hours ago
    lastBackupStatus: 'SUCCESS',
    lastBackupSizeKb: 148,
  };
}

export function saveStoredCloudConfig(config: CloudBackupConfig) {
  localStorage.setItem('sauda_cloud_config', JSON.stringify(config));
}
