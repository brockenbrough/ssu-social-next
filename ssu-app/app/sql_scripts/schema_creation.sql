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

DROP TABLE IF EXISTS notifications;
CREATE TABLE notifications ();

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

DROP TABLE IF EXISTS chatRoom;
CREATE TABLE chatRoom ();

DROP TABLE IF EXISTS message;
CREATE TABLE message ();

DROP TABLE IF EXISTS views;
CREATE TABLE views ();

DROP TABLE IF EXISTS bookmarks;
CREATE TABLE bookmarks ();

DROP TABLE IF EXISTS contributors;
CREATE TABLE contributors ();

DROP TABLE IF EXISTS hashtags;
CREATE TABLE hashtags ();

DROP TABLE IF EXISTS post_hashtags;
CREATE TABLE post_hashtags ();