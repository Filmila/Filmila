import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setAdminRole(email: string) {
  try {
    console.log(`Setting admin role for user: ${email}`);

    // First, get the user
    const { data: user, error: userError } = await supabase.auth.admin.getUserByEmail(email);
    
    if (userError) {
      console.error('Error getting user:', userError);
      return;
    }

    if (!user) {
      console.error('User not found');
      return;
    }

    console.log('Current user data:', {
      id: user.id,
      email: user.email,
      app_metadata: user.app_metadata,
      user_metadata: user.user_metadata
    });

    // Update the user's app_metadata
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        app_metadata: {
          ...user.app_metadata,
          role: 'admin'
        }
      }
    );

    if (updateError) {
      console.error('Error updating user:', updateError);
      return;
    }

    console.log('User updated successfully:', {
      id: updatedUser.id,
      email: updatedUser.email,
      app_metadata: updatedUser.app_metadata,
      user_metadata: updatedUser.user_metadata
    });

    console.log('\n✅ Admin role set successfully!');
    console.log('Please have the user sign out and sign back in to get a new JWT token.');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the script
setAdminRole('gofilmila@gmail.com'); 