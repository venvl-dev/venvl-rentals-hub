// Amenities utilities with corrected IDs matching database format
import { 
  Wifi,
  ChefHat,
  ThermometerSnowflake,
  Flame,
  WashingMachine,
  Wind,
  Droplets,
  ShieldCheck,
  SprayCan,
  Landmark,
  MoveVertical,
  ParkingCircle,
  DoorClosed,
  Shield,
  Laptop2,
  Shirt,
  Tv2,
  PlayCircle,
  Speaker,
  Dice3,
  BookOpen,
  Gamepad2,
  FlameKindling,
  CircleDashed,
  LucideIcon
} from 'lucide-react';

export interface AmenityItem {
  id: string;
  label: string;
  icon: string;
  iconComponent?: LucideIcon;
}

export interface AmenityCategory {
  category: string;
  items: AmenityItem[];
}

// Centralized amenities structure
export const AMENITIES: AmenityCategory[] = [
  {
    category: "Essential",
    items: [
      { id: "WiFi", label: "Wi-Fi", icon: "Wifi", iconComponent: Wifi },
      { id: "Kitchen", label: "Kitchen", icon: "ChefHat", iconComponent: ChefHat },
      { id: "Air Conditioning", label: "Air Conditioning", icon: "ThermometerSnowflake", iconComponent: ThermometerSnowflake },
      { id: "Heating", label: "Heating", icon: "Flame", iconComponent: Flame },
      { id: "Washing Machine", label: "Washing Machine", icon: "WashingMachine", iconComponent: WashingMachine },
      { id: "Dryer", label: "Dryer", icon: "Wind", iconComponent: Wind },
      { id: "Hot Water", label: "Hot Water", icon: "Droplets", iconComponent: Droplets },
      { id: "First Aid Kit", label: "First Aid Kit", icon: "ShieldCheck", iconComponent: ShieldCheck },
      { id: "Fire Extinguisher", label: "Fire Extinguisher", icon: "SprayCan", iconComponent: SprayCan }
    ]
  },
  {
    category: "Comfort",
    items: [
      { id: "Balcony", label: "Balcony", icon: "Landmark", iconComponent: Landmark },
      { id: "Elevator", label: "Elevator", icon: "MoveVertical", iconComponent: MoveVertical },
      { id: "Free Parking", label: "Free Parking", icon: "ParkingCircle", iconComponent: ParkingCircle },
      { id: "Private Entrance", label: "Private Entrance", icon: "DoorClosed", iconComponent: DoorClosed },
      { id: "Security", label: "Security", icon: "Shield", iconComponent: Shield },
      { id: "Workspace", label: "Workspace", icon: "Laptop2", iconComponent: Laptop2 },
      { id: "Closet", label: "Closet", icon: "Shirt", iconComponent: Shirt }
    ]
  },
  {
    category: "Entertainment",
    items: [
      { id: "TV", label: "TV", icon: "Tv2", iconComponent: Tv2 },
      { id: "Netflix", label: "Netflix", icon: "PlayCircle", iconComponent: PlayCircle },
      { id: "Sound System", label: "Sound System", icon: "Speaker", iconComponent: Speaker },
      { id: "Board Games", label: "Board Games", icon: "Dice3", iconComponent: Dice3 },
      { id: "Books", label: "Books", icon: "BookOpen", iconComponent: BookOpen },
      { id: "Gaming Console", label: "Gaming Console", icon: "Gamepad2", iconComponent: Gamepad2 },
      { id: "Indoor Fireplace", label: "Indoor Fireplace", icon: "FlameKindling", iconComponent: FlameKindling },
      { id: "Pool Table", label: "Pool Table", icon: "CircleDashed", iconComponent: CircleDashed }
    ]
  }
];

// Create a flat map for quick lookups
export const AMENITY_MAP = new Map<string, AmenityItem>();
AMENITIES.forEach(category => {
  category.items.forEach(item => {
    AMENITY_MAP.set(item.id, item);
  });
});

// Get amenity by ID
export const getAmenityById = (id: string): AmenityItem | undefined => {
  // Attempt exact match first
  const direct = AMENITY_MAP.get(id);
  if (direct) return direct;

  // Fallback: try case-insensitive match after trimming
  const normalized = id.trim().toLowerCase();
  for (const [key, value] of AMENITY_MAP.entries()) {
    if (key.toLowerCase() === normalized) {
      return value;
    }
  }
  return undefined;
};

// Get category by amenity ID
export const getCategoryByAmenityId = (id: string): string => {
  for (const category of AMENITIES) {
    if (category.items.some(item => item.id === id)) {
      return category.category;
    }
  }
  return 'Other';
};

// Get amenities by IDs
export const getAmenitiesByIds = (ids: string[]): AmenityItem[] => {
  return ids.map(id => getAmenityById(id)).filter((item): item is AmenityItem => item !== undefined);
};

// Get top amenities for display (prioritized order)
export const getTopAmenities = (amenityIds: string[], maxCount: number = 4): AmenityItem[] => {
  // Priority order for display
  const priorityOrder = ['WiFi', 'Kitchen', 'Air Conditioning', 'TV', 'Free Parking', 'Washing Machine', 'Balcony', 'Security'];
  
  const amenities = getAmenitiesByIds(amenityIds);
  
  // Sort by priority
  const sortedAmenities = amenities.sort((a, b) => {
    const aIndex = priorityOrder.indexOf(a.id);
    const bIndex = priorityOrder.indexOf(b.id);
    
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
  
  return sortedAmenities.slice(0, maxCount);
};

// Get amenities grouped by category
export const getAmenitiesByCategory = (amenityIds: string[]): Record<string, AmenityItem[]> => {
  const categorized: Record<string, AmenityItem[]> = {};
  
  AMENITIES.forEach(category => {
    const categoryAmenities = category.items.filter(item => amenityIds.includes(item.id));
    if (categoryAmenities.length > 0) {
      categorized[category.category] = categoryAmenities;
    }
  });
  
  return categorized;
};

// Legacy compatibility functions for existing code
export const getAmenityIcon = (amenity: string): { icon: any; label: string; category: string } | null => {
  const item = getAmenityById(amenity);
  if (item) {
    return {
      icon: item.iconComponent,
      label: item.label,
      category: 'essential' // Default category for legacy support
    };
  }
  return null;
}; 