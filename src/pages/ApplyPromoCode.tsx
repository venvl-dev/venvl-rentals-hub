import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  CheckCircle,
  XCircle,
  Loader2,
  Code,
  Calendar,
  Percent,
  Ticket,
} from 'lucide-react';
import Header from '@/components/Header';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format, addMonths } from 'date-fns';

interface PromoCode {
  id: string;
  code: string;
  value: number;
  expiry_date: string | Date | null;
  relative_expiry_months: number | null;
  created_at: string;
  allow_multi_account: boolean | null;
}

const ApplyPromoCode = () => {
  const { code: promoCode } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const { user, loading: authLoading } = useAuth();
  const [applying, setApplying] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [userPromoCodes, setUserPromoCodes] = useState<PromoCode[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      const currentUrl = window.location.pathname + window.location.search;
      navigate(`/auth?redirect=${encodeURIComponent(currentUrl)}`);
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && promoCode && !result && !applying) {
      applyPromoCode(promoCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, promoCode, result, applying]);

  useEffect(() => {
    if (user) {
      fetchUserPromoCodes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchUserPromoCodes = async () => {
    if (!user) return;

    setLoadingCodes(true);
    try {
      const { data, error } = await supabase.from('profile_promo_codes')
        .select(`
    *,
    promo_codes (*)
  `);
      console.log(data);
      if (error) throw error;

      const promoCodes = data.map((code) => {
        return {
          ...code.promo_codes,
          expiry_date: code.expiry_date,
        };
      });

      setUserPromoCodes(promoCodes);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      toast.error('Failed to load your promo codes');
    } finally {
      setLoadingCodes(false);
    }
  };

  const calculateExpiryDate = (promoCode: PromoCode): Date | null => {
    if (promoCode.expiry_date) {
      return new Date(promoCode.expiry_date);
    }
    if (promoCode.relative_expiry_months) {
      return addMonths(
        new Date(promoCode.created_at),
        promoCode.relative_expiry_months,
      );
    }
    return null;
  };

  const isExpired = (promoCode: PromoCode): boolean => {
    const expiryDate = calculateExpiryDate(promoCode);
    if (!expiryDate) return false;
    return expiryDate < new Date();
  };

  const applyPromoCode = async (code: string) => {
    if (!user || !code) return;

    setApplying(true);
    try {
      const { error } = await supabase.rpc('apply_promo_code', {
        p_promo_code: code,
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error applying promo code:', error.message);
        setResult({
          success: false,
          message: error.message || 'Failed to apply promo code',
        });
      } else {
        console.log('Promo code successfully applied or already applied.');
        setResult({
          success: true,
          message: 'Promo code successfully applied to your account!',
        });
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setResult({
        success: false,
        message: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setApplying(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      const url = returnUrl
        ? `/apply-promo/${manualCode.trim()}?returnUrl=${encodeURIComponent(returnUrl)}`
        : `/apply-promo/${manualCode.trim()}`;
      navigate(url);
    }
  };

  if (authLoading) {
    return (
      <>
        <Header />
        <div className='min-h-[calc(100vh-80px)] flex items-center justify-center bg-gray-50'>
          <div className='text-center'>
            <Loader2 className='w-8 h-8 animate-spin mx-auto mb-4' />
            <p className='text-gray-600'>Loading...</p>
          </div>
        </div>
      </>
    );
  }

  if (!promoCode) {
    return (
      <>
        <Header />
        <div className='min-h-[calc(100vh-80px)] bg-gray-50 p-4 py-8'>
          <div className='max-w-4xl mx-auto space-y-6'>
            <Card className='w-full'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Ticket className='w-6 h-6' />
                  Apply Promo Code
                </CardTitle>
                <CardDescription>
                  Enter your promotional code to unlock exclusive benefits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleManualSubmit} className='flex gap-2'>
                  <Input
                    type='text'
                    placeholder='Enter promo code'
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    className='font-mono text-lg'
                    required
                  />
                  <Button type='submit' disabled={!manualCode.trim()}>
                    Apply
                  </Button>
                </form>
              </CardContent>
            </Card>

            {user && (
              <Card className='w-full'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Code className='w-6 h-6' />
                    Your Promo Codes
                  </CardTitle>
                  <CardDescription>
                    Active promotional codes on your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingCodes ? (
                    <div className='flex items-center justify-center py-8'>
                      <Loader2 className='w-6 h-6 animate-spin text-gray-400' />
                    </div>
                  ) : userPromoCodes.length === 0 ? (
                    <div className='text-center py-8 text-gray-500'>
                      <Ticket className='w-12 h-12 mx-auto mb-3 text-gray-300' />
                      <p>No promo codes found</p>
                    </div>
                  ) : (
                    <div className='max-h-[400px] overflow-y-auto space-y-3 pr-2'>
                      {userPromoCodes.map((code) => {
                        const expiryDate = calculateExpiryDate(code);
                        const expired = isExpired(code);

                        return (
                          <div
                            key={code.id}
                            className={`p-4 rounded-lg border ${
                              expired
                                ? 'bg-gray-50 border-gray-200 opacity-60'
                                : 'bg-white border-gray-200 hover:border-primary/50 transition-colors'
                            }`}
                          >
                            <div className='flex items-start justify-between gap-4'>
                              <div className='flex-1'>
                                <div className='flex items-center gap-2 mb-2'>
                                  <code className='text-lg font-bold font-mono bg-primary/10 px-2 py-1 rounded'>
                                    {code.code}
                                  </code>
                                  {expired && (
                                    <Badge
                                      variant='secondary'
                                      className='text-xs'
                                    >
                                      Expired
                                    </Badge>
                                  )}
                                </div>
                                <div className='space-y-1 text-sm'>
                                  <div className='flex items-center gap-2 text-gray-600'>
                                    <Percent className='w-4 h-4' />
                                    <span className='font-semibold text-green-600'>
                                      {code.value}% discount
                                    </span>
                                  </div>
                                  {expiryDate && (
                                    <div className='flex items-center gap-2 text-gray-600'>
                                      <Calendar className='w-4 h-4' />
                                      <span>
                                        {expired ? 'Expired on' : 'Expires on'}{' '}
                                        {format(expiryDate, 'MMM dd, yyyy')}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className='min-h-[calc(100vh-80px)] bg-gray-50 p-4 py-8'>
        <div className='max-w-2xl mx-auto'>
          <Card className='w-full'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                {applying ? (
                  <>
                    <Loader2 className='w-6 h-6 animate-spin' />
                    Applying Promo Code
                  </>
                ) : (
                  <>
                    <Ticket className='w-6 h-6' />
                    Promo Code Application
                  </>
                )}
              </CardTitle>
              <CardDescription>
                Code:{' '}
                <span className='font-mono font-semibold text-base'>
                  {promoCode}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {applying ? (
                <div className='text-center py-8'>
                  <Loader2 className='w-16 h-16 animate-spin mx-auto mb-4 text-primary' />
                  <p className='text-gray-600 text-lg'>
                    Applying promo code to your account...
                  </p>
                </div>
              ) : result ? (
                <div className='text-center py-8'>
                  {result.success ? (
                    <CheckCircle className='w-20 h-20 text-green-500 mx-auto mb-4' />
                  ) : (
                    <XCircle className='w-20 h-20 text-red-500 mx-auto mb-4' />
                  )}
                  <h3
                    className={`text-xl font-semibold mb-2 ${result.success ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {result.success ? 'Success!' : 'Failed'}
                  </h3>
                  <p className='text-gray-600 mb-6 max-w-md mx-auto'>
                    {result.message}
                  </p>
                  <div className='space-y-2 max-w-sm mx-auto'>
                    {returnUrl && result.success ? (
                      <Button
                        onClick={() => navigate(returnUrl)}
                        className='w-full'
                        size='lg'
                      >
                        Return to Property
                      </Button>
                    ) : (
                      <Button
                        onClick={() => navigate('/')}
                        className='w-full'
                        size='lg'
                      >
                        Return to Home
                      </Button>
                    )}
                    {!result.success && (
                      <>
                        <Button
                          onClick={() => {
                            setResult(null);
                            applyPromoCode(promoCode);
                          }}
                          variant='outline'
                          className='w-full'
                          size='lg'
                        >
                          Try Again
                        </Button>
                        <Button
                          onClick={() =>
                            navigate('/apply-promo', { replace: true })
                          }
                          variant='secondary'
                          className='w-full'
                          size='lg'
                        >
                          Try Another Code
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default ApplyPromoCode;
