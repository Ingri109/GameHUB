import React from 'react';
import { getUserTierList } from '@/app/actions/tierList.actions';
import { TierListClientView } from '@/components/features/TierList/TierListClientView';
import { AlertCircle } from 'lucide-react';

export default async function UserTierListPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  
  
  const { data: tiers, error } = await getUserTierList(username);


  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-slate-400">
        <AlertCircle className="size-12 text-amber-400" />
        <h2 className="text-xl font-bold text-slate-200">{error}</h2>
      </div>
    );
  }

  return <TierListClientView initialTiers={tiers || []} username={username} />;
}
