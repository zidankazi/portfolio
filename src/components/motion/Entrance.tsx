'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

const EntranceContext = createContext<{ ready: boolean; settle: (side: string) => void; reveal: () => void }>({ ready: true, settle: () => {}, reveal: () => {} });
export const useEntrance = () => useContext(EntranceContext);

export function Entrance({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const reveal = useCallback(() => setRevealed(true), []);
  const settled = useRef(new Set<string>());
  const settle = useCallback((side: string) => {
    settled.current.add(side);
    if (settled.current.size === 2) setReady(true);
  }, []);

  useEffect(() => {
    const skip = window.matchMedia('(max-width: 1023px), (prefers-reduced-motion: reduce)');
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

  const value = useMemo(() => ({ ready, settle, reveal }), [ready, settle, reveal]);
  return (
    <EntranceContext.Provider value={value}>
      <div className="contents" data-puppet-stage={revealed ? 'ready' : ready ? 'threading' : 'dropping'}>
        <noscript><style>{`[data-puppet-stage] main { visibility: visible !important; }`}</style></noscript>
        {children}
      </div>
    </EntranceContext.Provider>
  );
}
