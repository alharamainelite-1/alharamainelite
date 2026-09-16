# ALHARAMAINELITE — Production Foundation

A new production-oriented Next.js foundation for Alharamainelite, built from scratch from the approved product specification.

## Core business rules
- Signature: **$2,000 USD / guest**
- Elite: **$2,500 USD / guest**
- Guest selector: 1–8
- Standard group capacity: 5–8
- Flights are not included.
- Customers submit a journey request; this is not flight booking.
- Travel timing can be an expected date or approximate period.
- No online payment at launch. Payment is manual bank transfer after WhatsApp confirmation.
- Official WhatsApp: **+966 57 912 0989**
- Tagline: **A JOURNEY WORTH REMEMBERING.**
- Languages: English, Somali, Arabic (Arabic RTL architecture).
- The supplied official logo is preserved unchanged at `public/brand/alharamainelite-logo.png`.

## Included in this foundation
- Premium public marketing architecture and brand system.
- Home, packages, package detail, experience, destinations, women’s Umrah, hotels, transportation, about, reviews, FAQ, contact and request-success pages.
- Functional client price calculator.
- Server-side Zod validation and server-side price recalculation.
- Journey request API that creates a customer, request and booking after Supabase is configured.
- Comprehensive PostgreSQL/Supabase schema and RLS migration.
- Seed data for packages, settings and package features.
- Supabase browser/admin clients.
- Admin sign-in and protected admin route foundation.
- Admin dashboard statistics and workspace architecture.
- SEO sitemap/robots and security headers.

## Supabase setup
Create a new Supabase project for Alharamainelite, then apply:

1. `supabase/migrations/001_initial.sql`
2. `supabase/seed.sql`

Create your admin users through Supabase Auth, then assign their `profiles.role` values.

The first admin should be `SUPER_ADMIN`. Other supported roles are:
`ADMIN`, `OPERATIONS`, `SALES`, `FINANCE`, `HOST`.

## Environment variables
Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_WHATSAPP`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Never expose or commit the service-role key.

## Local commands
```bash
npm install
npm run dev
npm run typecheck
npm run build
```

## Current verification status
The source structure and core logic have been created, but a full TypeScript/build verification could not be completed in this execution environment because `npm install` timed out while reaching the npm registry. Do not treat the project as build-verified until dependencies install successfully.

## Next production steps
1. Create the new Supabase project.
2. Apply the migration and seed.
3. Add environment variables.
4. Create admin accounts and roles.
5. Finish authenticated CRUD screens for each admin workspace and the operations calendar.
6. Add only approved real photography and verified guest reviews.
7. Configure Vercel environment variables and deploy.
8. Run typecheck, lint and production build in CI before launch.
