-- Drop the app_users table if it exists
DROP TABLE IF EXISTS ssu_users;

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
DROP TABLE IF EXISTS posts;
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

DROP TABLE IF EXISTS likes;
CREATE TABLE likes ();

DROP TABLE IF EXISTS followers;
CREATE TABLE followers ();

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