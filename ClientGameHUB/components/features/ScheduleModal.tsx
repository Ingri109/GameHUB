'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, Edit3, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api, fetcher } from '@/lib/api';
import useSWR from 'swr';
import { TIME_BLOCKS, NIGHT_BLOCK } from '@/app/matrix/page';
import { Slider } from '@/components/ui/slider';

interface ScheduleModalProps {
  close: () => void;
  visibleDays: { dateStr: string; label: string }[];
  onSaved: () => void;
}

export function ScheduleModal({ close, visibleDays, onSaved }: ScheduleModalProps) {
  const [cells, setCells] = useState<Record<string, any>>({});
  const [initialCells, setInitialCells] = useState<Record<string, any>>({});
  const [initialized, setInitialized] = useState(false);
  
  const { data: scheduleData, isLoading: loading } = useSWR('/schedule/my', fetcher);
  
  // Timer state
  const [toastVisible, setToastVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(6);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [activePopover, setActivePopover] = useState<string | null>(null);

  const ALL_BLOCKS = [...TIME_BLOCKS, NIGHT_BLOCK];

  useEffect(() => {
    if (scheduleData && !initialized) {
      const schedule = scheduleData.blocks || [];
      const newCells: Record<string, any> = {};
      
      schedule.forEach((b: any) => {
        newCells[`${b.date}-${b.blockType}`] = {
          status: b.status,
          exactStart: b.exactStartTime,
          exactEnd: b.exactEndTime
        };
      });
      
      setCells(newCells);
      setInitialCells(newCells);
      setInitialized(true);
    }
  }, [scheduleData, initialized]);

  // Handle outside click for popover
  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // If the click is inside the trigger button or the popover itself, do nothing.
      if (target.closest('.time-popover-trigger') || target.closest('.time-popover-container')) {
        return;
      }
      setActivePopover(null);
    };
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, []);

  const handleCycleStatus = React.useCallback((key: string, blockInfo: any) => {
    setCells(prev => {
      const current = prev[key];
      if (!current || current.status === 0) {
        return { ...prev, [key]: { 
          status: 1, 
          exactStart: `${String(blockInfo.startH).padStart(2, '0')}:00:00`,
          exactEnd: `${String(blockInfo.endH).padStart(2, '0')}:00:00`
        }};
      }
      if (current.status === 1) {
        return { ...prev, [key]: { ...current, status: 2 }};
      }
      return { ...prev, [key]: { ...current, status: 0 }};
    });
  }, []);

  const handleTimeChange = React.useCallback((key: string, newStart: number, newEnd: number) => {
    const format = (h: number) => `${String(h).padStart(2,'0')}:00:00`;
    setCells(p => ({
      ...p,
      [key]: { ...p[key], exactStart: format(newStart), exactEnd: format(newEnd) }
    }));
  }, []);

  const handleSaveClick = () => {
    setToastVisible(true);
    setTimeLeft(6);
    
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    progressIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    saveTimeoutRef.current = setTimeout(() => {
      setToastVisible(false); // Task 2: Explicitly set visibility to false
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      submitData();
    }, 6000);
  };

  const cancelSave = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    setCells(initialCells);
    setToastVisible(false);
  };

  const submitData = async () => {
    const payload = Object.entries(cells).map(([key, val]) => {
      const lastDashIndex = key.lastIndexOf('-');
      const date = key.substring(0, lastDashIndex);
      const blockType = key.substring(lastDashIndex + 1);
      return {
        date,
        blockType: parseInt(blockType),
        status: val.status,
        exactStartTime: val.exactStart,
        exactEndTime: val.exactEnd
      };
    });

    try {
      await api.put('/schedule/my', { blocks: payload });
      onSaved();
      close();
    } catch (err) {
      console.error('Failed to save schedule', err);
      setToastVisible(false); // Let them try again
    }
  };

  const handleTogglePopover = React.useCallback((key: string) => {
    setActivePopover(prev => (prev === key ? null : key));
  }, []);

  return (
    <>
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-5 backdrop-blur-sm shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]">
      <div className="glass max-h-[95vh] w-full max-w-[850px] overflow-auto flex flex-col p-6 shadow-2xl relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[.2em] text-violet-300">Your availability</p>
            <h2 className="mt-2 text-2xl font-bold">Manage schedule</h2>
            <p className="mt-2 text-sm text-slate-400 max-w-lg">
              Click cells to set status. 1st click: <strong className="text-yellow-400">Maybe</strong>, 2nd: <strong className="text-emerald-400">Will be there</strong>. Click the gear icon to adjust exact times.
            </p>
          </div>
          <button onClick={close} className="text-slate-500 hover:text-white bg-slate-900 border border-slate-800 p-2 rounded-md"><X className="size-5" /></button>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-violet-400" />
          </div>
        ) : (
          <>
            <div className="mt-6 flex-1 overflow-auto rounded-xl border border-slate-800/80 bg-slate-950/40 p-2 shadow-inner">
              <div className="min-w-[700px]">
                <div className="grid grid-cols-[80px_repeat(7,1fr)] text-center text-xs font-semibold tracking-wider text-slate-500 mb-2">
                  <span />
                  {visibleDays.map(d => <span key={d.dateStr}>{d.label}</span>)}
                </div>

                <div className="flex flex-col">
                  {TIME_BLOCKS.map(block => (
                    <div className="grid grid-cols-[80px_repeat(7,1fr)] items-center border-b border-slate-800/40 py-1" key={block.id}>
                      <span className="text-xs text-slate-500 font-medium text-center">{block.label}</span>
                      {visibleDays.map((d) => { const key = `${d.dateStr}-${block.type}`; return <ScheduleCell key={key} dayKey={key} blockInfo={block} cell={cells[key]} isOpen={activePopover === key} onCycleStatus={handleCycleStatus} onTimeChange={handleTimeChange} onTogglePopover={handleTogglePopover} />; })}
                    </div>
                  ))}
                  
                  <div className="my-3 mx-2 border-b-2 border-dashed border-slate-800/60"></div>
                  
                  <div className="grid grid-cols-[80px_repeat(7,1fr)] items-center py-1">
                    <span className="text-xs text-slate-500 font-medium text-center">{NIGHT_BLOCK.label}</span>
                    {visibleDays.map((d) => { const key = `${d.dateStr}-${NIGHT_BLOCK.type}`; return <ScheduleCell key={key} dayKey={key} blockInfo={NIGHT_BLOCK} cell={cells[key]} isOpen={activePopover === key} onCycleStatus={handleCycleStatus} onTimeChange={handleTimeChange} onTogglePopover={handleTogglePopover} />; })}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
               <Button variant="outline" onClick={close}>Close</Button>
               <Button onClick={handleSaveClick} disabled={toastVisible} className="bg-violet-500 hover:bg-violet-400 text-white min-w-[140px]">
                 Save Schedule
               </Button>
            </div>
          </>
        )}

      </div>
    </div>
    {/* Optimistic UI Toast overlay - MOVED OUTSIDE MODAL */}
    {toastVisible && (
      <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-4 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-4 overflow-hidden animate-in slide-in-from-bottom-5">
        <div 
          className="absolute bottom-0 left-0 h-[2px] bg-violet-500 transition-all ease-linear" 
          style={{ width: `${(timeLeft / 6) * 100}%`, transitionDuration: '1s' }} 
        />
        <span className="text-sm text-slate-200">
          Зміни будуть додані, ви впевнені?
        </span>
        <div className="flex items-center gap-3">
          <button 
            onClick={cancelSave} 
            className="text-sm font-medium text-violet-400 underline hover:text-violet-300"
          >
            Відмінити
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
              if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
              setToastVisible(false); // Task 1: Instantly set to false and use clearTimeout
            }} 
            className="text-slate-400 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    )}
    </>
  )
}


interface ScheduleCellProps {
  dayKey: string;
  blockInfo: any;
  cell: any;
  isOpen: boolean;
  onCycleStatus: (key: string, blockInfo: any) => void;
  onTogglePopover: (key: string) => void;
  onTimeChange: (key: string, start: number, end: number) => void;
}

const ScheduleCell = React.memo(({ dayKey, blockInfo, cell, isOpen, onCycleStatus, onTogglePopover, onTimeChange }: ScheduleCellProps) => {
  const hasData = cell && cell.status > 0;

  let bgClasses = 'border-slate-800 bg-slate-900/70 hover:brightness-125'; // empty
  if (hasData) {
    if (cell.status === 1) bgClasses = 'border-yellow-400/50 bg-yellow-500/80 shadow-[0_0_14px_rgba(234,179,8,.2)] text-slate-950 font-medium';
    if (cell.status === 2) bgClasses = 'border-emerald-400 bg-emerald-500/90 shadow-[0_0_14px_rgba(16,185,129,.2)] text-slate-950 font-medium';
  }

  const minLimit = blockInfo.startH;
  const maxLimit = blockInfo.endH;
  const globalStartH = cell && cell.exactStart ? parseInt(cell.exactStart.split(':')[0]) : minLimit;
  const globalEndH = cell && cell.exactEnd ? parseInt(cell.exactEnd.split(':')[0]) : maxLimit;

  // Local state for smooth dragging without triggering global re-renders
  const [localRange, setLocalRange] = React.useState([globalStartH, globalEndH]);

  // Sync local state when global state changes (e.g. initial load or cancel)
  React.useEffect(() => {
    setLocalRange([globalStartH, globalEndH]);
  }, [globalStartH, globalEndH]);

  return (
    <div
      className={`relative m-1 min-h-[50px] rounded-md border transition-all duration-200 select-none block cursor-pointer ${bgClasses}`}
      onClick={(e) => { e.stopPropagation(); onCycleStatus(dayKey, blockInfo); }}
    >
      <div className="absolute inset-0 right-[28px] z-10 flex flex-col items-center justify-center pointer-events-none">
        {hasData && (
          <div className="flex flex-col items-center justify-center line-clamp-2 leading-tight">
            <span className="text-[10px] tracking-tight font-mono font-bold">{cell.exactStart.slice(0,5)}</span>
            <span className="text-[10px] tracking-tight font-mono font-bold">{cell.exactEnd.slice(0,5)}</span>
          </div>
        )}
      </div>

      {hasData && (
        <div
          className="time-popover-trigger absolute top-0 bottom-0 right-0 w-[28px] z-20 flex flex-col justify-center items-center bg-black/10 hover:bg-black/20 border-l border-black/10 cursor-pointer pointer-events-auto rounded-r-[5px]"
          onClick={(e) => { e.stopPropagation(); onTogglePopover(dayKey); }}
        >
           <Settings2 className="size-3.5 opacity-80 relative z-10" />
        </div>
      )}

      {isOpen && hasData && (
        <div
          className="time-popover-container absolute left-1/2 bottom-[110%] -translate-x-1/2 z-50 w-[220px] rounded-lg border border-slate-700 bg-slate-900 p-4 shadow-2xl text-slate-200"
          onClick={e => e.stopPropagation()}
          onPointerDown={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
        >
          <div className="mb-4 text-xs font-semibold text-slate-300 flex justify-between items-center">
            Refine exact time
            <X className="size-4 cursor-pointer text-slate-500 hover:text-white" onClick={() => onTogglePopover(dayKey)} />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex justify-between text-[10px] text-slate-400 font-mono tracking-wider">
              <span>{String(localRange[0]).padStart(2,'0')}:00</span>
              <span>{String(localRange[1]).padStart(2,'0')}:00</span>
            </div>
            <Slider
              min={minLimit}
              max={maxLimit}
              step={1}
              minStepsBetweenThumbs={1}
              value={localRange}
              onValueChange={(vals) => {
                  let [newStart, newEnd] = vals;
                  if (newStart !== localRange[0]) {
                      if (newStart >= localRange[1]) newStart = localRange[1] - 1;
                      newEnd = localRange[1];
                  } else if (newEnd !== localRange[1]) {
                      if (newEnd <= localRange[0]) newEnd = localRange[0] + 1;
                      newStart = localRange[0];
                  }
                  if (newStart >= newEnd) return;
                  setLocalRange([newStart, newEnd]);
              }}
              onValueCommit={(vals) => {
                  onTimeChange(dayKey, vals[0], vals[1]);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
});
