-- Allow super_admin to manage onboarding + linking (without relying on client-side hacks)

-- parents
DROP POLICY IF EXISTS "Admins delete parent profiles" ON public.parents;
DROP POLICY IF EXISTS "Parents insert own profile" ON public.parents;
DROP POLICY IF EXISTS "Parents select own profile" ON public.parents;
DROP POLICY IF EXISTS "Parents update own profile" ON public.parents;

CREATE POLICY "Admins delete parent profiles" 
ON public.parents
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "Parents insert own profile" 
ON public.parents
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (
  (user_id = auth.uid()) 
  OR public.has_role(auth.uid(), 'admin'::public.app_role) 
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

CREATE POLICY "Parents select own profile" 
ON public.parents
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
  (user_id = auth.uid()) 
  OR public.has_role(auth.uid(), 'admin'::public.app_role) 
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

CREATE POLICY "Parents update own profile" 
ON public.parents
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (
  (user_id = auth.uid()) 
  OR public.has_role(auth.uid(), 'admin'::public.app_role) 
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
)
WITH CHECK (
  (user_id = auth.uid()) 
  OR public.has_role(auth.uid(), 'admin'::public.app_role) 
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

-- schools
DROP POLICY IF EXISTS "School owners manage their school" ON public.schools;
DROP POLICY IF EXISTS "School owners read their school" ON public.schools;

CREATE POLICY "School owners manage their school" 
ON public.schools
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (
  (user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
)
WITH CHECK (
  (user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

CREATE POLICY "School owners read their school" 
ON public.schools
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
  (user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

-- students
DROP POLICY IF EXISTS "Parents create independent students" ON public.students;
DROP POLICY IF EXISTS "Schools manage their students" ON public.students;
DROP POLICY IF EXISTS "Students read access" ON public.students;

CREATE POLICY "Parents create independent students" 
ON public.students
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (
  (
    school_id IS NULL
    AND EXISTS (SELECT 1 FROM public.parents p WHERE p.user_id = auth.uid())
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

CREATE POLICY "Schools manage their students" 
ON public.students
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (
  (
    EXISTS (
      SELECT 1
      FROM public.schools s
      WHERE s.id = students.school_id
        AND s.user_id = auth.uid()
    )
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
)
WITH CHECK (
  (
    EXISTS (
      SELECT 1
      FROM public.schools s
      WHERE s.id = students.school_id
        AND s.user_id = auth.uid()
    )
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

CREATE POLICY "Students read access" 
ON public.students
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
  (user_id = auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.parent_students ps
    JOIN public.parents p ON ps.parent_id = p.id
    WHERE ps.student_id = students.id
      AND p.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.schools s
    WHERE s.id = students.school_id
      AND s.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

-- parent_students
DROP POLICY IF EXISTS "Admins manage parent-student links" ON public.parent_students;

CREATE POLICY "Admins manage parent-student links" 
ON public.parent_students
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);
