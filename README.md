# STORIUM — Luxury Watches & Accessories (Pakistan)

STORIUM is a futuristic luxury watch and accessory e-commerce store for Pakistan: precision
Japanese/Swiss timepieces, aerospace titanium, surgical steel, and sapphire crystal — with
nationwide delivery, COD, and online debit/credit card payments via Rapid Gateway.

## Tech Stack

- **React 19 + Vite** (TypeScript) — single-page app
- **Tailwind CSS 4** — styling
- **Supabase** — optional cloud sync for orders/products/reviews (falls back to localStorage)
- **Rapid Gateway (PHP)** — hosted card payment initiation (`public/api/checkout.php`)
- **Apache/LiteSpeed** — SPA routing via `public/.htaccess` (Hostinger)

## Local Development

```bash
npm install
npm run dev        # http://localhost:3000
```

## Build

```bash
npm run build      # outputs to dist/
npm run preview    # serve the production build locally
```

## Deploy to Hostinger (static hosting)

1. `npm run build`
2. Upload the contents of `dist/` to `public_html` in Hostinger hPanel (File Manager).
   The `.htaccess` inside `dist/` routes all client-side routes (e.g. `/admin`, `/shop`,
   `/payment/complete`) to `index.html` automatically. PHP files under `dist/api/`
   are executed by Hostinger's LiteSpeed server.

### Card payments (Rapid Gateway)

Two server-side PHP endpoints handle card payments; both are copied into `dist/api/` on build:

- `public/api/checkout.php` — implements the sandbox-kit flow: fetch an OAuth2 bearer token
  (`/oauth2/token`), submit the transaction (`/rapid/process-transaction`), and return the
  hosted **checkout URL** (the gateway's 302 `Location`) to the browser without following it.
- `public/api/webhook.php` — optional; verifies `X-RG-Signature` (HMAC-SHA256) and marks the
  order paid in Supabase via the service-role key, if your gateway sends webhook events.
- After checkout the gateway returns the customer to one of three pages on your site
  (all resolved by the React SPA to `PaymentCompleteView`):
  - `/payment/success` — payment accepted → order marked **Paid** locally
  - `/payment/failure` — payment declined/expired
  - `/payment/complete` — checkout finished (waits a few seconds for the webhook/order update)

Set these environment variables in Hostinger hPanel under **Advanced → PHP Settings → Environment
variables** (domain level) — never use a `VITE_` prefix, and never hardcode them in the client:

| Variable                  | Description                                                       |
| ------------------------- | ----------------------------------------------------------------- |
| `RG_MERCHANT_ID`          | Rapid Gateway merchant id (e.g. `102`)                            |
| `RG_CLIENT_SECRET`        | Rapid Gateway client secret                                       |
| `RG_MERCHANT_NAME`        | Store name sent to the gateway (default: STORIUM)                 |
| `BASE_URL`                | Public site URL for the return pages, e.g. `https://storium.online`   |
| `RG_WEBHOOK_SECRET`       | **Optional** — webhook HMAC secret (if your gateway sends events) |
| `SUPABASE_URL`            | **Optional** — Supabase project URL (webhook order update)        |
| `SUPABASE_SERVICE_ROLE_KEY` | **Optional** — Supabase service role key (webhook order update) |

If environment variables are unavailable on your plan, hardcode the values in the `rg_config()`
fallbacks at the top of the PHP files. These are server-side secrets and are never exposed to
the client.

#### Sandbox testing (for onboarding / integration screenshot)

1. Get sandbox credentials (`MERCHANT_ID` + `CLIENT_SECRET`) from your Rapid Gateway onboarding kit.
2. Set them as the env vars above and rebuild/upload `dist/`.
3. Place a test order and choose **Visa / Mastercard Debit Card** — you're redirected to the
   gateway's hosted checkout.
4. Complete it in the sandbox page and confirm:
   - you land back on `/payment/success`, and
   - the order shows **Paid** / **Processing** in Admin → Orders.

## Environment Variables

See `.env.example` for the full list. `VITE_*` variables are embedded into the client
bundle at build time; gateway/Supabase service secrets must never use the `VITE_` prefix.