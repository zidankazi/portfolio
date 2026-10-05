import data/site
import gleam/javascript/promise.{type Promise}
import lib/spotify
import portfolio

pub type Response {
  Response(
    status: Int,
    content_type: String,
    cache_control: String,
    body: String,
  )
}

pub fn response(
  path: String,
  client: spotify.Client,
  script: String,
  stylesheet: String,
) -> Promise(Response) {
  case path {
    "/api/spotify" | "/api/spotify/now-playing" -> {
      use body <- promise.map(spotify.get_track_json(client))
      Response(200, "application/json; charset=utf-8", "no-store", body)
    }
    "/manifest.webmanifest" ->
      promise.resolve(Response(
        200,
        "application/manifest+json",
        "public, max-age=3600",
        site.manifest_json(),
      ))
    "/" -> {
      use track <- promise.map(spotify.get_track_json(client))
      Response(
        200,
        "text/html; charset=utf-8",
        "no-store",
        portfolio.document(path, track, script, stylesheet),
      )
    }
    "/studio" ->
      promise.resolve(Response(
        200,
        "text/html; charset=utf-8",
        "no-store",
        portfolio.document(path, "{\"title\":null}", script, stylesheet),
      ))
    _ ->
      promise.resolve(Response(
        404,
        "text/html; charset=utf-8",
        "no-store",
        "<!doctype html><html lang=\"en\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>not found · zidan kazi</title><body style=\"background:#0a0a0a;color:#d4d4d4;font:16px sans-serif;padding:3rem\"><h1>Page not found</h1><a href=\"/\" style=\"color:inherit\">back to the conversation</a></body></html>",
      ))
  }
}
