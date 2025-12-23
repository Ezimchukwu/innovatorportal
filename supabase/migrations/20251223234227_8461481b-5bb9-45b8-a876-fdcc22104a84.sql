-- Allow parents to create independent-learner students (no school_id)
CREATE POLICY "Parents create independent students"
ON public.students
FOR INSERT
TO authenticated
WITH CHECK (
  school_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.parents p
    WHERE p.user_id = auth.uid()
  )
);

-- Allow parents to link their own children
CREATE POLICY "Parents link own children"
ON public.parent_students
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.parents p
    WHERE p.id = parent_students.parent_id
      AND p.user_id = auth.uid()
  )
);

-- Add age and gender fields to students for richer profiles
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS age integer,
ADD COLUMN IF NOT EXISTS gender text;