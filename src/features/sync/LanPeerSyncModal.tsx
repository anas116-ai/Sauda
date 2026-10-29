import React, { useState, useEffect } from 'react';
import { 
  LanPeerDevice, 
  LanPeerRole 
} from '../../types';
import { 
  getLocalDeviceConfig, 
  saveLocalDeviceConfig, 
  generatePairingCode, 
  getInitialPeers, 
  executeLanSync, 
  verifyAndPairNewDevice 
} from '../../utils/lanSyncUtils';
import { 
  X, 
  Wifi, 
  Smartphone, 
  Monitor, 
  RefreshCw, 
  CheckCircle2, 
  QrCode, 
  ShieldCheck, 
  ArrowUpDown, 
  Radio, 
  Plus,
  Server
} from 'lucide-react';
import QRCode from 'qrcode';

interface LanPeerSyncModalProps {
  formatPaise: (paise: number) => string;
  t: (te: string, en: string, hi?: string) => string;
  onClose: () => void;
}

export const LanPeerSyncModal: React.FC<LanPeerSyncModalProps> = ({
  formatPaise: _formatPaise,
  t,
  onClose,
}) => {
  const [deviceConfig, setDeviceConfig] = useState(getLocalDeviceConfig);
  const [pairingPin, setPairingPin] = useState(generatePairingCode);
  const [peers, setPeers] = useState<LanPeerDevice[]>(() => getInitialPeers(deviceConfig.deviceId));
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showQrModal, setShowQrModal] = useState(false);

  // Manual PIN input state
  const [enterPin, setEnterPin] = useState('');
  const [pairError, setPairError] = useState<string | null>(null);

  // Sync log
  const [syncLogs, setSyncLogs] = useState<Array<{ id: string; time: string; text: string }>>([
    {
      id: 'log-1',
      time: 'Just now',
      text: t(
        'లోకల్ వై-ఫై నెట్‌వర్క్ (192.168.1.x) లో 2 పరికరాలు కనుగొనబడ్డాయి.',
        '2 peer devices discovered on local Wi-Fi mesh (192.168.1.x).',
        'लोकल वाई-फाई मेश में 2 डिवाइस पाए गए।'
      )
    }
  ]);

  // Generate pairing QR code
  useEffect(() => {
    const payload = `sauda://sync?dev=${encodeURIComponent(deviceConfig.deviceName)}&pin=${pairingPin}&role=${deviceConfig.role}`;
    QRCode.toDataURL(payload, { width: 180, margin: 1 })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR Gen error:', err));
  }, [deviceConfig, pairingPin]);

  // Trigger Manual Bi-directional Sync
  const handleTriggerSync = async (targetPeer?: LanPeerDevice) => {
    setIsSyncing(true);
    setSyncSuccessMessage(null);

    try {
      const result = await executeLanSync({
        targetPeer,
        currentRole: deviceConfig.role,
      });

      const timeStr = new Date(result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const newLogText = t(
        `${result.peerName} తో పూర్తి సమకాలీకరణ విజయవంతమైంది (${result.syncedBillsCount} బిల్లులు, ${result.syncedVariantsCount} సరుకులు).`,
        `Bi-directional sync successful with ${result.peerName} (${result.syncedBillsCount} bills, ${result.syncedVariantsCount} SKUs).`,
        `${result.peerName} के साथ सिंक सफल (${result.syncedBillsCount} बिल, ${result.syncedVariantsCount} वस्तुएं)।`
      );

      setSyncLogs((prev) => [
        { id: `log-${Date.now()}`, time: timeStr, text: newLogText },
        ...prev.slice(0, 5),
      ]);

      setSyncSuccessMessage(
        t('సింక్ పూర్తయింది! అన్ని పరికరాలు అప్‌డేట్ అయ్యాయి.', 'Sync Completed! All devices updated in real-time.', 'सिंक पूरा हुआ! सभी डिवाइस अपडेट हो गए हैं।')
      );

      // Update peer timestamp
      setPeers((prev) =>
        prev.map((p) =>
          targetPeer && p.deviceId !== targetPeer.deviceId
            ? p
            : { ...p, lastSyncTimestamp: Date.now(), status: 'CONNECTED' }
        )
      );
    } catch (err) {
      console.error('LAN Sync error:', err);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncSuccessMessage(null), 4000);
    }
  };

  // Pair device with PIN
  const handlePairSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPairError(null);

    const res = verifyAndPairNewDevice(enterPin);
    if (!res.success || !res.newPeer) {
      setPairError(res.error || 'Invalid PIN');
      return;
    }

    setPeers((prev) => [res.newPeer!, ...prev]);
    setEnterPin('');
    setSyncSuccessMessage(
      t('కొత్త పరికరం విజయవంతంగా జతచేయబడింది!', 'New device paired successfully!', 'नया डिवाइस सफलतापूर्वक जुड़ गया!')
    );
    setTimeout(() => setSyncSuccessMessage(null), 3000);
  };

  // Update role
  const handleRoleChange = (newRole: LanPeerRole) => {
    saveLocalDeviceConfig(deviceConfig.deviceName, newRole);
    setDeviceConfig((prev) => ({ ...prev, role: newRole }));
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      data-testid="lan-sync-modal"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#161918] text-white flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#84CC16]/20 border border-[#2563EB]/40 text-[#2563EB] flex items-center justify-center">
              <Wifi className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white font-outfit">
                  {t('లోకల్ వై-ఫై పీర్ సింక్', 'Local Wi-Fi Peer Sync', 'लोकल वाई-फाई पीयर सिंक')}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#84CC16]/15 text-[#2563EB] border border-[#2563EB]/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#84CC16] animate-pulse" />
                  <span>LAN Mesh Active</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {t(
                  'ఇంటర్నెట్ లేకుండా కౌంటర్ & గోడౌన్ డివైస్ల రియల్-టైమ్ అనుసంధానం',
                  'Zero-Internet Peer Mesh between Main Billing Counter & Godown Terminal',
                  'इंटरनेट के बिना काउंटर और गोदाम डिवाइसों का रीयल-टाइम सिंक'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTriggerSync()}
              disabled={isSyncing}
              data-testid="lan-sync-now-header-btn"
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#2563EB] ${isSyncing ? 'animate-spin' : ''}`} strokeWidth={2} />
              <span>{isSyncing ? t('సింక్ అవుతోంది...', 'Syncing...', 'सिंक हो रहा है...') : t('ఇప్పుడే సింక్ చేయి', 'Sync All Now', 'अभी सिंक करें')}</span>
            </button>

            <button
              onClick={onClose}
              data-testid="close-lan-sync-btn"
              className="w-8 h-8 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Sync Success Alert Feedback */}
        {syncSuccessMessage && (
          <div className="px-6 py-2.5 bg-[#F2F9EC] border-b border-[#D9F99D] text-[#3F6212] text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-[#2563EB]" strokeWidth={2} />
            <span>{syncSuccessMessage}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-paper-deep/30">
          
          {/* Bento Top Row: Current Terminal Identity + Pairing Credentials */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Current Device Card (Span 7) */}
            <div className="md:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
                <span>{t('ఈ పరికరం వివరాలు (Local Node)', 'This Device Terminal Identity', 'इस डिवाइस का विवरण')}</span>
                <span className="p-1 rounded-md bg-blue-50 text-blue-600">
                  <Monitor className="w-3.5 h-3.5" />
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Server className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {deviceConfig.deviceName}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono">
                      ID: {deviceConfig.deviceId} • IP: 192.168.1.105 (Wi-Fi Port 5173)
                    </span>
                  </div>
                </div>

                {/* Role Switcher */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1.5">
                    {t('పరికరం పాత్ర (Device Operational Role):', 'Device Operational Role:', 'डिवाइस की भूमिका:')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { role: 'PRIMARY_COUNTER', labelTe: 'ప్రధాన కౌంటర్', labelEn: 'Main Counter', labelHi: 'मुख्य काउंटर' },
                      { role: 'GODOWN_TERMINAL', labelTe: 'గోడౌన్ టెర్మినల్', labelEn: 'Godown Stock', labelHi: 'गोदाम स्टॉक' },
                      { role: 'MOBILE_HELPER', labelTe: 'మొబైల్ హెల్పర్', labelEn: 'Mobile Helper', labelHi: 'मोबाइल हेल्पर' },
                    ].map((item) => (
                      <button
                        key={item.role}
                        onClick={() => handleRoleChange(item.role as LanPeerRole)}
                        data-testid={`role-btn-${item.role}`}
                        className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition border ${
                          deviceConfig.role === item.role
                            ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {t(item.labelTe, item.labelEn, item.labelHi)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                  <span>{t('సింక్ పోర్ట్ సిద్ధంగా ఉంది', 'Local Wi-Fi Mesh Ready', 'लोकल मेश सक्रिय')}</span>
                </span>
                <span className="text-slate-600 font-mono font-medium">Dexie IDB v9</span>
              </div>
            </div>

            {/* Quick Pairing Card (Span 5) */}
            <div className="md:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
                <span>{t('మొబైల్ జతచేసే కోడ్', 'Pairing Code (6-Digit PIN)', 'पेयरिंग कोड (6-अंक पिन)')}</span>
                <span className="p-1 rounded-md bg-emerald-50 text-emerald-600">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </span>
              </div>

              <div className="text-center py-2">
                <span className="text-[11px] text-slate-400 block mb-1">
                  {t('గోడౌన్ ఫోన్‌లో ఈ కోడ్ నమోదు చేయండి', 'Enter this PIN on Godown Phone', 'गोदाम फोन में यह पिन दर्ज करें')}
                </span>
                <div 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-emerald-400 rounded-xl font-mono text-2xl font-black tracking-widest shadow-inner"
                  data-testid="lan-pairing-pin-display"
                >
                  {pairingPin.split('').join(' ')}
                </div>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPairingPin(generatePairingCode())}
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>{t('కొత్త కోడ్ రూపొందించు', 'Generate New PIN', 'नया कोड बनाएं')}</span>
                  </button>
                  <span>•</span>
                  <button
                    onClick={() => setShowQrModal(!showQrModal)}
                    className="text-[11px] text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1"
                  >
                    <QrCode className="w-3 h-3 text-slate-500" />
                    <span>{t('QR కోడ్ చూడు', 'Scan QR', 'QR कोड देखें')}</span>
                  </button>
                </div>
              </div>

              {/* QR Modal Dropdown preview */}
              {showQrModal && qrDataUrl && (
                <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center animate-in fade-in duration-150">
                  <img src={qrDataUrl} alt="Pairing QR" className="w-28 h-28 rounded-lg shadow-sm" />
                  <span className="text-[10px] text-slate-500 mt-1">
                    {t('గోడౌన్ మొబైల్ కెమెరాతో స్కాన్ చేయండి', 'Scan with Godown Mobile Camera', 'गोदाम मोबाइल कैमरे से स्कैन करें')}
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center">
                {t('ఒకే Wi-Fi రూటర్‌కి కనెక్ట్ అయి ఉండాలి', 'Must be connected to same Wi-Fi router', 'एक ही वाई-फाई से जुड़ा होना चाहिए')}
              </div>
            </div>

          </div>

          {/* Connected Peers Section */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span>{t('కనెక్ట్ అయిన పరికరాలు (Connected Peer Terminals)', 'Connected LAN Peer Terminals', 'कनेक्टेड डिवाइस')}</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {peers.length} {t('పరికరాలు ప్రస్తుతం లోకల్ మెష్‌లో యాక్టివ్‌గా ఉన్నాయి', 'terminals currently synced in local mesh', 'डिवाइस सक्रिय हैं')}
                </p>
              </div>

              <button
                onClick={() => handleTriggerSync()}
                data-testid="sync-all-peers-btn"
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
                <span>{t('అన్ని పరికరాలతో సింక్ చేయి', 'Sync All Devices', 'सभी सिंक करें')}</span>
              </button>
            </div>

            {/* Peer Devices List */}
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
              {peers.map((peer) => (
                <div 
                  key={peer.deviceId}
                  className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                  data-testid={`peer-row-${peer.deviceId}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold border border-slate-200">
                      {peer.role === 'GODOWN_TERMINAL' ? <Smartphone className="w-5 h-5 text-amber-600" /> : <Monitor className="w-5 h-5 text-blue-600" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">
                          {peer.deviceName}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>{peer.latencyMs}ms</span>
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        {peer.ipAddress} • {peer.role} • {peer.appVersion}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right text-[11px] text-slate-500">
                      <div>
                        {t('చివరి సింక్:', 'Last Synced:', 'अंतिम सिंक:')} <strong className="text-slate-800">{new Date(peer.lastSyncTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                      </div>
                      <div className="text-emerald-600 font-semibold">
                        {peer.syncedRecordsCount} {t('రికార్డులు సింక్ అయ్యాయి', 'records synced', 'रिकॉर्ड्स')}
                      </div>
                    </div>

                    <button
                      onClick={() => handleTriggerSync(peer)}
                      disabled={isSyncing}
                      data-testid={`sync-peer-btn-${peer.deviceId}`}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition-colors flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{t('సింక్', 'Sync', 'सिंक')}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Row: Pair New Device Form + Live Activity Feed */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Pair with PIN Form (Span 5) */}
            <div className="md:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-blue-600" />
                  <span>{t('కొత్త పరికరాన్ని జత చేయండి', 'Pair Another Terminal with PIN', 'नया डिवाइस जोड़ें')}</span>
                </h4>
                <p className="text-[11px] text-slate-500 mb-3">
                  {t('వేరే ఫోన్ లేదా ల్యాప్‌టాప్‌లో కనిపించే 6 అంకెల పిన్ ఇక్కడ నమోదు చేయండి.', 'Enter the 6-digit PIN displayed on another device.', 'दूसरे फोन का 6-अंकीय पिन दर्ज करें।')}
                </p>

                <form onSubmit={handlePairSubmit} className="space-y-3">
                  <div>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 749201"
                      value={enterPin}
                      onChange={(e) => setEnterPin(e.target.value.replace(/\D/g, ''))}
                      data-testid="lan-pair-input-pin"
                      className="w-full px-3 py-2 text-center text-lg font-mono font-bold tracking-widest bg-slate-50 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>

                  {pairError && (
                    <span className="text-[11px] text-rose-600 font-semibold block">
                      {pairError}
                    </span>
                  )}

                  <button
                    type="submit"
                    data-testid="lan-pair-submit-btn"
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    {t('పరికరాన్ని కనెక్ట్ చేయి', 'Connect Peer Device', 'डिवाइस कनेक्ट करें')}
                  </button>
                </form>
              </div>

              <span className="text-[10px] text-slate-400 text-center block mt-3">
                {t('ఆటోమేటిక్ లోకల్ డిస్కవరీ ఎనేబుల్ చేయబడింది', 'Automatic Local Discovery Enabled', 'लोकल डिस्कवरी सक्रिय')}
              </span>
            </div>

            {/* Live Sync Activity Ledger (Span 7) */}
            <div className="md:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-2">
                  {t('ప్రత్యక్ష సింక్ రికార్డుల లాగ్ (Live Sync Activity)', 'Live Sync Activity Ledger', 'लाइव सिंक गतिविधि')}
                </h4>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {syncLogs.map((log) => (
                    <div key={log.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-2 text-xs">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                        <span className="text-slate-700 leading-snug">{log.text}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">{log.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>{t('డెల్టా రెప్లికేషన్: యాక్టివ్', 'Delta Replication: Active', 'डेल्टा सिंक सक्रिय')}</span>
                <span className="text-emerald-600 font-semibold">{t('నో కాన్‌ఫ్లిక్ట్ (LWW)', 'Conflict-Free (LWW)', 'त्रुटि मुक्त')}</span>
              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#84CC16]" aria-hidden="true" />
            <span>
              {t(
                'సౌదా ఆఫ్‌లైన్ మెష్: ఇంటర్నెట్ లేకపోయినా దుకాణంలో అన్ని డివైస్లు సింక్ అవుతాయి.',
                'Sauda Offline Mesh: all shop terminals stay in sync even when the internet drops.',
                'सौदा ऑफ़लाइन मेश: इंटरनेट के बिना भी सभी डिवाइस सिंक रहते हैं।'
              )}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              data-testid="lan-sync-close-footer-btn"
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
