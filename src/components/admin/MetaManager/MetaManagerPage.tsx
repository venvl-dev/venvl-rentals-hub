import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '../AdminLayout';
import { 
  Loader2, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Upload,
  Search
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Amenity {
  id: string;
  name: string;
  icon: string | null;
  category: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

interface PropertyType {
  id: string;
  name: string;
  icon: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

const MetaManagerPage = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAmenityDialogOpen, setIsAmenityDialogOpen] = useState(false);
  const [isPropertyTypeDialogOpen, setIsPropertyTypeDialogOpen] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState<Amenity | null>(null);
  const [editingPropertyType, setEditingPropertyType] = useState<PropertyType | null>(null);

  // Fetch amenities
  const { data: amenities, isLoading: amenitiesLoading } = useQuery({
    queryKey: ['admin-amenities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('amenities')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as Amenity[];
    },
  });

  // Fetch property types
  const { data: propertyTypes, isLoading: propertyTypesLoading } = useQuery({
    queryKey: ['admin-property-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('property_types')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as PropertyType[];
    },
  });

  // Amenity mutations
  const createAmenityMutation = useMutation({
    mutationFn: async (amenity: Omit<Amenity, 'id' | 'created_at'>) => {
      const { error } = await supabase
        .from('amenities')
        .insert(amenity);
      
      if (error) throw error;
      
      await supabase.rpc('log_admin_action', {
        p_action: 'create_amenity',
        p_resource_type: 'amenities',
        p_metadata: amenity
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-amenities'] });
      toast.success('Amenity created successfully');
      setIsAmenityDialogOpen(false);
    },
  });

  const updateAmenityMutation = useMutation({
    mutationFn: async ({ id, ...amenity }: Partial<Amenity> & { id: string }) => {
      const { error } = await supabase
        .from('amenities')
        .update(amenity)
        .eq('id', id);
      
      if (error) throw error;
      
      await supabase.rpc('log_admin_action', {
        p_action: 'update_amenity',
        p_resource_type: 'amenities',
        p_resource_id: id,
        p_metadata: amenity
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-amenities'] });
      toast.success('Amenity updated successfully');
      setIsAmenityDialogOpen(false);
      setEditingAmenity(null);
    },
  });

  const deleteAmenityMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('amenities')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      await supabase.rpc('log_admin_action', {
        p_action: 'delete_amenity',
        p_resource_type: 'amenities',
        p_resource_id: id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-amenities'] });
      toast.success('Amenity deleted successfully');
    },
  });

  // Property type mutations
  const createPropertyTypeMutation = useMutation({
    mutationFn: async (propertyType: Omit<PropertyType, 'id' | 'created_at'>) => {
      const { error } = await supabase
        .from('property_types')
        .insert(propertyType);
      
      if (error) throw error;
      
      await supabase.rpc('log_admin_action', {
        p_action: 'create_property_type',
        p_resource_type: 'property_types',
        p_metadata: propertyType
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-property-types'] });
      toast.success('Property type created successfully');
      setIsPropertyTypeDialogOpen(false);
    },
  });

  const updatePropertyTypeMutation = useMutation({
    mutationFn: async ({ id, ...propertyType }: Partial<PropertyType> & { id: string }) => {
      const { error } = await supabase
        .from('property_types')
        .update(propertyType)
        .eq('id', id);
      
      if (error) throw error;
      
      await supabase.rpc('log_admin_action', {
        p_action: 'update_property_type',
        p_resource_type: 'property_types',
        p_resource_id: id,
        p_metadata: propertyType
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-property-types'] });
      toast.success('Property type updated successfully');
      setIsPropertyTypeDialogOpen(false);
      setEditingPropertyType(null);
    },
  });

  const deletePropertyTypeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('property_types')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      await supabase.rpc('log_admin_action', {
        p_action: 'delete_property_type',
        p_resource_type: 'property_types',
        p_resource_id: id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-property-types'] });
      toast.success('Property type deleted successfully');
    },
  });

  const handleExportAmenities = () => {
    const exportData = amenities?.map(({ id, created_at, ...rest }) => rest);
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'amenities.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPropertyTypes = () => {
    const exportData = propertyTypes?.map(({ id, created_at, ...rest }) => rest);
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'property-types.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredAmenities = amenities?.filter(amenity =>
    amenity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    amenity.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPropertyTypes = propertyTypes?.filter(type =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout title="Meta Manager">
      <div className="p-6">
        <Tabs defaultValue="amenities" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="amenities">Amenities</TabsTrigger>
            <TabsTrigger value="property-types">Property Types</TabsTrigger>
          </TabsList>

          <TabsContent value="amenities" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Amenities Management</CardTitle>
                    <CardDescription>
                      Manage property amenities and their categories
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handleExportAmenities} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export JSON
                    </Button>
                    <Dialog open={isAmenityDialogOpen} onOpenChange={setIsAmenityDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Amenity
                        </Button>
                      </DialogTrigger>
                      <AmenityDialog
                        amenity={editingAmenity}
                        onSubmit={(amenity) => {
                          if (editingAmenity) {
                            updateAmenityMutation.mutate({ ...amenity, id: editingAmenity.id });
                          } else {
                            createAmenityMutation.mutate(amenity);
                          }
                        }}
                      />
                    </Dialog>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4" />
                  <Input
                    placeholder="Search amenities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {amenitiesLoading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Icon</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAmenities?.map((amenity) => (
                        <TableRow key={amenity.id}>
                          <TableCell className="font-medium">{amenity.name}</TableCell>
                          <TableCell>{amenity.icon || 'N/A'}</TableCell>
                          <TableCell>{amenity.category}</TableCell>
                          <TableCell>{amenity.display_order}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              amenity.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {amenity.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingAmenity(amenity);
                                  setIsAmenityDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteAmenityMutation.mutate(amenity.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="property-types" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Property Types Management</CardTitle>
                    <CardDescription>
                      Manage property types and their display order
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handleExportPropertyTypes} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export JSON
                    </Button>
                    <Dialog open={isPropertyTypeDialogOpen} onOpenChange={setIsPropertyTypeDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Property Type
                        </Button>
                      </DialogTrigger>
                      <PropertyTypeDialog
                        propertyType={editingPropertyType}
                        onSubmit={(propertyType) => {
                          if (editingPropertyType) {
                            updatePropertyTypeMutation.mutate({ ...propertyType, id: editingPropertyType.id });
                          } else {
                            createPropertyTypeMutation.mutate(propertyType);
                          }
                        }}
                      />
                    </Dialog>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4" />
                  <Input
                    placeholder="Search property types..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {propertyTypesLoading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Icon</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPropertyTypes?.map((type) => (
                        <TableRow key={type.id}>
                          <TableCell className="font-medium">{type.name}</TableCell>
                          <TableCell>{type.icon || 'N/A'}</TableCell>
                          <TableCell>{type.display_order}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              type.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {type.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingPropertyType(type);
                                  setIsPropertyTypeDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deletePropertyTypeMutation.mutate(type.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

// Amenity Dialog Component
const AmenityDialog = ({ 
  amenity, 
  onSubmit 
}: { 
  amenity: Amenity | null; 
  onSubmit: (amenity: Omit<Amenity, 'id' | 'created_at'>) => void; 
}) => {
  const [formData, setFormData] = useState({
    name: amenity?.name || '',
    icon: amenity?.icon || '',
    category: amenity?.category || 'general',
    display_order: amenity?.display_order || 0,
    is_active: amenity?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{amenity ? 'Edit Amenity' : 'Add New Amenity'}</DialogTitle>
        <DialogDescription>
          Configure amenity details and display settings
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="icon">Icon (Lucide Icon Name)</Label>
          <Input
            id="icon"
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            placeholder="Wifi"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="kitchen">Kitchen</SelectItem>
              <SelectItem value="bathroom">Bathroom</SelectItem>
              <SelectItem value="entertainment">Entertainment</SelectItem>
              <SelectItem value="outdoor">Outdoor</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="display_order">Display Order</Label>
          <Input
            id="display_order"
            type="number"
            value={formData.display_order}
            onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
          />
        </div>
        
        <DialogFooter>
          <Button type="submit">
            {amenity ? 'Update' : 'Create'} Amenity
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

// Property Type Dialog Component
const PropertyTypeDialog = ({ 
  propertyType, 
  onSubmit 
}: { 
  propertyType: PropertyType | null; 
  onSubmit: (propertyType: Omit<PropertyType, 'id' | 'created_at'>) => void; 
}) => {
  const [formData, setFormData] = useState({
    name: propertyType?.name || '',
    icon: propertyType?.icon || '',
    display_order: propertyType?.display_order || 0,
    is_active: propertyType?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{propertyType ? 'Edit Property Type' : 'Add New Property Type'}</DialogTitle>
        <DialogDescription>
          Configure property type details and display settings
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="icon">Icon (Lucide Icon Name)</Label>
          <Input
            id="icon"
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            placeholder="Building"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="display_order">Display Order</Label>
          <Input
            id="display_order"
            type="number"
            value={formData.display_order}
            onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
          />
        </div>
        
        <DialogFooter>
          <Button type="submit">
            {propertyType ? 'Update' : 'Create'} Property Type
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

export default MetaManagerPage;