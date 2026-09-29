import { Suspense } from 'react';
import FriendsContent from '@/components/features/Friends/FriendsContent';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import axios from 'axios';

// Since we are running on the server, we need the absolute URL to the backend.
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function fetchInitialData() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  let isInvalidToken = false;

  try {
    const headers = { Authorization: `Bearer ${token}` };
    const [friendsRes, requestsRes] = await Promise.all([
      axios.get(`${BACKEND_URL}/Friendship?page=1&pageSize=12`, { headers }),
      axios.get(`${BACKEND_URL}/Friendship/requests`, { headers })
    ]);

    return {
      initialFriends: friendsRes.data || { friends: [], totalCount: 0 },
      initialRequests: requestsRes.data || { incoming: [], outgoing: [] },
    };
  } catch (error: any) {
    if (error?.response?.status === 401) {
      isInvalidToken = true;
    } else {
      console.error('SSR fetch failed', error);
    }
  }

  // Handle redirect outside the try-catch block to prevent catching Next.js redirect internal error
  if (isInvalidToken) {
    redirect('/login');
  }

  // Fallback for non-401 errors
  return { initialFriends: { friends: [], totalCount: 0 }, initialRequests: { incoming: [], outgoing: [] } };
}

export default async function FriendsPage() {
  const { initialFriends, initialRequests } = await fetchInitialData();

  return (
    <div className="w-full relative">
      <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading...</div>}>
         <FriendsContent initialFriends={initialFriends} initialRequests={initialRequests} />
      </Suspense>
    </div>
  );
}
