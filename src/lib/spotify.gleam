import gleam/option.{type Option, None, Some}

pub type Track {
  Track(
    title: String,
    artist: String,
    url: String,
    album_art: Option(String),
    duration_ms: Option(Int),
  )
}

pub type Playback {
  NothingPlaying
  Playing(track: Track, progress_ms: Option(Int))
  Paused(track: Track, progress_ms: Option(Int))
  RecentlyPlayed(track: Track)
}

// read playback state
pub fn playback_label(playback: Playback) -> String {
  case playback {
    NothingPlaying -> "nothing playing"
    Playing(_, _) -> "playing"
    Paused(_, _) -> "paused"
    RecentlyPlayed(_) -> "recently played"
  }
}
