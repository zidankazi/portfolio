'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

const EntranceContext = createContext<{ ready: boolean; settle: (side: string) => void }>({ ready: true, settle: () => {} });
export const useEntrance = () => useContext(EntranceContext);

export function Entrance({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const settled = useRef(new Set<string>());
  const settle = useCallback((side: string) => {
    settled.current.add(side);
    if (settled.current.size === 2) setReady(true);
  }, []);

  useEffect(() => {
    const skip = window.matchMedia('(max-width: 1023px), (prefers-reduced-motion: reduce)');
    const check = () => { if (skip.matches) setReady(true); };
    const keyboard = (event: KeyboardEvent) => { if (event.key === 'Tab') setReady(true); };
    check();
    skip.addEventListener('change', check);
    window.addEventListener('keydown', keyboard);
    return () => {
      skip.removeEventListener('change', check);
      window.removeEventListener('keydown', keyboard);
    };
  }, []);

  const value = useMemo(() => ({ ready, settle }), [ready, settle]);
  return (
    <EntranceContext.Provider value={value}>
      <div className="contents" data-puppet-stage={ready ? 'ready' : 'dropping'}>
        <noscript><style>{`[data-puppet-stage] main { visibility: visible !important; }`}</style></noscript>
        {children}
      </div>
    </EntranceContext.Provider>
  );
}
