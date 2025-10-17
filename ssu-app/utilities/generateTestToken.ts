// ./utilities/generateTestToken.ts

// Load .env
require("dotenv").config();

// Import your generateToken utility (CommonJS style)
const { generateAccessToken } = require("./generateToken");
const { generateRefreshToken } =require ("./generateToken");

// Example user (from your Supabase row)
const testUser = {
  id: "33333333-3333-3333-3333-333333333333",
  email: "test_user3@example.com",
  username: "test_user3",
  role: "user",
};

// Generate a token for this user
const token = generateAccessToken(
  testUser.id,
  testUser.email,
  testUser.username,
  testUser.role
);

// Print the token
console.log("Generated JWT:", token);


const refreshToken = generateRefreshToken(
  testUser.id,
  testUser.email,
  testUser.username,
  testUser.role
);

console.log("Refresh Token:", refreshToken);