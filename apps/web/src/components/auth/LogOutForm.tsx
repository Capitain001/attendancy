import { logOutUserForm as logoutAction } from '@/services/auth/actions'
import { LogOut } from 'lucide-react'
import React from 'react'
import { Button } from '../ui/button'

export default function LogOutForm() {
    return (
        <div>
            <form action={logoutAction}>
                <Button type="submit" variant="outline" size="sm" className="w-full">
                    <LogOut className="h-4 w-4 mr-2" />
                    Déconnexion
                </Button>
            </form>
        </div>
    )
}
