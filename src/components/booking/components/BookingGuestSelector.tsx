
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
      <span className="text-sm font-semibold text-gray-900">Guests</span>
      <Select value={guests.toString()} onValueChange={(value) => onGuestsChange(parseInt(value))}>
        <SelectTrigger className="rounded-xl border-gray-200 focus:border-black">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: maxGuests }, (_, i) => i + 1).map((num) => (
            <SelectItem key={num} value={num.toString()}>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {num} {num === 1 ? 'guest' : 'guests'}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default BookingGuestSelector;
