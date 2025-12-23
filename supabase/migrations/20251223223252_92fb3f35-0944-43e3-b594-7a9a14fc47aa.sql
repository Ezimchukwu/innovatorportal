-- Allow authenticated users to assign themselves a non-admin role
CREATE POLICY "Users insert their own non-admin role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND role <> 'admin'::app_role
);

-- (Optional) Allow users to change their non-admin role; admins can still manage via service role
CREATE POLICY "Users update their own non-admin role"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  AND role <> 'admin'::app_role
)
WITH CHECK (
  user_id = auth.uid()
  AND role <> 'admin'::app_role
);