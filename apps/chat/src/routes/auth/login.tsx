import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@attendancy/ui/auth/login/login-page";
import { login } from "@attendancy/auth";

export const Route = createFileRoute("/auth/login")({
  component: Login,
});

function Login() {
  return <LoginPage login={login} onSignup={() => {}} />;
}
