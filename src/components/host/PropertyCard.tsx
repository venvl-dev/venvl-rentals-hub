import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  Eye,
  Edit,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Archive,
  RotateCcw,
  BarChart3,
  Calendar,
  Users,
} from 'lucide-react';
import { Property } from '@/types/property';
import {
  getRentalType,
  getDailyPrice,
  getMonthlyPrice,
} from '@/lib/rentalTypeUtils';
import { PropertySaturation } from '@/lib/propertUtils';
import usePropertyVisitsCount from '@/hooks/usePropertyVisits';

// Enhanced PropertyImage component with error handling and validation
const PropertyImage = ({
  src,
  alt,
  className,
}: {
  src?: string;
  alt: string;
  className?: string;
}) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setImageSrc(src);
    setImageError(false);
    setIsLoading(true);
  }, [src]);

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
    setImageSrc('/placeholder.svg');
  };

  // Use placeholder if no src or invalid URL
  const finalSrc =
    imageSrc && isValidUrl(imageSrc) ? imageSrc : '/placeholder.svg';

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className='absolute inset-0 bg-gray-200 flex items-center justify-center'>
          <Loader2 className='h-6 w-6 animate-spin text-gray-400' />
        </div>
      )}
      <img
        src={finalSrc}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading='lazy'
      />
      {imageError && (
        <div className='absolute inset-0 bg-gray-100 flex items-center justify-center'>
          <div className='text-center text-gray-500'>
            <Home className='h-8 w-8 mx-auto mb-2 opacity-40' />
            <span className='text-sm'>No Image</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced price formatting utility with edge case handling
const formatPrice = (price: number | null | undefined): string => {
  // Handle null, undefined, or zero
  if (!price || price === 0) return 'EGP 0';

  // Handle negative numbers
  if (price < 0) return 'EGP 0';

  // Handle extremely large numbers (over 1 billion)
  if (price > 1000000000) return 'EGP 999,999,999+';

  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(price)
    .replace('EGP', 'EGP ');
};

// Property Price Display Component
const PropertyPriceDisplay = ({ property }: { property: Property }) => {
  const rentalType = getRentalType(property);
  const dailyPrice = getDailyPrice(property);
  const monthlyPrice = getMonthlyPrice(property);

  return (
    <div className='space-y-1'>
      {rentalType === 'daily' && (
        <div className='font-semibold text-lg text-gray-900'>
          {formatPrice(dailyPrice)}/night
        </div>
      )}
      {rentalType === 'monthly' && (
        <div className='font-semibold text-lg text-gray-900'>
          {formatPrice(monthlyPrice)}/month
        </div>
      )}
      {rentalType === 'both' && (
        <div className='space-y-0.5'>
          <div className='font-semibold text-lg text-gray-900'>
            {formatPrice(dailyPrice)}/night
          </div>
          <div className='text-sm text-gray-500'>
            {formatPrice(monthlyPrice)}/month
          </div>
        </div>
      )}
    </div>
  );
};

interface PropertyCardProps {
  property: Property;
  stats?: PropertySaturation;
  loadingStates: {
    [key: string]: { action: string; loading: boolean };
  };
  onEdit: (property: Property) => void;
  onDelete: (property: Property) => void;
  onPause: (property: Property) => void;
  onActivate: (propertyId: string, propertyTitle: string) => void;
  onRestore: (property: Property) => void;
}

const PropertyCard = ({
  property,
  stats,
  loadingStates,
  onEdit,
  onDelete,
  onPause,
  onActivate,
  onRestore,
}: PropertyCardProps) => {
  const { count: visitorsCount, isLoading } = usePropertyVisitsCount(
    property.id,
  );
  const navigate = useNavigate();

  // Helper function to get button state
  const getButtonState = () => {
    const loading = loadingStates[property.id];
    const isStatusLoading =
      loading?.loading &&
      (loading.action.includes('activating') ||
        loading.action.includes('pausing'));

    return {
      isLoading: isStatusLoading,
      loadingText:
        loading?.action === 'activating' ? 'Activating...' : 'Pausing...',
      buttonText: property.is_active ? 'Pause' : 'Activate',
      icon: property.is_active ? AlertTriangle : CheckCircle,
    };
  };

  const buttonState = getButtonState();
  const IconComponent = buttonState.icon;

  return (
    <Card className='overflow-hidden rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col bg-white h-full'>
      <div className='h-48 relative flex-shrink-0'>
        <PropertyImage
          src={property.images?.[0]}
          alt={property.title}
          className='w-full h-full object-cover'
        />
        <div className='absolute top-3 right-3'>
          {property.deleted_at ? (
            <Badge className='bg-gray-900 text-white text-xs px-3 py-1 rounded-full'>
              Archived
            </Badge>
          ) : property.approval_status == 'pending' ? (
            <Badge className='bg-white text-black text-xs px-3 py-1 rounded-full'>
              pending
            </Badge>
          ) : (
            <Badge className='bg-gray-900 text-white text-xs px-3 py-1 rounded-full'>
              {property.is_active ? 'Active' : 'Inactive'}
            </Badge>
          )}
        </div>
      </div>

      <CardContent className='p-0 flex flex-col flex-1'>
        <div className='p-6 pb-4 flex-1 flex flex-col'>
          <div className='h-16 flex flex-col justify-start'>
            <h3 className='font-semibold text-xl mb-1 line-clamp-2 text-gray-900'>
              {property.title}
            </h3>
          </div>
          <p className='text-sm text-gray-500 mb-3'>
            {property.city}, {property.state}
          </p>
          <p className='text-sm text-gray-600 line-clamp-2 leading-relaxed mb-4 flex-1'>
            {property.description}
          </p>

          <div className='space-y-3 mt-auto'>
            <div>
              <PropertyPriceDisplay property={property} />
            </div>

            {/* Metrics Row */}
            <div className='flex items-center justify-between text-sm text-black opacity-70'>
              <div className='flex items-center gap-4'>
                <div
                  className='flex items-center gap-1 group hover:opacity-100 transition-opacity'
                  title='Occupancy Rate'
                >
                  <BarChart3 className='h-4 w-4' />
                  <span className='font-medium'>{stats?.occupancyRate}%</span>
                </div>
                <div
                  className='flex items-center gap-1 group hover:opacity-100 transition-opacity'
                  title='Total Bookings'
                >
                  <Calendar className='h-4 w-4' />
                  <span className='font-medium'>{stats?.bookedDays}</span>
                </div>
                <div
                  className='flex items-center gap-1 group hover:opacity-100 transition-opacity'
                  title='Visitors'
                >
                  <Users className='h-4 w-4' />
                  <span className='font-medium'>{visitorsCount ?? '-'}</span>
                </div>
              </div>
            </div>

            <div className='flex items-center justify-between text-sm text-gray-600'>
              <span>
                {property.bedrooms} bed • {property.bathrooms} bath
              </span>
              <Badge
                variant='outline'
                className='text-purple-600 border-purple-200 bg-purple-50 text-xs'
              >
                Flexible Booking
              </Badge>
            </div>
          </div>
        </div>

        <div className='px-6 pb-6 mt-auto'>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => navigate(`/property/${property.id}`)}
              className='flex-1 rounded-lg border-gray-300 hover:bg-gray-50 text-gray-700'
            >
              <Eye className='h-4 w-4 mr-1' />
              View
            </Button>

            {/* Show different actions based on property status */}
            {property.deleted_at ? (
              // Archived property actions
              <Button
                variant='outline'
                size='sm'
                onClick={() => onRestore(property)}
                disabled={
                  loadingStates[property.id]?.loading &&
                  loadingStates[property.id]?.action === 'restoring'
                }
                className='flex-1 rounded-lg border-green-300 hover:bg-green-50 text-green-700'
                title={`Restore "${property.title}"`}
              >
                {loadingStates[property.id]?.loading &&
                loadingStates[property.id]?.action === 'restoring' ? (
                  <>
                    <Loader2 className='h-4 w-4 mr-1 animate-spin' />
                    Restoring...
                  </>
                ) : (
                  <>
                    <RotateCcw className='h-4 w-4 mr-1' />
                    Restore
                  </>
                )}
              </Button>
            ) : (
              // Active property actions
              <>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => onEdit(property)}
                  className='flex-1 rounded-lg border-gray-300 hover:bg-gray-50 text-gray-700'
                >
                  <Edit className='h-4 w-4 mr-1' />
                  Edit
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    property.is_active
                      ? onPause(property)
                      : onActivate(property.id, property.title)
                  }
                  disabled={buttonState.isLoading}
                  className='flex-1 rounded-lg border-gray-300 hover:bg-gray-50 text-gray-700'
                >
                  {buttonState.isLoading ? (
                    <>
                      <Loader2 className='h-4 w-4 mr-1 animate-spin' />
                      {buttonState.loadingText}
                    </>
                  ) : (
                    <>
                      <IconComponent className='h-4 w-4 mr-1' />
                      {buttonState.buttonText}
                    </>
                  )}
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => onDelete(property)}
                  disabled={
                    loadingStates[property.id]?.loading &&
                    loadingStates[property.id]?.action === 'deleting'
                  }
                  className='w-10 rounded-lg border-red-300 hover:bg-red-50 text-red-600 p-0 flex items-center justify-center'
                  title={`Archive "${property.title}"`}
                >
                  {loadingStates[property.id]?.loading &&
                  loadingStates[property.id]?.action === 'deleting' ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <Archive className='h-4 w-4' />
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyCard;
