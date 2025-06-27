
import { useState } from 'react';
import AuthCard from '@/components/auth/AuthCard';

const AdminLogin = () => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
  };

  return <AuthCard mode={mode} onToggleMode={toggleMode} role="admin" />;
};

export default AdminLogin;
