import data/projects
import gleam/float
import gleam/option.{type Option, None, Some}
import lib/preview_position
import lustre/attribute as a
import lustre/element.{type Element}
import lustre/element/html as h
import ui/common as c

pub fn view(
  project: Option(projects.Project),
  position: preview_position.Placement,
  visible: Bool,
) -> Element(msg) {
  case project {
    None -> element.none()
    Some(project) -> {
      let poster = case project.preview {
        Some(src) ->
          c.image(src, "", "absolute inset-0 w-full h-full object-contain")
        None -> element.none()
      }
      let motion = case visible, project.preview_motion {
        True, Some(projects.Video(src)) ->
          h.video(
            [
              a.src(src),
              a.attribute("loop", ""),
              a.attribute("muted", ""),
              a.attribute("playsinline", ""),
              a.attribute("preload", "auto"),
              a.class(
                "preview-motion absolute inset-0 h-full w-full bg-[#101012] object-contain",
              ),
            ],
            [],
          )
        True, Some(projects.Gif(src)) ->
          c.image(
            src,
            "",
            "preview-motion absolute inset-0 h-full w-full bg-[#101012] object-contain",
          )
        _, _ -> element.none()
      }
      h.div(
        [
          a.attribute("aria-hidden", "true"),
          a.attribute("data-project-hover-preview", ""),
          a.attribute("data-active-project", case visible {
            True -> project.title
            False -> ""
          }),
          a.class(
            "project-hover-preview pointer-events-none fixed left-0 top-0 z-50",
          ),
          a.style(
            "transform",
            "translate3d("
              <> float.to_string(position.left)
              <> "px,"
              <> float.to_string(position.top)
              <> "px,0)",
          ),
          a.style("width", float.to_string(position.width) <> "px"),
          a.style("height", float.to_string(position.height) <> "px"),
          a.style("opacity", case visible {
            True -> "1"
            False -> "0"
          }),
        ],
        [
          c.div(
            "relative h-full w-full overflow-hidden rounded-xl border border-white/10 bg-[#101012] shadow-[0_12px_40px_rgba(0,0,0,0.4)]",
            [poster, motion],
          ),
        ],
      )
    }
  }
}
