import data/projects
import data/site
import gleam/int
import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/result
import lib/browser_event as browser
import lib/calendar as contributions
import lib/palette
import lib/playback_progress.{Finished}
import lib/player
import lib/preview_position as position
import lib/projects_state
import lustre
import lustre/attribute as a
import lustre/effect.{type Effect}
import lustre/element.{type Element}
import lustre/element/html as h
import ui/calendar
import ui/home
import ui/preview
import ui/studio

pub type Model {
  Model(
    studio_widths: List(#(String, Int)),
    studio_ready: List(String),
    path: String,
    track: Option(player.Track),
    colors: Option(#(palette.Rgb, palette.Rgb)),
    synced: Int,
    now: Int,
    last_poll: Int,
    ended: Bool,
    projects: projects_state.Model,
    calendar: calendar.Status,
    calendar_width: Int,
    focused_date: String,
    tooltip: Option(#(String, Float, Float)),
    preview: Option(projects.Project),
    placement: position.Placement,
    preview_visible: Bool,
    preview_waited: Bool,
    loaded: List(String),
    cue: Bool,
    stage: String,
    skip: Bool,
  )
}

pub type Message {
  StudioLoaded(name: String)
  StudioReady(name: String)
  Browser(body: String)
  Project(event: projects_state.Event)
  TrackReturned(result: Result(String, Nil))
  CalendarReturned(result: Result(String, Nil))
  RetryCalendar
  Scroll
  PreviewLoaded(title: String)
  PreviewShow(title: String)
  RefreshEnded
}

pub fn initial(path: String, wire: String, skip: Bool) -> Model {
  Model(
    studio_widths: [],
    studio_ready: [],
    path: path,
    track: result.unwrap(player.decode_track(wire), None),
    colors: None,
    synced: 0,
    now: 0,
    last_poll: 0,
    ended: False,
    projects: projects_state.init(),
    calendar: calendar.Loading,
    calendar_width: 444,
    focused_date: "",
    tooltip: None,
    preview: None,
    placement: position.Placement(0.0, 0.0, 280.0, 210.0),
    preview_visible: False,
    preview_waited: False,
    loaded: [],
    cue: False,
    stage: "ready",
    skip: skip,
  )
}

pub fn main() {
  let app = lustre.application(init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", Nil)
}

fn init(_flags: Nil) -> #(Model, Effect(Message)) {
  let model = initial(pathname(), initial_track(), skip_entrance())
  let stage = case model.path == "/" && !model.skip {
    True -> "dropping"
    False -> "ready"
  }
  let model = Model(..model, stage: stage, last_poll: clock())
  #(
    model,
    effect.batch([
      effect.after_paint(fn(dispatch, _) {
        listen(fn(body) { dispatch(Browser(body)) })
        mount_scene(model.path, model.skip, fn(body) { dispatch(Browser(body)) })
      }),
      fetch_track(),
      fetch_calendar(),
      extract_palette(model.track),
    ]),
  )
}

fn fetch_track() -> Effect(Message) {
  effect.from(fn(dispatch) {
    request_text("/api/spotify/now-playing", fn(result) {
      dispatch(TrackReturned(result))
    })
  })
}

fn fetch_calendar() -> Effect(Message) {
  effect.from(fn(dispatch) {
    request_text(
      "https://github-contributions-api.jogruber.de/v4/zidankazi?y=last",
      fn(result) { dispatch(CalendarReturned(result)) },
    )
  })
}

fn extract_palette(track: Option(player.Track)) -> Effect(Message) {
  case track {
    Some(player.Track(art: Some(src), ..)) ->
      effect.from(fn(dispatch) {
        extract_colors(src, fn(body) { dispatch(Browser(body)) })
      })
    _ -> effect.none()
  }
}

pub fn update(model: Model, message: Message) -> #(Model, Effect(Message)) {
  case message {
    StudioLoaded(name) -> #(
      model,
      effect.from(fn(dispatch) {
        delay(5000, fn() { dispatch(StudioReady(name)) })
      }),
    )
    StudioReady(name) -> #(
      Model(..model, studio_ready: [name, ..model.studio_ready]),
      effect.none(),
    )
    Browser(body) ->
      case browser.parse(body) {
        Ok(event) -> browser_update(model, event)
        Error(_) -> #(model, effect.none())
      }
    Project(event) -> #(
      Model(..model, projects: projects_state.update(model.projects, event)),
      effect.none(),
    )
    TrackReturned(Ok(body)) ->
      case player.decode_track(body) {
        Ok(track) -> {
          let changed = case model.track, track {
            Some(old), Some(next) -> old.art != next.art
            None, Some(_) -> True
            _, _ -> False
          }
          #(
            Model(
              ..model,
              track: track,
              synced: clock(),
              now: clock(),
              ended: False,
            ),
            case changed {
              True -> extract_palette(track)
              False -> effect.none()
            },
          )
        }
        Error(_) -> #(model, effect.none())
      }
    TrackReturned(Error(_)) -> #(model, effect.none())
    CalendarReturned(response) -> {
      let status = case response {
        Ok(body) ->
          case contributions.parse(body) {
            Ok(days) -> calendar.Loaded(days)
            Error(_) -> calendar.Failed
          }
        Error(_) -> calendar.Failed
      }
      #(
        Model(..model, calendar: status),
        effect.after_paint(fn(_, _) { measure_calendar() }),
      )
    }
    RetryCalendar -> #(
      Model(..model, calendar: calendar.Loading),
      fetch_calendar(),
    )
    Scroll -> #(model, effect.from(fn(_) { scroll_down() }))
    PreviewLoaded(title) -> {
      let loaded = case list.contains(model.loaded, title) {
        True -> model.loaded
        False -> [title, ..model.loaded]
      }
      let visible = case model.preview {
        Some(project) -> project.title == title && model.preview_waited
        _ -> False
      }
      #(
        Model(
          ..model,
          loaded: loaded,
          preview_visible: model.preview_visible || visible,
        ),
        effect.none(),
      )
    }
    PreviewShow(title) ->
      case model.preview {
        Some(project) if project.title == title -> #(
          Model(
            ..model,
            preview_waited: True,
            preview_visible: list.contains(model.loaded, title),
          ),
          effect.none(),
        )
        _ -> #(model, effect.none())
      }
    RefreshEnded -> #(model, fetch_track())
  }
}

fn browser_update(
  model: Model,
  event: browser.Event,
) -> #(Model, Effect(Message)) {
  case event {
    browser.StudioSize(name, width) -> {
      let widths = [
        #(name, width),
        ..list.filter(model.studio_widths, fn(item) { item.0 != name })
      ]
      let ready = case width {
        0 -> list.filter(model.studio_ready, fn(item) { item != name })
        _ -> model.studio_ready
      }
      #(
        Model(..model, studio_widths: widths, studio_ready: ready),
        effect.none(),
      )
    }
    browser.Tick(now) -> {
      let poll = now - model.last_poll >= 30_000
      let finished = case model.track {
        Some(track) ->
          case player.progress(track, model.synced, now) {
            Finished(..) -> True
            _ -> False
          }
        None -> False
      }
      let ended = finished && !model.ended
      let effects = [
        case poll {
          True -> fetch_track()
          False -> effect.none()
        },
        case ended {
          True ->
            effect.from(fn(dispatch) {
              delay(2000, fn() { dispatch(RefreshEnded) })
            })
          False -> effect.none()
        },
      ]
      #(
        Model(
          ..model,
          now: now,
          last_poll: case poll {
            True -> now
            False -> model.last_poll
          },
          ended: model.ended || ended,
        ),
        effect.batch(effects),
      )
    }
    browser.Poll -> #(Model(..model, last_poll: clock()), fetch_track())
    browser.Capability(hover) -> #(
      Model(
        ..model,
        projects: projects_state.update(
          model.projects,
          projects_state.HoverCapabilityChanged(hover),
        ),
        preview: None,
        preview_visible: False,
      ),
      effect.none(),
    )
    browser.Focus(inside) -> #(
      Model(
        ..model,
        projects: projects_state.update(model.projects, case inside {
          True -> projects_state.FocusEntered
          False -> projects_state.FocusLeft
        }),
      ),
      effect.none(),
    )
    browser.Size(width) -> #(
      Model(..model, calendar_width: width),
      effect.none(),
    )
    browser.Cue(visible) -> #(Model(..model, cue: visible), effect.none())
    browser.Stage(stage) -> #(Model(..model, stage: stage), effect.none())
    browser.Palette(src, r1, g1, b1, r2, g2, b2) ->
      case model.track {
        Some(player.Track(art: Some(art), ..)) if art == src -> #(
          Model(..model, colors: Some(#(#(r1, g1, b1), #(r2, g2, b2)))),
          effect.none(),
        )
        _ -> #(model, effect.none())
      }
    browser.Tooltip(label, date, x, y) -> #(
      Model(..model, focused_date: date, tooltip: Some(#(label, x, y))),
      effect.after_paint(fn(_, _) { clamp_tooltip() }),
    )
    browser.HideTooltip -> #(Model(..model, tooltip: None), effect.none())
    browser.Dismiss -> #(
      Model(
        ..model,
        preview: None,
        preview_visible: False,
        preview_waited: False,
      ),
      effect.none(),
    )
    browser.PreviewReady(title) -> update(model, PreviewLoaded(title))
    browser.Hover(title, x, y, left, right, width, height) ->
      case
        list.find(projects.projects(), fn(project) { project.title == title })
      {
        Error(_) -> #(model, effect.none())
        Ok(project) -> {
          let preferred = case project.preview_size {
            Some(size) ->
              position.Size(int.to_float(size.width), int.to_float(size.height))
            None -> position.default_size
          }
          let placement =
            position.place(
              position.Point(x, y),
              position.Bounds(left, right),
              position.Size(width, height),
              preferred,
            )
          let same = case model.preview {
            Some(current) -> current.title == title
            None -> False
          }
          let visible = !same && model.preview_visible
          let model =
            Model(
              ..model,
              preview: Some(project),
              placement: placement,
              preview_visible: case same {
                True -> model.preview_visible
                False -> visible && list.contains(model.loaded, title)
              },
              preview_waited: case same {
                True -> model.preview_waited
                False -> visible
              },
            )
          let fx = case same, project.preview {
            False, Some(src) ->
              effect.batch([
                effect.from(fn(dispatch) {
                  preload(src, fn() { dispatch(PreviewLoaded(title)) })
                }),
                case visible {
                  True -> effect.none()
                  False ->
                    effect.from(fn(dispatch) {
                      delay(240, fn() { dispatch(PreviewShow(title)) })
                    })
                },
              ])
            _, _ -> effect.none()
          }
          #(model, fx)
        }
      }
    browser.Navigate(path) -> {
      let model =
        Model(
          ..model,
          path: path,
          studio_widths: [],
          studio_ready: [],
          skip: True,
          stage: "ready",
          preview: None,
          preview_visible: False,
          tooltip: None,
        )
      #(
        model,
        effect.after_paint(fn(dispatch, _) {
          navigate(path)
          mount_scene(path, True, fn(body) { dispatch(Browser(body)) })
        }),
      )
    }
  }
}

pub fn view(model: Model) -> Element(Message) {
  element.fragment([
    case model.path {
      "/studio" ->
        studio.view(model.studio_widths, model.studio_ready, StudioLoaded)
      _ ->
        home.view(
          model.track,
          model.colors,
          model.synced,
          model.now,
          model.projects,
          Project,
          model.calendar,
          model.calendar_width,
          model.focused_date,
          RetryCalendar,
          model.cue,
          Scroll,
          model.stage,
          model.skip,
        )
    },
    preview.view(model.preview, model.placement, model.preview_visible),
    case model.tooltip {
      Some(#(label, x, y)) -> calendar.tooltip(label, x, y)
      None -> element.none()
    },
  ])
}

pub fn document(
  path: String,
  wire: String,
  script: String,
  stylesheet: String,
) -> String {
  let config = site.site()
  let title = case path {
    "/studio" -> "studio · zidan kazi"
    _ -> config.title
  }
  let description = case path {
    "/studio" -> "A few websites I have built: OMU, Relic, and Mille Works."
    _ -> config.description
  }
  element.to_document_string(
    h.html([a.lang("en"), a.class("h-full bg-[#0a0a0a]")], [
      h.head([], [
        h.meta([a.attribute("charset", "utf-8")]),
        h.meta([
          a.name("viewport"),
          a.attribute("content", "width=device-width, initial-scale=1"),
        ]),
        h.title([], title),
        h.meta([a.name("description"), a.attribute("content", description)]),
        h.link([a.rel("stylesheet"), a.href(stylesheet)]),
        h.link([a.rel("manifest"), a.href("/manifest.webmanifest")]),
        h.link([a.rel("icon"), a.href("/favicon.ico")]),
        h.link([a.rel("apple-touch-icon"), a.href(config.apple_icon)]),
        h.script([a.type_("module"), a.src(script)], ""),
      ]),
      h.body(
        [
          a.class(
            "font-body text-zinc-300 selection:bg-zinc-800 selection:text-white min-h-full antialiased",
          ),
        ],
        [
          h.div([a.id("app")], [view(initial(path, wire, True))]),
          h.div(
            [
              a.id("initial-track"),
              a.attribute("hidden", ""),
              a.attribute("data-track", wire),
            ],
            [],
          ),
        ],
      ),
    ]),
  )
}

@external(javascript, "./browser_ffi.mjs", "pathname")
fn pathname() -> String

@external(javascript, "./browser_ffi.mjs", "initial_track")
fn initial_track() -> String

@external(javascript, "./browser_ffi.mjs", "skip_entrance")
fn skip_entrance() -> Bool

@external(javascript, "./browser_ffi.mjs", "clock")
fn clock() -> Int

@external(javascript, "./browser_ffi.mjs", "listen")
fn listen(dispatch: fn(String) -> Nil) -> Nil

@external(javascript, "./browser_ffi.mjs", "mount_scene")
fn mount_scene(path: String, skip: Bool, dispatch: fn(String) -> Nil) -> Nil

@external(javascript, "./browser_ffi.mjs", "request_text")
fn request_text(url: String, callback: fn(Result(String, Nil)) -> Nil) -> Nil

@external(javascript, "./browser_ffi.mjs", "extract_colors")
fn extract_colors(src: String, dispatch: fn(String) -> Nil) -> Nil

@external(javascript, "./browser_ffi.mjs", "delay")
fn delay(ms: Int, callback: fn() -> Nil) -> Nil

@external(javascript, "./browser_ffi.mjs", "preload")
fn preload(src: String, callback: fn() -> Nil) -> Nil

@external(javascript, "./browser_ffi.mjs", "scroll_down")
fn scroll_down() -> Nil

@external(javascript, "./browser_ffi.mjs", "measure_calendar")
fn measure_calendar() -> Nil

@external(javascript, "./browser_ffi.mjs", "clamp_tooltip")
fn clamp_tooltip() -> Nil

@external(javascript, "./browser_ffi.mjs", "navigate")
fn navigate(path: String) -> Nil
