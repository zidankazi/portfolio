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

test("rejects malformed JSON, invalid fields, and unsupported episode items", () => {
  const bodies = [
    "{",
    "{}",
    JSON.stringify({ item: track, is_playing: "yes" }),
    JSON.stringify({ item: { ...track, name: 42 }, is_playing: true }),
    JSON.stringify({ item: { ...track, duration_ms: "180000" }, is_playing: true }),
    JSON.stringify({ item: { name: "Podcast", type: "episode" }, is_playing: true }),
  ];
  for (const body of bodies) {
    const result = spotify.decode_current(body);
    assert.equal(result.isOk(), false);
    assert.ok(result[0] instanceof spotify.InvalidResponse);
  }
});

test("decodes null current playback, empty history, and recent tracks", () => {
  const empty = spotify.decode_current('{"item":null}');
  assert.ok(empty.isOk());
  assert.ok(empty[0] instanceof spotify.NothingPlaying);
  assert.ok(spotify.track_title(empty[0]) instanceof None);
  assert.ok(spotify.decode_recent('{"items":[]}')[0] instanceof spotify.NothingPlaying);
  const recent = spotify.decode_recent(JSON.stringify(recentReply.json));
  assert.ok(recent.isOk());
  assert.ok(recent[0] instanceof spotify.RecentlyPlayed);
  assert.equal(recent[0].track.title, track.name);
  assert.equal(spotify.decode_recent('{"items":[{"track":null}]}').isOk(), false);
});

test("fetches playback and reuses a token with correctly encoded credentials", async (t) => {
  const calls = mockSpotify(t, [tokenReply, playingReply, playingReply]);
  const client = spotify.new_client("client", "secret", "refresh&+= value");
  assert.ok(await spotify.get_track(client) instanceof spotify.Playing);
  assert.ok(await spotify.get_track(client) instanceof spotify.Playing);
  assert.equal(calls.length, 3);
  assert.equal(calls[0].url, "https://accounts.spotify.com/api/token");
  assert.equal(calls[0].method, "POST");
  assert.equal(calls[0].headers.Authorization, "Basic " + Buffer.from("client:secret").toString("base64"));
  assert.equal(new URLSearchParams(calls[0].body).get("refresh_token"), "refresh&+= value");
  assert.equal(new URLSearchParams(calls[0].body).get("grant_type"), "refresh_token");
  assert.equal(calls[1].headers.Authorization, "Bearer test-token");
  assert.equal(calls[1].body, undefined);
  assert.equal(calls[1].cache, "no-store");
  assert.ok(calls[1].signal instanceof AbortSignal);
});

test("uses recent history for 204 responses and expires its cache after one minute", async (t) => {
  let now = 100_000;
  t.mock.method(Date, "now", () => now);
  const calls = mockSpotify(t, [
    tokenReply, { status: 204 }, recentReply,
    { status: 204 },
    { status: 204 }, recentReply,
  ]);
  const client = spotify.new_client("client", "secret", "refresh");
  assert.ok(await spotify.get_track(client) instanceof spotify.RecentlyPlayed);
  now += 59_999;
  assert.ok(await spotify.get_track(client) instanceof spotify.RecentlyPlayed);
  assert.equal(calls.length, 4);
  now += 1;
  assert.ok(await spotify.get_track(client) instanceof spotify.RecentlyPlayed);
  assert.equal(calls.length, 6);
});

test("refreshes the access token one minute before expiry", async (t) => {
  let now = 100_000;
  t.mock.method(Date, "now", () => now);
  const calls = mockSpotify(t, [tokenReply, playingReply, playingReply, tokenReply, playingReply]);
  const client = spotify.new_client("client", "secret", "refresh");
  await spotify.get_track(client);
  now += 3_539_999;
  await spotify.get_track(client);
  assert.equal(calls.length, 3);
  now += 1;
  await spotify.get_track(client);
  assert.equal(calls.length, 5);
});
