import React from 'react'

export default function ForgotPassword() {
  return (
    <div>
      
    </div>
  )
}



// 'use client';

// import { useAction } from 'next-safe-action/hooks';
// import { useRef, useState, type JSX } from 'react';
// import { toast } from 'sonner';

// import { Email } from '@/components/Auth/Email';
// import { EmailConfirmationPendingCard } from '@/components/Auth/EmailConfirmationPendingCard';
// import { Card } from '@/components/ui/card';
// import { resetPasswordAction } from '@/data/auth/auth';

// export function ForgotPassword(): JSX.Element {
//   const [successMessage, setSuccessMessage] = useState<string | null>(null);
//   const toastRef = useRef<string | number | undefined>(undefined);

//   const { execute, status } = useAction(resetPasswordAction, {
//     onExecute: () => {
//       toastRef.current = toast.loading('Sending password reset link...');
//     },
//     onSuccess: () => {
//       toast.success('Password reset link sent!', {
//         id: toastRef.current,
//       });
//       toastRef.current = undefined;
//       setSuccessMessage('A password reset link has been sent to your email!');
//     },
//     onError: ({ error }) => {
//       const errorMessage =
//         error.serverError ?? 'Failed to send password reset link';
//       toast.error(errorMessage, {
//         id: toastRef.current,
//       });
//       toastRef.current = undefined;
//     },
//   });

//   return (
//     <>
//       {successMessage ? (
//         <EmailConfirmationPendingCard
//           message={successMessage}
//           heading="Reset password link sent"
//           type="reset-password"
//           resetSuccessMessage={setSuccessMessage}
//         />
//       ) : (
//         <Card className="container h-full grid items-center text-left max-w-lg mx-auto overflow-auto">
//           <div className="space-y-4">
//             <h4 className="text-lg font-semibold">Forgot Password</h4>
//             <p className="text-sm text-muted-foreground">
//               Enter your email to receive a Magic Link to reset your password.
//             </p>

//             <Email
//               onSubmit={(email) => {
//                 execute({ email });
//               }}
//               isLoading={status === 'executing'}
//               view="forgot-password"
//             />
//           </div>
//         </Card>
//       )}
//     </>
//   );
// }