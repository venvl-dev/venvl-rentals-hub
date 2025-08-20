
import { useState } from 'react';
import AuthCard from '@/components/auth/AuthCard';

const Auth = () => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
  };

  return <AuthCard mode={mode} onToggleMode={toggleMode} />;
};

export default Auth;
