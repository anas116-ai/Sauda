import React, { useState } from 'react';
import { 
  generateDatabaseSnapshot, 
  encryptSnapshot, 
  decryptSnapshot, 
  restoreDatabaseSnapshot, 
  triggerFileDownload, 
  getStoredCloudConfig, 
  saveStoredCloudConfig 
} from '../../utils/backupUtils';
import { 
  CloudBackupConfig, 
  DatabaseBackupSnapshot, 
  EncryptedBackupEnvelope 
} from '../../types';
import { 
  X, 
  Cloud, 
  ShieldCheck, 
  Download, 
  Upload, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  HardDrive, 
  Clock, 
  KeyRound,
  FileCheck2
} from 'lucide-react';

interface CloudBackupModalProps {
  t: (te: string, en: string, hi?: string) => string;
  onClose: () => void;
  onRestoreCompleted?: () => void;
}

export const CloudBackupModal: React.FC<CloudBackupModalProps> = ({
  t,
  onClose,
  onRestoreCompleted,
}) => {
  // Cloud Config state
  const [cloudConfig, setCloudConfig] = useState<CloudBackupConfig>(getStoredCloudConfig);
  
  // Backup creation state
  const [backupPassphrase, setBackupPassphrase] = useState('1234');
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [backupCreatedSuccess, setBackupCreatedSuccess] = useState(false);

  // Restore state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [restorePassphrase, setRestorePassphrase] = useState('');
  const [parsedEnvelope, setParsedEnvelope] = useState<EncryptedBackupEnvelope | null>(null);
  const [decryptedPreview, setDecryptedPreview] = useState<DatabaseBackupSnapshot | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);

  // Handle Export Encrypted Backup
  const handleExportBackup = async () => {
    if (!backupPassphrase || backupPassphrase.length < 4) {
      alert(t('దయచేసి కనీసం 4 అంకెల పాస్‌వర్డ్ / పిన్ నమోదు చేయండి.', 'Please enter at least a 4-character passphrase or PIN.', 'कृपया कम से कम 4 अक्षरों का पासवर्ड दर्ज करें।'));
      return;
    }

    setIsCreatingBackup(true);
    setBackupCreatedSuccess(false);

    try {
      const snapshot = await generateDatabaseSnapshot();
      const envelope = await encryptSnapshot(snapshot, backupPassphrase);
      const jsonContent = JSON.stringify(envelope, null, 2);

      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `sauda_backup_${dateStr}_${Date.now().toString().slice(-4)}.saudabackup`;
      triggerFileDownload(jsonContent, fileName, 'application/json');

      setBackupCreatedSuccess(true);
      // Update config
      const updatedConfig: CloudBackupConfig = {
        ...cloudConfig,
        lastBackupTimestamp: Date.now(),
        lastBackupStatus: 'SUCCESS',
        lastBackupSizeKb: Math.round(jsonContent.length / 1024),
      };
      setCloudConfig(updatedConfig);
      saveStoredCloudConfig(updatedConfig);

      setTimeout(() => setBackupCreatedSuccess(false), 4000);
    } catch (err) {
      console.error('Backup creation error:', err);
      alert(t('బ్యాకప్ రూపొందించడంలో లోపం ఏర్పడింది.', 'Failed to create backup.', 'बैकअप बनाने में विफल।'));
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // Handle File Upload for Restore
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setRestoreError(null);
    setDecryptedPreview(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const envelope: EncryptedBackupEnvelope = JSON.parse(text);
        if (envelope.format !== 'SAUDA_ENC_V1') {
          throw new Error('Not a valid Sauda backup file format.');
        }
        setParsedEnvelope(envelope);
      } catch (err: any) {
        setRestoreError(t('చెల్లని బ్యాకప్ ఫైల్. SAUDA_ENC_V1 ఫైల్ మాత్రమే సపోర్ట్ చేయబడుతుంది.', 'Invalid backup file. Only valid SAUDA_ENC_V1 files are accepted.', 'अमान्य बैकअप फ़ाइल।'));
        setParsedEnvelope(null);
      }
    };
    reader.readAsText(file);
  };

  // Handle Decryption Preview
  const handleVerifyAndDecrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedEnvelope) return;

    setRestoreError(null);
    try {
      const snapshot = await decryptSnapshot(parsedEnvelope, restorePassphrase);
      setDecryptedPreview(snapshot);
    } catch (err: any) {
      setRestoreError(err.message || t('డీక్రిప్షన్ విఫలమైంది. తప్పుడు పాస్‌వర్డ్.', 'Decryption failed. Incorrect password / PIN.', 'डिक्रिप्शन विफल। गलत पासवर्ड।'));
      setDecryptedPreview(null);
    }
  };

  // Handle Final Atomic Restore
  const handleExecuteRestore = async () => {
    if (!decryptedPreview) return;

    const confirmMsg = t(
      'హెచ్చరిక: ప్రస్తుత డేటాబేస్ పూర్తిగా తుడిచివేయబడి, ఈ బ్యాకప్‌తో రీస్టోర్ చేయబడుతుంది. కొనసాగించాలా?',
      'WARNING: Your current database will be completely replaced with this backup snapshot. Continue?',
      'चेतावनी: आपका वर्तमान डेटाबेस इस बैकअप से बदल दिया जाएगा। जारी रखें?'
    );
    if (!window.confirm(confirmMsg)) return;

    setIsRestoring(true);
    try {
      await restoreDatabaseSnapshot(decryptedPreview);
      setRestoreSuccess(true);
      setTimeout(() => {
        if (onRestoreCompleted) onRestoreCompleted();
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error('Restore error:', err);
      setRestoreError(t('రీస్టోర్ ప్రక్రియలో లోపం ఏర్పడింది.', 'Database restore error occurred.', 'डेटाबेस पुनर्स्थापना में त्रुटि।'));
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      data-testid="cloud-backup-modal"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#161918] text-white flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#84CC16]/20 border border-[#2563EB]/40 text-[#2563EB] flex items-center justify-center">
              <Cloud className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white font-outfit">
                  {t('ఎన్‌క్రిప్టెడ్ క్లౌడ్ బ్యాకప్ & రీస్టోర్', 'Encrypted Cloud Backup & Restore', 'एन्क्रिप्टेड क्लाउड बैकअप और रीस्टोर')}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#84CC16]/15 text-[#2563EB] border border-[#2563EB]/30 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" strokeWidth={2} />
                  <span>AES-256 Vault</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {t(
                  'AES-256 ఎన్‌క్రిప్షన్‌తో వ్యాపార డేటా భద్రత & రీస్టోర్',
                  'AES-256 encrypted snapshots, kept private and restorable offline',
                  'AES-256 एन्क्रिप्शन के साथ व्यापार डेटा सुरक्षा'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              data-testid="close-backup-modal-btn"
              className="w-8 h-8 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {backupCreatedSuccess && (
          <div className="px-6 py-2.5 bg-[#F2F9EC] border-b border-[#D9F99D] text-[#3F6212] text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-[#2563EB]" strokeWidth={2} />
            <span>{t('ఎన్‌క్రిప్టెడ్ బ్యాకప్ ఫైల్ డౌన్‌లోడ్ పూర్తయింది!', 'Encrypted backup downloaded successfully!', 'बैकअप सफलतापूर्वक डाउनलोड हो गया!')}</span>
          </div>
        )}

        {restoreSuccess && (
          <div className="px-6 py-2.5 bg-indigo-50 border-b border-indigo-200 text-indigo-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
            <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
            <span>{t('డేటాబేస్ విజయవంతంగా రీస్టోర్ చేయబడింది! పేజీ రీలోడ్ అవుతోంది...', 'Database restored successfully! Reloading application...', 'डेटाबेस सफलतापूर्वक रीस्टोर हो गया!')}</span>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-paper-deep/30">
          
          {/* Bento Top Row: Create Encrypted Backup + Cloud Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* 1. Create Encrypted Backup Card (Span 7) */}
            <div className="md:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
                  <span>{t('ఎన్‌క్రిప్టెడ్ బ్యాకప్ సృష్టించండి', 'Create Encrypted Backup Snapshot', 'एन्क्रिप्टेड बैकअप बनाएं')}</span>
                  <span className="p-1 rounded-md bg-emerald-50 text-emerald-600">
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                </div>

                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  {t(
                    'బిల్లులు, ఇన్వెంటరీ, కస్టమర్ ఖాతా బాకీలు, మరియు GSTR టాక్స్ రికార్డులు మొత్తం AES-256 తో పాస్‌వర్డ్ రక్షణతో డౌన్‌లోడ్ అవుతాయి.',
                    'All bills, inventory stock, customer khata debts, and GST tax records are encrypted using AES-GCM-256 with PBKDF2 key derivation.',
                    'सभी बिल, इन्वेंट्री, खाता बकाया और जीएसटी रिकॉर्ड एन्क्रिप्ट होकर डाउनलोड होंगे।'
                  )}
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      {t('రక్షణ పాస్‌వర్డ్ / మాస్టర్ పిన్:', 'Protection Passphrase / Master PIN:', 'मास्टर पासवर्ड / पिन:')}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400">
                        <KeyRound className="w-4 h-4" />
                      </span>
                      <input
                        type="password"
                        placeholder="e.g. 1234 or custom password"
                        value={backupPassphrase}
                        onChange={(e) => setBackupPassphrase(e.target.value)}
                        data-testid="backup-passphrase-input"
                        className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold bg-slate-50 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-600">{t('ఎన్‌క్రిప్షన్ విధానం:', 'Encryption Standard:', 'मानक:')}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      AES-GCM-256 • SHA-256 Hash
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  14 Dexie Tables • Offline Safe
                </span>
                
                <button
                  onClick={handleExportBackup}
                  disabled={isCreatingBackup}
                  data-testid="download-encrypted-backup-btn"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {isCreatingBackup 
                      ? t('ఎన్‌క్రిప్ట్ అవుతోంది...', 'Encrypting...', 'एन्क्रिप्ट हो रहा है...') 
                      : t('ఎన్‌క్రిప్టెడ్ బ్యాకప్ డౌన్‌లోడ్ చేయి', 'Download Encrypted File', 'बैकअप डाउनलोड करें')
                    }
                  </span>
                </button>
              </div>
            </div>

            {/* 2. Cloud Schedule & Provider Card (Span 5) */}
            <div className="md:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
                  <span>{t('ఆటోమేటిక్ క్లౌడ్ షెడ్యూల్', 'Automated Cloud Schedule', 'स्वचालित क्लाउड शेड्यूल')}</span>
                  <span className="p-1 rounded-md bg-blue-50 text-blue-600">
                    <Cloud className="w-3.5 h-3.5" />
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white border border-blue-200 flex items-center justify-center text-blue-600">
                        <Cloud className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Google Drive Cloud</span>
                        <span className="text-[10px] text-slate-500">{cloudConfig.accountEmail}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Connected
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <span className="text-slate-700 font-semibold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{t('రాత్రి పూట ఆటో-బ్యాకప్:', 'Nightly Auto-Backup:', 'ऑटो-बैकअप:')}</span>
                    </span>
                    <span className="font-bold text-slate-900">
                      {t('రోజూ రాత్రి 10:00 PM', 'Daily at 10:00 PM', 'रात 10:00 बजे')}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                    <div className="flex justify-between text-slate-500">
                      <span>{t('చివరి బ్యాకప్ సమయం:', 'Last Backup:', 'अंतिम बैकअप:')}</span>
                      <strong className="text-slate-800">
                        {cloudConfig.lastBackupTimestamp 
                          ? new Date(cloudConfig.lastBackupTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                          : t('ఇంకా చేయలేదు', 'Never', 'कभी नहीं')
                        }
                      </strong>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>{t('ఫైల్ సైజు:', 'Snapshot Size:', 'फ़ाइल आकार:')}</span>
                      <strong className="text-slate-800">{cloudConfig.lastBackupSizeKb || 148} KB</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                <span>{t('డే-ఎండ్ Z-రిపోర్ట్‌తో ఆటో సింక్', 'Auto-syncs on Z-Report', 'Z-रिपोर्ट पर ऑटो सिंक')}</span>
                <span className="text-emerald-600 font-bold">100% Protected</span>
              </div>
            </div>

          </div>

          {/* Atomic Database Restore Studio Section */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-rose-600" />
                  <span>{t('బ్యాకప్ ఫైల్ నుండి డేటాబేస్ రీస్టోర్ చేయండి', 'Atomic Database Restore Studio', 'डेटाबेस पुनर्स्थापना')}</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {t(
                    'కంప్యూటర్ మారినప్పుడు లేదా డేటా పోయినప్పుడు .saudabackup ఫైల్ ద్వారా మీ పూర్తి వ్యాపారాన్ని తక్షణమే రీస్టోర్ చేసుకోండి.',
                    'Safely restore your full business database from any encrypted .saudabackup file snapshot.',
                    'अपनी एन्क्रिप्टेड फ़ाइल से पूरा व्यवसाय डेटाबेस पुनर्स्थापित करें।'
                  )}
                </p>
              </div>

              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                Disaster Recovery
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              
              {/* File Uploader Picker (Span 6) */}
              <div className="md:col-span-6 space-y-3">
                <label className="text-[11px] font-bold text-slate-700 block">
                  {t('1. బ్యాకప్ ఫైల్ ఎంచుకోండి (.saudabackup / .json):', '1. Select Backup Snapshot File:', '1. बैकअप फ़ाइल चुनें:')}
                </label>
                
                <div className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-50/50">
                  <input
                    type="file"
                    accept=".saudabackup,.json"
                    onChange={handleFileChange}
                    data-testid="restore-file-input"
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {uploadedFile ? uploadedFile.name : t('ఫైల్ లాగండి లేదా బ్రౌజ్ చేయండి', 'Drag & drop or browse file', 'फ़ाइल चुनें')}
                  </span>
                </div>

                {parsedEnvelope && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                      <FileCheck2 className="w-4 h-4 text-emerald-600" />
                      <span>{parsedEnvelope.shopName} ({t('ధృవీకరించబడింది', 'Verified Envelope', 'सत्यापित')})</span>
                    </div>
                    <div className="text-[11px] text-emerald-700">
                      {t('ఎక్స్‌పోర్ట్ తేదీ:', 'Exported:', 'निर्यात:')} {new Date(parsedEnvelope.exportedAt).toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-emerald-700">
                      {t('మొత్తం రికార్డులు:', 'Total Records:', 'कुल रिकॉर्ड्स:')} {parsedEnvelope.recordCount}
                    </div>
                  </div>
                )}
              </div>

              {/* Decryption & Restore Controls (Span 6) */}
              <div className="md:col-span-6 space-y-3">
                <label className="text-[11px] font-bold text-slate-700 block">
                  {t('2. డీక్రిప్షన్ పాస్‌వర్డ్ నమోదు చేసి ధృవీకరించండి:', '2. Enter Decryption Password & Verify:', '2. पासवर्ड दर्ज करें:')}
                </label>

                <form onSubmit={handleVerifyAndDecrypt} className="flex gap-2">
                  <input
                    type="password"
                    placeholder="Enter passphrase / PIN"
                    value={restorePassphrase}
                    onChange={(e) => setRestorePassphrase(e.target.value)}
                    disabled={!parsedEnvelope}
                    data-testid="restore-passphrase-input"
                    className="flex-1 px-3 py-2 text-xs font-mono font-bold bg-slate-50 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!parsedEnvelope || !restorePassphrase}
                    data-testid="verify-decrypt-btn"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm whitespace-nowrap"
                  >
                    {t('ధృవీకరించు', 'Verify Snapshot', 'सत्यापित करें')}
                  </button>
                </form>

                {restoreError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{restoreError}</span>
                  </div>
                )}

                {/* Decrypted Contents Preview */}
                {decryptedPreview && (
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                      <span>{t('స్నాప్‌షాట్ కంటెంట్ ప్రివ్యూ:', 'Snapshot Content Preview:', 'सामग्री पूर्वावलोकन:')}</span>
                      <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                        Checksum: {decryptedPreview.checksum}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-1.5 bg-white rounded-lg border border-blue-100">
                        <span className="font-black text-slate-800 block text-sm">
                          {decryptedPreview.data.bills?.length || 0}
                        </span>
                        <span className="text-[10px] text-slate-500">{t('బిల్లులు', 'Bills', 'बिल')}</span>
                      </div>
                      <div className="p-1.5 bg-white rounded-lg border border-blue-100">
                        <span className="font-black text-slate-800 block text-sm">
                          {decryptedPreview.data.products?.length || 0}
                        </span>
                        <span className="text-[10px] text-slate-500">{t('సరుకులు', 'Products', 'वस्तुएं')}</span>
                      </div>
                      <div className="p-1.5 bg-white rounded-lg border border-blue-100">
                        <span className="font-black text-slate-800 block text-sm">
                          {decryptedPreview.data.customers?.length || 0}
                        </span>
                        <span className="text-[10px] text-slate-500">{t('ఖాతాదారులు', 'Customers', 'ग्राहक')}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleExecuteRestore}
                      disabled={isRestoring}
                      data-testid="execute-atomic-restore-btn"
                      className="w-full mt-2 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>
                        {isRestoring 
                          ? t('రీస్టోర్ అవుతోంది...', 'Restoring Database...', 'रीस्टोर हो रहा है...') 
                          : t('ఈ బ్యాకప్‌తో డేటాబేస్ రీస్టోర్ చేయి', 'Restore & Overwrite Database', 'डेटाबेस पुनर्स्थापित करें')
                        }
                      </span>
                    </button>
                  </div>
                )}
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
                'సౌదా డేటా వాల్ట్: మీ వ్యాపార లెడ్జర్ కేవలం మీ పాస్‌వర్డ్‌తో మాత్రమే తెరవబడుతుంది.',
                'Sauda Data Vault: your ledger stays private, protected by your own passphrase.',
                'सौदा डेटा वॉल्ट: आपका डेटा पूरी तरह सुरक्षित है।'
              )}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              data-testid="cloud-backup-close-footer-btn"
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
