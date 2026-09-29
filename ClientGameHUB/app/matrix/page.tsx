'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Settings2, Loader2, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Heading } from '@/components/shared/Heading';
import { Avatar } from '@/components/shared/Avatar';
import { ScheduleModal } from '@/components/features/ScheduleModal';
import { api, fetcher } from '@/lib/api';
import useSWR from 'swr';
import { MatrixSkeleton } from './MatrixSkeleton';

export const TIME_BLOCKS = [
  { id: 1, label: '09-12', defaultRange: '09:00 - 12:00', type: 1, startH: 9, endH: 12 },
  { id: 2, label: '13-16', defaultRange: '13:00 - 16:00', type: 2, startH: 13, endH: 16 },
  { id: 3, label: '17-20', defaultRange: '17:00 - 20:00', type: 3, startH: 17, endH: 20 },
  { id: 4, label: '21-23', defaultRange: '21:00 - 23:00', type: 4, startH: 21, endH: 23 },
]; 

export const NIGHT_BLOCK = { id: 5, label: '00-03', defaultRange: '00:00 - 03:00', type: 5, startH: 0, endH: 3 };

const WEEK_DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export function formatDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function MatrixPage() {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [weekOffset, setWeekOffset] = useState(0);
  const [activePopover, setActivePopover] = useState<string | null>(null);
  const [baseAnchor] = useState(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  });

  const { data: friendsData, isLoading: friendsLoading } = useSWR('/Friendship', fetcher);
  const { data: schedulesData, isLoading: schedulesLoading, mutate: refreshSchedules } = useSWR('/schedule/friends', fetcher);
  const loading = friendsLoading || schedulesLoading;

  const friends = useMemo(() => {
    if (!friendsData) return [];
    const friendData = friendsData.friends || friendsData.items || friendsData || [];
    return Array.isArray(friendData) ? friendData.filter((x: any) => x.status === 'ACCEPTED') : [];
  }, [friendsData]);
  
  const schedules = useMemo(() => {
    if (!schedulesData) return [];
    const schedData = schedulesData.items || schedulesData || [];
    return Array.isArray(schedData) ? schedData : [];
  }, [schedulesData]);

  const toggleFriend = (id: string) => {
    setSelectedFriends(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const handleNextWeek = () => {
    if (weekOffset < 5) setWeekOffset(prev => prev + 1);
  };

  const handlePrevWeek = () => {
    if (weekOffset > 0) setWeekOffset(prev => prev - 1);
  };

  const visibleDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(baseAnchor.getTime());
      d.setDate(baseAnchor.getDate() + (weekOffset * 7) + i);
      return {
        dateObj: d,
        dateStr: formatDate(d),
        label: `${WEEK_DAYS[d.getDay()]} ${d.getDate()}`
      };
    });
  }, [weekOffset, baseAnchor]);

  const filteredFriends = useMemo(() => {
    const filtered = friends.filter(f => f.username.toLowerCase().includes(searchQuery.toLowerCase()) || (f.displayName && f.displayName.toLowerCase().includes(searchQuery.toLowerCase())));
    return Array.from(new Map(filtered.map(f => [f.userId, f])).values());
  }, [friends, searchQuery]);

  useEffect(() => {
    const handleDocClick = () => setActivePopover(null);
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, []);
  const friendsMap = useMemo(() => new Map(friends.map(f => [f.userId, f])), [friends]);
  const schedulesMap = useMemo(() => new Map(schedules.map(s => [s.userId, s])), [schedules]);

  const renderBlock = (day: any, blockInfo: any) => {
    const attendees = selectedFriends.map(fid => {
      const friendObj = friendsMap.get(fid);
      const schedule = schedulesMap.get(fid);
      if (!friendObj || !schedule) return null;

      const blockRecord = schedule.blocks?.find((b: any) => b.date === day.dateStr && b.blockType === blockInfo.type);
      if (blockRecord && blockRecord.status > 0) {
        return {
          friend: friendObj,
          status: blockRecord.status,
          exactStart: blockRecord.exactStartTime,
          exactEnd: blockRecord.exactEndTime
        };
      }
      return null;
    }).filter(Boolean) as any[];

    const hasMaybe = attendees.some(a => a.status === 1);
    const hasWill = attendees.some(a => a.status === 2);
    
    let bgClasses = 'border-slate-800/80 bg-slate-900/40';

    if (attendees.length > 0) {
      if (hasMaybe && hasWill) {
        bgClasses = 'border-emerald-400/50 bg-gradient-to-br from-emerald-500/50 to-yellow-500/50 shadow-[0_0_14px_rgba(16,185,129,.15)]';
      } else if (hasWill) {
        bgClasses = 'border-emerald-400/50 bg-emerald-500/50 shadow-[0_0_14px_rgba(16,185,129,.15)]';
      } else {
        bgClasses = 'border-yellow-400/50 bg-yellow-500/50 shadow-[0_0_14px_rgba(234,179,8,.15)]';
      }
    }

    const popoverId = `${day.dateStr}-${blockInfo.type}`;
    const isOpen = activePopover === popoverId;

    return (
      <div 
        key={popoverId}
        className={`relative m-1 min-h-12 rounded-md border transition-colors duration-300 flex items-end p-1 select-none cursor-pointer ${bgClasses}`}
        onClick={(e) => {
          e.stopPropagation();
          setActivePopover(isOpen ? null : popoverId);
        }}
      >
        {attendees.length > 0 && (
          <div className="flex -space-x-1">
            {attendees.slice(0, 3).map((a, i) => (
              <div key={`cell-${day.dateStr}-${blockInfo.id}-friend-${a.friend.userId}`} className="relative ring-1 ring-slate-900 rounded-full bg-slate-800 z-10" style={{ zIndex: 10 - i }}>
                <Avatar name={a.friend.displayName || a.friend.username} url={a.friend.avatarUrl} small className="size-5" />
              </div>
            ))}
            {attendees.length > 3 && (
              <div className="z-0 flex size-5 items-center justify-center rounded-full bg-slate-800 ring-1 ring-slate-900 text-[9px] font-medium text-slate-300">
                +{attendees.length - 3}
              </div>
            )}
          </div>
        )}

        {isOpen && (
          <div 
            className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 z-50 w-48 rounded-lg border border-slate-700 bg-slate-900 p-3 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-2 border-b border-slate-800 pb-2 text-xs font-medium text-slate-300">
              {blockInfo.defaultRange}
            </div>
            {attendees.length === 0 ? (
              <p className="text-xs text-slate-500">No friends available</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-[150px] overflow-auto">
                {attendees.map(a => (
                  <div key={`popover-${day.dateStr}-${blockInfo.id}-friend-${a.friend.userId}`} className="flex items-center gap-2">
                    <span 
                      className={`size-2 shrink-0 rounded-full ${a.status === 2 ? 'bg-emerald-400' : 'bg-yellow-400'}`} 
                      title={a.status === 2 ? 'Will be there' : 'Maybe'}
                    />
                    <Avatar name={a.friend.displayName || a.friend.username} url={a.friend.avatarUrl} small className="size-5" />
                    <span className="truncate text-xs font-medium text-slate-300">
                      {a.friend.displayName ? (a.friend.displayName.length > 16 ? a.friend.displayName.slice(0, 14) + "..." : a.friend.displayName) : (a.friend.username.length > 16 ? a.friend.username.slice(0, 14) + "..." : a.friend.username)}
                    </span>
                    {(a.exactStart && a.exactEnd) && (
                      <span className="ml-auto text-[9px] text-slate-500 mt-[2px]">
                        {a.exactStart.slice(0,5)}-{a.exactEnd.slice(0,5)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <MatrixSkeleton />;
  }

  return (
    <>
      <Heading eyebrow="Time Calendar" title="Find your overlap">
        <Button variant="outline" onClick={() => setScheduleOpen(true)}>
          <Settings2 data-icon="inline-start" /> Manage schedule
        </Button>
      </Heading>

      <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
        <aside className="glass p-5 flex flex-col h-full">
          <h2 className="section-title mb-5">Select friends</h2>
          
          {friends.length > 10 && (
            <div className="relative mb-4">
              <Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search friends..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-slate-800 bg-slate-900/50 py-1.5 pl-8 pr-3 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50"
              />
            </div>
          )}

          <div className="flex flex-col gap-2 overflow-auto max-h-[400px] pr-1">
            {loading ? (
              <Loader2 className="size-5 animate-spin text-slate-500 mx-auto mt-4" />
            ) : filteredFriends.length === 0 ? (
               <p className="text-sm text-slate-400">No friends found.</p>
            ) : (
              filteredFriends.map((f: any, i) => {
                const isSelected = selectedFriends.includes(f.userId);
                let displayName = f.displayName || f.username;
                if (displayName.length > 16) displayName = displayName.slice(0, 14) + "...";

                return (
                  <button 
                    key={`sidebar-friend-${f.userId}`}
                    onClick={() => toggleFriend(f.userId)}
                    className={`flex items-center gap-3 rounded-lg border p-2 text-left text-sm transition-all duration-200 ${
                      isSelected 
                        ? 'border-violet-500/50 bg-violet-500/10 shadow-md shadow-violet-500/5 text-slate-200' 
                        : 'border-transparent hover:bg-slate-800/50 text-slate-400'
                    }`}
                  >
                    <Avatar name={f.displayName || f.username} url={f.avatarUrl} small />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="truncate font-medium">{displayName}</span>
                      {f.displayName && f.displayName !== f.username && (
                         <span className="text-[10px] text-slate-500 truncate mt-[1px]">@{f.username}</span>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>

          <div className="mt-auto pt-6 text-xs text-slate-500 space-y-2">
            <p className="uppercase tracking-wider">Legend</p>
            <p className="flex items-center gap-2"><i className="size-3 rounded bg-emerald-500/80" />Will be there</p>
            <p className="flex items-center gap-2"><i className="size-3 rounded bg-yellow-500/80" />Maybe</p>
            <p className="flex items-center gap-2"><i className="size-3 rounded border border-slate-800 bg-slate-900" />No overlap</p>
          </div>
        </aside>

        <div className="glass overflow-auto p-3 flex flex-col">
          <div className="px-5 pt-3 pb-2 mb-2 flex items-center justify-between border-b border-slate-800/50">
            <h3 className="text-sm font-medium text-slate-300">
              Pick friends on the left to see their calendar
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 mr-2">Week {weekOffset === 0 ? 'Current' : `+${weekOffset}`}</span>
              <Button variant="outline" size="icon" className="size-7" onClick={handlePrevWeek} disabled={weekOffset === 0}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="outline" size="icon" className="size-7" onClick={handleNextWeek} disabled={weekOffset >= 5}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>

          <div className="min-w-[650px] p-2 flex flex-col flex-1">
            <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-slate-800 pb-3 text-center text-xs text-slate-500">
              <span />
              {visibleDays.map(d => (
                <span key={d.dateStr} className="font-medium text-slate-300">{d.label}</span>
              ))}
            </div>

            <div className="flex-1 flex flex-col mt-2">
              {TIME_BLOCKS.map(block => (
                <div className="grid grid-cols-[80px_repeat(7,1fr)] flex-1 min-h-[60px]" key={block.id}>
                  <div className="flex items-center justify-center border-r border-slate-800/50 py-3 text-xs text-slate-500 font-medium">
                    {block.label}
                  </div>
                  {visibleDays.map((d, ci) => renderBlock(d, block))}
                </div>
              ))}

              <div className="my-2 border-b-2 border-dashed border-slate-800/80"></div>

              <div className="grid grid-cols-[80px_repeat(7,1fr)] flex-1 min-h-[60px]">
                <div className="flex items-center justify-center border-r border-slate-800/50 py-3 text-xs text-slate-500 font-medium">
                  {NIGHT_BLOCK.label}
                </div>
                {visibleDays.map((d, ci) => renderBlock(d, NIGHT_BLOCK))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {scheduleOpen && <ScheduleModal close={() => setScheduleOpen(false)} onSaved={refreshSchedules} visibleDays={visibleDays} />}
    </>
  );
}
