-- 1) Create announcement_target enum for audience targeting
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'announcement_target') THEN
    CREATE TYPE public.announcement_target AS ENUM ('all', 'students', 'parents', 'schools');
  END IF;
END $$;

-- 2) Create announcements table for admin broadcasts
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text,
  target public.announcement_target NOT NULL DEFAULT 'all',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL
);

-- 3) Enable RLS on announcements
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- 4) Policies: everyone can read, only admins can manage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'announcements' AND policyname = 'Everyone reads announcements'
  ) THEN
    CREATE POLICY "Everyone reads announcements"
    ON public.announcements
    FOR SELECT
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'announcements' AND policyname = 'Admins manage announcements'
  ) THEN
    CREATE POLICY "Admins manage announcements"
    ON public.announcements
    FOR ALL
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- 5) Allow admins to fully manage user_roles (including admin roles)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Admins manage user roles'
  ) THEN
    CREATE POLICY "Admins manage user roles"
    ON public.user_roles
    FOR ALL
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;