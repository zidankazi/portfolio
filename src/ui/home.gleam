import gleam/option.{type Option}
import lib/palette
import lib/player
import lib/projects_state
import lustre/attribute as a
import lustre/element.{type Element, text}
import lustre/element/html as h
import lustre/event
import ui/art
import ui/calendar
import ui/common as c
import ui/player as music
import ui/projects

pub fn view(
  track: Option(player.Track),
  colors: Option(#(palette.Rgb, palette.Rgb)),
  synced: Int,
  now: Int,
  project_model: projects_state.Model,
  project_event: fn(projects_state.Event) -> msg,
  calendar_status: calendar.Status,
  calendar_width: Int,
  focused_date: String,
  retry: msg,
  show_cue: Bool,
  scroll: msg,
  stage: String,
  skip: Bool,
) -> Element(msg) {
  h.div(
    [
      a.class(
        "min-h-screen flex flex-col items-center pt-[190px] sm:pt-[220px] lg:pt-64 pb-16 sm:pb-24 px-4 sm:px-10",
      ),
    ],
    [
      music.ambient(colors),
      h.div(
        [
          a.class("contents"),
          a.id("entrance"),
          a.attribute("data-puppet-stage", stage),
          case skip {
            True -> a.attribute("data-puppet-skip", "true")
            False -> a.none()
          },
        ],
        [
          element.memo([], art.rails),
          element.memo([], art.scene),
          c.div("w-full max-w-[520px] flex flex-col", [
            h.main([a.class("w-full flex justify-center pb-6 font-body mt-2")], [
              c.div("flex flex-col gap-5 w-full", [
                intro(),
                c.bubble(
                  [music.view(track, colors, synced, now)],
                  False,
                  "bubble",
                ),
                c.bubble(
                  [
                    h.a(
                      [
                        a.href("/studio"),
                        a.class(
                          "group/studio block rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-400",
                        ),
                      ],
                      [
                        h.span([], [
                          text("I design and build websites for clients."),
                        ]),
                        h.span(
                          [
                            a.class(
                              "mt-1 flex items-center gap-1 text-zinc-400 transition-colors group-hover/studio:text-zinc-100",
                            ),
                          ],
                          [text("Take a look"), c.icon("arrow", "h-3.5 w-3.5")],
                        ),
                      ],
                    ),
                  ],
                  False,
                  "bubble",
                ),
                projects.view(project_model, project_event),
                c.div("ml-8 sm:ml-11", [
                  calendar.view(
                    calendar_status,
                    calendar_width,
                    focused_date,
                    retry,
                  ),
                ]),
                map(),
                c.div("flex flex-col gap-2 ml-8 sm:ml-11", [
                  c.div(
                    "bg-[#1C1C1E] border border-white/5 text-[#A0A0A0] text-[14px] px-4 py-2 rounded-full w-fit",
                    [text("Find me online:")],
                  ),
                  c.pill(
                    "https://github.com/zidankazi",
                    "I'm @zidankazi on GitHub",
                    "github",
                  ),
                  c.pill(
                    "https://twitter.com/zidaaaaaaaannnn",
                    "I'm @zidaaaaaaaannnn on Twitter/X",
                    "twitter",
                  ),
                ]),
                c.div("flex items-end gap-2 sm:gap-3", [
                  c.image(
                    "/avatar.jpeg",
                    "Zidan Kazi",
                    "w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover shrink-0",
                  ),
                  c.pill(
                    "mailto:hi@zidankazi.com",
                    "Shoot me an email — hi [at] zidankazi [dot] com",
                    "mail",
                  ),
                ]),
              ]),
              case show_cue {
                False -> element.none()
                True ->
                  h.button(
                    [
                      a.type_("button"),
                      event.on_click(scroll),
                      a.attribute("aria-label", "Scroll down for more"),
                      a.class(
                        "scroll-cue fixed bottom-4 left-1/2 z-50 -translate-x-1/2 p-2 text-white/20 transition-colors hover:text-white/50",
                      ),
                    ],
                    [c.icon("chevron", "h-4 w-4")],
                  )
              },
            ]),
          ]),
        ],
      ),
    ],
  )
}

fn intro() -> Element(msg) {
  c.bubble(
    [
      h.p([], [
        text("I'm "),
        h.i([a.class("font-heading text-white text-[20px]")], [text("Zidan")]),
        text(", a junior at "),
        c.external(
          "https://www.stevens.edu/",
          "underline underline-offset-4 decoration-white/30 hover:decoration-white/70 transition-colors",
          [text("Stevens Institute of Technology")],
        ),
        text(" studying Computer Science & Math."),
      ]),
    ],
    False,
    "intro",
  )
}

fn map() -> Element(msg) {
  let href = "https://maps.apple.com/?q=Hoboken, NJ"
  c.div("flex flex-col gap-3", [
    c.div("ml-8 sm:ml-11", [
      c.external(
        href,
        "relative block h-[200px] sm:h-[260px] w-full overflow-hidden rounded-[20px] cursor-pointer",
        [
          c.image(
            "/hoboken_map.png",
            "Map of Hoboken, NJ",
            "absolute inset-0 w-full h-full object-cover",
          ),
          h.span(
            [
              a.class(
                "absolute top-1/2 left-1/2 z-10 -mt-7 -ml-7 block size-14 animate-[ping_2s_cubic-bezier(0,_0,_0.2,_1)_infinite] rounded-full bg-lime-500",
              ),
            ],
            [],
          ),
          c.div(
            "absolute top-1/2 left-1/2 z-10 size-16 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-2 border-white",
            [
              c.image(
                "/avatar.jpeg",
                "Location avatar",
                "absolute inset-0 w-full h-full object-cover",
              ),
            ],
          ),
        ],
      ),
    ]),
    c.bubble(
      [
        h.span([], [
          text("I'm currently in "),
          c.external(
            href,
            "underline underline-offset-4 decoration-white/30 hover:decoration-white/70 transition-colors",
            [text("Hoboken, NJ")],
          ),
          text(" 📍"),
        ]),
      ],
      True,
      "bubble",
    ),
  ])
}
