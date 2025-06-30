
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Home, Calendar, DollarSign, Settings, ArrowLeft, Plus, X } from 'lucide-react';
import { Property } from '@/types/property';

const propertySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  property_type: z.enum(['apartment', 'house', 'villa', 'studio', 'condo']),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  rental_type: z.enum(['daily', 'monthly', 'both']),
  bedrooms: z.number().min(0),
  bathrooms: z.number().min(0),
  max_guests: z.number().min(1),
  price_per_night: z.number().optional(),
  monthly_price: z.number().optional(),
  min_nights: z.number().optional(),
  min_months: z.number().optional(),
  amenities: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
});

type PropertyFormData = z.infer<typeof propertySchema>;

interface EnhancedPropertyFormProps {
  property?: Property | null;
  onSave: () => void;
  onCancel: () => void;
}

const AMENITIES_OPTIONS = [
  'WiFi', 'Kitchen', 'Air Conditioning', 'TV', 'Washer', 'Dryer', 
  'Pool', 'Parking', 'Gym', 'Balcony', 'Garden', 'Fireplace'
];

const EnhancedPropertyForm = ({ property, onSave, onCancel }: EnhancedPropertyFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(property?.amenities || []);
  const [imageUrls, setImageUrls] = useState<string[]>(property?.images || []);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [activeTab, setActiveTab] = useState('basic');

  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      title: property?.title || '',
      description: property?.description || '',
      property_type: property?.property_type || 'apartment',
      address: property?.address || '',
      city: property?.city || '',
      state: property?.state || '',
      postal_code: property?.postal_code || '',
      rental_type: property?.rental_type as 'daily' | 'monthly' | 'both' || 'daily',
      bedrooms: property?.bedrooms || 1,
      bathrooms: property?.bathrooms || 1,
      max_guests: property?.max_guests || 2,
      price_per_night: property?.price_per_night || undefined,
      monthly_price: property?.monthly_price || undefined,
      min_nights: property?.min_nights || 1,
      min_months: property?.min_months || 1,
      amenities: property?.amenities || [],
      images: property?.images || [],
    },
  });

  const watchedRentalType = form.watch('rental_type');

  const handleAmenityToggle = (amenity: string) => {
    const updated = selectedAmenities.includes(amenity)
      ? selectedAmenities.filter(a => a !== amenity)
      : [...selectedAmenities, amenity];
    setSelectedAmenities(updated);
    form.setValue('amenities', updated);
  };

  const addImage = () => {
    if (newImageUrl && !imageUrls.includes(newImageUrl)) {
      const updated = [...imageUrls, newImageUrl];
      setImageUrls(updated);
      form.setValue('images', updated);
      setNewImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    const updated = imageUrls.filter((_, i) => i !== index);
    setImageUrls(updated);
    form.setValue('images', updated);
  };

  const onSubmit = async (data: PropertyFormData) => {
    try {
      setIsSubmitting(true);

      // Validate pricing based on rental type
      if (data.rental_type === 'daily' && !data.price_per_night) {
        toast.error('Nightly rate is required for daily rentals');
        return;
      }
      if (data.rental_type === 'monthly' && !data.monthly_price) {
        toast.error('Monthly rate is required for monthly rentals');
        return;
      }
      if (data.rental_type === 'both' && (!data.price_per_night || !data.monthly_price)) {
        toast.error('Both nightly and monthly rates are required');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const propertyData = {
        ...data,
        host_id: user.id,
        amenities: selectedAmenities,
        images: imageUrls,
        booking_types: data.rental_type === 'both' ? ['daily', 'monthly'] : [data.rental_type],
        daily_price: data.price_per_night,
      };

      if (property) {
        const { error } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', property.id);
        
        if (error) throw error;
        toast.success('Property updated successfully!');
      } else {
        const { error } = await supabase
          .from('properties')
          .insert(propertyData);
        
        if (error) throw error;
        toast.success('Property created successfully!');
      }

      onSave();
    } catch (error: any) {
      console.error('Error saving property:', error);
      toast.error(error.message || 'Failed to save property');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                {property ? 'Edit Property' : 'Add New Property'}
              </h1>
              <p className="text-gray-600 mt-1">
                {property ? 'Update your property details' : 'List your property on VENVL'}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-black text-white">
            VENVL Host
          </Badge>
        </div>

        {/* Form Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 rounded-2xl bg-gray-100 p-2">
            <TabsTrigger value="basic" className="rounded-xl flex items-center gap-2">
              <Home className="h-4 w-4" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="pricing" className="rounded-xl flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Pricing
            </TabsTrigger>
            <TabsTrigger value="details" className="rounded-xl flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Details
            </TabsTrigger>
            <TabsTrigger value="media" className="rounded-xl flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Media
            </TabsTrigger>
          </TabsList>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Info Tab */}
            <TabsContent value="basic">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="rounded-3xl shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                        <Home className="h-5 w-5 text-white" />
                      </div>
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="title">Property Title *</Label>
                        <Input
                          id="title"
                          {...form.register('title')}
                          placeholder="Beautiful downtown apartment"
                          className="rounded-xl border-gray-200 focus:border-black"
                        />
                        {form.formState.errors.title && (
                          <p className="text-red-500 text-sm">{form.formState.errors.title.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="property_type">Property Type *</Label>
                        <Select
                          value={form.watch('property_type')}
                          onValueChange={(value) => form.setValue('property_type', value as any)}
                        >
                          <SelectTrigger className="rounded-xl border-gray-200 focus:border-black">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="apartment">Apartment</SelectItem>
                            <SelectItem value="house">House</SelectItem>
                            <SelectItem value="villa">Villa</SelectItem>
                            <SelectItem value="studio">Studio</SelectItem>
                            <SelectItem value="condo">Condo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        {...form.register('description')}
                        placeholder="Describe your property..."
                        rows={4}
                        className="rounded-xl border-gray-200 focus:border-black"
                      />
                      {form.formState.errors.description && (
                        <p className="text-red-500 text-sm">{form.formState.errors.description.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="address">Address *</Label>
                        <Input
                          id="address"
                          {...form.register('address')}
                          placeholder="123 Main Street"
                          className="rounded-xl border-gray-200 focus:border-black"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          {...form.register('city')}
                          placeholder="New York"
                          className="rounded-xl border-gray-200 focus:border-black"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          {...form.register('state')}
                          placeholder="NY"
                          className="rounded-xl border-gray-200 focus:border-black"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rental_type">Rental Type *</Label>
                      <Select
                        value={form.watch('rental_type')}
                        onValueChange={(value) => form.setValue('rental_type', value as any)}
                      >
                        <SelectTrigger className="rounded-xl border-gray-200 focus:border-black">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily Rental</SelectItem>
                          <SelectItem value="monthly">Monthly Rental</SelectItem>
                          <SelectItem value="both">Both Daily & Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Pricing Tab */}
            <TabsContent value="pricing">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="rounded-3xl shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-white" />
                      </div>
                      Pricing & Availability
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <AnimatePresence mode="wait">
                      {(watchedRentalType === 'daily' || watchedRentalType === 'both') && (
                        <motion.div
                          key="daily-pricing"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-4"
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <Badge className="bg-blue-100 text-blue-800">Daily Rental</Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label htmlFor="price_per_night">Nightly Rate (EGP) *</Label>
                              <Input
                                id="price_per_night"
                                type="number"
                                step="0.01"
                                {...form.register('price_per_night', { valueAsNumber: true })}
                                placeholder="250.00"
                                className="rounded-xl border-gray-200 focus:border-black"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="min_nights">Minimum Days</Label>
                              <Input
                                id="min_nights"
                                type="number"
                                {...form.register('min_nights', { valueAsNumber: true })}
                                placeholder="1"
                                className="rounded-xl border-gray-200 focus:border-black"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {(watchedRentalType === 'monthly' || watchedRentalType === 'both') && (
                        <motion.div
                          key="monthly-pricing"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-4"
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <Badge className="bg-green-100 text-green-800">Monthly Rental</Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label htmlFor="monthly_price">Monthly Rate (EGP) *</Label>
                              <Input
                                id="monthly_price"
                                type="number"
                                step="0.01"
                                {...form.register('monthly_price', { valueAsNumber: true })}
                                placeholder="6500.00"
                                className="rounded-xl border-gray-200 focus:border-black"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="min_months">Minimum Months</Label>
                              <Input
                                id="min_months"
                                type="number"
                                {...form.register('min_months', { valueAsNumber: true })}
                                placeholder="1"
                                className="rounded-xl border-gray-200 focus:border-black"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="rounded-3xl shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                        <Settings className="h-5 w-5 text-white" />
                      </div>
                      Property Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="bedrooms">Bedrooms</Label>
                        <Input
                          id="bedrooms"
                          type="number"
                          {...form.register('bedrooms', { valueAsNumber: true })}
                          className="rounded-xl border-gray-200 focus:border-black"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bathrooms">Bathrooms</Label>
                        <Input
                          id="bathrooms"
                          type="number"
                          {...form.register('bathrooms', { valueAsNumber: true })}
                          className="rounded-xl border-gray-200 focus:border-black"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="max_guests">Max Guests *</Label>
                        <Input
                          id="max_guests"
                          type="number"
                          {...form.register('max_guests', { valueAsNumber: true })}
                          className="rounded-xl border-gray-200 focus:border-black"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label>Amenities</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {AMENITIES_OPTIONS.map((amenity) => (
                          <motion.div
                            key={amenity}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button
                              type="button"
                              variant={selectedAmenities.includes(amenity) ? "default" : "outline"}
                              onClick={() => handleAmenityToggle(amenity)}
                              className="w-full rounded-xl justify-start"
                            >
                              {amenity}
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Media Tab */}
            <TabsContent value="media">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="rounded-3xl shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                        <Plus className="h-5 w-5 text-white" />
                      </div>
                      Property Images
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex gap-4">
                      <Input
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        placeholder="Enter image URL"
                        className="rounded-xl border-gray-200 focus:border-black"
                      />
                      <Button
                        type="button"
                        onClick={addImage}
                        className="rounded-xl bg-black text-white hover:bg-gray-800"
                      >
                        Add Image
                      </Button>
                    </div>

                    {imageUrls.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {imageUrls.map((url, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="relative group"
                          >
                            <img
                              src={url}
                              alt={`Property ${index + 1}`}
                              className="w-full h-48 object-cover rounded-xl"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeImage(index)}
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full w-8 h-8 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Action Buttons */}
            <motion.div
              className="flex justify-between items-center pt-8 border-t border-gray-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="rounded-xl px-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl px-8 bg-black text-white hover:bg-gray-800"
              >
                {isSubmitting ? 'Saving...' : property ? 'Update Property' : 'Create Property'}
              </Button>
            </motion.div>
          </form>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default EnhancedPropertyForm;
