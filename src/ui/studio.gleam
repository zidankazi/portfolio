import data/studio
import gleam/list
import lustre/attribute as a
import lustre/element.{type Element, text}
import lustre/element/html as h
import ui/common as c

pub fn view() -> Element(msg) {
  h.main([a.class("studio")], [
    h.a([a.href("/"), a.class("back")], [
      c.icon("back", "h-4 w-4"),
      text("back to the conversation"),
    ]),
    h.h1([a.class("sr-only")], [text("Studio, websites by Zidan Kazi")]),
    h.section(
      [a.class("work"), a.attribute("aria-label", "Selected websites")],
      [
        c.div("stack", list.map(studio.sites(), site_view)),
      ],
    ),
  ])
}

fn site_view(site: studio.Site) -> Element(msg) {
  h.a(
    [
      a.href(site.href),
      a.target("_blank"),
      a.rel("noopener noreferrer"),
      a.class("project " <> site.position),
      a.attribute(
        "aria-label",
        "Visit " <> site.name <> " (opens in a new tab)",
      ),
    ],
    [
      c.div("card", [
        h.div(
          [
            a.class("preview"),
            a.attribute("data-live-src", case site.live {
              True -> site.href
              False -> ""
            }),
            a.attribute("data-live-name", site.name),
            a.attribute("aria-hidden", "true"),
          ],
          [
            c.image(site.image, "", "poster absolute inset-0 h-full w-full"),
          ],
        ),
        c.div("shade", []),
        c.div("label", [h.span([a.class("name")], [text(site.name)])]),
        c.icon("arrow", "visit"),
      ]),
      h.img([
        a.src(site.decoration),
        a.alt(""),
        a.attribute("aria-hidden", "true"),
        a.attribute("width", "90"),
        a.attribute("height", "110"),
        a.class("decoration"),
      ]),
    ],
  )
}
