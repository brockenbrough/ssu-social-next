-- Drop the app_users table if it exists
DROP TABLE IF EXISTS ssu_users CASCADE;

-- Create the ssu_users table
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role as ENUM('user','admin');

CREATE TABLE ssu_users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(64) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  role user_role DEFAULT 'user',
  profile_image TEXT,
  biography VARCHAR(500)
);

-- Drop and create other empty tables
DROP TABLE IF EXISTS posts CASCADE;
CREATE TABLE posts (
    post_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES ssu_users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    image_uri TEXT,
    is_sensitive BOOLEAN DEFAULT FALSE,   
    has_offensive_text BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TABLE IF EXISTS comments CASCADE;
CREATE TABLE comments (
		comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
		CONSTRAINT fk_users 
			FOREIGN KEY (user_id)
			REFERENCES ssu_users (user_id)
			ON DELETE CASCADE,
		comment_content VARCHAR(500) NOT NULL,
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		post_id UUID NOT NULL,
		CONSTRAINT fk_posts
			FOREIGN KEY (post_id)
			REFERENCES posts (post_id)
			ON DELETE CASCADE);

-- Drop first so you can recreate it cleanly
DROP TABLE IF EXISTS notifications CASCADE;

-- Recreate table
CREATE TABLE notifications (
  notification_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type TEXT NOT NULL,
  user_id           UUID NOT NULL REFERENCES ssu_users(user_id) ON DELETE CASCADE,
  content           VARCHAR(256),
  action_user_id    UUID REFERENCES ssu_users(user_id) ON DELETE SET NULL,
  is_read           BOOLEAN NOT NULL DEFAULT FALSE,
  post_id           UUID REFERENCES posts(post_id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_notifications_type
    CHECK (notification_type IN ('like', 'comment', 'follow', 'mention', 'system'))
);

-- Helpful indexes
CREATE INDEX idx_notifications_user_id    ON notifications(user_id);
CREATE INDEX idx_notifications_action_user ON notifications(action_user_id);
CREATE INDEX idx_notifications_post_id    ON notifications(post_id);
CREATE INDEX idx_notifications_is_read    ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);


DROP TABLE IF EXISTS likes CASCADE;

CREATE TABLE likes (
  post_id  UUID NOT NULL,
  user_id  UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (post_id, user_id),

  CONSTRAINT fk_likes_post
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
  CONSTRAINT fk_likes_user
    FOREIGN KEY (user_id) REFERENCES ssu_users(user_id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS followers CASCADE;

CREATE TABLE followers (
		user_id UUID NOT NULL REFERENCES ssu_users(user_id) ON DELETE CASCADE,
		follower_id UUID NOT NULL REFERENCES ssu_users(user_id) ON DELETE CASCADE,
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		PRIMARY KEY (user_id, follower_id),
		CHECK (user_id <> follower_id)  -- Prevent self-following
);
CREATE INDEX idx_follows_follower ON followers(follower_id); -- Easier access to followings.

DROP TABLE IF EXISTS chatrooms CASCADE;

CREATE TABLE chatrooms (
  chat_room_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_1 UUID NOT NULL,
  user_2 UUID NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_chatrooms_created_by
    FOREIGN KEY (created_by) REFERENCES ssu_users(user_id)
    ON UPDATE CASCADE ON DELETE CASCADE,

  CONSTRAINT fk_chatrooms_user_1
    FOREIGN KEY (user_1) REFERENCES ssu_users(user_id)
    ON UPDATE CASCADE ON DELETE CASCADE,

  CONSTRAINT fk_chatrooms_user_2
    FOREIGN KEY (user_2) REFERENCES ssu_users(user_id)
    ON UPDATE CASCADE ON DELETE CASCADE,

  -- integrity rules
  CONSTRAINT chk_distinct_users CHECK (user_1 <> user_2),
  CONSTRAINT chk_creator_is_participant CHECK (created_by = user_1 OR created_by = user_2)
);

-- Prevent duplicate rooms for the same unordered pair (A,B) vs (B,A)
CREATE UNIQUE INDEX ux_chatrooms_pair
  ON chatrooms (LEAST(user_1, user_2), GREATEST(user_1, user_2));

-- Helpful lookup indexes
CREATE INDEX idx_chatrooms_user_1 ON chatrooms(user_1);
CREATE INDEX idx_chatrooms_user_2 ON chatrooms(user_2);


-- Drop table if it exists (removes FKs, indexes automatically)
DROP TABLE IF EXISTS messages CASCADE;

-- Recreate table
CREATE TABLE messages (
  message_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_room_id UUID NOT NULL,
  sender_id    UUID NOT NULL,
  receiver_id  UUID NOT NULL,
  message_text TEXT NOT NULL,
  is_read      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT fk_messages_chatroom
    FOREIGN KEY (chat_room_id)
    REFERENCES chatrooms (chat_room_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT fk_messages_sender
    FOREIGN KEY (sender_id)
    REFERENCES ssu_users (user_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  CONSTRAINT fk_messages_receiver
    FOREIGN KEY (receiver_id)
    REFERENCES ssu_users (user_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
);

-- Supporting indexes
CREATE INDEX idx_messages_chat_room_id ON messages(chat_room_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

DROP TABLE IF EXISTS views CASCADE;
CREATE TABLE views (
  user_id   UUID NOT NULL,
  post_id   UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id),
  CONSTRAINT fk_views_user FOREIGN KEY (user_id) REFERENCES ssu_users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_views_post FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE
);

-- Drop table first so we can recreate it cleanly
DROP TABLE IF EXISTS bookmarks CASCADE;

-- Recreate table
CREATE TABLE bookmarks (
  bookmark_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES ssu_users(user_id) ON DELETE CASCADE,
  post_id     UUID NOT NULL REFERENCES posts(post_id)     ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_public   BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT ux_bookmarks_user_post UNIQUE (user_id, post_id)
);

-- Optional: index to speed up queries that list bookmarks for a given post
CREATE INDEX idx_bookmarks_post_id ON bookmarks(post_id);

DROP TABLE IF EXISTS contributors CASCADE;

-- Recreate table
CREATE TABLE IF NOT EXISTS contributors (
  contributor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(120) NOT NULL,
  position       VARCHAR(120) NOT NULL,
  level_name     VARCHAR(120) NOT NULL,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT contributors_level_check
    CHECK (level_name IN ('Junior', 'Mid', 'Senior', 'Lead'))
);

DROP INDEX IF EXISTS idx_post_hashtags_hashtag_id;
DROP TABLE IF EXISTS post_hashtags CASCADE;
DROP TABLE IF EXISTS hashtags CASCADE;

-- Recreate hashtags
CREATE TABLE hashtags (
  hashtag_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hashtag     VARCHAR(255) UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (length(trim(hashtag)) > 0)
);

-- Recreate post_hashtags
CREATE TABLE post_hashtags (
  post_hashtag_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         UUID NOT NULL,
  hashtag_id      UUID NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ux_post_hashtags UNIQUE (post_id, hashtag_id),
  FOREIGN KEY (post_id)    REFERENCES posts(post_id)       ON DELETE CASCADE,
  FOREIGN KEY (hashtag_id) REFERENCES hashtags(hashtag_id) ON DELETE CASCADE
);

-- Helpful index for finding posts by hashtag quickly
CREATE INDEX idx_post_hashtags_hashtag_id ON post_hashtags(hashtag_id);