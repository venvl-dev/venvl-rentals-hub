
import { useState } from 'react';
import AuthCard from '@/components/auth/AuthCard';

const GuestSignup = () => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
  };

  return <AuthCard mode={mode} onToggleMode={toggleMode} role="guest" />;
};

export default GuestSignup;
