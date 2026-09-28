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

/// Always resolves to a Result, including network failures and timeouts.
@external(javascript, "./spotify_ffi.mjs", "request")
fn request(
  method: String,
  url: String,
  headers: Array(#(String, String)),
  body: String,
) -> Promise(Result(#(Int, String), Nil))

/// Create this once on the server, using the three SPOTIFY_* environment values.
/// Creating a new client on every request would throw away its caches.
pub fn new_client(
  client_id: String,
  client_secret: String,
  refresh_token: String,
) -> Client {
  Client(
    client_id: client_id,
    client_secret: client_secret,
    refresh_token: refresh_token,
    cache: new_cell(Cache(token: None, recent: None, last_good: None)),
  )
}

/// A decoder is a recipe for checking untrusted JSON and building a typed value.
/// "use" passes the remaining code as a callback; each field must decode first.
fn track_decoder() -> Decoder(Track) {
  use title <- decode.field("name", decode.string)
  use artists <- decode.field(
    "artists",
    decode.list(decode.at(["name"], decode.string)),
  )
  use images <- decode.subfield(
    ["album", "images"],
    decode.list(decode.at(["url"], decode.string)),
  )
  use url <- decode.subfield(["external_urls", "spotify"], decode.string)
  use duration <- decode.optional_field(
    "duration_ms",
    None,
    decode.optional(decode.int),
  )
  let artwork = case images {
    [first, ..] -> Some(first)
    [] -> None
  }
  decode.success(Track(
    title,
    string.join(artists, ", "),
    url,
    artwork,
    duration,
  ))
}

/// An item can be null when Spotify has no supported track to report.
/// An episode or malformed track fails decoding instead of becoming a fake Track.
pub fn decode_current(body: String) -> Result(Playback, ApiError) {
  let decoder = {
    use item <- decode.field("item", decode.optional(track_decoder()))
    case item {
      None -> decode.success(NothingPlaying)
      Some(track) -> {
        use playing <- decode.field("is_playing", decode.bool)
        use progress <- decode.optional_field(
          "progress_ms",
          None,
          decode.optional(decode.int),
        )
        decode.success(case playing {
          True -> Playing(track, progress)
          False -> Paused(track, progress)
        })
      }
    }
  }
  json.parse(body, decoder)
  |> result.map_error(fn(_) { InvalidResponse })
}
