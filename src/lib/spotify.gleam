//// A server-side Spotify client, compiled to JavaScript.
//// Read the types first, then the decoders, then get_track at the bottom.
//// Keep one Client per server process so its token and track caches are reused.

import gleam/bit_array
import gleam/dynamic/decode.{type Decoder}
import gleam/int
import gleam/javascript/array.{type Array}
import gleam/javascript/promise.{type Promise}
import gleam/json
import gleam/option.{type Option, None, Some}
import gleam/result
import gleam/string
import gleam/uri

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
  // The last known track, shown after an API failure. It may no longer be playing.
  Cached(track: Track)
}

pub type ApiError {
  MissingCredentials
  NetworkError
  HttpError(status: Int)
  InvalidResponse
}

type Token {
  Token(value: String, expires_at: Int)
}

type Cache {
  Cache(
    token: Option(Token),
    recent: Option(#(Track, Int)),
    last_good: Option(Track),
  )
}

// An external type: its tiny JavaScript implementation holds a mutable value.
type Cell(value)

pub opaque type Client {
  Client(
    client_id: String,
    client_secret: String,
    refresh_token: String,
    cache: Cell(Cache),
  )
}

// read playback state
pub fn playback_label(playback: Playback) -> String {
  case playback {
    NothingPlaying -> "nothing playing"
    Playing(_, _) -> "playing"
    Paused(_, _) -> "paused"
    RecentlyPlayed(_) -> "recently played"
    Cached(_) -> "last known track"
  }
}

// get track title
pub fn track_title(playback: Playback) -> Option(String) {
  case playback {
    NothingPlaying -> None
    Playing(track, _) -> Some(track.title)
    Paused(track, _) -> Some(track.title)
    RecentlyPlayed(track) -> Some(track.title)
    Cached(track) -> Some(track.title)
  }
}

/// FFI means "foreign function interface": the body lives in spotify_ffi.mjs.
@external(javascript, "./spotify_ffi.mjs", "new_cell")
fn new_cell(value: a) -> Cell(a)

@external(javascript, "./spotify_ffi.mjs", "read_cell")
fn read_cell(cell: Cell(a)) -> a

@external(javascript, "./spotify_ffi.mjs", "write_cell")
fn write_cell(cell: Cell(a), value: a) -> Nil

@external(javascript, "./spotify_ffi.mjs", "now_ms")
fn now_ms() -> Int
