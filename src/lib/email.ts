import { supabase } from '@/integrations/supabase/client';

export interface EmailPayload {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export const sendEmail = async (payload: EmailPayload): Promise<void> => {
  const { error } = await supabase.functions.invoke('send-email', { body: payload });
  if (error) throw error;
};

