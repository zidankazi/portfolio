import gleam/dynamic/decode
import gleam/json

pub type Event {
  StudioSize(name: String, width: Int)
  Tick(now: Int)
  Poll
  Capability(hover: Bool)
  Focus(inside: Bool)
  Hover(
    title: String,
    x: Float,
    y: Float,
    left: Float,
    right: Float,
    width: Float,
    height: Float,
  )
  Dismiss
  PreviewReady(title: String)
  Size(width: Int)
  Tooltip(label: String, date: String, x: Float, y: Float)
  HideTooltip
  Navigate(path: String)
  Stage(stage: String)
  Cue(visible: Bool)
  Palette(src: String, r1: Int, g1: Int, b1: Int, r2: Int, g2: Int, b2: Int)
}

pub fn parse(body: String) -> Result(Event, Nil) {
  let decoder = {
    use kind <- decode.field("kind", decode.string)
    case kind {
      "studio-size" -> {
        use name <- decode.field("name", decode.string)
        use width <- decode.field("width", decode.int)
        decode.success(StudioSize(name, width))
      }
      "tick" -> {
        use now <- decode.field("now", decode.int)
        decode.success(Tick(now))
      }
      "poll" -> decode.success(Poll)
      "capability" -> {
        use hover <- decode.field("hover", decode.bool)
        decode.success(Capability(hover))
      }
      "focus" -> {
        use inside <- decode.field("inside", decode.bool)
        decode.success(Focus(inside))
      }
      "hover" -> {
        use title <- decode.field("title", decode.string)
        use x <- decode.field("x", decode.float)
        use y <- decode.field("y", decode.float)
        use left <- decode.field("left", decode.float)
        use right <- decode.field("right", decode.float)
        use width <- decode.field("width", decode.float)
        use height <- decode.field("height", decode.float)
        decode.success(Hover(title, x, y, left, right, width, height))
      }
      "dismiss" -> decode.success(Dismiss)
      "preview-ready" -> {
        use title <- decode.field("title", decode.string)
        decode.success(PreviewReady(title))
      }
      "size" -> {
        use width <- decode.field("width", decode.int)
        decode.success(Size(width))
      }
      "tooltip" -> {
        use label <- decode.field("label", decode.string)
        use date <- decode.field("date", decode.string)
        use x <- decode.field("x", decode.float)
        use y <- decode.field("y", decode.float)
        decode.success(Tooltip(label, date, x, y))
      }
      "hide-tooltip" -> decode.success(HideTooltip)
      "navigate" -> {
        use path <- decode.field("path", decode.string)
        decode.success(Navigate(path))
      }
      "stage" -> {
        use stage <- decode.field("stage", decode.string)
        decode.success(Stage(stage))
      }
      "cue" -> {
        use visible <- decode.field("visible", decode.bool)
        decode.success(Cue(visible))
      }
      "palette" -> {
        use src <- decode.field("src", decode.string)
        use r1 <- decode.field("r1", decode.int)
        use g1 <- decode.field("g1", decode.int)
        use b1 <- decode.field("b1", decode.int)
        use r2 <- decode.field("r2", decode.int)
        use g2 <- decode.field("g2", decode.int)
        use b2 <- decode.field("b2", decode.int)
        decode.success(Palette(src, r1, g1, b1, r2, g2, b2))
      }
      _ -> decode.failure(Dismiss, "browser event")
    }
  }
  case json.parse(body, decoder) {
    Ok(event) -> Ok(event)
    Error(_) -> Error(Nil)
  }
}
