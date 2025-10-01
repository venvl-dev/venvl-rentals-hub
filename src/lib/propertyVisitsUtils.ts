import { supabase } from '@/integrations/supabase/client';

const COOKIE_NAME = 'visitor_id';

export const saveVisit = async (propertyId: string) => {
  let visitor_id = null;
  console.log('saving visit for ', propertyId);
  const match = document.cookie.match(
    new RegExp('(^| )' + COOKIE_NAME + '=([^;]+)'),
  );
  if (match) {
    visitor_id = match[2];

    const result = await supabase
      .from('property_visits')
      .insert({ property_id: propertyId, visitor_id });

    console.log(result);
  } else {
    console.log('Visitor ID not found in cookies');
    const result = await supabase
      .from('property_visits')
      .insert({ property_id: propertyId })
      .select();

    console.log(result);

    visitor_id = result.data[0].visitor_id;

    // Set expiry for 365 days from now
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 365);

    // 3. Set the new cookie
    document.cookie = `${COOKIE_NAME}=${visitor_id}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax; Secure`;
  }
};
