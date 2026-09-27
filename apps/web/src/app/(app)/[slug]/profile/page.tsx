// src/app/(app)/[slug]/profile/page.tsx
import { redirect } from 'next/navigation';

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/${slug}/settings/profile`);
}

