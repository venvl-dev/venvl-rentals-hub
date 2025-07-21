-- Add admin_notification_email setting
INSERT INTO public.platform_settings (key, value, category, description)
VALUES ('admin_notification_email', '"admin@venvl.com"', 'notifications', 'Email for admin alerts')
ON CONFLICT (key) DO NOTHING;
