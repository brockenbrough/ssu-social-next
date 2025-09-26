DO $$
DECLARE
    fixed_user_id UUID := '11111111-1111-1111-1111-111111111111';
BEGIN
    -- Remove existing user with this ID or username/email (to avoid duplicates)
    DELETE FROM ssu_users
    WHERE user_id = fixed_user_id
       OR username = 'test_user'
       OR email = 'test_user@example.com';

    -- Insert the fixed test user
    INSERT INTO ssu_users (
        user_id,
        username,
        email,
        password,
        created_at,
        role,
        profile_image,
        biography
    )
    VALUES (
        fixed_user_id,
        'test_user',
        'test_user@example.com',
        'dummy_password_hash', -- Replace with real hash if using authentication
        NOW(),
        'user',
        NULL,
        'This is a test user for automated integration tests.'
    );
END $$;