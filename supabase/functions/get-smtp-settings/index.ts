import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data, error } = await supabase
      .from('platform_settings')
      .select('key, value')
      .in('key', ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass']);

    if (error) throw error;

    const settings: Record<string, any> = {};
    for (const row of data ?? []) {
      if (row.key === 'smtp_pass') {
        const { data: decrypted, error: decErr } = await supabase.rpc('decrypt_sensitive_data', { encrypted_data: row.value as string });
        if (decErr) throw decErr;
        settings[row.key] = decrypted;
      } else {
        settings[row.key] = row.value;
      }
    }

    return new Response(JSON.stringify(settings), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('get-smtp-settings error', err);
    return new Response(JSON.stringify({ error: 'Failed to retrieve settings' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
