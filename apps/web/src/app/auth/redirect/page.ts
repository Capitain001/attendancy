import {  redirectUser } from '@/config'
import {  PROFILE_URL } from '@/config/url'
import { checkUserProfile } from '@/modules/auth/profile'
import { getUserInfo } from '@/modules/user/userInfo'
import { redirect } from 'next/navigation'

export default async function redirectPage() {
    const user = await getUserInfo()
    const hasProfile = await checkUserProfile(user?.id!)

    console.log("hasProfile", hasProfile)
    if(!hasProfile) {
        return redirect(PROFILE_URL)
    }
    const redirectPath = redirectUser(user!)
    redirect(redirectPath)
    
}
