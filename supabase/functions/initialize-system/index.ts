import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface DefaultUser {
  email: string;
  password: string;
  role: 'super_admin' | 'host' | 'guest';
  first_name: string;
  last_name: string;
}

const defaultUsers: DefaultUser[] = [
  {
    email: 'superadmin@venvl.com',
    password: 'SuperAdmin123!',
    role: 'super_admin',
    first_name: 'Super',
    last_name: 'Admin',
  },
  {
    email: 'host@venvl.com',
    password: 'Host123!',
    role: 'host',
    first_name: 'John',
    last_name: 'Host',
  },
  {
    email: 'guest@venvl.com',
    password: 'Guest123!',
    role: 'guest',
    first_name: 'Jane',
    last_name: 'Guest',
  },
];

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('Starting complete system initialization...');

    // First, clear any existing data (cleanup)
    console.log('Clearing existing data...');

    // Clear in correct order to avoid foreign key constraints
    const clearTables = [
      'reviews',
      'bookings',
      'properties',
      'notifications',
      'profiles',
    ];

    for (const table of clearTables) {
      try {
        const { error } = await supabaseClient
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (error && !error.message.includes('No rows')) {
          console.warn(`Warning clearing ${table}:`, error.message);
        }
      } catch (error) {
        console.warn(`Error clearing ${table}:`, error);
      }
    }

    // Clear auth users
    try {
      const { data: existingUsers } =
        await supabaseClient.auth.admin.listUsers();
      if (existingUsers.users && existingUsers.users.length > 0) {
        console.log(
          `Clearing ${existingUsers.users.length} existing auth users...`,
        );
        for (const user of existingUsers.users) {
          await supabaseClient.auth.admin.deleteUser(user.id);
        }
      }
    } catch (error) {
      console.warn('Error clearing auth users:', error);
    }

    let createdUsers = 0;
    const results: Array<{
      email: string;
      role: string;
      success: boolean;
      error?: string;
      id?: string;
    }> = [];

    // Create default users
    for (const user of defaultUsers) {
      try {
        console.log(`Creating user: ${user.email} with role: ${user.role}`);

        const { data: authData, error: authError } =
          await supabaseClient.auth.admin.createUser({
            email: user.email,
            password: user.password,
            email_confirm: true,
            user_metadata: {
              first_name: user.first_name,
              last_name: user.last_name,
              role: user.role,
            },
          });

        if (authError) {
          console.error(`Error creating auth user ${user.email}:`, authError);
          results.push({
            email: user.email,
            success: false,
            error: authError.message,
            role: user.role,
          });
          continue;
        }

        if (!authData.user) {
          console.error(`No user data returned for ${user.email}`);
          results.push({
            email: user.email,
            success: false,
            error: 'No user data returned',
            role: user.role,
          });
          continue;
        }

        // Create profile entry
        const { error: profileError } = await supabaseClient
          .from('profiles')
          .insert({
            id: authData.user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            is_active: true,
          });

        if (profileError) {
          console.error(
            `Error creating profile for ${user.email}:`,
            profileError,
          );
          results.push({
            email: user.email,
            success: false,
            error: profileError.message,
            role: user.role,
          });
          continue;
        }

        createdUsers++;
        results.push({
          email: user.email,
          role: user.role,
          success: true,
          id: authData.user.id,
        });

        console.log(
          `Successfully created user: ${user.email} with role: ${user.role}`,
        );
      } catch (error) {
        console.error(`Unexpected error creating user ${user.email}:`, error);
        results.push({
          email: user.email,
          success: false,
          error: (error as Error).message,
          role: user.role,
        });
      }
    }

    // Now seed demo data automatically if we have the required users
    let demoDataResult = '';
    if (createdUsers > 0) {
      try {
        console.log('Automatically seeding demo data...');
        const { data: testScenarioResult, error: scenarioError } =
          await supabaseClient.rpc('create_test_scenario');

        if (scenarioError) {
          console.error('Error creating test scenario:', scenarioError);
          demoDataResult = `Demo data seeding failed: ${scenarioError.message}`;
        } else {
          demoDataResult =
            testScenarioResult ||
            'Demo data seeded successfully - Properties, bookings, and reviews created automatically';
          console.log('Demo data seeded successfully');
        }
      } catch (error) {
        console.error('Unexpected error seeding demo data:', error);
        demoDataResult = `Demo data seeding failed: ${(error as Error).message}`;
      }
    }

    const response = {
      success: true,
      message:
        'Complete system initialization completed with automatic demo data seeding',
      users_created: createdUsers,
      demo_data_result: demoDataResult,
      results: results,
      total_users: defaultUsers.length,
    };

    console.log('System initialization completed:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('System initialization failed:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: (error as Error).message,
        message: 'System initialization failed',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
