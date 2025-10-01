import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Property } from '@/types/property';
import HostCalendar from '@/components/calendar/HostCalendar';

interface CalendarTabProps {
  properties: Property[];
  onAddProperty: () => void;
}

const CalendarTab = ({ properties, onAddProperty }: CalendarTabProps) => {
  if (properties.length === 0) {
    return (
      <Card className='rounded-3xl shadow-lg'>
        <CardContent className='flex flex-col items-center justify-center py-12'>
          <Calendar className='h-16 w-16 text-gray-400 mb-4' />
          <h3 className='text-xl font-semibold mb-2'>
            No properties to display
          </h3>
          <p className='text-gray-600 mb-4'>
            Add properties to view their booking calendars
          </p>
          <Button
            onClick={onAddProperty}
            className='bg-black text-white hover:bg-gray-800 rounded-2xl'
          >
            <Plus className='h-4 w-4 mr-2' />
            Add Your First Property
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-8'>
      {properties.map((property) => (
        <motion.div
          key={property.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <HostCalendar
            propertyId={property.id}
            propertyTitle={property.title}
            onBookingClick={(bookingId) =>
              console.log('Booking clicked:', bookingId)
            }
          />
        </motion.div>
      ))}
    </div>
  );
};

export default CalendarTab;
