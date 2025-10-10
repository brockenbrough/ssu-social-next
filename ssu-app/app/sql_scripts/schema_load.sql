DO $$
DECLARE
    fixed_user_id1 UUID := '11111111-1111-1111-1111-111111111111'; -- must exist in ssu_users
    fixed_user_id2 UUID := '22222222-2222-2222-2222-222222222222'; -- must exist in ssu_users
    fixed_user_id3 UUID := '33333333-3333-3333-3333-333333333333'; -- must exist in ssu_users
    fixed_post_id UUID  := '33333333-3333-3333-3333-333333333333'; -- fixed post ID for test
    fixed_chat_room_id UUID := '44444444-4444-4444-4444-444444444444'; -- fixed chat room ID for test
    fixed_bookmark_id UUID := '44444444-4444-4444-4444-444444444444'; -- fixed bookmark ID
BEGIN



    -- Creation of users
    IF NOT EXISTS (SELECT 1 FROM ssu_users WHERE user_id = fixed_user_id1) THEN
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
            fixed_user_id1,
            'test_user1',
            'test_user1@example.com',
            'dummy_password_hash',
            NOW(),
            'user',
            NULL,
            'Auto-created test user.'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM hashtags WHERE hashtag = '#TestTag') THEN
        INSERT INTO hashtags (hashtag) VALUES ('#TestTag');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM ssu_users WHERE user_id = fixed_user_id2) THEN
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
            fixed_user_id2,
            'test_user2',
            'test_user2@example.com',
            'dummy_password_hash',
            NOW(),
            'user',
            NULL,
            'Auto-created test user.'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM ssu_users WHERE user_id = fixed_user_id3) THEN
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
            fixed_user_id3,
            'test_user3',
            'test_user3@example.com',
            'dummy_password_hash',
            NOW(),
            'user',
            NULL,
            'Auto-created test user.'
        );
    END IF;

    -- Creation of posts
    DELETE FROM posts WHERE post_id = fixed_post_id;

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
    );

    -- Creation of like  (fixed condition: user2 likes user1's post)
    IF NOT EXISTS (
        SELECT 1 FROM likes WHERE user_id = fixed_user_id2 AND post_id = fixed_post_id
    ) THEN
        INSERT INTO likes (post_id, user_id, created_at)
        VALUES (fixed_post_id, fixed_user_id2, NOW());
    END IF;
    
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

    INSERT INTO comments (comment_id, user_id, comment_content, created_at, post_id) VALUES
        (gen_random_uuid(), fixed_user_id1, 'This is a test comment from test_user1.', NOW(), fixed_post_id),
        (gen_random_uuid(), fixed_user_id2, 'This is another test comment from test_user2.', NOW(), fixed_post_id);
END $$;
