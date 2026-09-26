import React, { useState } from 'react';
import {
  Settings,
  Store,
  Database,
  Download,
  Upload,
  RotateCcw,
  CheckCircle,
  Shield,
  FileSpreadsheet,
  Building,
  CreditCard,
  Flame,
  CheckCircle2,
  Trash2,
  Phone,
  Truck,
  Edit3,
  Save,
  UserCheck,
  UserPlus,
  Key,
  ShieldCheck,
  AlertCircle,
  User,
  BadgeCheck,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  Clock,
  ShieldAlert,
  X
} from 'lucide-react';
import { StoreData, StoreSettings, Staff, AdminUser } from '../../types';
import { StorageService } from '../../services/storageService';
import { SecurityService } from '../../services/securityService';

interface SettingsViewProps {
  storeData: StoreData;
  onRefreshData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ storeData, onRefreshData }) => {
  const [settings, setSettings] = useState<StoreSettings>(storeData.settings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Staff Editing States
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editStaffName, setEditStaffName] = useState<string>('');
  const [editStaffPhone, setEditStaffPhone] = useState<string>('');
  const [staffUpdateSuccess, setStaffUpdateSuccess] = useState<string | null>(null);
  const [staffUpdateError, setStaffUpdateError] = useState<string | null>(null);

  // ERP User Management & Production Security States
  const [newUserName, setNewUserName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<'Cashier' | 'Agent' | 'Manager' | 'Admin'>('Cashier');
  const [newUserPin, setNewUserPin] = useState('');
  const [userActionMessage, setUserActionMessage] = useState<string | null>(null);
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});

  // Production Security States
  const [currentMasterPassword, setCurrentMasterPassword] = useState('');
  const [newMasterPassword, setNewMasterPassword] = useState('');
  const [confirmMasterPassword, setConfirmMasterPassword] = useState('');
  const [masterPassFeedback, setMasterPassFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [autoLockMinutes, setAutoLockMinutes] = useState<number>(() => {
    return SecurityService.getSecuritySettings().autoLockMinutes ?? 15;
  });
  const [isAuditTrailOpen, setIsAuditTrailOpen] = useState(false);

  const togglePinReveal = (userId: string) => {
    setRevealedPins((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const pin = newUserPin.trim();
    if (!newUserName.trim() || !pin) return;
    const created = StorageService.addAdminUser({
      username: newUserName.trim().toLowerCase().replace(/\s+/g, '_'),
      displayName: newUserName.trim(),
      phone: newUserPhone.trim(),
      role: newUserRole,
      pin,
      passwordHash: SecurityService.hash(pin),
      status: 'active',
      approvedBy: 'Admin (Settings)',
      createdAt: new Date().toISOString(),
    });

    SecurityService.logSecurityAudit({
      username: 'admin',
      role: 'Admin',
      eventType: 'STAFF_ADDED',
      ipOrDevice: navigator.userAgent,
      details: `कर्मचारी खाते "${newUserName.trim()}" (${newUserRole}) व्यवस्थापकाने तयार केले.`,
    });

    if (created && created.id) {
      setUserActionMessage(`कर्मचारी खाते "${newUserName}" सुरक्षितरित्या तयार झाले!`);
      setNewUserName('');
      setNewUserPhone('');
      setNewUserPin('');
      onRefreshData();
      setTimeout(() => setUserActionMessage(null), 3000);
    }
  };

  const handleApproveUser = (userId: string) => {
    const success = StorageService.approveAdminUser(userId, 'Admin Settings');
    if (success) {
      SecurityService.logSecurityAudit({
        username: 'admin',
        role: 'Admin',
        eventType: 'ACCOUNT_APPROVED',
        ipOrDevice: navigator.userAgent,
        details: `कर्मचारी खाते (ID: ${userId}) मंजूर करण्यात आले.`,
      });
      setUserActionMessage('खाते यशस्वीरित्या मंजूर व सक्रिय करण्यात आले!');
      onRefreshData();
      setTimeout(() => setUserActionMessage(null), 3000);
    }
  };

  const handleRejectUser = (userId: string) => {
    const success = StorageService.rejectAdminUser(userId);
    if (success) {
      SecurityService.logSecurityAudit({
        username: 'admin',
        role: 'Admin',
        eventType: 'ACCOUNT_REJECTED',
        ipOrDevice: navigator.userAgent,
        details: `कर्मचारी खाते (ID: ${userId}) नाकारण्यात आले.`,
      });
      setUserActionMessage('खाते नाकारण्यात आले.');
      onRefreshData();
      setTimeout(() => setUserActionMessage(null), 3000);
    }
  };

  const handleDeleteUser = (userId: string) => {
    const userToDelete = (storeData.adminUsers || []).find((u) => u.id === userId);
    const success = StorageService.deleteAdminUser(userId);
    if (success) {
      SecurityService.logSecurityAudit({
        username: 'admin',
        role: 'Admin',
        eventType: 'ACCOUNT_DELETED',
        ipOrDevice: navigator.userAgent,
        details: `कर्मचारी खाते "${userToDelete?.displayName || userId}" कायमचे हटवले.`,
      });
      setUserActionMessage('खाते हटवले गेले.');
      onRefreshData();
      setTimeout(() => setUserActionMessage(null), 3000);
    }
  };

  const handleChangeMasterPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setMasterPassFeedback(null);

    if (!currentMasterPassword) {
      setMasterPassFeedback({ type: 'error', message: 'कृपया चालू पासवर्ड प्रविष्ट करा.' });
      return;
    }
    if (newMasterPassword.length < 4) {
      setMasterPassFeedback({ type: 'error', message: 'नवीन पासवर्ड किमान ४ अक्षरांचा किंवा अंकांचा असावा.' });
      return;
    }
    if (newMasterPassword !== confirmMasterPassword) {
      setMasterPassFeedback({ type: 'error', message: 'नवीन पासवर्ड आणि पुष्टीकरण जुळत नाहीत.' });
      return;
    }

    const res = SecurityService.changeMasterPassword(currentMasterPassword, newMasterPassword);
    if (res.success) {
      setMasterPassFeedback({ type: 'success', message: 'मास्टर पासवर्ड यशस्वीरित्या बदलला आणि एनक्रिप्ट केला!' });
      setCurrentMasterPassword('');
      setNewMasterPassword('');
      setConfirmMasterPassword('');
      onRefreshData();
    } else {
      setMasterPassFeedback({ type: 'error', message: res.error || 'पासवर्ड बदल अयशस्वी.' });
    }
  };

  const handleUpdateAutoLock = (mins: number) => {
    setAutoLockMinutes(mins);
    SecurityService.updateSecuritySettings({ autoLockMinutes: mins });
    SecurityService.logSecurityAudit({
      username: 'admin',
      role: 'Admin',
      eventType: 'SECURITY_SETTINGS_UPDATED',
      ipOrDevice: navigator.userAgent,
      details: `ऑटो-लॉक कालावधी ${mins === 0 ? 'बंद' : mins + ' मिनिटे'} म्हणून सेट केला.`,
    });
    onRefreshData();
  };

  const startEditStaff = (staff: Staff) => {
    setEditingStaffId(staff.id);
    setEditStaffName(staff.name);
    setEditStaffPhone(staff.phone);
    setStaffUpdateError(null);
    setStaffUpdateSuccess(null);
  };

  const handleSaveStaffContact = (staffId: string) => {
    if (!editStaffPhone.trim()) {
      setStaffUpdateError('मोबाईल नंबर आवश्यक आहे (Mobile number required).');
      return;
    }
    const cleanPhone = editStaffPhone.trim();
    const res = StorageService.updateStaff(staffId, {
      name: editStaffName.trim() || undefined,
      phone: cleanPhone,
    });

    if (!res.success) {
      setStaffUpdateError(res.error || 'Failed to update phone number.');
      return;
    }

    setStaffUpdateSuccess('कर्मचाऱ्याचा मोबाईल नंबर यशस्वीरित्या जतन झाला!');
    setEditingStaffId(null);
    onRefreshData();
    setTimeout(() => setStaffUpdateSuccess(null), 3000);
  };

  // Handle Form change
  const handleChange = (field: keyof StoreSettings, val: any) => {
    setSettings((prev) => ({ ...prev, [field]: val }));
  };

  const handleBankChange = (field: keyof StoreSettings['bankDetails'], val: string) => {
    setSettings((prev) => ({
      ...prev,
      bankDetails: {
        ...prev.bankDetails,
        [field]: val,
      },
    }));
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.updateSettings(settings);
    onRefreshData();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Download ZIP
  const handleDownloadZip = async () => {
    try {
      setIsExporting(true);
      const blob = await StorageService.exportBackupZIP();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shri-sai-enterprises-full-backup-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  // Download JSON
  const handleDownloadJSON = () => {
    const json = StorageService.exportDatabaseJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shri-sai-enterprises-db-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import JSON
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const success = StorageService.importDatabase(text);
        if (success) {
          setImportStatus('Database imported successfully! Refreshing...');
          onRefreshData();
          setTimeout(() => setImportStatus(null), 3000);
        } else {
          setImportStatus('Invalid database JSON file format.');
        }
      } catch (err) {
        setImportStatus('Error reading database file.');
      }
    };
    reader.readAsText(file);
  };

  // 1-Click Clear/Wipe All Demo Data
  const handleWipeDemoData = () => {
    if (confirm('तुम्हाला सर्व डेमो डेटा (ग्राहक, जुनी बिले, पावत्या, कार्ड योजना) एका क्लिकमध्ये पुसून स्वच्छ (0 Records) करायचा आहे का? दुकान नाव, GST व कर्मचारी सुरक्षित राहतील.')) {
      StorageService.wipeAllDemoData({ keepStock: true, keepDealers: true });
      onRefreshData();
      alert('सर्व डेमो डेटा यशस्वीरित्या साफ झाला! सिस्टीम आता तुमच्या CSV डेटासाठी सज्ज आहे.');
    }
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset showroom data to factory initial state? All custom added items will be replaced with initial showroom catalog.')) {
      StorageService.resetToDefault();
      onRefreshData();
      alert('Data reset successfully.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Showroom Settings & System Backup</h2>
            <p className="text-xs text-slate-400">
              Configure GST tax profile, receipt number sequence, bank UPI info, and export database archives.
            </p>
          </div>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-3 py-1.5 rounded-lg text-xs font-semibold">
            <CheckCircle className="w-4 h-4" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Settings Form (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Store className="w-4 h-4" />
              <span>Showroom & GST Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                  Store / Enterprise Name
                </label>
                <input
                  type="text"
                  required
                  value={settings.storeName}
                  onChange={(e) => handleChange('storeName', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                  Tagline / Business Nature
                </label>
                <input
                  type="text"
                  value={settings.tagline}
                  onChange={(e) => handleChange('tagline', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                  Showroom Address
                </label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                  City & State
                </label>
                <input
                  type="text"
                  value={`${settings.city}, ${settings.state}`}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                  Phone Numbers
                </label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                  GSTIN Number
                </label>
                <input
                  type="text"
                  value={settings.gstin}
                  onChange={(e) => handleChange('gstin', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                  Next Receipt Number (Starts at 1079)
                </label>
                <input
                  type="number"
                  min="1079"
                  value={settings.nextReceiptNo}
                  onChange={(e) => handleChange('nextReceiptNo', parseInt(e.target.value) || 1079)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Bank Details */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Building className="w-4 h-4" />
                <span>Bank Details & UPI Payment QR</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                    Bank Name & Branch
                  </label>
                  <input
                    type="text"
                    value={settings.bankDetails.bankName}
                    onChange={(e) => handleBankChange('bankName', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={settings.bankDetails.accountNumber}
                    onChange={(e) => handleBankChange('accountNumber', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={settings.bankDetails.ifscCode}
                    onChange={(e) => handleBankChange('ifscCode', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                    UPI ID (for bill printing QR code)
                  </label>
                  <input
                    type="text"
                    value={settings.bankDetails.upiId}
                    onChange={(e) => handleBankChange('upiId', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Live Reference & Contact Directory (shrisaient.in) with Full Phone Editing */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Phone className="w-4 h-4" />
                  <span>Showroom Staff & Executive Contacts (कर्मचारी व संपर्क व्यवस्थापन)</span>
                </h3>
                {staffUpdateSuccess && (
                  <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {staffUpdateSuccess}
                  </span>
                )}
                {staffUpdateError && (
                  <span className="text-[11px] text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                    {staffUpdateError}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {storeData.staff.slice(0, 6).map((stf) => {
                  const isEditing = editingStaffId === stf.id;
                  return (
                    <div
                      key={stf.id}
                      className={`p-3 rounded-lg border transition ${
                        isEditing
                          ? 'bg-slate-900 border-amber-500 ring-1 ring-amber-500/50'
                          : 'bg-slate-800/80 border-slate-700'
                      } space-y-2`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-amber-400 uppercase font-black">
                          {stf.role}
                        </span>
                        {!isEditing ? (
                          <button
                            type="button"
                            onClick={() => startEditStaff(stf)}
                            className="p-1 hover:bg-slate-700 text-slate-400 hover:text-amber-400 rounded transition cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                            title="Edit Contact Number"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleSaveStaffContact(stf.id)}
                              className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                            >
                              <Save className="w-3 h-3" />
                              <span>Save</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingStaffId(null)}
                              className="px-1.5 py-0.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-[10px] cursor-pointer"
                            >
                              X
                            </button>
                          </div>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="space-y-1.5">
                          <input
                            type="text"
                            value={editStaffName}
                            onChange={(e) => setEditStaffName(e.target.value)}
                            placeholder="Staff Name"
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs font-bold"
                          />
                          <input
                            type="tel"
                            value={editStaffPhone}
                            onChange={(e) => setEditStaffPhone(e.target.value)}
                            placeholder="Mobile Number"
                            className="w-full bg-slate-950 border border-amber-500/60 rounded px-2 py-1 text-amber-300 font-mono text-xs font-bold"
                          />
                        </div>
                      ) : (
                        <div>
                          <p className="font-bold text-white text-sm">{stf.name}</p>
                          <p className="text-slate-300 font-mono text-xs">📱 {stf.phone}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 flex items-center justify-between">
                <span>🌐 अधिकृत संकेतस्थळ (Official Website): <strong>shrisaient.in</strong></span>
                <span className="text-slate-400">Wardha Mega Electronics & Furniture Showroom</span>
              </div>
            </div>

            {/* ERP User Accounts & Approvals Center */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#febd69] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>ERP वापरकर्ते व ॲडमिन मंजुरी (ERP Staff Accounts & Approvals)</span>
                </h3>
                <span className="text-[10px] text-slate-400">
                  मास्टर पिन: <strong>1079</strong> / <strong>1234</strong>
                </span>
              </div>

              {userActionMessage && (
                <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{userActionMessage}</span>
                </div>
              )}

              {/* Pending Approvals List */}
              {storeData.adminUsers &&
                storeData.adminUsers.filter((u) => u.status === 'pending').length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      <span>प्रलंबित खाती मंजुरीच्या प्रतीक्षेत आहेत:</span>
                    </span>

                    <div className="space-y-2">
                      {storeData.adminUsers
                        .filter((u) => u.status === 'pending')
                        .map((u) => (
                          <div
                            key={u.id}
                            className="p-2.5 rounded-lg bg-slate-900 border border-amber-500/40 flex items-center justify-between gap-3 text-xs"
                          >
                            <div>
                              <strong className="text-white block">{u.displayName}</strong>
                              <span className="text-[11px] text-slate-400 font-mono">
                                फोन: {u.phone || 'N/A'} • भूमिका: {u.role}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleApproveUser(u.id)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs transition cursor-pointer flex items-center gap-1"
                              >
                                <BadgeCheck className="w-3.5 h-3.5" />
                                <span>मंजूर करा</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectUser(u.id)}
                                className="px-2 py-1 bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 rounded font-bold text-xs transition cursor-pointer border border-rose-500/30"
                              >
                                नाकारा
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

              {/* Active Users Table / Grid */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 block">
                  सर्व सक्रिय ERP वापरकर्ते (कर्मचारी व व्यवस्थापक):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {(storeData.adminUsers || []).map((u) => {
                    const isRevealed = !!revealedPins[u.id];
                    return (
                      <div
                        key={u.id}
                        className="p-2.5 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                u.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'
                              }`}
                            />
                            <strong className="text-white">{u.displayName}</strong>
                            <span className="text-[10px] text-amber-400">({u.role})</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                            <span>पिन: {isRevealed ? u.pin : '••••'}</span>
                            <button
                              type="button"
                              onClick={() => togglePinReveal(u.id)}
                              className="text-slate-500 hover:text-amber-400 transition cursor-pointer p-0.5"
                              title={isRevealed ? "पिन लपवा" : "पिन पहा"}
                            >
                              {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                            {u.phone && <span>• {u.phone}</span>}
                          </div>
                        </div>

                        {u.id !== 'admin-owner' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                            title="खाते हटवा"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Add Staff Form */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2">
                <span className="text-xs font-bold text-slate-300 block">
                  + नवीन कर्मचारी खाते थेट जोडा (Add Staff Account):
                </span>
                <form
                  onSubmit={handleCreateUser}
                  className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs"
                >
                  <input
                    type="text"
                    required
                    placeholder="कर्मचाऱ्याचे नाव"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                  <input
                    type="tel"
                    placeholder="मोबाईल नंबर"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                  <div className="flex gap-2">
                    <select
                      value={newUserRole}
                      onChange={(e) =>
                        setNewUserRole(e.target.value as 'Cashier' | 'Agent' | 'Manager' | 'Admin')
                      }
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white flex-1"
                    >
                      <option value="Cashier">Cashier</option>
                      <option value="Agent">Agent</option>
                      <option value="Manager">Manager</option>
                      <option value="Admin">Admin</option>
                    </select>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      placeholder="पिन (4-अंकी)"
                      value={newUserPin}
                      onChange={(e) => setNewUserPin(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-mono w-20 text-center"
                    />
                  </div>
                  <button
                    type="submit"
                    className="py-1.5 px-3 bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1 shadow"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>जोडा (Add)</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Production Online Security Controls (साईट ऑनलाईन सुरक्षा व मास्टर पासवर्ड) */}
            <div className="pt-3 border-t border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>ऑनलाईन सुरक्षा, मास्टर पासवर्ड व ऑटो-लॉक (Production Security Controls)</span>
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold">
                  SHA-256 + Anti-Brute-Force ACTIVE
                </span>
              </div>

              {masterPassFeedback && (
                <div
                  className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                    masterPassFeedback.type === 'success'
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{masterPassFeedback.message}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Master Password Change Box */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-white font-bold">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>मास्टर पासवर्ड / पिन बदला (Change Master Password)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    वेबसाईट ऑनलाईन जाताना स्टोअर मालकाचा मास्टर पासवर्ड कूटबद्ध (SHA-256) ठेवला जातो.
                  </p>
                  <form onSubmit={handleChangeMasterPassword} className="space-y-2">
                    <input
                      type="password"
                      placeholder="सध्याचा मास्टर पासवर्ड किंवा पिन (Current)"
                      value={currentMasterPassword}
                      onChange={(e) => setCurrentMasterPassword(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-500"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="password"
                        placeholder="नवीन पासवर्ड (New)"
                        value={newMasterPassword}
                        onChange={(e) => setNewMasterPassword(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-500"
                      />
                      <input
                        type="password"
                        placeholder="पुष्टी करा (Confirm)"
                        value={confirmMasterPassword}
                        onChange={(e) => setConfirmMasterPassword(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 shadow"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>सुरक्षित पासवर्ड अपडेट करा (Enforce New Key)</span>
                    </button>
                  </form>
                </div>

                {/* Auto-Lock & Anti-Brute-Force Settings */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-white font-bold">
                      <Clock className="w-3.5 h-3.5 text-sky-400" />
                      <span>काउंटर ऑटो-लॉक कालावधी (Inactivity Auto-Lock)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      काउंटरवर कोणी नसताना ERP आपोआप लॉक होईल, जेणेकरून ग्राहक किंवा बाहेरील व्यक्ती बिलिंग पाहू शकत नाही.
                    </p>
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      {[5, 15, 30, 0].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => handleUpdateAutoLock(mins)}
                          className={`py-1.5 px-2 rounded-lg text-center font-bold text-xs transition cursor-pointer border ${
                            autoLockMinutes === mins
                              ? 'bg-sky-500/20 text-sky-300 border-sky-400 shadow-sm'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                          }`}
                        >
                          {mins === 0 ? 'बंद (Off)' : `${mins} मि.`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Audit Trail & Reset Lockout Action */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                      <span>ब्रूट-फोर्स मर्यादा: <strong>५ अयशस्वी प्रयत्न</strong></span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAuditTrailOpen(true)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                    >
                      <Database className="w-3 h-3 text-amber-400" />
                      <span>सुरक्षा नोंदी ({storeData.securityAuditLogs?.length || 0})</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery & Transport Rates (Wardha & Nearby Villages) */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Truck className="w-4 h-4" />
                <span>Standard Delivery & Freight Charges (गाव / शहर वाहतूक दर)</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Wardha City</span>
                  <span className="font-bold text-emerald-400 font-mono text-sm">₹200 - ₹300</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700">
                  <span className="text-[10px] text-slate-400 block">5 - 15 km Radius</span>
                  <span className="font-bold text-emerald-400 font-mono text-sm">₹400 - ₹600</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700">
                  <span className="text-[10px] text-slate-400 block">15 - 30 km Radius</span>
                  <span className="font-bold text-emerald-400 font-mono text-sm">₹700 - ₹1,000</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700">
                  <span className="text-[10px] text-slate-400 block">30+ km Distance</span>
                  <span className="font-bold text-emerald-400 font-mono text-sm">₹1,200 - ₹1,500</span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition cursor-pointer shadow-md shadow-amber-500/20"
              >
                Save Showroom Settings
              </button>
            </div>
          </form>
        </div>

        {/* Backup & System Status (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Export / Import Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-400" />
              <span>Full Project Backup & Sync</span>
            </h3>

            <p className="text-slate-400 leading-relaxed text-[11px]">
              Export the entire database including all 15 schemas (Customers, Stock, Invoices, 30-Month Scheme passbooks, Bill Receipts from 1079) as a ZIP archive or JSON file.
            </p>

            <div className="space-y-2 pt-1">
              <button
                id="btn-download-backup-zip"
                onClick={handleDownloadZip}
                disabled={isExporting}
                className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-amber-500/20"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Generating ZIP...' : 'Download Full Backup (.ZIP)'}</span>
              </button>

              <button
                onClick={handleDownloadJSON}
                className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition cursor-pointer flex items-center justify-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4 text-sky-400" />
                <span>Export Raw Database (.JSON)</span>
              </button>
            </div>

            {/* Restore / Import */}
            <div className="border-t border-slate-800 pt-3 space-y-2">
              <label className="text-[11px] font-bold text-slate-300 block">
                Restore Database from JSON:
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="w-full text-slate-400 text-[11px] file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-amber-400 hover:file:bg-slate-700 cursor-pointer"
              />
              {importStatus && (
                <p className="text-[11px] text-amber-400 font-medium">{importStatus}</p>
              )}
            </div>

            {/* Wipe All Demo Data (1-Click Clean Slate) */}
            <div className="border-t border-slate-800 pt-3 space-y-2">
              <button
                type="button"
                onClick={handleWipeDemoData}
                className="w-full py-2.5 px-3 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/50 rounded-lg transition cursor-pointer flex items-center justify-center gap-2 text-xs font-bold shadow-sm"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>🗑️ सर्व डेमो डेटा पुसा (Wipe Demo Data - 1 Click)</span>
              </button>
              <p className="text-[10px] text-slate-400 text-center">
                ग्राहक, बिले, पावत्या व कार्ड डेटा ० होईल. दुकान सेटिंग्ज, GST व कर्मचारी कायम राहतील. (0 Firebase Quota)
              </p>
            </div>

            {/* Reset to Factory Default */}
            <div className="border-t border-slate-800 pt-2">
              <button
                type="button"
                onClick={handleResetData}
                className="w-full py-1.5 px-3 bg-slate-800/60 hover:bg-slate-800 text-slate-400 border border-slate-700/60 rounded-lg transition cursor-pointer flex items-center justify-center gap-2 text-[11px]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Initial Showroom Demo Sample</span>
              </button>
            </div>
          </div>

          {/* Architecture Status Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>Architecture & Multi-Platform</span>
            </h3>

            <div className="space-y-2 text-[11px]">
              <div className="flex items-center justify-between p-2 rounded bg-slate-800/50 border border-slate-800">
                <span className="text-slate-400">Offline-First Engine:</span>
                <span className="font-semibold text-emerald-400">Enabled (LocalStorage + Cache)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-800/50 border border-slate-800">
                <span className="text-slate-400">Electron Desktop App:</span>
                <span className="font-semibold text-sky-400">Compatible (electron-builder)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-800/50 border border-slate-800">
                <span className="text-slate-400">Firebase Firestore:</span>
                <span className="font-semibold text-amber-400">Rules active (firestore.rules)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-800/50 border border-slate-800">
                <span className="text-slate-400">Receipt Series:</span>
                <span className="font-mono text-emerald-400 font-bold">1079 onwards</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Audit Trail Modal */}
      {isAuditTrailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">सुरक्षा तपासणी नोंदवही (Live Security Audit Trail)</h3>
                  <p className="text-[11px] text-slate-400">लॉगिन प्रयत्न, पासवर्ड बदल व कर्मचाऱ्यांच्या हालचालींची अधिकृत नोंद</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAuditTrailOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Actions Bar */}
            <div className="p-3 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">एकूण नोंदी:</span>
                <span className="font-bold text-amber-400 font-mono">
                  {storeData.securityAuditLogs?.length || 0}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    SecurityService.resetLockout();
                    setUserActionMessage('सर्व लॉगिन लॉक स्थिती सुरक्षितपणे रिसेट केली!');
                    setTimeout(() => setUserActionMessage(null), 3000);
                  }}
                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-md font-bold text-xs transition cursor-pointer"
                >
                  लॉगिन लॉक रिसेट करा (Reset Lockout)
                </button>
              </div>
            </div>

            {/* Audit Logs List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 text-xs divide-y divide-slate-800/60">
              {!storeData.securityAuditLogs || storeData.securityAuditLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  कोणतीही सुरक्षा नोंद आढळली नाही.
                </div>
              ) : (
                storeData.securityAuditLogs.map((log) => {
                  let badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
                  if (log.eventType === 'LOGIN_SUCCESS') badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
                  if (log.eventType === 'LOGIN_FAILED') badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                  if (log.eventType === 'LOCKOUT_TRIGGERED') badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
                  if (log.eventType === 'PASSWORD_CHANGED') badgeColor = 'bg-purple-500/20 text-purple-300 border-purple-500/40';
                  if (log.eventType === 'ACCOUNT_APPROVED') badgeColor = 'bg-sky-500/20 text-sky-300 border-sky-500/40';

                  return (
                    <div key={log.id} className="pt-2 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${badgeColor}`}>
                            {log.eventType}
                          </span>
                          <span className="font-bold text-white">{log.username}</span>
                          <span className="text-[10px] text-slate-400">({log.role})</span>
                        </div>
                        <p className="text-slate-300 text-[11px]">{log.details}</p>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono shrink-0 sm:text-right">
                        {new Date(log.timestamp).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex justify-end">
              <button
                type="button"
                onClick={() => setIsAuditTrailOpen(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                बंद करा (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
