-- Tighten RLS policies for parents table
DROP POLICY IF EXISTS "Parents manage their profile" ON public.parents;
DROP POLICY IF EXISTS "Parents read their profile" ON public.parents;

-- Parents can view their own profile; admins can view all
CREATE POLICY "Parents select own profile"
ON public.parents
FOR SELECT
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Parents can insert their own profile; admins can insert for any user
CREATE POLICY "Parents insert own profile"
ON public.parents
FOR INSERT
WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Parents can update their own profile; admins can update any
CREATE POLICY "Parents update own profile"
ON public.parents
FOR UPDATE
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Parents cannot delete their profile; only admins may delete
CREATE POLICY "Admins delete parent profiles"
ON public.parents
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));


-- Refine RLS policies for payments table
DROP POLICY IF EXISTS "Users manage their payments" ON public.payments;
DROP POLICY IF EXISTS "Users read their payments" ON public.payments;

-- Users can view their own payments; admins can view all
CREATE POLICY "Users select own payments"
ON public.payments
FOR SELECT
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Users can insert their own payments records (e.g. after checkout); admins can insert for any user
CREATE POLICY "Users insert own payments"
ON public.payments
FOR INSERT
WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Users can never update payment status; only admins may update (e.g. after verification)
CREATE POLICY "Admins update payments"
ON public.payments
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users cannot delete payments; only admins may delete (if ever needed)
CREATE POLICY "Admins delete payments"
ON public.payments
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));