import gleam/list
import lustre/attribute as a
import lustre/element.{type Element, text}
import lustre/element/html as h

pub fn div(classes: String, children: List(Element(msg))) -> Element(msg) {
  h.div([a.class(classes)], children)
}

pub fn image(src: String, alt: String, classes: String) -> Element(msg) {
  let src = case src {
    "/avatar.jpeg" -> "/avatar-small.webp"
    _ -> src
  }
  h.img([
    a.src(src),
    a.alt(alt),
    a.class(classes),
    a.attribute("decoding", "async"),
  ])
}

pub fn avatar() -> Element(msg) {
  div("shrink-0 w-6 sm:w-8 flex justify-center", [
    div(
      "relative w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden shrink-0 mt-1",
      [
        image(
          "/avatar.jpeg",
          "Zidan Kazi",
          "absolute inset-0 w-full h-full object-cover",
        ),
      ],
    ),
  ])
}

pub fn bubble(
  children: List(Element(msg)),
  compact: Bool,
  anchor: String,
) -> Element(msg) {
  let width = case compact {
    True -> "w-fit"
    False -> "w-full"
  }
  div("flex gap-2 sm:gap-3 items-start group w-full", [
    avatar(),
    h.div(
      [
        a.attribute("data-puppet-anchor", anchor),
        a.class(
          "min-w-0 bg-[#161618] text-[#d4d4d4] rounded-[20px] rounded-tl-sm px-4 py-3 text-[14px] leading-[1.6] border border-white/5 shadow-sm "
          <> width,
        ),
      ],
      children,
    ),
  ])
}

pub fn external(
  href: String,
  classes: String,
  children: List(Element(msg)),
) -> Element(msg) {
  h.a(
    [a.href(href), a.target("_blank"), a.rel("noreferrer"), a.class(classes)],
    children,
  )
}

pub fn icon(name: String, classes: String) -> Element(msg) {
  let paths = case name {
    "arrow" -> ["M7 17 17 7", "M7 7h10v10"]
    "back" -> ["M9 14 4 9l5-5", "M4 9h10a6 6 0 0 1 0 12"]
    "chevron" -> ["m6 9 6 6 6-6"]
    "mail" -> [
      "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
      "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7",
    ]
    "twitter" -> [
      "M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z",
    ]
    "github" -> [
      "M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4",
      "M9 18c-4.51 2-5-2-7-2",
    ]
    _ -> []
  }
  svg_element(
    "svg",
    [
      a.class(classes),
      a.attribute("viewBox", "0 0 24 24"),
      a.attribute("fill", "none"),
      a.attribute("stroke", "currentColor"),
      a.attribute("stroke-width", "1.75"),
      a.attribute("stroke-linecap", "round"),
      a.attribute("stroke-linejoin", "round"),
      a.attribute("aria-hidden", "true"),
    ],
    {
      list.map(paths, fn(path) {
        svg_element("path", [a.attribute("d", path)], [])
      })
    },
  )
}

pub fn pill(href: String, label: String, icon_name: String) -> Element(msg) {
  external(
    href,
    "flex min-w-0 max-w-full min-h-11 sm:min-h-0 items-center gap-2 bg-[#1C1C1E] hover:bg-[#2C2C2E] border border-white/5 hover:border-white/10 text-zinc-300 transition-colors text-[14px] px-4 py-2 rounded-[22px] sm:rounded-full w-fit",
    [
      h.span([a.class("min-w-0 break-words")], [text(label)]),
      h.span([a.class("shrink-0 text-zinc-500")], [
        icon(icon_name, "w-3.5 h-3.5"),
      ]),
    ],
  )
}

fn svg_element(
  tag: String,
  attrs: List(a.Attribute(msg)),
  children: List(Element(msg)),
) -> Element(msg) {
  element.namespaced("http://www.w3.org/2000/svg", tag, attrs, children)
}
