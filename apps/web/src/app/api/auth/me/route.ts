// src/app/api/auth/me/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Cette route est dépréciée. Utilisez le RPC d’authentification." },
    { status: 410 },
  );
}
