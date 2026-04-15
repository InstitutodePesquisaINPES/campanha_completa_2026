

# Plan: Create Test Users via Edge Function

## What
Create a Supabase Edge Function `seed-test-users` that creates 5 test users (one per role) using the Supabase Admin API, then assigns their roles and creates their profiles.

## Test Users

| Email | Password | Role | Name |
|-------|----------|------|------|
| admin@sigt.test | Sigt@2024 | admin | Admin SIGT |
| coordenador@sigt.test | Sigt@2024 | coordenador | Maria Coordenadora |
| lideranca@sigt.test | Sigt@2024 | lideranca | João Liderança |
| operador@sigt.test | Sigt@2024 | operador | Ana Operadora |
| visualizador@sigt.test | Sigt@2024 | visualizador | Carlos Visualizador |

## Implementation

### Step 1: Create Edge Function `supabase/functions/seed-test-users/index.ts`
- Use `SUPABASE_SERVICE_ROLE_KEY` (already configured) to create users via `supabase.auth.admin.createUser()`
- For each user: create auth user, then insert into `user_roles` with the corresponding role
- The `handle_new_user` trigger will auto-create profiles
- Include CORS headers, idempotency (skip if user email already exists), and return a summary of created users
- Protected by a simple check (e.g., require admin auth or a known secret)

### Step 2: Deploy and invoke the function
- Deploy the edge function
- Call it to seed the test users

### Step 3: Add a button in AdminPage (optional convenience)
- Add a "Seed Test Users" button in the admin panel's Users tab so admins can trigger it from the UI

## Technical Details
- Uses `supabase.auth.admin.createUser({ email, password, email_confirm: true })` so users can log in immediately
- Sets `user_metadata.full_name` so the `handle_new_user` trigger populates profiles correctly
- Inserts roles via service role client (bypasses RLS)
- Idempotent: checks if email exists before creating

