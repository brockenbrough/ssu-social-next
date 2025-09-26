DO $$
DECLARE
    fixed_user_id UUID := '11111111-1111-1111-1111-111111111111'; -- must exist in ssu_users
    fixed_post_id UUID := '22222222-2222-2222-2222-222222222222';
BEGIN
    -- Ensure the user exists (create if missing)
    IF NOT EXISTS (SELECT 1 FROM ssu_users WHERE user_id = fixed_user_id) THEN
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
            'dummy_password_hash',
            NOW(),
            'user',
            NULL,
            'Auto-created test user for fixed post.'
        );
    END IF;

    -- Remove existing post with same fixed_post_id or same content (to avoid duplicates)
    DELETE FROM posts
    WHERE post_id = fixed_post_id;

    -- Insert fixed post
    INSERT INTO posts (
        post_id,
        user_id,
        content,
        image_uri,
        is_sensitive,
        has_offensive_text,
        created_at
    )
    VALUES (
        fixed_post_id,
        fixed_user_id,
        'This is a fixed test post for automated test cases.',
        NULL,
        FALSE,
        FALSE,
        NOW()
    );
END $$;
