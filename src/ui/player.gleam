import gleam/float
import gleam/int
import gleam/option.{type Option, None, Some}
import lib/palette
import lib/playback_progress.{Active, Finished, Unavailable}
import lib/player
import lustre/attribute as a
import lustre/element.{type Element, element, text}
import lustre/element/html as h
import ui/common as c

pub fn rgb(color: palette.Rgb) -> String {
  int.to_string(color.0)
  <> ","
  <> int.to_string(color.1)
  <> ","
  <> int.to_string(color.2)
}

pub fn view(
  track: Option(player.Track),
  colors: Option(#(palette.Rgb, palette.Rgb)),
  synced: Int,
  now: Int,
) -> Element(msg) {
  case track {
    None -> h.p([], [text("I listen to a lot of music.")])
    Some(track) -> {
      let accent = case colors {
        None -> "rgba(255,255,255,0.4)"
        Some(#(primary, _)) ->
          "rgba(" <> rgb(palette.brighten(primary, 225.0)) <> ",0.85)"
      }
      let bar = case colors {
        None -> "rgba(255,255,255,0.4)"
        Some(#(primary, secondary)) ->
          "linear-gradient(90deg,rgba("
          <> rgb(palette.brighten(primary, 225.0))
          <> ",0.9),rgba("
          <> rgb(palette.brighten(secondary, 225.0))
          <> ",0.9))"
      }
      let intro = case track.playing {
        True -> [
          text("I listen to a lot of music, and "),
          h.span(
            [
              a.class("text-white/60 transition-colors duration-1000"),
              a.style("color", accent),
            ],
            [text("right now")],
          ),
          text(" I'm listening to:"),
        ]
        False -> [
          text("I listen to a lot of music, and I "),
          h.span([a.class("text-white/60")], [text("last")]),
          text(" listened to:"),
        ]
      }
      c.div("", [
        h.p([a.class("mb-3")], intro),
        h.a(
          [
            a.href(track.url),
            a.target("_blank"),
            a.rel("noreferrer"),
            a.class(
              "group relative flex items-center gap-3 sm:gap-4 rounded-[14px] p-3 sm:p-4 overflow-hidden",
            ),
            a.style("background", "#0c0c0c"),
            a.style(
              "box-shadow",
              "inset 0 1px 0 rgba(255,255,255,0.05), 0 2px 8px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.3)",
            ),
            a.style("border", "1px solid rgba(255,255,255,0.07)"),
          ],
          [
            case colors {
              None -> element.none()
              Some(#(primary, secondary)) ->
                h.div(
                  [
                    a.class(
                      "pointer-events-none absolute -inset-[80%] z-0 blob-drift",
                    ),
                    a.style("filter", "blur(50px)"),
                    a.style(
                      "background",
                      "radial-gradient(ellipse at 20% 30%,rgba("
                        <> rgb(primary)
                        <> ",0.55),transparent 50%),radial-gradient(ellipse at 75% 50%,rgba("
                        <> rgb(secondary)
                        <> ",0.4),transparent 45%),radial-gradient(ellipse at 40% 85%,rgba("
                        <> rgb(primary)
                        <> ",0.2),transparent 50%)",
                    ),
                  ],
                  [],
                )
            },
            grain(
              "pointer-events-none absolute inset-0 z-10 opacity-50 mix-blend-overlay",
            ),
            c.div("relative shrink-0", [
              case track.art {
                Some(src) ->
                  c.div(
                    "relative w-12 h-12 rounded-lg overflow-hidden ring-1 ring-white/[0.06]",
                    [
                      c.image(
                        src,
                        track.title <> " album art",
                        "absolute inset-0 w-full h-full object-cover",
                      ),
                    ],
                  )
                None ->
                  c.div(
                    "w-12 h-12 rounded-lg bg-white/[0.04] flex items-center justify-center",
                    [text("♫")],
                  )
              },
            ]),
            c.div("min-w-0 flex-1 z-20", [
              h.p(
                [
                  a.class(
                    "text-zinc-100 font-medium text-[13px] tracking-[-0.01em] truncate group-hover:text-white transition-colors",
                  ),
                ],
                [text(track.title)],
              ),
              h.p(
                [
                  a.class(
                    "text-zinc-500 text-[12px] tracking-[0.01em] truncate mt-0.5",
                  ),
                ],
                [text(track.artist)],
              ),
              case player.progress(track, synced, now) {
                Unavailable -> element.none()
                Active(_, percent) | Finished(_, percent) ->
                  c.div(
                    "relative mt-2.5 h-[2px] bg-white/[0.08] overflow-hidden",
                    [
                      h.div(
                        [
                          a.attribute("data-playback-progress", ""),
                          a.class(
                            "absolute inset-y-0 left-0 transition-[width] duration-1000 ease-linear",
                          ),
                          a.style("width", float.to_string(percent) <> "%"),
                          a.style("background", bar),
                        ],
                        [],
                      ),
                    ],
                  )
              },
            ]),
            c.div("shrink-0 flex flex-col items-center gap-2.5 z-20", [
              spotify_icon(),
              case track.playing {
                False -> element.none()
                True ->
                  c.div("flex items-end gap-[2px] h-3", [
                    bar_view("0s", accent),
                    bar_view("0.15s", accent),
                    bar_view("0.3s", accent),
                    bar_view("0.1s", accent),
                  ])
              },
            ]),
          ],
        ),
      ])
    }
  }
}

fn bar_view(delay: String, color: String) -> Element(msg) {
  h.span(
    [
      a.class(
        "w-[2.5px] animate-[equalizer_1.2s_ease-in-out_infinite] transition-colors duration-1000",
      ),
      a.style("animation-delay", delay),
      a.style("height", "30%"),
      a.style("background-color", color),
    ],
    [],
  )
}

fn spotify_icon() -> Element(msg) {
  element(
    "svg",
    [
      a.class("w-5 h-5 text-white/25"),
      a.attribute("viewBox", "0 0 24 24"),
      a.attribute("fill", "currentColor"),
      a.attribute("aria-hidden", "true"),
    ],
    [
      element(
        "path",
        [
          a.attribute(
            "d",
            "M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z",
          ),
        ],
        [],
      ),
    ],
  )
}

pub fn grain(classes: String) -> Element(msg) {
  h.div(
    [
      a.class(classes),
      a.style(
        "background-image",
        "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.55' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      ),
      a.style("background-size", "256px 256px"),
    ],
    [],
  )
}

pub fn ambient(colors: Option(#(palette.Rgb, palette.Rgb))) -> Element(msg) {
  let wash = case colors {
    None -> element.none()
    Some(#(primary, secondary)) -> {
      let saturation =
        float.max(
          palette.saturation_of(primary),
          palette.saturation_of(secondary),
        )
      let strength = float.clamp({ saturation -. 0.12 } /. 0.25, 0.0, 1.0)
      let primary = rgb(palette.tame(primary))
      let secondary = rgb(palette.tame(secondary))
      h.div(
        [
          a.class("absolute -inset-[18%] ambient-drift"),
          a.style(
            "background",
            "radial-gradient(ellipse 55% 42% at 14% -6%,rgba("
              <> primary
              <> ","
              <> float.to_string(0.16 *. strength)
              <> "),transparent 68%),radial-gradient(ellipse 50% 40% at 104% 24%,rgba("
              <> secondary
              <> ","
              <> float.to_string(0.12 *. strength)
              <> "),transparent 66%),radial-gradient(ellipse 60% 45% at 42% 112%,rgba("
              <> primary
              <> ","
              <> float.to_string(0.09 *. strength)
              <> "),transparent 70%)",
          ),
        ],
        [],
      )
    }
  }
  h.div(
    [
      a.attribute("aria-hidden", "true"),
      a.class("pointer-events-none fixed inset-0 -z-10 overflow-hidden"),
    ],
    [wash, grain("absolute inset-0 opacity-[0.045]")],
  )
}
