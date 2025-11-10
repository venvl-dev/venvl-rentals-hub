import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Pause, Eye, X } from 'lucide-react';

interface PauseConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  propertyTitle: string;
  isLoading?: boolean;
}

const PauseConfirmationModal: React.FC<PauseConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  propertyTitle,
  isLoading = false,
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className='max-w-md rounded-3xl border-0 shadow-2xl'>
        <AlertDialogHeader>
          <div className='flex items-center gap-4'>
            <div className='flex-shrink-0 w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center'>
              <Pause className='w-7 h-7 text-gray-700' />
            </div>
            <div>
              <AlertDialogTitle className='text-xl font-bold text-gray-900'>
                Pause Property
              </AlertDialogTitle>
              <p className='text-sm text-gray-500 mt-1'>
                Temporarily disable bookings
              </p>
            </div>
          </div>
        </AlertDialogHeader>

        <AlertDialogDescription asChild>
          <div className='space-y-5'>
            <div className='bg-gray-50 rounded-2xl p-4 border border-gray-100'>
              <p className='text-gray-700 font-medium mb-1'>
                Pause{' '}
                <span className='font-bold text-gray-900'>
                  "{propertyTitle}"
                </span>
                ?
              </p>
              <p className='text-sm text-gray-500'>
                This will temporarily hide it from guests while keeping your
                data intact.
              </p>
            </div>

            <div className='bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-5 border border-gray-200'>
              <h4 className='font-bold text-gray-900 mb-3 flex items-center gap-2'>
                <Pause className='w-5 h-5' />
                What happens when you pause:
              </h4>
              <div className='grid gap-3'>
                <div className='flex items-start gap-3'>
                  <div className='w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0'></div>
                  <span className='text-sm text-gray-700 leading-relaxed'>
                    Property is hidden from search results
                  </span>
                </div>
                <div className='flex items-start gap-3'>
                  <div className='w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0'></div>
                  <span className='text-sm text-gray-700 leading-relaxed'>
                    New bookings are prevented
                  </span>
                </div>
                <div className='flex items-start gap-3'>
                  <div className='w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0'></div>
                  <span className='text-sm text-gray-700 leading-relaxed'>
                    Existing bookings remain active
                  </span>
                </div>
                <div className='flex items-start gap-3'>
                  <div className='w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0'></div>
                  <span className='text-sm text-gray-900 font-medium leading-relaxed'>
                    You can reactivate it anytime
                  </span>
                </div>
              </div>
            </div>

            <div className='bg-gradient-to-r from-gray-100 to-gray-50 rounded-2xl p-4 border border-gray-200'>
              <p className='text-sm text-gray-700 flex items-center gap-3'>
                <Eye className='w-5 h-5 text-gray-600 flex-shrink-0' />
                <span>
                  Perfect for maintenance periods or when you're temporarily
                  unavailable.
                </span>
              </p>
            </div>
          </div>
        </AlertDialogDescription>

        <AlertDialogFooter className='gap-2 sm:gap-3 pt-2 flex-col sm:flex-row'>
          <AlertDialogCancel
            onClick={onClose}
            disabled={isLoading}
            className='flex items-center justify-center gap-2 rounded-2xl border-gray-200 hover:bg-gray-50 text-gray-700 font-medium px-4 sm:px-6 py-3 min-h-[44px] touch-target text-sm sm:text-base w-full sm:w-auto order-2 sm:order-1'
          >
            <X className='w-4 h-4' />
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className='bg-black hover:bg-gray-800 text-white flex items-center justify-center gap-2 rounded-2xl font-medium px-4 sm:px-6 py-3 min-h-[44px] touch-target text-sm sm:text-base transition-colors w-full sm:w-auto order-1 sm:order-2'
          >
            {isLoading ? (
              <>
                <div className='w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
                <span className='hidden sm:inline'>Pausing...</span>
                <span className='sm:hidden'>...</span>
              </>
            ) : (
              <>
                <Pause className='w-4 h-4' />
                <span className='hidden sm:inline'>Pause Property</span>
                <span className='sm:hidden'>Pause</span>
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PauseConfirmationModal;
