import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Zap, Info } from 'lucide-react';

interface BookingTypeSelectorProps {
  bookingTypes: string[];
  selectedType: 'daily' | 'monthly';
  onTypeChange: (type: 'daily' | 'monthly') => void;
  dailyPrice: number;
  monthlyPrice?: number;
  minNights?: number;
  minMonths?: number;
}

const BookingTypeSelector = ({ 
  bookingTypes, 
  selectedType, 
  onTypeChange, 
  dailyPrice, 
  monthlyPrice,
  minNights,
  minMonths
}: BookingTypeSelectorProps) => {
  const hasDaily = bookingTypes.includes('daily');
  const hasMonthly = bookingTypes.includes('monthly');
  const hasBoth = hasDaily && hasMonthly;

  if (!hasBoth) {
    // Show single type badge
    return (
      <div className="space-y-3">
        <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <Badge 
            variant="secondary" 
            className="bg-black text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium w-fit"
          >
            {hasDaily ? (
              <>
                <Calendar className="h-4 w-4" />
                Daily stays
              </>
            ) : (
              <>
                <Clock className="h-4 w-4" />
                Monthly stays
              </>
            )}
          </Badge>
          <div className="text-sm font-semibold text-gray-900">
            {hasDaily ? `EGP ${dailyPrice}/night` : `EGP ${monthlyPrice}/month`}
          </div>
        </div>
        
        {/* Show minimum requirements for single type */}
        {((hasDaily && minNights) || (hasMonthly && minMonths)) && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <span className="font-medium">Minimum stay: </span>
              {hasDaily && minNights ? (
                `${minNights} night${minNights > 1 ? 's' : ''}`
              ) : (
                `${minMonths} month${minMonths > 1 ? 's' : ''}`
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header - Simplified */}
      <div className="flex items-center gap-2">
        <Badge 
          variant="secondary" 
          className="bg-black text-white px-2.5 py-1 rounded-md flex items-center gap-1.5 text-xs font-medium w-fit"
        >
          <Zap className="h-3 w-3" />
          Flexible
        </Badge>
        <span className="text-xs text-gray-600">Choose stay type</span>
      </div>
      
      {/* Booking Type Options - Fixed Hover */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
        {/* Daily Option */}
        <Button
          variant="ghost"
          onClick={() => onTypeChange('daily')}
          className={`
            p-3 rounded-md transition-all duration-200 h-auto text-left border-0
            ${selectedType === 'daily'
              ? 'bg-black text-white shadow-sm hover:bg-gray-800 hover:text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-700 border border-gray-200'
            }
          `}
        >
          <div className="w-full">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm">Daily</span>
              <span className="text-lg font-bold">EGP {dailyPrice}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className={selectedType === 'daily' ? 'text-gray-300' : 'text-gray-500'}>
                Short trips
              </span>
              <span className={selectedType === 'daily' ? 'text-gray-300' : 'text-gray-500'}>
                per night
              </span>
            </div>
          </div>
        </Button>
        
        {/* Monthly Option */}
        <Button
          variant="ghost"
          onClick={() => onTypeChange('monthly')}
          className={`
            p-3 rounded-md transition-all duration-200 h-auto text-left border-0
            ${selectedType === 'monthly'
              ? 'bg-black text-white shadow-sm hover:bg-gray-800 hover:text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-700 border border-gray-200'
            }
          `}
        >
          <div className="w-full">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm">Monthly</span>
              <span className="text-lg font-bold">EGP {monthlyPrice}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className={selectedType === 'monthly' ? 'text-gray-300' : 'text-gray-500'}>
                Extended stays
              </span>
              <span className={selectedType === 'monthly' ? 'text-gray-300' : 'text-gray-500'}>
                per month
              </span>
            </div>
          </div>
        </Button>
      </div>

      {/* Show minimum requirements based on selected type */}
      {((selectedType === 'daily' && minNights) || (selectedType === 'monthly' && minMonths)) && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <span className="font-medium">Minimum stay: </span>
            {selectedType === 'daily' ? (
              `${minNights} night${minNights! > 1 ? 's' : ''}`
            ) : (
              `${minMonths} month${minMonths! > 1 ? 's' : ''}`
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingTypeSelector;
