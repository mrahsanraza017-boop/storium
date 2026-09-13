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
   The `.htaccess` inside `dist/` routes all client-side routes (e.g. `/admin`, `/shop`) to
   `index.html` automatically.

### Card payments (Rapid Gateway)

`public/api/checkout.php` (copied into `dist/api/checkout.php` on build) initiates card
transactions. It reads these settings from environment variables — set them in Hostinger
hPanel under **Advanced → PHP Settings → Environment variables** (domain level):

| Variable          | Description                                         |
| ----------------- | --------------------------------------------------- |
| `RG_MERCHANT_ID`  | Rapid Gateway merchant id                           |
| `RG_CLIENT_SECRET`| Rapid Gateway client secret                         |
| `RG_MERCHANT_NAME`| Store name sent to the gateway (default: STORIUM)   |
| `BASE_URL`        | Public site URL for return pages, e.g. `https://storium.pk` |

If environment variables are unavailable on your plan, hardcode the values in the
`rg_config()` fallbacks at the top of `public/api/checkout.php`. These are server-side
secrets and are never exposed to the client.

## Environment Variables

See `.env.example` for the full list. `VITE_*` variables are embedded into the client
bundle at build time; gateway secrets must never use the `VITE_` prefix.