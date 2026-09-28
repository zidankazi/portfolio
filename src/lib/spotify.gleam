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

/// The endpoint is requested with limit=1. An empty history is a valid response.
pub fn decode_recent(body: String) -> Result(Playback, ApiError) {
  let decoder =
    decode.at(["items"], decode.list(decode.at(["track"], track_decoder())))
  use tracks <- result.try(
    json.parse(body, decoder)
    |> result.map_error(fn(_) { InvalidResponse }),
  )
  Ok(case tracks {
    [track, ..] -> RecentlyPlayed(track)
    [] -> NothingPlaying
  })
}

/// Refresh a minute before expiry. Short-lived tokens are usable for this request
/// but are not reused. No token value is ever included in an error.
fn decode_token(body: String, now: Int) -> Result(Token, ApiError) {
  let decoder = {
    use value <- decode.field("access_token", decode.string)
    use seconds <- decode.optional_field("expires_in", 3600, decode.int)
    decode.success(#(value, seconds))
  }
  use decoded <- result.try(
    json.parse(body, decoder)
    |> result.map_error(fn(_) { InvalidResponse }),
  )
  let #(value, seconds) = decoded
  case value == "" || seconds <= 0 {
    True -> Error(InvalidResponse)
    False -> Ok(Token(value, now + int.max(seconds - 60, 0) * 1000))
  }
}

/// Exchanges the refresh token for a short-lived access token.
/// Both HTTP failures and invalid JSON become explicit Result errors.
fn refresh_access_token(client: Client) -> Promise(Result(String, ApiError)) {
  let authorization =
    client.client_id
    <> ":"
    <> client.client_secret
    |> bit_array.from_string
    |> bit_array.base64_encode(True)
  let headers =
    array.from_list([
      #("Content-Type", "application/x-www-form-urlencoded"),
      #("Authorization", "Basic " <> authorization),
    ])
  let body =
    uri.query_to_string([
      #("grant_type", "refresh_token"),
      #("refresh_token", client.refresh_token),
    ])
  use response <- promise.map(request(
    "POST",
    "https://accounts.spotify.com/api/token",
    headers,
    body,
  ))
  case response {
    Error(_) -> Error(NetworkError)
    Ok(#(status, _)) if status < 200 || status >= 300 -> Error(HttpError(status))
    Ok(#(_, body)) -> {
      use token <- result.try(decode_token(body, now_ms()))
      let cache = read_cell(client.cache)
      write_cell(client.cache, Cache(..cache, token: Some(token)))
      Ok(token.value)
    }
  }
}

fn get_access_token(client: Client) -> Promise(Result(String, ApiError)) {
  let now = now_ms()
  let cache = read_cell(client.cache)
  case
    client.client_id == ""
    || client.client_secret == ""
    || client.refresh_token == ""
  {
    True -> promise.resolve(Error(MissingCredentials))
    False ->
      case cache.token {
        Some(token) if now < token.expires_at -> promise.resolve(Ok(token.value))
        _ -> refresh_access_token(client)
      }
  }
}

/// Transport is shared; the caller supplies the decoder for each endpoint.
/// HTTP 204 means no content, so there is no JSON body to parse.
fn fetch_playback(
  url: String,
  token: String,
  decode_body: fn(String) -> Result(Playback, ApiError),
) -> Promise(Result(Playback, ApiError)) {
  let headers = array.from_list([#("Authorization", "Bearer " <> token)])
  use response <- promise.map(request("GET", url, headers, ""))
  case response {
    Error(_) -> Error(NetworkError)
    Ok(#(200, body)) -> decode_body(body)
    Ok(#(204, _)) -> Ok(NothingPlaying)
    Ok(#(status, _)) -> Error(HttpError(status))
  }
}
