import { 
  getRentalType, 
  getDailyPrice, 
  getMonthlyPrice, 
  type PropertyRentalData 
} from '@/lib/rentalTypeUtils';

interface Property {
  price_per_night: number;
  monthly_price?: number;
  daily_price?: number;
  rental_type?: string;
  booking_types?: string[];
}

interface PropertyPriceDisplayProps {
  property: Property & PropertyRentalData;
  className?: string;
}

const PropertyPriceDisplay = ({ property, className = "" }: PropertyPriceDisplayProps) => {
  const rentalType = getRentalType(property);
  const dailyPrice = getDailyPrice(property);
  const monthlyPrice = getMonthlyPrice(property);

  return (
    <div className={`space-y-2 ${className}`}>
      {(rentalType === 'daily' || rentalType === 'both') && (
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-gray-900">
            EGP {dailyPrice.toLocaleString()}
          </span>
          <span className="text-gray-600">/ night</span>
        </div>
      )}
      
      {(rentalType === 'monthly' || rentalType === 'both') && monthlyPrice && (
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-gray-900">
            EGP {monthlyPrice.toLocaleString()}
          </span>
          <span className="text-gray-600">/ month</span>
        </div>
      )}
    </div>
  );
};

export default PropertyPriceDisplay;
