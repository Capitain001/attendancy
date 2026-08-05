"use client";
import { Button } from "@/components/ui/button";
import { logOutUser } from "@/services/auth/actions";
import { LogOut } from "lucide-react";

export default function LogoutButton({ userId }: { userId?: string }) {
    async function handleLogout() {
        await logOutUser({ userId });
    }

    return (
        <Button onClick={handleLogout}
            className=" hover:bg-btn-background-hover  w-full rounded-md px-2 py-2 no-underline"
        >
            <LogOut size={24} /> Logout
        </Button>
    );
}
