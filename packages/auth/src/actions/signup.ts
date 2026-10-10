import { api } from "../api";

export async function signupPersonal(email: string, password: string) {
  // Keep signup and profile creation on the server; desktop only sends credentials.
  return api.signupPersonalDesktopAction({ email, password });
}
