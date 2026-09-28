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
