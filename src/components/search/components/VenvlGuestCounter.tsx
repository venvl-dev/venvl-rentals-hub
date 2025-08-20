
import { Button } from '@/components/ui/button';
import { Users, Minus, Plus } from 'lucide-react';

interface VenvlGuestCounterProps {
  guests: number;
  onChange: (guests: number) => void;
  onClose: () => void;
  isMobile?: boolean;
}

const VenvlGuestCounter = ({ guests, onChange, onClose, isMobile = false }: VenvlGuestCounterProps) => {
  const updateGuests = (change: number) => {
    const newGuests = Math.max(1, Math.min(12, guests + change));
    onChange(newGuests);
  };

  const containerClass = isMobile 
    ? "p-6 bg-white min-h-screen flex flex-col"
    : "bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 w-80";

  return (
    <div className={containerClass}>
      {isMobile && (
        <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-4">
          <h3 className="text-lg font-semibold text-gray-900">Guests</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500"
          >
            ✕
          </Button>
        </div>
      )}

      <div className={`space-y-6 ${isMobile ? 'flex-1' : ''}`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">How many guests?</h3>
          <p className="text-gray-600">Select the number of guests for your stay</p>
        </div>

        <div className="flex items-center justify-center bg-gray-50 rounded-2xl p-8">
          <Button
            variant="outline"
            size="lg"
            onClick={() => updateGuests(-1)}
            disabled={guests <= 1}
            className="w-12 h-12 rounded-full border-2 border-gray-300 hover:border-black hover:bg-black hover:text-white disabled:opacity-30"
          >
            <Minus className="h-5 w-5" />
          </Button>
          
          <div className="mx-12 text-center">
            <div className="text-5xl font-bold text-black mb-2">{guests}</div>
            <div className="text-lg text-gray-600">
              {guests === 1 ? 'Guest' : 'Guests'}
            </div>
          </div>
          
          <Button
            variant="outline"
            size="lg"
            onClick={() => updateGuests(1)}
            disabled={guests >= 12}
            className="w-12 h-12 rounded-full border-2 border-gray-300 hover:border-black hover:bg-black hover:text-white disabled:opacity-30"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 4, 6, 8, 12].map((count) => (
            <Button
              key={count}
              variant={guests === count ? "default" : "outline"}
              onClick={() => onChange(count)}
              className={`py-3 font-medium ${
                guests === count 
                  ? 'bg-black text-white' 
                  : 'border-gray-300 hover:border-black'
              }`}
            >
              {count} {count === 1 ? 'Guest' : 'Guests'}
            </Button>
          ))}
        </div>
      </div>

      {isMobile && (
        <div className="mt-auto pt-6 border-t border-gray-200">
          <Button 
            onClick={onClose} 
            className="w-full bg-black text-white rounded-xl py-4 font-semibold"
          >
            Done
          </Button>
        </div>
      )}
    </div>
  );
};

export default VenvlGuestCounter;
