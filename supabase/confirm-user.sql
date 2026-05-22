-- Run this in Supabase SQL Editor to confirm the test user
-- This allows login without email verification

UPDATE auth.users
SET email_confirmed_at = now(),
    confirmation_sent_at = now(),
    confirmed_at = now()
WHERE email = 'testshop-garage@gmail.com';

-- Verify the user is now confirmed
SELECT id, email, email_confirmed_at
FROM auth.users
WHERE email = 'testshop-garage@gmail.com';
