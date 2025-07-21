import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SmtpSettings {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_secure: boolean;
  smtp_pass?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Authenticate user
  const authHeader = req.headers.get('Authorization');
  const jwt = authHeader?.replace('Bearer ', '');
  const { data: authData } = await supabase.auth.getUser(jwt);
  if (!authData?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .single();

  if (profile?.role !== 'super_admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (req.method === 'GET') {
    const { data } = await supabase
      .from('platform_settings')
      .select('key, value')
      .in('key', ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_secure']);

    const settings: Record<string, any> = {};
    data?.forEach((row: { key: string; value: any }) => {
      settings[row.key] = row.value;
    });

    return new Response(JSON.stringify(settings), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (req.method === 'POST') {
    const payload = (await req.json()) as SmtpSettings;
    const entries = [
      { key: 'smtp_host', value: payload.smtp_host },
      { key: 'smtp_port', value: String(payload.smtp_port) },
      { key: 'smtp_user', value: payload.smtp_user },
      { key: 'smtp_secure', value: payload.smtp_secure ? 'true' : 'false' },
    ];
    if (payload.smtp_pass) {
      entries.push({ key: 'smtp_pass', value: payload.smtp_pass });
    }

    const { error } = await supabase
      .from('platform_settings')
      .upsert(entries, { onConflict: 'key' });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await supabase.rpc('log_admin_action', {
      p_action: 'update_smtp_settings',
      p_resource_type: 'platform_settings',
      p_metadata: { keys: entries.map((e) => e.key) },
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
