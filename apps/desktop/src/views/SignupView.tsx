import { SignupForm, type SignupFormProps } from "@attendancy/ui";

export function SignupView({
  error,
  success,
  isPending,
  onSubmit,
  onLogin,
}: SignupFormProps) {
  return (
    <SignupForm
      error={error}
      success={success}
      isPending={isPending}
      onSubmit={onSubmit}
      onLogin={onLogin}
    />
  );
}
