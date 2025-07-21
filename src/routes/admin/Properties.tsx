import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Home, Search, CheckCircle, XCircle, Eye, Archive, MapPin, DollarSign, Users, Bed, Bath } from 'lucide-react';

interface Property {
  id: string;
  title: string;
  description: string | null;
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
  property_type: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  is_active: boolean;
  images: string[];
  amenities: string[];
  created_at: string;
  host_id: string;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

interface PropertyStats {
  totalProperties: number;
  pendingApproval: number;
  approved: number;
  rejected: number;
  archived: number;
}

const PropertyManagement = () => {
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [stats, setStats] = useState<PropertyStats>({
    totalProperties: 0,
    pendingApproval: 0,
    approved: 0,
    rejected: 0,
    archived: 0,
  });
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [uniqueCities, setUniqueCities] = useState<string[]>([]);

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [properties, searchTerm, statusFilter, cityFilter]);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          profiles!properties_host_id_fkey(
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProperties(data || []);
      calculateStats(data || []);
      
      // Extract unique cities for filter
      const cities = [...new Set((data || []).map(p => p.city))].filter(Boolean).sort() as string[];
      setUniqueCities(cities);
    } catch (error) {
      console.error('Error loading properties:', error);
      toast({
        title: "Error",
        description: "Failed to load properties",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (propertyData: Property[]) => {
    setStats({
      totalProperties: propertyData.length,
      pendingApproval: propertyData.filter(p => p.approval_status === 'pending').length,
      approved: propertyData.filter(p => p.approval_status === 'approved').length,
      rejected: propertyData.filter(p => p.approval_status === 'rejected').length,
      archived: propertyData.filter(p => !p.is_active).length,
    });
  };

  const filterProperties = () => {
    let filtered = properties;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(property => 
        property.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'archived') {
        filtered = filtered.filter(property => !property.is_active);
      } else {
        filtered = filtered.filter(property => property.approval_status === statusFilter);
      }
    }

    // City filter
    if (cityFilter !== 'all') {
      filtered = filtered.filter(property => property.city === cityFilter);
    }

    setFilteredProperties(filtered);
  };

  const updatePropertyStatus = async (propertyId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ approval_status: status })
        .eq('id', propertyId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Property ${status} successfully`,
      });

      // Log the admin action
      await supabase.rpc('log_admin_action', {
        p_action: `property_${status}`,
        p_resource_type: 'property',
        p_resource_id: propertyId,
        p_metadata: { status }
      });

      loadProperties();
    } catch (error) {
      console.error('Error updating property status:', error);
      toast({
        title: "Error",
        description: "Failed to update property status",
        variant: "destructive",
      });
    }
  };

  const togglePropertyActive = async (propertyId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ is_active: !isActive })
        .eq('id', propertyId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Property ${!isActive ? 'activated' : 'archived'} successfully`,
      });

      // Log the admin action
      await supabase.rpc('log_admin_action', {
        p_action: isActive ? 'property_archived' : 'property_activated',
        p_resource_type: 'property',
        p_resource_id: propertyId,
        p_metadata: { is_active: !isActive }
      });

      loadProperties();
    } catch (error) {
      console.error('Error toggling property status:', error);
      toast({
        title: "Error",
        description: "Failed to update property status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string, isActive: boolean) => {
    if (!isActive) return 'secondary';
    switch (status) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  const getHostName = (property: Property) => {
    const profile = property.profiles;
    if (!profile) return 'Unknown Host';
    return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Unknown Host';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading properties...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Property Management</h1>
          <p className="text-muted-foreground mt-2">Review and manage all property listings</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProperties}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <CheckCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingApproval}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Archived</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.archived}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title, city, address, or host email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by city" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {uniqueCities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Properties Table */}
      <Card>
        <CardHeader>
          <CardTitle>Properties ({filteredProperties.length})</CardTitle>
          <CardDescription>Manage property listings and approvals</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Host</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProperties.map((property) => (
                <TableRow key={property.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{property.title}</div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {property.property_type}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{getHostName(property)}</div>
                      <div className="text-muted-foreground">{property.profiles?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <MapPin className="h-3 w-3 mr-1" />
                      {property.city}, {property.state || property.country}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3 text-sm">
                      <div className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {property.max_guests}
                      </div>
                      <div className="flex items-center">
                        <Bed className="h-3 w-3 mr-1" />
                        {property.bedrooms || 0}
                      </div>
                      <div className="flex items-center">
                        <Bath className="h-3 w-3 mr-1" />
                        {property.bathrooms || 0}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <DollarSign className="h-3 w-3" />
                      {property.price_per_night}/night
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(property.approval_status, property.is_active)}>
                      {!property.is_active ? 'Archived' : property.approval_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedProperty(property)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Property Details</DialogTitle>
                            <DialogDescription>
                              Review property information and take action
                            </DialogDescription>
                          </DialogHeader>
                          {selectedProperty && (
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Title</label>
                                  <p className="text-sm text-muted-foreground">{selectedProperty.title}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Type</label>
                                  <p className="text-sm text-muted-foreground capitalize">{selectedProperty.property_type}</p>
                                </div>
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium">Description</label>
                                <p className="text-sm text-muted-foreground">{selectedProperty.description || 'No description provided'}</p>
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium">Address</label>
                                <p className="text-sm text-muted-foreground">
                                  {selectedProperty.address}, {selectedProperty.city}, {selectedProperty.state} {selectedProperty.country}
                                </p>
                              </div>

                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Max Guests</label>
                                  <p className="text-sm text-muted-foreground">{selectedProperty.max_guests}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Bedrooms</label>
                                  <p className="text-sm text-muted-foreground">{selectedProperty.bedrooms || 0}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Bathrooms</label>
                                  <p className="text-sm text-muted-foreground">{selectedProperty.bathrooms || 0}</p>
                                </div>
                              </div>

                              <div>
                                <label className="text-sm font-medium">Amenities</label>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {selectedProperty.amenities.map((amenity, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {amenity}
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              <div className="flex space-x-2 pt-4">
                                {selectedProperty.approval_status === 'pending' && (
                                  <>
                                    <Button 
                                      onClick={() => updatePropertyStatus(selectedProperty.id, 'approved')}
                                      className="flex-1"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Approve
                                    </Button>
                                    <Button 
                                      variant="destructive"
                                      onClick={() => updatePropertyStatus(selectedProperty.id, 'rejected')}
                                      className="flex-1"
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Reject
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      {property.approval_status === 'pending' && (
                        <>
                          <Button 
                            size="sm"
                            onClick={() => updatePropertyStatus(property.id, 'approved')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => updatePropertyStatus(property.id, 'rejected')}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {property.is_active ? 'Archive' : 'Activate'} Property
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to {property.is_active ? 'archive' : 'activate'} this property?
                              {property.is_active && ' This will hide it from search results.'}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => togglePropertyActive(property.id, property.is_active)}
                            >
                              {property.is_active ? 'Archive' : 'Activate'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredProperties.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No properties found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PropertyManagement;