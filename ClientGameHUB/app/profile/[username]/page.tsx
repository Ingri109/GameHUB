import { ProfileView } from '@/components/features/Profile/ProfileView';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function fetchInitialData(username: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  let isInvalidToken = false;

  try {
    const headers = { Authorization: `Bearer ${token}` };
    const profileRes = await fetch(`${BACKEND_URL}/user/by-username/${username}/aggregate`, {
      headers,
      next: { revalidate: 60 }
    });
    
    if (!profileRes.ok) {
      if (profileRes.status === 401) isInvalidToken = true;
      throw new Error(`Failed to fetch profile: ${profileRes.status}`);
    }
    
    const profileData = await profileRes.json();
    
    return {
      initialProfileData: profileData,
      initialTiersData: profileData?.recentTiers || [],
    };
  } catch (error: any) {
    if (error?.response?.status === 401) {
      isInvalidToken = true;
    } else {
      console.error('SSR fetch failed for user profile', error);
    }
  }

  if (isInvalidToken) {
    redirect('/login');
  }

  return { initialProfileData: null, initialTiersData: [] };
}

export default async function UserProfilePage(props: { params: Promise<{ username: string }> }) {
  const params = await props.params;
  const username = params.username;

  const { initialProfileData, initialTiersData } = await fetchInitialData(username);

  return (
    <ProfileView
      isOwnProfile={false}
      targetUsername={username}
      initialProfileData={initialProfileData}
      initialTiersData={initialTiersData}
    />
  );
}
