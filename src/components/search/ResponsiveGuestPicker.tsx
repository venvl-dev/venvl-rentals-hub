
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

interface ResponsiveGuestPickerProps {
  guests: number;
  isActive: boolean;
  onChange: (guests: number) => void;
}

const ResponsiveGuestPicker = ({ guests, isActive }: ResponsiveGuestPickerProps) => {
  return (
    <motion.div
      animate={{ scale: isActive ? 1.02 : 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="text-xs font-bold uppercase tracking-wider mb-1 opacity-60">
        Who
      </div>
      <div className={`text-sm font-medium flex items-center gap-2 transition-colors duration-200 ${
        isActive ? 'text-white' : 'text-gray-900'
      }`}>
        <Users className="h-4 w-4 opacity-70" />
        <motion.span
          key={guests}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {guests} guest{guests > 1 ? 's' : ''}
        </motion.span>
      </div>
    </motion.div>
  );
};

export default ResponsiveGuestPicker;
