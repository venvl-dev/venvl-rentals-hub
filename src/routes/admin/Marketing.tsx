import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Tag,
  Plus,
  Trash2,
  Copy,
  Calendar,
  Percent,
  Users,
  Clock,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface PromoCode {
  id: string;
  code: string;
  value: number;
  expiry_type: 'relative' | 'fixed';
  relative_expiry_months?: number;
  expiry_date?: string;
  allow_multi_account: boolean;
  created_at: string;
  is_active: boolean;
}

const Marketing = () => {
  const [loading, setLoading] = useState(true);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    value: 1,
    expiry_type: 'relative' as 'relative' | 'fixed',
    relative_expiry_months: 24,
    expiry_date: '',
    allow_multi_account: false,
    isBulk: false,
    bulkCount: 1,
  });

  useEffect(() => {
    loadPromoCodes();
  }, []);

  const loadPromoCodes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromoCodes(data || []);
    } catch (error) {
      console.error('Error loading promo codes:', error);
      toast.error('Failed to load promo codes');
    } finally {
      setLoading(false);
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.code.trim()) {
      toast.error('Promo code is required');
      return;
    }

    if (formData.value <= 0 || formData.value > 100) {
      toast.error('Value must be between 1 and 100');
      return;
    }

    if (
      formData.expiry_type === 'relative' &&
      (!formData.relative_expiry_months || formData.relative_expiry_months <= 0)
    ) {
      toast.error('Relative expiry months must be greater than 0');
      return;
    }

    if (formData.expiry_type === 'fixed' && !formData.expiry_date) {
      toast.error('Expiry date is required for fixed expiry');
      return;
    }

    if (formData.isBulk && formData.bulkCount <= 0) {
      toast.error('Bulk count must be greater than 0');
      return;
    }

    try {
      const baseInsertData: any = {
        value: formData.value,
        allow_multi_account: formData.allow_multi_account,
      };

      if (formData.expiry_type === 'relative') {
        baseInsertData.relative_expiry_months = formData.relative_expiry_months;
      } else {
        baseInsertData.expiry_date = formData.expiry_date;
      }

      let insertRecords = [];

      if (formData.isBulk) {
        // Generate multiple codes with pattern
        const baseCode = formData.code.toUpperCase();
        const numDigits = formData.bulkCount.toString().length;

        for (let i = 1; i <= formData.bulkCount; i++) {
          const paddedNumber = i.toString().padStart(numDigits, '0');
          insertRecords.push({
            ...baseInsertData,
            code: `${baseCode}${paddedNumber}`,
          });
        }
      } else {
        // Single code
        insertRecords.push({
          ...baseInsertData,
          code: formData.code.toUpperCase(),
        });
      }

      const { error } = await supabase
        .from('promo_codes')
        .insert(insertRecords);

      if (error) throw error;

      toast.success(
        formData.isBulk
          ? `${formData.bulkCount} promo codes created successfully`
          : 'Promo code created successfully',
      );
      setShowForm(false);
      setFormData({
        code: '',
        value: 1,
        expiry_type: 'relative',
        relative_expiry_months: 24,
        expiry_date: '',
        allow_multi_account: false,
        isBulk: false,
        bulkCount: 1,
      });
      loadPromoCodes();
    } catch (error: any) {
      console.error('Error creating promo code:', error);
      if (error.code === '23505') {
        toast.error('One or more promo codes already exist');
      } else {
        toast.error('Failed to create promo code');
      }
    }
  };

  const deletePromoCode = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promo code?')) return;

    try {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Promo code deleted successfully');
      loadPromoCodes();
    } catch (error) {
      console.error('Error deleting promo code:', error);
      toast.error('Failed to delete promo code');
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Promo code copied to clipboard');
  };

  const togglePromoCodeStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success(
        `Promo code ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      );
      loadPromoCodes();
    } catch (error) {
      console.error('Error updating promo code status:', error);
      toast.error('Failed to update promo code status');
    }
  };

  const getExpiryDisplay = (promoCode: PromoCode) => {
    if (promoCode.expiry_type === 'relative') {
      return `${promoCode.relative_expiry_months} month${promoCode.relative_expiry_months! > 1 ? 's' : ''} from use`;
    } else {
      return new Date(promoCode.expiry_date!).toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <AdminLayout title='Marketing'>
        <div className='flex items-center justify-center p-8'>
          <div className='text-lg'>Loading marketing data...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title='Marketing'>
      <div className='p-6 space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-muted-foreground'>
              Manage promotional codes and marketing campaigns
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className='h-4 w-4 mr-2' />
            {showForm ? 'Cancel' : 'Create Promo Code'}
          </Button>
        </div>

        {/* Create Promo Code Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <Tag className='h-5 w-5' />
                <span>Create Promo Code</span>
              </CardTitle>
              <CardDescription>
                Generate a new promotional code for customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className='space-y-4'>
                {/* Bulk Generation Toggle */}
                <div className='flex items-center justify-between p-4 border rounded-lg bg-muted/50'>
                  <div>
                    <Label htmlFor='isBulk'>Bulk Code Generation</Label>
                    <p className='text-sm text-muted-foreground'>
                      Generate multiple codes with a sequential pattern
                    </p>
                  </div>
                  <Switch
                    id='isBulk'
                    checked={formData.isBulk}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isBulk: checked })
                    }
                  />
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {/* Code */}
                  <div>
                    <Label htmlFor='code'>
                      {formData.isBulk ? 'Code Blueprint' : 'Promo Code'}
                    </Label>
                    <div className='flex gap-2'>
                      <Input
                        id='code'
                        value={formData.code}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            code: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder={formData.isBulk ? 'code' : 'SUMMER2025'}
                        required
                      />
                      {!formData.isBulk && (
                        <Button
                          type='button'
                          variant='outline'
                          onClick={generateRandomCode}
                        >
                          Generate
                        </Button>
                      )}
                    </div>
                    {formData.isBulk && (
                      <p className='text-xs text-muted-foreground mt-1'>
                        Example: "code" with count 1000 → code0001 to code1000
                      </p>
                    )}
                  </div>

                  {/* Bulk Count */}
                  {formData.isBulk && (
                    <div>
                      <Label htmlFor='bulkCount'>Count</Label>
                      <Input
                        id='bulkCount'
                        type='number'
                        min='1'
                        max='10000'
                        value={
                          formData.bulkCount == 0 ? '' : formData.bulkCount
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bulkCount: parseInt(e.target.value) || 1,
                          })
                        }
                        onKeyDown={(e) => {
                          if (
                            e.key === 'Backspace' &&
                            formData.bulkCount < 10
                          ) {
                            e.preventDefault();
                            setFormData({ ...formData, bulkCount: 0 });
                          }
                        }}
                        placeholder='1000'
                        required
                      />
                    </div>
                  )}

                  {/* Value */}
                  {!formData.isBulk && (
                    <div>
                      <Label htmlFor='value'>Discount Value (%)</Label>
                      <div className='relative'>
                        <Input
                          id='value'
                          type='text'
                          min='0'
                          max='100'
                          value={formData.value === 0 ? '' : formData.value}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setFormData({
                              ...formData,
                              value: isNaN(val) ? 0 : val > 100 ? 100 : val,
                            });
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace' && formData.value < 10) {
                              e.preventDefault();
                              setFormData({ ...formData, value: 0 });
                            }
                          }}
                          placeholder='10'
                          required
                        />
                        <Percent className='h-4 w-4 absolute right-3 top-3 text-muted-foreground' />
                      </div>
                    </div>
                  )}
                </div>

                {/* Value for bulk */}
                {formData.isBulk && (
                  <div>
                    <Label htmlFor='value'>Discount Value (%)</Label>
                    <div className='relative'>
                      <Input
                        id='value'
                        type='text'
                        min='0'
                        max='100'
                        value={formData.value === 0 ? '' : formData.value}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);

                          setFormData({
                            ...formData,
                            value: isNaN(val) ? 1 : val > 100 ? 100 : val,
                          });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && formData.value < 10) {
                            e.preventDefault();
                            setFormData({ ...formData, value: 0 });
                          }
                        }}
                        placeholder='10'
                        required
                      />
                      <Percent className='h-4 w-4 absolute right-3 top-3 text-muted-foreground' />
                    </div>
                  </div>
                )}

                {/* Expiry Type */}
                <div>
                  <Label>Expiry Type</Label>
                  <RadioGroup
                    value={formData.expiry_type}
                    onValueChange={(value: 'relative' | 'fixed') =>
                      setFormData({ ...formData, expiry_type: value })
                    }
                    className='flex gap-4 mt-2'
                  >
                    <div className='flex items-center space-x-2'>
                      <RadioGroupItem value='relative' id='relative' />
                      <Label htmlFor='relative' className='font-normal'>
                        Relative (from use)
                      </Label>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <RadioGroupItem value='fixed' id='fixed' />
                      <Label htmlFor='fixed' className='font-normal'>
                        Fixed Date
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Conditional Expiry Fields */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {formData.expiry_type === 'relative' ? (
                    <div>
                      <Label htmlFor='relative_expiry_months'>
                        Expiry (Months from use)
                      </Label>
                      <Input
                        id='relative_expiry_months'
                        type='number'
                        min='1'
                        value={formData.relative_expiry_months}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setFormData({
                            ...formData,
                            relative_expiry_months:
                              isNaN(val) || val < 1 ? 1 : val,
                          });
                        }}
                        onKeyDown={(e) => {
                          if (
                            e.key === 'Backspace' &&
                            formData.relative_expiry_months < 10
                          ) {
                            e.preventDefault();
                            setFormData({
                              ...formData,
                              relative_expiry_months: 1,
                            });
                          }
                        }}
                        required={formData.expiry_type === 'relative'}
                      />
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor='expiry_date'>Expiry Date</Label>
                      <Input
                        id='expiry_date'
                        type='date'
                        value={formData.expiry_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            expiry_date: e.target.value,
                          })
                        }
                        min={new Date().toISOString().split('T')[0]}
                        required={formData.expiry_type === 'fixed'}
                      />
                    </div>
                  )}
                </div>

                {/* Multi-Account */}
                <div className='flex items-center justify-between p-4 border rounded-lg'>
                  <div>
                    <Label htmlFor='allow_multi_account'>
                      Allow Multiple Accounts
                    </Label>
                    <p className='text-sm text-muted-foreground'>
                      Allow multiple users to use the same code
                    </p>
                  </div>
                  <Switch
                    id='allow_multi_account'
                    checked={formData.allow_multi_account}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, allow_multi_account: checked })
                    }
                  />
                </div>

                <Button type='submit' className='w-full'>
                  Create Promo Code
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Promo Codes List */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2'>
              <Tag className='h-5 w-5' />
              <span>Promo Codes</span>
            </CardTitle>
            <CardDescription>
              Existing promotional codes ({promoCodes.length})
            </CardDescription>
          </CardHeader>
          <CardContent>
            {promoCodes.length === 0 ? (
              <div className='text-center py-8 text-muted-foreground'>
                No promo codes created yet. Create your first one!
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Expiry</TableHead>
                      <TableHead>Multi-Account</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {promoCodes.map((promo) => (
                      <TableRow key={promo.id}>
                        <TableCell className='font-mono font-semibold'>
                          {promo.code}
                        </TableCell>
                        <TableCell>
                          <Badge variant='secondary'>
                            <Percent className='h-3 w-3 mr-1' />
                            {promo.value}%
                          </Badge>
                        </TableCell>
                        <TableCell className='text-sm'>
                          <div className='flex items-center gap-1'>
                            {promo.expiry_type === 'relative' ? (
                              <Clock className='h-3 w-3' />
                            ) : (
                              <Calendar className='h-3 w-3' />
                            )}
                            {getExpiryDisplay(promo)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {promo.allow_multi_account ? (
                            <Badge variant='outline'>
                              <Users className='h-3 w-3 mr-1' />
                              Yes
                            </Badge>
                          ) : (
                            <Badge variant='outline'>Single</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={promo.is_active ? 'default' : 'secondary'}
                          >
                            {promo.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-sm'>
                          {new Date(promo.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Marketing;
