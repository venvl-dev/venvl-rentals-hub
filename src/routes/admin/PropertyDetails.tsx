import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Edit,
  Star,
  Archive,
  Trash2,
  DollarSign,
  Calendar,
  Users,
  MapPin,
  Bed,
  Bath,
  Eye,
  TrendingUp,
  AlertTriangle,
  Phone,
  Mail,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import EnhancedPropertyForm from '@/components/host/EnhancedPropertyForm';

interface Property {
  id: string;
  title: string;
  description: string | null;
  property_type: string;
  address: string;
  city: string;
  state: string | null;
  country: string;
  price_per_night: number;
  daily_price: number | null;
  monthly_price: number | null;
  max_guests: number;
  bedrooms: number | null;
  bathrooms: number | null;
  amenities: string[] | null;
  booking_types: string[] | null;
  approval_status: string;
  is_active: boolean;
  is_featured: boolean | null;
  created_at: string;
  updated_at: string;
  host_id: string;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
    phone: string | null;
  } | null;
}

interface Booking {
  id: string;
  check_in: string;
  check_out: string;
  status: string;
  total_price: number;
  created_at: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
}

const SuperAdminPropertyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  // Fetch property with host details
  const {
    data: property,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['admin-property-details', id],
    queryFn: async () => {
      if (!id) throw new Error('Property ID is required');

      // First fetch the property
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (propertyError) {
        console.error('Property fetch error:', propertyError);
        throw propertyError;
      }

      // Then fetch host details separately
      let hostData = null;
      if (propertyData.host_id) {
        const { data: host } = await supabase
          .from('profiles')
          .select('first_name, last_name, email, phone')
          .eq('id', propertyData.host_id)
          .single();

        hostData = host;
      }

      return { ...propertyData, profiles: hostData } as Property;
    },
    enabled: !!id,
  });

  // Fetch bookings for this property
  const { data: bookings = [] } = useQuery({
    queryKey: ['admin-property-bookings', id],
    queryFn: async () => {
      if (!id) return [];

      // First try with basic query to avoid foreign key issues
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('property_id', id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Bookings fetch error:', error);
        return [];
      }

      // Then fetch guest details separately for each booking
      const bookingsWithGuests = await Promise.all(
        (data || []).map(async (booking) => {
          if (booking.guest_id) {
            const { data: guestData } = await supabase
              .from('profiles')
              .select('first_name, last_name, email')
              .eq('id', booking.guest_id)
              .single();

            return { ...booking, profiles: guestData };
          }
          return { ...booking, profiles: null };
        }),
      );

      return bookingsWithGuests as Booking[];
    },
    enabled: !!id,
  });

  // Update property status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ status }: { status: 'approved' | 'rejected' }) => {
      if (!id) throw new Error('Property ID is required');

      const { error } = await supabase
        .from('properties')
        .update({ approval_status: status })
        .eq('id', id);

      if (error) throw error;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        p_action: `property_${status}`,
        p_resource_type: 'property',
        p_resource_id: id,
        p_metadata: { status },
      });
    },
    onSuccess: (_, { status }) => {
      toast.success(`Property ${status} successfully`);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to ${status} property`);
      console.error('Status update error:', error);
    },
  });

  // Toggle featured status
  const toggleFeaturedMutation = useMutation({
    mutationFn: async () => {
      if (!id || !property) throw new Error('Property data is required');

      const { error } = await supabase
        .from('properties')
        .update({ is_featured: !property.is_featured })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(
        `Property ${property?.is_featured ? 'unfeatured' : 'featured'} successfully`,
      );
      refetch();
    },
    onError: (error) => {
      toast.error('Failed to update featured status');
      console.error('Featured update error:', error);
    },
  });

  // Toggle active status
  const toggleActiveMutation = useMutation({
    mutationFn: async () => {
      if (!id || !property) throw new Error('Property data is required');

      const { error } = await supabase
        .from('properties')
        .update({ is_active: !property.is_active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(
        `Property ${property?.is_active ? 'archived' : 'activated'} successfully`,
      );
      refetch();
    },
    onError: (error) => {
      toast.error('Failed to update property status');
      console.error('Active status update error:', error);
    },
  });

  // Handle property edit form actions
  const handleEditSave = () => {
    setIsEditing(false);
    refetch(); // Refresh the property data
    toast.success('Property updated successfully');
  };

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  const getStatusBadgeVariant = (status: string, isActive: boolean) => {
    if (!isActive) return 'secondary';
    switch (status) {
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'pending':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getHostName = (property: Property) => {
    const profile = property.profiles;
    if (!profile) return 'Unknown Host';
    const fullName =
      `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    return fullName || profile.email?.split('@')[0] || 'Unknown Host';
  };

  if (isLoading) {
    return (
      <AdminLayout title='Property Details'>
        <div className='flex items-center justify-center p-8'>
          <div className='text-lg'>Loading property details...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!property) {
    return (
      <AdminLayout title='Property Not Found'>
        <div className='p-6'>
          <Card>
            <CardContent className='pt-6'>
              <div className='text-center'>
                <AlertTriangle className='h-16 w-16 mx-auto text-muted-foreground mb-4' />
                <h2 className='text-xl font-semibold mb-2'>
                  Property Not Found
                </h2>
                <p className='text-muted-foreground mb-6'>
                  The property you're looking for doesn't exist or has been
                  removed.
                </p>
                <Button onClick={() => navigate('/admin/properties')}>
                  <ArrowLeft className='h-4 w-4 mr-2' />
                  Back to Properties
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  const totalRevenue = bookings.reduce(
    (sum, booking) => sum + Number(booking.total_price),
    0,
  );
  const completedBookings = bookings.filter(
    (booking) => booking.status === 'completed',
  ).length;

  return (
    <AdminLayout title={`Property: ${property.title}`}>
      <div className='p-6 space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <Button
              variant='outline'
              onClick={() => navigate('/admin/properties')}
            >
              <ArrowLeft className='h-4 w-4 mr-2' />
              Back to Properties
            </Button>
            <div>
              <h1 className='text-2xl font-bold'>{property.title}</h1>
              <p className='text-muted-foreground capitalize'>
                {property.property_type} in {property.city},{' '}
                {property.state || property.country}
              </p>
            </div>
          </div>
          <div className='flex items-center space-x-2'>
            <Badge
              variant={getStatusBadgeVariant(
                property.approval_status,
                property.is_active,
              )}
            >
              {!property.is_active ? 'Archived' : property.approval_status}
            </Badge>
            {property.is_featured && (
              <Badge variant='default' className='bg-yellow-500'>
                <Star className='h-3 w-3 mr-1' />
                Featured
              </Badge>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Super Admin Actions</CardTitle>
            <CardDescription>
              Quick property management controls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex flex-wrap gap-2'>
              {property.approval_status === 'pending' && (
                <>
                  <Button
                    onClick={() =>
                      updateStatusMutation.mutate({ status: 'approved' })
                    }
                    disabled={updateStatusMutation.isPending}
                  >
                    <CheckCircle className='h-4 w-4 mr-2' />
                    Approve Property
                  </Button>
                  <Button
                    variant='destructive'
                    onClick={() =>
                      updateStatusMutation.mutate({ status: 'rejected' })
                    }
                    disabled={updateStatusMutation.isPending}
                  >
                    <XCircle className='h-4 w-4 mr-2' />
                    Reject Property
                  </Button>
                </>
              )}

              <Button
                variant='outline'
                onClick={() => toggleFeaturedMutation.mutate()}
                disabled={toggleFeaturedMutation.isPending}
              >
                <Star className='h-4 w-4 mr-2' />
                {property.is_featured ? 'Remove Featured' : 'Make Featured'}
              </Button>

              <Button
                variant='outline'
                onClick={() => toggleActiveMutation.mutate()}
                disabled={toggleActiveMutation.isPending}
              >
                <Archive className='h-4 w-4 mr-2' />
                {property.is_active ? 'Archive Property' : 'Activate Property'}
              </Button>

              <Button variant='outline' onClick={() => setIsEditing(true)}>
                <Edit className='h-4 w-4 mr-2' />
                Edit Property
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue='details' className='space-y-4'>
          <TabsList>
            <TabsTrigger value='details'>Property Details</TabsTrigger>
            <TabsTrigger value='host'>Host Information</TabsTrigger>
            <TabsTrigger value='bookings'>
              Bookings ({bookings.length})
            </TabsTrigger>
            <TabsTrigger value='analytics'>Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value='details'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div>
                    <label className='text-sm font-medium'>Description</label>
                    <p className='text-sm text-muted-foreground mt-1'>
                      {property.description || 'No description provided'}
                    </p>
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='text-sm font-medium'>
                        Property Type
                      </label>
                      <p className='text-sm text-muted-foreground capitalize'>
                        {property.property_type}
                      </p>
                    </div>
                    <div>
                      <label className='text-sm font-medium'>Max Guests</label>
                      <p className='text-sm text-muted-foreground'>
                        {property.max_guests}
                      </p>
                    </div>
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='text-sm font-medium'>Bedrooms</label>
                      <p className='text-sm text-muted-foreground'>
                        {property.bedrooms || 0}
                      </p>
                    </div>
                    <div>
                      <label className='text-sm font-medium'>Bathrooms</label>
                      <p className='text-sm text-muted-foreground'>
                        {property.bathrooms || 0}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className='text-sm font-medium'>Full Address</label>
                    <p className='text-sm text-muted-foreground'>
                      {property.address}, {property.city}, {property.state}{' '}
                      {property.country}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pricing & Availability</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {(property.booking_types?.includes('daily') ||
                    property.daily_price) && (
                    <div>
                      <label className='text-sm font-medium'>Daily Rate</label>
                      <p className='text-sm text-muted-foreground'>
                        ${property.daily_price || property.price_per_night}
                        /night
                      </p>
                    </div>
                  )}

                  {(property.booking_types?.includes('monthly') ||
                    property.monthly_price) && (
                    <div>
                      <label className='text-sm font-medium'>
                        Monthly Rate
                      </label>
                      <p className='text-sm text-muted-foreground'>
                        ${property.monthly_price || 'Not set'}/month
                      </p>
                    </div>
                  )}

                  <div>
                    <label className='text-sm font-medium'>Booking Types</label>
                    <div className='flex flex-wrap gap-1 mt-1'>
                      {property.booking_types?.map((type, index) => (
                        <Badge
                          key={index}
                          variant='outline'
                          className='text-xs capitalize'
                        >
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className='text-sm font-medium'>Amenities</label>
                    <div className='flex flex-wrap gap-1 mt-1'>
                      {property.amenities?.map((amenity, index) => (
                        <Badge
                          key={index}
                          variant='outline'
                          className='text-xs'
                        >
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value='host'>
            <Card>
              <CardHeader>
                <CardTitle>Host Information</CardTitle>
                <CardDescription>
                  Property owner details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='space-y-4'>
                    <div>
                      <label className='text-sm font-medium'>Host Name</label>
                      <p className='text-lg font-semibold'>
                        {getHostName(property)}
                      </p>
                    </div>

                    <div>
                      <label className='text-sm font-medium'>Email</label>
                      <p className='text-sm text-muted-foreground'>
                        {property.profiles?.email || 'No email provided'}
                      </p>
                    </div>

                    {property.profiles?.phone && (
                      <div>
                        <label className='text-sm font-medium'>Phone</label>
                        <p className='text-sm text-muted-foreground'>
                          {property.profiles.phone}
                        </p>
                      </div>
                    )}
                  </div>
                  {/* future features (view host profile - send email - call host) */}
                  {/* <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <Mail className="h-4 w-4 mr-2" />
                      Send Email
                    </Button>
                    {property.profiles?.phone && (
                      <Button variant="outline" className="w-full justify-start">
                        <Phone className="h-4 w-4 mr-2" />
                        Call Host
                      </Button>
                    )}
                    <Button variant="outline" className="w-full justify-start">
                      <Eye className="h-4 w-4 mr-2" />
                      View Host Profile
                    </Button>
                  </div> */}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='bookings'>
            <Card>
              <CardHeader>
                <CardTitle>Booking History</CardTitle>
                <CardDescription>
                  All bookings for this property
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bookings.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Guest</TableHead>
                        <TableHead>Check-in</TableHead>
                        <TableHead>Check-out</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Booked</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            {booking.profiles
                              ? `${booking.profiles.first_name || ''} ${booking.profiles.last_name || ''}`.trim() ||
                                booking.profiles.email
                              : 'Unknown Guest'}
                          </TableCell>
                          <TableCell>
                            {new Date(booking.check_in).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {new Date(booking.check_out).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                booking.status === 'completed'
                                  ? 'default'
                                  : booking.status === 'cancelled'
                                    ? 'destructive'
                                    : 'secondary'
                              }
                            >
                              {booking.status}
                            </Badge>
                          </TableCell>
                          <TableCell>${booking.total_price}</TableCell>
                          <TableCell>
                            {new Date(booking.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className='text-center py-8 text-muted-foreground'>
                    <Calendar className='h-12 w-12 mx-auto mb-4 opacity-50' />
                    <p>No bookings found for this property</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='analytics'>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-6'>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Total Revenue
                  </CardTitle>
                  <DollarSign className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    ${totalRevenue.toLocaleString()}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    From {bookings.length} booking
                    {bookings.length !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Completed Bookings
                  </CardTitle>
                  <CheckCircle className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>{completedBookings}</div>
                  <p className='text-xs text-muted-foreground'>
                    {bookings.length > 0
                      ? Math.round((completedBookings / bookings.length) * 100)
                      : 0}
                    % completion rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Average Booking Value
                  </CardTitle>
                  <TrendingUp className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    $
                    {bookings.length > 0
                      ? Math.round(
                          totalRevenue / bookings.length,
                        ).toLocaleString()
                      : 0}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    Per booking average
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Property Age
                  </CardTitle>
                  <Calendar className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {Math.floor(
                      (Date.now() - new Date(property.created_at).getTime()) /
                        (1000 * 60 * 60 * 24),
                    )}{' '}
                    days
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    Listed on{' '}
                    {new Date(property.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Property Status</CardTitle>
                <CardDescription>
                  Quick overview of property performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between p-3 border rounded'>
                    <span className='font-medium'>Total Bookings</span>
                    <span className='text-lg font-bold'>{bookings.length}</span>
                  </div>
                  <div className='flex items-center justify-between p-3 border rounded'>
                    <span className='font-medium'>Revenue Generated</span>
                    <span className='text-lg font-bold'>
                      ${totalRevenue.toLocaleString()}
                    </span>
                  </div>
                  <div className='flex items-center justify-between p-3 border rounded'>
                    <span className='font-medium'>Success Rate</span>
                    <span className='text-lg font-bold'>
                      {bookings.length > 0
                        ? Math.round(
                            (completedBookings / bookings.length) * 100,
                          )
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Property Modal */}
        {isEditing && property && (
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
              <DialogHeader>
                <DialogTitle>Edit Property - Super Admin</DialogTitle>
                <DialogDescription>
                  Update property information and settings. As a super admin,
                  you can edit all fields.
                </DialogDescription>
              </DialogHeader>
              <EnhancedPropertyForm
                property={property}
                onSave={handleEditSave}
                onCancel={handleEditCancel}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AdminLayout>
  );
};

export default SuperAdminPropertyDetails;
