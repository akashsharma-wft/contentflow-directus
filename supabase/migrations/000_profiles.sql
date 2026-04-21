-- Migration: 000_profiles
-- Run BEFORE 001_admin_invites.sql.
--
-- Creates:
--   1. Enums: user_role_enum, subscription_tier_enum
--   2. profiles table (FK → auth.users)
--   3. Auth trigger: auto-creates a profile row on every new sign-up
--   4. RLS policies on profiles
--   5. delete_user helper function (referenced in generated types)

-- ─────────────────────────────────────────────
-- 1. ENUMS
-- ─────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE public.user_role_enum AS ENUM ('member', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_tier_enum AS ENUM ('free', 'pro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────
-- 2. PROFILES TABLE
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
  id                     UUID         PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                  TEXT,
  display_name           TEXT,
  bio                    TEXT,
  website                TEXT,
  avatar_url             TEXT,
  role                   public.user_role_enum         NOT NULL DEFAULT 'member',
  subscription_tier      public.subscription_tier_enum NOT NULL DEFAULT 'free',
  subscription_id        TEXT,
  subscription_cancel_at TIMESTAMPTZ,
  stripe_customer_id     TEXT,
  feature_flags          JSONB,
  preferences            JSONB,
  posthog_distinct_id    TEXT,
  last_seen_at           TIMESTAMPTZ,
  created_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS profiles_email_idx
  ON public.profiles(email);

CREATE INDEX IF NOT EXISTS profiles_stripe_customer_id_idx
  ON public.profiles(stripe_customer_id);

CREATE INDEX IF NOT EXISTS profiles_subscription_id_idx
  ON public.profiles(subscription_id);

CREATE INDEX IF NOT EXISTS profiles_role_idx
  ON public.profiles(role);

-- ─────────────────────────────────────────────
-- 3. AUTH TRIGGER — auto-create profile on signup
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────
-- 4. RLS ON PROFILES
-- ─────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile row.
-- Used by: middleware.ts (role check), ProfileForm, posts API (subscription_tier check)
DROP POLICY IF EXISTS "users_view_own_profile" ON public.profiles;
CREATE POLICY "users_view_own_profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile row.
-- Used by: ProfileForm (display_name, bio, website), ProfileAvatar (avatar_url)
-- Both use the browser anon-key client, so RLS applies.
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
CREATE POLICY "users_update_own_profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- INSERT is handled exclusively by the handle_new_user trigger (SECURITY DEFINER).
-- Service-role routes bypass RLS for all other writes (Stripe webhook, admin invite, delete-account).
-- No INSERT or DELETE policies are needed for the anon/authenticated role.

-- ─────────────────────────────────────────────
-- 5. delete_user FUNCTION
-- Referenced in generated types (supabase gen types).
-- The app uses adminClient.auth.admin.deleteUser() directly,
-- but the function must exist for the type schema to stay consistent.
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
