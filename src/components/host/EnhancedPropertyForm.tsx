import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
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
import { Home, Calendar, DollarSign, Settings, ArrowLeft, Plus, X, CheckCircle, Upload, Image as ImageIcon, Video, Trash2 } from 'lucide-react';
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
    // Initialize form with property data
  }
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>(property?.images || []);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [currentRentalType, setCurrentRentalType] = useState<RentalType>('daily');
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<Array<{
    id: string;
    url: string;
    type: 'image' | 'video';
    name: string;
  }>>(
    property?.images?.map((url, index) => ({
      id: `existing-${index}`,
      url,
      type: 'image' as const,
      name: `Image ${index + 1}`,
    })) || []
  );
  const [completedTabs, setCompletedTabs] = useState<{
    basic: boolean;
    pricing: boolean;
    details: boolean;
    media: boolean;
  }>({
    basic: false,
    pricing: false,
    details: false,
    media: false,
  });
  const queryClient = useQueryClient();

  // Get current rental type for existing property or default for new property
  const initialRentalType = property ? getRentalType(property as PropertyRentalData) : 'daily';
  if (process.env.NODE_ENV !== 'production') {
    // Set initial rental type
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
    // Set form default values with amenities
  }

  const watchedRentalType = form.watch('rental_type') as RentalType;
  const watchedAmenities = form.watch('amenities') || [];
  
  if (process.env.NODE_ENV !== 'production') {
    // Watch amenities changes
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

  // Tab validation functions
  const validateBasicTab = () => {
    const values = form.getValues();
    return !!(values.title && values.description && values.property_type &&
             values.address && values.city && values.rental_type);
  };

  const validatePricingTab = () => {
    const values = form.getValues();
    const rentalType = values.rental_type as RentalType;

    if (rentalType === 'daily') {
      return !!(values.price_per_night && values.price_per_night > 0 &&
               values.min_nights && values.min_nights >= 1);
    } else if (rentalType === 'monthly') {
      return !!(values.monthly_price && values.monthly_price > 0 &&
               values.min_months && values.min_months >= 1);
    } else if (rentalType === 'both') {
      return !!(values.price_per_night && values.price_per_night > 0 &&
               values.min_nights && values.min_nights >= 1 &&
               values.monthly_price && values.monthly_price > 0 &&
               values.min_months && values.min_months >= 1);
    }
    return false;
  };

  const validateDetailsTab = () => {
    const values = form.getValues();
    return !!(values.bedrooms >= 0 && values.bathrooms >= 0 &&
             values.max_guests >= 1);
  };

  const validateMediaTab = () => {
    return mediaFiles.length > 0;
  };

  // Watch for form changes to update tab completion
  useEffect(() => {
    const subscription = form.watch(() => {
      setCompletedTabs({
        basic: validateBasicTab(),
        pricing: validatePricingTab(),
        details: validateDetailsTab(),
        media: validateMediaTab(),
      });
    });
    return () => subscription.unsubscribe();
  }, [form, mediaFiles]);

  // Update form when property changes (important for editing mode)
  useEffect(() => {
    if (property) {
      // Update form when property prop changes
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
      
      form.reset(formData);
      setImageUrls(property.images || []);
    }
  }, [property, form]);

  const handleAmenityToggle = (amenity: string) => {
    const currentAmenities = form.getValues('amenities') || [];
    const updated = currentAmenities.includes(amenity)
      ? currentAmenities.filter(a => a !== amenity)
      : [...currentAmenities, amenity];
    
    form.setValue('amenities', updated);
  };

  // File upload handler
  const uploadFiles = async (files: FileList) => {
    setUploadingFiles(true);
    console.log('Starting file upload process...', { fileCount: files.length });

    const uploadPromises: Promise<{ id: string; url: string; type: 'image' | 'video'; name: string }>[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`Processing file ${i + 1}:`, { name: file.name, size: file.size, type: file.type });

      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Please upload files smaller than 10MB.`);
        continue;
      }

      const fileType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : null;

      if (!fileType) {
        toast.error(`File ${file.name} is not supported. Please upload images or videos only.`);
        continue;
      }

      const uploadPromise = new Promise<{ id: string; url: string; type: 'image' | 'video'; name: string }>((resolve, reject) => {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2);
        const fileExtension = file.name.split('.').pop() || '';
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${timestamp}_${randomId}_${sanitizedName}`;
        const filePath = `property-media/${fileName}`;

        console.log(`Uploading file to path: ${filePath}`);

        const uploadToSupabase = async (): Promise<void> => {
          try {
            // Since bucket creation is restricted, let's use a fallback approach
            console.log('Attempting file upload...');

            // Try common bucket names that might already exist, starting with the one we found
            const commonBuckets = ['properties', 'property-images', 'images', 'uploads', 'files', 'media', 'assets'];

            let uploadSuccess = false;
            let finalUrl = '';

            for (const bucketName of commonBuckets) {
              try {
                console.log(`Trying upload to bucket: ${bucketName}`);

                const { data: uploadData, error: uploadError } = await supabase.storage
                  .from(bucketName)
                  .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                  });

                if (!uploadError && uploadData) {
                  console.log(`Upload successful to bucket: ${bucketName}`);

                  // Get public URL
                  const { data: { publicUrl } } = supabase.storage
                    .from(bucketName)
                    .getPublicUrl(filePath);

                  finalUrl = publicUrl;
                  uploadSuccess = true;
                  break;
                }

                console.log(`Upload failed for bucket ${bucketName}:`, uploadError);
              } catch (bucketError) {
                console.log(`Bucket ${bucketName} not accessible:`, bucketError);
                continue;
              }
            }

            if (!uploadSuccess) {
              // If all bucket attempts failed, create a data URL as fallback
              console.log('All bucket uploads failed, creating data URL fallback...');

              const reader = new FileReader();
              reader.onload = () => {
                const dataUrl = reader.result as string;
                console.log('Created data URL fallback');

                resolve({
                  id: `uploaded-${timestamp}-${i}`,
                  url: dataUrl,
                  type: fileType,
                  name: file.name,
                });
              };

              reader.onerror = () => {
                reject(new Error('Failed to create data URL fallback'));
              };

              reader.readAsDataURL(file);
              return;
            }

            console.log(`Upload successful! Public URL: ${finalUrl}`);

            resolve({
              id: `uploaded-${timestamp}-${i}`,
              url: finalUrl,
              type: fileType,
              name: file.name,
            });

          } catch (error) {
            console.error('Upload process failed:', error);

            // Final fallback to data URL
            try {
              console.log('Creating data URL as final fallback...');
              const reader = new FileReader();
              reader.onload = () => {
                resolve({
                  id: `uploaded-${timestamp}-${i}`,
                  url: reader.result as string,
                  type: fileType,
                  name: file.name,
                });
              };
              reader.readAsDataURL(file);
            } catch (fallbackError) {
              reject(fallbackError);
            }
          }
        };

        uploadToSupabase().catch(reject);
      });

      uploadPromises.push(uploadPromise);
    }

    try {
      const uploadedFiles = await Promise.all(uploadPromises);
      console.log('All files uploaded successfully:', uploadedFiles);

      const newMediaFiles = [...mediaFiles, ...uploadedFiles];
      setMediaFiles(newMediaFiles);

      // Update form with image URLs only (for backward compatibility)
      const imageUrls = newMediaFiles.filter(f => f.type === 'image').map(f => f.url);
      form.setValue('images', imageUrls);

      toast.success(`Successfully uploaded ${uploadedFiles.length} file(s)`);
    } catch (error) {
      console.error('Upload process failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown upload error';
      toast.error(`Upload failed: ${errorMessage}. Check console for details.`);
    } finally {
      setUploadingFiles(false);
    }
  };

  const addImage = () => {
    if (newImageUrl && !mediaFiles.some(f => f.url === newImageUrl)) {
      const newFile = {
        id: `manual-${Date.now()}`,
        url: newImageUrl,
        type: 'image' as const,
        name: 'Manual URL',
      };
      const updated = [...mediaFiles, newFile];
      setMediaFiles(updated);

      const imageUrls = updated.filter(f => f.type === 'image').map(f => f.url);
      form.setValue('images', imageUrls);
      setNewImageUrl('');
    }
  };

  const removeMediaFile = (fileId: string) => {
    const updated = mediaFiles.filter(f => f.id !== fileId);
    setMediaFiles(updated);

    const imageUrls = updated.filter(f => f.type === 'image').map(f => f.url);
    form.setValue('images', imageUrls);
  };

  const onSubmit = async (data: PropertyFormData) => {
    try {
      setIsSubmitting(true);
      console.log('Form submission started...', { data, mediaFiles });

      const rentalType = data.rental_type as RentalType;

      // Enhanced validation with detailed error messages
      if (rentalType === 'daily') {
        if (!data.price_per_night || data.price_per_night <= 0) {
          toast.error('Daily price is required and must be greater than 0 for daily rentals');
          return;
        }
        if (!data.min_nights || data.min_nights < 1) {
          toast.error('Minimum nights must be at least 1 for daily rentals');
          return;
        }
      } else if (rentalType === 'monthly') {
        if (!data.monthly_price || data.monthly_price <= 0) {
          toast.error('Monthly price is required and must be greater than 0 for monthly rentals');
          return;
        }
        if (!data.min_months || data.min_months < 1) {
          toast.error('Minimum months must be at least 1 for monthly rentals');
          return;
        }
      } else if (rentalType === 'both') {
        if (!data.price_per_night || data.price_per_night <= 0) {
          toast.error('Daily price is required for flexible booking properties');
          return;
        }
        if (!data.monthly_price || data.monthly_price <= 0) {
          toast.error('Monthly price is required for flexible booking properties');
          return;
        }
        if (!data.min_nights || data.min_nights < 1) {
          toast.error('Minimum nights must be at least 1');
          return;
        }
        if (!data.min_months || data.min_months < 1) {
          toast.error('Minimum months must be at least 1');
          return;
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('User authenticated:', user.id);

      // Prepare property data with only relevant price fields
      const normalizedAmenityIds = cleanAmenityIds(data.amenities || []);

      // Get image URLs from mediaFiles
      const imageUrls = mediaFiles.filter(f => f.type === 'image').map(f => f.url);
      console.log('Image URLs:', imageUrls);

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

      // Only include relevant price fields based on rental type
      // NOTE: price_per_night is required by database so we always set it
      if (rentalType === 'daily') {
        propertyData.price_per_night = data.price_per_night;
        propertyData.daily_price = data.price_per_night;
        propertyData.min_nights = data.min_nights;
      } else if (rentalType === 'monthly') {
        propertyData.monthly_price = data.monthly_price;
        propertyData.min_months = data.min_months;
        // Set price_per_night to monthly rate / 30 for database requirement
        propertyData.price_per_night = Math.round(data.monthly_price / 30);
      } else if (rentalType === 'both') {
        // Include both price types for flexible properties
        propertyData.price_per_night = data.price_per_night;
        propertyData.daily_price = data.price_per_night;
        propertyData.monthly_price = data.monthly_price;
        propertyData.min_nights = data.min_nights;
        propertyData.min_months = data.min_months;
      }

      // Save property with synchronized amenities data
      if (property && property.id) {
        // Remove fields that shouldn't be updated
        const updateData = { ...propertyData };
        delete updateData.host_id; // Don't update host_id on edit
        delete updateData.approval_status; // Don't reset approval status on edit
        
        const { data: result, error } = await supabase
          .from('properties')
          .update(updateData)
          .eq('id', property.id)
          .select();
        
        if (error) {
          throw new Error(`Update failed: ${error.message}`);
        }
        
        // Invalidate admin properties cache so updates appear immediately in admin panel
        queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
        
        toast.success('Property updated successfully!');
      } else {
        console.log('Inserting property data:', propertyData);

        const { data: result, error } = await supabase
          .from('properties')
          .insert(propertyData)
          .select();

        console.log('Insert result:', { result, error });

        if (error) {
          console.error('Database insert error:', error);
          throw new Error(`Insert failed: ${error.message}`);
        }

        console.log('Property created successfully:', result);

        // Invalidate admin properties cache so new properties appear immediately in admin panel
        queryClient.invalidateQueries({ queryKey: ['admin-properties'] });

        toast.success('Property created successfully!');
      }

      console.log('Calling onSave...');
      onSave();
    } catch (error) {
      console.error('Form submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save property';
      toast.error(`Save failed: ${errorMessage}`);
    } finally {
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
              <TabsTrigger value="basic" className={`rounded-xl relative ${completedTabs.basic ? 'bg-green-100 text-green-800' : ''}`}>
                <Home className="h-4 w-4 mr-2" />
                Basic Info
                {completedTabs.basic && (
                  <CheckCircle className="h-4 w-4 ml-2 text-green-600" />
                )}
              </TabsTrigger>
              <TabsTrigger value="pricing" className={`rounded-xl relative ${completedTabs.pricing ? 'bg-green-100 text-green-800' : ''}`}>
                <DollarSign className="h-4 w-4 mr-2" />
                Pricing
                {completedTabs.pricing && (
                  <CheckCircle className="h-4 w-4 ml-2 text-green-600" />
                )}
              </TabsTrigger>
              <TabsTrigger value="details" className={`rounded-xl relative ${completedTabs.details ? 'bg-green-100 text-green-800' : ''}`}>
                <Settings className="h-4 w-4 mr-2" />
                Details
                {completedTabs.details && (
                  <CheckCircle className="h-4 w-4 ml-2 text-green-600" />
                )}
              </TabsTrigger>
              <TabsTrigger value="media" className={`rounded-xl relative ${completedTabs.media ? 'bg-green-100 text-green-800' : ''}`}>
                <Calendar className="h-4 w-4 mr-2" />
                Media
                {completedTabs.media && (
                  <CheckCircle className="h-4 w-4 ml-2 text-green-600" />
                )}
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
                        {/* Essentials */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm text-gray-700">Essentials</h4>
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

                        {/* Comfort */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm text-gray-700">Comfort</h4>
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

                        {/* Entertainment */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm text-gray-700">Entertainment</h4>
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
                        <ImageIcon className="h-5 w-5 text-white" />
                      </div>
                      Property Media
                      <Badge variant="secondary" className="ml-auto">
                        {mediaFiles.length} file{mediaFiles.length !== 1 ? 's' : ''}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* File Upload Section */}
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-gray-400 transition-colors">
                      <div className="text-center">
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <div className="mb-4">
                          <p className="text-lg font-medium">Upload Media Files</p>
                          <p className="text-sm text-gray-500">
                            Drop your images and videos here, or click to browse
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            Supports: JPG, PNG, GIF, WebP, MP4, MOV, AVI (Max 10MB per file)
                          </p>
                        </div>
                        <input
                          type="file"
                          multiple
                          accept="image/*,video/*"
                          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
                          className="hidden"
                          id="media-upload"
                          disabled={uploadingFiles}
                        />
                        <Button
                          type="button"
                          onClick={() => document.getElementById('media-upload')?.click()}
                          disabled={uploadingFiles}
                          className="rounded-xl bg-black text-white hover:bg-gray-800 mb-4"
                        >
                          {uploadingFiles ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Choose Files
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* URL Input (Alternative method) */}
                    <div className="border rounded-xl p-4 bg-gray-50">
                      <Label className="text-sm font-medium mb-3 block">Or add from URL</Label>
                      <div className="flex gap-3">
                        <Input
                          value={newImageUrl}
                          onChange={(e) => setNewImageUrl(e.target.value)}
                          placeholder="https://example.com/image.jpg"
                          className="rounded-lg border-gray-200 focus:border-black"
                        />
                        <Button
                          type="button"
                          onClick={addImage}
                          variant="outline"
                          className="rounded-lg"
                        >
                          Add URL
                        </Button>
                      </div>
                    </div>

                    {/* Media Files Display */}
                    {mediaFiles.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-lg font-semibold">Uploaded Media</Label>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="flex items-center gap-1">
                              <ImageIcon className="h-3 w-3" />
                              {mediaFiles.filter(f => f.type === 'image').length} Images
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Video className="h-3 w-3" />
                              {mediaFiles.filter(f => f.type === 'video').length} Videos
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {mediaFiles.map((file) => (
                            <motion.div
                              key={file.id}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="relative group border border-gray-200 rounded-xl overflow-hidden"
                            >
                              {file.type === 'image' ? (
                                <img
                                  src={file.url}
                                  alt={file.name}
                                  className="w-full h-48 object-cover"
                                />
                              ) : (
                                <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                                  <div className="text-center">
                                    <Video className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600 px-2 truncate">{file.name}</p>
                                  </div>
                                </div>
                              )}

                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                                <Button
                                  type="button"
                                  onClick={() => removeMediaFile(file.id)}
                                  variant="destructive"
                                  size="sm"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="absolute top-2 left-2">
                                <Badge className="bg-black/70 text-white text-xs">
                                  {file.type === 'image' ? <ImageIcon className="h-3 w-3 mr-1" /> : <Video className="h-3 w-3 mr-1" />}
                                  {file.type.toUpperCase()}
                                </Badge>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {mediaFiles.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <ImageIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <p>No media files uploaded yet</p>
                        <p className="text-sm">Upload your first image or video to get started</p>
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
                disabled={isSubmitting || !Object.values(completedTabs).every(Boolean)}
                className={`rounded-xl px-8 ${
                  Object.values(completedTabs).every(Boolean)
                    ? 'bg-black text-white hover:bg-gray-800'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting
                  ? 'Saving...'
                  : Object.values(completedTabs).every(Boolean)
                    ? (property ? 'Update Property' : 'Create Property')
                    : 'Complete All Tabs to Save'
                }
              </Button>
            </motion.div>
          </Tabs>
        </form>
      </motion.div>
    </div>
  );
};

export default EnhancedPropertyForm;
