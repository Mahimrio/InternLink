import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiClient } from "@/lib/api-client";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token available." }, { status: 401 });
    }

    // Call the backend API to exchange the refresh token for a new pair
    const data = await apiClient("/api/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }) as { refreshToken: string, accessToken: string, expiresInSeconds: number, role: string };

    // Extract the new tokens
    const { refreshToken: newRefreshToken, ...publicData } = data;

    cookieStore.set("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/auth",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json(publicData);
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    // If the refresh token is invalid or revoked, clear the cookie
    const cookieStore = await cookies();
    cookieStore.delete({
      name: "refreshToken",
      path: "/api/auth",
    });

    return NextResponse.json(
      { error: error.message || "Failed to refresh token." },
      { status: error.status || 401 }
    );
  }
}
