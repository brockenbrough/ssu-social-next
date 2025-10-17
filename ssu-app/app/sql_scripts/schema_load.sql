DO $$
DECLARE
    fixed_user_id1 UUID := '11111111-1111-1111-1111-111111111111'; -- must exist in ssu_users
    fixed_user_id2 UUID := '22222222-2222-2222-2222-222222222222'; -- must exist in ssu_users
    fixed_user_id3 UUID := '33333333-3333-3333-3333-333333333333'; -- must exist in ssu_users
    fixed_post_id UUID  := '33333333-3333-3333-3333-333333333333'; -- fixed post ID for test
    fixed_post_id1 UUID := '11111111-1111-1111-1111-111111111111'; -- fixed post ID for test Yannie
    fixed_chat_room_id UUID := '44444444-4444-4444-4444-444444444444'; -- fixed chat room ID for test
    fixed_bookmark_id UUID := 'cccccccc-cccc-cccc-cccc-cccccccccccc'; -- fixed bookmark ID (unique; distinct from chat room)
    follower_uuid UUID := '11111111-1111-1111-1111-111111111111'; -- test user
    followee_uuid1 UUID := '22222222-2222-2222-2222-222222222222'; -- user2
    followee_uuid2 UUID := '33333333-3333-3333-3333-333333333333'; -- user3
    signup_existing_user_id UUID := '66666666-6666-6666-6666-666666666666';
    fixed_message_id UUID := '55555555-5555-5555-5555-555555555555'; -- fixed message ID for test
    fixed_notification_id UUID := 'aaaa1111-bbbb-2222-cccc-3333dddd4444'; -- fixed notification ID for REST tests

BEGIN
-- ====================================
-- Create default 'Deleted User'
-- ====================================
IF NOT EXISTS (SELECT 1 FROM ssu_users WHERE user_id = '00000000-0000-0000-0000-000000000000') THEN
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
        '00000000-0000-0000-0000-000000000000',
        '[deleted]',
        'deleted@system.local',
        '$2b$10$CwTycUXWue0Thq9StjUM0uJ8XQWZ7GfjOw9Tp8k1P9Jzqf2ZQh7e.', -- dummy hash
        NOW(),
        'user',
        'https://cdn-icons-png.flaticon.com/512/149/149071.png',
        'This account has been deleted.'
    );
END IF;
    
    -- Upsert test_user1
    INSERT INTO ssu_users(user_id, username, email, password, created_at, role, profile_image, biography)
    VALUES (
        fixed_user_id1,
        'test_user1',
        'test_user1@example.com',
        '$2b$10$jbi3d6Q82flNiZaReOO9j.JjDjjKxQTVSwBJhBqyB9ZkdmDoVu.TW', -- bcrypt hash for 'dummy_password_hash1'
        NOW(),
        'user',
        'https://classroomclipart.com/image/content7/72519/thumb.gif',
        'Auto-created test user.'
    )
    ON CONFLICT (user_id) DO UPDATE SET password = EXCLUDED.password;

    -- Upsert test_user2
    INSERT INTO ssu_users(user_id, username, email, password, created_at, role, profile_image, biography)
    VALUES (
        fixed_user_id2,
        'test_user2',
        'test_user2@example.com',
        '$2b$10$6xM6kyrYp7Iqmxz0x6ELpuK3X/wb2qv2L4xfTxk9eyedJbCv5X2ci',
        NOW(),
        'user',
        'https://media.tenor.com/xEq2kohc69QAAAAM/dance-emoji.gif',
        'Auto-created test user.'
    )
    ON CONFLICT (user_id) DO UPDATE SET password = EXCLUDED.password;

    -- Upsert test_user3
    INSERT INTO ssu_users(user_id, username, email, password, created_at, role, profile_image, biography)
    VALUES (
        fixed_user_id3,
        'test_user3',
        'test_user3@example.com',
        '$2b$10$0y3lHxfBnUOt5c1iSzJ2ku7iFgkTcZtj6cznL2oZMzIhE6W8XGqY6',
        NOW(),
        'user',
        'https://thumbs.dreamstime.com/b/emoticon-missing-teeth-smiling-tooth-62484085.jpg?w=576',
        'Auto-created test user.'
    )
    ON CONFLICT (user_id) DO UPDATE SET password = EXCLUDED.password;

    -- Signup conflict test user (already exists)
    IF NOT EXISTS (SELECT 1 FROM ssu_users WHERE user_id = signup_existing_user_id) THEN
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
            signup_existing_user_id,
            'signup_existing_user',
            'signup_existing_user@example.com',
            '$2b$10$CwTycUXWue0Thq9StjUM0uJ8XQWZ7GfjOw9Tp8k1P9Jzqf2ZQh7e.',  -- bcrypt hash for 'signuppassword'
            NOW(),
            'user',
            NULL,
            'Pre-existing user for signup conflict test.'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM hashtags WHERE hashtag = '#TestTag') THEN
        INSERT INTO hashtags (
            hashtag
        )
        VALUES (
            '#TestTag'
        );
    END IF;

    -- Creation of posts
    DELETE FROM posts WHERE post_id = fixed_post_id;

    --Yannie
    DELETE FROM posts
    WHERE post_id = fixed_post_id1;

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
        fixed_user_id1,
        'This is a fixed test post for automated test cases.',
        NULL,
        FALSE,
        FALSE,
        NOW()
    ), 
    (
        fixed_post_id1,
        fixed_user_id3,
        'This is a fixed test post for testing getting comment by PostId.',
        NULL,
        FALSE,
        FALSE,
        NOW()
    );

    --Creation of like
    IF NOT EXISTS (
        SELECT 1 FROM likes WHERE user_id = fixed_user_id1 AND post_id = fixed_post_id
    ) THEN
        INSERT INTO likes (
            post_id,
            user_id,
            created_at
        )
        VALUES (
            fixed_post_id,
            fixed_user_id2,
            NOW()
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM likes WHERE user_id = fixed_user_id1 AND post_id = fixed_post_id
    ) THEN
        INSERT INTO likes (
            post_id,
            user_id,
            created_at
        )
        VALUES (
            fixed_post_id1,
            fixed_user_id3,
            NOW()
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM likes WHERE user_id = fixed_user_id1 AND post_id = fixed_post_id
    ) THEN
        INSERT INTO likes (
            post_id,
            user_id,
            created_at
        )
        VALUES (
            fixed_post_id,
            fixed_user_id3,
            NOW()
        );
    END IF;

    -- Creation of like  (fixed condition: user2 likes user1's post)
    IF NOT EXISTS (
        SELECT 1 FROM likes WHERE user_id = fixed_user_id2 AND post_id = fixed_post_id
    ) THEN
        INSERT INTO likes (post_id, user_id, created_at)
        VALUES (fixed_post_id, fixed_user_id2, NOW());
    END IF;
    -- Yannie
    

    -- Remove existing chat room with same fixed_chat_room_id or user pair
    DELETE FROM chatrooms
    WHERE chat_room_id = fixed_chat_room_id
       OR (LEAST(user_1, user_2), GREATEST(user_1, user_2))
          = (LEAST(fixed_user_id1, fixed_user_id2), GREATEST(fixed_user_id1, fixed_user_id2));

    -- Insert fixed chat room
    INSERT INTO chatrooms (chat_room_id, user_1, user_2, created_by, created_at)
    VALUES (fixed_chat_room_id, fixed_user_id1, fixed_user_id2, fixed_user_id1, NOW());

    -- Followers seeding 
    DELETE FROM followers
     WHERE (user_id, follower_id) IN (
           (fixed_user_id1, fixed_user_id2),
           (fixed_user_id2, fixed_user_id1),
           (fixed_user_id3, fixed_user_id1)
     );

    IF NOT EXISTS (SELECT 1 FROM followers WHERE user_id = fixed_user_id1 AND follower_id = fixed_user_id2) THEN
        INSERT INTO followers (user_id, follower_id, created_at)
        VALUES (fixed_user_id1, fixed_user_id2, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM followers WHERE user_id = fixed_user_id2 AND follower_id = fixed_user_id1) THEN
        INSERT INTO followers (user_id, follower_id, created_at)
        VALUES (fixed_user_id2, fixed_user_id1, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM followers WHERE user_id = fixed_user_id3 AND follower_id = fixed_user_id1) THEN
        INSERT INTO followers (user_id, follower_id, created_at)
        VALUES (fixed_user_id3, fixed_user_id1, NOW());
    END IF;
    
    -- Remove any existing test follower relationships for this follower
    DELETE FROM followers
    WHERE follower_id = follower_uuid
      AND user_id IN (followee_uuid1, followee_uuid2);

-- Insert new test follower relationships (for unit tests)
INSERT INTO followers (user_id, follower_id)
VALUES 
    ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333'),
    ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111'),
    ('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333'),
    ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111'),
    ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222')
ON CONFLICT DO NOTHING;

    
        -- Creation of a default bookmark (only if it does not already exist)
    IF NOT EXISTS (
        SELECT 1 FROM bookmarks WHERE user_id = fixed_user_id2 AND post_id = fixed_post_id
    ) THEN
        INSERT INTO bookmarks (bookmark_id, user_id, post_id, created_at, is_public)
        VALUES (fixed_bookmark_id, fixed_user_id2, fixed_post_id, NOW(), TRUE);
    END IF;

    -- Creation of a default notification (only if it does not already exist)
    IF NOT EXISTS (
        SELECT 1 FROM notifications WHERE user_id = fixed_user_id1 AND post_id = fixed_post_id
    ) THEN
        INSERT INTO notifications (
            notification_id,
            notification_type,
            user_id,
            action_user_id,
            content,
            post_id,
            is_read,
            created_at
        )
        VALUES (
            gen_random_uuid(),
            'comment',
            fixed_user_id1,
            fixed_user_id2,
            'test_user2 commented on your test post',
            fixed_post_id,
            FALSE,
            NOW()
        );
    END IF;

    -- Creation of comments
    DELETE FROM comments
    WHERE post_id = fixed_post_id
      AND user_id IN (fixed_user_id1, fixed_user_id2);

    --Yannie
    DELETE FROM comments
    WHERE post_id = fixed_post_id1;

    -- Insert test comments for fixed post

    INSERT INTO comments (
        comment_id,
        user_id,
        comment_content,
        created_at,
        post_id
    )
    VALUES
    (
        gen_random_uuid(),
        fixed_user_id1,
        'This is a test comment from test_user1.',
        NOW(),
        fixed_post_id
    ),
    (
        gen_random_uuid(),
        fixed_user_id2,
        'This is another test comment from test_user2.',
        NOW(),
        fixed_post_id
    ),
    (
        gen_random_uuid(),
        fixed_user_id3,
        'This comment is for testing getting comment by PostId.',
        NOW(),
        fixed_post_id1
    );

    -- Creation of a default message (only if it does not already exist)
    IF NOT EXISTS (
        SELECT 1 FROM messages WHERE message_id = fixed_message_id
    ) THEN
        INSERT INTO messages (
            message_id,
            chat_room_id,
            sender_id,
            receiver_id,
            message_text,
            is_read,
            created_at
        )
        VALUES (
            fixed_message_id,
            fixed_chat_room_id,
            fixed_user_id1,
            fixed_user_id2,
            'This is a seeded test message.',
            FALSE,
            NOW()
        );
    END IF;

 -- ====================================
-- Creation of views (for testing GetViews)
-- =====================================
IF NOT EXISTS (
    SELECT 1 FROM views WHERE user_id = fixed_user_id2 AND post_id = fixed_post_id
) THEN
    INSERT INTO views (
        user_id,
        post_id,
        created_at
    )
    VALUES (
        fixed_user_id2, -- user2 viewed user1's fixed post
        fixed_post_id,
        NOW()
    );
END IF;

IF NOT EXISTS (
    SELECT 1 FROM views WHERE user_id = fixed_user_id3 AND post_id = fixed_post_id
) THEN
    INSERT INTO views (
        user_id,
        post_id,
        created_at
    )
    VALUES (
        fixed_user_id3, -- user3 viewed the same post
        fixed_post_id,
        NOW()
    );
END IF;

    -- ====================================
    -- EXTRA TEST USERS
    -- ====================================
    INSERT INTO ssu_users (user_id, username, email, password, created_at, role, profile_image, biography)
    VALUES
      ('55555555-5555-5555-5555-555555555555', 'extra_user1', 'extra1@example.com', 'dummy_password_hash', NOW(), 'user', NULL, 'Extra test user 1.'),
      ('66666666-6666-6666-6666-666666666666', 'extra_user2', 'extra2@example.com', 'dummy_password_hash', NOW(), 'user', NULL, 'Extra test user 2.'),
      ('77777777-7777-7777-7777-777777777777', 'extra_user3', 'extra3@example.com', 'dummy_password_hash', NOW(), 'user', NULL, 'Extra test user 3.'),
      ('88888888-8888-8888-8888-888888888888', 'extra_user4', 'extra4@example.com', 'dummy_password_hash', NOW(), 'user', NULL, 'Extra test user 4.'),
      ('99999999-9999-9999-9999-999999999999', 'extra_user5', 'extra5@example.com', 'dummy_password_hash', NOW(), 'user', NULL, 'Extra test user 5.'),
      ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'extra_user6', 'extra6@example.com', 'dummy_password_hash', NOW(), 'user', NULL, 'Extra test user 6.')
    ON CONFLICT (user_id) DO NOTHING;

    -- ====================================
    -- EXTRA TEST POSTS
    -- ====================================
    INSERT INTO posts (post_id, user_id, content, image_uri, is_sensitive, has_offensive_text, created_at)
    VALUES
      ('55555555-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', 'Post from extra_user1 for testing view counts.', NULL, FALSE, FALSE, NOW()),
      ('66666666-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '66666666-6666-6666-6666-666666666666', 'Post from extra_user2 for testing followers.', NULL, FALSE, FALSE, NOW()),
      ('77777777-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '77777777-7777-7777-7777-777777777777', 'Post from extra_user3 for testing comments.', NULL, FALSE, FALSE, NOW()),
      ('88888888-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '88888888-8888-8888-8888-888888888888', 'Post from extra_user4 for API validation.', NULL, FALSE, FALSE, NOW()),
      ('99999999-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '99999999-9999-9999-9999-999999999999', 'Post from extra_user5 for GetViews route.', NULL, FALSE, FALSE, NOW()),
      ('aaaaaaaa-bbbb-bbbb-bbbb-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Post from extra_user6 for testing CreateView route.', NULL, FALSE, FALSE, NOW())
    ON CONFLICT (post_id) DO UPDATE
    SET user_id = EXCLUDED.user_id,
        content = EXCLUDED.content,
        created_at = NOW();

    INSERT INTO comments (comment_id, user_id, comment_content, created_at, post_id)
    VALUES (
      '88888888-8888-8888-8888-888888888888',        -- fixed comment id
      '22222222-2222-2222-2222-222222222222',        -- fixed_user_id2 (exists)
      'This is an updatable test comment (initial).',
      NOW(),
      '33333333-3333-3333-3333-333333333333'         -- fixed_post_id (exists)
    )
    ON CONFLICT (comment_id) DO UPDATE
    SET user_id = EXCLUDED.user_id,
        comment_content = EXCLUDED.comment_content,
        created_at = NOW();
      -- ====================================
    -- FIXED NOTIFICATION (for REST tests)
    -- ====================================
    IF NOT EXISTS (
        SELECT 1 FROM notifications WHERE notification_id = fixed_notification_id
    ) THEN
        INSERT INTO notifications (
            notification_id,
            notification_type,
            user_id,           -- who receives the notification
            action_user_id,    -- who triggered it
            content,
            post_id,
            is_read,
            created_at
        )
        VALUES (
            fixed_notification_id,
            'like',                         -- choose any enum/valid type you use: 'like' | 'comment' | 'follow' | ...
            fixed_user_id1,                 -- receiver (test_user1)
            fixed_user_id2,                 -- actor    (test_user2)
            'test_user2 liked your fixed test post',
            fixed_post_id,                  -- ties to existing seeded post
            FALSE,
            NOW()
        );
    END IF;

    -- ======================================================
    -- Seed likes MADE BY user1 so tests for "numberOfPostsLiked"
    -- can assert a deterministic count (expected = 2)
    -- ======================================================

    -- Ensure no duplicates
    DELETE FROM likes
    WHERE user_id = fixed_user_id1
      AND post_id IN (fixed_post_id, fixed_post_id1);

    --user1 likes their own fixed post
    INSERT INTO likes (post_id, user_id, created_at)
    VALUES (fixed_post_id, fixed_user_id1, NOW())
    ON CONFLICT DO NOTHING;

    --user1 also likes user3's fixed post
    INSERT INTO likes (post_id, user_id, created_at)
    VALUES (fixed_post_id1, fixed_user_id1, NOW())
    ON CONFLICT DO NOTHING;    

END $$;