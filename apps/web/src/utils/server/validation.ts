import { string, uuid, safeParse, pipe } from "valibot";
import { notFound } from "next/navigation";

const uuidSchema = pipe(string(), uuid());

export function validateUUID(value: string): string {
  const result = safeParse(uuidSchema, value);
  console.log("validateUUID", { value, result });
  if (!result.success) notFound();
  return result.output;
}
