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
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h2 className='text-2xl font-bold'>Your Properties</h2>
          <p className='text-gray-600'>
            Manage and monitor your property listings
          </p>
        </div>
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2'>
            <span className='text-sm text-gray-600'>Filter:</span>
            <Select
              value={propertyFilter}
              onValueChange={(value: 'active' | 'archived' | 'all') =>
                setPropertyFilter(value)
              }
            >
              <SelectTrigger className='w-48 rounded-xl'>
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
          <CardContent className='flex flex-col items-center justify-center py-12'>
            <Home className='h-16 w-16 text-gray-400 mb-4' />
            <h3 className='text-xl font-semibold mb-2'>No properties yet</h3>
            <p className='text-gray-600 mb-4'>
              Start by adding your first property to begin hosting
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
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch'>
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
