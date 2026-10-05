import data/studio
import gleam/dynamic/decode
import gleam/float
import gleam/int
import gleam/list
import gleam/result
import lustre/attribute as a
import lustre/element.{type Element, text}
import lustre/element/html as h
import lustre/event
import ui/common as c

pub fn view(
  widths: List(#(String, Int)),
  ready: List(String),
  loaded: fn(String) -> msg,
) -> Element(msg) {
  h.main([a.class("studio")], [
    h.a([a.href("/"), a.class("back")], [
      c.icon("back", "h-4 w-4"),
      text("back to the conversation"),
    ]),
    h.h1([a.class("sr-only")], [text("Studio, websites by Zidan Kazi")]),
    h.section(
      [a.class("work"), a.attribute("aria-label", "Selected websites")],
      [
        c.div(
          "stack",
          list.map(studio.sites(), fn(site) {
            site_view(site, widths, ready, loaded)
          }),
        ),
      ],
    ),
  ])
}

fn site_view(
  site: studio.Site,
  widths: List(#(String, Int)),
  ready: List(String),
  loaded: fn(String) -> msg,
) -> Element(msg) {
  let width =
    result.unwrap(list.find(widths, fn(item) { item.0 == site.name }), #(
      site.name,
      0,
    )).1
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
            case site.live && width > 0 {
              False -> element.none()
              True ->
                h.iframe([
                  a.src(site.href),
                  a.title(site.name <> " live preview"),
                  a.attribute("tabindex", "-1"),
                  a.attribute("loading", "eager"),
                  a.attribute("allow", "autoplay"),
                  a.attribute("sandbox", "allow-scripts allow-same-origin"),
                  a.class(
                    "frame"
                    <> case list.contains(ready, site.name) {
                      True -> " ready"
                      False -> ""
                    },
                  ),
                  a.style(
                    "transform",
                    "scale("
                      <> float.to_string(int.to_float(width) /. 1440.0)
                      <> ")",
                  ),
                  event.on("load", decode.success(loaded(site.name))),
                ])
            },
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
