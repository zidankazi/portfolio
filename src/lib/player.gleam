import gleam/dynamic/decode
import gleam/json
import gleam/option.{type Option, None, Some}
import lib/playback_progress

pub type Track {
  Track(
    title: String,
    artist: String,
    url: String,
    art: Option(String),
    playing: Bool,
    progress: Option(Int),
    duration: Option(Int),
  )
}

pub fn decode_track(body: String) -> Result(Option(Track), Nil) {
  let decoder = {
    use title <- decode.field("title", decode.optional(decode.string))
    case title {
      None -> decode.success(None)
      Some(title) -> {
        use artist <- decode.field("artist", decode.string)
        use url <- decode.field("url", decode.string)
        use art <- decode.field("albumArt", decode.optional(decode.string))
        use playing <- decode.field("isPlaying", decode.bool)
        use progress <- decode.field("progressMs", decode.optional(decode.int))
        use duration <- decode.field("durationMs", decode.optional(decode.int))
        decode.success(
          Some(Track(title, artist, url, art, playing, progress, duration)),
        )
      }
    }
  }
  case json.parse(body, decoder) {
    Ok(track) -> Ok(track)
    Error(_) -> Error(Nil)
  }
}

pub fn progress(
  track: Track,
  synced: Int,
  now: Int,
) -> playback_progress.Progress {
  playback_progress.calculate(
    track.playing,
    track.progress,
    track.duration,
    synced,
    now,
  )
}
