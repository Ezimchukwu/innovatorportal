-- Fix infinite recursion in RLS involving students and parent_students
-- Remove students reference from parent_students SELECT policy to break cycle
ALTER POLICY "Parents read their links" ON public.parent_students
USING (
  (
    EXISTS (
      SELECT 1
      FROM public.parents p
      WHERE p.id = parent_students.parent_id
        AND p.user_id = auth.uid()
    )
  )
  OR public.has_role(auth.uid(), 'admin'::app_role)
);
