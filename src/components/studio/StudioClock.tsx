'use client';

import { useEffect, useState } from 'react';

const clock = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'America/New_York',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

export function StudioClock() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setTime(clock.format(new Date()));
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <span>
      <span className="sr-only">New York time</span>
      <time dateTime={time ?? undefined}>{time ?? '\u00a0\u00a0:\u00a0\u00a0:\u00a0\u00a0'}</time>
    </span>
  );
}
