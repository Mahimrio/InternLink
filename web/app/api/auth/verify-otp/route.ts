import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiClient } from "@/lib/api-client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Call the backend API
    const data = await apiClient("/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify(body),
    }) as { refreshToken: string, accessToken: string, expiresInSeconds: number, role: string };

    // The backend returns { accessToken, refreshToken, expiresInSeconds, role }
    // Extract the refreshToken to store securely in an httpOnly cookie
    const { refreshToken, ...publicData } = data;

    const cookieStore = await cookies();
    cookieStore.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/auth", // Only send this cookie to our BFF auth routes
      maxAge: 60 * 60 * 24 * 7, // 7 days (matches backend logic)
    });

    // Return the safe data to the client (access token + role, NO refresh token)
    return NextResponse.json(publicData);
  } catch (err: unknown) {
    const error = err as Error & { details?: unknown, status?: number };
    return NextResponse.json(
      { error: error.message, details: error.details },
      { status: error.status || 500 }
    );
  }
}
