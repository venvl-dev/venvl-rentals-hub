
import { useState } from 'react';
import AuthCard from '@/components/auth/AuthCard';

const HostSignup = () => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
  };

  return <AuthCard mode={mode} onToggleMode={toggleMode} role="host" />;
};

export default HostSignup;
