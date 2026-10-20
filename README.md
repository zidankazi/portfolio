[zidankazi.com](https://www.zidankazi.com/)

The reading column is warm frosted glass over Botticelli's *The Story of Nastagio
degli Onesti, panel II* (public domain; source in `public/manuscript/NOTICE.txt`).
The native TypeScript section ticker is inspired by
[Rare UI's proximity sidebar](https://www.rareui.com/components/proximitysidebar).
Its 25 ticks map equal portions of the page, with labels for content landmarks.
It supports keyboard navigation and reduced motion,
and stays out of the narrow-screen layout. No React or animation dependency is needed.

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

The live GitHub contribution chart sits directly beneath the song inside the
intro glass, with native tooltips, keyboard navigation, and horizontal scrolling
on phones. A saved graph appears immediately on return visits while fresh data
loads; first visits use a static grid skeleton. Failed refreshes retain the saved
data, and unchanged responses keep the existing grid. Nearby dots yield a few
pixels to the dragon and spring back; flame hits warm only those dots into flat,
flickering ember colors that quickly cool back to their original greens. Hover,
focus, and touch keep the grid still, and reduced motion disables both effects.
The card grows when needed to keep it visible without shrinking the
intro text. Projects and contact links sit below in ordinary server-rendered HTML. Project hover and keyboard focus
show the original screenshots and demo clips beside the list when there is
room. Clips pause when dismissed; reduced motion uses the still posters.
Phone links keep their ordinary tap behavior. No canvas or preview covers
their hit areas. The opening dragon keeps its full-size cursor following, idle wings, and fire.
On wide screens, the same dragon keeps roaming and following the cursor as
projects arrive. The parts behind the rounded project glass appear blurred
and faint; parts outside it stay sharp. There is no landing, scripted dive,
or fade away. Fire shares the same glass treatment. Scrolling back retains the
same live chain, scale, and joint spacing. Project text, links, selection, and
hover previews remain native and keep their positions. Narrow screens let the
dragon scroll away with the intro. Reduced motion keeps the illustration static
and disables cursor following and fire.


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

The first HTML response includes the biography, project descriptions, semantic
headings, and ProfilePage structured data. `/robots.txt` allows crawling and
points to `/sitemap.xml`. A head alternate link advertises `/profile`, a plain
HTML version generated from the same biography and projects for readers that
skip canvas or visually hidden text. It uses the homepage as its canonical URL.

Spotify uses `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, and
`SPOTIFY_REFRESH_TOKEN` server environment variables. GitHub contributions use
the existing public endpoint. Credentials never enter the browser bundle.

The previous Gleam implementation remains in `src/` for reference and is not part
of the current build. `npm run test:gleam` runs its unit tests separately.
