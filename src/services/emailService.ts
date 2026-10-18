import { Order } from '../types';

export interface EmailDispatchResult {
  success: boolean;
  message?: string;
  error?: string;
  method?: string;
}

/**
 * Service to dispatch branded order confirmations, payment receipts, and test emails.
 * Calls the backend /api/send-order-email.php endpoint which delivers via SMTP, Resend, or PHP mail().
 */
export async function sendOrderConfirmationEmail(order: Order): Promise<EmailDispatchResult> {
  if (!order || !order.customer?.email) {
    return {
      success: false,
      error: 'Cannot send confirmation email: Missing customer email address.',
    };
  }

  try {
    const response = await fetch('/api/send-order-email.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'order_confirmation',
        order,
      }),
    });

    const data = await response.json().catch(() => null);

    if (response.ok && data?.success) {
      console.info(`[STORIUM Email] Order confirmation dispatched to ${order.customer.email} (Method: ${data.method || 'server'})`);
      return {
        success: true,
        message: data.message || `Confirmation email sent to ${order.customer.email}`,
        method: data.method,
      };
    } else {
      console.warn('[STORIUM Email] Server failed to send email:', data?.error || response.statusText);
      return {
        success: false,
        error: data?.error || 'Failed to dispatch email from server.',
        method: data?.method,
      };
    }
  } catch (err: any) {
    console.warn('[STORIUM Email] Network error calling email endpoint:', err);
    return {
      success: false,
      error: err?.message || 'Network error while attempting to send order email.',
    };
  }
}

/**
 * Dispatches a payment verified receipt email (e.g. after SafePay transaction settlement).
 */
export async function sendPaymentReceiptEmail(order: Order): Promise<EmailDispatchResult> {
  if (!order || !order.customer?.email) {
    return {
      success: false,
      error: 'Missing customer email address for payment receipt.',
    };
  }

  try {
    const response = await fetch('/api/send-order-email.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'payment_receipt',
        order,
      }),
    });

    const data = await response.json().catch(() => null);
    return {
      success: !!(response.ok && data?.success),
      message: data?.message,
      error: data?.error,
      method: data?.method,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Network error while sending payment receipt email.',
    };
  }
}

/**
 * Dispatches a live test email to any designated address (used by admin to verify email delivery).
 */
export async function sendTestConfirmationEmail(toEmail: string): Promise<EmailDispatchResult> {
  const sampleOrder: Order = {
    id: 'test-ord-' + Date.now(),
    orderNumber: 'STM-PK-78901',
    date: new Date().toISOString(),
    customer: {
      fullName: 'VIP Customer (Test)',
      email: toEmail,
      phone: '+92 300 1234567',
      address: 'Suite 402, Luxury Towers, Main Boulevard, Gulberg III',
      city: 'Lahore',
      province: 'Punjab',
    },
    items: [
      {
        productId: 'sample-p1',
        productName: 'STORIUM Royal Skeleton Automatic Chrono',
        productThumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=300&auto=format&fit=crop',
        price: 24500,
        quantity: 1,
        selectedVariant: { Color: 'Rose Gold Obsidian', Strap: 'Genuine Leather' },
        sku: 'STM-RS-01',
      },
    ],
    subtotal: 24500,
    shippingFee: 0,
    total: 24500,
    paymentMethod: 'card',
    paymentStatus: 'paid',
    orderStatus: 'Confirmed',
    trackingNumber: 'TCS-88992211-LHR',
  };

  try {
    const response = await fetch('/api/send-order-email.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'test',
        to: toEmail,
        order: sampleOrder,
      }),
    });

    const data = await response.json().catch(() => null);
    return {
      success: !!(response.ok && data?.success),
      message: data?.message || `Test email dispatched to ${toEmail}`,
      error: data?.error,
      method: data?.method,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Network error while sending test email.',
    };
  }
}

/**
 * Generates the live HTML email markup for previewing in the admin dashboard.
 */
export async function getOrderReceiptHtmlPreview(order: Order): Promise<string> {
  try {
    const response = await fetch('/api/send-order-email.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        preview_only: true,
        order,
      }),
    });

    const data = await response.json().catch(() => null);
    if (data?.success && data?.html) {
      return data.html;
    }
  } catch (e) {
    console.error('Failed to generate email preview:', e);
  }

  return '<div style="padding: 20px; color: white;">Preview generation failed.</div>';
}
