import { NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const data = await apiClient("/api/auth/resend-otp", {
      method: "POST",
      body: JSON.stringify(body),
    });

    return NextResponse.json(data, { status: 202 });
  } catch (err: unknown) {
    const error = err as Error & { details?: unknown, status?: number };
    return NextResponse.json(
      { error: error.message, details: error.details },
      { status: error.status || 500 }
    );
  }
}
