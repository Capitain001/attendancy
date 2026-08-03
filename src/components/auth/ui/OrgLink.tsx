import { orgPath, redirectUser } from '@/config'
import { UserInfo } from '@/types'
import Link from 'next/link'
import React from 'react'

export default async function OrgLink({user}: {user: UserInfo}) {

   const path=  redirectUser(user)
   console.log("path", path)
   const orgName = user.organization?.name
   const orgSlug = user.organization?.slug
   console.log("orgSlug", orgSlug)
  return (
    <div>
      <Link href={path}>{orgName}</Link>
    </div>
  )
}


export async function LinkOrg({ user }: { user?: UserInfo }) {
  const link = {
    href: "/",
    label: undefined,
  };

  if (user) {
    link.href = orgPath(user);
    //@ts-ignore
    link.label = user.organization?.name ;
  }

  return link;
}
