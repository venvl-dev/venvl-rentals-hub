
import { useState } from 'react';
import AuthCard from '@/components/auth/AuthCard';

const SuperAdminLogin = () => {
  const [mode] = useState<'signin'>('signin');

  // Super admin login only - no toggle functionality
  const toggleMode = () => {
    // No-op for super admin - login only
  };

  return <AuthCard mode={mode} onToggleMode={toggleMode} role="super_admin" />;
};

export default SuperAdminLogin;
