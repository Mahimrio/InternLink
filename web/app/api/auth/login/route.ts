import { NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Proxy to backend /api/auth/login
    const data = await apiClient("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });

    // The backend returns { otpRequired: true, otpToken: "..." }
    return NextResponse.json(data, { status: 202 });
  } catch (err: unknown) {
    const error = err as Error & { details?: unknown, status?: number };
    return NextResponse.json(
      { error: error.message, details: error.details },
      { status: error.status || 500 }
    );
  }
}
