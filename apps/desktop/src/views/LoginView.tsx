import { LoginForm, type LoginFormProps } from "@attendancy/ui";

export function LoginView({
  error,
  isPending,
  onSubmit,
  onSignup,
}: LoginFormProps) {
  return (
    <LoginForm
      error={error}
      isPending={isPending}
      onSubmit={onSubmit}
      onSignup={onSignup}
    />
  );
}
