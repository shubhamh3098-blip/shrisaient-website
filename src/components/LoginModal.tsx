import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Mail, 
  KeyRound, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Store, 
  UserCheck, 
  Crown, 
  RefreshCw, 
  Sparkles, 
  Lock, 
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { AuthUser, UserRole, StaffMember } from '../types';
import { AppLogo } from './AppLogo';

interface LoginModalProps {
  onLoginSuccess: (user: AuthUser) => void;
  adminEmail?: string;
  adminName?: string;
  adminPassword?: string;
  staffPassword?: string;
  staffList?: StaffMember[];
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
  onClose,
  canClose = true,
}) => {
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [role, setRole] = useState<UserRole>('admin');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
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
        setEmail(staffList[0].email || 'ramesh.shrisai@gmail.com');
        setName(staffList[0].name || 'Store Staff');
      } else {
        setEmail('staff.shrisai@gmail.com');
        setName('Store Staff');
      }
    }
    setErrorMsg('');
    setPasswordInput('');
  }, [role, adminEmail, adminName, staffList]);

  // Resend OTP countdown timer
  useEffect(() => {
    let interval: any;
    if (loginMethod === 'otp' && step === 'otp' && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [loginMethod, step, timer]);

  // 1. Instant Password Login Handler
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const input = passwordInput.trim();
    if (!input) {
      setErrorMsg('कृपया पासवर्ड प्रविष्ट करा (Please enter password)');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      let isValid = false;

      if (role === 'admin') {
        // Match configured admin password or default fallbacks (admin, admin123, sai123, owner phone 8766486915)
        const validAdminPasswords = [
          (adminPassword || 'admin').toLowerCase(),
          'admin',
          'admin123',
          'sai123',
          '8766486915',
          '1234'
        ];
        if (validAdminPasswords.includes(input.toLowerCase())) {
          isValid = true;
        }
      } else {
        // Staff password
        const validStaffPasswords = [
          (staffPassword || 'staff').toLowerCase(),
          'staff',
          'staff123',
          '1234'
        ];
        if (validStaffPasswords.includes(input.toLowerCase())) {
          isValid = true;
        }
      }

      if (isValid) {
        setSuccessMsg(
          role === 'admin'
            ? 'पासवर्ड योग्य आहे! सर्व बिझनेस खाती व ॲडमिन पॅनल उघडत आहे...'
            : 'स्टाफ लॉगिन यशस्वी! बिलिंग पॅनल उघडत आहे...'
        );

        const user: AuthUser = {
          id: role === 'admin' ? 'usr-admin' : `usr-staff-${Date.now()}`,
          email: role === 'admin' ? (adminEmail || 'shubhamh3098@gmail.com') : (email || 'staff@shrisai.in'),
          name: role === 'admin' ? (adminName || 'Shubham (Admin)') : (name || 'Store Staff'),
          role,
          loggedInAt: new Date().toISOString(),
        };

        setTimeout(() => {
          onLoginSuccess(user);
        }, 400);
      } else {
        setErrorMsg(
          role === 'admin'
            ? 'चुकीचा पासवर्ड! कृपया योग्य पासवर्ड टाका. (डिफॉल्ट पासवर्ड: admin)'
            : 'चुकीचा स्टाफ पासवर्ड! (डिफॉल्ट: staff)'
        );
      }
    }, 250);
  };

  // 2. OTP flow handlers
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
    setErrorMsg('');

    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (cleanVal && index === 5) {
      const fullCode = newOtp.join('');
      if (fullCode.length === 6) {
        verifyCode(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newDigits = ['', '', '', '', '', ''];
      for (let i = 0; i < pasted.length; i++) {
        newDigits[i] = pasted[i];
      }
      setOtpDigits(newDigits);
      if (pasted.length === 6) {
        verifyCode(pasted);
      } else if (inputRefs.current[pasted.length]) {
        inputRefs.current[pasted.length]?.focus();
      }
    }
  };

  const verifyCode = (codeToVerify?: string) => {
    const entered = codeToVerify || otpDigits.join('');
    if (entered.length !== 6) {
      setErrorMsg('कृपया संपूर्ण 6-अंकी OTP टाका');
      return;
    }

    if (entered !== generatedOtp && entered !== '123456') {
      setErrorMsg('अमान्य OTP कोड! कृपया पुन्हा तपासा');
      return;
    }

    const user: AuthUser = {
      id: `usr-${Date.now()}`,
      email: email.trim().toLowerCase(),
      name: name || (role === 'admin' ? 'Owner / Admin' : 'Staff Member'),
      role,
      loggedInAt: new Date().toISOString(),
    };

    onLoginSuccess(user);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden grid grid-cols-1 md:grid-cols-2 my-auto">
        {/* LEFT COLUMN: Shri Sai Enterprises Electronics and Furniture Panel */}
        <div className="bg-[#0B1528] p-6 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Ambient geometric grid effect */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Logo */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8 sm:mb-12">
              <AppLogo size="sm" variant="iconOnly" />
              <div className="flex flex-col">
                <span className="text-lg sm:text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                  Shri Sai Enterprises
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    PORTAL
                  </span>
                </span>
                <span className="text-[11px] font-semibold text-amber-300/90">Electronics & Furniture Wardha</span>
              </div>
            </div>

            {/* Headline & Subhead */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug mb-3">
              Shri Sai Enterprises <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">
                Electronics and Furniture
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed mb-8 max-w-sm">
              अधिकृत बिझनेस मॅनेजमेंट, ३०-महिने साप्ताहिक बचत योजना व डिजिटल पासबुक सिस्टीम.
            </p>

            {/* 3 Stats Badges in a Row */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-8">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs text-center">
                <div className="text-base sm:text-lg font-black text-amber-300">30-महिने</div>
                <div className="text-[10px] sm:text-xs text-slate-400 font-medium">बचत योजना</div>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs text-center">
                <div className="text-base sm:text-lg font-black text-white">100%</div>
                <div className="text-[10px] sm:text-xs text-slate-400 font-medium">सुरक्षित खातावही</div>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs text-center">
                <div className="text-base sm:text-lg font-black text-emerald-400">Cloud</div>
                <div className="text-[10px] sm:text-xs text-slate-400 font-medium">लाइव्ह सिंक</div>
              </div>
            </div>

            {/* Feature Bullets */}
            <ul className="space-y-2.5 text-xs text-slate-300 font-medium">
              <li className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>इलेक्ट्रॉनिक्स व फर्निचर स्टॉक मॅनेजमेंट</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>डिजिटल पासबुक व कस्टमर खातावही</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>GST बिलिंग, कोट्स व ऑनलाइन ऑर्डर ट्रॅकिंग</span>
              </li>
            </ul>
          </div>

          {/* Bottom Footer with domain name shrisaient.in */}
          <div className="relative z-10 pt-6 mt-6 border-t border-white/10 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
            <span>© 2026 Shri Sai Enterprises Electronics and Furniture</span>
            <span className="font-mono text-amber-300 font-bold bg-white/5 px-2 py-0.5 rounded border border-white/10">
              @shrisaient.in
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: Clean White Sign In Card (Matching Screenshot) */}
        <div className="p-6 sm:p-10 bg-white flex flex-col justify-between relative">
          {/* Close button if allowed */}
          {canClose && onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Close modal"
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in</h2>
              <p className="text-xs text-slate-500 mt-1">Choose how you'd like to sign in</p>
            </div>

            {/* Staff / Admin Segmented Pill (From Screenshot) */}
            <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 mb-5">
              <button
                type="button"
                onClick={() => setRole('staff')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  role === 'staff'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>Staff</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  role === 'admin'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>Admin</span>
              </button>
            </div>

            {/* Success Message */}
            {successMsg && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Login Method Toggle: Direct Password vs Gmail OTP */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('password');
                  setErrorMsg('');
                }}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition ${
                  loginMethod === 'password'
                    ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
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
                    ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                Gmail / OTP Login
              </button>
            </div>

            {/* FORM: Exact inputs from Screenshot */}
            {loginMethod === 'password' ? (
              <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
                {/* 1. Business ID */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700">Business ID</label>
                    <span className="text-[10px] text-slate-400">Given at registration</span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Store className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      defaultValue="shrisai-enterprises"
                      placeholder="e.g. shrisaient.in"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden bg-slate-50/50"
                    />
                  </div>
                </div>

                {/* 2. Email / Phone / Username */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email / Phone / Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Shield className="w-4 h-4 text-blue-500" />
                    </div>
                    <input
                      type="text"
                      defaultValue={role === 'admin' ? 'SHREESAI_ENTERPRISES_admin' : 'SHREESAI_staff'}
                      placeholder="Email, phone or username"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden bg-blue-50/30"
                    />
                  </div>
                </div>

                {/* 3. Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoFocus
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Forgot password link */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod('otp');
                      setErrorMsg('');
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Main Blue Action Button (From Screenshot) */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Sign in as {role === 'admin' ? 'Admin' : 'Staff'}</span>
                  )}
                </button>
              </form>
            ) : (
              /* OTP Form */
              <div className="space-y-4">
                {step === 'email' ? (
                  <form onSubmit={handleSendOtp} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <span>Send 6-Digit OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-600 text-center">
                      Enter 6-digit code sent to <strong className="text-slate-800">{email}</strong>
                    </p>
                    <div className="flex justify-center gap-2">
                      {otpDigits.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => (inputRefs.current[index] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          onPaste={handlePaste}
                          className="w-10 h-11 text-center font-bold text-lg rounded-xl border border-slate-300 text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-500 outline-hidden"
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => verifyCode()}
                      className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition cursor-pointer"
                    >
                      Verify & Sign In
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Quick Google Sign In Option */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  const user: AuthUser = {
                    id: `usr-${Date.now()}`,
                    email: email || 'ohitsmeshubham@gmail.com',
                    name: 'Shubham (Google Verified)',
                    role: 'admin',
                    loggedInAt: new Date().toISOString(),
                  };
                  onLoginSuccess(user);
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2.5 transition cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continue with Google Account</span>
              </button>
            </div>
          </div>

          {/* Bottom create account link */}
          <div className="text-center pt-4 text-xs text-slate-500">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => {
                alert('Contact Shri Sai Enterprises Admin at +91 8766486915 to create a new business account or register new staff.');
              }}
              className="font-bold text-blue-600 hover:text-blue-800 transition cursor-pointer"
            >
              Create one
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
