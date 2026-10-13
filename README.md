[zidankazi.com](https://www.zidankazi.com/)

The active portfolio is a TypeScript page, bundled with esbuild. Pretext
lays out plain text and links around a dragon that follows the cursor across
the entire viewport. Spotify appears as a sentence and GitHub activity retains
its contribution chart. There is no navigation, decorative heading, or visible
animation control; reduced motion follows the system preference. Movement is
time based, and cached artwork outlines keep the text close to the dragon.
Hovering links, keyboard focus, and text selection hold the layout still so
reading, clicking, and copying remain predictable. The page is server rendered, so its content and
links remain available without JavaScript.

`npm run dev` starts the site on port 3000. `npm run build` creates the Node
server and Vercel Build Output. `npm run check`, `npm run lint`, and `npm test`
check the active TypeScript app. To run the browser suite, start the server with
`npm run dev -- --port 3001`, then run `npm run test:e2e` (Google Chrome).

Spotify uses the existing `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, and
`SPOTIFY_REFRESH_TOKEN` server environment variables. No credentials are bundled
into the browser. GitHub contribution data is requested from the existing public
contributions endpoint.

The previous Gleam implementation remains in `src/` for reference, including its
hand animation and tests. It is no longer part of the development or production
build. `npm run test:gleam` still runs its unit tests separately.

The visual reference is
[Illustrated Manuscript](https://github.com/dengshu2/illustrated-manuscript).
Dragon credits and the upstream license are in
[`public/manuscript/NOTICE.txt`](public/manuscript/NOTICE.txt). Fonts are hosted
locally with their licenses in `public/fonts/`.
