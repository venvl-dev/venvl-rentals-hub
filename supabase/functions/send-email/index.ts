import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import nodemailer from 'npm:nodemailer@6.9.6';
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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let host = Deno.env.get("SMTP_HOST") || "";
    let port = Number(Deno.env.get("SMTP_PORT") || 0);
    let user = Deno.env.get("SMTP_USER") || "";
    let pass = Deno.env.get("SMTP_PASS") || "";
    let secure = (Deno.env.get("SMTP_SECURE") || 'true') === 'true';

    if (!host || !user) {
      const { data } = await supabase
        .from('platform_settings')
        .select('key, value')
        .in('key', ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_secure']);

      data?.forEach((row: { key: string; value: any }) => {
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
          case 'smtp_pass':
            pass = row.value as string;
            break;
          case 'smtp_secure':
            secure = String(row.value) === 'true';
            break;
        }
      });
    }

    if (!host || !user || !pass) {
      return new Response(
        JSON.stringify({ error: 'SMTP configuration is incomplete' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!port) port = 465;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: user,
      to,
      subject,
      text,
      html,
    });

    await supabase.rpc('log_admin_action', {
      p_action: 'send_email',
      p_resource_type: 'email',
      p_metadata: { to, subject },
    });

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
