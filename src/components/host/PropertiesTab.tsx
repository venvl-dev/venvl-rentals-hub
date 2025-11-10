import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Home, Plus } from 'lucide-react';
import { Property } from '@/types/property';
import { PropertySaturation } from '@/lib/propertUtils';
import PropertyCard from './PropertyCard';

interface PropertiesTabProps {
  properties: Property[];
  propertiesStatsMap: Map<string, PropertySaturation>;
  propertyFilter: 'active' | 'archived' | 'all';
  setPropertyFilter: (filter: 'active' | 'archived' | 'all') => void;
  loadingStates: {
    [key: string]: { action: string; loading: boolean };
  };
  onEdit: (property: Property) => void;
  onDelete: (property: Property) => void;
  onPause: (property: Property) => void;
  onActivate: (propertyId: string, propertyTitle: string) => void;
  onRestore: (property: Property) => void;
  onAddProperty: () => void;
}

const PropertiesTab = ({
  properties,
  propertiesStatsMap,
  propertyFilter,
  setPropertyFilter,
  loadingStates,
  onEdit,
  onDelete,
  onPause,
  onActivate,
  onRestore,
  onAddProperty,
}: PropertiesTabProps) => {
  return (
    <>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6'>
        <div className='flex-1'>
          <h2 className='text-xl sm:text-2xl lg:text-3xl font-bold'>Your Properties</h2>
          <p className='text-gray-600 text-sm sm:text-base lg:text-lg'>
            Manage and monitor your property listings
          </p>
        </div>
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2'>
            <span className='text-sm text-gray-600 hidden sm:inline'>Filter:</span>
            <Select
              value={propertyFilter}
              onValueChange={(value: 'active' | 'archived' | 'all') =>
                setPropertyFilter(value)
              }
            >
              <SelectTrigger className='w-full sm:w-48 rounded-xl min-h-[44px] touch-target'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='active'>Active Properties</SelectItem>
                <SelectItem value='archived'>Archived Properties</SelectItem>
                <SelectItem value='all'>All Properties</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {properties.length === 0 ? (
        <Card className='rounded-3xl shadow-lg'>
          <CardContent className='flex flex-col items-center justify-center py-12 px-6'>
            <Home className='h-16 w-16 sm:h-20 sm:w-20 text-gray-400 mb-4' />
            <h3 className='text-xl sm:text-2xl font-semibold mb-2 text-center'>No properties yet</h3>
            <p className='text-gray-600 mb-6 text-center text-sm sm:text-base max-w-md'>
              Start by adding your first property to begin hosting
            </p>
            <Button
              onClick={onAddProperty}
              className='bg-black text-white hover:bg-gray-800 rounded-2xl px-6 py-3 min-h-[44px] touch-target'
            >
              <Plus className='h-4 w-4 sm:h-5 sm:w-5 mr-2' />
              Add Your First Property
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 items-stretch'>
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              stats={propertiesStatsMap.get(property.id)}
              loadingStates={loadingStates}
              onEdit={onEdit}
              onDelete={onDelete}
              onPause={onPause}
              onActivate={onActivate}
              onRestore={onRestore}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default PropertiesTab;
