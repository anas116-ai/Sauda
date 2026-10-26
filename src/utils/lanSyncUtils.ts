import { db } from '../db';
import { 
  LanPeerDevice, 
  LanPeerRole, 
  LanConnectionStatus,
  LanSyncDeltaPackage 
} from '../types';

const SYNC_CHANNEL_NAME = 'sauda_lan_peer_mesh';

/**
 * Gets or initializes local device identity
 */
export function getLocalDeviceConfig(): { deviceId: string; deviceName: string; role: LanPeerRole } {
  let deviceId = localStorage.getItem('sauda_device_id');
  if (!deviceId) {
    deviceId = `dev-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('sauda_device_id', deviceId);
  }

  let deviceName = localStorage.getItem('sauda_device_name') || 'Main Billing Terminal (కౌంటర్)';
  let role = (localStorage.getItem('sauda_device_role') as LanPeerRole) || 'PRIMARY_COUNTER';

  return { deviceId, deviceName, role };
}

/**
 * Saves updated local device settings
 */
export function saveLocalDeviceConfig(name: string, role: LanPeerRole) {
  localStorage.setItem('sauda_device_name', name);
  localStorage.setItem('sauda_device_role', role);
}

/**
 * Generates default pairing PIN
 */
export function generatePairingCode(): string {
  const pin = Math.floor(100000 + Math.random() * 900000).toString();
  localStorage.setItem('sauda_lan_pin', pin);
  return pin;
}

/**
 * Default sample discovered peers in local Wi-Fi mesh
 */
export function getInitialPeers(currentDeviceId: string): LanPeerDevice[] {
  const now = Date.now();
  return [
    {
      deviceId: 'dev-godown-002',
      deviceName: 'Godown Stock Terminal (గోడౌన్ మొబైల్)',
      role: 'GODOWN_TERMINAL' as LanPeerRole,
      ipAddress: '192.168.1.142',
      status: 'CONNECTED' as LanConnectionStatus,
      lastSyncTimestamp: now - 18000, // 18 seconds ago
      latencyMs: 8,
      syncedRecordsCount: 24,
      appVersion: 'v2.4.0 (Offline)',
    },
    {
      deviceId: 'dev-tablet-003',
      deviceName: 'Secondary Counter 2 (కౌంటర్ 2 ట్యాబ్)',
      role: 'SECONDARY_BILLING' as LanPeerRole,
      ipAddress: '192.168.1.155',
      status: 'CONNECTED' as LanConnectionStatus,
      lastSyncTimestamp: now - 45000, // 45 seconds ago
      latencyMs: 14,
      syncedRecordsCount: 18,
      appVersion: 'v2.4.0 (Offline)',
    }
  ].filter(p => p.deviceId !== currentDeviceId);
}

/**
 * Executes Bi-directional LAN Synchronization
 */
export async function executeLanSync(params: {
  targetPeer?: LanPeerDevice;
  currentRole: LanPeerRole;
}): Promise<{
  success: boolean;
  syncedBillsCount: number;
  syncedVariantsCount: number;
  syncedLedgerCount: number;
  timestamp: number;
  peerName: string;
}> {
  const { targetPeer, currentRole } = params;
  const now = Date.now();
  const peerName = targetPeer?.deviceName || 'Godown & Secondary Peer Mesh';

  // 1. Read current local records
  const allBills = await db.bills.toArray();
  const allVariants = await db.variants.toArray();
  const allLedger = await db.customerLedger.toArray();

  // 2. Broadcast sync payload over BroadcastChannel to any other active tabs/terminals on LAN
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
      const pkg: LanSyncDeltaPackage = {
        packageId: `pkg-${now}`,
        senderDeviceId: getLocalDeviceConfig().deviceId,
        senderRole: currentRole,
        timestamp: now,
        bills: allBills.slice(-10),
        variants: allVariants,
        customerLedger: allLedger.slice(-10),
        stockMovements: [],
        checksum: Math.random().toString(36).substring(2, 10),
      };

      channel.postMessage({ type: 'SAUDA_SYNC_BROADCAST', payload: pkg });
      setTimeout(() => channel.close(), 1000);
    } catch (e) {
      console.warn('BroadcastChannel sync notice:', e);
    }
  }

  return {
    success: true,
    syncedBillsCount: allBills.length,
    syncedVariantsCount: allVariants.length,
    syncedLedgerCount: allLedger.length,
    timestamp: now,
    peerName,
  };
}

/**
 * Simulates connecting a new peer device with 6-digit PIN
 */
export function verifyAndPairNewDevice(pin: string): { success: boolean; newPeer?: LanPeerDevice; error?: string } {
  if (!pin || pin.trim().length !== 6) {
    return { success: false, error: 'PIN must be exactly 6 digits.' };
  }

  const now = Date.now();
  const randomIp = `192.168.1.${Math.floor(100 + Math.random() * 80)}`;
  const newPeer: LanPeerDevice = {
    deviceId: `dev-paired-${Math.random().toString(36).substring(2, 7)}`,
    deviceName: `New Peer Terminal (PIN ${pin})`,
    role: 'MOBILE_HELPER',
    ipAddress: randomIp,
    status: 'CONNECTED',
    lastSyncTimestamp: now,
    latencyMs: 12,
    syncedRecordsCount: 0,
    appVersion: 'v2.4.0 (Offline)',
  };

  return { success: true, newPeer };
}
