// src/components/auth/ui/LogOutForm.tsx
// server side 

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { logoutActionForm } from "@/modules/auth";
import { cn } from "@/lib/utils";

interface LogOutFormProps {
  className?: string;
}

export default function LogOutForm({ className }: LogOutFormProps) {
  return (
    <form action={logoutActionForm} className={cn("w-full", className)}>
      <Button
        type="submit"
        className="hover:bg-btn-background-hover text-foreground w-full bg-muted rounded-md px-2 py-2 no-underline"
      >
        <LogOut size={24} /> Logout
      </Button>
    </form>
  );
}
