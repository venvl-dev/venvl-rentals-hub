-- Allow super admins to update property approval status
CREATE POLICY "Super admins can update property approval status" 
ON public.properties 
FOR UPDATE 
USING (get_current_user_role() = 'super_admin');