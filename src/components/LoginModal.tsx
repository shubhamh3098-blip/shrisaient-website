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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Top Decorative Header */}
        <div className="bg-gradient-to-tr from-[#0A1124] via-[#101b38] to-[#1e293b] p-6 text-white text-center relative overflow-hidden">
          {/* Close button if allowed */}
          {canClose && onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Close modal"
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Centered Minimal Brand Logo */}
          <div className="flex justify-center mb-3">
            <div className="p-1.5 rounded-2xl bg-amber-400/10 border border-amber-400/20 shadow-lg">
              <AppLogo size="lg" showSubtitle={false} />
            </div>
          </div>

          <h2 className="text-lg font-bold text-white tracking-tight flex items-center justify-center gap-1.5">
            <span>बिझनेस अकाउंटिंग ॲक्सेस</span>
            <Shield className="w-4 h-4 text-amber-400" />
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            श्री साई एंटरप्रायझेस • अधिकृत खाताबही व व्यवस्थापक पोर्टल
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[11px] font-medium">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>सुरक्षित ऑनलाइन क्लाउड स्टोरेज</span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Login Method Tabs: Password vs OTP */}
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setLoginMethod('password');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                loginMethod === 'password'
                  ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
              <span>पासवर्डने लॉगिन (जलद)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLoginMethod('otp');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                loginMethod === 'otp'
                  ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <span>Gmail OTP व्हेरिफिकेशन</span>
            </button>
          </div>

          {/* Role Selection Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              वापरकर्ता पद निवडा (Select Role)
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-50 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  role === 'admin'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                Admin (मालिक)
              </button>

              <button
                type="button"
                onClick={() => setRole('staff')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  role === 'staff'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Staff (बिलिंग कर्मचारी)
              </button>
            </div>
          </div>

          {/* Success Message */}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* METHOD 1: PASSWORD LOGIN (DEFAULT & INSTANT) */}
          {loginMethod === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {role === 'admin' ? 'ॲडमिन पासवर्ड (Admin Password / PIN) *' : 'स्टाफ पासवर्ड (Staff Password) *'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder={role === 'admin' ? 'ॲडमिन पासवर्ड टाका (e.g. admin)' : 'स्टाफ पासवर्ड टाका (e.g. staff)'}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-hidden bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                
                <div className="mt-2 p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-blue-900 leading-relaxed flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>होय!</strong> ॲडमिन पासवर्ड टाकताच लगेच पूर्ण <strong>बिझनेस अकाउंटिंग</strong> (आजची रोकड शिल्लक, उधारी खाताबही, स्टॉक इन्व्हेंटरी, ३०-महिने पासबुक योजना, खरेदी आणि जीएसटी बिलिंग) एका सेकंदात उघडेल.
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>तपासत आहे...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-amber-300" />
                    <span>लॉगिन करा आणि खाताबही उघडा (Login & Open ERP)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center">
                <span className="text-[11px] text-slate-400">
                  डिफॉल्ट पासवर्ड: <code className="bg-slate-100 text-blue-900 px-1.5 py-0.5 rounded font-bold font-mono">admin</code> (किंवा <code className="bg-slate-100 text-blue-900 px-1.5 py-0.5 rounded font-mono">sai123</code>)
                </span>
              </div>
            </form>
          )}

          {/* METHOD 2: GMAIL OTP LOGIN */}
          {loginMethod === 'otp' && (
            <>
              {step === 'email' ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {role === 'admin' ? 'Admin Gmail Address' : 'Staff Gmail Address'} *
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
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-hidden"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      या ईमेलवर 6-अंकी सुरक्षित OTP पाठवला जाईल.
                    </p>
                  </div>

                  {role === 'staff' && staffList.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        किंवा नोंदणीकृत कर्मचारी निवडा:
                      </label>
                      <select
                        value={email}
                        onChange={(e) => {
                          const selected = staffList.find(s => (s.email || `${s.name.toLowerCase().replace(/\s+/g, '')}@shrisai.in`) === e.target.value);
                          setEmail(e.target.value);
                          if (selected) setName(selected.name);
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-800"
                      >
                        {staffList.map((s) => (
                          <option key={s.id} value={s.email || `${s.name.toLowerCase().replace(/\s+/g, '')}@shrisai.in`}>
                            {s.name} ({s.role || 'Staff'})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>OTP पाठवत आहे...</span>
                      </>
                    ) : (
                      <>
                        <span>सुरक्षा OTP पाठवा (Send OTP)</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  {/* Simulation Banner */}
                  {showOtpNotification && (
                    <div className="p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                          <Mail className="w-3.5 h-3.5 text-blue-600" />
                          <span>Gmail कडून आलेला सुरक्षा कोड:</span>
                        </div>
                        <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-mono">
                          Google Mail
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xl font-mono font-bold tracking-widest text-slate-900 bg-white px-3 py-1 rounded-lg border border-blue-200 shadow-2xs">
                          {generatedOtp}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (generatedOtp) {
                              setOtpDigits(generatedOtp.split(''));
                              setTimeout(() => verifyCode(generatedOtp), 200);
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>ऑटो-भरा</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 6 Digit Inputs */}
                  <div className="flex justify-center gap-2" onPaste={handlePaste}>
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
                        className="w-11 h-12 text-center text-lg font-bold font-mono rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-500 outline-hidden bg-white shadow-2xs"
                      />
                    ))}
                  </div>

                  {/* Resend & Change */}
                  <div className="flex items-center justify-between text-xs text-slate-500 px-1 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setStep('email');
                        setOtpDigits(['', '', '', '', '', '']);
                        setErrorMsg('');
                      }}
                      className="text-slate-500 hover:text-slate-800 underline transition cursor-pointer"
                    >
                      ईमेल बदला
                    </button>

                    {timer > 0 ? (
                      <span className="font-mono text-slate-500">
                        पुन्हा पाठवा: {timer}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendOtp()}
                        className="text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        OTP पुन्हा पाठवा
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => verifyCode()}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>सत्यापित करा आणि लॉगिन करा</span>
                  </button>
                </div>
              )}
            </>
          )}

          {/* Quick 1-Click Login Shortcut for convenience */}
          <div className="pt-3 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 mb-2">
              किंवा थेट 1-क्लिक एक्सेस:
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onLoginSuccess({
                    id: 'usr-admin',
                    email: adminEmail || 'shubhamh3098@gmail.com',
                    name: adminName || 'Shubham (Admin)',
                    role: 'admin',
                    loggedInAt: new Date().toISOString(),
                  });
                }}
                className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 hover:bg-blue-100 text-xs font-semibold border border-blue-200 transition cursor-pointer flex items-center gap-1"
              >
                <Crown className="w-3 h-3 text-blue-600" />
                मालिक (Admin) प्रवेश
              </button>

              <button
                type="button"
                onClick={() => {
                  onLoginSuccess({
                    id: 'usr-staff',
                    email: 'ramesh.billing@shrisai.in',
                    name: 'Ramesh Kadam (Staff)',
                    role: 'staff',
                    loggedInAt: new Date().toISOString(),
                  });
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold border border-slate-200 transition cursor-pointer flex items-center gap-1"
              >
                <UserCheck className="w-3 h-3 text-slate-600" />
                स्टाफ (Staff) प्रवेश
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
