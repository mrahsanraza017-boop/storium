import React, { useState, useEffect } from 'react';
import {
  LogIn,
  UserPlus,
  ShieldCheck,
  Phone,
  Mail,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Check,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { normalizePhoneNumber } from '../../services/customerAuthService';

type AuthMode = 'sign-in' | 'sign-up' | 'verify-phone' | 'forgot-password';

export const CustomerAuthPanel: React.FC = () => {
  const {
    loginUser,
    sendPhoneVerificationCode,
    verifyPhoneCode,
    requestPasswordReset,
    confirmPasswordReset,
    isPhoneVerified,
    addToast,
  } = useStore();

  const [mode, setMode] = useState<AuthMode>('sign-in');
  
  // Sign-in / Sign-up form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Verification states
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingPhone, setPendingPhone] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  
  // Forgot password states
  const [forgotStep, setForgotStep] = useState<'request' | 'verify'>('request');
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [infoNotice, setInfoNotice] = useState('');

  // Countdown timer effect for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSignInOrUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setInfoNotice('');
    setIsSubmitting(true);

    const isSignUp = mode === 'sign-up';
    const normalizedPhone = normalizePhoneNumber(phone);

    // Validate phone for sign up if provided
    if (isSignUp && phone && normalizedPhone.length < 10) {
      setError('Please provide a valid Pakistani contact mobile number (e.g. 0300 1234567).');
      setIsSubmitting(false);
      return;
    }

    const result = await loginUser(
      email,
      fullName,
      password,
      isSignUp,
      normalizedPhone
    );

    if (!result.success) {
      setError(result.message || 'Unable to authenticate.');
      setIsSubmitting(false);
      return;
    }

    if (result.needsEmailConfirmation) {
      addToast('info', 'Verification Required', 'Please confirm your email before signing in.');
      setInfoNotice('A confirmation email has been dispatched. Please check your inbox.');
      setIsSubmitting(false);
      return;
    }

    // Check if phone needs verification on signup
    if (isSignUp && normalizedPhone) {
      const alreadyVerified = isPhoneVerified(normalizedPhone);
      if (!alreadyVerified) {
        setPendingPhone(normalizedPhone);
        setMode('verify-phone');
        setResendTimer(60);
        await sendPhoneVerificationCode(normalizedPhone);
        setIsSubmitting(false);
        return;
      }
    }

    setIsSubmitting(false);
  };

  const handleVerifyPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.trim().length < 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    const result = await verifyPhoneCode(pendingPhone, verificationCode);
    if (!result.success) {
      setError(result.message || 'Incorrect verification code. Please check and re-try.');
    } else {
      // Completed phone verification successfully!
      setMode('sign-in');
    }
    setIsSubmitting(false);
  };

  const handleResendPhoneOTP = async () => {
    if (resendTimer > 0 || !pendingPhone) return;
    setError('');
    const res = await sendPhoneVerificationCode(pendingPhone);
    if (res.success) {
      setResendTimer(60);
    } else {
      setError(res.message);
    }
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) {
      setError('Please enter your registered email address or phone number.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    const res = await requestPasswordReset(forgotIdentifier);
    if (res.success) {
      setForgotStep('verify');
      setResendTimer(60);
    } else {
      setError(res.message || 'Could not find an account with the provided details.');
    }
    setIsSubmitting(false);
  };

  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode || resetCode.trim().length < 6) {
      setError('Please enter the 6-digit authorization reset code.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify your new password.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    const res = await confirmPasswordReset(forgotIdentifier, resetCode, newPassword);
    if (res.success) {
      setMode('sign-in');
      setForgotStep('request');
      setForgotIdentifier('');
      setResetCode('');
      setNewPassword('');
      setConfirmPassword('');
      setEmail(forgotIdentifier.includes('@') ? forgotIdentifier : '');
      setPassword('');
      setInfoNotice('Password updated successfully. Please log in with your new credentials.');
    } else {
      setError(res.message || 'Password reset failed. Check your security code.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-[#262930]/80 bg-[#121316]/90 backdrop-blur-xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Subtle Luxury Accent Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        {/* ─────────────────────────────────────────────────────────────────
            1 & 2: SIGN-IN & SIGN-UP MODES
           ───────────────────────────────────────────────────────────────── */}
        {(mode === 'sign-in' || mode === 'sign-up') && (
          <form onSubmit={handleSignInOrUp} className="relative z-10">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D4AF37]/50 bg-[#0B0C0E] p-1 shadow-[0_0_25px_rgba(212,175,55,0.2)]">
                <img src="/emblem.png" alt="STORIUM Emblem" className="h-full w-full object-cover rounded-xl" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] font-semibold">
                STORIUM Client Portal
              </span>
              <h1 className="mt-2 font-serif-luxury text-2xl sm:text-3xl font-bold text-[#F5F5F7]">
                {mode === 'sign-in' ? 'Welcome Back' : 'Create Your Account'}
              </h1>
              <p className="mt-2 text-xs text-[#8E929E] leading-relaxed">
                {mode === 'sign-in'
                  ? 'Access your private showroom history and bespoke orders.'
                  : 'Register for exclusive horological drops and white-glove Pakistan delivery.'}
              </p>
            </div>

            <div className="space-y-4">
              {mode === 'sign-up' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#8E929E] mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Full Name</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Tariq Mansoor"
                    className="w-full rounded-xl border border-[#262930] bg-[#0B0C0E] px-4 py-3 text-xs sm:text-sm text-[#F5F5F7] placeholder-[#626673] focus:outline-none focus:border-[#D4AF37] transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#8E929E] mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patron@storium.pk"
                  className="w-full rounded-xl border border-[#262930] bg-[#0B0C0E] px-4 py-3 text-xs sm:text-sm text-[#F5F5F7] placeholder-[#626673] focus:outline-none focus:border-[#D4AF37] transition-colors"
                />
              </div>

              {mode === 'sign-up' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#8E929E] mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Mobile Number (Pakistan)</span>
                    </span>
                    <span className="text-[10px] text-[#D4AF37] font-mono">OTP Verification</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0300 1234567 or +92 300 1234567"
                      className="w-full rounded-xl border border-[#262930] bg-[#0B0C0E] px-4 py-3 text-xs sm:text-sm text-[#F5F5F7] placeholder-[#626673] focus:outline-none focus:border-[#D4AF37] transition-colors"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-[#626673]">
                    Used for order dispatch tracking and mobile security authentication.
                  </p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#8E929E] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Password</span>
                  </label>
                  {mode === 'sign-in' && (
                    <button
                      type="button"
                      onClick={() => {
                        setError('');
                        setInfoNotice('');
                        setForgotIdentifier(email);
                        setMode('forgot-password');
                        setForgotStep('request');
                      }}
                      className="text-xs text-[#D4AF37] hover:underline font-medium"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  className="w-full rounded-xl border border-[#262930] bg-[#0B0C0E] px-4 py-3 text-xs sm:text-sm text-[#F5F5F7] placeholder-[#626673] focus:outline-none focus:border-[#D4AF37] transition-colors"
                />
              </div>
            </div>

            {error && (
              <div role="alert" className="mt-4 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3.5 text-xs text-rose-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {infoNotice && (
              <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3.5 text-xs text-emerald-300 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>{infoNotice}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-[#0B0C0E] disabled:opacity-60 transition-all shadow-lg shadow-[#D4AF37]/20 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Credentials...</span>
                </>
              ) : mode === 'sign-in' ? (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Create Account</span>
                </>
              )}
            </button>

            <div className="mt-6 pt-6 border-t border-[#262930] text-center">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setInfoNotice('');
                  setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in');
                }}
                className="text-xs text-[#D4AF37] hover:underline font-medium cursor-pointer"
              >
                {mode === 'sign-in'
                  ? 'New to STORIUM? Create a client account'
                  : 'Already registered? Sign In to your profile'}
              </button>
            </div>
          </form>
        )}

        {/* ─────────────────────────────────────────────────────────────────
            3: MOBILE OTP VERIFICATION SCREEN
           ───────────────────────────────────────────────────────────────── */}
        {mode === 'verify-phone' && (
          <form onSubmit={handleVerifyPhone} className="relative z-10 space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37] shadow-lg">
                <Phone className="h-7 w-7" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] font-semibold">
                Security Authorization
              </span>
              <h2 className="mt-2 font-serif-luxury text-2xl font-bold text-[#F5F5F7]">
                Verify Mobile Number
              </h2>
              <p className="mt-2 text-xs text-[#8E929E] leading-relaxed">
                Enter the 6-digit security code dispatched to <strong className="text-[#F5F5F7] font-mono">{pendingPhone}</strong>.
              </p>
              <div className="mt-3 inline-block px-3 py-1 rounded-full bg-[#181A1F] border border-[#262930] text-[11px] text-[#D4AF37]">
                Once verified, your number remains permanently registered.
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8E929E] mb-2 text-center">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                placeholder="&bull; &bull; &bull; &bull; &bull; &bull;"
                className="w-full text-center tracking-[0.6em] font-mono text-xl py-3 px-4 rounded-xl border border-[#262930] bg-[#0B0C0E] text-[#F5F5F7] focus:outline-none focus:border-[#D4AF37] transition-colors"
              />
            </div>

            {error && (
              <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-3.5 text-xs text-rose-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || verificationCode.length < 6}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-[#0B0C0E] disabled:opacity-60 transition-all shadow-lg shadow-[#D4AF37]/20 cursor-pointer"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Verify &amp; Authorize Mobile</span>
            </button>

            <div className="flex items-center justify-between text-xs text-[#8E929E] pt-2">
              <button
                type="button"
                onClick={handleResendPhoneOTP}
                disabled={resendTimer > 0}
                className="text-[#D4AF37] hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
              >
                {resendTimer > 0 ? `Resend Code (${resendTimer}s)` : 'Resend Code'}
              </button>
              <button
                type="button"
                onClick={() => setMode('sign-in')}
                className="hover:text-[#F5F5F7] cursor-pointer"
              >
                Skip for now
              </button>
            </div>
          </form>
        )}

        {/* ─────────────────────────────────────────────────────────────────
            4: FORGOT PASSWORD FLOW
           ───────────────────────────────────────────────────────────────── */}
        {mode === 'forgot-password' && (
          <div className="relative z-10">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37] shadow-lg">
                <KeyRound className="h-7 w-7" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] font-semibold">
                Client Account Recovery
              </span>
              <h2 className="mt-2 font-serif-luxury text-2xl font-bold text-[#F5F5F7]">
                {forgotStep === 'request' ? 'Reset Your Password' : 'Set New Password'}
              </h2>
              <p className="mt-2 text-xs text-[#8E929E] leading-relaxed">
                {forgotStep === 'request'
                  ? 'Enter your registered email address or mobile number to receive a secure authorization code.'
                  : `Enter the 6-digit code dispatched to ${forgotIdentifier} and choose your new password.`}
              </p>
            </div>

            {forgotStep === 'request' ? (
              <form onSubmit={handleForgotRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#8E929E] mb-1.5">
                    Registered Email or Phone Number
                  </label>
                  <input
                    type="text"
                    required
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    placeholder="patron@storium.pk or 0300 1234567"
                    className="w-full rounded-xl border border-[#262930] bg-[#0B0C0E] px-4 py-3 text-xs sm:text-sm text-[#F5F5F7] placeholder-[#626673] focus:outline-none focus:border-[#D4AF37] transition-colors"
                  />
                </div>

                {error && (
                  <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-3.5 text-xs text-rose-300 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !forgotIdentifier.trim()}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-[#0B0C0E] disabled:opacity-60 transition-all shadow-lg shadow-[#D4AF37]/20 cursor-pointer"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Send Authorization Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleForgotReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#8E929E] mb-1.5">
                    6-Digit Security Reset Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit code"
                    className="w-full text-center tracking-widest font-mono rounded-xl border border-[#262930] bg-[#0B0C0E] px-4 py-3 text-sm text-[#F5F5F7] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#8E929E] mb-1.5">
                    New Password (Min 8 Characters)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New secure password"
                    className="w-full rounded-xl border border-[#262930] bg-[#0B0C0E] px-4 py-3 text-sm text-[#F5F5F7] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#8E929E] mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full rounded-xl border border-[#262930] bg-[#0B0C0E] px-4 py-3 text-sm text-[#F5F5F7] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                {error && (
                  <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-3.5 text-xs text-rose-300 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-[#0B0C0E] disabled:opacity-60 transition-all shadow-lg shadow-[#D4AF37]/20 cursor-pointer"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirm &amp; Reset Password</span>
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-[#262930] flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setMode('sign-in');
                  setForgotStep('request');
                }}
                className="text-[#8E929E] hover:text-[#F5F5F7] flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Sign In</span>
              </button>

              {forgotStep === 'verify' && (
                <button
                  type="button"
                  onClick={() => setForgotStep('request')}
                  className="text-[#D4AF37] hover:underline cursor-pointer"
                >
                  Change identifier
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};