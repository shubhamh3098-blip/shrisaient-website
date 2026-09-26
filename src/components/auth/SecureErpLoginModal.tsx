import React, { useState, useEffect } from 'react';
import {
  Lock,
  ShieldCheck,
  User,
  Phone,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  UserPlus,
  RefreshCw,
  Clock,
  HelpCircle,
  BadgeCheck,
  X,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { AdminUser, StoreData } from '../../types';
import { SecurityService } from '../../services/securityService';
import { StorageService } from '../../services/storageService';

interface SecureErpLoginModalProps {
  storeData: StoreData;
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AdminUser) => void;
  onRefreshData: () => void;
}

export const SecureErpLoginModal: React.FC<SecureErpLoginModalProps> = ({
  storeData,
  isOpen,
  onClose,
  onLoginSuccess,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'recovery' | 'approvals'>('login');

  // Form Fields - Login
  const [identifier, setIdentifier] = useState('');
  const [secret, setSecret] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Rate Limiting / Lockout Countdown State
  const [lockoutState, setLockoutState] = useState(() => SecurityService.getLockoutState());

  // Form Fields - Staff Sign Up
  const [signupName, setSignupName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupRole, setSignupRole] = useState<'Cashier' | 'Manager' | 'Agent' | 'Staff'>('Cashier');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPin, setSignupPin] = useState('');
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState('');

  // Form Fields - Master Password Recovery
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [newMasterPassword, setNewMasterPassword] = useState('');
  const [confirmMasterPassword, setConfirmMasterPassword] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');

  // Form Fields - Approvals Master Gate
  const [masterGatePin, setMasterGatePin] = useState('');
  const [isMasterGateUnlocked, setIsMasterGateUnlocked] = useState(false);
  const [approvalsError, setApprovalsError] = useState('');
  const [approvalsSuccess, setApprovalsSuccess] = useState('');

  // Live timer for Lockout countdown
  useEffect(() => {
    if (!lockoutState.isLocked) return;

    const interval = setInterval(() => {
      const state = SecurityService.getLockoutState();
      setLockoutState(state);
      if (!state.isLocked) {
        setLoginError('');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockoutState.isLocked]);

  // Handle Login Submission
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (lockoutState.isLocked) {
      return;
    }

    if (!identifier.trim()) {
      setLoginError('कृपया युझरनेम किंवा मोबाईल नंबर प्रविष्ट करा.');
      return;
    }
    if (!secret.trim()) {
      setLoginError('कृपया पासवर्ड किंवा सुरक्षा पिन प्रविष्ट करा.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const res = SecurityService.authenticateUser(identifier, secret);
      setIsSubmitting(false);

      if (res.success && res.user) {
        if (rememberMe) {
          localStorage.setItem('sai_erp_remembered_id', identifier.trim());
        } else {
          localStorage.removeItem('sai_erp_remembered_id');
        }

        onLoginSuccess(res.user);
        onClose();
      } else {
        setLoginError(res.error || 'अवैध युझरनेम किंवा पासवर्ड!');
        const updatedLockout = SecurityService.getLockoutState();
        setLockoutState(updatedLockout);
      }
    }, 300);
  };

  // Staff Sign Up
  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    setSignupSuccess('');

    const name = signupName.trim();
    const phone = signupPhone.trim().replace(/[^0-9]/g, '');
    const uname = (signupUsername.trim() || name.toLowerCase().replace(/\s+/g, '_')).replace(/[^a-zA-Z0-9_]/g, '');
    const pwd = signupPassword.trim();
    const pin = signupPin.trim();

    if (!name || name.length < 2) {
      setSignupError('कृपया पूर्ण नाव प्रविष्ट करा (उदा. सचिन भोयर).');
      return;
    }
    if (!phone || phone.length < 10) {
      setSignupError('कृपया वैध १०-अंकी मोबाईल नंबर प्रविष्ट करा.');
      return;
    }
    if (!pwd || pwd.length < 4) {
      setSignupError('पासवर्ड किमान ४ अक्षरांचा असणे आवश्यक आहे.');
      return;
    }

    const currentUsers = storeData.adminUsers || [];
    const existing = currentUsers.find(
      (u) =>
        u.username.toLowerCase() === uname.toLowerCase() ||
        (u.phone && u.phone.replace(/[^0-9]/g, '') === phone)
    );

    if (existing) {
      setSignupError(`या मोबाईल किंवा युझरनेमने आधीच खाते अस्तित्वात आहे (${existing.displayName}).`);
      return;
    }

    try {
      const newUser = StorageService.addAdminUser({
        username: uname,
        displayName: name,
        role: signupRole,
        pin: pin || pwd.slice(-4),
        phone,
        status: 'pending',
        passwordHash: SecurityService.hash(pwd),
        createdAt: new Date().toISOString(),
      });

      SecurityService.logSecurityAudit({
        username: uname,
        role: signupRole,
        eventType: 'LOGIN_FAILED',
        ipOrDevice: navigator.userAgent,
        details: `नवीन कर्मचारी नोंदणी अर्ज दाखल: ${name} (${signupRole}). मंजुरी प्रलंबित.`,
      });

      onRefreshData();
      setSignupSuccess(
        `✅ खाते यशस्वीरीत्या तयार झाले! सुरक्षा नियमांनुसार मुख्य मालक (Owner) मंजुरी देईपर्यंत खाते प्रलंबित (Pending) राहील.`
      );
      setSignupName('');
      setSignupPhone('');
      setSignupUsername('');
      setSignupPassword('');
      setSignupPin('');
    } catch (err: any) {
      setSignupError('नोंदणी करताना त्रुटी आली: ' + err.message);
    }
  };

  // Master Recovery
  const handleRecoverPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    setRecoverySuccess('');

    if (!recoveryAnswer.trim()) {
      setRecoveryError('कृपया सुरक्षा प्रश्नाचे उत्तर प्रविष्ट करा.');
      return;
    }
    if (!newMasterPassword || newMasterPassword.length < 4) {
      setRecoveryError('नवीन पासवर्ड किमान ४ ते ६ अक्षरांचा असावा.');
      return;
    }
    if (newMasterPassword !== confirmMasterPassword) {
      setRecoveryError('दोन्ही पासवर्ड जुळत नाहीत. कृपया पुन्हा तपासा.');
      return;
    }

    const res = SecurityService.recoverMasterPassword(recoveryAnswer, newMasterPassword);
    if (res.success) {
      setRecoverySuccess('✓ मास्टर पासवर्ड यशस्वीरीत्या बदलला गेला! आता तुम्ही नवीन पासवर्डने लॉगिन करू शकता.');
      setRecoveryAnswer('');
      setNewMasterPassword('');
      setConfirmMasterPassword('');
      setLockoutState(SecurityService.getLockoutState());
    } else {
      setRecoveryError(res.error || 'पडताळणी अयशस्वी.');
    }
  };

  // Approvals Gate Verification
  const handleVerifyMasterGate = (e: React.FormEvent) => {
    e.preventDefault();
    setApprovalsError('');

    const res = SecurityService.authenticateUser('admin', masterGatePin);
    if (res.success) {
      setIsMasterGateUnlocked(true);
      setMasterGatePin('');
    } else {
      setApprovalsError('अवैध मालक पासवर्ड! मंजुरी पॅनल उघडण्यास परवानगी नाही.');
    }
  };

  // Approve a pending user
  const handleApproveUser = (userId: string) => {
    StorageService.approveAdminUser(userId, 'Store Owner');
    onRefreshData();
    setApprovalsSuccess('खाते मंजूर करण्यात आले व सक्रिय झाले!');
    setTimeout(() => setApprovalsSuccess(''), 3000);
  };

  // Reject a user
  const handleRejectUser = (userId: string) => {
    StorageService.rejectAdminUser(userId);
    onRefreshData();
    setApprovalsSuccess('खाते नाकारण्यात आले.');
    setTimeout(() => setApprovalsSuccess(''), 3000);
  };

  const secSettings = SecurityService.getSecuritySettings(storeData);
  const pendingUsers = (storeData.adminUsers || []).filter((u) => u.status === 'pending');

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-slate-100 relative">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  साई कृपा ERP - सुरक्षित पोर्टल
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  सुरक्षित (256-Bit)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                अधिकृत कर्मचारी व ॲडमिन प्रवेश (Authorized Staff & Admin Access)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-1.5 gap-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'login'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>लॉगिन (Login)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('signup')}
            className={`flex-1 py-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'signup'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>स्टाफ नोंदणी</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('recovery')}
            className={`flex-1 py-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'recovery'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>पासवर्ड मदत</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('approvals')}
            className={`relative py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'approvals'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BadgeCheck className="w-3.5 h-3.5" />
            <span>मंजुरी</span>
            {pendingUsers.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center">
                {pendingUsers.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Secure Login */}
        {activeTab === 'login' && (
          <div className="p-5 sm:p-6 space-y-4">
            {/* Brute-force Lockout Alert */}
            {lockoutState.isLocked && (
              <div className="p-4 rounded-2xl bg-rose-950/80 border-2 border-rose-500 text-rose-200 text-xs space-y-2 animate-bounce-subtle">
                <div className="flex items-center gap-2 text-rose-300 font-black text-sm">
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                  <span>सुरक्षा कुलूपबंद (Anti-Brute-Force Lockout Active)</span>
                </div>
                <p className="leading-relaxed text-[11px] text-rose-300/90">
                  सतत ५ वेळा चुकीचा पासवर्ड प्रविष्ट केल्याने सायबर सुरक्षेसाठी लॉगिन तात्पुरते थांबवले आहे.
                </p>
                <div className="p-2.5 bg-rose-900/50 rounded-xl text-center font-mono font-black text-lg text-white border border-rose-600/40">
                  उर्वरित वेळ: {formatCountdown(lockoutState.remainingSeconds)}
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  युझरनेम किंवा अधिकृत मोबाईल नंबर (Username / Phone) *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    disabled={lockoutState.isLocked || isSubmitting}
                    placeholder="उदा. admin किंवा 9822334455"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      setLoginError('');
                    }}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    सुरक्षित पासवर्ड किंवा पिन (Password / Security PIN) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveTab('recovery')}
                    className="text-[11px] text-amber-400 hover:underline font-semibold cursor-pointer"
                  >
                    पासवर्ड विसरलात?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    disabled={lockoutState.isLocked || isSubmitting}
                    placeholder="••••••••"
                    value={secret}
                    onChange={(e) => {
                      setSecret(e.target.value);
                      setLoginError('');
                    }}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-700 focus:ring-amber-500"
                  />
                  <span>या डिव्हाइसवर माहिती लक्षात ठेवा</span>
                </label>

                <span className="text-[11px] text-slate-500 font-mono">
                  Anti-Brute Force Protection
                </span>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <p className="font-semibold leading-relaxed">{loginError}</p>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={lockoutState.isLocked || isSubmitting}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>प्रमाणित करत आहे...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>सुरक्षित लॉगिन करा (Secure Login)</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-bold text-slate-300">🔒 ऑनलाइन सुरक्षा नियमावली:</span>
                <span className="font-mono text-emerald-400">Active Shield</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                वेबसाइट ऑनलाइन असल्याने सर्व पासवर्ड व सुरक्षा पिन क्रिप्टोग्राफिकदृष्ट्या एनक्रिप्टेड (Hashed) आहेत. सतत ५ चुकीच्या प्रयत्नांनंतर सिस्टीम ५ मिनिटे लॉक होते.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Staff Sign Up */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignUp} className="p-5 sm:p-6 space-y-3.5 max-h-[75vh] overflow-y-auto">
            <div>
              <h4 className="text-sm font-bold text-white">नवीन कर्मचारी / एजंट नोंदणी (Staff Sign Up)</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                नोंदणीनंतर मालकाकडून (Admin) खाते मंजूर झाल्यावरच लॉगिन करता येईल.
              </p>
            </div>

            {signupSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="font-semibold leading-relaxed">{signupSuccess}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs transition cursor-pointer"
                >
                  लॉगिन स्क्रीनवर जा
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">पूर्ण नाव *</label>
                    <input
                      type="text"
                      placeholder="उदा. राहुल जोशी"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">मोबाईल नंबर *</label>
                    <input
                      type="tel"
                      placeholder="१०-अंकी मोबाईल"
                      maxLength={10}
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">पसंतीचे युझरनेम (Username)</label>
                    <input
                      type="text"
                      placeholder="उदा. rahul_cashier"
                      value={signupUsername}
                      onChange={(e) => setSignupUsername(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">कामकाज भूमिका (Role) *</label>
                    <select
                      value={signupRole}
                      onChange={(e) => setSignupRole(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs"
                    >
                      <option value="Cashier">कॅशियर (Cashier / Counter)</option>
                      <option value="Manager">मॅनेजर (Store / Floor Manager)</option>
                      <option value="Agent">रिकव्हरी एजंट (Recovery Agent)</option>
                      <option value="Staff">सेल्स स्टाफ (Sales & Staff)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">गुप्त पासवर्ड (Password) *</label>
                    <input
                      type="password"
                      placeholder="किमान ४ अक्षरे"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">फास्ट टर्मिनल पिन (4-Digit PIN)</label>
                    <input
                      type="password"
                      placeholder="उदा. 4321"
                      maxLength={6}
                      value={signupPin}
                      onChange={(e) => setSignupPin(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs font-mono"
                    />
                  </div>
                </div>

                {signupError && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                    {signupError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md"
                >
                  नोंदणी अर्ज पाठवा (Submit Registration)
                </button>
              </>
            )}
          </form>
        )}

        {/* Tab 3: Master Password Recovery */}
        {activeTab === 'recovery' && (
          <form onSubmit={handleRecoverPassword} className="p-5 sm:p-6 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>मास्टर पासवर्ड रिकव्हरी (Master Password Recovery)</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                जर मालक पासवर्ड विसरले असतील, तर सुरक्षितता प्रश्नाचे उत्तर देऊन लगेच नवीन पासवर्ड तयार करा.
              </p>
            </div>

            {recoverySuccess ? (
              <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs space-y-3">
                <p className="font-bold">{recoverySuccess}</p>
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs transition cursor-pointer"
                >
                  आता लॉगिन करा
                </button>
              </div>
            ) : (
              <>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                    सुरक्षितता प्रश्न (Security Question):
                  </span>
                  <p className="text-xs font-semibold text-white">
                    {secSettings.securityRecoveryQuestion || 'तुमच्या शोरूमचे नाव काय आहे? (What is your showroom name?)'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    तुमचे उत्तर (Security Answer) *
                  </label>
                  <input
                    type="text"
                    placeholder="उदा. sai krupa"
                    value={recoveryAnswer}
                    onChange={(e) => setRecoveryAnswer(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs font-medium"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">नवीन पासवर्ड *</label>
                    <input
                      type="password"
                      placeholder="नवीन पासवर्ड"
                      value={newMasterPassword}
                      onChange={(e) => setNewMasterPassword(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">पासवर्ड पुन्हा टाका *</label>
                    <input
                      type="password"
                      placeholder="पुन्हा टाका"
                      value={confirmMasterPassword}
                      onChange={(e) => setConfirmMasterPassword(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs font-mono"
                      required
                    />
                  </div>
                </div>

                {recoveryError && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                    {recoveryError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer shadow-md"
                >
                  मास्टर पासवर्ड रीसेट करा (Reset Password)
                </button>
              </>
            )}
          </form>
        )}

        {/* Tab 4: Admin Staff Approvals */}
        {activeTab === 'approvals' && (
          <div className="p-5 sm:p-6 space-y-4">
            {!isMasterGateUnlocked ? (
              <form onSubmit={handleVerifyMasterGate} className="space-y-3">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                  🔒 कर्मचारी खाती मंजूर करण्यासाठी मुख्य मालक (Owner / Admin) पासवर्ड आवश्यक आहे.
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    मालक पासवर्ड / पिन टाका:
                  </label>
                  <input
                    type="password"
                    placeholder="••••"
                    value={masterGatePin}
                    onChange={(e) => setMasterGatePin(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs font-mono"
                    required
                  />
                </div>

                {approvalsError && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                    {approvalsError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer"
                >
                  मंजुरी पॅनल उघडा (Unlock Panel)
                </button>
              </form>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white">प्रलंबित कर्मचारी खाती ({pendingUsers.length})</h4>
                  <span className="text-[10px] text-emerald-400 font-mono">✓ Master Unlocked</span>
                </div>

                {approvalsSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-300 text-xs border border-emerald-500/30">
                    {approvalsSuccess}
                  </div>
                )}

                {pendingUsers.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs bg-slate-950 rounded-xl border border-slate-800">
                    कोणतेही प्रलंबित खाते नाही. सर्व खाती मंजूर आहेत.
                  </div>
                ) : (
                  pendingUsers.map((user) => (
                    <div
                      key={user.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <strong className="text-white block text-sm">{user.displayName}</strong>
                        <span className="text-slate-400 text-[11px] font-mono">
                          भूमिका: {user.role} • फोन: {user.phone}
                        </span>
                        <span className="text-slate-500 text-[10px] block">
                          अर्ज वेळ: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleApproveUser(user.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>मंजूर करा</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectUser(user.id)}
                          className="px-2.5 py-1.5 bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 rounded-lg font-bold text-xs transition cursor-pointer border border-rose-500/30"
                        >
                          नाकारा
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>साई कृपा फर्निचर व इलेक्ट्रॉनिक्स, वर्धा</span>
          </div>
          <span className="font-mono text-[10px] text-slate-500">v2.6 Enterprise</span>
        </div>
      </div>
    </div>
  );
};
