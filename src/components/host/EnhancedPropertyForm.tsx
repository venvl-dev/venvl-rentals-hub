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
import { 
  getRentalType, 
  getDailyPrice, 
  getMonthlyPrice, 
  getRentalTypeBadge,
  supportsBookingType,
  type RentalType,
  type PropertyRentalData 
} from '@/lib/rentalTypeUtils';
import { AMENITIES_LIST, cleanAmenityIds, getAmenitiesByCategory } from '@/lib/amenitiesUtils';

// Dynamic schema creator based on rental type
const createPropertySchema = (rentalType: RentalType) => {
  const baseSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    property_type: z.enum(['apartment', 'house', 'villa', 'studio', 'cabin', 'loft']),
    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().optional(),
    country: z.string().default('US'),
    postal_code: z.string().optional(),
    rental_type: z.enum(['daily', 'monthly', 'both']),
    bedrooms: z.number().min(0),
    bathrooms: z.number().min(0),
    max_guests: z.number().min(1),
    amenities: z.array(z.string()).default([]),
    images: z.array(z.string()).default([]),
  });

  // Add conditional validation based on rental type
  if (rentalType === 'daily') {
    return baseSchema.extend({
      price_per_night: z.number().min(1, 'Daily price must be greater than 0'),
      min_nights: z.number().min(1, 'Minimum nights must be at least 1'),
      monthly_price: z.number().optional(),
      min_months: z.number().optional(),
    });
  } else if (rentalType === 'monthly') {
    return baseSchema.extend({
      monthly_price: z.number().min(1, 'Monthly price must be greater than 0'),
      min_months: z.number().min(1, 'Minimum months must be at least 1'),
      price_per_night: z.number().optional(),
      min_nights: z.number().optional(),
    });
  } else {
    // Both types require both prices
    return baseSchema.extend({
      price_per_night: z.number().min(1, 'Daily price must be greater than 0'),
      min_nights: z.number().min(1, 'Minimum nights must be at least 1'),
      monthly_price: z.number().min(1, 'Monthly price must be greater than 0'),
      min_months: z.number().min(1, 'Minimum months must be at least 1'),
    });
  }
};

type PropertyFormData = z.infer<ReturnType<typeof createPropertySchema>>;

interface EnhancedPropertyFormProps {
  property?: Property | null;
  onSave: () => void;
  onCancel: () => void;
}

const EnhancedPropertyForm = ({ property, onSave, onCancel }: EnhancedPropertyFormProps) => {
  // Fixed amenities synchronization: form now uses AMENITIES from amenitiesUtils.ts consistently
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔧 EnhancedPropertyForm - Initial property data:', property);
    console.log('🔧 Property amenities received:', property?.amenities);
  }
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>(property?.images || []);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [currentRentalType, setCurrentRentalType] = useState<RentalType>('daily');

  // Get current rental type for existing property or default for new property
  const initialRentalType = property ? getRentalType(property as PropertyRentalData) : 'daily';
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔧 Initial rental type:', initialRentalType);
  }

  // Create dynamic schema based on current rental type
  const propertySchema = createPropertySchema(currentRentalType);

  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      title: property?.title || '',
      description: property?.description || '',
      property_type: (property?.property_type as 'apartment' | 'house' | 'villa' | 'studio' | 'cabin' | 'loft') || 'apartment',
      address: property?.address || '',
      city: property?.city || '',
      state: property?.state || '',
      country: property?.country || 'US',
      postal_code: property?.postal_code || '',
      rental_type: initialRentalType as RentalType,
      bedrooms: property?.bedrooms || 1,
      bathrooms: property?.bathrooms || 1,
      max_guests: property?.max_guests || 2,
      price_per_night: property ? getDailyPrice(property as PropertyRentalData) : undefined,
      monthly_price: property ? getMonthlyPrice(property as PropertyRentalData) : undefined,
      min_nights: property?.min_nights || 1,
      min_months: property?.min_months || 1,
      amenities: property ? cleanAmenityIds(property.amenities || []) : [],
      images: property?.images || [],
    },
  });

  if (process.env.NODE_ENV !== 'production') {
    console.log('🔧 Form default values - amenities:', property?.amenities || []);
  }

  const watchedRentalType = form.watch('rental_type') as RentalType;
  const watchedAmenities = form.watch('amenities') || [];
  
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔧 Watched amenities:', watchedAmenities);
  }

  // Update schema when rental type changes
  useEffect(() => {
    if (watchedRentalType !== currentRentalType) {
      setCurrentRentalType(watchedRentalType);
      
      // Re-initialize form with new schema
      const newSchema = createPropertySchema(watchedRentalType);
      const currentValues = form.getValues();
      
      // Auto-clear irrelevant fields based on rental type
      if (watchedRentalType === 'daily') {
        currentValues.monthly_price = undefined;
        currentValues.min_months = undefined;
      } else if (watchedRentalType === 'monthly') {
        currentValues.price_per_night = undefined;
        currentValues.min_nights = undefined;
      }
      
      form.reset(currentValues);
    }
  }, [watchedRentalType, currentRentalType, form]);

  // Update form when property changes (important for editing mode)
  useEffect(() => {
    if (property) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔄 Property prop changed, updating form with:', property);
        console.log('🔄 Amenities to load:', property.amenities);
      }
      
      const formData = {
        title: property.title || '',
        description: property.description || '',
        property_type: property.property_type as 'apartment' | 'house' | 'villa' | 'studio' | 'cabin' | 'loft',
        address: property.address || '',
        city: property.city || '',
        state: property.state || '',
        country: property.country || 'US',
        postal_code: property.postal_code || '',
        rental_type: getRentalType(property as PropertyRentalData) as RentalType,
        bedrooms: property.bedrooms || 1,
        bathrooms: property.bathrooms || 1,
        max_guests: property.max_guests || 2,
        price_per_night: getDailyPrice(property as PropertyRentalData),
        monthly_price: getMonthlyPrice(property as PropertyRentalData),
        min_nights: property.min_nights || 1,
        min_months: property.min_months || 1,
        amenities: cleanAmenityIds(property.amenities || []),
        images: property.images || [],
      };
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔄 Form data to reset with:', formData);
        console.log('🔄 Amenities in form data:', formData.amenities);
      }
      
      form.reset(formData);
      setImageUrls(property.images || []);
      
      // Verify form was updated
      setTimeout(() => {
        const currentAmenities = form.getValues('amenities');
        if (process.env.NODE_ENV !== 'production') {
          console.log('🔄 Form amenities after reset:', currentAmenities);
        }
      }, 100);
    }
  }, [property, form]);

  const handleAmenityToggle = (amenity: string) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔧 Toggling amenity:', amenity);
    }
    const currentAmenities = form.getValues('amenities') || [];
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔧 Current amenities before toggle:', currentAmenities);
    }
    
    const updated = currentAmenities.includes(amenity)
      ? currentAmenities.filter(a => a !== amenity)
      : [...currentAmenities, amenity];
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔧 Updated amenities after toggle:', updated);
    }
    form.setValue('amenities', updated);
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔧 Form amenities after setValue:', form.getValues('amenities'));
    }
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
    if (process.env.NODE_ENV !== 'production') {
      console.log('🚀 Starting form submission...');
      console.log('🚀 Form data received:', data);
      console.log('🚀 Amenities in form data:', data.amenities);
      console.log('🚀 Is editing mode?', !!property);
      console.log('🚀 Property ID for edit:', property?.id);
    }
    
    try {
      setIsSubmitting(true);

      const rentalType = data.rental_type as RentalType;
      if (process.env.NODE_ENV !== 'production') {
        console.log('🚀 Rental type:', rentalType);
      }
      
      // Enhanced validation with detailed error messages
      if (rentalType === 'daily') {
        if (!data.price_per_night || data.price_per_night <= 0) {
          console.error('❌ Daily price validation failed:', data.price_per_night);
          toast.error('Daily price is required and must be greater than 0 for daily rentals');
          return;
        }
        if (!data.min_nights || data.min_nights < 1) {
          console.error('❌ Min nights validation failed:', data.min_nights);
          toast.error('Minimum nights must be at least 1 for daily rentals');
          return;
        }
      } else if (rentalType === 'monthly') {
        if (!data.monthly_price || data.monthly_price <= 0) {
          console.error('❌ Monthly price validation failed:', data.monthly_price);
          toast.error('Monthly price is required and must be greater than 0 for monthly rentals');
          return;
        }
        if (!data.min_months || data.min_months < 1) {
          console.error('❌ Min months validation failed:', data.min_months);
          toast.error('Minimum months must be at least 1 for monthly rentals');
          return;
        }
      } else if (rentalType === 'both') {
        if (!data.price_per_night || data.price_per_night <= 0) {
          console.error('❌ Daily price validation failed for both:', data.price_per_night);
          toast.error('Daily price is required for flexible booking properties');
          return;
        }
        if (!data.monthly_price || data.monthly_price <= 0) {
          console.error('❌ Monthly price validation failed for both:', data.monthly_price);
          toast.error('Monthly price is required for flexible booking properties');
          return;
        }
        if (!data.min_nights || data.min_nights < 1) {
          console.error('❌ Min nights validation failed for both:', data.min_nights);
          toast.error('Minimum nights must be at least 1');
          return;
        }
        if (!data.min_months || data.min_months < 1) {
          console.error('❌ Min months validation failed for both:', data.min_months);
          toast.error('Minimum months must be at least 1');
          return;
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ User not authenticated');
        throw new Error('User not authenticated');
      }
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ User authenticated:', user.id);
      }

      // Prepare property data with only relevant price fields
      const normalizedAmenityIds = cleanAmenityIds(data.amenities || []);

      const propertyData: any = {
        title: data.title,
        description: data.description,
        property_type: data.property_type,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country || 'US',
        postal_code: data.postal_code,
        rental_type: data.rental_type,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        max_guests: data.max_guests,
        host_id: user.id,
        amenities: normalizedAmenityIds,
        images: imageUrls,
        // Ensure booking_types is always an array for consistency
        booking_types: rentalType === 'both' ? ['daily', 'monthly'] : [rentalType],
        is_active: true,
        approval_status: 'pending'
      };

      if (process.env.NODE_ENV !== 'production') {
        console.log('🚀 Property data before price fields:', propertyData);
        console.log('🚀 Amenities being saved:', propertyData.amenities);
      }

      // Only include relevant price fields based on rental type (don't set null values)
      if (rentalType === 'daily') {
        propertyData.price_per_night = data.price_per_night;
        propertyData.daily_price = data.price_per_night;
        propertyData.min_nights = data.min_nights;
        // Don't include monthly fields for daily-only properties
      } else if (rentalType === 'monthly') {
        propertyData.monthly_price = data.monthly_price;
        propertyData.min_months = data.min_months;
        // Don't include daily fields for monthly-only properties
      } else if (rentalType === 'both') {
        // Include both price types for flexible properties
        propertyData.price_per_night = data.price_per_night;
        propertyData.daily_price = data.price_per_night;
        propertyData.monthly_price = data.monthly_price;
        propertyData.min_nights = data.min_nights;
        propertyData.min_months = data.min_months;
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log('🚀 Final property data to save:', propertyData);
      }

      // Save property with synchronized amenities data
      if (property) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('🔄 Updating existing property...');
        }
        // Remove fields that shouldn't be updated
        const updateData = { ...propertyData };
        delete updateData.host_id; // Don't update host_id on edit
        delete updateData.approval_status; // Don't reset approval status on edit
        
        if (process.env.NODE_ENV !== 'production') {
          console.log('🔄 Update data being sent:', updateData);
        }
        
        const { data: result, error } = await supabase
          .from('properties')
          .update(updateData)
          .eq('id', property.id)
          .select();
        
        if (error) {
          console.error('❌ Update error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            updateData: updateData
          });
          throw new Error(`Update failed: ${error.message}`);
        }
        
        if (process.env.NODE_ENV !== 'production') {
          console.log('✅ Property updated successfully:', result);
        }
        toast.success('Property updated successfully!');
      } else {
        if (process.env.NODE_ENV !== 'production') {
          console.log('➕ Creating new property...');
          console.log('➕ Insert data being sent:', propertyData);
        }
        
        const { data: result, error } = await supabase
          .from('properties')
          .insert(propertyData)
          .select();
        
        if (error) {
          console.error('❌ Insert error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            propertyData: propertyData
          });
          throw new Error(`Insert failed: ${error.message}`);
        }
        
        if (process.env.NODE_ENV !== 'production') {
          console.log('✅ Property created successfully:', result);
        }
        toast.success('Property created successfully!');
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ Calling onSave callback...');
      }
      onSave();
    } catch (error) {
      console.error('❌ Error saving property:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save property';
      console.error('❌ Error message for user:', errorMessage);
      toast.error(`Save failed: ${errorMessage}`);
    } finally {
      if (process.env.NODE_ENV !== 'production') {
        console.log('🏁 Setting isSubmitting to false');
      }
      setIsSubmitting(false);
    }
  };

  // Get rental type badge for current selection
  const getRentalTypeBadgeForForm = (type: RentalType) => {
    return getRentalTypeBadge(type);
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
              <p className="text-gray-600">
                {property ? 'Update your property details' : 'Create a new listing for your property'}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 rounded-2xl p-1 bg-gray-100">
              <TabsTrigger value="basic" className="rounded-xl">
                <Home className="h-4 w-4 mr-2" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="pricing" className="rounded-xl">
                <DollarSign className="h-4 w-4 mr-2" />
                Pricing
              </TabsTrigger>
              <TabsTrigger value="details" className="rounded-xl">
                <Settings className="h-4 w-4 mr-2" />
                Details
              </TabsTrigger>
              <TabsTrigger value="media" className="rounded-xl">
                <Calendar className="h-4 w-4 mr-2" />
                Media
              </TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            <SelectItem value="cabin">Cabin</SelectItem>
                            <SelectItem value="loft">Loft</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="rental_type">Rental Type *</Label>
                        <Select
                          value={form.watch('rental_type')}
                          onValueChange={(value) => form.setValue('rental_type', value as RentalType)}
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
                        {watchedRentalType && (
                          <div className="mt-2">
                            <Badge className={getRentalTypeBadgeForForm(watchedRentalType as RentalType).color}>
                              {getRentalTypeBadgeForForm(watchedRentalType as RentalType).label}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="address">Address *</Label>
                        <Input
                          id="address"
                          {...form.register('address')}
                          placeholder="123 Main Street"
                          className="rounded-xl border-gray-200 focus:border-black"
                        />
                        {form.formState.errors.address && (
                          <p className="text-red-500 text-sm">{form.formState.errors.address.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          {...form.register('city')}
                          placeholder="New York"
                          className="rounded-xl border-gray-200 focus:border-black"
                        />
                        {form.formState.errors.city && (
                          <p className="text-red-500 text-sm">{form.formState.errors.city.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          {...form.register('state')}
                          placeholder="NY"
                          className="rounded-xl border-gray-200 focus:border-black"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          {...form.register('country')}
                          placeholder="US"
                          className="rounded-xl border-gray-200 focus:border-black"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postal_code">Postal Code</Label>
                        <Input
                          id="postal_code"
                          {...form.register('postal_code')}
                          placeholder="10001"
                          className="rounded-xl border-gray-200 focus:border-black"
                        />
                      </div>
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
                    {/* Show current rental type info */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">Current Rental Type:</span>
                        <Badge className={getRentalTypeBadgeForForm(watchedRentalType as RentalType).color}>
                          {getRentalTypeBadgeForForm(watchedRentalType as RentalType).label}
                        </Badge>
                      </div>
                    </div>

                    <AnimatePresence mode="wait">
                      {/* Daily Pricing - Only show if supports daily rentals */}
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
                              <Label htmlFor="price_per_night">
                                Nightly Rate (EGP) *
                              </Label>
                              <Input
                                id="price_per_night"
                                type="number"
                                step="0.01"
                                {...form.register('price_per_night', { valueAsNumber: true })}
                                placeholder="250.00"
                                className="rounded-xl border-gray-200 focus:border-black"
                              />
                              {form.formState.errors.price_per_night && (
                                <p className="text-red-500 text-sm">{form.formState.errors.price_per_night.message}</p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="min_nights">Minimum Days *</Label>
                              <Input
                                id="min_nights"
                                type="number"
                                {...form.register('min_nights', { valueAsNumber: true })}
                                placeholder="1"
                                className="rounded-xl border-gray-200 focus:border-black"
                              />
                              {form.formState.errors.min_nights && (
                                <p className="text-red-500 text-sm">{form.formState.errors.min_nights.message}</p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Monthly Pricing - Only show if supports monthly rentals */}
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
                              <Label htmlFor="monthly_price">
                                Monthly Rate (EGP) *
                              </Label>
                              <Input
                                id="monthly_price"
                                type="number"
                                step="0.01"
                                {...form.register('monthly_price', { valueAsNumber: true })}
                                placeholder="6500.00"
                                className="rounded-xl border-gray-200 focus:border-black"
                              />
                              {form.formState.errors.monthly_price && (
                                <p className="text-red-500 text-sm">{form.formState.errors.monthly_price.message}</p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="min_months">Minimum Months *</Label>
                              <Input
                                id="min_months"
                                type="number"
                                {...form.register('min_months', { valueAsNumber: true })}
                                placeholder="1"
                                className="rounded-xl border-gray-200 focus:border-black"
                              />
                              {form.formState.errors.min_months && (
                                <p className="text-red-500 text-sm">{form.formState.errors.min_months.message}</p>
                              )}
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
                      <div className="space-y-6">
                        {/* الأساسيات */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm text-gray-700">الأساسيات</h4>
                            <div className="flex-1 h-px bg-gray-200"></div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {AMENITIES_LIST.filter(amenity => amenity.category === 'essential').map((amenity) => {
                              const IconComponent = amenity.icon;
                              const isSelected = watchedAmenities.includes(amenity.id);
                              
                              return (
                                <motion.div
                                  key={amenity.id}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <Button
                                    type="button"
                                    variant={isSelected ? "default" : "outline"}
                                    onClick={() => handleAmenityToggle(amenity.id)}
                                    className="w-full rounded-xl justify-start h-auto p-3"
                                  >
                                    <IconComponent className="h-5 w-5 mr-2 flex-shrink-0" />
                                    <span className="text-sm font-medium">{amenity.name}</span>
                                  </Button>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>

                        {/* الراحة */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm text-gray-700">الراحة</h4>
                            <div className="flex-1 h-px bg-gray-200"></div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {AMENITIES_LIST.filter(amenity => amenity.category === 'comfort').map((amenity) => {
                              const IconComponent = amenity.icon;
                              const isSelected = watchedAmenities.includes(amenity.id);
                              
                              return (
                                <motion.div
                                  key={amenity.id}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <Button
                                    type="button"
                                    variant={isSelected ? "default" : "outline"}
                                    onClick={() => handleAmenityToggle(amenity.id)}
                                    className="w-full rounded-xl justify-start h-auto p-3"
                                  >
                                    <IconComponent className="h-5 w-5 mr-2 flex-shrink-0" />
                                    <span className="text-sm font-medium">{amenity.name}</span>
                                  </Button>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>

                        {/* الترفيه */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm text-gray-700">الترفيه</h4>
                            <div className="flex-1 h-px bg-gray-200"></div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {AMENITIES_LIST.filter(amenity => amenity.category === 'entertainment').map((amenity) => {
                              const IconComponent = amenity.icon;
                              const isSelected = watchedAmenities.includes(amenity.id);
                              
                              return (
                                <motion.div
                                  key={amenity.id}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <Button
                                    type="button"
                                    variant={isSelected ? "default" : "outline"}
                                    onClick={() => handleAmenityToggle(amenity.id)}
                                    className="w-full rounded-xl justify-start h-auto p-3"
                                  >
                                    <IconComponent className="h-5 w-5 mr-2 flex-shrink-0" />
                                    <span className="text-sm font-medium">{amenity.name}</span>
                                  </Button>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
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
          </Tabs>
        </form>
      </motion.div>
    </div>
  );
};

export default EnhancedPropertyForm;
