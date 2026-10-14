[zidankazi.com](https://www.zidankazi.com/)

The portfolio is TypeScript, bundled with esbuild. The top section adapts the
canvas renderer from [Illustrated Manuscript](https://github.com/dengshu2/illustrated-manuscript):
its illuminated initial, articulated dragon, idle wings, sustained fire,
and Pretext exclusions. Its bio uses a prominent name, readable paragraphs,
separate hobby lines, and a compact music group with cover art beside the status,
song, and artist. Company names have an inline accent; named game phrases stay
together. Official game icons and the whole music group flow through Pretext. The
canvas fits the viewport, with typography measured when the screen or song
changes. Type stays stable while the dragon moves. The scene pauses when it
leaves the viewport. Hold the pointer to breathe fire; touch can still scroll
the page. After interaction it settles at the last pointer position, including
after tab switches. Reduced motion keeps the illustration static.

Projects, the GitHub contribution chart, and contact links sit below the
manuscript in ordinary server-rendered HTML. Project hover and keyboard focus
show the original screenshots and demo clips beside the list when there is
room. Clips pause when dismissed; reduced motion uses the still posters.
Phone links keep their ordinary tap behavior. No canvas or preview covers
their hit areas. One persistent dragon follows the scroll from the manuscript,
shrinking and moving its existing pose into the left margin beside projects.
It stays full-size through the early scroll and starts shrinking when projects
reach the lower screen. Position, rotation, and size ease toward the scroll
target together. The joints keep their spacing throughout growth. The larger
dragon travels with the page and stays above the projects heading until its
whole body fits in the gutter.
Reverse scrolling grows it into its live cursor-following pose without resetting
its position. In the margin it still looks and follows, with its whole body
constrained to the left gutter. It stays
clear of the list and right-side previews; narrow screens keep it in the hero.
Reduced motion keeps the wings still; hidden scenes do not run animation frames.
Clicks and holds also breathe fire beside projects, using the same particles
and natural fade as the intro. Flames can cross the text, while project layout,
selection, GitHub links, and hover previews remain native.

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
