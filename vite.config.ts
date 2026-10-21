import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

function runCourierDevPlugin() {
  const RUN_CONFIG = {
    client_code: '1000003434',
    auth_key: 'cf7882d2-d196-4be5-bf2e-4d9d4f38b24e',
    profile_id: '2002',
    origin: 'Lahore',
    service_type: 'Overnight',
    product: 'Overnight',
    base_api_url: 'https://portal.runcourier.com/API',
  };

  return {
    name: 'run-courier-dev-proxy',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = req.url || '';

        // 1. Live Status Check
        if (url.startsWith('/api/courier-status.php')) {
          try {
            const start = Date.now();
            const response = await fetch(`${RUN_CONFIG.base_api_url}/GetCitiesList.php`);
            const latency = Date.now() - start;
            const data = (await response.json()) as any;
            const cityCount = Array.isArray(data?.data) ? data.data.length : 0;

            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                success: true,
                connected: true,
                portal_status: 'ONLINE',
                client_code: RUN_CONFIG.client_code,
                auth_key_configured: true,
                auth_key_masked: 'cf78••••••••••••4e',
                origin: RUN_CONFIG.origin,
                service_type: RUN_CONFIG.service_type,
                latency_ms: latency,
                city_count: cityCount,
                message: `RUN Couriers API is active and online (${cityCount} delivery hubs reachable).`,
                tested_at: new Date().toLocaleTimeString(),
              })
            );
          } catch (e: any) {
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                success: false,
                connected: false,
                portal_status: 'OFFLINE',
                client_code: RUN_CONFIG.client_code,
                auth_key_configured: true,
                auth_key_masked: 'cf78••••••••••••4e',
                origin: RUN_CONFIG.origin,
                service_type: RUN_CONFIG.service_type,
                message: 'Failed to reach RUN Couriers API: ' + (e?.message || 'Network error'),
                tested_at: new Date().toLocaleTimeString(),
              })
            );
          }
          return;
        }

        // 2. Booking Parcel with RUN Couriers
        if (url.startsWith('/api/courier-book.php')) {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk: any) => {
              body += chunk;
            });
            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body || '{}');
                const payload = {
                  client_code: RUN_CONFIG.client_code,
                  auth_key: RUN_CONFIG.auth_key,
                  service_type: RUN_CONFIG.service_type,
                  product: RUN_CONFIG.product,
                  profile_id: RUN_CONFIG.profile_id,
                  origin: RUN_CONFIG.origin,
                  receiver_phone: parsed.customerPhone || parsed.receiver_phone || '',
                  destination: parsed.destinationCity || parsed.destination || 'Karachi',
                  receiver_name: parsed.customerName || parsed.receiver_name || 'Valued Customer',
                  receiver_email: parsed.customerEmail || parsed.receiver_email || '',
                  receiver_address: parsed.shippingAddress || parsed.receiver_address || '',
                  pieces: parsed.pieces || 1,
                  tracking_no: '',
                  weight: parsed.weight || 0.5,
                  order_date: new Date().toISOString().slice(0, 19).replace('T', ' '),
                  collection_amount: String(parsed.collectionAmount ?? parsed.collection_amount ?? '0'),
                  product_description: parsed.productDescription || 'STORIUM Luxury Goods',
                  special_instruction: parsed.specialInstruction || 'Fragile - Luxury Timepiece. Handle with Care.',
                  order_id: parsed.orderId || '',
                  api_vendor: 'auto',
                };

                const response = await fetch(`${RUN_CONFIG.base_api_url}/CreateOrder.php`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
                });
                const text = await response.text();
                let result: any;
                try {
                  result = JSON.parse(text);
                } catch {
                  result = { success: false, error: text };
                }

                res.setHeader('Content-Type', 'application/json');
                const trackingNo = result?.tracking_no ? String(result.tracking_no) : (result?.id ? String(result.id) : '');
                if (trackingNo) {
                  res.end(
                    JSON.stringify({
                      success: true,
                      courier: 'RUN Couriers',
                      tracking_no: trackingNo,
                      invoice_link: `https://portal.runcourier.com/admin/booking/view_awb/${trackingNo}`,
                      booking_id: result.id,
                      message: result.message || 'Parcel booked successfully on RUN Couriers',
                    })
                  );
                } else {
                  res.statusCode = 400;
                  res.end(
                    JSON.stringify({
                      success: false,
                      error: typeof result === 'string' ? result : (result?.message || result?.error || text || 'Booking rejected by RUN Couriers'),
                      detail: result,
                    })
                  );
                }
              } catch (e: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: e?.message || 'Internal proxy error' }));
              }
            });
            return;
          }
        }

        // 3. Live Tracking
        if (url.startsWith('/api/courier-track.php')) {
          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              let trackingNo = '';
              if (req.method === 'POST') {
                const parsed = JSON.parse(body || '{}');
                trackingNo = parsed.tracking_no || parsed.trackingNo || '';
              } else {
                const u = new URL(req.url, 'http://localhost');
                trackingNo = u.searchParams.get('tracking_no') || u.searchParams.get('trackingNo') || '';
              }

              const payload = {
                client_code: RUN_CONFIG.client_code,
                auth_key: RUN_CONFIG.auth_key,
                tracking_no: trackingNo,
              };

              const response = await fetch(`${RUN_CONFIG.base_api_url}/TrackOrder.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              });
              const text = await response.text();
              let result: any;
              try {
                result = JSON.parse(text);
              } catch {
                result = text;
              }

              res.setHeader('Content-Type', 'application/json');
              const isArray = Array.isArray(result) && result.length > 0;
              const currentStatus = isArray && result[result.length - 1]?.status
                ? result[result.length - 1].status
                : (typeof result === 'string' ? result : 'No tracking history found yet');

              res.end(
                JSON.stringify({
                  success: isArray,
                  tracking_no: trackingNo,
                  history: isArray ? result : [],
                  current_status: currentStatus,
                  error: isArray ? undefined : (typeof result === 'string' ? result : 'Tracking information unavailable'),
                })
              );
            } catch (e: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: e?.message || 'Tracking error' }));
            }
          });
          return;
        }

        // 4. Send WhatsApp OTP via Storium AI Agent
        if (url.startsWith('/api/send-whatsapp-otp.php')) {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk: any) => { body += chunk; });
            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body || '{}');
                const rawPhone = String(parsed.phone || '').replace(/\D/g, '');
                let normalizedPhone = rawPhone;
                if (rawPhone.startsWith('03')) normalizedPhone = '92' + rawPhone.slice(1);
                else if (rawPhone.startsWith('3') && rawPhone.length === 10) normalizedPhone = '92' + rawPhone;

                const otp = parsed.clientOtp && /^\d{6}$/.test(parsed.clientOtp)
                  ? parsed.clientOtp
                  : String(Math.floor(100000 + Math.random() * 900000));

                const maskedPhone = '+92 ' + normalizedPhone.slice(2, 5) + ' •••••' + normalizedPhone.slice(-2);
                const expiresAt = Math.floor(Date.now() / 1000) + 600;
                const token = `dev_token_${normalizedPhone}_${otp}_${expiresAt}`;

                const customerName = parsed.customerName || 'Valued Customer';
                const message = `🛡️ *STORIUM AI Concierge* — Security Verification\n\nSalam ${customerName}!\n\nYour 6-digit order verification code is:\n👉 *${otp}*\n\nPlease enter this code on the checkout screen to confirm your order dispatch.\n\n— Storium AI WhatsApp Agent`;
                const whatsappUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
                const aiAgentChatUrl = `https://wa.me/923215993022?text=${encodeURIComponent(
                  `Salam Shami! Please send my 6-digit order verification code for mobile +${normalizedPhone}`
                )}`;

                let dispatchedViaApi = false;
                let apiError = null;
                const metaToken = 'EAAcFPk7gFA4BSZCrAWWp1ZAZAMFC8ur2e6tqJP3uspyg6jkne68we4PchGYHlgFO5yA4HfP9EFLZCZA7g1UilmeRE2mxOOQUu6ugHuL8AO7erQjITi2ZAlTEdZA5ZClZAK2akR4aUmVxuLFeUrWe0VHmytGRHy68Pv8J5ILCi4bZC5PrKLKpFKEUQaYRNeqQQEGSiDwJosbbYSmKTgPjHADjZBTvp1CGWOOGUvtN2vVWMucrGhJ6OlsBPzpnMb82afkpE2tFtxz5TtFi925CIcftPJ9WZCGOd3h1imcaZCLQ8LwZDZD';
                const metaPhoneId = '1417248708132316';

                if (metaToken && metaPhoneId) {
                  try {
                    const metaRes = await fetch(`https://graph.facebook.com/v21.0/${metaPhoneId}/messages`, {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${metaToken}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        messaging_product: 'whatsapp',
                        recipient_type: 'individual',
                        to: normalizedPhone,
                        type: 'text',
                        text: { preview_url: false, body: message },
                      }),
                    });
                    const metaData = await metaRes.json() as any;
                    if (metaRes.ok) {
                      dispatchedViaApi = true;
                    } else {
                      apiError = metaData?.error?.message || 'Meta API error';
                      console.warn('Meta WhatsApp Cloud API error:', metaData?.error);
                    }
                  } catch (fetchErr: any) {
                    apiError = fetchErr?.message || 'Failed to reach Meta Cloud API';
                    console.warn('Meta WhatsApp Cloud fetch error:', fetchErr?.message);
                  }
                }

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: true,
                  agent_name: 'Shami (Storium AI Agent)',
                  phone: normalizedPhone,
                  maskedPhone,
                  token,
                  expiresAt,
                  dispatchedViaApi,
                  provider: dispatchedViaApi ? 'Meta WhatsApp Cloud API' : 'Shami (Storium AI Agent)',
                  apiError,
                  whatsappUrl,
                  aiAgentChatUrl,
                  devOtp: otp,
                }));
              } catch (e: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: e?.message || 'Error generating OTP' }));
              }
            });
            return;
          }
        }

        // 5. Verify WhatsApp OTP
        if (url.startsWith('/api/verify-whatsapp-otp.php')) {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk: any) => { body += chunk; });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body || '{}');
                const otp = String(parsed.otp || '').trim();
                const token = String(parsed.token || '');
                const devOtp = String(parsed.devOtp || '');

                const isValid = otp.length === 6 && (token.includes(`_${otp}_`) || otp === devOtp);

                res.setHeader('Content-Type', 'application/json');
                if (isValid) {
                  res.end(JSON.stringify({
                    verified: true,
                    message: 'WhatsApp authenticated successfully by Storium AI Agent.',
                  }));
                } else {
                  res.statusCode = 400;
                  res.end(JSON.stringify({
                    verified: false,
                    message: 'Incorrect verification code. Please check your WhatsApp.',
                  }));
                }
              } catch (e: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ verified: false, message: e?.message || 'Verification error' }));
              }
            });
            return;
          }
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), runCourierDevPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      target: 'esnext',
      cssCodeSplit: true,
      minify: 'esbuild',
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('@supabase')) {
                return 'vendor-services';
              }
              if (id.includes('motion')) {
                return 'vendor-motion';
              }
              if (id.includes('react') || id.includes('clsx') || id.includes('tailwind')) {
                return 'vendor-ui-core';
              }
            }
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
