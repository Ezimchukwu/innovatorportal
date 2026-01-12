-- Allow super admins to manage announcements and projects, and set up storage for project thumbnails

-- 1) Update announcements RLS so super admins can manage announcements
ALTER POLICY "Admins manage announcements"
ON public.announcements
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- 2) Update projects RLS so super admins can manage and read all projects
ALTER POLICY "Students and schools manage projects"
ON public.projects
USING (
  (EXISTS (
    SELECT 1 FROM public.students st
    WHERE st.id = projects.student_id AND st.user_id = auth.uid()
  ))
  OR (EXISTS (
    SELECT 1 FROM public.schools s
    WHERE s.id = projects.school_id AND s.user_id = auth.uid()
  ))
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  (EXISTS (
    SELECT 1 FROM public.students st
    WHERE st.id = projects.student_id AND st.user_id = auth.uid()
  ))
  OR (EXISTS (
    SELECT 1 FROM public.schools s
    WHERE s.id = projects.school_id AND s.user_id = auth.uid()
  ))
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

ALTER POLICY "Related users read projects"
ON public.projects
USING (
  (EXISTS (
    SELECT 1 FROM public.students st
    WHERE st.id = projects.student_id AND st.user_id = auth.uid()
  ))
  OR (EXISTS (
    SELECT 1 FROM public.parent_students ps
    JOIN public.parents p ON ps.parent_id = p.id
    WHERE ps.student_id = projects.student_id AND p.user_id = auth.uid()
  ))
  OR (EXISTS (
    SELECT 1 FROM public.schools s
    WHERE s.id = projects.school_id AND s.user_id = auth.uid()
  ))
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- 3) Create a public bucket for project thumbnail images
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-thumbnails', 'project-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- 4) Storage policies for project thumbnails
DO $$
BEGIN
  -- Public read access for project thumbnails
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public read project thumbnails'
  ) THEN
    CREATE POLICY "Public read project thumbnails"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'project-thumbnails');
  END IF;

  -- Admins and super admins manage project thumbnails
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins manage project thumbnails'
  ) THEN
    CREATE POLICY "Admins manage project thumbnails"
    ON storage.objects
    FOR ALL
    USING (
      bucket_id = 'project-thumbnails'
      AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
    )
    WITH CHECK (
      bucket_id = 'project-thumbnails'
      AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
    );
  END IF;
END $$;