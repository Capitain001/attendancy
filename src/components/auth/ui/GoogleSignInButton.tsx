"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { signInWithOAuthProvider } from "@/modules/auth/providers";
import { Loader1 } from "@/components/loaders/Loader";
import { cn } from "@/lib/utils";

interface GoogleSignInButtonProps {
  className?: string;
  next?: string;
}

export default function GoogleSignInButton({ className, next }: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signInWithOAuthProvider("google", next);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      className={cn("flex flex-row gap-2 w-48 items-center justify-center rounded-xl", className)}
      onClick={handleLogin}
      disabled={loading}
    >
      {loading ? (
        <Loader1 className="size-4 opacity-70" />
      ) : (
        <Image src="/assets/icons/google.png" alt="Google" width={16} height={16} />
      )}
      Continue with Google
    </Button>
  );
}