import data/art
import gleam/float
import gleam/int
import gleam/list
import gleam/string
import lustre/attribute as a
import lustre/element.{type Element, text}
import lustre/element/html as h
import ui/common as c

pub fn scene() -> Element(msg) {
  element.fragment([
    h.div(
      [
        a.attribute("aria-hidden", "true"),
        a.class(
          "pointer-events-none select-none puppet-scene absolute inset-x-0 top-0 -z-10",
        ),
      ],
      list.append(list.map([0, 1, 2, 3, 4, 5, 6, 7], thread), [
        c.div("puppet-hand-stage absolute inset-x-0 top-0", [
          hand("left", art.hand_left()),
          hand("right", art.hand_right()),
        ]),
      ]),
    ),
    svg_element(
      "svg",
      [
        a.attribute("data-puppet-front", ""),
        a.attribute("aria-hidden", "true"),
        a.attribute("focusable", "false"),
        a.attribute("height", "1"),
        a.class(
          "pointer-events-none absolute inset-x-0 top-0 z-10 w-full overflow-hidden",
        ),
      ],
      list.map([0, 1, 2, 3, 4, 5, 6, 7], fn(slot) {
        let id = "puppet-front-" <> int.to_string(slot)
        svg_element("g", [a.attribute("clip-path", "url(#" <> id <> ")")], [
          svg_element("defs", [], [
            svg_element(
              "clipPath",
              [a.id(id), a.attribute("clipPathUnits", "userSpaceOnUse")],
              [
                svg_element(
                  "rect",
                  [
                    a.attribute("width", "0"),
                    a.attribute("height", "0"),
                    a.attribute("rx", "20"),
                  ],
                  [],
                ),
              ],
            ),
          ]),
          svg_element(
            "text",
            [
              a.class("font-mono"),
              a.attribute("font-size", "6"),
              a.attribute("font-weight", "500"),
              a.attribute("fill", "#ce272d"),
              a.attribute("stroke", "#0a0a0a"),
              a.attribute("stroke-width", "1.2"),
              a.attribute("paint-order", "stroke"),
            ],
            [
              svg_element(
                "textPath",
                [a.href("#puppet-thread-" <> int.to_string(slot))],
                [],
              ),
            ],
          ),
        ])
      }),
    ),
  ])
}

fn thread(slot: Int) -> Element(msg) {
  let id = "puppet-thread-" <> int.to_string(slot)
  svg_element(
    "svg",
    [
      a.attribute("height", "100%"),
      a.class("puppet-threads absolute inset-x-0 top-0 w-full overflow-hidden"),
      a.attribute("focusable", "false"),
    ],
    [
      svg_element("defs", [], [svg_element("path", [a.id(id)], [])]),
      svg_element(
        "text",
        [
          a.class("font-mono"),
          a.attribute("font-size", "6"),
          a.attribute("font-weight", "500"),
          a.attribute("fill", "#ce272d"),
          a.attribute("stroke", "#ce272d"),
          a.attribute("stroke-width", "0.3"),
        ],
        [svg_element("textPath", [a.href("#" <> id)], [])],
      ),
      svg_element(
        "circle",
        [a.attribute("r", "0"), a.attribute("fill", "#ce272d")],
        [],
      ),
    ],
  )
}

fn hand(side: String, layers: art.Layers) -> Element(msg) {
  h.div(
    [
      a.attribute("data-puppet-hand", side),
      a.class("puppet-hand absolute -top-3 puppet-hand-" <> side),
      a.style("width", "var(--hand-size)"),
      a.style("height", "var(--hand-size)"),
      a.style("transform-origin", case side {
        "left" -> "32% 0%"
        _ -> "68% 0%"
      }),
    ],
    [
      svg_element(
        "svg",
        [
          a.class("absolute inset-0 h-full w-full overflow-visible"),
          a.attribute("viewBox", "0 0 240 240"),
          a.attribute("focusable", "false"),
        ],
        list.append(
          list.map(
            [
              #("detail", layers.detail, "text-zinc-500/25"),
              #("body", layers.body, "text-zinc-300/65"),
              #("highlights", layers.highlights, "text-zinc-100"),
            ],
            fn(layer) {
              svg_element(
                "text",
                [
                  a.attribute("data-hand-art", layer.0),
                  a.class("font-mono " <> layer.2),
                  a.attribute("fill", "currentColor"),
                  a.attribute("font-size", "4"),
                  a.attribute("text-anchor", "middle"),
                  a.style("white-space", "pre"),
                  a.style("font-kerning", "none"),
                  a.style("font-variant-ligatures", "none"),
                ],
                list.index_map(string.split(layer.1, "\n"), fn(line, row) {
                  svg_element(
                    "tspan",
                    [
                      a.attribute("x", columns(line)),
                      a.attribute(
                        "y",
                        float.to_string({ int.to_float(row) +. 0.8 } *. 4.0),
                      ),
                    ],
                    [text(line)],
                  )
                }),
              )
            },
          ),
          list.index_map(art.wraps(), fn(wrap, finger) {
            coil(side, wrap, finger)
          }),
        ),
      ),
    ],
  )
}

// Match the generator's 2.4-unit cells regardless of the font's glyph advances.
// Centering each letter also keeps the mirrored hands registered during swaps.
fn columns(line: String) -> String {
  line
  |> string.to_graphemes
  |> list.index_map(fn(_, column) {
    float.to_string(float.to_precision(int.to_float(column) *. 2.4 +. 1.2, 1))
  })
  |> string.join(" ")
}

fn n(value: Float) -> String {
  float.to_string(value)
}

fn point(x: Float, y: Float) -> String {
  n(x) <> "," <> n(y)
}

fn coil(side: String, wrap: art.Wrap, finger: Int) -> Element(msg) {
  let x = case side {
    "left" -> wrap.x
    _ -> 240.0 -. wrap.x
  }
  let paths =
    list.flat_map([-2.0, 2.0], fn(offset) {
      let y = wrap.y +. offset
      [
        #(
          True,
          "M"
            <> point(x -. wrap.rx, y -. 2.0)
            <> " C"
            <> point(x -. wrap.rx, y -. 2.0 -. wrap.ry *. 1.33)
            <> " "
            <> point(x +. wrap.rx, y -. wrap.ry *. 1.33)
            <> " "
            <> point(x +. wrap.rx, y),
        ),
        #(
          False,
          "M"
            <> point(x +. wrap.rx, y)
            <> " C"
            <> point(x +. wrap.rx, y +. wrap.ry *. 1.33)
            <> " "
            <> point(x -. wrap.rx, y +. 2.0 +. wrap.ry *. 1.33)
            <> " "
            <> point(x -. wrap.rx, y +. 2.0),
        ),
      ]
    })
    |> list.append([
      #(
        False,
        "M"
          <> point(x -. wrap.rx, wrap.y +. 4.0)
          <> " Q"
          <> point(x, wrap.y +. 4.0)
          <> " "
          <> point(x, wrap.tip_y),
      ),
    ])
  svg_element(
    "g",
    [
      a.attribute("data-finger-wrap", int.to_string(finger)),
      a.attribute("opacity", "0"),
    ],
    list.index_map(paths, fn(segment, index) {
      let id =
        "wrap-"
        <> side
        <> "-"
        <> int.to_string(finger)
        <> "-"
        <> int.to_string(index)
      svg_element("g", [], [
        svg_element("defs", [], [
          svg_element("path", [a.id(id), a.attribute("d", segment.1)], []),
          svg_element(
            "mask",
            [
              a.id(id <> "-reveal"),
              a.attribute("maskUnits", "userSpaceOnUse"),
              a.attribute("x", "0"),
              a.attribute("y", "0"),
              a.attribute("width", "240"),
              a.attribute("height", "240"),
            ],
            [
              svg_element(
                "path",
                [
                  a.attribute("data-wrap-reveal", ""),
                  a.attribute("d", segment.1),
                  a.attribute("pathLength", "1"),
                  a.attribute("fill", "none"),
                  a.attribute("stroke", "white"),
                  a.attribute("stroke-width", "14"),
                  a.attribute("stroke-dasharray", "1 1"),
                  a.attribute("stroke-dashoffset", "1"),
                ],
                [],
              ),
            ],
          ),
        ]),
        svg_element("g", [a.attribute("mask", "url(#" <> id <> "-reveal)")], [
          case segment.0 {
            True -> element.none()
            False ->
              svg_element(
                "use",
                [
                  a.href("#" <> id),
                  a.attribute("fill", "none"),
                  a.attribute("stroke", "#0a0a0a"),
                  a.attribute("stroke-width", "3"),
                ],
                [],
              )
          },
          svg_element(
            "text",
            [
              a.class("font-mono"),
              a.attribute("font-size", "6"),
              a.attribute("font-weight", "500"),
              a.attribute("fill", case segment.0 {
                True -> "#781114"
                False -> "#c51b20"
              }),
              a.attribute("stroke", case segment.0 {
                True -> "none"
                False -> "#c51b20"
              }),
              a.attribute("stroke-width", "0.25"),
            ],
            [
              svg_element("textPath", [a.href("#" <> id)], [
                text("------------"),
              ]),
            ],
          ),
        ]),
      ])
    }),
  )
}

pub fn rails() -> Element(msg) {
  element.fragment([
    rail("left", art.sigil_left()),
    rail("right", art.sigil_right()),
  ])
}

fn rail(side: String, layers: art.Layers) -> Element(msg) {
  h.div(
    [
      a.attribute("aria-hidden", "true"),
      a.attribute("data-sigil-side", side),
      a.class(
        "sigil-ink pointer-events-none select-none fixed inset-y-0 -z-10 overflow-hidden w-[48px] opacity-60 lg:opacity-100 lg:w-[234px] "
        <> case side {
          "left" -> "-left-4 lg:left-1"
          _ -> "-right-4 lg:right-1"
        },
      ),
      a.style(
        "mask-image",
        "linear-gradient(to bottom, transparent, black 14%, black 86%, transparent)",
      ),
    ],
    [
      c.div("sigil-pose absolute inset-0 lg:px-4", [
        c.div(
          "sigil-scroll relative",
          list.index_map(
            [
              #("detail", layers.detail, "text-zinc-400/[0.18]"),
              #("body", layers.body, "text-zinc-300/[0.36]"),
              #("highlights", layers.highlights, "text-zinc-200/[0.58]"),
            ],
            fn(layer, index) {
              h.div(
                [
                  a.attribute("data-sigil-depth", layer.0),
                  a.class(case index {
                    0 -> "relative"
                    _ -> "absolute inset-x-0 top-0"
                  }),
                ],
                list.map([0, 1], fn(_) {
                  h.pre(
                    [
                      a.class(
                        "font-mono text-[3px] lg:text-[6px] leading-none "
                        <> layer.2,
                      ),
                    ],
                    [text(layer.1)],
                  )
                }),
              )
            },
          ),
        ),
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
