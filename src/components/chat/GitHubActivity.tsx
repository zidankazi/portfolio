"use client";

/*
 * Adapted from Rare UI: https://rareui.com/components/githubactivity
 * MIT + Commons Clause License Condition v1.0 + Attribution
 *
 * Copyright (c) 2026 Swami Malode
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, and distribute the Software as part of an
 * application, website, or product, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * Attribution Requirement
 *
 * Any project that ships any part of the Software must credit Rare UI with a
 * visible link to https://rareui.com, placed where a visitor or user can find it,
 * such as a site footer, an about page, a credits screen or a README. The credit
 * and the copyright notice above must not be removed from the source you copied.
 *
 * Commons Clause Restriction
 *
 * You may use this Software, including for any commercial purpose, so long as you
 * do not sell, sublicense, or redistribute the components themselves, whether
 * alone, in a bundle, or as a ported version.
 *
 * No Warranty
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.

 */

import * as React from "react";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import { Github, ArrowUpRight } from "lucide-react";

export type ContributionLevel = 0 | 1 | 2 | 3 | 4;

export type Contribution = {
  date: string;
  count: number;
  level: ContributionLevel;
};

const DEFAULT_ACCENT = "#39d353";
const DEFAULT_CELL_SIZE = 11;
const DEFAULT_MONTHS = 12;
const WEEKS_PER_MONTH = 365.25 / 12 / 7;
const MIN_LABEL_WEEKS = 3;

const gapFor = (cellSize: number) => Math.max(2, Math.round(cellSize / 4));
// never zero: weeks.slice(-0) would hand back the whole history instead of nothing
const weeksFor = (months: number) =>
  Math.max(1, Math.ceil(months * WEEKS_PER_MONTH));

const useIsoLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const CELL_FADE = { duration: 0.2, ease: EASE_OUT } as const;
const TOOLTIP_FADE = { duration: 0.14, ease: EASE_OUT } as const;
const TOOLTIP_EDGE = 8;
const COLUMN_STAGGER = 0.012;
const LABEL_BLUR = 6;
const LABEL_REVEAL = { duration: 0.45, ease: EASE_OUT } as const;

const LEVELS = [0, 1, 2, 3, 4] as const;

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function toMonthLabels(weeks: Contribution[][]) {
  const labels: (string | null)[] = weeks.map(() => null);
  const monthAt = (index: number) => weeks[index]?.[0]?.date.slice(5, 7);

  let start = 0;
  for (let i = 1; i <= weeks.length; i++) {
    if (i < weeks.length && monthAt(i) === monthAt(start)) continue;
    // a shorter run is narrower than the label itself, so it would sit under the next month
    if (i - start >= MIN_LABEL_WEEKS) {
      labels[start] = MONTH_NAMES[Number(monthAt(start)) - 1] ?? null;
    }
    start = i;
  }

  return labels;
}

const LEVEL_OPACITY: Record<ContributionLevel, number> = {
  0: 0,
  1: 0.3,
  2: 0.52,
  3: 0.76,
  4: 1,
};

type LevelStyle = { backgroundColor: string; opacity: number };

type HoveredDay = { day: Contribution; x: number; y: number };

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function describeDay({ count, date }: Contribution) {
  const noun = count === 1 ? "contribution" : "contributions";
  return `${count} ${noun} on ${DATE_FORMAT.format(new Date(`${date}T00:00:00`))}`;
}

const CALENDAR_API = "https://github-contributions-api.jogruber.de/v4";

type ApiDay = { date: string; count: number; level: number };
async function fetchCalendar(login: string, signal: AbortSignal) {
  const res = await fetch(`${CALENDAR_API}/${encodeURIComponent(login)}?y=last`, { signal });
  if (!res.ok) throw new Error("Contribution calendar unavailable");

  const data = await res.json();
  const days: ApiDay[] = data?.contributions;
  if (!Array.isArray(days) || !days.length || days.some((day) =>
    !/^\d{4}-\d{2}-\d{2}$/.test(day.date) ||
    !Number.isFinite(Date.parse(`${day.date}T00:00:00Z`)) ||
    !Number.isInteger(day.count) || day.count < 0 ||
    !Number.isInteger(day.level) || day.level < 0 || day.level > 4
  )) throw new Error("Invalid contribution calendar");

  return days.map<Contribution>((day) => ({ date: day.date, count: day.count, level: day.level as ContributionLevel }));
}

function useGitHubUser(login?: string) {
  const [result, setResult] = React.useState<{
    login: string;
    contributions: Contribution[];
    failed: boolean;
  }>();
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    if (!login) return;
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);

    fetchCalendar(login, controller.signal).then((contributions) => {
      if (active) setResult({ login, contributions, failed: false });
    }).catch(() => {
      if (active) setResult({ login, contributions: [], failed: true });
    }).finally(() => window.clearTimeout(timeout));

    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [login, attempt]);

  return {
    data: result?.login === login ? result : undefined,
    retry: () => {
      setResult(undefined);
      setAttempt((value) => value + 1);
    },
  };
}

function toScale(accent: string | string[]): LevelStyle[] {
  if (typeof accent === "string") {
    return LEVELS.map((level) => ({
      backgroundColor: accent,
      opacity: LEVEL_OPACITY[level],
    }));
  }

  const colors = accent.length > 4 ? accent : ["transparent", ...accent];
  return LEVELS.map((level) => {
    const color = colors[level] ?? colors.at(-1) ?? "transparent";
    return { backgroundColor: color, opacity: color === "transparent" ? 0 : 1 };
  });
}

function toWeeks(contributions: Contribution[]) {
  const weeks: Contribution[][] = [];
  for (const day of contributions) {
    if (!weeks.length || new Date(`${day.date}T00:00:00Z`).getUTCDay() === 0) weeks.push([]);
    weeks[weeks.length - 1].push(day);
  }
  return weeks;
}

function useFittedColumns(cellSize: number, gap: number) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [columns, setColumns] = React.useState<number>();

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () =>
      setColumns(
        Math.max(1, Math.floor((el.clientWidth + gap) / (cellSize + gap))),
      );

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [cellSize, gap]);

  return [ref, columns] as const;
}

const Tooltip = ({
  hovered,
  reduceMotion,
}: {
  hovered: HoveredDay;
  reduceMotion: boolean | null;
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [left, setLeft] = React.useState(hovered.x);

  useIsoLayoutEffect(() => {
    const half = (ref.current?.offsetWidth ?? 0) / 2;
    const edge = TOOLTIP_EDGE + half;
    setLeft(Math.min(Math.max(hovered.x, edge), window.innerWidth - edge));
  }, [hovered]);

  return createPortal(
    <div
      role="tooltip"
      className="pointer-events-none fixed z-50"
      style={{
        left,
        top: hovered.y < 40 ? hovered.y + DEFAULT_CELL_SIZE + 8 : hovered.y,
        transform: hovered.y < 40 ? "translateX(-50%)" : "translate(-50%, calc(-100% - 8px))",
      }}
    >
      <motion.div
        ref={ref}
        className="whitespace-nowrap rounded-lg bg-zinc-200 px-2 py-1 text-[11px] font-medium text-zinc-950 shadow-md"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
        transition={reduceMotion ? { duration: 0 } : TOOLTIP_FADE}
      >
        {describeDay(hovered.day)}
      </motion.div>
    </div>,
    document.body,
  );
};

const ContributionGrid = ({
  contributions,
  scale,
  cellSize,
  months,
  showMonths,
  reduceMotion,
}: {
  contributions: Contribution[];
  scale: LevelStyle[];
  cellSize: number;
  months: number;
  showMonths: boolean;
  reduceMotion: boolean | null;
}) => {
  const weeks = React.useMemo(() => toWeeks(contributions), [contributions]);
  const gap = gapFor(cellSize);
  const [ref, columns] = useFittedColumns(cellSize, gap);
  const [hovered, setHovered] = React.useState<HoveredDay>();
  const [focusedDate, setFocusedDate] = React.useState<string>();

  React.useEffect(() => {
    const dismiss = () => setHovered(undefined);
    window.addEventListener("scroll", dismiss, { passive: true });
    window.addEventListener("resize", dismiss);
    return () => {
      window.removeEventListener("scroll", dismiss);
      window.removeEventListener("resize", dismiss);
    };
  }, []);

  const cap = Math.min(weeks.length, weeksFor(months));
  const visible = weeks.slice(-Math.min(cap, columns ?? cap));
  const visibleDays = visible.flat();
  const tabDate = visibleDays.some((day) => day.date === focusedDate)
    ? focusedDate : visibleDays.at(-1)?.date;
  const sweepEnd = (visible.length - 1) * COLUMN_STAGGER + CELL_FADE.duration;

  const hover = (day: Contribution) => (event: React.SyntheticEvent) => {
    const cell = event.currentTarget.getBoundingClientRect();
    setHovered({ day, x: cell.left + cell.width / 2, y: cell.top });
  };

  return (
    <div
      ref={ref}
      data-slot="github-activity-grid"
      role="group"
      aria-label="GitHub contribution calendar; recent weeks shown"
      className="relative"
    >
      {showMonths && (
        <motion.div
          className="flex justify-center"
          style={{ gap, marginBottom: gap }}
          initial={
            reduceMotion
              ? false
              : { opacity: 0, filter: `blur(${LABEL_BLUR}px)` }
          }
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{
            ...LABEL_REVEAL,
            delay: reduceMotion ? 0 : sweepEnd,
          }}
        >
          {toMonthLabels(visible).map((month, index) => (
            <div
              key={index}
              className="relative h-3 shrink-0"
              style={{ width: cellSize }}
            >
              {month && (
                <span className="absolute left-0 top-0 text-[10px] leading-none text-zinc-500">
                  {month}
                </span>
              )}
            </div>
          ))}
        </motion.div>
      )}

      <div
        className="flex justify-center overflow-hidden"
        style={{ gap }}
        onPointerLeave={() => setHovered(undefined)}
      >
        {visible.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col" style={{ gap }}>
            {week.map((day, dayIndex) => (
              <motion.button
                type="button"
                key={day.date}
                data-date={day.date}
                onPointerEnter={hover(day)}
                onFocus={(event) => {
                  setFocusedDate(day.date);
                  hover(day)(event);
                }}
                onBlur={() => setHovered(undefined)}
                onPointerDown={hover(day)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setHovered(undefined);
                    return;
                  }
                  const index = visibleDays.findIndex((entry) => entry.date === day.date);
                  const offsets: Record<string, number> = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 };
                  let next = index;
                  if (event.key in offsets) next += offsets[event.key];
                  else if (event.key === "Home") next = 0;
                  else if (event.key === "End") next = visibleDays.length - 1;
                  else return;
                  event.preventDefault();
                  const nextDay = visibleDays[Math.min(visibleDays.length - 1, Math.max(0, next))];
                  ref.current?.querySelector<HTMLButtonElement>(`[data-date="${nextDay.date}"]`)?.focus();
                }}
                aria-label={describeDay(day)}
                tabIndex={day.date === tabDate ? 0 : -1}
                className="shrink-0 rounded-[3px] bg-white/[0.06] outline-none focus-visible:ring-2 focus-visible:ring-zinc-200 focus-visible:ring-offset-1 focus-visible:ring-offset-[#161618]"
                style={{
                  width: cellSize,
                  height: cellSize,
                  marginTop: dayIndex === 0 ? new Date(`${day.date}T00:00:00Z`).getUTCDay() * (cellSize + gap) : undefined,
                }}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  ...CELL_FADE,
                  delay: reduceMotion ? 0 : weekIndex * COLUMN_STAGGER,
                }}
              >
                <div
                  className="h-full w-full rounded-[3px]"
                  style={scale[day.level] ?? scale[0]}
                />
              </motion.button>
            ))}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {hovered && (
          <Tooltip
            key="tooltip"
            hovered={hovered}
            reduceMotion={reduceMotion}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export type GitHubActivityProps = {
  username: string;
};

export function GitHubActivity({ username }: GitHubActivityProps) {
  const reduceMotion = useReducedMotion();
  const { data, retry } = useGitHubUser(username);
  const contributions = data?.contributions ?? [];
  const accent = DEFAULT_ACCENT;
  const cellSize = DEFAULT_CELL_SIZE;
  const months = DEFAULT_MONTHS;
  const showMonths = true;

  const scale = React.useMemo(() => toScale(accent), [accent]);
  const total = contributions.reduce((sum, day) => sum + day.count, 0);

  const heading = `${total.toLocaleString("en-US")} contributions in the last year`;

  return (
    <div
      data-slot="github-activity"
      className="relative w-full overflow-hidden rounded-[20px] border border-white/5 bg-[#161618] p-4 shadow-sm"
      aria-busy={!data}
    >
      <div className="mb-4 flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] text-zinc-200">GitHub activity</p>
          <p className="mt-0.5 text-[11px] text-zinc-400" aria-live="polite">
            {!data ? "Loading activity…" : data.failed ? "Activity is unavailable right now." : heading}
          </p>
        </div>
        <a href={`https://github.com/${username}`} target="_blank" rel="noreferrer"
          aria-label={`Visit ${username} on GitHub`}
          className="inline-flex min-h-7 shrink-0 items-center gap-1 rounded-sm text-zinc-400 hover:text-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-400">
          <Github className="h-4 w-4" aria-hidden="true" />
          <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
        </a>
      </div>

      {!data ? (
        <div className="h-[108px] rounded-sm opacity-40" aria-hidden="true"
          style={{ backgroundImage: "radial-gradient(circle, #52525b 3px, transparent 3px)", backgroundSize: "14px 14px" }} />
      ) : data.failed ? (
        <div className="flex h-[108px] items-center">
          <button type="button" onClick={retry}
            className="min-h-11 rounded-sm text-[13px] text-zinc-400 underline underline-offset-4 hover:text-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-400">
            Try again
          </button>
        </div>
      ) : <ContributionGrid
        contributions={contributions}
        scale={scale}
        cellSize={cellSize}
        months={months}
        showMonths={showMonths}
        reduceMotion={reduceMotion}
      />}

    </div>
  );
}
