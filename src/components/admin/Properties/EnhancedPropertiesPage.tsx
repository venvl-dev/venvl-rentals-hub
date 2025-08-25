import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAdminQueryClient } from '@/hooks/useAdminQueryClient';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { 
  MoreHorizontal, 
  CheckCircle, 
  XCircle, 
  Archive,
  Eye,
  MapPin,
  DollarSign,
  Users,
  Bed,
  Bath,
  Edit
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/ui/data-table';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '../AdminLayout';
import EnhancedPropertyForm from '@/components/host/EnhancedPropertyForm';
import { Property as PropertyType } from '@/types/property';

interface Property extends PropertyType {
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
}

interface PropertyStats {
  totalProperties: number;
  pendingApproval: number;
  approved: number;
  rejected: number;
  archived: number;
}





const EnhancedPropertiesPage = () => {
  const { queryClient, invalidateAdminQueries } = useAdminQueryClient();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [activeTab, setActiveTab] = useState('all');


  // Fetch properties
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['admin-properties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Property[];
    },
  });

  // Update property status mutation
  const updatePropertyStatusMutation = useMutation({
    mutationFn: async ({ propertyId, status }: { propertyId: string; status: 'approved' | 'rejected' }) => {
      const { error } = await supabase
        .from('properties')
        .update({ approval_status: status })
        .eq('id', propertyId);

      if (error) throw error;

      await supabase.rpc('log_admin_action', {
        p_action: `property_${status}`,
        p_resource_type: 'property',
        p_resource_id: propertyId,
        p_metadata: { status }
      });
    },
    onSuccess: (_, { status }) => {
      invalidateAdminQueries([['admin-properties']]);
      toast.success(`Property ${status} successfully`);
    },
    onError: (error) => {
      toast.error('Failed to update property status');
      console.error('Property status update error:', error);
    },
  });

  // Toggle property active status mutation
  const togglePropertyActiveMutation = useMutation({
    mutationFn: async ({ propertyId, isActive }: { propertyId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('properties')
        .update({ is_active: !isActive })
        .eq('id', propertyId);

      if (error) throw error;

      await supabase.rpc('log_admin_action', {
        p_action: isActive ? 'property_archived' : 'property_activated',
        p_resource_type: 'property',
        p_resource_id: propertyId,
        p_metadata: { is_active: !isActive }
      });
    },
    onSuccess: (_, { isActive }) => {
      invalidateAdminQueries([['admin-properties']]);
      toast.success(`Property ${!isActive ? 'activated' : 'archived'} successfully`);
    },
    onError: (error) => {
      toast.error('Failed to update property status');
      console.error('Property toggle error:', error);
    },
  });

  // Calculate stats
  const stats: PropertyStats = {
    totalProperties: properties.length,
    pendingApproval: properties.filter(p => p.approval_status === 'pending').length,
    approved: properties.filter(p => p.approval_status === 'approved').length,
    rejected: properties.filter(p => p.approval_status === 'rejected').length,
    archived: properties.filter(p => !p.is_active).length,
  };

  // Filter properties based on active tab
  const filteredProperties = properties.filter(property => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return property.is_active && property.approval_status === 'approved';
    if (activeTab === 'archived') return !property.is_active;
    return property.approval_status === activeTab;
  });

  // Handle property edit form actions
  const handleEditSave = () => {
    setEditingProperty(null);
    // Invalidate queries to refresh the data
    invalidateAdminQueries([['admin-properties']]);
  };

  const handleEditCancel = () => {
    setEditingProperty(null);
  };

  const getHostName = (property: Property) => {
    const profile = property.profiles;
    if (!profile) return 'Host User';
    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    return fullName || profile.email?.split('@')[0] || 'Host User';
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

  const columns: ColumnDef<Property>[] = [
    {
      accessorKey: 'title',
      header: 'Property',
      cell: ({ row }) => {
        const property = row.original;
        return (
          <div>
            <Link 
              to={`/admin/property/${property.id}`}
              className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
            >
              {property.title}
            </Link>
            <div className="text-sm text-muted-foreground capitalize">
              {property.property_type}
            </div>
          </div>
        );
      },
    },
    {
      id: 'host',
      header: 'Host',
      cell: ({ row }) => {
        const property = row.original;
        return (
          <div className="text-sm">
            <div className="font-medium">{getHostName(property)}</div>
          </div>
        );
      },
    },
    {
      id: 'location',
      header: 'Location',
      cell: ({ row }) => {
        const property = row.original;
        return (
          <div className="flex items-center text-sm">
            <MapPin className="h-3 w-3 mr-1" />
            {property.city}, {property.state || property.country}
          </div>
        );
      },
    },
    {
      id: 'details',
      header: 'Details',
      cell: ({ row }) => {
        const property = row.original;
        return (
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
        );
      },
    },
    {
      accessorKey: 'price_per_night',
      header: 'Price',
      cell: ({ row }) => {
        const price = row.getValue('price_per_night') as number;
        return (
          <div className="flex items-center text-sm">
            <DollarSign className="h-3 w-3" />
            {price}/night
          </div>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const property = row.original;
        return (
          <Badge variant={getStatusBadgeVariant(property.approval_status, property.is_active)}>
            {!property.is_active ? 'Archived' : property.approval_status}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const property = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Dialog>
                <DialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setSelectedProperty(property);
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                </DialogTrigger>
              </Dialog>
              
              <DropdownMenuItem onClick={() => setEditingProperty(property)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Property
              </DropdownMenuItem>
              
              {property.approval_status === 'pending' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => updatePropertyStatusMutation.mutate({ 
                      propertyId: property.id, 
                      status: 'approved' 
                    })}
                    className="text-green-600"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => updatePropertyStatusMutation.mutate({ 
                      propertyId: property.id, 
                      status: 'rejected' 
                    })}
                    className="text-red-600"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </DropdownMenuItem>
                </>
              )}
              
              <DropdownMenuSeparator />
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className={property.is_active ? 'text-orange-600' : 'text-green-600'}
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    {property.is_active ? 'Archive' : 'Unarchive'}
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {property.is_active ? 'Archive' : 'Unarchive'} Property
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to {property.is_active ? 'archive' : 'unarchive'} this property?
                      {property.is_active && ' It will no longer be visible to guests.'}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => togglePropertyActiveMutation.mutate({ 
                        propertyId: property.id, 
                        isActive: property.is_active 
                      })}
                    >
                      {property.is_active ? 'Archive' : 'Unarchive'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <AdminLayout title="Property Management">
        <div className="flex items-center justify-center p-8">
          <div className="text-lg">Loading properties...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Property Management">
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProperties}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pendingApproval}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Archived</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.archived}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Properties</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Properties ({filteredProperties.length})</CardTitle>
                <CardDescription>
                  Manage property listings and approval status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={columns}
                  data={filteredProperties}
                  searchPlaceholder="Search by title, city, or host..."
                  searchColumn="title"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Property Details Dialog */}
        {selectedProperty && (
          <Dialog open={!!selectedProperty} onOpenChange={() => setSelectedProperty(null)}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Property Details</DialogTitle>
                <DialogDescription>
                  Review property information and take action
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
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

                <div className="grid grid-cols-2 gap-4">
                  {(selectedProperty.booking_types?.includes('daily') || selectedProperty.daily_price) && (
                    <div>
                      <label className="text-sm font-medium">Daily Stay Price</label>
                      <p className="text-sm text-muted-foreground">${selectedProperty.daily_price || selectedProperty.price_per_night}</p>
                    </div>
                  )}
                  {(selectedProperty.booking_types?.includes('monthly') || selectedProperty.monthly_price) && (
                    <div>
                      <label className="text-sm font-medium">Monthly Stay Price</label>
                      <p className="text-sm text-muted-foreground">${selectedProperty.monthly_price || 'N/A'}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Host Information</label>
                  <p className="text-sm text-muted-foreground">
                    {getHostName(selectedProperty)}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">Amenities</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedProperty.amenities?.map((amenity, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <p className="text-sm text-muted-foreground">
                      <Badge variant={getStatusBadgeVariant(selectedProperty.approval_status, selectedProperty.is_active)}>
                        {!selectedProperty.is_active ? 'Archived' : selectedProperty.approval_status}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Created</label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedProperty.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {selectedProperty.approval_status === 'pending' && (
                  <div className="flex space-x-2 pt-4">
                    <Button
                      onClick={() => {
                        updatePropertyStatusMutation.mutate({ 
                          propertyId: selectedProperty.id, 
                          status: 'approved' 
                        });
                        setSelectedProperty(null);
                      }}
                      className="flex-1"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve Property
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        updatePropertyStatusMutation.mutate({ 
                          propertyId: selectedProperty.id, 
                          status: 'rejected' 
                        });
                        setSelectedProperty(null);
                      }}
                      className="flex-1"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject Property
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Property Form Modal */}
        {editingProperty && (
          <Dialog open={!!editingProperty} onOpenChange={() => setEditingProperty(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Property</DialogTitle>
                <DialogDescription>
                  Update property information and settings
                </DialogDescription>
              </DialogHeader>
              <EnhancedPropertyForm
                property={editingProperty}
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

export default EnhancedPropertiesPage;