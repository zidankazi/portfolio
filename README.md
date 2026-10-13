[zidankazi.com](https://www.zidankazi.com/)

The portfolio is TypeScript, bundled with esbuild. The top section adapts the
canvas renderer from [Illustrated Manuscript](https://github.com/dengshu2/illustrated-manuscript):
its illuminated initial, articulated dragon, idle wings, sustained fire,
and Pretext exclusions. Its bio uses a prominent name, readable paragraphs,
separate hobby lines, and a live song title with an artist caption. Official game
icons and Spotify cover art flow inline with their text through Pretext. The
canvas fits the viewport, with typography measured when the screen or song
changes. Type stays stable while the dragon moves. The scene pauses when it
leaves the viewport. Hold the pointer to breathe fire; touch can still scroll
the page. After interaction it settles at the last pointer position, including
after tab switches. Reduced motion keeps the illustration static.

The name, Spotify sentence, projects, links, and GitHub contribution chart sit
below the manuscript in ordinary server-rendered HTML. They use normal browser
layout and selection; no canvas or animated text covers their hit areas. The
studio page uses the same plain portfolio typography without the manuscript.

The manuscript uses Furia III from the live reference, with IM Fell English
for capital I only to distinguish it from J. The local font file comes from the demo’s `/furia-iii.ttf` asset. Furia is a commercial font
with separate licensing; confirm the site’s webfont license before publishing.
It is not covered by the reference’s ISC license. Portfolio text retains
IM Fell English. Source and artwork credits are in `public/manuscript/NOTICE.txt`;
font notices are in `public/fonts/`.

`npm run dev` starts the site on port 3000. `npm run build` creates the Node server
and Vercel Build Output. `npm run check`, `npm run lint`, and `npm test` check the
active app. For browser tests, start `npm run dev -- --port 3001`, then run
`npm run test:e2e` (Google Chrome).

Spotify uses `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, and
`SPOTIFY_REFRESH_TOKEN` server environment variables. GitHub contributions use
the existing public endpoint. Credentials never enter the browser bundle.

The previous Gleam implementation remains in `src/` for reference and is not part
of the current build. `npm run test:gleam` runs its unit tests separately.
