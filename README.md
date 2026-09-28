[zidankazi.com](https://www.zidankazi.com/)

## Learning Gleam through Spotify

The site uses `src/lib/spotify.gleam` for Spotify decoding, API requests, and
caching. The small `src/lib/spotify.server.ts` adapter creates the server-side
client and parses its JSON for React. Both Spotify API routes use that adapter.
The old TypeScript implementation has been removed. `src/types/spotify.ts`
describes the plain JSON consumed by the card; `src/data/projects.ts` is left
for the next exercise.

With Node.js 22 or newer, run:

```sh
npm run check:gleam
npm run test:gleam
npm run dev
```

The tests use synthetic Spotify responses and a mocked clock and fetch. They
do not need environment variables or make network requests. Gleam downloads its
dependencies on the first build. `build/` is generated and ignored by Git,
TypeScript, and Vercel uploads; `manifest.toml` locks the Gleam dependencies.

`npm run dev` and `npm run build` compile Gleam before starting Next.js. The
compiler wrapper uses Gleam 1.18.1 if installed, or downloads that pinned official
release into `node_modules/.cache/gleam` and verifies its SHA-256 digest. Downloads
support macOS and Linux on x64 and arm64, including Vercel's Linux build hosts.
Other platforms require Gleam 1.18.1 on PATH. No Erlang runtime is needed for
this JavaScript target. A clean build needs network access to GitHub and Hex.

When editing `.gleam` during a running development session, run
`npm run build:gleam` again. Next.js picks up the changed JavaScript output.
Generated TypeScript declarations keep the server adapter checked against Gleam.

Read `spotify.gleam` in this order:

1. `Track` and `Playback`: track metadata and mutually exclusive playback states.
   `Cached` means the last known track, without claiming it is still playing.
2. `playback_label` and `track_title`: pattern matching and `Option`.
3. `track_decoder`, `decode_current`, and `decode_recent`: convert untrusted JSON
   into typed values. `Result` distinguishes a valid empty response from bad data.
4. `get_track`, then its helpers: token refresh, requests, and cache fallbacks.

`use value <- function(...)` passes the rest of the function as a callback.
With `result.try`, that callback runs only on success. With `promise.await`, it
runs when the asynchronous request resolves and returns another promise.
`promise.map` transforms a resolved value without returning another promise.

`spotify_ffi.mjs` is the small JavaScript bridge for `fetch`, `Date.now`, and
mutable cache storage. All JSON decoding and cache decisions live in Gleam.
`Cache(..cache, token: ...)` constructs an updated cache record; the bridge stores
that new record for the next poll. `pub opaque type Client` lets callers pass a
client around without constructing or accessing its fields from Gleam.

For server-side JavaScript interop after `gleam build`:

```js
import { new_client, get_track, playback_label }
  from "./build/dev/javascript/portfolio/lib/spotify.mjs";

// Keep this client at module scope so subsequent calls reuse its caches.
const client = new_client(
  process.env.SPOTIFY_CLIENT_ID ?? "",
  process.env.SPOTIFY_CLIENT_SECRET ?? "",
  process.env.SPOTIFY_REFRESH_TOKEN ?? "",
);

const playback = await get_track(client);
console.log(playback_label(playback));
```

Load the environment values in the calling server or with Node's
`--env-file=.env.local` option. Never import this credential-bearing client into
browser code or log the client itself. The bridge imposes a ten-second timeout
per request and converts rejected requests into `Result` errors.

Tokens refresh a minute before expiry; successful recent history is cached for
one minute. A 401 clears the access token for the next poll. Errors fall back to
`Cached` or `NothingPlaying`, without exposing response bodies or old progress.
Caches are local to each client/process and do not deduplicate concurrent calls.
Unsupported item shapes, such as podcast episodes, fall back to recent history.

`playback_json` encodes the existing API shape, converting `Option` values to JSON
nulls and keeping Gleam class instances out of React props. `get_track_json` is
the entry point used by the server-only Next.js adapter. The browser imports only
the plain `Track` type, never the credential-bearing client or its runtime.
