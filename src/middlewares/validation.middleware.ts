import { NextResponse } from "next/server";

export function validateRequiredFields(body: Record<string, any>, fields: string[]): string | null {
  for (const field of fields) {
    if (body[field] === undefined || body[field] === null || body[field] === "") {
      return `Field '${field}' is required.`;
    }
  }
  return null;
}
