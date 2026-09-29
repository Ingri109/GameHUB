'use server';

export async function getUserTierList(username: string) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    try {
        const res = await fetch(`${baseUrl}/User/${username}/games`, {
            cache: 'no-store' // Do not cache for testing purposes, or use next revalidate logic
        });
        
        if (res.status === 404) {
            return { error: 'User not found.' };
        }
        
        if (!res.ok) {
            return { error: 'Failed to fetch tier list.' };
        }
        
        const data = await res.json();
        return { data };
    } catch (err: any) {
        console.error("Error fetching tier list server-side:", err);
        return { error: 'Network or internal server error.' };
    }
}
