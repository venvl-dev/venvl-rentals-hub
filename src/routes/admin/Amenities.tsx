import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Activity, Plus, Edit2, Trash2, Search, Archive, Star } from 'lucide-react';

interface Amenity {
  id: string;
  name: string;
  icon: string | null;
  category: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

interface AmenityStats {
  totalAmenities: number;
  activeAmenities: number;
  categoryCounts: Record<string, number>;
}

const AmenityManagement = () => {
  const { toast } = useToast();
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [filteredAmenities, setFilteredAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stats, setStats] = useState<AmenityStats>({
    totalAmenities: 0,
    activeAmenities: 0,
    categoryCounts: {},
  });
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    category: 'general',
    display_order: 0,
    is_active: true,
  });

  const categories = ['general', 'kitchen', 'bathroom', 'bedroom', 'entertainment', 'outdoor', 'safety', 'accessibility'];

  useEffect(() => {
    loadAmenities();
  }, []);

  useEffect(() => {
    filterAmenities();
  }, [amenities, searchTerm, categoryFilter, statusFilter]);

  const loadAmenities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('amenities')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;

      setAmenities(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error loading amenities:', error);
      toast({
        title: "Error",
        description: "Failed to load amenities",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (amenityData: Amenity[]) => {
    const categoryCounts: Record<string, number> = {};
    amenityData.forEach(amenity => {
      categoryCounts[amenity.category] = (categoryCounts[amenity.category] || 0) + 1;
    });

    setStats({
      totalAmenities: amenityData.length,
      activeAmenities: amenityData.filter(a => a.is_active).length,
      categoryCounts,
    });
  };

  const filterAmenities = () => {
    let filtered = amenities;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(amenity => 
        amenity.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        amenity.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(amenity => amenity.category === categoryFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(amenity => 
        statusFilter === 'active' ? amenity.is_active : !amenity.is_active
      );
    }

    setFilteredAmenities(filtered);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      icon: '',
      category: 'general',
      display_order: 0,
      is_active: true,
    });
  };

  const handleCreate = async () => {
    try {
      const { error } = await supabase
        .from('amenities')
        .insert([{
          name: formData.name,
          icon: formData.icon || null,
          category: formData.category,
          display_order: formData.display_order,
          is_active: formData.is_active,
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Amenity created successfully",
      });

      setIsCreateDialogOpen(false);
      resetForm();
      loadAmenities();
    } catch (error) {
      console.error('Error creating amenity:', error);
      toast({
        title: "Error",
        description: "Failed to create amenity",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async () => {
    if (!selectedAmenity) return;

    try {
      const { error } = await supabase
        .from('amenities')
        .update({
          name: formData.name,
          icon: formData.icon || null,
          category: formData.category,
          display_order: formData.display_order,
          is_active: formData.is_active,
        })
        .eq('id', selectedAmenity.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Amenity updated successfully",
      });

      setIsEditDialogOpen(false);
      setSelectedAmenity(null);
      resetForm();
      loadAmenities();
    } catch (error) {
      console.error('Error updating amenity:', error);
      toast({
        title: "Error",
        description: "Failed to update amenity",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (amenityId: string) => {
    try {
      const { error } = await supabase
        .from('amenities')
        .delete()
        .eq('id', amenityId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Amenity deleted successfully",
      });

      loadAmenities();
    } catch (error) {
      console.error('Error deleting amenity:', error);
      toast({
        title: "Error",
        description: "Failed to delete amenity",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (amenity: Amenity) => {
    setSelectedAmenity(amenity);
    setFormData({
      name: amenity.name,
      icon: amenity.icon || '',
      category: amenity.category,
      display_order: amenity.display_order,
      is_active: amenity.is_active,
    });
    setIsEditDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading amenities...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Amenity Management</h1>
          <p className="text-muted-foreground mt-2">Manage property amenities and categories</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Amenity
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Amenity</DialogTitle>
              <DialogDescription>
                Add a new amenity that properties can include
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter amenity name"
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
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amenities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAmenities}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Amenities</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAmenities}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(stats.categoryCounts).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Popular</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {Object.entries(stats.categoryCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
            </div>
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
                  placeholder="Search amenities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Amenities Table */}
      <Card>
        <CardHeader>
          <CardTitle>Amenities ({filteredAmenities.length})</CardTitle>
          <CardDescription>Manage property amenities and their categories</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Icon</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAmenities.map((amenity) => (
                <TableRow key={amenity.id}>
                  <TableCell className="font-medium">{amenity.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {amenity.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {amenity.icon || 'No icon'}
                    </span>
                  </TableCell>
                  <TableCell>{amenity.display_order}</TableCell>
                  <TableCell>
                    <Badge variant={amenity.is_active ? "default" : "secondary"}>
                      {amenity.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openEditDialog(amenity)}
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
                            <AlertDialogTitle>Delete Amenity</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{amenity.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(amenity.id)}
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

          {filteredAmenities.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No amenities found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Amenity</DialogTitle>
            <DialogDescription>
              Update amenity information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter amenity name"
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
              <Label htmlFor="edit-category">Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

export default AmenityManagement;