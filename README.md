# STORIUM — Luxury Watches & Accessories (Pakistan)

STORIUM is a futuristic luxury watch and accessory e-commerce store for Pakistan: precision
Japanese/Swiss timepieces, aerospace titanium, surgical steel, and sapphire crystal — with
nationwide delivery, COD, and online debit/credit card payments.

## Tech Stack

- **React 19 + Vite** (TypeScript) — single-page app
- **Tailwind CSS 4** — styling
- **Supabase** — optional cloud sync for orders/products/reviews (falls back to localStorage)
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
   `/payment/complete`) to `index.html` automatically.

## Environment Variables

See `.env.example` for the full list. `VITE_*` variables are embedded into the client
bundle at build time; gateway/Supabase service secrets must never use the `VITE_` prefix.