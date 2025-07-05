import { 
  Wifi,
  ChefHat,
  ThermometerSnowflake,
  Tv2,
  Car,
  Shield,
  Wind,
  Waves,
  UtensilsCrossed,
  GamepadIcon,
  LucideIcon
} from 'lucide-react';

// الواجهة الأساسية للـ amenity
export interface Amenity {
  id: string;
  name: string;
  category: 'essential' | 'comfort' | 'entertainment';
  icon: LucideIcon;
}

// قائمة الـ amenities المتاحة مع 3 فئات أساسية فقط
export const AMENITIES_LIST: Amenity[] = [
  // Essential - الأساسيات
  { id: 'wifi', name: 'Wi-Fi', category: 'essential', icon: Wifi },
  { id: 'kitchen', name: 'Kitchen', category: 'essential', icon: ChefHat },
  { id: 'air_conditioning', name: 'Air Conditioning', category: 'essential', icon: ThermometerSnowflake },
  { id: 'parking', name: 'Free Parking', category: 'essential', icon: Car },
  { id: 'security', name: 'Security', category: 'essential', icon: Shield },
  { id: 'heating', name: 'Heating', category: 'essential', icon: ThermometerSnowflake },
  { id: 'washing_machine', name: 'Washing Machine', category: 'essential', icon: Wind },
  { id: 'private_entrance', name: 'Private Entrance', category: 'essential', icon: Shield },
  { id: 'elevator', name: 'Elevator', category: 'essential', icon: Wind },
  { id: 'workspace', name: 'Workspace', category: 'essential', icon: Wind },

  // Comfort - الراحة  
  { id: 'balcony', name: 'Balcony', category: 'comfort', icon: Wind },
  { id: 'pool', name: 'Swimming Pool', category: 'comfort', icon: Waves },
  { id: 'dining_area', name: 'Dining Area', category: 'comfort', icon: UtensilsCrossed },
  { id: 'garden', name: 'Garden', category: 'comfort', icon: Wind },
  { id: 'terrace', name: 'Terrace', category: 'comfort', icon: Wind },
  { id: 'spa', name: 'Spa', category: 'comfort', icon: Wind },
  { id: 'gym', name: 'Gym', category: 'comfort', icon: Wind },
  { id: 'sauna', name: 'Sauna', category: 'comfort', icon: Wind },
  { id: 'hot_tub', name: 'Hot Tub', category: 'comfort', icon: Waves },
  { id: 'ocean_view', name: 'Ocean View', category: 'comfort', icon: Wind },
  { id: 'mountain_view', name: 'Mountain View', category: 'comfort', icon: Wind },
  { id: 'city_view', name: 'City View', category: 'comfort', icon: Wind },
  { id: 'fireplace', name: 'Fireplace', category: 'comfort', icon: Wind },
  { id: 'closet', name: 'Closet', category: 'comfort', icon: Wind },
  { id: 'iron', name: 'Iron', category: 'comfort', icon: Wind },

  // Entertainment - الترفيه
  { id: 'tv', name: 'TV', category: 'entertainment', icon: Tv2 },
  { id: 'gaming', name: 'Gaming Console', category: 'entertainment', icon: GamepadIcon },
  { id: 'netflix', name: 'Netflix', category: 'entertainment', icon: Tv2 },
  { id: 'sound_system', name: 'Sound System', category: 'entertainment', icon: GamepadIcon },
  { id: 'books', name: 'Books', category: 'entertainment', icon: GamepadIcon },
  { id: 'board_games', name: 'Board Games', category: 'entertainment', icon: GamepadIcon },
  { id: 'music_instruments', name: 'Music Instruments', category: 'entertainment', icon: GamepadIcon },
  { id: 'outdoor_games', name: 'Outdoor Games', category: 'entertainment', icon: GamepadIcon },
  { id: 'bbq', name: 'BBQ Grill', category: 'entertainment', icon: UtensilsCrossed },
  { id: 'beach_access', name: 'Beach Access', category: 'entertainment', icon: Waves },
  { id: 'water_sports', name: 'Water Sports Equipment', category: 'entertainment', icon: Waves },
  { id: 'bicycles', name: 'Bicycles', category: 'entertainment', icon: GamepadIcon }
];

// Map للبحث السريع
const AMENITIES_MAP = new Map<string, Amenity>(
  AMENITIES_LIST.map(amenity => [amenity.id, amenity])
);

// دالة للحصول على amenity بالـ ID
export const getAmenityById = (id: string): Amenity | undefined => {
  return AMENITIES_MAP.get(id);
};

// دالة للحصول على قائمة amenities بالـ IDs
export const getAmenitiesByIds = (ids: string[]): Amenity[] => {
  return ids
    .map(id => getAmenityById(id))
    .filter((amenity): amenity is Amenity => amenity !== undefined);
};

// دالة للحصول على amenities مجمعة بالفئات
export const getAmenitiesByCategory = (ids: string[]): Record<string, Amenity[]> => {
  const amenities = getAmenitiesByIds(ids);
  const grouped: Record<string, Amenity[]> = {
    essential: [],
    comfort: [],
    entertainment: []
  };

  amenities.forEach(amenity => {
    grouped[amenity.category].push(amenity);
  });

  return grouped;
};

// دالة للحصول على أهم amenities للعرض
export const getTopAmenities = (ids: string[], maxCount: number = 4): Amenity[] => {
  // ترتيب الأولوية: الأساسيات أولاً، ثم الراحة، ثم الترفيه
  const priorityOrder = [
    // Essential first
    'wifi', 'kitchen', 'air_conditioning', 'parking', 'security', 'heating', 'washing_machine', 'private_entrance', 'elevator', 'workspace',
    // Comfort second
    'balcony', 'pool', 'dining_area', 'garden', 'terrace', 'spa', 'gym', 'ocean_view', 'mountain_view', 'city_view', 'fireplace', 'closet', 'iron', 'sauna', 'hot_tub',
    // Entertainment third
    'tv', 'netflix', 'gaming', 'sound_system', 'books', 'board_games', 'music_instruments', 'outdoor_games', 'bbq', 'beach_access', 'water_sports', 'bicycles'
  ];
  
  const amenities = getAmenitiesByIds(ids);
  
  // ترتيب حسب الأولوية
  const sorted = amenities.sort((a, b) => {
    const aIndex = priorityOrder.indexOf(a.id);
    const bIndex = priorityOrder.indexOf(b.id);
    
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    
    return aIndex - bIndex;
  });

  return sorted.slice(0, maxCount);
};

// دالة للحصول على جميع amenities بفئة معينة
export const getAmenitiesBySpecificCategory = (category: 'essential' | 'comfort' | 'entertainment'): Amenity[] => {
  return AMENITIES_LIST.filter(amenity => amenity.category === category);
};

// دالة للتحقق من صحة amenity ID
export const isValidAmenityId = (id: string): boolean => {
  return AMENITIES_MAP.has(id);
};

// دالة لتنظيف قائمة amenity IDs (إزالة غير الصحيحة)
export const cleanAmenityIds = (ids: string[]): string[] => {
  return ids.filter(id => isValidAmenityId(id));
};

// أسماء الفئات للعرض
export const CATEGORY_LABELS = {
  essential: 'الأساسيات',
  comfort: 'الراحة', 
  entertainment: 'الترفيه'
} as const;

// دالة للحصول على اسم الفئة بالعربية
export const getCategoryLabel = (category: string): string => {
  return CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category;
};

// دالة للحصول على فئة amenity بالـ ID
export const getCategoryByAmenityId = (amenityId: string): string => {
  const amenity = getAmenityById(amenityId);
  return amenity?.category || 'Other';
};

// دالة للحصول على amenity with legacy interface for backward compatibility
export const getAmenityWithLegacyInterface = (id: string) => {
  const amenity = getAmenityById(id);
  if (!amenity) return null;
  
  return {
    id: amenity.id,
    label: amenity.name,
    iconComponent: amenity.icon,
    category: amenity.category
  };
}; 