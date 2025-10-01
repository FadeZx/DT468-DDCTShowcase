-- First, let's see all users in auth and their current profiles
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  u.raw_user_meta_data,
  p.name,
  p.role,
  p.year
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- Update the admin user's role (replace with your actual email)
UPDATE profiles 
SET role = 'admin', 
    name = 'Admin User',
    year = 'Staff'
WHERE email = 'YOUR_ADMIN_EMAIL_HERE';

-- If no profile exists, create one (replace with your actual email and user ID)
INSERT INTO profiles (id, email, name, role, year)
SELECT 
  id, 
  email, 
  'Admin User', 
  'admin', 
  'Staff'
FROM auth.users 
WHERE email = 'YOUR_ADMIN_EMAIL_HERE'
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  name = 'Admin User',
  year = 'Staff';

-- Verify the update
SELECT 
  u.email,
  p.name,
  p.role,
  p.year
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE p.role = 'admin';