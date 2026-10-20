import { Order } from '../types';

export interface CourierBookingResult {
  success: boolean;
  courier: string;
  tracking_no: string;
  invoice_link: string;
  booking_id?: number | string;
  message?: string;
  error?: string;
  simulated?: boolean;
}

export interface TrackingHistoryItem {
  tracking_no: string;
  status: string;
  created: string;
}

export interface CourierTrackingResult {
  success: boolean;
  tracking_no: string;
  current_status?: string;
  history: TrackingHistoryItem[];
  error?: string;
}

export interface CourierGatewayStatus {
  success: boolean;
  connected: boolean;
  portal_status: string;
  client_code: string;
  auth_key_configured: boolean;
  auth_key_masked: string;
  origin: string;
  service_type: string;
  latency_ms?: number;
  city_count?: number;
  message: string;
  tested_at?: string;
  error?: string;
}

/**
 * Pings the RUN Couriers live gateway status endpoint.
 */
export async function checkRunCourierStatus(): Promise<CourierGatewayStatus> {
  try {
    const res = await fetch('/api/courier-status.php', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return {
        success: Boolean(data.success),
        connected: Boolean(data.connected),
        portal_status: data.portal_status || (data.connected ? 'ONLINE' : 'OFFLINE'),
        client_code: data.client_code || '1000003434',
        auth_key_configured: Boolean(data.auth_key_configured),
        auth_key_masked: data.auth_key_masked || 'cf78••••••••••••4e',
        origin: data.origin || 'Lahore',
        service_type: data.service_type || 'Overnight',
        latency_ms: data.latency_ms,
        city_count: data.city_count,
        message: data.message || 'RUN Couriers Gateway Connected',
        tested_at: data.tested_at || new Date().toLocaleTimeString(),
      };
    }
  } catch (err: any) {
    console.warn('[RUN Couriers] Status check endpoint unreachable:', err);
  }

  return {
    success: false,
    connected: false,
    portal_status: 'OFFLINE',
    client_code: '1000003434',
    auth_key_configured: true,
    auth_key_masked: 'cf78••••••••••••4e',
    origin: 'Lahore',
    service_type: 'Overnight',
    message: 'Could not connect to /api/courier-status.php. Upload api/ folder to Hostinger public_html to enable live courier calls.',
    tested_at: new Date().toLocaleTimeString(),
  };
}

/**
 * Books an order parcel with RUN Couriers (portal.runcourier.com).
 * Uses /api/courier-book.php with real merchant credentials (Client: 1000003434).
 */
export async function bookWithRunCouriers(
  order: Order,
  options?: {
    weight?: number;
    pieces?: number;
    specialInstruction?: string;
    collectionAmount?: string;
  }
): Promise<CourierBookingResult> {
  const collectionAmount = options?.collectionAmount !== undefined
    ? String(options.collectionAmount)
    : order.paymentMethod === 'cod'
    ? String(order.total)
    : '0';

  const productDescription = order.items
    .map((item) => `${item.productName} [Qty: ${item.quantity}]`)
    .join(', ');

  const payload = {
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customer.fullName,
    customerPhone: order.customer.phone,
    customerEmail: order.customer.email,
    shippingAddress: `${order.customer.address}, ${order.customer.city}`,
    destinationCity: order.customer.city,
    collectionAmount,
    productDescription,
    weight: options?.weight || 0.5,
    pieces: options?.pieces || 1,
    specialInstruction: options?.specialInstruction || 'Fragile Luxury Timepiece - Handle with Care',
  };

  try {
    const res = await fetch('/api/courier-book.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);

    if (res.ok && data?.success && data?.tracking_no) {
      return {
        success: true,
        courier: 'RUN Couriers',
        tracking_no: String(data.tracking_no),
        invoice_link: data.invoice_link || `https://portal.runcourier.com/invoicehtml.php?order_id=${data.booking_id || ''}&booking=1`,
        booking_id: data.booking_id,
        message: data.message || `Consignment ${data.tracking_no} booked successfully with RUN Couriers`,
      };
    }

    if (data && !data.success) {
      return {
        success: false,
        courier: 'RUN Couriers',
        tracking_no: '',
        invoice_link: '',
        error: data.error || data.message || 'RUN Couriers rejected booking request',
      };
    }
  } catch (err: any) {
    console.warn('[RUN Couriers] Booking call failed:', err);
    return {
      success: false,
      courier: 'RUN Couriers',
      tracking_no: '',
      invoice_link: '',
      error: `Network error reaching courier gateway: ${err.message || 'Server offline'}. Please ensure api/ is uploaded to your live domain.`,
    };
  }

  return {
    success: false,
    courier: 'RUN Couriers',
    tracking_no: '',
    invoice_link: '',
    error: 'Unknown response received from RUN Couriers booking API',
  };
}

/**
 * Fetches real-time tracking timeline from RUN Couriers network.
 */
export async function trackRunCourier(trackingNo: string): Promise<CourierTrackingResult> {
  const cleanNo = trackingNo.trim();
  if (!cleanNo) {
    return {
      success: false,
      tracking_no: '',
      history: [],
      error: 'Please enter a valid tracking number',
    };
  }

  try {
    const res = await fetch(`/api/courier-track.php?tracking_no=${encodeURIComponent(cleanNo)}`);
    const data = await res.json().catch(() => null);

    if (res.ok && data?.success && Array.isArray(data.history) && data.history.length > 0) {
      const historyList: TrackingHistoryItem[] = data.history.map((h: any) => ({
        tracking_no: String(h.tracking_no || cleanNo),
        status: String(h.status || 'In Transit'),
        created: String(h.created || h.status_date || new Date().toISOString().replace('T', ' ').slice(0, 19)),
      }));

      const latestStatus = historyList[historyList.length - 1].status;

      return {
        success: true,
        tracking_no: cleanNo,
        current_status: latestStatus,
        history: historyList,
      };
    }

    if (data?.error) {
      return {
        success: false,
        tracking_no: cleanNo,
        current_status: 'Not Found',
        history: [],
        error: data.error,
      };
    }
  } catch (err: any) {
    console.warn('[RUN Couriers] Track endpoint error:', err);
  }

  return {
    success: false,
    tracking_no: cleanNo,
    current_status: 'Not Found',
    history: [],
    error: `Tracking number "${cleanNo}" was not found on RUN Couriers network.`,
  };
}
