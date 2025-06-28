
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PropertyCardProps {
  property: {
    id: string;
    title: string;
    description: string;
    price_per_night: number;
    images: string[];
    city: string;
    state: string;
    property_type: string;
    bedrooms: number;
    bathrooms: number;
    max_guests: number;
  };
}

const PropertyCard = ({ property }: PropertyCardProps) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate(`/property/${property.id}`);
  };

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleClick}>
      <div className="aspect-square relative overflow-hidden rounded-t-lg">
        <img
          src={property.images[0] || '/placeholder.svg'}
          alt={property.title}
          className="w-full h-full object-cover"
        />
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg truncate flex-1">{property.title}</h3>
          <div className="flex items-center ml-2">
            <Star className="h-4 w-4 fill-current text-yellow-400" />
            <span className="text-sm ml-1">4.9</span>
          </div>
        </div>
        
        <div className="flex items-center text-gray-600 mb-2">
          <MapPin className="h-4 w-4 mr-1" />
          <span className="text-sm">{property.city}, {property.state}</span>
        </div>
        
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="secondary" className="text-xs">
            {property.property_type}
          </Badge>
          <span className="text-xs text-gray-600">
            {property.bedrooms} bed • {property.bathrooms} bath • {property.max_guests} guests
          </span>
        </div>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {property.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-semibold">${property.price_per_night}</span>
            <span className="text-gray-600 text-sm"> / night</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyCard;
