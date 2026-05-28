# DecodeHire

Standalone Next.js migration of DecodeHire.

## Setup

Create `.env.local` with:

- NEXT_PUBLIC_APP_URL
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- AI_GATEWAY_BASE_URL
- AI_GATEWAY_API_KEY
- STRIPE_SECRET_KEY

Then run:

```bash
npm install
npm run dev
```

## Deploy

Deploy from repository root on Vercel using the Next.js framework preset.
