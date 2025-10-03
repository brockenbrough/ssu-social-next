import bcrypt from 'bcrypt';
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

async function seedUsersAndPosts() {
  await sql.unsafe(`
    DO $$
    DECLARE
        fixed_user_id1 UUID := '11111111-1111-1111-1111-111111111111';
        fixed_user_id2 UUID := '22222222-2222-2222-2222-222222222222';
        fixed_post_id UUID  := '33333333-3333-3333-3333-333333333333';
    BEGIN
        -- Users
        IF NOT EXISTS (SELECT 1 FROM ssu_users WHERE user_id = fixed_user_id1) THEN
            INSERT INTO ssu_users (user_id, username, email, password, created_at, role, profile_image, biography)
            VALUES (fixed_user_id1, 'test_user1', 'test_user1@example.com', 'dummy_password_hash', NOW(), 'user', NULL, 'Auto-created test user.');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM ssu_users WHERE user_id = fixed_user_id2) THEN
            INSERT INTO ssu_users (user_id, username, email, password, created_at, role, profile_image, biography)
            VALUES (fixed_user_id2, 'test_user2', 'test_user2@example.com', 'dummy_password_hash', NOW(), 'user', NULL, 'Auto-created test user.');
        END IF;

        -- Post
        DELETE FROM posts WHERE post_id = fixed_post_id;
        INSERT INTO posts (post_id, user_id, content, image_uri, is_sensitive, has_offensive_text, created_at)
        VALUES (fixed_post_id, fixed_user_id1, 'This is a fixed test post for automated test cases.', NULL, FALSE, FALSE, NOW());
    END $$;
  `);
}

async function seedViews() {
    await sql`
    INSERT INTO views (user_id, post_id)
    VALUES
      ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'),
      ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333'),
      ('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333')
    ON CONFLICT (user_id, post_id) DO NOTHING;
  `;

  const views = await sql`SELECT * FROM views`;
  console.log("Views after seed:", views);
}



export async function GET() {
  try {
    await sql.begin((sql) => [
      //seedUsersAndPosts(),
      seedViews()
    ]);

    return Response.json({ message: "✅ Database seeded successfully" });
  } catch (error) {
    console.error("❌ Error seeding:", error);
    return Response.json({ error: (error as any).message }, { status: 500 });
  }
}
