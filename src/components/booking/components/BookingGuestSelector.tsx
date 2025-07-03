import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users } from 'lucide-react';

interface BookingGuestSelectorProps {
  guests: number;
  maxGuests: number;
  onGuestsChange: (guests: number) => void;
}

const BookingGuestSelector = ({ guests, maxGuests, onGuestsChange }: BookingGuestSelectorProps) => {
  return (
    <div className="space-y-3">
      {/* Header - Compact */}
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-gray-700" />
        <span className="text-sm font-semibold text-gray-900">Guests</span>
      </div>
      
      {/* Guest Selector - Simplified */}
      <Select value={guests.toString()} onValueChange={(value) => onGuestsChange(parseInt(value))}>
        <SelectTrigger className="rounded-lg border-gray-200 focus:border-black h-11 px-3">
          <SelectValue>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">
                {guests} {guests === 1 ? 'guest' : 'guests'}
              </span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="rounded-lg border-gray-200">
          {Array.from({ length: maxGuests }, (_, i) => i + 1).map((num) => (
            <SelectItem 
              key={num} 
              value={num.toString()}
              className="rounded-md cursor-pointer py-2"
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-600" />
                <span className="text-sm">
                  {num} {num === 1 ? 'guest' : 'guests'}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default BookingGuestSelector;
