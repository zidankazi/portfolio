import data/projects
import gleam/list
import gleam/option.{None, Some}
import gleam/string
import lib/projects_state as state
import lustre/attribute as a
import lustre/element.{type Element, text}
import lustre/element/html as h
import lustre/event
import ui/common as c

pub fn view(
  model: state.Model,
  dispatch: fn(state.Event) -> msg,
) -> Element(msg) {
  let open = state.is_open(model)
  h.div(
    [
      a.id("projects"),
      a.class("flex gap-2 sm:gap-3 items-start w-full"),
      event.on_mouse_enter(dispatch(state.MouseEntered)),
      event.on_mouse_leave(dispatch(state.MouseLeft)),
    ],
    [
      c.avatar(),
      h.div(
        [
          a.attribute("data-puppet-anchor", "projects"),
          a.class(
            "min-w-0 bg-[#161618] text-[#d4d4d4] rounded-[20px] rounded-tl-sm text-[14px] leading-[1.6] w-full border border-white/5 shadow-sm overflow-hidden",
          ),
        ],
        [
          h.button(
            [
              a.type_("button"),
              event.on_click(dispatch(state.TogglePinned)),
              a.attribute("aria-expanded", case open {
                True -> "true"
                False -> "false"
              }),
              a.attribute("aria-controls", "project-list"),
              a.class(
                "w-full text-left px-4 pt-3 pb-3 border-b border-white/10 flex items-center justify-between gap-3",
              ),
            ],
            [
              h.span([], [
                text("Some projects I’ve built for the love of the game. "),
                h.span([a.class("hint-hover text-zinc-500")], [
                  text("Hover your mouse here to see the list."),
                ]),
                h.span([a.class("hint-tap text-zinc-500")], [
                  text(case open {
                    True -> "Tap to collapse."
                    False -> "Tap to explore."
                  }),
                ]),
              ]),
              h.span(
                [
                  a.class("tap-chevron shrink-0 text-zinc-500"),
                  a.style("transform", case open {
                    True -> "rotate(180deg)"
                    False -> "rotate(0deg)"
                  }),
                  a.style("transition", "transform 200ms ease"),
                ],
                [c.icon("chevron", "w-4 h-4")],
              ),
            ],
          ),
          h.div([a.class("relative"), a.id("project-list")], [
            h.div(
              [
                a.class("project-list overflow-hidden select-none"),
                a.attribute("data-open", case open {
                  True -> "true"
                  False -> "false"
                }),
              ],
              [
                h.div(
                  [a.id("project-rows")],
                  list.map(projects.projects(), row),
                ),
              ],
            ),
            h.div(
              [
                a.class(
                  "project-fade pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#161618] via-[#161618]/80 to-transparent",
                ),
                a.style("opacity", case open {
                  True -> "0"
                  False -> "1"
                }),
              ],
              [],
            ),
          ]),
        ],
      ),
    ],
  )
}

fn row(project: projects.Project) -> Element(msg) {
  h.div(
    [
      a.attribute("data-project-preview", project.title),
      a.class(
        "w-full px-4 py-3 transition-colors duration-100 hover:bg-white/[0.06]",
      ),
    ],
    [
      c.div("flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1", [
        h.h2(
          [a.class("font-heading italic text-white text-[17px] leading-snug")],
          [text(project.title)],
        ),
        c.div(
          "flex gap-3 shrink-0",
          list.map(project.links, fn(link) {
            c.external(
              link.href,
              "inline-flex min-h-9 items-center sm:min-h-0 cursor-pointer text-[13px] text-zinc-400 underline underline-offset-2 hover:text-zinc-200 hover:decoration-zinc-200 transition-colors",
              [text(link.label)],
            )
          }),
        ),
      ]),
      h.p(
        [a.class("text-zinc-300 text-[14px] mt-1 leading-snug")],
        description(project),
      ),
    ],
  )
}

fn description(project: projects.Project) -> List(Element(msg)) {
  case project.description_link {
    None -> [text(project.description)]
    Some(link) -> {
      case string.split_once(project.description, link.text) {
        Error(_) -> [text(project.description)]
        Ok(#(before, after)) -> [
          text(before),
          c.external(
            link.href,
            "cursor-pointer underline underline-offset-4 decoration-white/30 hover:decoration-white/70 transition-colors",
            [text(link.text)],
          ),
          text(after),
        ]
      }
    }
  }
}
