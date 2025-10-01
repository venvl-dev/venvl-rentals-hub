import { useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SimplePropertyTest from '@/components/host/SimplePropertyTest';

interface SettingsTabProps {
  isFixingAmenities: boolean;
  setIsFixingAmenities: (isFixing: boolean) => void;
  refetchProperties: () => void;
}

const SettingsTab = ({
  isFixingAmenities,
  setIsFixingAmenities,
  refetchProperties,
}: SettingsTabProps) => {
  const fixAmenities = useCallback(async () => {
    setIsFixingAmenities(true);
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔧 Starting amenities fix process...');
    }

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      // Mapping of old amenity IDs to new ones
      const amenityMapping: Record<string, string> = {
        wifi: 'WiFi',
        kitchen: 'Kitchen',
        air_conditioning: 'Air Conditioning',
        heating: 'Heating',
        tv: 'TV',
        netflix: 'Netflix',
        sound_system: 'Sound System',
        gaming_console: 'Gaming Console',
        parking: 'Free Parking',
        private_entrance: 'Private Entrance',
        security: 'Security',
        balcony: 'Balcony',
        washing_machine: 'Washing Machine',
        workspace: 'Workspace',
        closet: 'Closet',
      };

      // Get all user's properties
      const { data: userProperties, error: fetchError } = await supabase
        .from('properties')
        .select('id, amenities')
        .eq('host_id', user.user.id);

      if (fetchError) throw fetchError;

      if (process.env.NODE_ENV !== 'production') {
        console.log('🔧 Found properties to fix:', userProperties);
      }

      // Update each property's amenities
      for (const property of userProperties || []) {
        if (process.env.NODE_ENV !== 'production') {
          console.log(
            `🔧 Fixing amenities for property ${property.id}:`,
            property.amenities,
          );
        }

        const updatedAmenities =
          property.amenities?.map((amenity: string) => {
            const newAmenity = amenityMapping[amenity] || amenity;
            if (newAmenity !== amenity) {
              if (process.env.NODE_ENV !== 'production') {
                console.log(`🔧 Mapping ${amenity} → ${newAmenity}`);
              }
            }
            return newAmenity;
          }) || [];

        if (process.env.NODE_ENV !== 'production') {
          console.log(
            `🔧 Updated amenities for ${property.id}:`,
            updatedAmenities,
          );
        }

        const { error: updateError } = await supabase
          .from('properties')
          .update({ amenities: updatedAmenities })
          .eq('id', property.id);

        if (updateError) throw updateError;
      }

      // Refresh properties list
      await refetchProperties();

      toast.success('Amenities fixed successfully! All properties updated.');
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ Amenities fix completed successfully');
      }
    } catch (error) {
      console.error('❌ Error fixing amenities:', error);
      toast.error('Failed to fix amenities');
    } finally {
      setIsFixingAmenities(false);
    }
  }, [refetchProperties, setIsFixingAmenities]);

  return (
    <div className='space-y-6'>
      {/* Amenities Debug & Fix Tool */}
      <Card className='rounded-3xl shadow-lg border-orange-200 bg-orange-50'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-orange-800'>
            <Settings className='h-5 w-5' />
            Amenities Debug & Fix Tool
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='bg-white p-4 rounded-2xl border border-orange-200'>
            <h4 className='font-semibold text-orange-800 mb-3'>
              What this tool does:
            </h4>
            <ul className='space-y-2 text-sm text-orange-700'>
              <li className='flex items-center gap-2'>
                <div className='w-2 h-2 bg-orange-500 rounded-full'></div>
                <span>
                  Updates old amenity IDs (wifi, kitchen) to new format (WiFi,
                  Kitchen)
                </span>
              </li>
              <li className='flex items-center gap-2'>
                <div className='w-2 h-2 bg-orange-500 rounded-full'></div>
                <span>
                  Fixes amenities display issues in property forms and pages
                </span>
              </li>
              <li className='flex items-center gap-2'>
                <div className='w-2 h-2 bg-orange-500 rounded-full'></div>
                <span>
                  Ensures amenities show with proper icons instead of gray dots
                </span>
              </li>
              <li className='flex items-center gap-2'>
                <div className='w-2 h-2 bg-orange-500 rounded-full'></div>
                <span>
                  Synchronizes amenities between edit forms and property display
                </span>
              </li>
            </ul>
          </div>

          <div className='bg-yellow-50 p-4 rounded-2xl border border-yellow-200'>
            <p className='text-sm text-yellow-800'>
              <strong>Debug Info:</strong> Check browser console for detailed
              logs while using this tool. Look for 🔧 emoji logs to track the
              fix process.
            </p>
          </div>

          <Button
            onClick={fixAmenities}
            disabled={isFixingAmenities}
            className='w-full bg-orange-600 hover:bg-orange-700 text-white rounded-2xl py-3'
            size='lg'
          >
            {isFixingAmenities ? (
              <>
                <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
                Fixing Amenities...
              </>
            ) : (
              <>
                <Settings className='mr-2 h-4 w-4' />
                Fix All Property Amenities
              </>
            )}
          </Button>

          <p className='text-xs text-orange-600 text-center'>
            This will update all your properties with the new amenity format.
            Check console for details.
          </p>
        </CardContent>
      </Card>

      <SimplePropertyTest />

      <Card className='rounded-3xl shadow-lg'>
        <CardHeader>
          <CardTitle>Host Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-gray-600'>Host settings will be available soon.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsTab;
