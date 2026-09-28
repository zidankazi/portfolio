import gleam/option.{type Option}

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
