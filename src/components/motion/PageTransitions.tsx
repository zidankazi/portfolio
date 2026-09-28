'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { ViewTransitions } from 'next-view-transitions';

const NavigationContext = createContext(false);
export const useHasNavigated = () => useContext(NavigationContext);

export function PageTransitions({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [visit, setVisit] = useState({ pathname, hasNavigated: false });
  const hasNavigated = visit.hasNavigated || visit.pathname !== pathname;

  if (visit.pathname !== pathname) {
    setVisit({ pathname, hasNavigated: true });
  }

  return (
    <NavigationContext.Provider value={hasNavigated}>
      <ViewTransitions>{children}</ViewTransitions>
    </NavigationContext.Provider>
  );
}
