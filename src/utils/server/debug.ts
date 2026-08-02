import { cookies } from "next/headers";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";

export const PRISMA_DEBUG_COOKIE = "__prisma_debug";

export type PrismaDebugPayload = {
  code: string;
  model: string;
  target: string | null;
  message: string;
};

export async function debugPrismaError(error: unknown): Promise<PrismaDebugPayload | null> {
  if (process.env.NODE_ENV !== "development") return null;
  if (!(error instanceof PrismaClientKnownRequestError)) return null;

  const meta = error.meta as Record<string, unknown> | undefined;
  const driverCause = (meta?.driverAdapterError as { cause?: Record<string, unknown> } | undefined)
    ?.cause;

  const target: string | null =
    Array.isArray(meta?.target)
      ? (meta.target as string[]).slice().sort().join(",")
      : (meta?.target as string | undefined) ??
        (/unique constraint "([^"]+)"/.exec(
          (driverCause?.originalMessage as string | undefined) ?? ""
        )?.[1]) ??
        ((driverCause?.constraint as { index?: string } | undefined)?.index ?? null);

  const payload: PrismaDebugPayload = {
    code: error.code,
    model: (meta?.modelName as string | undefined) ?? "unknown",
    target,
    message: error.message,
  };

  console.group("🔥 PRISMA ERROR");
  console.log("Code   :", payload.code);
  console.log("Model  :", payload.model);
  console.log("Target :", payload.target);
  console.log("Message:", payload.message);
  console.groupEnd();

  (await cookies()).set(PRISMA_DEBUG_COOKIE, JSON.stringify(payload), {
    path: "/",
    maxAge: 15,
    httpOnly: false,
    sameSite: "strict",
  });

  return payload;
}
