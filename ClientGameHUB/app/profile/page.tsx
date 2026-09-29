import React from 'react';
import { ProfileView } from '@/components/features/Profile/ProfileView';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function fetchInitialData() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  let shouldRedirect = false;

  try {
    const headers = { Authorization: `Bearer ${token}` };
    const ctxRes = await fetch(`${BACKEND_URL}/user/context`, {
      headers,
      next: { revalidate: 0 } // Context fetching should not be cached per-user
    });
    
    if (!ctxRes.ok) {
      if (ctxRes.status === 401) shouldRedirect = true;
      throw new Error('Failed to fetch context');
    }
    
    const ctxData = await ctxRes.json();
    const username = ctxData?.username;
    
    if (!username) {
      shouldRedirect = true;
    } else {
      const profileRes = await fetch(`${BACKEND_URL}/user/by-username/${username}/aggregate`, {
        headers,
        next: { revalidate: 60 }
      });

      if (!profileRes.ok) {
        throw new Error('Failed to fetch profile aggregate');
      }

      const profileData = await profileRes.json();

      return {
        initialProfileData: profileData,
        initialTiersData: profileData?.recentTiers || [],
      };
    }
  } catch (error: any) {
    if (error?.response?.status === 401) {
      shouldRedirect = true;
    } else {
      console.error('SSR fetch failed for profile', error);
    }
  }

  if (shouldRedirect) {
    redirect('/login');
  }

  return { initialProfileData: null, initialTiersData: [] };
}

export default async function ProfilePage() {
  const { initialProfileData, initialTiersData } = await fetchInitialData();

  return <ProfileView isOwnProfile={true} initialProfileData={initialProfileData} initialTiersData={initialTiersData} />;
}
