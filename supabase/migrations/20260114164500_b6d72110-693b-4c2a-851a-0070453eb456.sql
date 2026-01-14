-- Allow projects without a linked student (for super admin uploads and platform showcase projects)
ALTER TABLE public.projects
ALTER COLUMN student_id DROP NOT NULL;