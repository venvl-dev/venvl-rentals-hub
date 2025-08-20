import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Home, Plus, Edit2, Trash2, Search, Star } from 'lucide-react';

interface PropertyType {
  id: string;
  name: string;
  icon: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PropertyTypeStats {
  totalTypes: number;
  activeTypes: number;
}

const PropertyTypeManagement = () => {
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [filteredTypes, setFilteredTypes] = useState<PropertyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stats, setStats] = useState<PropertyTypeStats>({
    totalTypes: 0,
    activeTypes: 0,
  });
  const [selectedType, setSelectedType] = useState<PropertyType | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    loadPropertyTypes();
  }, []);

  useEffect(() => {
    filterPropertyTypes();
  }, [propertyTypes, searchTerm, statusFilter]);

  const loadPropertyTypes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('property_types')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;

      setPropertyTypes(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error loading property types:', error);
      toast.error("Failed to load property types");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (typeData: PropertyType[]) => {
    setStats({
      totalTypes: typeData.length,
      activeTypes: typeData.filter(t => t.is_active).length,
    });
  };

  const filterPropertyTypes = () => {
    let filtered = propertyTypes;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(type => 
        type.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(type => 
        statusFilter === 'active' ? type.is_active : !type.is_active
      );
    }

    setFilteredTypes(filtered);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      icon: '',
      display_order: 0,
      is_active: true,
    });
  };

  const handleCreate = async () => {
    try {
      const { error } = await supabase
        .from('property_types')
        .insert([{
          name: formData.name,
          icon: formData.icon || null,
          display_order: formData.display_order,
          is_active: formData.is_active,
        }]);

      if (error) throw error;

      toast.success("Property type created successfully");

      setIsCreateDialogOpen(false);
      resetForm();
      loadPropertyTypes();
    } catch (error) {
      console.error('Error creating property type:', error);
      toast.error("Failed to create property type");
    }
  };

  const handleEdit = async () => {
    if (!selectedType) return;

    try {
      const { error } = await supabase
        .from('property_types')
        .update({
          name: formData.name,
          icon: formData.icon || null,
          display_order: formData.display_order,
          is_active: formData.is_active,
        })
        .eq('id', selectedType.id);

      if (error) throw error;

      toast.success("Property type updated successfully");

      setIsEditDialogOpen(false);
      setSelectedType(null);
      resetForm();
      loadPropertyTypes();
    } catch (error) {
      console.error('Error updating property type:', error);
      toast.error("Failed to update property type");
    }
  };

  const handleDelete = async (type: PropertyType) => {
    try {
      // Valid enum values for property_type
      const validEnumValues = ['apartment', 'house', 'villa', 'studio', 'cabin', 'loft'];
      const lowerTypeName = type.name.toLowerCase();
      
      // Only check for properties if this is a valid enum value
      if (validEnumValues.includes(lowerTypeName)) {
        const { data: propertiesWithType, error: checkError } = await supabase
          .from('properties')
          .select('id')
          .eq('property_type', lowerTypeName)
          .limit(1);

        if (checkError) throw checkError;

        if (propertiesWithType && propertiesWithType.length > 0) {
          toast.error("Cannot delete: This property type is being used by existing properties. Please reassign those properties first.");
          return;
        }
      }
      // If property type is not in enum, skip properties check since no properties can use invalid enum values

      const { error } = await supabase
        .from('property_types')
        .delete()
        .eq('id', type.id);

      if (error) throw error;

      toast.success("Property type deleted successfully");
      loadPropertyTypes();
    } catch (error) {
      console.error('Error deleting property type:', error);
      toast.error("Failed to delete property type");
    }
  };

  const openEditDialog = (type: PropertyType) => {
    setSelectedType(type);
    setFormData({
      name: type.name,
      icon: type.icon || '',
      display_order: type.display_order,
      is_active: type.is_active,
    });
    setIsEditDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading property types...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Property Type Management</h1>
          <p className="text-muted-foreground mt-2">Manage available property types for listings</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Property Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Property Type</DialogTitle>
              <DialogDescription>
                Add a new property type that hosts can select for their listings
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter property type name"
                />
              </div>
              <div>
                <Label htmlFor="icon">Icon (optional)</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder="Enter icon name (lucide-react)"
                />
              </div>
              <div>
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!formData.name.trim()}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Property Types</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTypes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Types</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTypes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Types</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTypes - stats.activeTypes}</div>
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
                  placeholder="Search property types..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-input bg-background text-foreground rounded-md"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Property Types Table */}
      <Card>
        <CardHeader>
          <CardTitle>Property Types ({filteredTypes.length})</CardTitle>
          <CardDescription>Manage available property types for host listings</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Icon</TableHead>
                <TableHead>Display Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell className="font-medium">{type.name}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {type.icon || 'No icon'}
                    </span>
                  </TableCell>
                  <TableCell>{type.display_order}</TableCell>
                  <TableCell>
                    <Badge variant={type.is_active ? "default" : "secondary"}>
                      {type.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(type.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openEditDialog(type)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Property Type</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{type.name}"? This action cannot be undone.
                              Make sure no properties are using this type first.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(type)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
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

          {filteredTypes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No property types found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Property Type</DialogTitle>
            <DialogDescription>
              Update property type information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter property type name"
              />
            </div>
            <div>
              <Label htmlFor="edit-icon">Icon (optional)</Label>
              <Input
                id="edit-icon"
                value={formData.icon}
                onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                placeholder="Enter icon name (lucide-react)"
              />
            </div>
            <div>
              <Label htmlFor="edit-display-order">Display Order</Label>
              <Input
                id="edit-display-order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-is-active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="edit-is-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={!formData.name.trim()}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertyTypeManagement;