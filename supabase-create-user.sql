-- Create user saifelleuchi127@gmail.com in Supabase Auth
-- Run this once in Supabase SQL Editor (Dashboard > SQL Editor).
-- Replace 'YourTempPassword123!' with a real password, then change it after first login.

-- Ensure pgcrypto is available (for password hashing)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert into auth.users (your trigger will create public.profiles automatically)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
SELECT
  (SELECT id FROM auth.instances LIMIT 1),
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'saifelleuchi127@gmail.com',
  crypt('YourTempPassword123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":""}'::jsonb,
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'saifelleuchi127@gmail.com'
);

-- Optional: create profile if trigger didn’t run (e.g. trigger created after this user)
INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
SELECT id, email, raw_user_meta_data->>'full_name', created_at, updated_at
FROM auth.users
WHERE email = 'saifelleuchi127@gmail.com'
ON CONFLICT (id) DO NOTHING;
