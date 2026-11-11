// src/app/auth/org/profile/helper.ts
"use server";
import { redirect } from "next/navigation";
import { REDIRECT_URL } from "@/config";
import { withParams } from "@/utils/server/form/action";
import { createPersonalOrgAction } from "@/features/personal";

export async function selectPersonalRoleFormAction(formData: FormData) {
  const role = formData.get("role") as never;
  const res = await createPersonalOrgAction(role);
  if (!res.data) {
    redirect(withParams("/auth/org/profile", { organizationId: "personal", error: "failed" }));
  }
  redirect(REDIRECT_URL);
}
