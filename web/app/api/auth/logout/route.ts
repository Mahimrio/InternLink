import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiClient } from "@/lib/api-client";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (refreshToken) {
      // Best effort logout on backend
      await apiClient("/api/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {
        // Ignore backend errors on logout (e.g., token already revoked)
      });
      
      cookieStore.delete({
        name: "refreshToken",
        path: "/api/auth",
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Logout failed." },
      { status: 500 }
    );
  }
}
