# Raj Mohan Transport Services (RTS)

Next.js App Router app with Supabase for auth and data. Static HTML prototypes remain under `src/Dasboard` and `src/login and reg` for reference while we migrate.

## Quick start

1. Copy `.env.local.example` to `.env.local` and set:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Install deps
3. Start dev server

## Supabase setup (optional but recommended)

1. Create a new project at supabase.com and grab the Project URL and anon key.
2. Apply schema:
    - Open the SQL editor in Supabase and run `supabase/schema.sql`.
3. Seed minimal data:
    - Insert a row into `clients` and then create a user via Auth. Add a `profiles` row with `id` = the auth user id and `client_id` referencing your client; set `role` to `client` or `admin`.

## Routes

- `/login` and `/register` use Supabase client auth when env vars are set.
- `/contracts` reads from the `contracts` table with an Active/Expired filter.
- `/dashboard/customer` shows shipments for the logged-in user's client when linked via `profiles.client_id`. Includes text and status filters.

## Notes

- The top-level `app/` directory re-exports pages from `src/app/` to keep legacy routes working.
- Avoid committing service_role keys. Only use the anon key in the browser.

## Troubleshooting

- Missing env: Pages will fall back to placeholders; set `.env.local` to enable live data.
- Auth login succeeds but no redirect: Ensure `profiles.role` exists for the user.
- Dashboard shows no shipments: Ensure `profiles.client_id` is set and there are rows in `shipments` with that `client_id`.
