import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout';
import { Building2, FileCheck } from 'lucide-react';

interface BusinessVerification {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  company_name: string | null;
  commercial_register: string | null;
  tax_card: string | null;
  business_verification_status: string;
  commercial_register_document: string | null;
  tax_card_document: string | null;
  created_at: string;
  updated_at: string;
}

const BusinessVerificationPage = () => {
  const [loading, setLoading] = useState(true);
  const [businessVerifications, setBusinessVerifications] = useState<BusinessVerification[]>([]);

  useEffect(() => {
    loadBusinessVerifications();
  }, []);

  const loadBusinessVerifications = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('business_verification_status', 'not_submitted')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setBusinessVerifications(data || []);
    } catch (error) {
      console.error('Error loading business verifications:', error);
      toast.error('Failed to load business verifications');
    } finally {
      setLoading(false);
    }
  };

  const updateBusinessVerificationStatus = async (userId: string, status: 'verified' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          business_verification_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      toast.success(`Business verification ${status} successfully`);
      loadBusinessVerifications();
    } catch (error) {
      console.error('Error updating business verification status:', error);
      toast.error('Failed to update business verification status');
    }
  };

  if (loading) {
    return (
      <AdminLayout title='Business Verification'>
        <div className='flex items-center justify-center p-8'>
          <div className='text-lg'>Loading business verifications...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title='Business Verification Management'>
      <div className='p-6 space-y-6'>
        <div>
          <p className='text-muted-foreground'>
            Review and manage host business verification requests
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Business Verification Requests</span>
            </CardTitle>
            <CardDescription>
              Review and approve host business verification documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Host Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Commercial Register</TableHead>
                  <TableHead>Tax Card</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {businessVerifications.map((verification) => (
                  <TableRow key={verification.id}>
                    <TableCell className='font-medium'>
                      <div>
                        <div>
                          {verification.first_name || verification.last_name
                            ? `${verification.first_name || ''} ${verification.last_name || ''}`.trim()
                            : 'No name'}
                        </div>
                        <div className="text-sm text-gray-500">{verification.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {verification.company_name || 'Not provided'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {verification.commercial_register || 'Not provided'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {verification.tax_card || 'Not provided'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {verification.commercial_register_document && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (verification.commercial_register_document!.startsWith('data:')) {
                                // Handle base64 data
                                const link = document.createElement('a');
                                link.href = verification.commercial_register_document!;
                                link.download = `commercial_register_${verification.first_name}_${verification.last_name}.pdf`;
                                link.click();
                              } else {
                                // Handle URL
                                window.open(verification.commercial_register_document!, '_blank');
                              }
                            }}
                            className="text-xs h-7"
                          >
                            <FileCheck className="h-3 w-3 mr-1" />
                            Commercial PDF
                          </Button>
                        )}
                        {verification.tax_card_document && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (verification.tax_card_document!.startsWith('data:')) {
                                // Handle base64 data
                                const link = document.createElement('a');
                                link.href = verification.tax_card_document!;
                                link.download = `tax_card_${verification.first_name}_${verification.last_name}.pdf`;
                                link.click();
                              } else {
                                // Handle URL
                                window.open(verification.tax_card_document!, '_blank');
                              }
                            }}
                            className="text-xs h-7"
                          >
                            <FileCheck className="h-3 w-3 mr-1" />
                            Tax Card PDF
                          </Button>
                        )}
                        {!verification.commercial_register_document && !verification.tax_card_document && (
                          <span className="text-xs text-gray-500">No documents</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          verification.business_verification_status === 'verified'
                            ? 'default'
                            : verification.business_verification_status === 'rejected'
                              ? 'destructive'
                              : verification.business_verification_status === 'pending'
                                ? 'secondary'
                                : 'outline'
                        }
                        className={
                          verification.business_verification_status === 'verified'
                            ? 'bg-green-500 hover:bg-green-600'
                            : verification.business_verification_status === 'pending'
                              ? 'bg-yellow-500 hover:bg-yellow-600'
                              : ''
                        }
                      >
                        {verification.business_verification_status === 'verified' && '✓ Verified'}
                        {verification.business_verification_status === 'pending' && '⏳ Pending'}
                        {verification.business_verification_status === 'rejected' && '✗ Rejected'}
                        {verification.business_verification_status === 'not_submitted' && '📋 Not Submitted'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className='flex flex-col gap-2'>
                        {verification.business_verification_status === 'pending' && (
                          verification.commercial_register_document || verification.tax_card_document
                        ) && (
                          <>
                            <Button
                              size='sm'
                              onClick={() =>
                                updateBusinessVerificationStatus(
                                  verification.id,
                                  'verified'
                                )
                              }
                              className="bg-green-600 hover:bg-green-700 text-white h-7"
                            >
                              ✓ Approve
                            </Button>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() =>
                                updateBusinessVerificationStatus(
                                  verification.id,
                                  'rejected'
                                )
                              }
                              className="text-red-600 hover:text-red-700 h-7"
                            >
                              ✗ Reject
                            </Button>
                          </>
                        )}
                        {verification.business_verification_status === 'verified' && (
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() =>
                              updateBusinessVerificationStatus(
                                verification.id,
                                'rejected'
                              )
                            }
                            className="text-red-600 hover:text-red-700 h-7"
                          >
                            Revoke
                          </Button>
                        )}
                        {verification.business_verification_status === 'rejected' && (
                          <Button
                            size='sm'
                            onClick={() =>
                              updateBusinessVerificationStatus(
                                verification.id,
                                'verified'
                              )
                            }
                            className="bg-green-600 hover:bg-green-700 text-white h-7"
                          >
                            Re-approve
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {businessVerifications.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No business verification requests found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default BusinessVerificationPage;