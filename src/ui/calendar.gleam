// 
// Adapted from Rare UI: https://rareui.com/components/githubactivity
// MIT + Commons Clause License Condition v1.0 + Attribution
// 
// Copyright (c) 2026 Swami Malode
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, and distribute the Software as part of an
// application, website, or product, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
// 
// Attribution Requirement
// 
// Any project that ships any part of the Software must credit Rare UI with a
// visible link to https://rareui.com, placed where a visitor or user can find it,
// such as a site footer, an about page, a credits screen or a README. The credit
// and the copyright notice above must not be removed from the source you copied.
// 
// Commons Clause Restriction
// 
// You may use this Software, including for any commercial purpose, so long as you
// do not sell, sublicense, or redistribute the components themselves, whether
// alone, in a bundle, or as a ported version.
// 
// No Warranty
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
// 
// 

import gleam/float
import gleam/int
import gleam/list
import lib/calendar
import lustre/attribute as a
import lustre/element.{type Element, text}
import lustre/element/html as h
import lustre/event
import ui/common as c

pub type Status {
  Loading
  Failed
  Loaded(days: List(calendar.Day))
}

pub fn view(
  status: Status,
  width: Int,
  focused: String,
  retry: msg,
) -> Element(msg) {
  let heading = case status {
    Loading -> "Loading activity…"
    Failed -> "Activity is unavailable right now."
    Loaded(days) ->
      format_number(calendar.total(days)) <> " contributions in the last year"
  }
  h.div(
    [
      a.attribute("data-slot", "github-activity"),
      a.class(
        "relative w-full overflow-hidden rounded-[20px] border border-white/5 bg-[#161618] p-4 shadow-sm",
      ),
      a.attribute("aria-busy", case status {
        Loading -> "true"
        _ -> "false"
      }),
    ],
    [
      c.div("mb-4 flex min-w-0 items-start justify-between gap-3", [
        c.div("min-w-0", [
          h.p([a.class("text-[13px] text-zinc-200")], [text("GitHub activity")]),
          h.p(
            [
              a.class("mt-0.5 text-[11px] text-zinc-400"),
              a.attribute("aria-live", "polite"),
            ],
            [text(heading)],
          ),
        ]),
        c.external(
          "https://github.com/zidankazi",
          "inline-flex min-h-7 shrink-0 items-center gap-1 rounded-sm text-zinc-400 hover:text-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-400",
          [c.icon("github", "h-4 w-4"), c.icon("arrow", "h-3 w-3")],
        ),
      ]),
      case status {
        Loading ->
          h.div(
            [
              a.class("h-[108px] rounded-sm opacity-40"),
              a.attribute("aria-hidden", "true"),
              a.style(
                "background-image",
                "radial-gradient(circle, #52525b 3px, transparent 3px)",
              ),
              a.style("background-size", "14px 14px"),
            ],
            [],
          )
        Failed ->
          c.div("flex h-[108px] items-center", [
            h.button(
              [
                a.type_("button"),
                event.on_click(retry),
                a.class(
                  "min-h-11 rounded-sm text-[13px] text-zinc-400 underline underline-offset-4 hover:text-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-400",
                ),
              ],
              [text("Try again")],
            ),
          ])
        Loaded(days) -> grid(days, width, focused)
      },
    ],
  )
}

fn grid(days: List(calendar.Day), width: Int, focused: String) -> Element(msg) {
  let weeks = calendar.fit(days, width)
  let last = case list.last(list.flatten(weeks)) {
    Ok(day) -> day.date
    _ -> ""
  }
  let tab_date = case
    list.any(list.flatten(weeks), fn(day) { day.date == focused })
  {
    True -> focused
    False -> last
  }
  h.div(
    [
      a.attribute("data-slot", "github-activity-grid"),
      a.attribute("role", "group"),
      a.attribute(
        "aria-label",
        "GitHub contribution calendar; recent weeks shown",
      ),
      a.class("relative"),
    ],
    [
      h.div(
        [
          a.class("calendar-months flex justify-center"),
          a.style("gap", "3px"),
          a.style("margin-bottom", "3px"),
        ],
        list.map(calendar.labels(weeks), fn(label) {
          h.div([a.class("relative h-3 shrink-0"), a.style("width", "11px")], [
            h.span(
              [
                a.class(
                  "absolute left-0 top-0 text-[10px] leading-none text-zinc-500",
                ),
              ],
              [text(label)],
            ),
          ])
        }),
      ),
      h.div(
        [a.class("flex justify-center overflow-hidden"), a.style("gap", "3px")],
        list.index_map(weeks, fn(week, index) {
          h.div(
            [a.class("flex flex-col"), a.style("gap", "3px")],
            list.index_map(week, fn(day, row) {
              h.button(
                [
                  a.type_("button"),
                  a.attribute("data-date", day.date),
                  a.attribute("aria-label", calendar.describe(day)),
                  a.attribute("tabindex", case day.date == tab_date {
                    True -> "0"
                    False -> "-1"
                  }),
                  a.class(
                    "calendar-day shrink-0 rounded-[3px] bg-white/[0.06] outline-none focus-visible:ring-2 focus-visible:ring-zinc-200 focus-visible:ring-offset-1 focus-visible:ring-offset-[#161618]",
                  ),
                  a.style("width", "11px"),
                  a.style("height", "11px"),
                  a.style("margin-top", case row {
                    0 -> int.to_string(calendar.weekday(day.date) * 14) <> "px"
                    _ -> "0"
                  }),
                  a.style(
                    "--cell-delay",
                    float.to_string(int.to_float(index) *. 0.012) <> "s",
                  ),
                ],
                [
                  h.div(
                    [
                      a.class("h-full w-full rounded-[3px]"),
                      a.style("background-color", "#39d353"),
                      a.style("opacity", case day.level {
                        1 -> "0.3"
                        2 -> "0.52"
                        3 -> "0.76"
                        4 -> "1"
                        _ -> "0"
                      }),
                    ],
                    [],
                  ),
                ],
              )
            }),
          )
        }),
      ),
    ],
  )
}

pub fn tooltip(label: String, x: Float, y: Float) -> Element(msg) {
  h.div(
    [
      a.id("calendar-tooltip"),
      a.attribute("role", "tooltip"),
      a.class(
        "pointer-events-none fixed z-50 whitespace-nowrap rounded-lg bg-zinc-200 px-2 py-1 text-[11px] font-medium text-zinc-950 shadow-md",
      ),
      a.style("left", float.to_string(x) <> "px"),
      a.style(
        "top",
        float.to_string(case y <. 40.0 {
          True -> y +. 19.0
          False -> y
        })
          <> "px",
      ),
      a.style("transform", case y <. 40.0 {
        True -> "translateX(-50%)"
        False -> "translate(-50%, calc(-100% - 8px))"
      }),
    ],
    [text(label)],
  )
}

@external(javascript, "../browser_ffi.mjs", "format_number")
fn format_number(value: Int) -> String
