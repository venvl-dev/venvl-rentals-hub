import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const SimplePropertyTest = () => {
  const [title, setTitle] = useState('Test Property');
  const [loading, setLoading] = useState(false);

  const testSave = async () => {
    setLoading(true);
    try {
      console.log('Testing property save...');
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Not authenticated');
      
      console.log('User:', user.id);

      // Simple test data with proper types
      const testData = {
        title,
        description: 'Test description',
        property_type: 'apartment' as const,
        address: 'Test address',
        city: 'Test city',
        country: 'US',
        rental_type: 'daily' as const,
        bedrooms: 1,
        bathrooms: 1,
        max_guests: 2,
        price_per_night: 100,
        daily_price: 100,
        min_nights: 1,
        host_id: user.id,
        booking_types: ['daily'] as string[],
        is_active: true,
        approval_status: 'pending' as const,
        amenities: [] as string[],
        images: [] as string[]
      };

      console.log('Test data:', testData);

      // Try insert
      const { data, error } = await supabase
        .from('properties')
        .insert(testData)
        .select();

      if (error) {
        console.error('Save error:', error);
        toast.error(`Error: ${error.message}`);
      } else {
        console.log('Success:', data);
        toast.success('Test property saved successfully!');
      }

    } catch (error) {
      console.error('Test error:', error);
      toast.error(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testUpdate = async () => {
    setLoading(true);
    try {
      console.log('Testing property update...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Find first property owned by user
      const { data: properties, error: fetchError } = await supabase
        .from('properties')
        .select('id')
        .eq('host_id', user.id)
        .limit(1);

      if (fetchError) throw fetchError;
      if (!properties || properties.length === 0) {
        toast.error('No properties found to update');
        return;
      }

      const propertyId = properties[0].id;
      console.log('Updating property:', propertyId);

      // Simple update
      const { data, error } = await supabase
        .from('properties')
        .update({ title: title + ' (Updated)' })
        .eq('id', propertyId)
        .select();

      if (error) {
        console.error('Update error:', error);
        toast.error(`Update error: ${error.message}`);
      } else {
        console.log('Update success:', data);
        toast.success('Property updated successfully!');
      }

    } catch (error) {
      console.error('Update test error:', error);
      toast.error(`Update test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 border rounded-lg bg-yellow-50">
      <h3 className="text-lg font-bold mb-4">🔧 Property Save Test</h3>
      
      <div className="space-y-4">
        <div>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Property title"
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={testSave} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Testing...' : 'Test Insert'}
          </Button>
          
          <Button 
            onClick={testUpdate} 
            disabled={loading}
            variant="outline"
          >
            {loading ? 'Testing...' : 'Test Update'}
          </Button>
        </div>
        
        <p className="text-sm text-gray-600">
          افتح Console (F12) لمشاهدة تفاصيل الأخطاء
        </p>
      </div>
    </div>
  );
};

export default SimplePropertyTest; 