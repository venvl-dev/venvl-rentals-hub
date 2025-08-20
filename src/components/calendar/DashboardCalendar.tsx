
import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { useBookings } from './hooks/useBookings';
import { DashboardCalendarProps } from './types';
import CalendarHeader from './CalendarHeader';
import CalendarGrid from './CalendarGrid';

const DashboardCalendar = ({ userId, userType }: DashboardCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterType, setFilterType] = useState<'all' | 'daily' | 'monthly'>('all');
  
  const { bookings, loading } = useBookings(userId, userType, currentDate);

  return (
    <Card className="w-full shadow-lg rounded-3xl overflow-hidden">
      <CardHeader className="p-0">
        <CalendarHeader
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          filterType={filterType}
          setFilterType={setFilterType}
          userType={userType}
        />
      </CardHeader>

      <CardContent className="p-6">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-96"
            >
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </motion.div>
          ) : (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CalendarGrid
                currentDate={currentDate}
                bookings={bookings}
                filterType={filterType}
                userType={userType}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default DashboardCalendar;
