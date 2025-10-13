import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AuthCard from '@/components/auth/AuthCard';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  useEffect(() => {
    // Check URL parameter for initial mode
    const modeParam = searchParams.get('mode');
    if (modeParam === 'signup') {
      setMode('signup');
    } else {
      setMode('signin');
    }
  }, [searchParams]);

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
  };

  return <AuthCard mode={mode} onToggleMode={toggleMode} />;
};

export default Auth;
