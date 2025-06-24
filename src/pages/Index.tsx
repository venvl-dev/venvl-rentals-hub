
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import SearchFilters from '@/components/SearchFilters';
import PropertyCard from '@/components/PropertyCard';
import { toast } from 'sonner';

interface Property {
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
}

interface SearchFiltersType {
  location: string;
  checkIn?: Date;
  checkOut?: Date;
  guests: number;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
}

const Index = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      
      setProperties(data || []);
      setFilteredProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (filters: SearchFiltersType) => {
    let filtered = [...properties];

    // Filter by location
    if (filters.location) {
      filtered = filtered.filter(property => 
        property.city.toLowerCase().includes(filters.location.toLowerCase()) ||
        property.state.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Filter by property type
    if (filters.propertyType) {
      filtered = filtered.filter(property => property.property_type === filters.propertyType);
    }

    // Filter by guests
    if (filters.guests) {
      filtered = filtered.filter(property => property.max_guests >= filters.guests);
    }

    // Filter by price range
    if (filters.minPrice) {
      filtered = filtered.filter(property => property.price_per_night >= filters.minPrice!);
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(property => property.price_per_night <= filters.maxPrice!);
    }

    setFilteredProperties(filtered);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Find your perfect stay
          </h1>
          <p className="text-xl text-gray-600">
            Discover amazing properties for your next vacation
          </p>
        </div>

        <SearchFilters onSearch={handleSearch} />

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading properties...</div>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
            <p className="text-gray-600">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
