

// import { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { motion, AnimatePresence } from 'framer-motion';
// import {
//   Upload,
//   CheckCircle2,
//   XCircle,
//   Loader2,
//   FileText,
//   User,
//   Users,
//   AlertCircle,
//   Camera
// } from 'lucide-react';
// import { supabase } from '@/integrations/supabase/client';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import { toast } from 'sonner';

// interface UploadedFile {
//   file: File;
//   preview: string;
//   status: 'pending' | 'uploading' | 'uploaded' | 'error';
//   url?: string;
// }

// interface BookingData {
//   id: string;
//   booking_reference: string;
//   guests: number;
//   adults: number;
//   children: number;
//   property: {
//     title: string;
//   };
// }

// export default function UploadGuestIds() {
//   const { bookingId } = useParams<{ bookingId: string }>();
//   const navigate = useNavigate();

//   const [booking, setBooking] = useState<BookingData | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [uploading, setUploading] = useState(false);
//   const [mainGuestId, setMainGuestId] = useState<UploadedFile | null>(null);
//   const [additionalIds, setAdditionalIds] = useState<UploadedFile[]>([]);
//   const [uploadComplete, setUploadComplete] = useState(false);


//   useEffect(() => {
//     const fetchBooking = async () => {
//       try {
//         if (!bookingId) {
//           throw new Error('No booking ID provided');
//         }

//         console.log('Fetching booking with ID:', bookingId);

//         const { data: bookingData, error } = await supabase
//           .from('bookings')
//           .select(`
//             id,
//             booking_reference,
//             guests,
//             adults,
//             children,
//             property:properties (
//               title
//             )
//           `)
//           .eq('id', bookingId)
//           .single();

//         if (error) {
//           console.error('Supabase error:', error);
//           throw error;
//         }

//         // Calculate adults if not set (backward compatibility)
//         const adultsCount = bookingData.adults || bookingData.guests;
//         const childrenCount = bookingData.children || 0;

//         setBooking({
//           ...bookingData,
//           adults: adultsCount,
//           children: childrenCount,
//           property: Array.isArray(bookingData.property)
//             ? bookingData.property[0]
//             : bookingData.property
//         });
//       } catch (error) {
//         console.error('Error fetching booking:', error);
//         toast.error('Failed to load booking details');
//         navigate('/guest/bookings');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchBooking();
//   }, [bookingId, navigate]);

//   const handleMainGuestIdSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
//     if (!validTypes.includes(file.type)) {
//       toast.error('Please upload a valid image (JPG, PNG) or PDF file');
//       return;
//     }

//     if (file.size > 5 * 1024 * 1024) {
//       toast.error('File size must be less than 5MB');
//       return;
//     }

//     const preview = file.type.startsWith('image/')
//       ? URL.createObjectURL(file)
//       : '';

//     setMainGuestId({
//       file,
//       preview,
//       status: 'pending'
//     });
//   };

//   // Handle file selection for additional adults
//   const handleAdditionalIdSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const files = Array.from(e.target.files || []);

//     const newFiles = files.map(file => {
//       // Validate file type
//       const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
//       if (!validTypes.includes(file.type)) {
//         toast.error(`${file.name}: Please upload a valid image or PDF file`);
//         return null;
//       }

//       // Validate file size (max 5MB)
//       if (file.size > 5 * 1024 * 1024) {
//         toast.error(`${file.name}: File size must be less than 5MB`);
//         return null;
//       }

//       const preview = file.type.startsWith('image/')
//         ? URL.createObjectURL(file)
//         : '';

//       return {
//         file,
//         preview,
//         status: 'pending' as const
//       };
//     }).filter(Boolean) as UploadedFile[];

//     setAdditionalIds(prev => [...prev, ...newFiles]);
//   };

//   // Remove file
//   const removeFile = (index: number, isMainGuest: boolean) => {
//     if (isMainGuest) {
//       if (mainGuestId?.preview) {
//         URL.revokeObjectURL(mainGuestId.preview);
//       }
//       setMainGuestId(null);
//     } else {
//       const newAdditionalIds = [...additionalIds];
//       if (newAdditionalIds[index].preview) {
//         URL.revokeObjectURL(newAdditionalIds[index].preview);
//       }
//       newAdditionalIds.splice(index, 1);
//       setAdditionalIds(newAdditionalIds);
//     }
//   };

//   // Upload files to Supabase Storage
//   const uploadFiles = async () => {
//     if (!mainGuestId || !bookingId) {
//       toast.error('Please upload your ID first');
//       return;
//     }

//     // Check if we have the required number of IDs
//     const adultsCount = booking?.adults || 1;
//     const totalIdsRequired = adultsCount;
//     const totalIdsUploaded = 1 + additionalIds.length;

//     if (totalIdsUploaded < totalIdsRequired) {
//       toast.error(`Please upload IDs for all ${adultsCount} adult(s)`);
//       return;
//     }

//     try {
//       setUploading(true);

//       // Upload main guest ID
//       setMainGuestId(prev => prev ? { ...prev, status: 'uploading' } : null);
//       const mainGuestPath = `guest-ids/${bookingId}/main-guest-${Date.now()}.${mainGuestId.file.name.split('.').pop()}`;

//       const { error: mainUploadError } = await supabase.storage
//         .from('booking-documents')
//         .upload(mainGuestPath, mainGuestId.file);

//       if (mainUploadError) throw mainUploadError;

//       const { data: mainUrlData } = supabase.storage
//         .from('booking-documents')
//         .getPublicUrl(mainGuestPath);

//       setMainGuestId(prev => prev ? {
//         ...prev,
//         status: 'uploaded',
//         url: mainUrlData.publicUrl
//       } : null);

//       const uploadedAdditionalUrls: string[] = [];
//       for (let i = 0; i < additionalIds.length; i++) {
//         setAdditionalIds(prev => {
//           const updated = [...prev];
//           updated[i] = { ...updated[i], status: 'uploading' };
//           return updated;
//         });

//         const additionalPath = `guest-ids/${bookingId}/adult-${i + 1}-${Date.now()}.${additionalIds[i].file.name.split('.').pop()}`;

//         const { error: uploadError } = await supabase.storage
//           .from('booking-documents')
//           .upload(additionalPath, additionalIds[i].file);

//         if (uploadError) throw uploadError;

//         const { data: urlData } = supabase.storage
//           .from('booking-documents')
//           .getPublicUrl(additionalPath);

//         uploadedAdditionalUrls.push(urlData.publicUrl);

//         setAdditionalIds(prev => {
//           const updated = [...prev];
//           updated[i] = {
//             ...updated[i],
//             status: 'uploaded',
//             url: urlData.publicUrl
//           };
//           return updated;
//         });
//       }

//       // Update booking with ID URLs
//       const { error: updateError } = await supabase
//         .from('bookings')
//         .update({
//           guest_id_documents: {
//             main_guest: mainUrlData.publicUrl,
//             additional_guests: uploadedAdditionalUrls,
//             uploaded_at: new Date().toISOString()
//           },
//           id_verification_status: 'pending'
//         })
//         .eq('id', bookingId);

//       if (updateError) throw updateError;

//       setUploadComplete(true);
//       toast.success('IDs uploaded successfully! Redirecting to home page...');

//       // Redirect to home page after 2 seconds
//       setTimeout(() => {
//         navigate('/');
//       }, 2000);

//     } catch (error) {
//       console.error('Error uploading files:', error);
//       toast.error('Failed to upload IDs. Please try again.');

//       // Reset upload status
//       if (mainGuestId) {
//         setMainGuestId(prev => prev ? { ...prev, status: 'error' } : null);
//       }
//       setAdditionalIds(prev => prev.map(id => ({ ...id, status: 'error' })));
//     } finally {
//       setUploading(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100'>
//         <Loader2 className='w-12 h-12 text-gray-600 animate-spin' />
//       </div>
//     );
//   }

//   if (!booking) {
//     return (
//       <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100'>
//         <Card className='max-w-md w-full mx-4'>
//           <CardContent className='pt-6 text-center'>
//             <XCircle className='w-12 h-12 text-red-500 mx-auto mb-4' />
//             <h2 className='text-xl font-bold mb-2'>Booking Not Found</h2>
//             <p className='text-gray-600 mb-4'>We couldn't find your booking details.</p>
//             <Button onClick={() => navigate('/guest/bookings')}>
//               Go to My Bookings
//             </Button>
//           </CardContent>
//         </Card>
//       </div>
//     );
//   }

//   const adultsCount = booking.adults || 1;
//   const additionalAdultsCount = adultsCount - 1;

//   return (
//     <div className='min-h-screen bg-gray-50 py-12 px-4'>
//       <div className='max-w-4xl mx-auto'>
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           className='space-y-8'
//         >
//           {/* Header with Progress */}
//           <div className='text-center space-y-4'>
//             <motion.div
//               initial={{ scale: 0 }}
//               animate={{ scale: 1 }}
//               transition={{ type: 'spring', stiffness: 200 }}
//               className='w-20 h-20 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto shadow-lg'
//             >
//               <FileText className='w-10 h-10 text-white' />
//             </motion.div>
//             <h1 className='text-4xl font-bold text-gray-900'>Upload Guest IDs</h1>
//             <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
//               Complete your booking by uploading valid identification documents
//             </p>
//           </div>

//           {/* Booking Info Card */}
//           <Card className='shadow-lg border border-gray-200'>
//             <div className='bg-gray-900 p-6 text-white'>
//               <div className='flex items-center justify-between flex-wrap gap-4'>
//                 <div className='space-y-2'>
//                   <div className='flex items-center gap-2'>
//                     <Badge className='bg-white/20 text-white border-white/30 hover:bg-white/30'>
//                       {booking.booking_reference}
//                     </Badge>
//                   </div>
//                   <p className='text-gray-300 text-sm'>
//                     {booking.property.title}
//                   </p>
//                 </div>
//                 <div className='flex items-center gap-6 text-sm'>
//                   <div className='text-center'>
//                     <div className='text-3xl font-bold'>{adultsCount}</div>
//                     <div className='text-gray-400'>Adults</div>
//                   </div>
//                   {booking.children > 0 && (
//                     <div className='text-center'>
//                       <div className='text-3xl font-bold'>{booking.children}</div>
//                       <div className='text-gray-400'>Children</div>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//             <CardContent className='p-6'>
//               <div className='bg-amber-50 border border-amber-300 rounded-xl p-6 flex gap-4'>
//                 <div className='flex-shrink-0'>
//                   <div className='w-12 h-12 bg-white rounded-full flex items-center justify-center border border-amber-300'>
//                     <AlertCircle className='h-6 w-6 text-amber-600' />
//                   </div>
//                 </div>
//                 <div className='space-y-2'>
//                   <h3 className='font-bold text-gray-900 text-lg'></h3>
//                   <p className='text-gray-700 leading-relaxed'>
//                     Please upload a valid government-issued ID (Passport, National ID, or Driver's License)
//                     for yourself and all accompanying adults aged 13+. This is mandatory to complete your booking.
//                   </p>
//                   <div className='flex items-center gap-4 pt-2 text-sm font-medium text-gray-700'>
//                     <div className='flex items-center gap-2'>
//                       <CheckCircle2 className='w-4 h-4' />
//                       <span>Clear Photo</span>
//                     </div>
//                     <div className='flex items-center gap-2'>
//                       <CheckCircle2 className='w-4 h-4' />
//                       <span>Valid Document</span>
//                     </div>
//                     <div className='flex items-center gap-2'>
//                       <CheckCircle2 className='w-4 h-4' />
//                       <span>Under 5MB</span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           {/* Main Guest ID Upload */}
//           <Card className='shadow-lg border border-gray-200'>
//             <div className='bg-gray-900 p-4'>
//               <div className='flex items-center gap-3 text-white'>
//                 <div className='w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center'>
//                   <User className='h-5 w-5' />
//                 </div>
//                 <div>
//                   <h3 className='font-bold text-lg'>Your ID (Main Guest)</h3>
//                   <p className='text-gray-400 text-sm'>Step 1 of {adultsCount}</p>
//                 </div>
//               </div>
//             </div>
//             <CardContent className='p-6'>
//               {!mainGuestId ? (
//                 <label className='block'>
//                   <input
//                     type='file'
//                     accept='image/jpeg,image/jpg,image/png,application/pdf'
//                     onChange={handleMainGuestIdSelect}
//                     className='hidden'
//                     disabled={uploading || uploadComplete}
//                   />
//                   <motion.div
//                     whileHover={{ scale: 1.02 }}
//                     whileTap={{ scale: 0.98 }}
//                     className='border-2 border-dashed border-gray-300 rounded-xl p-12 text-center bg-white hover:border-gray-900 hover:bg-gray-50 transition-all cursor-pointer group'
//                   >
//                     <div className='w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-gray-900 transition-colors'>
//                       <Upload className='w-10 h-10 text-gray-400 group-hover:text-white transition-colors' />
//                     </div>
//                     <p className='text-lg font-bold text-gray-900 mb-2'>
//                       Click to upload your ID
//                     </p>
//                     <p className='text-sm text-gray-600 mb-4'>
//                       or drag and drop here
//                     </p>
//                     <div className='flex items-center justify-center gap-2 text-xs text-gray-500'>
//                       <Badge variant='outline'>JPG</Badge>
//                       <Badge variant='outline'>PNG</Badge>
//                       <Badge variant='outline'>PDF</Badge>
//                       <span>•</span>
//                       <span>Max 5MB</span>
//                     </div>
//                   </motion.div>
//                 </label>
//               ) : (
//                 <motion.div
//                   initial={{ opacity: 0, scale: 0.9 }}
//                   animate={{ opacity: 1, scale: 1 }}
//                   className='bg-gray-50 border-2 border-gray-200 rounded-xl p-6'
//                 >
//                   <div className='flex items-center gap-6'>
//                     <div className='relative'>
//                       {mainGuestId.preview ? (
//                         <img
//                           src={mainGuestId.preview}
//                           alt='Main guest ID'
//                           className='w-24 h-24 object-cover rounded-lg shadow-md border border-gray-300'
//                         />
//                       ) : (
//                         <div className='w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center shadow-md border border-gray-300'>
//                           <FileText className='w-10 h-10 text-gray-400' />
//                         </div>
//                       )}
//                       {mainGuestId.status === 'uploaded' && (
//                         <div className='absolute -top-2 -right-2 w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center ring-2 ring-white shadow-lg'>
//                           <CheckCircle2 className='w-5 h-5 text-white' />
//                         </div>
//                       )}
//                     </div>
//                     <div className='flex-1'>
//                       <p className='font-bold text-gray-900 mb-1'>{mainGuestId.file.name}</p>
//                       <div className='flex items-center gap-3 text-sm text-gray-600'>
//                         <span>{(mainGuestId.file.size / 1024).toFixed(1)} KB</span>
//                         {mainGuestId.status === 'uploaded' && (
//                           <Badge className='bg-gray-900 text-white'>Uploaded</Badge>
//                         )}
//                         {mainGuestId.status === 'uploading' && (
//                           <Badge className='bg-gray-600 text-white'>Uploading...</Badge>
//                         )}
//                       </div>
//                     </div>
//                     <div className='flex items-center gap-2'>
//                       {mainGuestId.status === 'uploading' && (
//                         <Loader2 className='w-6 h-6 text-gray-900 animate-spin' />
//                       )}
//                       {mainGuestId.status === 'error' && (
//                         <XCircle className='w-6 h-6 text-red-600' />
//                       )}
//                       {mainGuestId.status === 'pending' && !uploading && (
//                         <Button
//                           variant='outline'
//                           size='sm'
//                           onClick={() => removeFile(0, true)}
//                           className='text-red-600 hover:bg-red-50'
//                         >
//                           Remove
//                         </Button>
//                       )}
//                     </div>
//                   </div>
//                 </motion.div>
//               )}
//             </CardContent>
//           </Card>

//           {/* Additional Adults IDs Upload */}
//           {additionalAdultsCount > 0 && (
//             <Card className='shadow-lg border border-gray-200'>
//               <div className='bg-gray-900 p-4'>
//                 <div className='flex items-center justify-between'>
//                   <div className='flex items-center gap-3 text-white'>
//                     <div className='w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center'>
//                       <Users className='h-5 w-5' />
//                     </div>
//                     <div>
//                       <h3 className='font-bold text-lg'>Additional Adult IDs</h3>
//                       <p className='text-gray-400 text-sm'>
//                         {additionalAdultsCount} more adult{additionalAdultsCount > 1 ? 's' : ''} required
//                       </p>
//                     </div>
//                   </div>
//                   <div className='bg-white/20 rounded-full px-4 py-2'>
//                     <span className='text-white font-bold text-lg'>
//                       {additionalIds.length}/{additionalAdultsCount}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//               <CardContent className='space-y-4'>
//                 {/* Uploaded Files */}
//                 <AnimatePresence>
//                   {additionalIds.map((fileData, index) => (
//                     <motion.div
//                       key={index}
//                       initial={{ opacity: 0, scale: 0.9 }}
//                       animate={{ opacity: 1, scale: 1 }}
//                       exit={{ opacity: 0, scale: 0.9 }}
//                       className='border-2 border-gray-200 rounded-xl p-4'
//                     >
//                       <div className='flex items-center gap-4'>
//                         {fileData.preview ? (
//                           <img
//                             src={fileData.preview}
//                             alt={`Adult ${index + 1} ID`}
//                             className='w-20 h-20 object-cover rounded-lg'
//                           />
//                         ) : (
//                           <div className='w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center'>
//                             <FileText className='w-8 h-8 text-gray-400' />
//                           </div>
//                         )}
//                         <div className='flex-1'>
//                           <p className='font-medium text-sm mb-1'>
//                             Adult {index + 1} - {fileData.file.name}
//                           </p>
//                           <p className='text-xs text-gray-500'>
//                             {(fileData.file.size / 1024).toFixed(1)} KB
//                           </p>
//                         </div>
//                         <div className='flex items-center gap-2'>
//                           {fileData.status === 'uploading' && (
//                             <Loader2 className='w-5 h-5 text-blue-600 animate-spin' />
//                           )}
//                           {fileData.status === 'uploaded' && (
//                             <CheckCircle2 className='w-5 h-5 text-green-600' />
//                           )}
//                           {fileData.status === 'error' && (
//                             <XCircle className='w-5 h-5 text-red-600' />
//                           )}
//                           {fileData.status === 'pending' && !uploading && (
//                             <Button
//                               variant='ghost'
//                               size='sm'
//                               onClick={() => removeFile(index, false)}
//                               className='text-red-600 hover:text-red-700 hover:bg-red-50'
//                             >
//                               Remove
//                             </Button>
//                           )}
//                         </div>
//                       </div>
//                     </motion.div>
//                   ))}
//                 </AnimatePresence>

//                 {/* Upload More Button */}
//                 {additionalIds.length < additionalAdultsCount && (
//                   <label className='block'>
//                     <input
//                       type='file'
//                       accept='image/jpeg,image/jpg,image/png,application/pdf'
//                       onChange={handleAdditionalIdSelect}
//                       multiple
//                       className='hidden'
//                       disabled={uploading || uploadComplete}
//                     />
//                     <div className='border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer'>
//                       <Camera className='w-10 h-10 text-gray-400 mx-auto mb-3' />
//                       <p className='text-sm font-medium text-gray-700 mb-1'>
//                         Upload ID for Adult {additionalIds.length + 1}
//                       </p>
//                       <p className='text-xs text-gray-500'>
//                         JPG, PNG or PDF (max 5MB)
//                       </p>
//                     </div>
//                   </label>
//                 )}
//               </CardContent>
//             </Card>
//           )}

//           {/* Submit Button */}
//           {!uploadComplete && (
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.2 }}
//             >
//               <Card className='shadow-lg border border-gray-200'>
//                 <CardContent className='p-6'>
//                   <Button
//                     onClick={uploadFiles}
//                     disabled={
//                       uploading ||
//                       !mainGuestId ||
//                       (additionalAdultsCount > 0 && additionalIds.length < additionalAdultsCount)
//                     }
//                     className='w-full py-6 text-lg font-bold bg-gray-900 hover:bg-gray-800 text-white disabled:bg-gray-300 disabled:text-gray-500'
//                     size='lg'
//                   >
//                     {uploading ? (
//                       <div className='flex items-center gap-3'>
//                         <Loader2 className='w-5 h-5 animate-spin' />
//                         <span>Uploading Your Documents...</span>
//                       </div>
//                     ) : (
//                       <div className='flex items-center gap-3'>
//                         <CheckCircle2 className='w-5 h-5' />
//                         <span>Complete ID Verification</span>
//                       </div>
//                     )}
//                   </Button>
//                   {additionalAdultsCount > 0 && additionalIds.length < additionalAdultsCount && (
//                     <motion.p
//                       initial={{ opacity: 0 }}
//                       animate={{ opacity: 1 }}
//                       className='text-center text-sm text-red-600 mt-4 bg-red-50 rounded-lg py-2 px-4 border border-red-200'
//                     >
//                       ⚠️ Please upload IDs for all {adultsCount} adult(s) to continue
//                     </motion.p>
//                   )}
//                 </CardContent>
//               </Card>
//             </motion.div>
//           )}

//           {/* Success Message */}
//           {uploadComplete && (
//             <motion.div
//               initial={{ opacity: 0, scale: 0.9 }}
//               animate={{ opacity: 1, scale: 1 }}
//               transition={{ type: 'spring', stiffness: 200 }}
//             >
//               <Card className='shadow-lg border border-gray-200'>
//                 <div className='bg-gray-900 p-12 text-center text-white'>
//                   <motion.div
//                     initial={{ scale: 0 }}
//                     animate={{ scale: 1 }}
//                     transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
//                     className='w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg'
//                   >
//                     <CheckCircle2 className='w-14 h-14 text-gray-900' />
//                   </motion.div>
//                   <h2 className='text-4xl font-bold mb-3'>
//                     All Set! 🎉
//                   </h2>
//                   <p className='text-xl text-gray-300 mb-6'>
//                     Your IDs have been uploaded successfully
//                   </p>
//                   <div className='bg-white/10 rounded-xl p-6 backdrop-blur-sm border border-white/20'>
//                     <p className='text-white text-lg'>
//                       Redirecting you to home page...
//                     </p>
//                     <div className='mt-4 flex justify-center'>
//                       <Loader2 className='w-6 h-6 animate-spin text-white' />
//                     </div>
//                   </div>
//                 </div>
//               </Card>
//             </motion.div>
//           )}
//         </motion.div>
//       </div>
//     </div>
//   );
// }


import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Upload,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  User,
  Users,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
          toast.error('No booking ID provided');
          navigate('/guest/bookings');
          return;
        }

        const { data: bookingData, error } = await supabase
          .from('bookings')
          .select(`
            id,
            booking_reference,
            adults,
            children,
            property:properties (title)
          `)
          .eq('id', bookingId)
          .single();

        if (error) throw error;

        setBooking({
          ...bookingData,
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isMainGuest: boolean) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024;

    const processFile = (file: File) => {
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name}: Please upload JPG, PNG, or PDF file`);
        return null;
      }

      if (file.size > maxSize) {
        toast.error(`${file.name}: File must be less than 5MB`);
        return null;
      }

      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';

      return {
        file,
        preview,
        status: 'pending' as const
      };
    };

    if (isMainGuest) {
      const processedFile = processFile(files[0]);
      if (processedFile) setMainGuestId(processedFile);
    } else {
      const newFiles = files.map(processFile).filter(Boolean) as UploadedFile[];
      setAdditionalIds(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number, isMainGuest: boolean) => {
    if (isMainGuest) {
      if (mainGuestId?.preview) URL.revokeObjectURL(mainGuestId.preview);
      setMainGuestId(null);
    } else {
      const fileToRemove = additionalIds[index];
      if (fileToRemove.preview) URL.revokeObjectURL(fileToRemove.preview);
      setAdditionalIds(prev => prev.filter((_, i) => i !== index));
    }
  };

  const uploadFiles = async () => {
    if (!mainGuestId || !bookingId) {
      toast.error('Please upload your ID first');
      return;
    }

    const adultsCount = booking?.adults || 1;
    if (1 + additionalIds.length < adultsCount) {
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

      setMainGuestId(prev => prev ? { ...prev, status: 'uploaded', url: mainUrlData.publicUrl } : null);

      // Upload additional IDs
      const uploadedAdditionalUrls: string[] = [];
      for (let i = 0; i < additionalIds.length; i++) {
        const file = additionalIds[i];
        setAdditionalIds(prev => prev.map((item, idx) => 
          idx === i ? { ...item, status: 'uploading' } : item
        ));

        const path = `guest-ids/${bookingId}/adult-${i + 1}-${Date.now()}.${file.file.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage
          .from('booking-documents')
          .upload(path, file.file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('booking-documents')
          .getPublicUrl(path);

        uploadedAdditionalUrls.push(urlData.publicUrl);
        
        setAdditionalIds(prev => prev.map((item, idx) => 
          idx === i ? { ...item, status: 'uploaded', url: urlData.publicUrl } : item
        ));
      }

      // Update booking
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
      toast.success('IDs uploaded successfully!');

      setTimeout(() => navigate('/'), 2000);

    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload IDs. Please try again.');
      
      setMainGuestId(prev => prev ? { ...prev, status: 'error' } : null);
      setAdditionalIds(prev => prev.map(id => ({ ...id, status: 'error' })));
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md text-center p-8">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Booking Not Found</h2>
          <p className="text-gray-600 mb-4">We couldn't find your booking details.</p>
          <Button onClick={() => navigate('/guest/bookings')}>
            Go to My Bookings
          </Button>
        </Card>
      </div>
    );
  }

  const adultsCount = booking.adults || 1;
  const additionalAdultsCount = adultsCount - 1;

  const FileUploadArea = ({ 
    isMainGuest, 
    file, 
    onRemove 
  }: { 
    isMainGuest: boolean; 
    file: UploadedFile | null; 
    onRemove: () => void;
  }) => (
    <div className="space-y-4">
      {!file ? (
        <label className="block">
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,application/pdf"
            onChange={(e) => handleFileSelect(e, isMainGuest)}
            className="hidden"
            disabled={uploading || uploadComplete}
          />
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="font-medium text-gray-900 mb-1">
              {isMainGuest ? 'Upload Your ID' : `Upload Adult ${additionalIds.length + 1} ID`}
            </p>
            <p className="text-sm text-gray-600">JPG, PNG or PDF (max 5MB)</p>
          </div>
        </label>
      ) : (
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center gap-4">
            {file.preview ? (
              <img
                src={file.preview}
                alt="ID preview"
                className="w-16 h-16 object-cover rounded border"
              />
            ) : (
              <div className="w-16 h-16 bg-white rounded border flex items-center justify-center">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{file.file.name}</p>
              <p className="text-xs text-gray-600">
                {(file.file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <div className="flex items-center gap-2">
              {file.status === 'uploading' && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {file.status === 'uploaded' && (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              )}
              {file.status === 'error' && (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              {file.status === 'pending' && !uploading && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRemove}
                  className="h-8 px-2 text-red-600 hover:bg-red-50"
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-gray-900 rounded-xl flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Upload Guest IDs</h1>
          <p className="text-gray-600">
            Complete your booking with identification documents
          </p>
        </div>

        {/* Booking Info */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Badge variant="secondary" className="mb-2">
                  {booking.booking_reference}
                </Badge>
                <h3 className="font-semibold">{booking.property.title}</h3>
              </div>
              <div className="text-right text-sm text-gray-600">
                <div>{adultsCount} Adult{adultsCount > 1 ? 's' : ''}</div>
                {booking.children > 0 && (
                  <div>{booking.children} Child{booking.children > 1 ? 'ren' : ''}</div>
                )}
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Required for all adults aged 13+</p>
                <p>Upload valid government-issued ID (Passport, National ID, or Driver's License)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Guest ID */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-5 h-5 text-gray-600" />
              <div>
                <h3 className="font-semibold">Your ID</h3>
                <p className="text-sm text-gray-600">Main guest</p>
              </div>
            </div>
            <FileUploadArea
              isMainGuest={true}
              file={mainGuestId}
              onRemove={() => removeFile(0, true)}
            />
          </CardContent>
        </Card>

        {/* Additional Adults */}
        {additionalAdultsCount > 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-gray-600" />
                  <div>
                    <h3 className="font-semibold">Additional Adults</h3>
                    <p className="text-sm text-gray-600">
                      {additionalIds.length}/{additionalAdultsCount} uploaded
                    </p>
                  </div>
                </div>
              </div>

              <FileUploadArea
                isMainGuest={false}
                file={null}
                onRemove={() => {}}
              />

              {/* Uploaded additional IDs */}
              <div className="space-y-3 mt-4">
                {additionalIds.map((file, index) => (
                  <FileUploadArea
                    key={index}
                    isMainGuest={false}
                    file={file}
                    onRemove={() => removeFile(index, false)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        {!uploadComplete ? (
          <Button
            onClick={uploadFiles}
            disabled={
              uploading ||
              !mainGuestId ||
              (additionalAdultsCount > 0 && additionalIds.length < additionalAdultsCount)
            }
            className="w-full h-12 text-base"
            size="lg"
          >
            {uploading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </div>
            ) : (
              `Complete Verification (${1 + additionalIds.length}/${adultsCount})`
            )}
          </Button>
        ) : (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-green-900 mb-2">Upload Complete!</h3>
              <p className="text-green-700">Redirecting you to home page...</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
