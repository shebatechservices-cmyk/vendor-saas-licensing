import { NextResponse } from "next/server";

export function handleApiError(error: any, customMessage: string = "Internal server error") {
  console.error("API Controller Error:", error);
  const message = error?.message || customMessage;
  const status = typeof error?.statusCode === "number" ? error.statusCode : 500;

  return NextResponse.json(
    {
      success: false,
      error: message,
      message,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

export function handleSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      ...data,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}
