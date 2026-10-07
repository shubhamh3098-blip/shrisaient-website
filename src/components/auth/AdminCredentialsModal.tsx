import React, { useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Lock,
  User,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  X,
  Sparkles,
  Save,
  Users,
  Smartphone,
  Info
} from 'lucide-react';
import { StoreData, AdminUser } from '../../types';
import { SecurityService } from '../../services/securityService';

interface AdminCredentialsModalProps {
  storeData: StoreData;
  isOpen: boolean;
  onClose: () => void;
  onRefreshData?: () => void;
  currentUser?: AdminUser;
}

export const AdminCredentialsModal: React.FC<AdminCredentialsModalProps> = ({
  storeData,
  isOpen,
  onClose,
  onRefreshData,
  currentUser,
}) => {
  const secSettings = SecurityService.getSecuritySettings(storeData);
  const adminUser = (storeData.adminUsers || []).find(
    (u) => u.role === 'Admin' || u.id === 'usr-1' || u.username === secSettings.masterUsername
  ) || {
    id: 'usr-1',
    username: secSettings.masterUsername || 'admin',
    displayName: storeData.settings.ownerName || 'Shubham Shende',
    role: 'Admin' as const,
    pin: '1234',
    status: 'active' as const,
  };

  const [activeTab, setActiveTab] = useState<'admin' | 'staff'>('admin');

  // Form states for Admin Credential Change
  const [newUsername, setNewUsername] = useState(adminUser.username || secSettings.masterUsername || 'admin');
  const [newDisplayName, setNewDisplayName] = useState(adminUser.displayName || storeData.settings.ownerName || 'Shubham Shende');
  const [currentSecret, setCurrentSecret] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Staff PIN change states
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [newStaffPin, setNewStaffPin] = useState<string>('');
  const [staffPinSuccess, setStaffPinSuccess] = useState<string | null>(null);

  // Status & feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmitAdminChange = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanUsername = newUsername.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      setErrorMessage('लॉगिन युझरनेम किमान ३ अक्षरांचे असावे (उदा. admin, shubham).');
      return;
    }

    if (newPassword) {
      if (newPassword.trim().length < 4) {
        setErrorMessage('नवीन पासवर्ड किंवा पिन किमान ४ अंकांचा किंवा अक्षरांचा असावा.');
        return;
      }
      if (newPassword.trim() !== confirmPassword.trim()) {
        setErrorMessage('नवीन पासवर्ड आणि पुष्टी पासवर्ड एकमेकांशी जुळत नाहीत!');
        return;
      }
    }

    // Require current password only if user is setting a new password/pin and current user is not verified as Admin
    if (newPassword && !currentSecret && currentUser?.role !== 'Admin') {
      setErrorMessage('सुरक्षेसाठी कृपया सध्याचा चालू पासवर्ड किंवा पिन प्रविष्ट करा (डिफॉल्ट पिन: 1234 आहे).');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = SecurityService.updateAdminCredentials({
        currentSecret: currentSecret ? currentSecret.trim() : (currentUser?.role === 'Admin' ? undefined : '1234'),
        newUsername: cleanUsername,
        newDisplayName: newDisplayName.trim(),
        newPasswordOrPin: newPassword ? newPassword.trim() : undefined,
        bypassCurrentSecret: (!currentSecret && currentUser?.role === 'Admin') || (!currentSecret && !secSettings.masterPasswordHash),
      });

      if (res.success) {
        setSuccessMessage('🎉 ॲडमिन लॉगिन युझरनेम व पासवर्ड यशस्वीरीत्या बदलण्यात आला! सर्व डिव्हाइसवर नवीन माहिती लागू झाली आहे.');
        setCurrentSecret('');
        setNewPassword('');
        setConfirmPassword('');
        if (onRefreshData) onRefreshData();
        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);
      } else {
        setErrorMessage(res.error || 'क्रेडेन्शियल्स अपडेट करताना त्रुटी आली.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'अपेक्षित त्रुटी आली. कृपया पुन्हा प्रयत्न करा.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStaffPin = (userId: string) => {
    if (!newStaffPin || newStaffPin.trim().length < 4) {
      setErrorMessage('कर्मचाऱ्याचा नवीन पिन किमान ४ अंकांचा असावा.');
      return;
    }

    const res = SecurityService.updateUserPinByAdmin(userId, newStaffPin.trim());
    if (res.success) {
      const staffObj = (storeData.adminUsers || []).find((u) => u.id === userId);
      setStaffPinSuccess(`"${staffObj?.displayName}" चा पिन यशस्वीरीत्या बदलून "${newStaffPin.trim()}" करण्यात आला!`);
      setNewStaffPin('');
      setSelectedStaffId('');
      if (onRefreshData) onRefreshData();
      setTimeout(() => setStaffPinSuccess(null), 4000);
    } else {
      setErrorMessage(res.error || 'पिन बदल अयशस्वी.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl text-slate-100 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-linear-to-r from-slate-900 via-indigo-950/60 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>ॲडमिन लॉगिन व पासवर्ड व्यवस्थापन</span>
              </h2>
              <p className="text-xs text-slate-400">
                ERP ॲडमिनचे युझरनेम, पासवर्ड आणि पिन थेट येथून बदला
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="बंद करा"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 sm:px-5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setErrorMessage(null);
            }}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'admin'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>सुपर ॲडमिन लॉगिन (Admin Credentials)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('staff');
              setErrorMessage(null);
            }}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'staff'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>इतर कर्मचारी पिन व्यवस्थापन (Staff PINs)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Alerts */}
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block">यशस्वी!</span>
                <span>{successMessage}</span>
              </div>
            </div>
          )}

          {staffPinSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{staffPinSuccess}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block">त्रुटी:</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {activeTab === 'admin' ? (
            <form onSubmit={handleSubmitAdminChange} className="space-y-4">
              {/* Current Active Info Card */}
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="text-[11px] text-slate-400 block font-medium">सध्याचे अधिकृत ॲडमिन खाते:</span>
                  <div className="flex items-center gap-2">
                    <strong className="text-white text-sm">{adminUser.displayName || storeData.settings.ownerName}</strong>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                      Super Admin
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    लॉगिन युझरनेम: <span className="text-amber-400 font-bold">{adminUser.username || secSettings.masterUsername}</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">सध्याचा पिन:</span>
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {adminUser.pin ? adminUser.pin : '1234'}
                  </span>
                </div>
              </div>

              {/* Username & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>ॲडमिन लॉगिन युझरनेम (Username):</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                    placeholder="उदा. admin किंवा shubham"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-slate-500">
                    * या नावाने किंवा मोबाईल नंबरने तुम्ही लॉगिन करू शकता
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>मालकाचे नाव (Display Name):</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    placeholder="उदा. Shubham Shende"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-slate-500">
                    * पावत्या आणि स्क्रीनवर दिसणारे नाव
                  </span>
                </div>
              </div>

              {/* Password / PIN Section */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    <span>नवीन पासवर्ड किंवा पिन सेट करा (Set New Password / PIN):</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    किमान ४ अक्षरे किंवा ४ अंकी पिन
                  </span>
                </div>

                {/* Current Secret Verification */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                    <span>सध्याचा चालू पासवर्ड किंवा पिन (Current Password/PIN):</span>
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showCurrentPassword ? 'लपवा' : 'पहा'}</span>
                    </button>
                  </label>
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentSecret}
                    onChange={(e) => setCurrentSecret(e.target.value)}
                    placeholder="सध्याचा पिन (उदा. 1234 किंवा चालू पासवर्ड)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400 text-xs"
                  />
                  <p className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Info className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>सुरुवातीचा डिफॉल्ट पिन <strong>1234</strong> आहे. नवीन पासवर्ड टाकल्यावर तो लगेच बदलला जाईल.</span>
                  </p>
                </div>

                {/* New Password & Confirm */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-medium text-slate-300 flex items-center justify-between">
                      <span>नवीन पासवर्ड / पिन (New):</span>
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showNewPassword ? 'लपवा' : 'पहा'}</span>
                      </button>
                    </label>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="उदा. 4321 किंवा Admin@2026"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-medium text-slate-300">
                      <span>नवीन पासवर्डची पुष्टी (Confirm):</span>
                    </label>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="नवीन पासवर्ड पुन्हा टाईप करा"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400 text-xs"
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0 text-blue-400" />
                  <span>
                    नवीन पासवर्ड / पिन सेव्ह केल्यावर जुना पिन लगेच रद्द होईल आणि नवीन पिन सर्व फोनवर लागू होईल.
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'सेव्ह होत आहे...' : 'माहिती व पासवर्ड अपडेट करा'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Staff PINs Manager */
            <div className="space-y-3 text-xs">
              <p className="text-slate-400">
                सुपर ॲडमिन म्हणून तुम्ही कोणत्याही कर्मचाऱ्याचा (Cashier, Manager, Agent) पिन थेट येथून बदलू शकता:
              </p>

              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {(storeData.adminUsers || []).map((u) => {
                  const isEditingThis = selectedStaffId === u.id;
                  const isSuperAdmin = u.role === 'Admin' || u.id === 'usr-1';

                  return (
                    <div
                      key={u.id}
                      className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-white text-sm">{u.displayName}</strong>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.role === 'Admin'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : u.role === 'Manager'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            }`}
                          >
                            {u.role}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                          <span>युझरनेम: <strong className="text-slate-300">{u.username}</strong></span>
                          <span>•</span>
                          <span>चालू पिन: <strong className="text-amber-400">{u.pin || '1234'}</strong></span>
                        </div>
                      </div>

                      {isEditingThis ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <input
                            type="password"
                            maxLength={8}
                            value={newStaffPin}
                            onChange={(e) => setNewStaffPin(e.target.value)}
                            placeholder="नवीन पिन"
                            className="w-24 bg-slate-950 border border-slate-600 rounded-lg px-2.5 py-1 text-white font-mono text-center text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateStaffPin(u.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition cursor-pointer text-xs"
                          >
                            सेव्ह
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStaffId('');
                              setNewStaffPin('');
                            }}
                            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition cursor-pointer text-xs"
                          >
                            रद्द
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStaffId(u.id);
                            setNewStaffPin(u.pin || '');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-amber-300 font-bold transition cursor-pointer text-xs flex items-center gap-1.5 self-start sm:self-auto shrink-0"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>पिन बदला</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
