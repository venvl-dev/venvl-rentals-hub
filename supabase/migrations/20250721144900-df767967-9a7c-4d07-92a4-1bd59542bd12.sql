-- Seed initial platform settings if they don't exist
INSERT INTO public.platform_settings (key, value, category, description) 
VALUES 
  ('platform_name', '"VENVL"', 'general', 'The name of the platform'),
  ('contact_email', '"support@venvl.com"', 'general', 'Main contact email for the platform'),
  ('admin_notification_email', '"admin@venvl.com"', 'general', 'Email for admin notifications'),
  ('platform_fee', '0.05', 'commission', 'Platform commission fee (5%)'),
  ('host_fee', '0.03', 'commission', 'Host service fee (3%)'),
  ('max_properties_per_host', '10', 'booking', 'Maximum properties a host can list'),
  ('maintenance_mode', 'false', 'system', 'Whether the platform is in maintenance mode'),
  ('smtp_host', '"mail.venvl.com"', 'email', 'SMTP server hostname'),
  ('smtp_port', '465', 'email', 'SMTP server port'),
  ('smtp_user', '"info@venvl.com"', 'email', 'SMTP username'),
  ('smtp_secure', 'true', 'email', 'Whether to use TLS/SSL for SMTP')
ON CONFLICT (key) DO NOTHING;