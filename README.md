[zidankazi.com](https://www.zidankazi.com/)

The portfolio is TypeScript, bundled with esbuild. The top section adapts the
canvas renderer from [Illustrated Manuscript](https://github.com/dengshu2/illustrated-manuscript):
its story, illuminated initial, articulated dragon, idle wings, sustained fire,
and Pretext exclusions. The canvas is contained in that section and pauses when
it leaves the viewport. Hold the pointer to breathe fire; touch can still scroll
the page. Reduced motion keeps the illustration static.

The name, Spotify sentence, projects, links, and GitHub contribution chart sit
below the manuscript in ordinary server-rendered HTML. They use normal browser
layout and selection; no canvas or animated text covers their hit areas. The
studio page uses the same plain portfolio typography without the manuscript.

The live reference uses Furia, which is excluded from its public repository.
The manuscript uses locally hosted Pirata One blackletter under the SIL Open Font
License. Portfolio text retains IM Fell English. Source and artwork credits are
in `public/manuscript/NOTICE.txt`; font licenses are in `public/fonts/`.

`npm run dev` starts the site on port 3000. `npm run build` creates the Node server
and Vercel Build Output. `npm run check`, `npm run lint`, and `npm test` check the
active app. For browser tests, start `npm run dev -- --port 3001`, then run
`npm run test:e2e` (Google Chrome).

Spotify uses `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, and
`SPOTIFY_REFRESH_TOKEN` server environment variables. GitHub contributions use
the existing public endpoint. Credentials never enter the browser bundle.

The previous Gleam implementation remains in `src/` for reference and is not part
of the current build. `npm run test:gleam` runs its unit tests separately.
