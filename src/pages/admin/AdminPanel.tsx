
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Home, Calendar, DollarSign, Shield, Settings } from 'lucide-react';
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

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profileError) throw profileError;

      const role = profileData?.role;
      setUserRole(role);

      // Updated to only allow super_admin
      if (role !== 'super_admin') {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page.",
          variant: "destructive",
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

      const totalRevenue = bookingsData.data?.reduce((sum, booking) => sum + Number(booking.total_price), 0) || 0;

      setStats({
        totalUsers: usersCount.count || 0,
        totalProperties: propertiesCount.count || 0,
        totalBookings: bookingsData.data?.length || 0,
        totalRevenue,
      });

      // Load detailed data
      const [usersData, propertiesData, bookingsDetailData] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('properties').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('bookings').select(`
          *,
          property:properties(title)
        `).order('created_at', { ascending: false }).limit(10),
      ]);

      if (usersData.data) setUsers(usersData.data);
      if (propertiesData.data) setProperties(propertiesData.data);
      if (bookingsDetailData.data) setBookings(bookingsDetailData.data);

    } catch (error) {
      console.error('Error loading admin data:', error);
      toast({
        title: t('common.error'),
        description: "Failed to load admin data",
        variant: "destructive",
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
        description: "Failed to update property status",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('admin.title')}</h1>
            <p className="text-gray-600 mt-2">Manage your rental platform</p>
          </div>
          <Badge variant="secondary" className="flex items-center space-x-1">
            <Shield className="h-4 w-4" />
            <span className="capitalize">{userRole}</span>
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('admin.totalUsers')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('admin.totalProperties')}</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProperties}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('admin.totalBookings')}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBookings}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('admin.revenue')}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">{t('admin.users')}</TabsTrigger>
            <TabsTrigger value="properties">{t('admin.properties')}</TabsTrigger>
            <TabsTrigger value="bookings">{t('admin.bookings')}</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.userManagement')}</CardTitle>
                <CardDescription>Manage platform users and their roles</CardDescription>
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
                            : 'No name'
                          }
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
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

          <TabsContent value="properties">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.propertyManagement')}</CardTitle>
                <CardDescription>Review and manage property listings</CardDescription>
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
                        <TableCell className="font-medium">{property.title}</TableCell>
                        <TableCell>{property.city}, {property.state}</TableCell>
                        <TableCell>${property.price_per_night}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={property.approval_status === 'approved' ? 'default' : 
                                   property.approval_status === 'rejected' ? 'destructive' : 'secondary'}
                          >
                            {property.approval_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {property.approval_status === 'pending' && (
                              <>
                                <Button 
                                  size="sm" 
                                  onClick={() => updatePropertyStatus(property.id, 'approved')}
                                >
                                  {t('admin.approve')}
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => updatePropertyStatus(property.id, 'rejected')}
                                >
                                  {t('admin.reject')}
                                </Button>
                              </>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                // TODO: Implement property details view
                                toast({
                                  title: "Property Details",
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

          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.bookingManagement')}</CardTitle>
                <CardDescription>Monitor and manage all bookings</CardDescription>
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
                        <TableCell className="font-medium">
                          {booking.property?.title || 'Unknown Property'}
                        </TableCell>
                        <TableCell>{new Date(booking.check_in).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(booking.check_out).toLocaleDateString()}</TableCell>
                        <TableCell>${booking.total_price}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={booking.status === 'confirmed' ? 'default' : 
                                   booking.status === 'cancelled' ? 'destructive' : 'secondary'}
                          >
                            {booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
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
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
