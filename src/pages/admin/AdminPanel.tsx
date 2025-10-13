import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Home,
  Calendar,
  DollarSign,
  Shield,
  Settings,
  FileCheck,
  Building2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdminStats {
  totalUsers: number;
  totalProperties: number;
  totalBookings: number;
  totalRevenue: number;
}

interface User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  created_at: string;
}

interface Property {
  id: string;
  title: string;
  city: string;
  state: string | null;
  approval_status: string;
  price_per_night: number;
  created_at: string;
}

interface BookingData {
  id: string;
  check_in: string;
  check_out: string;
  status: string;
  total_price: number;
  created_at: string;
  property?: {
    title: string;
  };
}

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

const AdminPanel = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalProperties: 0,
    totalBookings: 0,
    totalRevenue: 0,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [businessVerifications, setBusinessVerifications] = useState<BusinessVerification[]>([]);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate('/auth');
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      let role = profileData?.role || null;

      if (profileError || !role) {
        console.warn(
          'Profile fetch failed for user',
          session.user.id,
          '- falling back to user metadata',
        );
        role = (session.user.user_metadata as any)?.role || null;
      }

      setUserRole(role);

      // Updated to only allow super_admin
      if (role !== 'super_admin') {
        toast({
          title: 'Access Denied',
          description: "You don't have permission to access this page.",
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      await loadAdminData();
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    try {
      // Load stats with secure queries
      const [usersCount, propertiesCount, bookingsData] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('properties').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('total_price'),
      ]);

      const totalRevenue =
        bookingsData.data?.reduce(
          (sum, booking) => sum + Number(booking.total_price),
          0,
        ) || 0;

      setStats({
        totalUsers: usersCount.count || 0,
        totalProperties: propertiesCount.count || 0,
        totalBookings: bookingsData.data?.length || 0,
        totalRevenue,
      });

      // Load detailed data
      const [usersData, propertiesData, bookingsDetailData, businessVerificationData] = await Promise.all(
        [
          supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('properties')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('bookings')
            .select(
              `
          *,
          property:properties(title)
        `,
            )
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('profiles')
            .select('*')
            .neq('business_verification_status', 'not_submitted')
            .order('updated_at', { ascending: false }),
        ],
      );

      if (usersData.data) setUsers(usersData.data);
      if (propertiesData.data) setProperties(propertiesData.data);
      if (bookingsDetailData.data) setBookings(bookingsDetailData.data);
      if (businessVerificationData.data) setBusinessVerifications(businessVerificationData.data);
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to load admin data',
        variant: 'destructive',
      });
    }
  };

  const updatePropertyStatus = async (propertyId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ approval_status: status })
        .eq('id', propertyId);

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: `Property ${status} successfully`,
      });

      loadAdminData();
    } catch (error) {
      console.error('Error updating property status:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to update property status',
        variant: 'destructive',
      });
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

      toast({
        title: t('common.success'),
        description: `Business verification ${status} successfully`,
      });

      loadAdminData();
    } catch (error) {
      console.error('Error updating business verification status:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to update business verification status',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-lg'>{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <Header />

      <div className='container mx-auto px-4 py-8'>
        <div className='flex items-center justify-between mb-8'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>
              {t('admin.title')}
            </h1>
            <p className='text-gray-600 mt-2'>Manage your rental platform</p>
          </div>
          <Badge variant='secondary' className='flex items-center space-x-1'>
            <Shield className='h-4 w-4' />
            <span className='capitalize'>{userRole}</span>
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                {t('admin.totalUsers')}
              </CardTitle>
              <Users className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                {t('admin.totalProperties')}
              </CardTitle>
              <Home className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats.totalProperties}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                {t('admin.totalBookings')}
              </CardTitle>
              <Calendar className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats.totalBookings}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                {t('admin.revenue')}
              </CardTitle>
              <DollarSign className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                ${stats.totalRevenue.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue='users' className='space-y-4'>
          <TabsList>
            <TabsTrigger value='users'>{t('admin.users')}</TabsTrigger>
            <TabsTrigger value='properties'>
              {t('admin.properties')}
            </TabsTrigger>
            <TabsTrigger value='bookings'>{t('admin.bookings')}</TabsTrigger>
            <TabsTrigger value='business-verification'>
              <Building2 className='h-4 w-4 mr-2' />
              Business Verification
            </TabsTrigger>
          </TabsList>

          <TabsContent value='users'>
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.userManagement')}</CardTitle>
                <CardDescription>
                  Manage platform users and their roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>{t('admin.role')}</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>{t('admin.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          {user.first_name || user.last_name
                            ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                            : 'No name'}
                        </TableCell>
                        <TableCell>
                          <Badge variant='outline' className='capitalize'>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button variant='outline' size='sm'>
                            {t('admin.viewDetails')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='properties'>
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.propertyManagement')}</CardTitle>
                <CardDescription>
                  Review and manage property listings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Price/Night</TableHead>
                      <TableHead>{t('admin.status')}</TableHead>
                      <TableHead>{t('admin.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {properties.map((property) => (
                      <TableRow key={property.id}>
                        <TableCell className='font-medium'>
                          {property.title}
                        </TableCell>
                        <TableCell>
                          {property.city}, {property.state}
                        </TableCell>
                        <TableCell>${property.price_per_night}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              property.approval_status === 'approved'
                                ? 'default'
                                : property.approval_status === 'rejected'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                          >
                            {property.approval_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className='flex space-x-2'>
                            {property.approval_status === 'pending' && (
                              <>
                                <Button
                                  size='sm'
                                  onClick={() =>
                                    updatePropertyStatus(
                                      property.id,
                                      'approved',
                                    )
                                  }
                                >
                                  {t('admin.approve')}
                                </Button>
                                <Button
                                  variant='outline'
                                  size='sm'
                                  onClick={() =>
                                    updatePropertyStatus(
                                      property.id,
                                      'rejected',
                                    )
                                  }
                                >
                                  {t('admin.reject')}
                                </Button>
                              </>
                            )}
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => {
                                // TODO: Implement property details view
                                toast({
                                  title: 'Property Details',
                                  description: `Viewing details for ${property.title}`,
                                });
                              }}
                            >
                              {t('admin.viewDetails')}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='bookings'>
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.bookingManagement')}</CardTitle>
                <CardDescription>
                  Monitor and manage all bookings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Check-out</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>{t('admin.status')}</TableHead>
                      <TableHead>{t('admin.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className='font-medium'>
                          {booking.property?.title || 'Unknown Property'}
                        </TableCell>
                        <TableCell>
                          {new Date(booking.check_in).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(booking.check_out).toLocaleDateString()}
                        </TableCell>
                        <TableCell>${booking.total_price}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              booking.status === 'confirmed'
                                ? 'default'
                                : booking.status === 'cancelled'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                          >
                            {booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant='outline' size='sm'>
                            {t('admin.viewDetails')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='business-verification'>
            <Card>
              <CardHeader>
                <CardTitle>Business Verification Management</CardTitle>
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
                    No business verification requests found
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
