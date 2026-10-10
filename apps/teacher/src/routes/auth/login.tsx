import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LoginPage } from "@attendancy/ui";
import { login } from "@attendancy/auth";

export const Route = createFileRoute("/auth/login")({
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  return (
    <LoginPage
      login={login}
      onSignup={() => navigate({ to: "/auth/signup/personal" })}
    />
  );
}
