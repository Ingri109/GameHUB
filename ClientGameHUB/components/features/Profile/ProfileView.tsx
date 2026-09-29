'use client';

import React from 'react';
import { Trophy, AlertCircle, RefreshCw, Share2, Users } from 'lucide-react';
import { Avatar } from '@/components/shared/Avatar';
import { Button } from '@/components/ui/button';
import { TierListPreview } from '@/components/features/TierList/TierListPreview';
import { ProfileSkeleton } from './ProfileSkeleton';
import Link from 'next/link';
import { api, fetcher } from '@/lib/api';
import useSWR from 'swr';

interface UserAwardDto {
  title: string;
  iconUrl?: string | null;
  count: number;
}

interface UserProfileAggregateDto {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl: string;
  reliabilityScore: number;
  createdAt: string;
  coOpHours: number;
  topAwards: UserAwardDto[];
  recentTiers: any[];
  friendshipStatus: string;
}

interface ProfileViewProps {
  isOwnProfile: boolean;
  targetUsername?: string;
  initialProfileData?: UserProfileAggregateDto | null;
  initialTiersData?: any[] | null;
}


import { useAuthStore } from '@/store/authStore';
export function ProfileView({ isOwnProfile, targetUsername, initialProfileData, initialTiersData }: ProfileViewProps) {
  const { user } = useAuthStore();
  const tempTarget = isOwnProfile ? user?.username : targetUsername;
  const profileEndpoint = tempTarget ? `/user/by-username/${tempTarget}/aggregate` : null;
  // removed old profileEndpoint ? '/user/by-username/' + user?.username + '/aggregate' : `/user/by-username/${targetUsername}/aggregate`;
  

  const { data: profile, error: profileError, isLoading: profileLoading } = useSWR<UserProfileAggregateDto>(profileEndpoint, fetcher, { fallbackData: initialProfileData || undefined, revalidateOnMount: initialProfileData ? false : undefined });

  
  const isLoading = profileLoading;
  const error = profileError ? 'We couldn\'t retrieve the profile data. This might be due to a network connection issue or the data doesn\'t exist.' : null;
  const tiers = profile?.recentTiers || [];

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-slate-400">
        <AlertCircle className="size-12 text-amber-400" />
        <h2 className="text-xl font-bold text-slate-200">Profile Not Found</h2>
        <p className="max-w-md text-center text-sm">{error || 'Unknown error'}</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
          <RefreshCw className="mr-2 size-4" /> Try again
        </Button>
      </div>
    );
  }

  const displayUsername = profile.displayName || (profile.username ? profile.username.charAt(0).toUpperCase() + profile.username.slice(1) : 'Unknown');
  
  // Format member since year
  const memberSinceYear = new Date(profile.createdAt).getFullYear();

  return (
    <>
      <div className="glass mb-6 flex flex-col gap-5 p-6 sm:flex-row sm:items-center relative">
        <Avatar name={displayUsername} url={profile.avatarUrl} />
        <div className="flex-1">
          <p className="text-xs uppercase tracking-[.2em] text-violet-300">Member since {memberSinceYear || 2024}</p>
          <h1 className="mt-1 text-3xl font-bold">
            {displayUsername} <span className="text-sm font-normal text-slate-500">@{profile.username || 'unknown'}</span>
          </h1>
          
          <div className="mt-4 flex items-center gap-3">
             {isOwnProfile && (
               <Link href="/friends">
                 <Button variant="outline" size="sm" className="border-slate-700 bg-slate-800/50 hover:bg-slate-700">
                   <Users className="mr-2 size-4 text-violet-400" />
                   Friends
                 </Button>
               </Link>
             )}
          </div>
        </div>
        <div className="flex gap-8">
          <div>
            <strong className="block text-2xl">{profile.coOpHours}h</strong>
            <span className="text-xs text-slate-500">co-op hours</span>
          </div>
          <div>
            <strong className="block text-2xl">
              {profile.reliabilityScore ? `${Math.round(profile.reliabilityScore)}%` : 'New'}
            </strong>
            <span className="text-xs text-slate-500">reliability</span>
          </div>
        </div>

        {/* Helper quick-share route */}
        {isOwnProfile && (
          <div className="absolute top-4 right-4">
            <Link href={`/profile/${profile.username}/games`}>
               <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" title="Share Tier List">
                 <Share2 className="size-4" />
               </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <div className="glass p-6">
          <h2 className="section-title mb-6">Wall of fame</h2>
          {profile.topAwards && profile.topAwards.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {profile.topAwards.map((award, idx) => (
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4" key={idx}>
                  <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-violet-400/15 text-violet-300 overflow-hidden">
                    {award.iconUrl ? (
                      <img src={award.iconUrl} alt={award.title} className="w-full h-full object-cover" />
                    ) : (
                      <Trophy className="size-5" />
                    )}
                  </div>
                  <strong className="block">{award.title}</strong>
                  <span className="text-xs text-slate-500">x{award.count} earned</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-40 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-700/50 bg-gradient-to-b from-slate-800/20 to-slate-900/20 text-slate-400 transition-colors hover:border-violet-500/30 hover:bg-slate-800/40">
              <Trophy className="mb-3 size-10 text-slate-600 drop-shadow-md" />
              <span className="font-medium text-slate-300">No awards earned yet</span>
              <span className="mt-1 text-xs text-slate-500">Play sessions to unlock achievements.</span>
            </div>
          )}
        </div>

        <div className="glass p-6 overflow-hidden flex flex-col">
          <TierListPreview username={profile.username || ''} hideAddGames={!isOwnProfile} initialTiers={tiers} />
        </div>
      </div>
    </>
  );
}
