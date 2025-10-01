// Setup script to create the first admin account
// Run this once to create your initial admin user

import { createClient } from '@supabase/supabase-js';

// Replace with your Supabase project details
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'your-service-role-key'; // Use service role key, not anon key

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminAccount() {
  try {
    console.log('Creating admin account...');
    
    // Create admin user
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'admin@ddct.edu',
      password: 'admin123!', // Change this to a secure password
      user_metadata: {
        name: 'Admin User',
        role: 'admin',
        year: 'Staff'
      },
      email_confirm: true
    });

    if (error) {
      console.error('Error creating admin user:', error);
      return;
    }

    console.log('Admin user created successfully!');
    console.log('Email: admin@ddct.edu');
    console.log('Password: admin123!');
    console.log('User ID:', data.user.id);

    // Create profile (if trigger doesn't work)
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        email: 'admin@ddct.edu',
        name: 'Admin User',
        role: 'admin',
        year: 'Staff',
        bio: 'System Administrator',
        skills: ['Platform Management', 'User Administration']
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
    } else {
      console.log('Profile created successfully!');
    }

    console.log('\n✅ Setup complete! You can now login with:');
    console.log('Email: admin@ddct.edu');
    console.log('Password: admin123!');
    console.log('\n⚠️  Remember to change the password after first login!');

  } catch (error) {
    console.error('Setup failed:', error);
  }
}

createAdminAccount();