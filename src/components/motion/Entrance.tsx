'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useHasNavigated } from './PageTransitions';

const EntranceContext = createContext<{ ready: boolean; skip: boolean; settle: (side: string) => void; reveal: () => void }>({ ready: true, skip: false, settle: () => {}, reveal: () => {} });
export const useEntrance = () => useContext(EntranceContext);

export function Entrance({ children }: { children: ReactNode }) {
  const skip = useHasNavigated();
  const [settledReady, setReady] = useState(skip);
  const ready = skip || settledReady;
  const [revealed, setRevealed] = useState(skip);
  const reveal = useCallback(() => setRevealed(true), []);
  const settled = useRef(new Set<string>());
  const settle = useCallback((side: string) => {
    settled.current.add(side);
    if (settled.current.size === 2) setReady(true);
  }, []);

  useEffect(() => {
    const skip = window.matchMedia('(prefers-reduced-motion: reduce)');
    const skipEntrance = () => { setReady(true); setRevealed(true); };
    const check = () => { if (skip.matches) skipEntrance(); };
    const keyboard = (event: KeyboardEvent) => { if (event.key === 'Tab') skipEntrance(); };
    check();
    skip.addEventListener('change', check);
    window.addEventListener('keydown', keyboard);
    return () => {
      skip.removeEventListener('change', check);
      window.removeEventListener('keydown', keyboard);
    };
  }, []);

  const value = useMemo(() => ({ ready, skip, settle, reveal }), [ready, skip, settle, reveal]);
  return (
    <EntranceContext.Provider value={value}>
      <div className="contents" data-puppet-skip={skip || undefined} data-puppet-stage={skip || revealed ? 'ready' : ready ? 'threading' : 'dropping'}>
        <noscript><style>{`[data-puppet-stage] main { visibility: visible !important; }`}</style></noscript>
        {children}
      </div>
    </EntranceContext.Provider>
  );
}
