import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  X,
  Loader2,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { OtpSession, verifyWhatsAppOtp } from '../../services/otpService';

interface WhatsAppOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: OtpSession | null;
  onVerified: () => void;
  onResend: () => Promise<void>;
  isResending?: boolean;
}

export const WhatsAppOtpModal: React.FC<WhatsAppOtpModalProps> = ({
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
      // Auto-focus first input
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
    // Only accept numeric characters
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal) {
      const newDigits = [...digits];
      newDigits[index] = '';
      setDigits(newDigits);
      return;
    }

    // Handle paste or multiple digits
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

    // Auto-advance to next input
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
      const result = await verifyWhatsAppOtp(fullOtp, session);
      if (result.verified) {
        setSuccessMsg('Phone verified successfully! Confirming your order...');
        setTimeout(() => {
          onVerified();
        }, 600);
      } else {
        setErrorMsg(result.message || 'Incorrect verification code. Please check your WhatsApp.');
      }
    } catch (err) {
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

  const handleDevAutoFill = () => {
    if (session.devOtp && session.devOtp.length === 6) {
      setDigits(session.devOtp.split(''));
      setErrorMsg(null);
    }
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
          {/* Subtle Emerald / Gold Ambient Backdrop Aura */}
          <div className="absolute top-0 right-0 w-44 h-44 bg-[#25D366]/10 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute bottom-0 left-0 w-44 h-44 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none -z-10" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-[#8E929E] hover:text-white hover:bg-[#1A1D24] transition-colors cursor-pointer"
            aria-label="Close verification modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header icon badge */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#25D366]/15 border border-[#25D366]/30 flex items-center justify-center text-[#25D366] shadow-lg shadow-[#25D366]/10">
              {/* WhatsApp Emerald SVG */}
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M12.031 2C6.5 2 2 6.5 2 12.031c0 1.97.575 3.805 1.572 5.352L2.24 21.76l4.526-1.282A9.98 9.98 0 0 0 12.031 22C17.562 22 22 17.5 22 12.031 22 6.5 17.562 2 12.031 2zm5.786 14.285c-.244.689-1.22 1.26-1.848 1.332-.573.066-1.264.123-3.774-.913-3.155-1.302-5.187-4.508-5.344-4.717-.153-.21-1.272-1.694-1.272-3.23 0-1.537.808-2.296 1.096-2.607.288-.31.628-.39.838-.39.21 0 .42.002.605.011.196.009.46-.074.72.551.272.651.928 2.26.101 2.457.08.196.134.425.02.664-.114.238-.172.387-.342.585-.17.198-.358.443-.51.595-.17.17-.348.354-.15.694.198.34.88 1.45 1.887 2.348 1.299 1.157 2.395 1.517 2.735 1.687.34.17.539.143.738-.086.2-.228.85-1.002 1.077-1.344.228-.342.455-.285.766-.17.31.115 1.97.93 2.31 1.1.34.17.567.255.652.396.085.142.085.823-.159 1.512z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-[#25D366] font-semibold tracking-wider uppercase">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>WhatsApp Mobile Verification</span>
              </div>
              <h2 className="text-xl font-bold font-serif-luxury text-white">
                Confirm Your Mobile
              </h2>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[#CBD0DC] leading-relaxed mb-6">
            To protect your order and ensure authentic delivery, enter the 6-digit code sent to your WhatsApp number{' '}
            <span className="font-bold text-[#E5C378] font-mono">{session.maskedPhone}</span>.
          </p>

          {/* 6 Digit Inputs */}
          <div className="flex justify-between items-center gap-2 sm:gap-3 mb-6">
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
                className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-mono font-bold rounded-2xl bg-[#090A0D] border transition-all outline-none ${
                  digit
                    ? 'border-[#25D366] text-[#25D366] shadow-sm shadow-[#25D366]/20'
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
              className="p-3 rounded-xl bg-emerald-950/40 border border-[#25D366]/40 text-[#25D366] text-xs flex items-center gap-2 mb-4"
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#25D366]" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleVerify}
              disabled={isVerifying || fullOtp.length !== 6 || !!successMsg}
              className={`w-full py-4 rounded-xl text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                fullOtp.length === 6 && !isVerifying && !successMsg
                  ? 'bg-gradient-to-r from-[#25D366] to-[#1EBE5D] hover:from-[#1EBE5D] hover:to-[#17A34E] text-[#0B0C0E] shadow-lg shadow-[#25D366]/25'
                  : 'bg-[#1C1F26] text-[#6E7382] cursor-not-allowed'
              }`}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify &amp; Confirm Order</span>
                </>
              )}
            </button>

            {/* Direct Open WhatsApp link if they want to view message or contact concierge */}
            {session.whatsappUrl && (
              <a
                href={session.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-[#161920] hover:bg-[#20242D] border border-[#2B2F38] text-xs text-[#CBD0DC] hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#25D366]" />
                <span>Open WhatsApp Chat / App</span>
              </a>
            )}
          </div>

          {/* Resend & Timer */}
          <div className="mt-5 pt-4 border-t border-[#232730] flex items-center justify-between text-xs text-[#8E929E]">
            <span>Didn&apos;t receive code?</span>
            {countdown > 0 ? (
              <span className="font-mono text-[#D4AF37]">
                Resend in {countdown}s
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResendClick}
                disabled={isResending}
                className="text-[#25D366] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
                <span>Resend Code</span>
              </button>
            )}
          </div>

          {/* Dev / Test Auto-Fill Helper (Shows only if devOtp is active) */}
          {session.devOtp && (
            <div className="mt-4 pt-3 border-t border-dashed border-[#2B2F38] flex items-center justify-between text-[11px] text-[#8E929E]">
              <span>Test/Demo Code: <strong className="text-[#D4AF37] font-mono">{session.devOtp}</strong></span>
              <button
                type="button"
                onClick={handleDevAutoFill}
                className="text-[#D4AF37] hover:underline cursor-pointer"
              >
                Auto-fill
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
