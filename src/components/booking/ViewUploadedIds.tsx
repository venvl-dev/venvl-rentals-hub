import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, User, Users, X, Download, ZoomIn } from 'lucide-react';

interface ViewUploadedIdsProps {
  isOpen: boolean;
  onClose: () => void;
  guestIdDocuments: {
    main_guest?: string;
    additional_guests?: string[];
    uploaded_at?: string;
  } | null;
  idVerificationStatus?: string;
  bookingReference?: string;
}

export default function ViewUploadedIds({
  isOpen,
  onClose,
  guestIdDocuments,
  idVerificationStatus,
  bookingReference,
}: ViewUploadedIdsProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!guestIdDocuments) {
    return null;
  }

  const hasMainGuest = !!guestIdDocuments.main_guest;
  const additionalGuests = guestIdDocuments.additional_guests || [];
  const totalIds = (hasMainGuest ? 1 : 0) + additionalGuests.length;

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isImage = (url: string) => {
    return url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  };

  const openInNewTab = (url: string) => {
    window.open(url, '_blank');
  };

  const IdDocumentCard = ({
    url,
    label,
    icon: Icon,
  }: {
    url: string;
    label: string;
    icon: React.ElementType;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm mb-2">{label}</h4>
          {isImage(url) ? (
            <div className="relative group">
              <img
                src={url}
                alt={label}
                className="w-full h-32 object-cover rounded border cursor-pointer"
                onClick={() => setSelectedImage(url)}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded flex items-center justify-center">
                <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ) : (
            <div className="w-full h-32 bg-white rounded border flex flex-col items-center justify-center">
              <FileText className="w-10 h-10 text-gray-400 mb-2" />
              <p className="text-xs text-gray-600">PDF File</p>
            </div>
          )}
          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openInNewTab(url)}
              className="flex-1 text-xs"
            >
              <Download className="w-3 h-3 mr-1" />
              Download
            </Button>
            {isImage(url) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedImage(url)}
                className="flex-1 text-xs"
              >
                <ZoomIn className="w-3 h-3 mr-1" />
                View
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FileText className="w-6 h-6" />
              Uploaded Guest IDs and Passport
            </DialogTitle>
            <DialogDescription>
              View and download your uploaded identification documents
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Header Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  {bookingReference && (
                    <p className="text-sm text-blue-800 font-medium mb-1">
                      Booking Reference: {bookingReference}
                    </p>
                  )}
                  <p className="text-sm text-blue-800">
                    {totalIds} guest ID{totalIds > 1 ? 's' : ''} / passport{totalIds > 1 ? 's' : ''} uploaded
                  </p>
                  {guestIdDocuments.uploaded_at && (
                    <p className="text-xs text-blue-700 mt-1">
                      Uploaded on:{' '}
                      {new Date(guestIdDocuments.uploaded_at).toLocaleString()}
                    </p>
                  )}
                </div>
                {idVerificationStatus && (
                  <Badge className={`${getStatusColor(idVerificationStatus)} border`}>
                    {idVerificationStatus}
                  </Badge>
                )}
              </div>
            </div>

            {/* Main Guest ID */}
            {hasMainGuest && (
              <div>
                <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Main Guest ID
                </h3>
                <IdDocumentCard
                  url={guestIdDocuments.main_guest!}
                  label="Your ID / Passport"
                  icon={User}
                />
              </div>
            )}

            {/* Additional Guests IDs */}
            {additionalGuests.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Additional Guests ({additionalGuests.length})
                </h3>
                <div className="space-y-3">
                  {additionalGuests.map((url, index) => (
                    <IdDocumentCard
                      key={index}
                      url={url}
                      label={`Adult ${index + 1} ID / Passport`}
                      icon={Users}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Information Note */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-600">
                <strong>Note:</strong> Your guest IDs and passports are securely stored and only
                accessible to you and the property host for verification purposes.
              </p>
            </div>

            {/* Close Button */}
            <div className="flex justify-end">
              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Viewer Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <button
              className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-5 h-5" />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={selectedImage}
              alt="Guest ID / Passport"
              className="max-w-full max-h-full object-contain rounded"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
