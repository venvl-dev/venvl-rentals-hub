-- Add smtp_secure setting
INSERT INTO public.platform_settings (key, value, category, description)
VALUES ('smtp_secure', 'true', 'email', 'Use TLS for SMTP connections')
ON CONFLICT (key) DO NOTHING;
