import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  X,
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Mail,
} from 'lucide-react';
import { EmailOtpSession, verifyEmailOtp } from '../../services/emailOtpService';

interface EmailOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: EmailOtpSession | null;
  onVerified: () => void;
  onResend: () => Promise<void>;
  isResending?: boolean;
}

export const EmailOtpModal: React.FC<EmailOtpModalProps> = ({
  isOpen,
  onClose,
  session,
  onVerified,
  onResend,
  isResending = false,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset digits and timer when modal opens or session changes
  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', '']);
      setErrorMsg(null);
      setSuccessMsg(null);
      setCountdown(60);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }
  }, [isOpen, session]);

  // Countdown timer for resend
  useEffect(() => {
    if (!isOpen || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, countdown]);

  if (!isOpen || !session) return null;

  const handleDigitChange = (index: number, value: string) => {
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal) {
      const newDigits = [...digits];
      newDigits[index] = '';
      setDigits(newDigits);
      return;
    }

    // Handle paste of multiple digits
    if (cleanVal.length > 1) {
      const chars = cleanVal.slice(0, 6).split('');
      const newDigits = [...digits];
      chars.forEach((c, i) => {
        if (index + i < 6) {
          newDigits[index + i] = c;
        }
      });
      setDigits(newDigits);
      const nextIdx = Math.min(index + chars.length, 5);
      inputRefs.current[nextIdx]?.focus();
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = cleanVal;
    setDigits(newDigits);
    setErrorMsg(null);

    // Auto-advance
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const fullOtp = digits.join('');

  const handleVerify = async () => {
    if (fullOtp.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);

    try {
      const result = await verifyEmailOtp(fullOtp, session);
      if (result.verified) {
        setSuccessMsg('Email verified successfully! Confirming your order...');
        setTimeout(() => {
          onVerified();
        }, 500);
      } else {
        setErrorMsg(result.message || 'Incorrect verification code. Please check your email inbox.');
      }
    } catch {
      setErrorMsg('Verification could not be processed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendClick = async () => {
    if (countdown > 0 || isResending) return;
    setErrorMsg(null);
    setDigits(['', '', '', '', '', '']);
    await onResend();
    setCountdown(60);
    inputRefs.current[0]?.focus();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md rounded-3xl bg-[#0F1115] border border-[#2B2F38] p-6 sm:p-8 shadow-2xl shadow-black/90 text-[#F5F5F7] overflow-hidden"
        >
          {/* Subtle Luxury Aura */}
          <div className="absolute top-0 right-0 w-44 h-44 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute bottom-0 left-0 w-44 h-44 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none -z-10" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-[#8E929E] hover:text-white hover:bg-[#1A1D24] transition-colors cursor-pointer"
            aria-label="Close verification modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Clean & Elegant Header: Enter Code */}
          <div className="text-center mb-6 pt-2">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shadow-lg shadow-[#D4AF37]/10">
              <Mail className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold font-serif-luxury text-white tracking-wide">
              Enter Code
            </h2>
            <p className="text-xs text-[#8E929E] mt-1.5 leading-relaxed">
              Enter the 6-digit verification code sent to{' '}
              <span className="font-semibold text-[#D4AF37] font-mono">{session.maskedEmail}</span>
            </p>
          </div>

          {/* 6 Digit Inputs */}
          <div className="flex justify-center items-center gap-2 sm:gap-3 mb-6">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={isVerifying || !!successMsg}
                className={`w-12 h-14 sm:w-13 sm:h-15 text-center text-xl sm:text-2xl font-mono font-bold rounded-xl bg-[#090A0D] border transition-all outline-none ${
                  digit
                    ? 'border-[#D4AF37] text-[#D4AF37] shadow-sm shadow-[#D4AF37]/20'
                    : 'border-[#2B2F38] text-white focus:border-[#D4AF37]'
                }`}
                aria-label={`Digit ${index + 1}`}
              />
            ))}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2 mb-4"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {/* Success Message */}
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-emerald-950/40 border border-[#D4AF37]/40 text-[#D4AF37] text-xs flex items-center gap-2 mb-4"
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#D4AF37]" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {/* Primary Action Button: Confirm Order */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleVerify}
              disabled={isVerifying || fullOtp.length !== 6 || !!successMsg}
              className={`w-full py-4 rounded-xl text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                fullOtp.length === 6 && !isVerifying && !successMsg
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#E5C378] hover:to-[#D4AF37] text-[#0B0C0E] shadow-lg shadow-[#D4AF37]/25'
                  : 'bg-[#1C1F26] text-[#6E7382] cursor-not-allowed'
              }`}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Confirming Order...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirm Order</span>
                </>
              )}
            </button>
          </div>

          {/* Resend & Timer */}
          <div className="mt-5 text-center text-xs text-[#8E929E]">
            {countdown > 0 ? (
              <span>
                Didn&apos;t receive code?{' '}
                <span className="font-mono text-[#D4AF37]">Resend in {countdown}s</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResendClick}
                disabled={isResending}
                className="text-[#D4AF37] hover:underline font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                <span>Resend Code</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
