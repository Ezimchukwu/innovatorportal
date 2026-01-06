-- Extend projects table with admin control fields
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS uploaded_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS uploaded_by_role app_role,
  ADD COLUMN IF NOT EXISTS is_featured_homepage boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_platform_showcase boolean NOT NULL DEFAULT false;

-- Simple admin action logs table
CREATE TABLE IF NOT EXISTS public.admin_action_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_action_logs ENABLE ROW LEVEL SECURITY;

-- Only super admins can read logs
CREATE POLICY "Super admins read admin logs"
ON public.admin_action_logs
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Any authenticated admin user can insert logs for their own actions
CREATE POLICY "Admins insert admin logs"
ON public.admin_action_logs
FOR INSERT
WITH CHECK (
  (auth.uid() = admin_user_id)
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
);