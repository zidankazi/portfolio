import assert from "node:assert/strict";
import test from "node:test";
import * as spotify from "../build/dev/javascript/portfolio/lib/spotify.mjs";
import { None, Some } from "../build/dev/javascript/gleam_stdlib/gleam/option.mjs";

// Synthetic Spotify responses; these tests never use credentials or the network.
const track = {
  name: "Example song",
  artists: [{ name: "First artist" }, { name: "Second artist" }],
  album: { images: [{ url: "https://example.com/large.jpg" }] },
  external_urls: { spotify: "https://open.spotify.com/track/example" },
  duration_ms: 180_000,
};
const tokenReply = { json: { access_token: "test-token", expires_in: 3600 } };
const playingReply = {
  json: { item: track, is_playing: true, progress_ms: 0 },
};
const recentReply = { json: { items: [{ track }] } };

function mockSpotify(t, replies) {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, ...options });
    const reply = replies.shift();
    assert.ok(reply, "Unexpected extra Spotify request");
    if (reply instanceof Error) throw reply;
    const body = reply.status === 204
      ? null
      : reply.body ?? JSON.stringify(reply.json);
    return new Response(body, { status: reply.status ?? 200 });
  });
  t.after(() => assert.equal(replies.length, 0, "Expected requests did not run"));
  return calls;
}

test("decodes a playing track, artist names, artwork, and zero progress", () => {
  const result = spotify.decode_current(JSON.stringify(playingReply.json));
  assert.ok(result.isOk());
  const playback = result[0];
  assert.ok(playback instanceof spotify.Playing);
  assert.equal(playback.track.title, track.name);
  assert.equal(playback.track.artist, "First artist, Second artist");
  assert.equal(playback.track.album_art[0], track.album.images[0].url);
  assert.equal(playback.track.duration_ms[0], 180_000);
  assert.equal(playback.progress_ms[0], 0);
  assert.equal(spotify.track_title(playback)[0], track.name);
});

test("decodes paused playback with missing or null optional fields", () => {
  for (const missing of [undefined, null]) {
    const result = spotify.decode_current(JSON.stringify({
      item: { ...track, album: { images: [] }, duration_ms: missing },
      is_playing: false,
      progress_ms: missing,
    }));
    assert.ok(result.isOk());
    assert.ok(result[0] instanceof spotify.Paused);
    assert.ok(result[0].track.album_art instanceof None);
    assert.ok(result[0].track.duration_ms instanceof None);
    assert.ok(result[0].progress_ms instanceof None);
  }
});
