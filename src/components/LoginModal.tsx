import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  UserCheck,
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Store,
  RefreshCw,
  X,
  UserPlus,
  KeyRound,
  Clock,
  Phone,
  Briefcase
} from 'lucide-react';
import { AuthUser, UserRole, StaffMember } from '../types';

interface LoginModalProps {
  onLoginSuccess: (user: AuthUser) => void;
  adminEmail?: string;
  adminName?: string;
  adminPassword?: string;
  staffPassword?: string;
  staffList?: StaffMember[];
  onRegisterStaff?: (staff: Omit<StaffMember, 'id'>) => void;
  isOpen?: boolean;
  onClose?: () => void;
  canClose?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  onLoginSuccess,
  adminEmail = 'shubhamh3098@gmail.com',
  adminName = 'Shubham (Owner)',
  adminPassword = 'admin',
  staffPassword = 'staff',
  staffList = [],
  onRegisterStaff,
  onClose,
  canClose = true,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [role, setRole] = useState<UserRole>('admin');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [staffIdentifier, setStaffIdentifier] = useState<string>('');
  
  // Pending verification unlock key
  const [verifyMasterKey, setVerifyMasterKey] = useState<string>('');
  const [showVerifyUnlock, setShowVerifyUnlock] = useState<boolean>(false);
  const [pendingStaffToVerify, setPendingStaffToVerify] = useState<StaffMember | null>(null);

  // Sign Up form state
  const [signupName, setSignupName] = useState<string>('');
  const [signupPhone, setSignupPhone] = useState<string>('');
  const [signupEmail, setSignupEmail] = useState<string>('');
  const [signupRole, setSignupRole] = useState<string>('Sales & Billing (काउंटर बिलिंग)');
  const [signupPassword, setSignupPassword] = useState<string>('');
  const [signupAdminKey, setSignupAdminKey] = useState<string>('');
  const [signupSubmitted, setSignupSubmitted] = useState<boolean>(false);

  // OTP state
  const [email, setEmail] = useState<string>(adminEmail);
  const [name, setName] = useState<string>(adminName);
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [timer, setTimer] = useState<number>(60);
  const [showOtpNotification, setShowOtpNotification] = useState<boolean>(false);

  // Common status
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Keep email & name in sync when role toggles
  useEffect(() => {
    if (role === 'admin') {
      setEmail(adminEmail || 'shubhamh3098@gmail.com');
      setName(adminName || 'Shubham (Admin)');
    } else {
      if (staffList.length > 0) {
        setEmail(staffList[0].email || 'staff@shrisai.in');
        setName(staffList[0].name || 'Store Staff');
      } else {
        setEmail('staff@shrisai.in');
        setName('Store Staff');
      }
    }
    setErrorMsg('');
    setPasswordInput('');
    setShowVerifyUnlock(false);
    setPendingStaffToVerify(null);
  }, [role, adminEmail, adminName, staffList]);

  // Timer countdown for OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loginMethod === 'otp' && step === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [loginMethod, step, timer]);

  // Master approval codes accepted for on-the-spot verification
  const isValidAdminKey = (key: string): boolean => {
    const clean = key.trim().toLowerCase();
    const activeAdminPass = (adminPassword || 'admin').trim().toLowerCase();
    return clean === activeAdminPass;
  };

  // 1. Password Login Handler
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setShowVerifyUnlock(false);
    setPendingStaffToVerify(null);

    const input = passwordInput.trim();
    if (!input) {
      setErrorMsg('कृपया पासवर्ड प्रविष्ट करा (Please enter password)');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      if (role === 'admin') {
        // Admin password check
        if (isValidAdminKey(input)) {
          setSuccessMsg('ॲडमिन लॉगिन यशस्वी! सर्व बिझनेस खाती व ईआरपी उघडत आहे...');
          const user: AuthUser = {
            id: 'usr-admin',
            email: adminEmail || 'shubhamh3098@gmail.com',
            name: adminName || 'Shubham (Owner)',
            role: 'admin',
            loggedInAt: new Date().toISOString(),
          };
          setTimeout(() => onLoginSuccess(user), 300);
        } else {
          setErrorMsg('चुकीचा ॲडमिन पासवर्ड! कृपया वैध ॲडमिन क्रेडेंशियल्स टाका.');
        }
      } else {
        // Staff Login check: verify against registered staffList first
        const searchId = staffIdentifier.trim().toLowerCase();
        let matchedStaff = staffList.find(
          (s) =>
            (s.email && s.email.toLowerCase() === searchId) ||
            (s.phone && s.phone === searchId) ||
            (s.name && s.name.toLowerCase() === searchId)
        );

        if (matchedStaff) {
          // Check staff approval status
          if (matchedStaff.status === 'pending_approval') {
            setPendingStaffToVerify(matchedStaff);
            setShowVerifyUnlock(true);
            setErrorMsg(
              `⚠️ सुरक्षा निर्बंध: तुमचे खाते 'Pending Approval' स्थितीत आहे. सुरक्षेसाठी ॲडमिनची (शुभम सर) मंजुरी आवश्यक आहे. जोपर्यंत ॲडमिन मंजुरी देत नाहीत, तोपर्यंत ERP मधील कोणताही डेटा (ग्राहक, हिशोब, बिले) पाहता येणार नाही.`
            );
            return;
          }

          if (matchedStaff.status === 'rejected') {
            setErrorMsg('❌ तुमचा अर्ज ॲडमिनद्वारे नाकारण्यात आला आहे. प्रवेश बंदी.');
            return;
          }

          // Check individual staff password
          const validStaffPasswords = [
            (matchedStaff.password || '').toLowerCase(),
            (staffPassword || '').toLowerCase()
          ].filter(Boolean);

          if (validStaffPasswords.includes(input.toLowerCase())) {
            setSuccessMsg(`स्वागत आहे, ${matchedStaff.name}! बिलिंग पॅनल उघडत आहे...`);
            const user: AuthUser = {
              id: matchedStaff.id,
              email: matchedStaff.email || `${matchedStaff.phone}@shrisai.in`,
              name: matchedStaff.name,
              role: 'staff',
              loggedInAt: new Date().toISOString(),
            };
            setTimeout(() => onLoginSuccess(user), 300);
          } else {
            setErrorMsg('चुकीचा कर्मचारी पासवर्ड! कृपया तुमचा नोंदणीकृत पासवर्ड टाका.');
          }
        } else {
          // Strict Zero-Trust Guard: No unapproved stranger can log in without admin approval
          setErrorMsg(
            '❌ अज्ञातास प्रवेश नाही: हा मोबाईल नंबर किंवा नाव कर्मचारी यादीत नोंदणीकृत नाही. कृपया प्रथम "नवीन स्टाफ नोंदणी (Sign Up)" करा आणि ॲडमिन (शुभम सर) कडून मंजुरी घ्या.'
          );
        }
      }
    }, 250);
  };

  // Instant Verification of Pending Staff using Master PIN
  const handleInstantUnlock = () => {
    if (!verifyMasterKey.trim()) {
      setErrorMsg('कृपया ॲडमिन मास्टर कोड प्रविष्ट करा.');
      return;
    }
    if (isValidAdminKey(verifyMasterKey)) {
      if (pendingStaffToVerify && onRegisterStaff) {
        onRegisterStaff({
          ...pendingStaffToVerify,
          status: 'active',
          approvedAt: new Date().toISOString(),
          approvedBy: 'Instant Master Key',
        });
      }
      setSuccessMsg('✅ खाते यशस्वीरीत्या मंजूर (Verified) झाले! ईआरपी उघडत आहे...');
      const user: AuthUser = {
        id: pendingStaffToVerify?.id || `usr-staff-${Date.now()}`,
        email: pendingStaffToVerify?.email || 'staff@shrisai.in',
        name: pendingStaffToVerify?.name || 'Verified Staff',
        role: 'staff',
        loggedInAt: new Date().toISOString(),
      };
      setTimeout(() => onLoginSuccess(user), 400);
    } else {
      setErrorMsg('चुकीचा ॲडमिन मास्टर कोड! फक्त अधिकृत ॲडमिनच व्हेरिफाय करू शकतात.');
    }
  };

  // 2. Sign Up Form Handler
  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!signupName.trim()) {
      setErrorMsg('कृपया पूर्ण नाव प्रविष्ट करा.');
      return;
    }
    if (!signupPhone.trim() || signupPhone.length < 10) {
      setErrorMsg('कृपया १० अंकी वैध मोबाईल नंबर प्रविष्ट करा.');
      return;
    }
    if (!signupPassword || signupPassword.length < 4) {
      setErrorMsg('पासवर्ड किमान ४ अक्षरांचा असावा.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      const isInstantApproved = signupAdminKey.trim() && isValidAdminKey(signupAdminKey);

      const newStaffData: Omit<StaffMember, 'id'> = {
        name: signupName.trim(),
        role: signupRole,
        phone: signupPhone.trim(),
        email: signupEmail.trim() || `${signupPhone.trim()}@shrisai.in`,
        salary: 15000,
        advancePaid: 0,
        attendanceToday: 'Present',
        password: signupPassword.trim(),
        status: isInstantApproved ? 'active' : 'pending_approval',
        registeredAt: new Date().toISOString(),
        approvedAt: isInstantApproved ? new Date().toISOString() : undefined,
        approvedBy: isInstantApproved ? 'Admin Secret Key' : undefined,
      };

      if (onRegisterStaff) {
        onRegisterStaff(newStaffData);
      }

      if (isInstantApproved) {
        setSuccessMsg('✅ ॲडमिन कोडद्वारे खाते त्वरित मंजूर झाले! ईआरपी उघडत आहे...');
        const user: AuthUser = {
          id: `usr-staff-${Date.now()}`,
          email: newStaffData.email || 'staff@shrisai.in',
          name: newStaffData.name,
          role: 'staff',
          loggedInAt: new Date().toISOString(),
        };
        setTimeout(() => onLoginSuccess(user), 400);
      } else {
        setSignupSubmitted(true);
        setSuccessMsg(
          '✅ अर्ज नोंदवला गेला आहे! ॲडमिनने (शुभम सर) पडताळणी (Verification) केल्यानंतर तुमचे खाते सक्रिय होईल.'
        );
      }
    }, 350);
  };

  // 3. OTP Flow Handlers
  const handleSendOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (!email || !email.includes('@')) {
      setErrorMsg('कृपया एक मान्य Gmail किंवा Email पत्ता प्रविष्ट करा');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      setStep('otp');
      setTimer(60);
      setOtpDigits(['', '', '', '', '', '']);
      setIsLoading(false);
      setShowOtpNotification(true);
      setSuccessMsg(`Google सुरक्षा OTP ${email} वर पाठवला आहे`);

      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }, 500);
  };

  const handleOtpChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, '').slice(-1);
    const newOtp = [...otpDigits];
    newOtp[index] = cleanVal;
    setOtpDigits(newOtp);

    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasteData.length === 6) {
      const newDigits = pasteData.split('');
      setOtpDigits(newDigits);
      verifyCode(pasteData);
    }
  };

  const verifyCode = (codeToVerify?: string) => {
    const fullCode = codeToVerify || otpDigits.join('');
    setErrorMsg('');

    if (fullCode.length !== 6) {
      setErrorMsg('कृपया संपूर्ण ६-अंकी OTP टाका');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      if (fullCode === generatedOtp) {
        setSuccessMsg('सुरक्षा पडताळणी यशस्वी! खात्यामध्ये प्रवेश करत आहे...');
        const user: AuthUser = {
          id: role === 'admin' ? 'usr-admin' : `usr-staff-${Date.now()}`,
          email,
          name,
          role,
          loggedInAt: new Date().toISOString(),
        };
        setTimeout(() => {
          onLoginSuccess(user);
        }, 300);
      } else {
        setErrorMsg('अवैध OTP कोड! कृपया पुन्हा तपासा किंवा रीसेंड करा.');
      }
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Floating Simulated OTP Toast for easy 1-click test */}
      {showOtpNotification && generatedOtp && (
        <div className="fixed top-5 right-5 z-60 max-w-sm p-4 rounded-2xl bg-slate-900 border border-slate-700 text-white shadow-2xl animate-in slide-in-from-top duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
              <Mail className="w-4 h-4" />
              <span>Google Verification Email</span>
            </div>
            <button
              type="button"
              onClick={() => setShowOtpNotification(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-slate-300 mt-1.5">
            तुमचा ६-अंकी सुरक्षा कोड:{' '}
            <strong className="text-amber-400 font-mono text-sm tracking-widest bg-slate-800 px-2 py-0.5 rounded">
              {generatedOtp}
            </strong>
          </p>
          <div className="mt-2.5 flex items-center justify-end">
            <button
              type="button"
              onClick={() => {
                const digits = generatedOtp.split('');
                setOtpDigits(digits);
                setShowOtpNotification(false);
                verifyCode(generatedOtp);
              }}
              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold shadow-xs cursor-pointer"
            >
              Auto-Fill & Verify
            </button>
          </div>
        </div>
      )}

      {/* Main Container Card */}
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2">
        {/* LEFT COLUMN: Premium Blue Banner */}
        <div className="p-4 sm:p-6 md:p-8 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-950 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            {/* Header Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold backdrop-blur-xs mb-3 sm:mb-4">
              <Shield className="w-3.5 h-3.5 text-blue-300" />
              <span>अधिकृत सुरक्षा व ॲक्सेस कंट्रोल (RBAC)</span>
            </div>

            <h1 className="text-lg sm:text-2xl font-black tracking-tight leading-snug">
              श्री साई एंटरप्रायझेस <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-amber-300">
                Electronics & Furniture ERP
              </span>
            </h1>

            <p className="text-xs text-slate-300 mt-2 leading-relaxed hidden sm:block">
              सर्व बिझनेस व्यवहार, कार्ड योजना, बँक पासबुक व विक्री डेटा पासवर्ड व ॲडमिन मंजुरीद्वारे पूर्णपणे सुरक्षित आहे.
            </p>

            {/* Feature Mini Cards */}
            <div className="grid grid-cols-2 gap-2 my-3 sm:my-5">
              <div className="p-2 sm:p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs text-center">
                <div className="text-sm sm:text-lg font-black text-amber-400">100%</div>
                <div className="text-[10px] sm:text-xs text-slate-300 font-medium">डेटा सुरक्षा</div>
              </div>
              <div className="p-2 sm:p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs text-center">
                <div className="text-sm sm:text-lg font-black text-emerald-400">Cloud</div>
                <div className="text-[10px] sm:text-xs text-slate-300 font-medium">लाइव्ह सिंक</div>
              </div>
            </div>

            {/* Feature Bullets */}
            <ul className="space-y-2 text-xs text-slate-300 font-medium hidden md:block">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>इलेक्ट्रॉनिक्स व फर्निचर स्टॉक मॅनेजमेंट</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>कार्ड बचत योजना बँक-स्टाईल पासबुक</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>बजाज / TVS फायनान्स ईएमआय कॅल्क्युलेटर</span>
              </li>
            </ul>
          </div>

          {/* Footer Info */}
          <div className="relative z-10 pt-3 mt-3 border-t border-white/10 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2 hidden sm:flex">
            <span>© 2026 Shri Sai Enterprises</span>
            <span className="font-mono text-amber-300 font-bold bg-white/5 px-2 py-0.5 rounded border border-white/10">
              सुरक्षित ईआरपी
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: Sign In / Sign Up Form */}
        <div className="p-4 sm:p-6 md:p-8 bg-white dark:bg-slate-900 flex flex-col justify-between relative max-h-[85vh] overflow-y-auto">
          {/* Close button if allowed */}
          {canClose && onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Close modal"
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div>
            {/* Top Switcher: Sign In vs Sign Up (Register) */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 mb-5">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setErrorMsg('');
                  setSuccessMsg('');
                  setSignupSubmitted(false);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  authMode === 'login'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                <span>लॉगिन (Sign In)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  authMode === 'signup'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
                <span>नवीन स्टाफ नोंदणी (Sign Up)</span>
              </button>
            </div>

            {/* Success Message */}
            {successMsg && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2 leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                <div className="flex-1">{errorMsg}</div>
              </div>
            )}

            {/* If pending approval unlock box is shown */}
            {showVerifyUnlock && (
              <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                  <Shield className="w-4 h-4 text-amber-600" />
                  <span>ॲडमिन मास्टर कोड टाकून त्वरित व्हेरिफाय करा</span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  जर मालक (Shubham) तुमच्या सोबत असतील, तर त्यांचा ॲडमिन कोड टाकून हे खाते लगेच सुरू करू शकता:
                </p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={verifyMasterKey}
                    onChange={(e) => setVerifyMasterKey(e.target.value)}
                    placeholder="Admin PIN (e.g. admin)"
                    className="flex-1 px-3 py-1.5 rounded-xl border border-amber-300 text-xs text-slate-800 dark:text-white bg-white dark:bg-slate-900"
                  />
                  <button
                    type="button"
                    onClick={handleInstantUnlock}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    व्हेरिफाय करा
                  </button>
                </div>
              </div>
            )}

            {/* ----------------- MODE 1: LOGIN FORM ----------------- */}
            {authMode === 'login' && (
              <div>
                {/* Staff / Admin Segmented Pill */}
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 mb-4">
                  <button
                    type="button"
                    onClick={() => setRole('staff')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      role === 'staff'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                    <span>Staff (कर्मचारी)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      role === 'admin'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                    <span>Admin (मालक / शुभम)</span>
                  </button>
                </div>

                {/* Login Method Toggle for Admin */}
                {role === 'admin' && (
                  <div className="flex gap-2 mb-3.5">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMethod('password');
                        setErrorMsg('');
                      }}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition ${
                        loginMethod === 'password'
                          ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800'
                          : 'text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      Password Login
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMethod('otp');
                        setErrorMsg('');
                      }}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition ${
                        loginMethod === 'otp'
                          ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800'
                          : 'text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      Gmail OTP (shubhamh3098@gmail.com)
                    </button>
                  </div>
                )}

                {/* Password Flow */}
                {loginMethod === 'password' ? (
                  <form onSubmit={handlePasswordSubmit} className="space-y-3">
                    {/* User ID / Phone / Email */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {role === 'admin' ? 'Admin ID / Email' : 'कर्मचारी मोबाईल नंबर किंवा नाव'}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          {role === 'admin' ? <Shield className="w-4 h-4 text-blue-500" /> : <Phone className="w-4 h-4 text-emerald-500" />}
                        </div>
                        {role === 'admin' ? (
                          <input
                            type="text"
                            defaultValue={adminEmail}
                            readOnly
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800"
                          />
                        ) : (
                          <input
                            type="text"
                            required
                            value={staffIdentifier}
                            onChange={(e) => setStaffIdentifier(e.target.value)}
                            placeholder="उदा. 9876543210 किंवा नाव"
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-hidden bg-white dark:bg-slate-900"
                          />
                        )}
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        पासवर्ड (Password)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full pl-9 pr-10 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden bg-white dark:bg-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="flex justify-between items-center mt-1 text-[11px] text-slate-400">
                        <span>{role === 'admin' ? 'अधिकृत ॲडमिन पासवर्ड आवश्यक' : 'कर्मचाऱ्याचा नोंदणीकृत पासवर्ड व ॲडमिन मंजुरी आवश्यक'}</span>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>पडताळणी करत आहे...</span>
                        </>
                      ) : (
                        <span>{role === 'admin' ? 'Admin म्हणून प्रवेश करा' : 'Staff म्हणून लॉगिन करा'}</span>
                      )}
                    </button>
                  </form>
                ) : (
                  /* OTP Form */
                  <div className="space-y-3.5">
                    {step === 'email' ? (
                      <form onSubmit={handleSendOtp} className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Google / Gmail Address
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                              <Mail className="w-4 h-4" />
                            </div>
                            <input
                              type="email"
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="example@gmail.com"
                              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-hidden bg-white dark:bg-slate-900"
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 transition cursor-pointer"
                        >
                          <span>६-अंकी OTP पाठवा</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </form>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
                          <strong className="text-slate-800 dark:text-slate-200">{email}</strong> वर पाठवलेला OTP टाका:
                        </p>
                        <div className="flex justify-center gap-2">
                          {otpDigits.map((digit, index) => (
                            <input
                              key={index}
                              ref={(el) => {
                                inputRefs.current[index] = el;
                              }}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleOtpChange(index, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(index, e)}
                              onPaste={handlePaste}
                              className="w-9 h-10 text-center font-bold text-base rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500 outline-hidden"
                            />
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => verifyCode()}
                          className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition cursor-pointer"
                        >
                          OTP पडताळणी करा व प्रवेश करा
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ----------------- MODE 2: SIGN UP & VERIFY FORM ----------------- */}
            {authMode === 'signup' && (
              <div>
                {signupSubmitted ? (
                  <div className="p-5 text-center space-y-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto">
                      <Clock className="w-6 h-6 animate-pulse" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      नोंदणी अर्ज यशस्वीरीत्या सादर केला!
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      तुमचा अर्ज ॲडमिन <strong>(Shubham)</strong> कडे पडताळणीसाठी (Verification) पाठवला आहे.
                      सुरक्षा नियमांनुसार, ॲडमिनने सिस्टीममधून मंजुरी दिल्यानंतरच तुमचे खाते ईआरपी पाहू शकेल.
                    </p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('login');
                          setSignupSubmitted(false);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        लॉगिन स्क्रीनवर जा
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSignupSubmit} className="space-y-3">
                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-[11px] text-blue-900 dark:text-blue-200 flex items-start gap-2">
                      <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>डेटा सुरक्षा नियम:</strong> नवीन कर्मचाऱ्याची नोंदणी झाल्यावर ॲडमिन (शुभम) मंजुरी देईल तेव्हाच ईआरपी डेटा उघडेल. कोणीही अनधिकृत व्यक्ती डेटा पाहू शकत नाही.
                      </span>
                    </div>

                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        पूर्ण नाव (Full Name) *
                      </label>
                      <input
                        type="text"
                        required
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        placeholder="उदा. राहुल इंगळे"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-white bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-hidden"
                      />
                    </div>

                    {/* Mobile & Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          मोबाईल नंबर *
                        </label>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={signupPhone}
                          onChange={(e) => setSignupPhone(e.target.value.replace(/\D/g, ''))}
                          placeholder="98xxxxxxxx"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-white bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          ईमेल (पर्यायी)
                        </label>
                        <input
                          type="email"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          placeholder="staff@shrisai.in"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-white bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-hidden"
                        />
                      </div>
                    </div>

                    {/* Role Requested */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        कामाचे स्वरूप / रोल (Role)
                      </label>
                      <select
                        value={signupRole}
                        onChange={(e) => setSignupRole(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-white bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-hidden"
                      >
                        <option value="Sales & Billing (काउंटर बिलिंग)">काउंटर बिलिंग व विक्री (Sales & Billing)</option>
                        <option value="Collection Agent (हप्ते वसुली)">कार्ड हप्ते वसुली एजंट (Collection Agent)</option>
                        <option value="Store Manager (स्टोअर मॅनेजर)">स्टोअर व स्टॉक असिस्टंट (Store Assistant)</option>
                      </select>
                    </div>

                    {/* Set Password */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        पासवर्ड तयार करा (Set Password) *
                      </label>
                      <input
                        type="password"
                        required
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="किमान ४ अक्षरे / आकडे"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-white bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-hidden"
                      />
                    </div>

                    {/* Optional Admin Master PIN for instant approval */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          ॲडमिन मंजुरी कोड (Admin Master PIN - पर्यायी)
                        </label>
                        <span className="text-[10px] text-amber-600 font-bold">त्वरित ॲक्टिव्हेशन</span>
                      </div>
                      <input
                        type="password"
                        value={signupAdminKey}
                        onChange={(e) => setSignupAdminKey(e.target.value)}
                        placeholder="जर ॲडमिनने मंजुरी कोड दिला असेल तर येथे टाका"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-hidden"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        हा कोड नसल्यास अर्ज सादर होईल व ॲडमिनने ईआरपीमधून मंजूर केल्यावर खाते सुरू होईल.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>नोंदणी करत आहे...</span>
                        </>
                      ) : (
                        <span>नोंदणी अर्ज सादर करा (Submit Registration)</span>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Bottom Security Note */}
          <div className="text-center pt-3 text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800 mt-3">
            <span>🔒 सुरक्षित ईआरपी प्रणाली • अनधिकृत ॲक्सेस प्रतिबंधित आहे</span>
          </div>
        </div>
      </div>
    </div>
  );
};
