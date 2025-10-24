// app/api/user/test/route.ts  (App Router version)
import { NextResponse } from "next/server";
import { corsHeaders } from "@/utilities/cors";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export async function GET() {
  const testUser = {
    username: "test_user_integration",
    email: "test_user_integration@example.com",
    password: "Password123!",
  };

  try {
    // --- TEST SIGNUP ---
    const signupRes = await fetch(`${BASE_URL}/api/user/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });
    const signupData = await signupRes.json();

    if (signupRes.status !== 201 && signupRes.status !== 409) {
      return NextResponse.json(
        { step: "signup", success: false, status: signupRes.status, signupData },
        { status: 500 }
      );
    }

    // If already exists, we skip creation and assume it’s fine
    const userId = signupData._id || "will_fetch_after_login";

    // --- TEST LOGIN ---
    const loginRes = await fetch(`${BASE_URL}/api/user/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: testUser.username,
        password: testUser.password,
      }),
    });
    const loginData = await loginRes.json();

    if (loginRes.status !== 200 || !loginData.accessToken) {
      return NextResponse.json(
        { step: "login", success: false, status: loginRes.status, loginData },
        { status: 500 }
      );
    }
    // --- TEST GET USER BY USERNAME ---
    const getUserByUsernameRes = await fetch(
      `${BASE_URL}/api/user/getUserByUsername/${testUser.username}`
    );
    const getUsernameData = await getUserByUsernameRes.json();

    if (getUserByUsernameRes.status !== 200 || getUsernameData.username !== testUser.username) {
      return NextResponse.json(
        {
          step: "getUserByUsername",
          success: false,
          status: getUserByUsernameRes.status,
          data: getUsernameData,
        },
        { status: 500 }
      );
    }

    const accessToken = loginData.accessToken;
    const loggedInUser = loginData.user;
    const finalUserId = loggedInUser?._id || userId;

    // --- TEST DELETE BY ID ---
    const deleteRes = await fetch(
      `${BASE_URL}/api/user/deleteById/${finalUserId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    const deleteData = await deleteRes.json();

    if (deleteRes.status !== 200) {
      return NextResponse.json(
        { step: "deleteById", success: false, status: deleteRes.status, deleteData },
        { status: 500 }
      );
    }

    // --- TEST GET ALL ---
    const getAllRes = await fetch(`${BASE_URL}/api/user/getAll`);
    const getAllData = await getAllRes.json();

    if (getAllRes.status !== 200 || !Array.isArray(getAllData)) {
      return NextResponse.json(
        { step: "getAll", success: false, status: getAllRes.status, getAllData },
        { status: 500 }
      );
    }

    // Check that deleted user no longer exists
    const stillExists = getAllData.some((u: any) => u.username === testUser.username);

    if (stillExists) {
      return NextResponse.json(
        {
          step: "verification",
          success: false,
          message: "User still exists after deletion",
        },
        { status: 500 }
      );
    }

    // --- ALL TESTS PASSED ---
    return NextResponse.json(
      {
        success: true,
        message: "Signup, login, getByUsername[username] deleteById, and getAll tests all passed!",
        details: {
          signupStatus: signupRes.status,
          loginStatus: loginRes.status,
          getUserByUsernameStatus: getUserByUsernameRes.status,
          deleteStatus: deleteRes.status,
          getAllStatus: getAllRes.status,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}