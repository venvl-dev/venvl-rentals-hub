

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  User,
  Users,
  AlertCircle,
  Camera
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface UploadedFile {
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
  url?: string;
}

interface BookingData {
  id: string;
  booking_reference: string;
  guests: number;
  adults: number;
  children: number;
  property: {
    title: string;
  };
}

export default function UploadGuestIds() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [mainGuestId, setMainGuestId] = useState<UploadedFile | null>(null);
  const [additionalIds, setAdditionalIds] = useState<UploadedFile[]>([]);
  const [uploadComplete, setUploadComplete] = useState(false);


  useEffect(() => {
    const fetchBooking = async () => {
      try {
        if (!bookingId) {
          throw new Error('No booking ID provided');
        }

        console.log('Fetching booking with ID:', bookingId);

        const { data: bookingData, error } = await supabase
          .from('bookings')
          .select(`
            id,
            booking_reference,
            guests,
            adults,
            children,
            property:properties (
              title
            )
          `)
          .eq('id', bookingId)
          .single();

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        // Calculate adults if not set (backward compatibility)
        const adultsCount = bookingData.adults || bookingData.guests;
        const childrenCount = bookingData.children || 0;

        setBooking({
          ...bookingData,
          adults: adultsCount,
          children: childrenCount,
          property: Array.isArray(bookingData.property)
            ? bookingData.property[0]
            : bookingData.property
        });
      } catch (error) {
        console.error('Error fetching booking:', error);
        toast.error('Failed to load booking details');
        navigate('/guest/bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, navigate]);

  const handleMainGuestIdSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image (JPG, PNG) or PDF file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    const preview = file.type.startsWith('image/')
      ? URL.createObjectURL(file)
      : '';

    setMainGuestId({
      file,
      preview,
      status: 'pending'
    });
  };

  // Handle file selection for additional adults
  const handleAdditionalIdSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const newFiles = files.map(file => {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name}: Please upload a valid image or PDF file`);
        return null;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}: File size must be less than 5MB`);
        return null;
      }

      const preview = file.type.startsWith('image/')
        ? URL.createObjectURL(file)
        : '';

      return {
        file,
        preview,
        status: 'pending' as const
      };
    }).filter(Boolean) as UploadedFile[];

    setAdditionalIds(prev => [...prev, ...newFiles]);
  };

  // Remove file
  const removeFile = (index: number, isMainGuest: boolean) => {
    if (isMainGuest) {
      if (mainGuestId?.preview) {
        URL.revokeObjectURL(mainGuestId.preview);
      }
      setMainGuestId(null);
    } else {
      const newAdditionalIds = [...additionalIds];
      if (newAdditionalIds[index].preview) {
        URL.revokeObjectURL(newAdditionalIds[index].preview);
      }
      newAdditionalIds.splice(index, 1);
      setAdditionalIds(newAdditionalIds);
    }
  };

  // Upload files to Supabase Storage
  const uploadFiles = async () => {
    if (!mainGuestId || !bookingId) {
      toast.error('Please upload your ID first');
      return;
    }

    // Check if we have the required number of IDs
    const adultsCount = booking?.adults || 1;
    const totalIdsRequired = adultsCount;
    const totalIdsUploaded = 1 + additionalIds.length;

    if (totalIdsUploaded < totalIdsRequired) {
      toast.error(`Please upload IDs for all ${adultsCount} adult(s)`);
      return;
    }

    try {
      setUploading(true);

      // Upload main guest ID
      setMainGuestId(prev => prev ? { ...prev, status: 'uploading' } : null);
      const mainGuestPath = `guest-ids/${bookingId}/main-guest-${Date.now()}.${mainGuestId.file.name.split('.').pop()}`;

      const { error: mainUploadError } = await supabase.storage
        .from('booking-documents')
        .upload(mainGuestPath, mainGuestId.file);

      if (mainUploadError) throw mainUploadError;

      const { data: mainUrlData } = supabase.storage
        .from('booking-documents')
        .getPublicUrl(mainGuestPath);

      setMainGuestId(prev => prev ? {
        ...prev,
        status: 'uploaded',
        url: mainUrlData.publicUrl
      } : null);

      const uploadedAdditionalUrls: string[] = [];
      for (let i = 0; i < additionalIds.length; i++) {
        setAdditionalIds(prev => {
          const updated = [...prev];
          updated[i] = { ...updated[i], status: 'uploading' };
          return updated;
        });

        const additionalPath = `guest-ids/${bookingId}/adult-${i + 1}-${Date.now()}.${additionalIds[i].file.name.split('.').pop()}`;

        const { error: uploadError } = await supabase.storage
          .from('booking-documents')
          .upload(additionalPath, additionalIds[i].file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('booking-documents')
          .getPublicUrl(additionalPath);

        uploadedAdditionalUrls.push(urlData.publicUrl);

        setAdditionalIds(prev => {
          const updated = [...prev];
          updated[i] = {
            ...updated[i],
            status: 'uploaded',
            url: urlData.publicUrl
          };
          return updated;
        });
      }

      // Update booking with ID URLs
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          guest_id_documents: {
            main_guest: mainUrlData.publicUrl,
            additional_guests: uploadedAdditionalUrls,
            uploaded_at: new Date().toISOString()
          },
          id_verification_status: 'pending'
        })
        .eq('id', bookingId);

      if (updateError) throw updateError;

      setUploadComplete(true);
      toast.success('IDs uploaded successfully! Redirecting to home page...');

      // Redirect to home page after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload IDs. Please try again.');

      // Reset upload status
      if (mainGuestId) {
        setMainGuestId(prev => prev ? { ...prev, status: 'error' } : null);
      }
      setAdditionalIds(prev => prev.map(id => ({ ...id, status: 'error' })));
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100'>
        <Loader2 className='w-12 h-12 text-gray-600 animate-spin' />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100'>
        <Card className='max-w-md w-full mx-4'>
          <CardContent className='pt-6 text-center'>
            <XCircle className='w-12 h-12 text-red-500 mx-auto mb-4' />
            <h2 className='text-xl font-bold mb-2'>Booking Not Found</h2>
            <p className='text-gray-600 mb-4'>We couldn't find your booking details.</p>
            <Button onClick={() => navigate('/guest/bookings')}>
              Go to My Bookings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const adultsCount = booking.adults || 1;
  const additionalAdultsCount = adultsCount - 1;

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4'>
      <div className='max-w-3xl mx-auto'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='space-y-6'
        >
          {/* Header */}
          <Card className='shadow-xl'>
            <CardHeader className='bg-gradient-to-r from-blue-50 to-indigo-50'>
              <div className='flex items-start justify-between'>
                <div>
                  <CardTitle className='text-2xl mb-2'>Upload Guest IDs</CardTitle>
                  <p className='text-gray-600 text-sm'>
                    Booking: <span className='font-semibold'>{booking.booking_reference}</span>
                  </p>
                  <p className='text-gray-600 text-sm'>
                    Property: <span className='font-semibold'>{booking.property.title}</span>
                  </p>
                </div>
                <Badge className='bg-blue-600 text-white'>
                  Required
                </Badge>
              </div>
            </CardHeader>
            <CardContent className='pt-6'>
              <div className='bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3'>
                <AlertCircle className='h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5' />
                <div className='text-sm text-amber-800'>
                  <p className='font-semibold mb-1'>ID Verification Required</p>
                  <p>
                    Please upload a valid government-issued ID for yourself and all accompanying adults
                    (Ages 13+). This is required to complete your booking.
                  </p>
                  <p className='mt-2 text-xs'>
                    Total adults: <strong>{adultsCount}</strong> |
                    Children: <strong>{booking.children}</strong>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Guest ID Upload */}
          <Card className='shadow-lg'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <User className='h-5 w-5' />
                Your ID (Main Guest)
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {!mainGuestId ? (
                <label className='block'>
                  <input
                    type='file'
                    accept='image/jpeg,image/jpg,image/png,application/pdf'
                    onChange={handleMainGuestIdSelect}
                    className='hidden'
                    disabled={uploading || uploadComplete}
                  />
                  <div className='border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer'>
                    <Upload className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                    <p className='text-sm font-medium text-gray-700 mb-1'>
                      Click to upload your ID
                    </p>
                    <p className='text-xs text-gray-500'>
                      JPG, PNG or PDF (max 5MB)
                    </p>
                  </div>
                </label>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className='border-2 border-gray-200 rounded-xl p-4'
                >
                  <div className='flex items-center gap-4'>
                    {mainGuestId.preview ? (
                      <img
                        src={mainGuestId.preview}
                        alt='Main guest ID'
                        className='w-20 h-20 object-cover rounded-lg'
                      />
                    ) : (
                      <div className='w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center'>
                        <FileText className='w-8 h-8 text-gray-400' />
                      </div>
                    )}
                    <div className='flex-1'>
                      <p className='font-medium text-sm mb-1'>{mainGuestId.file.name}</p>
                      <p className='text-xs text-gray-500'>
                        {(mainGuestId.file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <div className='flex items-center gap-2'>
                      {mainGuestId.status === 'uploading' && (
                        <Loader2 className='w-5 h-5 text-blue-600 animate-spin' />
                      )}
                      {mainGuestId.status === 'uploaded' && (
                        <CheckCircle2 className='w-5 h-5 text-green-600' />
                      )}
                      {mainGuestId.status === 'error' && (
                        <XCircle className='w-5 h-5 text-red-600' />
                      )}
                      {mainGuestId.status === 'pending' && !uploading && (
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => removeFile(0, true)}
                          className='text-red-600 hover:text-red-700 hover:bg-red-50'
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Additional Adults IDs Upload */}
          {additionalAdultsCount > 0 && (
            <Card className='shadow-lg'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Users className='h-5 w-5' />
                  Additional Adult IDs ({additionalIds.length}/{additionalAdultsCount})
                </CardTitle>
                <p className='text-sm text-gray-600 mt-1'>
                  Upload IDs for {additionalAdultsCount} more adult{additionalAdultsCount > 1 ? 's' : ''}
                </p>
              </CardHeader>
              <CardContent className='space-y-4'>
                {/* Uploaded Files */}
                <AnimatePresence>
                  {additionalIds.map((fileData, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className='border-2 border-gray-200 rounded-xl p-4'
                    >
                      <div className='flex items-center gap-4'>
                        {fileData.preview ? (
                          <img
                            src={fileData.preview}
                            alt={`Adult ${index + 1} ID`}
                            className='w-20 h-20 object-cover rounded-lg'
                          />
                        ) : (
                          <div className='w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center'>
                            <FileText className='w-8 h-8 text-gray-400' />
                          </div>
                        )}
                        <div className='flex-1'>
                          <p className='font-medium text-sm mb-1'>
                            Adult {index + 1} - {fileData.file.name}
                          </p>
                          <p className='text-xs text-gray-500'>
                            {(fileData.file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <div className='flex items-center gap-2'>
                          {fileData.status === 'uploading' && (
                            <Loader2 className='w-5 h-5 text-blue-600 animate-spin' />
                          )}
                          {fileData.status === 'uploaded' && (
                            <CheckCircle2 className='w-5 h-5 text-green-600' />
                          )}
                          {fileData.status === 'error' && (
                            <XCircle className='w-5 h-5 text-red-600' />
                          )}
                          {fileData.status === 'pending' && !uploading && (
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => removeFile(index, false)}
                              className='text-red-600 hover:text-red-700 hover:bg-red-50'
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Upload More Button */}
                {additionalIds.length < additionalAdultsCount && (
                  <label className='block'>
                    <input
                      type='file'
                      accept='image/jpeg,image/jpg,image/png,application/pdf'
                      onChange={handleAdditionalIdSelect}
                      multiple
                      className='hidden'
                      disabled={uploading || uploadComplete}
                    />
                    <div className='border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer'>
                      <Camera className='w-10 h-10 text-gray-400 mx-auto mb-3' />
                      <p className='text-sm font-medium text-gray-700 mb-1'>
                        Upload ID for Adult {additionalIds.length + 1}
                      </p>
                      <p className='text-xs text-gray-500'>
                        JPG, PNG or PDF (max 5MB)
                      </p>
                    </div>
                  </label>
                )}
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          {!uploadComplete && (
            <Card className='shadow-lg'>
              <CardContent className='pt-6'>
                <Button
                  onClick={uploadFiles}
                  disabled={
                    uploading ||
                    !mainGuestId ||
                    (additionalAdultsCount > 0 && additionalIds.length < additionalAdultsCount)
                  }
                  className='w-full py-6 text-lg font-semibold'
                  size='lg'
                >
                  {uploading ? (
                    <div className='flex items-center gap-2'>
                      <Loader2 className='w-5 h-5 animate-spin' />
                      Uploading IDs...
                    </div>
                  ) : (
                    'Complete ID Verification'
                  )}
                </Button>
                {additionalAdultsCount > 0 && additionalIds.length < additionalAdultsCount && (
                  <p className='text-center text-sm text-red-600 mt-3'>
                    Please upload IDs for all {adultsCount} adult(s) to continue
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Success Message */}
          {uploadComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className='shadow-xl border-2 border-green-500'>
                <CardContent className='pt-6 text-center'>
                  <CheckCircle2 className='w-16 h-16 text-green-600 mx-auto mb-4' />
                  <h2 className='text-2xl font-bold text-green-900 mb-2'>
                    IDs Uploaded Successfully!
                  </h2>
                  <p className='text-gray-600 mb-4'>
                    Redirecting to booking confirmation...
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
