import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SignupPage } from "@attendancy/ui";
import { signupPersonal } from "@attendancy/auth";

export const Route = createFileRoute("/auth/signup/personal")({
  component: Signup,
});

function Signup() {
  const navigate = useNavigate();
  return (
    <SignupPage
      signup={signupPersonal}
      onLogin={() => navigate({ to: "/auth/login" })}
    />
  );
}
