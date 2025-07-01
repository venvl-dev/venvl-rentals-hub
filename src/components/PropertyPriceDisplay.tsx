
import { Badge } from '@/components/ui/badge';

interface Property {
  price_per_night: number;
  monthly_price?: number;
  rental_type?: string;
  booking_types?: string[];
}

interface PropertyPriceDisplayProps {
  property: Property;
  className?: string;
}

const PropertyPriceDisplay = ({ property, className = "" }: PropertyPriceDisplayProps) => {
  const getRentalType = () => {
    if (property.rental_type) return property.rental_type;
    if (property.booking_types?.length === 1) return property.booking_types[0];
    if (property.booking_types?.includes('daily') && property.booking_types?.includes('monthly')) return 'both';
    return 'daily';
  };

  const rentalType = getRentalType();

  return (
    <div className={`space-y-2 ${className}`}>
      {(rentalType === 'daily' || rentalType === 'both') && (
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-gray-900">
            EGP {property.price_per_night}
          </span>
          <span className="text-gray-600">/ night</span>
          {rentalType === 'daily' && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Daily stays
            </Badge>
          )}
        </div>
      )}
      
      {(rentalType === 'monthly' || rentalType === 'both') && property.monthly_price && (
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-gray-900">
            EGP {property.monthly_price}
          </span>
          <span className="text-gray-600">/ month</span>
          {rentalType === 'monthly' && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              Monthly stays
            </Badge>
          )}
        </div>
      )}
      
      {rentalType === 'both' && (
        <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-purple-100 text-gray-800">
          Flexible booking
        </Badge>
      )}
    </div>
  );
};

export default PropertyPriceDisplay;
