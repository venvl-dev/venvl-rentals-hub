import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Home, Plus, Calendar, BarChart3, Settings, Eye, Edit, Trash2 } from 'lucide-react';
import PropertyForm from '@/components/host/PropertyForm';
import BookingsList from '@/components/host/BookingsList';
import HostStats from '@/components/host/HostStats';
import { Property } from '@/types/property';

const HostDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    fetchProperties();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate('/auth');
      return;
    }

    // Check if user has host role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'host' && profile?.role !== 'admin') {
      toast.error('Access denied. Host privileges required.');
      navigate('/');
      return;
    }

    setUser(user);
  };

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('host_id', (await supabase.auth.getUser()).data.user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handlePropertySave = () => {
    setShowPropertyForm(false);
    setEditingProperty(null);
    fetchProperties();
    toast.success('Property saved successfully!');
  };

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    setShowPropertyForm(true);
  };

  const handleDelete = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;
      
      fetchProperties();
      toast.success('Property deleted successfully');
    } catch (error) {
      console.error('Error deleting property:', error);
      toast.error('Failed to delete property');
    }
  };

  const togglePropertyStatus = async (propertyId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ is_active: !currentStatus })
        .eq('id', propertyId);

      if (error) throw error;
      
      fetchProperties();
      toast.success(`Property ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating property status:', error);
      toast.error('Failed to update property status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (showPropertyForm) {
    return (
      <div>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <PropertyForm
            property={editingProperty}
            onSave={handlePropertySave}
            onCancel={() => {
              setShowPropertyForm(false);
              setEditingProperty(null);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Home className="h-8 w-8" />
              Host Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Manage your properties and bookings</p>
          </div>
          <Button onClick={() => setShowPropertyForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New Property
          </Button>
        </div>

        <Tabs defaultValue="properties" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="properties" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Properties
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="space-y-6">
            {properties.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Home className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No properties yet</h3>
                  <p className="text-gray-600 mb-4">Start by adding your first property to begin hosting</p>
                  <Button onClick={() => setShowPropertyForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Property
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((property) => (
                  <Card key={property.id} className="overflow-hidden">
                    <div className="aspect-video relative">
                      <img
                        src={property.images[0] || '/placeholder.svg'}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 right-4 flex gap-2">
                        <Badge className={`${getStatusColor(property.approval_status)} border-0`}>
                          {property.approval_status}
                        </Badge>
                        <Badge variant={property.is_active ? "default" : "secondary"}>
                          {property.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-2 truncate">{property.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{property.city}, {property.state}</p>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{property.description}</p>
                      
                      <div className="flex items-center justify-between text-sm mb-4">
                        <span className="font-medium">${property.price_per_night}/night</span>
                        <span className="text-gray-600">{property.bedrooms} bed • {property.bathrooms} bath</span>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/property/${property.id}`)}
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(property)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => togglePropertyStatus(property.id, property.is_active)}
                          className="flex-1"
                        >
                          {property.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(property.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bookings">
            <BookingsList />
          </TabsContent>

          <TabsContent value="analytics">
            <HostStats />
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Host Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Host settings will be available soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HostDashboard;
