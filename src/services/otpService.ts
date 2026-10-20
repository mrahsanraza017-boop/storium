/**
 * STORIUM Pakistan — WhatsApp Mobile OTP Verification Service
 * Handles formatting Pakistani phone numbers, generating secure OTPs,
 * dispatching via WhatsApp API / Concierge, and verifying codes.
 */

export interface OtpSession {
  phone: string;
  normalizedPhone: string;
  maskedPhone: string;
  token?: string;
  expiresAt: number;
  devOtp?: string;
  whatsappUrl?: string;
}

/**
 * Normalizes any Pakistani phone number format to standard international '923XXXXXXXXX'
 * Examples:
 *   '03001234567' -> '923001234567'
 *   '+92 300 1234567' -> '923001234567'
 *   '0321-5993022' -> '923215993022'
 *   '3001234567' -> '923001234567'
 */
export const normalizePakistaniPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('92')) {
    return digits;
  }
  if (digits.startsWith('03')) {
    return '92' + digits.substring(1);
  }
  if (digits.startsWith('3') && digits.length === 10) {
    return '92' + digits;
  }
  return digits;
};

/**
 * Formats a phone number for elegant human-readable display e.g. +92 300 1234567
 */
export const formatPhoneDisplay = (phone: string): string => {
  const normalized = normalizePakistaniPhone(phone);
  if (normalized.startsWith('92') && normalized.length === 12) {
    return `+92 ${normalized.substring(2, 5)} ${normalized.substring(5)}`;
  }
  return phone;
};

/**
 * Masks a phone number for privacy e.g. +92 300 •••••67
 */
export const maskPhone = (phone: string): string => {
  const normalized = normalizePakistaniPhone(phone);
  if (normalized.startsWith('92') && normalized.length >= 12) {
    const prefix = normalized.substring(2, 5);
    const suffix = normalized.substring(normalized.length - 2);
    return `+92 ${prefix} •••••${suffix}`;
  }
  if (phone.length > 4) {
    return phone.substring(0, 3) + '••••' + phone.substring(phone.length - 2);
  }
  return phone;
};

/**
 * Generates a 6-digit numeric OTP code
 */
export const generateOtpCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Dispatches WhatsApp OTP to customer's mobile number
 */
export const sendWhatsAppOtp = async (
  rawPhone: string,
  customerName: string = 'Valued Customer',
  orderTotal?: number
): Promise<OtpSession> => {
  const normalizedPhone = normalizePakistaniPhone(rawPhone);
  const maskedPhone = maskPhone(rawPhone);
  const clientGeneratedOtp = generateOtpCode();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Default direct WhatsApp chat link (Customer can also click to receive/verify with Concierge)
  const message = `Salam ${customerName}! Your STORIUM Pakistan order verification code is: *${clientGeneratedOtp}*.\n\nEnter this 6-digit code to confirm your order dispatch.`;
  const whatsappUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;

  try {
    // Attempt backend PHP WhatsApp dispatch
    const response = await fetch('/api/send-whatsapp-otp.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: rawPhone,
        normalizedPhone,
        customerName,
        orderTotal,
        clientOtp: clientGeneratedOtp,
      }),
    });

    if (response.ok) {
      const data = await response.json().catch(() => null);
      if (data && data.success) {
        return {
          phone: rawPhone,
          normalizedPhone,
          maskedPhone: data.maskedPhone || maskedPhone,
          token: data.token,
          expiresAt: data.expiresAt ? data.expiresAt * 1000 : expiresAt,
          devOtp: data.devOtp || clientGeneratedOtp,
          whatsappUrl: data.whatsappUrl || whatsappUrl,
        };
      }
    }
  } catch (err) {
    console.warn('Backend WhatsApp API endpoint unreachable, using client-side verification session:', err);
  }

  // Resilient fallback: client-managed session
  return {
    phone: rawPhone,
    normalizedPhone,
    maskedPhone,
    token: `local_${clientGeneratedOtp}_${expiresAt}`,
    expiresAt,
    devOtp: clientGeneratedOtp,
    whatsappUrl,
  };
};

/**
 * Verifies entered OTP against session
 */
export const verifyWhatsAppOtp = async (
  enteredOtp: string,
  session: OtpSession
): Promise<{ verified: boolean; message?: string }> => {
  const cleanEntered = enteredOtp.trim().replace(/\D/g, '');
  if (cleanEntered.length !== 6) {
    return { verified: false, message: 'Please enter all 6 digits.' };
  }

  if (Date.now() > session.expiresAt) {
    return { verified: false, message: 'Verification code has expired. Please request a new one.' };
  }

  // If session is local
  if (session.token && session.token.startsWith('local_')) {
    const parts = session.token.split('_');
    const expectedOtp = parts[1];
    if (cleanEntered === expectedOtp || cleanEntered === session.devOtp) {
      return { verified: true };
    }
    return { verified: false, message: 'Incorrect verification code. Please check your WhatsApp.' };
  }

  // Try backend verification
  try {
    const response = await fetch('/api/verify-whatsapp-otp.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: session.normalizedPhone,
        otp: cleanEntered,
        token: session.token,
        expiresAt: Math.floor(session.expiresAt / 1000),
      }),
    });

    if (response.ok) {
      const data = await response.json().catch(() => null);
      if (data && data.verified) {
        return { verified: true };
      }
      if (data && data.error) {
        return { verified: false, message: data.error };
      }
    }
  } catch (err) {
    console.warn('Backend verification check failed, evaluating fallback:', err);
  }

  // Fallback to devOtp check if backend was offline or in demo mode
  if (session.devOtp && cleanEntered === session.devOtp) {
    return { verified: true };
  }

  return { verified: false, message: 'Incorrect verification code. Please check your WhatsApp.' };
};
