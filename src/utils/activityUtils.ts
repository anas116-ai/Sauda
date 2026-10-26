import { db } from '../db';
import { 
  ActivityLog, 
  ActivityActionType, 
  ActivitySeverity, 
  UserRole 
} from '../types';

/**
 * Log a sensitive business action into Dexie activityLogs
 */
export async function logActivity(
  actionType: ActivityActionType,
  actionTitleTe: string,
  actionTitleEn: string,
  details = '',
  severity: ActivitySeverity = 'INFO',
  userId = 'user-001',
  userName = 'వెంకటేశ్వర్లు (Owner)',
  userRole: UserRole = 'OWNER',
  shopId = 'shop-001'
): Promise<void> {
  const now = Date.now();
  await db.activityLogs.add({
    id: `act-${now}-${Math.random().toString(36).substr(2, 4)}`,
    shopId,
    userId,
    userName,
    userRole,
    actionType,
    actionTitleTe,
    actionTitleEn,
    details,
    severity,
    timestamp: now,
  });
}

/**
 * Export Activity Logs in CSV format
 */
export function exportActivityLogsCsv(
  logs: ActivityLog[],
  shopName = 'Sri Lakshmi General Store'
): string {
  const lines: string[] = [];

  // UTF-8 BOM
  lines.push(`\uFEFF${shopName} - STAFF ACTION & AUDIT TRAIL REGISTER (స్టాఫ్ ఆడిట్ లాగ్)`);
  lines.push(`Exported At: ${new Date().toLocaleString('en-IN')}`);
  lines.push('');
  lines.push('Timestamp,Date,Time,Staff User,Role,Action Type,Action (Telugu),Action (English),Severity,Details');

  for (const log of logs) {
    const sanitize = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
    const d = new Date(log.timestamp);
    lines.push([
      log.timestamp,
      sanitize(d.toLocaleDateString('en-IN')),
      sanitize(d.toLocaleTimeString('en-IN')),
      sanitize(log.userName),
      sanitize(log.userRole),
      sanitize(log.actionType),
      sanitize(log.actionTitleTe),
      sanitize(log.actionTitleEn),
      sanitize(log.severity),
      sanitize(log.details || ''),
    ].join(','));
  }

  return lines.join('\r\n');
}
