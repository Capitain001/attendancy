"use server";

import type { SignupPersonalInput } from "@/modules/auth/validation";
import { signupPersonal } from "@/modules/auth/actions/signup";

export async function signupPersonalDesktopAction(input: SignupPersonalInput) {
  return signupPersonal(input);
}
