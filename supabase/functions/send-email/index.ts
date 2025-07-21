import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailPayload {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, text, html } = (await req.json()) as EmailPayload;

    if (!to || !subject) {
      return new Response(
        JSON.stringify({ error: "Missing to or subject" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let host = Deno.env.get("SMTP_HOST") || "";
    let port = Number(Deno.env.get("SMTP_PORT") || 0);
    let user = Deno.env.get("SMTP_USER") || "";
    let pass = Deno.env.get("SMTP_PASS") || "";

    if (!host || !user) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const { data } = await supabase
        .from('platform_settings')
        .select('key, value')
        .in('key', ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass']);

      for (const row of data ?? []) {
        switch (row.key) {
          case 'smtp_host':
            host = row.value as string;
            break;
          case 'smtp_port':
            port = Number(row.value);
            break;
          case 'smtp_user':
            user = row.value as string;
            break;
          case 'smtp_pass': {
            const { data: decrypted } = await supabase.rpc('decrypt_sensitive_data', { encrypted_data: row.value as string });
            pass = decrypted as string;
            break;
          }
        }
      }
    }

    if (!host || !user || !pass) {
      return new Response(
        JSON.stringify({ error: 'SMTP configuration is incomplete' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!port) port = 465;

    const client = new SmtpClient();
    await client.connectTLS({
      hostname: host,
      port,
      username: user,
      password: pass,
    });

    await client.send({
      from: user,
      to,
      subject,
      content: text ?? "",
      html,
    });

    await client.close();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-email error", err);
    return new Response(JSON.stringify({ error: "Failed to send email" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
